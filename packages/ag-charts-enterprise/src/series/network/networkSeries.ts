import { type AgCollapsedChangeEventSource, _ModuleSupport } from 'ag-charts-community';
import {
    type BoxBounds,
    type ChartAnimationPhase,
    type ChartAxisDirection,
    ChartUpdateType,
    type DynamicContext,
    Logger,
    type Point,
    Vertex,
} from 'ag-charts-core';

import { NetworkGraph } from './networkGraph';
import type { NetworkLayout, NetworkLayoutUpdateOptions } from './networkLayout';
import { NetworkLinkNode } from './networkLinkNode';
import { NetworkSeriesProperties } from './networkSeriesProperties';
import type { NetworkLinkInterpolation, NetworkSeriesVertexID } from './networkTypes';

export interface NetworkDatum<NetworkVertex, TNetworkEdge> extends _ModuleSupport.SeriesNodeDatum {
    vertex: Vertex<NetworkVertex, TNetworkEdge>;
}

export interface NetworkSeriesOptions {}

export interface NetworkSeriesContextNodeData<NetworkVertex, TNetworkEdge> extends _ModuleSupport.SeriesNodeDataContext<
    NetworkDatum<NetworkVertex, TNetworkEdge>
> {
    linkData: NetworkLinkDatum<NetworkVertex, TNetworkEdge>[];

    // labelData is unused.
    labelData: any;
}

export interface NetworkLinkDatum<NetworkVertex, TNetworkEdge> {
    from: Vertex<NetworkVertex, TNetworkEdge>;
    to: Vertex<NetworkVertex, TNetworkEdge>;
}

/**
 * A Network Series processes data into a graph structure and presents the nodes in a network layout.
 */
export abstract class AbstractNetworkSeries<
    TVertex,
    TEdge,
    TGraph extends NetworkGraph<TVertex, TEdge>,
    TNode extends _ModuleSupport.TranslatableGroup<TDatum>,
    TDatum extends NetworkDatum<TVertex, TEdge>,
    TLinkDatum extends NetworkLinkDatum<TVertex, TEdge>,
    TLayout extends NetworkLayout<TVertex, TEdge>,
> extends _ModuleSupport.Series<
    NetworkDatum<TVertex, TEdge>,
    NetworkSeriesOptions,
    NetworkSeriesProperties,
    TDatum,
    NetworkSeriesContextNodeData<TVertex, TEdge>
> {
    override properties = new NetworkSeriesProperties();

    protected dataModel?: _ModuleSupport.DataModel<any, any, any>;
    protected processedData?: _ModuleSupport.ProcessedData<any>;

    protected readonly graph: TGraph;
    protected readonly layout: TLayout;

    // Zoom scale + translate are applied to this group; `dataNodeGroup` and `linkGroup` ride along.
    protected readonly viewportGroup = this.contentGroup.appendChild(
        new (_ModuleSupport.Scalable(_ModuleSupport.TranslatableGroup))({ name: `${this.id}-viewport` })
    );

    protected readonly dataNodeGroup = this.viewportGroup.appendChild(
        new _ModuleSupport.TranslatableGroup({ name: `${this.id}-series-dataNodes`, zIndex: 2 })
    );

    protected readonly linkGroup = this.viewportGroup.appendChild(
        new _ModuleSupport.TranslatableGroup({ name: `${this.id}-series-links`, zIndex: 1 })
    );

    protected readonly datumSelection = _ModuleSupport.Selection.selectNoInference<TDatum, TNode>(
        this.dataNodeGroup,
        () => this.nodeFactory()
    );

    protected readonly linkSelection = _ModuleSupport.Selection.selectNoInference<
        NetworkLinkDatum<TVertex, TEdge>,
        NetworkLinkNode<NetworkLinkDatum<TVertex, TEdge>>
    >(this.linkGroup, () => this.linkFactory());

    protected contextNodeData?: NetworkSeriesContextNodeData<TVertex, TEdge>;
    protected vertexDatumIndex: Record<string, number> = {};

    private pendingCollapsedIds?: string[];

    protected seriesRect?: _ModuleSupport.BBox;

    private pendingPanToItemId?: string;

    constructor(ctx: DynamicContext<_ModuleSupport.ChartRegistry>) {
        super({
            moduleCtx: ctx,
            pickModes: [_ModuleSupport.SeriesNodePickMode.EXACT_SHAPE_MATCH],
            // Clip stops viewportGroup overflow into title/footnote during zoom/pan.
            alwaysClip: true,
            supportsStandaloneZoom: true,
        });

        this.graph = this.createNetworkGraph();
        this.layout = this.createNetworkLayout();

        this.cleanup.register(
            this.ctx.collapsedManager.setSeriesGetDatumCallback(this.id, this.getDatumById.bind(this))
        );

        this.cleanup.register(
            ctx.eventsHub.on('layout:complete', (event) => {
                this.seriesRect = event.series.rect;
            })
        );

        this.cleanup.register(
            ctx.eventsHub.on('collapsed:restore', ({ collapsed }) => {
                if (!collapsed) return;
                if (this.graph.getVertexCount() === 0) {
                    this.pendingCollapsedIds = collapsed;
                }
            })
        );

        // `active:load-memento` only fires for state-restore / programmatic setState (not hover).
        this.cleanup.register(
            ctx.eventsHub.on('active:load-memento', ({ activeItem }) => {
                if (activeItem?.seriesId !== this.id) return;
                this.pendingPanToItemId = String(activeItem.itemId);
            })
        );

        // Runs on every activeItem change incl. hover — opens collapsed ancestors.
        this.cleanup.register(
            ctx.chartState.observe((get) => {
                const activeItem = get('activeItem');
                if (activeItem?.seriesId === this.id) {
                    this.expandNetworkToItem(activeItem.itemId, 'api-call');
                }
            })
        );

        // Zoom is a transform-only update — no re-layout. We don't read the zoom value here
        // (applyViewportTransform pulls it from chartState), so the event is sufficient and
        // avoids ReactiveState's initial-fire on subscribe.
        this.cleanup.register(
            ctx.eventsHub.on('zoom:change-complete', () => {
                this.applyViewportTransform();
                ctx.eventsHub.emit('chart:request-update', { type: ChartUpdateType.SCENE_RENDER });
            })
        );

        this.cleanup.register(
            ctx.eventsHub.on('series-area:click', (event) => {
                const { type, clickedNode, target } = event;
                if (
                    type !== 'click' ||
                    clickedNode?.series !== this ||
                    clickedNode.itemId == null ||
                    !this.hasBuiltinListener(target)
                ) {
                    return;
                }
                if (this.ctx.collapsedManager.isCollapsed(clickedNode.itemId)) {
                    this.expandItem(clickedNode.itemId, 'user-interaction');
                } else {
                    this.collapseItem(clickedNode.itemId, 'user-interaction');
                }
            }),
            ctx.eventsHub.on('series:keynav-expand', (event) => {
                if (event.itemId == null || event.series !== this) return;
                this.expandItem(event.itemId, 'user-interaction');
                this.ctx.eventsHub.emit('chart:request-update', { type: ChartUpdateType.PERFORM_LAYOUT });
            }),
            ctx.eventsHub.on('series:keynav-collapse', (event) => {
                if (event.itemId == null || event.series !== this) return;
                this.collapseItem(event.itemId, 'user-interaction');
                this.ctx.eventsHub.emit('chart:request-update', { type: ChartUpdateType.PERFORM_LAYOUT });
            })
        );
    }

    abstract createNetworkGraph(): TGraph;
    abstract createNetworkLayout(): TLayout;
    abstract nodeFactory(): TNode;

    abstract updateDatumSelection(nodeData: TDatum[], datumSelection: _ModuleSupport.Selection<TDatum, TNode>): void;
    abstract updateDatumNodes(datumSelection: _ModuleSupport.Selection<TDatum, TNode>): void;
    abstract updateLinkNodes(
        linkSelection: _ModuleSupport.Selection<
            NetworkLinkDatum<TVertex, TEdge>,
            NetworkLinkNode<NetworkLinkDatum<TVertex, TEdge>>
        >
    ): void;

    abstract getRootVertices(): Vertex<TVertex, TEdge>[];
    abstract getLinkInterpolation(from: Vertex<TVertex, TEdge>, to: Vertex<TVertex, TEdge>): NetworkLinkInterpolation;
    abstract getFocusedVertex(): Vertex<TVertex, TEdge> | undefined;
    abstract getDefaultFocusedVertices(): Vertex<TVertex, TEdge>[] | undefined;
    abstract positionDatumNode(
        node: TNode,
        groupBBox: _ModuleSupport.BBox,
        regularBBox?: _ModuleSupport.BBox
    ): _ModuleSupport.BBox | undefined;
    abstract updateOffset(offset: Point): void;

    abstract expandNetworkToItem(itemId: NetworkSeriesVertexID, source: AgCollapsedChangeEventSource): void;
    abstract expandItem(itemId: NetworkSeriesVertexID, source: AgCollapsedChangeEventSource): void;
    abstract collapseItem(itemId: NetworkSeriesVertexID, source: AgCollapsedChangeEventSource): void;

    dataCount() {
        return this.datumSelection.length;
    }

    override update(_opts: { seriesRect?: _ModuleSupport.BBox }) {
        // TODO: this.contentGroup.batchedUpdate() ?
        this.updateSelections();
        this.updateNodes();
        // Re-apply now that contentBBox is current (the zoom observer early-returned earlier).
        this.applyViewportTransform();
        this.maybePanToItem();
    }

    // FIXME(AG-17179 follow-up): mirror y because `calcPanToBBoxRatios` is y-down and we
    // render y-up. Remove once the helper is direction-aware.
    override mapFocusBBoxToPanTarget(seriesRect: BoxBounds, focusBBox: Readonly<_ModuleSupport.BBox>): BoxBounds {
        return {
            x: focusBBox.x,
            y: 2 * seriesRect.y + seriesRect.height - focusBBox.y - focusBBox.height,
            width: focusBBox.width,
            height: focusBBox.height,
        };
    }

    processPendingCollapse() {
        if (this.pendingCollapsedIds) {
            this.ctx.collapsedManager.collapse(this.pendingCollapsedIds, this.id, 'api-call');
            this.pendingCollapsedIds = undefined;
        }
    }

    protected expand(ids: NetworkSeriesVertexID[], source: AgCollapsedChangeEventSource) {
        const changed = this.ctx.collapsedManager.expand(ids, this.id, source);
        if (changed) {
            this.markNodeDataDirty();
        }
    }

    protected makeLayoutUpdateOptions(): NetworkLayoutUpdateOptions<TVertex, TEdge> {
        return {
            height: this.seriesRect?.height ?? 0,
            width: this.seriesRect?.width ?? 0,
            graph: this.graph,
            vertices: this.getRootVertices(),
            getFocusedVertex: this.getFocusedVertex.bind(this),
            getDefaultFocusedVertices: this.getDefaultFocusedVertices.bind(this),
            getDatumNodeBBox: this.getDatumNodeBBox.bind(this),
            getLinkInterpolation: this.getLinkInterpolation.bind(this),
            layoutDatumNode: this.layoutDatumNode.bind(this),
            layoutLinkNode: this.layoutLinkNode.bind(this),
            updateOffset: this.updateOffset.bind(this),
        };
    }

    /** Bbox used for layout-sizing; subclasses can override to exclude decorations. */
    protected measureDatumNode(node: TNode): _ModuleSupport.BBox | undefined {
        return node.getBBox();
    }

    protected getDatumById(id: NetworkSeriesVertexID) {
        return this.datumSelection.at(this.vertexDatumIndex[id])?.datum?.datum;
    }

    private linkFactory(): NetworkLinkNode<NetworkLinkDatum<TVertex, TEdge>> {
        return new NetworkLinkNode();
    }

    private updateSelections() {
        // Without the gate, per-vertex datum objects are re-allocated on every update; that
        // tricks HighlightManager's `a.datum === b.datum` check into a spurious change → loop.
        if (!this.nodeDataRefresh) return;
        this.nodeDataRefresh = false;

        this.contextNodeData = this.createNodeData();
        if (!this.contextNodeData) return;

        this.updateDatumSelection(this.contextNodeData.nodeData as TDatum[], this.datumSelection);
        this.updateLinkSelection(this.contextNodeData.linkData as TLinkDatum[], this.linkSelection);
    }

    private updateLinkSelection(
        linkData: TLinkDatum[],
        linkSelection: _ModuleSupport.Selection<
            NetworkLinkDatum<TVertex, TEdge>,
            NetworkLinkNode<NetworkLinkDatum<TVertex, TEdge>>
        >
    ) {
        linkSelection.update(linkData);
    }

    private updateNodes() {
        this.updateDatumNodes(this.datumSelection);
        this.updateLinkNodes(this.linkSelection);
        this.layout.update(this.makeLayoutUpdateOptions());
    }

    private getDatumNodeBBox(vertex: Vertex<TVertex, TEdge>) {
        const nodeDatumIndex = this.vertexDatumIndex[vertex.value as string];
        if (typeof nodeDatumIndex !== 'number') return;

        const node = this.datumSelection.at(nodeDatumIndex);
        if (!node) return;

        return this.measureDatumNode(node);
    }

    private layoutDatumNode(
        vertex: Vertex<TVertex, TEdge>,
        groupBBox: _ModuleSupport.BBox,
        regularBBox?: _ModuleSupport.BBox
    ) {
        const nodeDatumIndex = this.vertexDatumIndex[vertex.value as string];
        if (typeof nodeDatumIndex !== 'number') return;

        const node = this.datumSelection.at(nodeDatumIndex);
        if (!node) return;

        return this.positionDatumNode(node, groupBBox, regularBBox);
    }

    private layoutLinkNode(vertex: Vertex<TVertex, TEdge>, drawLink: (path: _ModuleSupport.ExtendedPath2D) => void) {
        const nodeDatumIndex = this.vertexDatumIndex[vertex.value as string];
        if (typeof nodeDatumIndex !== 'number') return;

        const link = this.linkSelection.at(nodeDatumIndex);
        if (!link) return;

        const path = link.getPath();
        if (!path) return;

        drawLink(path.path);
        path.visible = true;
    }

    private maybePanToItem() {
        const { pendingPanToItemId, seriesRect } = this;
        if (!pendingPanToItemId || !seriesRect) return;

        // Clear unconditionally — never retry on failure.
        this.pendingPanToItemId = undefined;

        const nodeDatumIndex = this.vertexDatumIndex[pendingPanToItemId];
        if (typeof nodeDatumIndex !== 'number') return;

        const node = this.datumSelection.at(nodeDatumIndex);
        if (!node) return;

        const canvasBBox = _ModuleSupport.Transformable.toCanvas(node);
        if (!canvasBBox?.isFinite()) return;

        // Centre-based check — bbox-based would jitter for nodes near the boundary.
        const cx = canvasBBox.x + canvasBBox.width / 2;
        const cy = canvasBBox.y + canvasBBox.height / 2;
        if (seriesRect.containsPoint(cx, cy)) return;

        const { zoomManager } = this.ctx;
        if (!zoomManager) return;

        const panSuccess = zoomManager.panToBBox(seriesRect, this.mapFocusBBoxToPanTarget(seriesRect, canvasBBox));
        if (!panSuccess) {
            Logger.warnOnce(`${this.id}: panToBBox failed — chart may be too small.`);
        }
    }

    // Y is mirrored (`1 − yMax`) because Zoom publishes y-up ratios but we render y-down.
    // `seriesRect.x/y` lives on `seriesRoot`, not here. The `s ≤ 1` cap preserves fit
    // semantics for small content; subtracting the dataNodeGroup offset cancels the
    // layout's auto-centre so this transform owns final placement.
    private applyViewportTransform() {
        const zoom = this.ctx.chartState.getValue('zoom');
        const { seriesRect } = this;
        const contentBBox = this.layout.contentBBox;

        if (!seriesRect || !contentBBox || contentBBox.width <= 0 || contentBBox.height <= 0) {
            this.viewportGroup.translationX = 0;
            this.viewportGroup.translationY = 0;
            this.viewportGroup.scalingX = 1;
            this.viewportGroup.scalingY = 1;
            return;
        }

        const vw = seriesRect.width;
        const vh = seriesRect.height;
        const cw = contentBBox.width;
        const ch = contentBBox.height;

        const xMin = zoom?.x?.min ?? 0;
        const xMax = zoom?.x?.max ?? 1;
        const yMin = zoom?.y?.min ?? 0;
        const yMax = zoom?.y?.max ?? 1;

        const xRange = xMax - xMin;
        const yRange = yMax - yMin;

        const fitX = vw / cw;
        const fitY = vh / ch;
        const sX = xRange > 0 ? fitX / xRange : fitX;
        const sY = yRange > 0 ? fitY / yRange : fitY;
        const s = Math.min(sX, sY, 1);

        const centerX = Math.max(0, (vw - cw * s) / 2);
        const centerY = Math.max(0, (vh - ch * s) / 2);

        const offsetX = this.dataNodeGroup.translationX;
        const offsetY = this.dataNodeGroup.translationY;
        const screenTopFractionY = 1 - yMax;

        this.viewportGroup.scalingX = s;
        this.viewportGroup.scalingY = s;
        this.viewportGroup.translationX = -(contentBBox.x + xMin * cw + offsetX) * s + centerX;
        this.viewportGroup.translationY = -(contentBBox.y + screenTopFractionY * ch + offsetY) * s + centerY;
    }

    // ---
    // UNUSED METHODS

    getCategoryValue(_datumIndex: _ModuleSupport.DatumIndex): any {
        return;
    }

    datumIndexForCategoryValue(_categoryValue: any): _ModuleSupport.DatumIndex | undefined {
        return;
    }

    getLegendData(_legendType: _ModuleSupport.ChartLegendType): _ModuleSupport.CategoryLegendDatum[] {
        return [];
    }

    resetAnimation(_chartAnimationPhase: ChartAnimationPhase) {
        // Does not reset any animations.
    }

    getSeriesDomain(_direction: ChartAxisDirection) {
        return { domain: [] };
    }

    getSeriesRange(_direction: ChartAxisDirection, _visibleRange: [number, number]): [number, number] {
        return [Number.NaN, Number.NaN];
    }
}
