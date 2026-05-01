import { _ModuleSupport } from 'ag-charts-community';
import {
    type ChartAnimationPhase,
    type ChartAxisDirection,
    ChartUpdateType,
    type DynamicContext,
    type Point,
    Property,
    Vertex,
} from 'ag-charts-core';

import { NetworkGraph } from './networkGraph';
import type { NetworkLayout, NetworkLayoutUpdateOptions } from './networkLayout';
import { NetworkLinkNode } from './networkLinkNode';
import type { NetworkLinkInterpolation } from './networkTypes';

export type NetworkSeriesDatumIndex = number;

export interface NetworkDatum<NetworkVertex, TNetworkEdge>
    extends _ModuleSupport.SeriesNodeDatum<NetworkSeriesDatumIndex> {
    vertex: Vertex<NetworkVertex, TNetworkEdge>;
}

export interface NetworkSeriesOptions {}

export class NetworkSeriesProperties extends _ModuleSupport.SeriesProperties<object> {
    @Property
    readonly tooltip = _ModuleSupport.makeSeriesTooltip<any>();
}

export interface NetworkSeriesContextNodeData<NetworkVertex, TNetworkEdge>
    extends _ModuleSupport.SeriesNodeDataContext<NetworkSeriesDatumIndex, NetworkDatum<NetworkVertex, TNetworkEdge>> {
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
    NetworkSeriesDatumIndex,
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

    // Single ancestor group for all content. Zoom transforms (scale + translate) are applied
    // here so that picking, animations, and clipping all work in the correct coordinate space.
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

    private height?: number;
    private width?: number;
    private startDragOffset: Point = { x: 0, y: 0 };
    private dragOffset: Point = { x: 0, y: 0 };

    constructor(ctx: DynamicContext<_ModuleSupport.ChartRegistry>) {
        super({
            moduleCtx: ctx,
            pickModes: [_ModuleSupport.SeriesNodePickMode.EXACT_SHAPE_MATCH],
            // Network series support drag-to-pan, so content can extend past the series-area
            // bounds. Clipping prevents nodes/links overflowing into title/subtitle/footnote.
            alwaysClip: true,
        });

        this.graph = this.createNetworkGraph();
        this.layout = this.createNetworkLayout();

        ctx.eventsHub.on('layout:complete', (event) => {
            this.height = event.series.rect.height;
            this.width = event.series.rect.width;
        });

        ctx.eventsHub.on('collapsed:restore', ({ collapsed }) => {
            if (!collapsed) return;
            if (this.graph.getVertexCount() === 0) {
                this.pendingCollapsedIds = collapsed;
            }
        });

        ctx.chartState.observe((get) => {
            const activeItem = get('activeItem');
            if (activeItem?.seriesId === this.id) {
                this.expandNetworkToItem(activeItem.itemId);
            }
        });

        // Push-based zoom subscription. When zoom state changes, recompute the viewportGroup
        // transform and request a SCENE_RENDER (no re-layout needed). At fit state {0..1, 0..1}
        // the transform is identity — output is pixel-identical to today's auto-centre.
        this.cleanup.register(
            ctx.chartState.observe((get) => {
                get('zoom');
                this.applyViewportTransform();
                ctx.eventsHub.emit('chart:request-update', { type: ChartUpdateType.SCENE_RENDER });
            })
        );

        ctx.eventsHub.on('series-area:click', ({ type, clickedNode, sourceEvent }) => {
            if (type !== 'click' || clickedNode?.series !== this || clickedNode.itemId == null) return;
            const point = {
                x: 'layerX' in sourceEvent ? sourceEvent.layerX : Number.NaN,
                y: 'layerY' in sourceEvent ? sourceEvent.layerY : Number.NaN,
            };
            if (this.ctx.collapsedManager.isCollapsed(clickedNode.itemId)) {
                this.expandItem(clickedNode.itemId, point);
            } else {
                this.collapseItem(clickedNode.itemId, point);
            }
        });

        if (ctx.widgets.seriesDragInterpreter) {
            this.cleanup.register(
                ctx.widgets.seriesDragInterpreter.events.on('drag-move', (event) => this.onSeriesAreaDragMove(event)),
                ctx.widgets.seriesDragInterpreter.events.on('drag-end', () => this.onSeriesAreaDragEnd())
            );
        }
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
    abstract positionDatumNode(node: TNode, groupBBox: _ModuleSupport.BBox, regularBBox?: _ModuleSupport.BBox): void;
    abstract updateOffset(offset: Point): void;

    abstract expandNetworkToItem(itemIdOrIndex: string | number): void;
    abstract expandItem(itemIdOrIndex: string | number, point: Point): void;
    abstract collapseItem(itemIdOrIndex: string | number, point: Point): void;

    dataCount() {
        return this.datumSelection.length;
    }

    private onSeriesAreaDragMove(event: _ModuleSupport.DragWidgetEvent<'drag-move'>) {
        this.dragOffset = {
            x: this.startDragOffset.x + event.originDeltaX,
            y: this.startDragOffset.y + event.originDeltaY,
        };
        this.ctx.eventsHub.emit('chart:request-update', { type: ChartUpdateType.PERFORM_LAYOUT });
    }

    private onSeriesAreaDragEnd() {
        this.startDragOffset = { ...this.dragOffset };
    }

    /**
     * Applies a scale + translate transform to `viewportGroup` from the current zoom state.
     *
     * At fit state `{x: {0,1}, y: {0,1}}` the transform is identity (scale=1, translation=0,0),
     * so the rendered output is pixel-identical to what `NetworkTreeLayout.updateOffset()` produced
     * before this group was introduced.
     *
     * For a zoom window `[xMin, xMax] × [yMin, yMax]`:
     *   s  = 1 / (xMax − xMin)
     *   tx = −xMin × V_w × s
     *   ty = −yMin × V_h × s
     */
    private applyViewportTransform() {
        const zoom = this.ctx.chartState.getValue('zoom');
        const vw = this.width ?? 0;
        const vh = this.height ?? 0;

        const xMin = zoom?.x?.min ?? 0;
        const xMax = zoom?.x?.max ?? 1;
        const yMin = zoom?.y?.min ?? 0;
        const yMax = zoom?.y?.max ?? 1;

        const xRange = xMax - xMin;
        const yRange = yMax - yMin;

        // Guard against degenerate zoom windows (e.g. NaN or zero-width range).
        const sx = xRange > 0 ? 1 / xRange : 1;
        const sy = yRange > 0 ? 1 / yRange : 1;
        // Use the smaller scale to preserve aspect ratio when x/y ranges differ.
        const s = Math.min(sx, sy);

        this.viewportGroup.translationX = -xMin * vw * s;
        this.viewportGroup.translationY = -yMin * vh * s;
        this.viewportGroup.scalingX = s;
        this.viewportGroup.scalingY = s;
    }

    override update(_opts: { seriesRect?: _ModuleSupport.BBox }) {
        // TODO: this.contentGroup.batchedUpdate() ?

        this.updateSelections();
        this.updateNodes();
    }

    processPendingCollapse() {
        if (this.pendingCollapsedIds) {
            this.ctx.collapsedManager.collapse(this.pendingCollapsedIds);
            this.pendingCollapsedIds = undefined;
        }
    }

    protected expand(ids: string[]) {
        const changed = this.ctx.collapsedManager.expand(ids);
        if (changed) {
            this.markNodeDataDirty();
        }
    }

    protected makeLayoutUpdateOptions(): NetworkLayoutUpdateOptions<TVertex, TEdge> {
        return {
            height: this.height ?? 0,
            width: this.width ?? 0,
            offset: this.dragOffset,
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

    private linkFactory(): NetworkLinkNode<NetworkLinkDatum<TVertex, TEdge>> {
        return new NetworkLinkNode();
    }

    private updateSelections() {
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

        const node = this.datumSelection.at(nodeDatumIndex) as _ModuleSupport.Group | undefined;
        if (!node) return;

        return node.getBBox();
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

        this.positionDatumNode(node, groupBBox, regularBBox);
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

    // ---
    // UNUSED METHODS

    getCategoryValue(_datumIndex: NetworkSeriesDatumIndex): any {
        return;
    }

    datumIndexForCategoryValue(_categoryValue: any): NetworkSeriesDatumIndex | undefined {
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
