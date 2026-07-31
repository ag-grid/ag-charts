import { type AgCollapsedChangeEventSource, _ModuleSupport } from 'ag-charts-community';
import {
    type BoxBounds,
    type ChartAnimationPhase,
    ChartAxisDirection,
    ChartUpdateType,
    type DefinedZoomState,
    type DynamicContext,
    Vec2,
    Vertex,
    definedZoomState,
    strictObjectKeys,
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

const ZOOM_EPSILON = 1e-6;

// Keeps `[mid - range/2, mid + range/2]` inside `[0, 1]`.
function clampMid(mid: number, range: number): number {
    const half = range / 2;
    if (mid - half < 0) return half;
    if (mid + half > 1) return 1 - half;
    return mid;
}

/** Whether the focused node or the content as a whole is centred in the viewport, per axis. */
export interface FocusTarget {
    horizontal: 'node' | 'content';
    vertical: 'node' | 'content';
}

const NODE_FOCUS_TARGET: FocusTarget = { horizontal: 'node', vertical: 'node' };

// Positions a window of `size` to centre `ratio`, without letting it leave `[0, 1]`.
function centredZoomWindow(ratio: number, size: number) {
    const mid = clampMid(ratio, size);
    return { min: mid - size / 2, max: mid + size / 2 };
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
    protected seriesRect?: _ModuleSupport.BBox;

    private vertexNodeDatumIndices: Record<string, number> = {};
    private pendingCollapsedIds?: NetworkSeriesVertexID[];

    private focusedVertex?: Vertex<TVertex, TEdge>;
    private focusedTarget: FocusTarget = NODE_FOCUS_TARGET;
    private hasFocusedInitialVertex = false;

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
            ctx.collapsedManager.setSeriesGetDatumCallback(this.id, this.getDatumById.bind(this)),

            ctx.chartState.observe((get) => this.activeItemObserver(get('activeItem'))),

            ctx.eventsHub.on('layout:complete', (event) => this.onLayoutComplete(event)),
            ctx.eventsHub.on('update:complete', () => this.onUpdateComplete()),
            ctx.eventsHub.on('active:load-memento', (event) => this.onActiveLoadMemento(event)),
            ctx.eventsHub.on('collapsed:restore', (event) => this.onCollapsedRestore(event)),
            ctx.eventsHub.on('series-area:click', (event) => this.onSeriesAreaClick(event)),
            ctx.eventsHub.on('series:keynav-expand', (event) => this.onSeriesAreaKeynavExpand(event)),
            ctx.eventsHub.on('series:keynav-collapse', (event) => this.onSeriesAreaKeynavCollapse(event)),
            ctx.eventsHub.on('zoom:change-request', (event) => this.onZoomChangeRequest(event)),
            ctx.eventsHub.on('zoom:change-complete', (event) => this.onZoomChangeComplete(event))
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
    abstract positionDatumNode(
        node: TNode,
        groupBBox: _ModuleSupport.BBox,
        regularBBox?: _ModuleSupport.BBox
    ): _ModuleSupport.BBox | undefined;
    abstract isVertexCollapsed(vertex: Vertex<TVertex, TEdge>): boolean;

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
            getDatumNodeBBox: this.getDatumNodeBBox.bind(this),
            getLinkInterpolation: this.getLinkInterpolation.bind(this),
            layoutDatumNode: this.layoutDatumNode.bind(this),
            layoutLinkNode: this.layoutLinkNode.bind(this),
            isVertexCollapsed: this.isVertexCollapsed.bind(this),
        };
    }

    /** Bbox used for layout-sizing; subclasses can override to exclude decorations. */
    protected measureDatumNode(node: TNode): _ModuleSupport.BBox | undefined {
        return node.getBBox();
    }

    /**
     * Get the index within the node selection for the node datum related to the vertex. Note, this is not the same
     * as the 'datumIndex' edge on the graph which is instead the index within the original data array.
     */
    protected getNodeDatumIndex(vertex: Vertex<TVertex, TEdge>) {
        return this.vertexNodeDatumIndices[this.graph.getVertexValue(vertex) as string] as number | undefined;
    }

    protected setNodeDatumIndex(vertex: Vertex<TVertex, TEdge>, index: number) {
        this.vertexNodeDatumIndices[vertex.value as string] = index;
    }

    protected getDatumById(id: NetworkSeriesVertexID) {
        return this.datumSelection.at(this.vertexNodeDatumIndices[id])?.datum?.datum;
    }

    private linkFactory(): NetworkLinkNode<NetworkLinkDatum<TVertex, TEdge>> {
        return new NetworkLinkNode();
    }

    private updateSelections() {
        // Without the gate, per-vertex datum objects are re-allocated on every update; that
        // tricks HighlightManager's `a.datum === b.datum` check into a spurious change → loop.
        if (!this.nodeDataRefresh) return;
        this.nodeDataRefresh = false;

        this.vertexNodeDatumIndices = {};

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
        const nodeDatumIndex = this.getNodeDatumIndex(vertex);
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
        const nodeDatumIndex = this.getNodeDatumIndex(vertex);
        if (typeof nodeDatumIndex !== 'number') return;

        const node = this.datumSelection.at(nodeDatumIndex);
        if (!node) return;

        return this.positionDatumNode(node, groupBBox, regularBBox);
    }

    private layoutLinkNode(vertex: Vertex<TVertex, TEdge>, drawLink: (path: _ModuleSupport.ExtendedPath2D) => void) {
        const nodeDatumIndex = this.getNodeDatumIndex(vertex);
        if (typeof nodeDatumIndex !== 'number') return;

        const link = this.linkSelection.at(nodeDatumIndex);
        if (!link) return;

        const path = link.getPath();
        if (!path) return;

        drawLink(path.path);
        path.visible = true;
    }

    private applyViewportTransform() {
        const scaling = this.getViewportScaling();
        const translation = this.getViewportTranslation(scaling);

        this.viewportGroup.scalingX = scaling;
        this.viewportGroup.scalingY = scaling;
        this.viewportGroup.translationX = translation.x;
        this.viewportGroup.translationY = translation.y;
    }

    private setFocusedVertex(vertex: Vertex<TVertex, TEdge> | undefined, target: FocusTarget) {
        if (!vertex) return;
        this.focusedVertex = vertex;
        this.focusedTarget = target;
    }

    // Rebuilds re-run on every state change, so the initial focus must not steal focus from an
    // active item that has already been requested.
    protected focusInitialVertex(vertex: Vertex<TVertex, TEdge> | undefined) {
        if (this.hasFocusedInitialVertex) return;
        this.hasFocusedInitialVertex = true;
        if (this.focusedVertex != null) return;
        this.setFocusedVertex(vertex, this.getInitialFocusTarget());
    }

    /** What the initial view centres on; every later focus change centres the node itself. */
    protected getInitialFocusTarget(): FocusTarget {
        return NODE_FOCUS_TARGET;
    }

    /** Scale at which the content exactly fills the viewport — the most zoomed-out the chart gets. */
    private getContentFitScale() {
        const { seriesRect } = this;
        const contentBBox = this.layout.getContentBBox();
        if (!seriesRect || !contentBBox || contentBBox.width <= 0 || contentBBox.height <= 0) return;

        return Math.min(seriesRect.width / contentBBox.width, seriesRect.height / contentBBox.height);
    }

    /**
     * Content bounds grown by a viewport's worth of space on every side — the space that zoom ratios
     * `[0, 1]` address. That is exactly enough for any node, including those at the very edges, to
     * reach any position in the viewport. On the axis that limits the fit scale it works out as one
     * content extent per side; on the other axis the viewport is the larger of the two, so it needs
     * more.
     */
    private getPaddedContentBounds() {
        const { seriesRect } = this;
        const contentBBox = this.layout.getContentBBox();
        const fitScale = this.getContentFitScale();
        if (!seriesRect || !contentBBox || fitScale == null || fitScale <= 0) return;

        // Measured at the fit scale so that the padding never depends on the current zoom.
        const padX = seriesRect.width / fitScale;
        const padY = seriesRect.height / fitScale;

        return {
            x: contentBBox.x - padX,
            y: contentBBox.y - padY,
            width: contentBBox.width + padX * 2,
            height: contentBBox.height + padY * 2,
        };
    }

    private getViewportScaling() {
        const fit = this.getContentFit();
        if (!fit) return 1;

        const zoom = definedZoomState(this.ctx.chartState.getValue('zoom'));

        // Capped at 1 so content is never drawn larger than its native size.
        return Math.min(fit.x / (zoom.x.max - zoom.x.min), fit.y / (zoom.y.max - zoom.y.min), 1);
    }

    private getViewportTranslation(scaling: number) {
        const { seriesRect } = this;
        const padded = this.getPaddedContentBounds();
        if (!seriesRect || !padded) return Vec2.from(0, 0);

        const zoom = definedZoomState(this.ctx.chartState.getValue('zoom'));

        // Zoom publishes y-up ratios while the scene renders y-down, so `y.max` is the top edge.
        const left = padded.x + zoom.x.min * padded.width;
        const top = padded.y + (1 - zoom.y.max) * padded.height;

        // Whichever axis `scaling` was not taken from has room to spare in the viewport; centre it.
        const slackX = Math.max(0, seriesRect.width - (zoom.x.max - zoom.x.min) * padded.width * scaling);
        const slackY = Math.max(0, seriesRect.height - (zoom.y.max - zoom.y.min) * padded.height * scaling);

        return Vec2.from(-left * scaling + slackX / 2, -top * scaling + slackY / 2);
    }

    // ZoomManager's `panToBBox()` only brings the bbox into view, whereas the focus must end up at the
    // centre of the viewport.
    private getFocusedZoom(): DefinedZoomState | undefined {
        const contentBBox = this.layout.getContentBBox();
        const padded = this.getPaddedContentBounds();
        const focusedBBox = this.getFocusedBBox();
        if (!contentBBox || !padded || !focusedBBox) return;

        const zoom = definedZoomState(this.ctx.chartState.getValue('zoom'));

        // Sized here rather than left to `constrainZoomWindow`, which would re-derive the window from
        // its midpoint and so discard the centring.
        const sizes = this.getSharedScaleWindowSizes(zoom.x.max - zoom.x.min, zoom.y.max - zoom.y.min);
        if (!sizes) return;

        const { horizontal, vertical } = this.focusedTarget;
        const xBounds = horizontal === 'content' ? contentBBox : focusedBBox;
        const yBounds = vertical === 'content' ? contentBBox : focusedBBox;

        const xRatio = (xBounds.x + xBounds.width / 2 - padded.x) / padded.width;
        // Zoom publishes y-up ratios while the scene renders y-down.
        const yRatio = 1 - (yBounds.y + yBounds.height / 2 - padded.y) / padded.height;

        return {
            x: centredZoomWindow(xRatio, sizes.x),
            y: centredZoomWindow(yRatio, sizes.y),
        };
    }

    private getFocusedBBox() {
        if (this.focusedVertex == null) return;
        return this.layout.getNodeBBox(this.focusedVertex);
    }

    // Runs on every activeItem change incl. hover — opens collapsed ancestors.
    private activeItemObserver(activeItem: any) {
        if (activeItem?.seriesId === this.id) {
            this.expandNetworkToItem(activeItem.itemId, 'api-call');
        }
    }

    private onCollapsedRestore({ collapsed }: _ModuleSupport.CollapsedRestoreEvent) {
        if (!collapsed) return;
        if (this.graph.getVertexCount() === 0) {
            this.pendingCollapsedIds = collapsed;
        }
    }

    private onLayoutComplete(event: _ModuleSupport.LayoutCompleteEvent) {
        this.seriesRect = event.series.rect;
    }

    private onUpdateComplete() {
        const zoom = this.getFocusedZoom();
        if (!zoom) return;

        this.focusedVertex = undefined;
        this.ctx.zoomManager?.updateZoom(
            { source: 'chart-update', sourceDetail: 'internal-networkSeriesFocusChange' },
            zoom
        );
    }

    // `active:load-memento` only fires for state-restore / programmatic setState (not hover).
    private onActiveLoadMemento({ activeItem }: _ModuleSupport.ActiveLoadMementoEvent) {
        if (activeItem?.seriesId !== this.id) return;
        this.setFocusedVertex(this.graph.findVertexById(activeItem.itemId), NODE_FOCUS_TARGET);
    }

    private onSeriesAreaClick(event: _ModuleSupport.SeriesAreaClickEvent) {
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
    }

    private onSeriesAreaKeynavExpand(event: _ModuleSupport.SeriesKeyNavExpandEvent) {
        const { nodeDatum, widgetEvent } = event;
        if (nodeDatum.itemId == null || nodeDatum.series !== this) return;
        widgetEvent.sourceEvent.preventDefault();
        this.expandItem(nodeDatum.itemId, 'user-interaction');
        this.ctx.eventsHub.emit('chart:request-update', { type: ChartUpdateType.PERFORM_LAYOUT });
    }

    private onSeriesAreaKeynavCollapse(event: _ModuleSupport.SeriesKeyNavCollapseEvent) {
        const { nodeDatum, widgetEvent } = event;
        if (nodeDatum.itemId == null || nodeDatum.series !== this) return;
        widgetEvent.sourceEvent.preventDefault();
        this.collapseItem(nodeDatum.itemId, 'user-interaction');
        this.ctx.eventsHub.emit('chart:request-update', { type: ChartUpdateType.PERFORM_LAYOUT });
    }

    private onZoomChangeRequest(event: _ModuleSupport.ZoomChangeRequestEvent) {
        if (event.isReset) return;
        this.constrainZoomWindow(event);
    }

    private onZoomChangeComplete(event: _ModuleSupport.ZoomChangeCompleteEvent) {
        // Stop focusing on a vertex when the user changes the zoom to allow the viewport to be panned.
        if (event.source === 'user-interaction') {
            this.focusedVertex = undefined;
        }

        this.applyViewportTransform();
        this.ctx.eventsHub.emit('chart:request-update', { type: ChartUpdateType.SCENE_RENDER });
    }

    /**
     * Window sizes that fill the viewport on both axes at a single shared scale. Sizing the axes
     * independently would leave the viewport with space no zoom window can address, which shows up as
     * content drifting away from wherever it was aligned.
     */
    private getSharedScaleWindowSizes(xSize: number, ySize: number) {
        const fit = this.getContentFit();
        const fitScale = this.getContentFitScale();
        if (!fit || fitScale == null || xSize <= 0 || ySize <= 0) return;

        // The least-zoomed axis wins, so content is preserved rather than cropped.
        const requestedScale = Math.min(fit.x / xSize, fit.y / ySize);

        // Held between the content fitting the viewport and its native pixel size. Content smaller
        // than the viewport cannot do both, and native size wins.
        const scale = Math.min(Math.max(requestedScale, Math.min(fitScale, 1)), 1);

        return { x: Math.min(1, fit.x / scale), y: Math.min(1, fit.y / scale) };
    }

    private getRequestedWindowSizes(event: _ModuleSupport.ZoomChangeRequestEvent) {
        let x;
        let y;

        for (const id of strictObjectKeys(event.state)) {
            const entry = event.state[id];
            if (entry == null) continue;
            if (entry.direction === 'x') {
                x ??= entry.max - entry.min;
            } else {
                y ??= entry.max - entry.min;
            }
        }

        if (x == null || y == null) return;
        return { x, y };
    }

    // Holds the zoom to a single shared scale between the content fitting the viewport and native
    // pixel size, then slides each window back inside `[0, 1]`.
    private constrainZoomWindow(event: _ModuleSupport.ZoomChangeRequestEvent) {
        const requested = this.getRequestedWindowSizes(event);
        if (!requested) return;

        const sizes = this.getSharedScaleWindowSizes(requested.x, requested.y);
        if (!sizes) return;

        const constrained: _ModuleSupport.CoreZoomState = {};
        let didConstrain = false;

        for (const id of strictObjectKeys(event.state)) {
            const entry = event.state[id];
            if (entry == null) continue;

            const { min, max, direction } = entry;
            const isX = direction === 'x';

            const size = isX ? sizes.x : sizes.y;
            const mid = clampMid((min + max) / 2, size);

            const constrainedMin = mid - size / 2;
            const constrainedMax = mid + size / 2;

            constrained[id] = {
                min: constrainedMin,
                max: constrainedMax,
                direction: isX ? ChartAxisDirection.X : ChartAxisDirection.Y,
            };

            didConstrain ||=
                Math.abs(constrainedMin - min) > ZOOM_EPSILON || Math.abs(constrainedMax - max) > ZOOM_EPSILON;
        }

        if (didConstrain) {
            event.constrainChanges(constrained);
        }
    }

    private getContentFit() {
        const { seriesRect } = this;
        const padded = this.getPaddedContentBounds();
        if (!seriesRect || !padded) return;

        return { x: seriesRect.width / padded.width, y: seriesRect.height / padded.height };
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
