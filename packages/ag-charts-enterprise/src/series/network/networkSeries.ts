import { type AgCollapsedChangeEventSource, _ModuleSupport } from 'ag-charts-community';
import {
    type BoxBounds,
    type ChartAnimationPhase,
    ChartAxisDirection,
    ChartUpdateType,
    type DefinedZoomState,
    type DynamicContext,
    type Point,
    Vec2,
    Vertex,
    clamp,
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

/**
 * Keeps `[mid - range/2, mid + range/2]` inside `[0, 1]`, and additionally holds `mid` within
 * `limit` of either end. `limit` is where the content edges sit, so a pan can bring an edge to the
 * centre of the viewport but no further — without it, zooming in would expose enough slack to drag
 * the content off the viewport entirely. At the fit scale the two bounds coincide.
 */
function clampMid(mid: number, range: number, limit: number): number {
    const bound = Math.min(Math.max(range / 2, limit), 0.5);

    return clamp(bound, mid, 1 - bound);
}

interface WindowSizes {
    x: number;
    y: number;
}

/** An inclusive range of zoom ratios on one axis. */
interface Span {
    min: number;
    max: number;
}

interface PaddedBounds {
    x: number;
    y: number;
    width: number;
    height: number;
    /** Ratio inset, within these bounds, of the content edges on each axis. */
    limitX: number;
    limitY: number;
}

// Tolerant of sub-pixel layout noise, which would otherwise read as a content change on every update.
function samePaddedBounds(a: PaddedBounds, b: PaddedBounds) {
    return (
        Math.abs(a.x - b.x) < 0.5 &&
        Math.abs(a.y - b.y) < 0.5 &&
        Math.abs(a.width - b.width) < 0.5 &&
        Math.abs(a.height - b.height) < 0.5
    );
}

// Positions a window of `size` to centre `ratio`, subject to the `clampMid` bounds.
function centredZoomWindow(ratio: number, size: number, limit: number) {
    const mid = clampMid(ratio, size, limit);
    return { min: mid - size / 2, max: mid + size / 2 };
}

// Zoom publishes y-up ratios while the scene renders y-down.
function toRatio(bounds: PaddedBounds, x: number, y: number) {
    return { x: (x - bounds.x) / bounds.width, y: 1 - (y - bounds.y) / bounds.height };
}

/**
 * Positions a window of `size` to contain `span`, moving `mid` as little as possible and leaving it
 * where it is once the span already fits inside. A span wider than the window cannot be contained at
 * all, so it is centred instead — the closest thing to fully visible available.
 */
function revealingZoomWindow(span: Span, mid: number, size: number, limit: number) {
    let target = mid;

    if (span.max - span.min > size) {
        target = (span.min + span.max) / 2;
    } else if (span.min < mid - size / 2) {
        target = span.min + size / 2;
    } else if (span.max > mid + size / 2) {
        target = span.max - size / 2;
    }

    return centredZoomWindow(target, size, limit);
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

    // Padded bounds the current zoom ratios were derived against. A later content change makes the
    // same ratios mean a different scale and position, which is what this allows us to correct.
    private zoomedPaddedBounds?: PaddedBounds;

    // `centre` puts the item mid-viewport, `reveal` only pans far enough to unclip it; absent, the
    // chart opens showing all content. Cleared once applied, so later updates do not re-pan.
    private pendingView?: {
        itemId: NetworkSeriesVertexID;
        intent: 'centre' | 'reveal';
        /** Where in the viewport the item sat before the layout changed; a reveal holds it there. */
        anchor?: { x: number; y: number };
    };
    private hasCentredContent = false;

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
    abstract expandItem(itemId: NetworkSeriesVertexID, source: AgCollapsedChangeEventSource): boolean;
    abstract collapseItem(itemId: NetworkSeriesVertexID, source: AgCollapsedChangeEventSource): boolean;

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

    /**
     * Anchors the highlight and tooltip a `setState` active item asks for. The scene nodes sit under
     * `viewportGroup`, which carries the zoom transform, whereas the caller resolves this point
     * against `contentGroup`; round-tripping through canvas space keeps the two in step at any zoom.
     */
    datumMidPoint(datum: _ModuleSupport.SeriesNodeDatum): Point | undefined {
        const { vertex } = datum as TDatum;
        if (vertex == null) return;

        const nodeDatumIndex = this.getNodeDatumIndex(vertex);
        if (typeof nodeDatumIndex !== 'number') return;

        const node = this.datumSelection.at(nodeDatumIndex);
        if (!node) return;

        const bbox = _ModuleSupport.Transformable.toCanvas(node, this.measureDatumNode(node));
        if (!bbox.isFinite()) return;

        return _ModuleSupport.Transformable.fromCanvasPoint(this.contentGroup, {
            canvasX: bbox.x + bbox.width / 2,
            canvasY: bbox.y + bbox.height / 2,
        });
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

    private centreItem(itemId: NetworkSeriesVertexID | undefined) {
        if (itemId == null) return;
        this.pendingView = { itemId, intent: 'centre' };
    }

    /**
     * Called before the layout that a toggle triggers, so the item's current place in the viewport can
     * be recorded. Holding that place across the reflow is what stops an already-visible item moving.
     */
    private revealItem(itemId: NetworkSeriesVertexID | undefined) {
        if (itemId == null) return;
        this.pendingView = { itemId, intent: 'reveal', anchor: this.getViewportAnchor(itemId) };
    }

    /** Where in the viewport an item sits, as a `[0, 1]` fraction of the window on each axis. */
    private getViewportAnchor(itemId: NetworkSeriesVertexID) {
        const padded = this.getPaddedContentBounds();
        const vertex = this.graph.findVertexById(itemId);
        if (!padded || !vertex) return;

        const span = this.getVertexRatioSpan(vertex, padded);
        if (!span) return;

        const zoom = definedZoomState(this.ctx.chartState.getValue('zoom'));
        const xSize = zoom.x.max - zoom.x.min;
        const ySize = zoom.y.max - zoom.y.min;
        if (xSize <= 0 || ySize <= 0) return;

        return {
            x: ((span.x.min + span.x.max) / 2 - zoom.x.min) / xSize,
            y: ((span.y.min + span.y.max) / 2 - zoom.y.min) / ySize,
        };
    }

    /**
     * Resolved at use time rather than when requested: state restoration can name an item before the
     * data it belongs to has been processed, so the vertex may not exist in the graph yet.
     */
    private getPendingVertex() {
        const { pendingView } = this;
        if (!pendingView) return;
        return this.graph.findVertexById(pendingView.itemId);
    }

    /** Scale at which the content exactly fills the viewport — the most zoomed-out the chart gets. */
    private getContentFitScale() {
        const { seriesRect } = this;
        const contentBBox = this.layout.getContentBBox();
        if (!seriesRect || !contentBBox || contentBBox.width <= 0 || contentBBox.height <= 0) return;

        return Math.min(seriesRect.width / contentBBox.width, seriesRect.height / contentBBox.height);
    }

    /** The most zoomed-out the view goes: content fitting the viewport, or native size if that is nearer. */
    private getMinScale() {
        const fitScale = this.getContentFitScale();
        if (fitScale == null) return;

        return Math.min(fitScale, 1);
    }

    /**
     * Content bounds grown by half a viewport on every side — the space that zoom ratios `[0, 1]`
     * address. That is exactly enough for either edge of the content to sit at the centre of the
     * viewport, and no more, so a pan can always be reversed by dragging back the other way.
     */
    private getPaddedContentBounds(): PaddedBounds | undefined {
        const { seriesRect } = this;
        const contentBBox = this.layout.getContentBBox();
        const minScale = this.getMinScale();
        if (!seriesRect || !contentBBox || minScale == null || minScale <= 0) return;

        // Sized against the largest viewport the content is ever seen through, so the padding covers
        // every reachable zoom rather than only the current one.
        const padX = seriesRect.width / minScale / 2;
        const padY = seriesRect.height / minScale / 2;

        const width = contentBBox.width + padX * 2;
        const height = contentBBox.height + padY * 2;

        return {
            x: contentBBox.x - padX,
            y: contentBBox.y - padY,
            width,
            height,
            limitX: padX / width,
            limitY: padY / height,
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

    /**
     * The view the next update settles on: a requested item brought into view, or failing that the
     * point the current window already addresses, held in place. Expanding or collapsing changes the
     * content bounds, and so what a given ratio points at, so every case re-derives the ratios rather
     * than letting the view silently rescale and drift.
     */
    private getUpdatedZoom(): DefinedZoomState | undefined {
        const padded = this.getPaddedContentBounds();
        if (!padded) return;

        // Sized here rather than left to `constrainZoomWindow`, which would re-derive the window from
        // its midpoint and so discard the pan.
        const sizes = this.getHeldScaleWindowSizes();
        if (!sizes) return;

        const held = this.getHeldViewCentre(padded);

        const reveal = this.getRevealSpan(padded);
        if (reveal) {
            // Anchoring the item where it already sat holds a visible one still against the reflow;
            // only an already-clipped item is panned, and only far enough to show it.
            const from = this.getAnchoredCentre(reveal, sizes) ?? held ?? this.getWindowCentre();

            return {
                x: revealingZoomWindow(reveal.x, from.x, sizes.x, padded.limitX),
                y: revealingZoomWindow(reveal.y, from.y, sizes.y, padded.limitY),
            };
        }

        const centre = this.getPendingViewCentre(padded) ?? held;
        if (!centre) return;

        return {
            x: centredZoomWindow(centre.x, sizes.x, padded.limitX),
            y: centredZoomWindow(centre.y, sizes.y, padded.limitY),
        };
    }

    // ZoomManager's `panToBBox()` only brings the bbox into view, whereas a centring request must end
    // up at the middle of the viewport.
    private getPendingViewCentre(padded: PaddedBounds) {
        if (this.pendingView?.intent === 'reveal') return;

        const bounds = this.getPendingViewBounds();
        if (!bounds) return;

        return toRatio(padded, bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
    }

    /** The ratios an interacted item spans, which a reveal has to bring wholly inside the window. */
    private getRevealSpan(padded: PaddedBounds) {
        if (this.pendingView?.intent !== 'reveal') return;

        const vertex = this.getPendingVertex();
        if (!vertex) return;

        return this.getVertexRatioSpan(vertex, padded);
    }

    private getVertexRatioSpan(vertex: Vertex<TVertex, TEdge>, padded: PaddedBounds): { x: Span; y: Span } | undefined {
        const bounds = this.layout.getNodeBBox(vertex);
        if (!bounds) return;

        // Ratios run y-up, so the bbox's lower scene edge is the smaller of the two.
        const lower = toRatio(padded, bounds.x, bounds.y + bounds.height);
        const upper = toRatio(padded, bounds.x + bounds.width, bounds.y);

        return { x: { min: lower.x, max: upper.x }, y: { min: lower.y, max: upper.y } };
    }

    /** Window centre that puts the item back at the viewport fraction it occupied before the reflow. */
    private getAnchoredCentre(span: { x: Span; y: Span }, sizes: WindowSizes) {
        const { anchor } = this.pendingView ?? {};
        if (!anchor) return;

        return {
            x: (span.x.min + span.x.max) / 2 + sizes.x * (0.5 - anchor.x),
            y: (span.y.min + span.y.max) / 2 + sizes.y * (0.5 - anchor.y),
        };
    }

    private getWindowCentre() {
        const zoom = definedZoomState(this.ctx.chartState.getValue('zoom'));

        return { x: (zoom.x.min + zoom.x.max) / 2, y: (zoom.y.min + zoom.y.max) / 2 };
    }

    /** The point the current window centre addresses, once the content bounds have moved under it. */
    private getHeldViewCentre(padded: PaddedBounds) {
        const previous = this.zoomedPaddedBounds;
        if (!previous || samePaddedBounds(previous, padded)) return;

        const zoom = definedZoomState(this.ctx.chartState.getValue('zoom'));

        // Read against the bounds the ratios came from, otherwise the reference point moves too.
        return toRatio(
            padded,
            previous.x + ((zoom.x.min + zoom.x.max) / 2) * previous.width,
            previous.y + (1 - (zoom.y.min + zoom.y.max) / 2) * previous.height
        );
    }

    /**
     * Window sizes holding the current scale. The scale is read against the bounds the current ratios
     * were derived from, which a content change leaves behind.
     */
    private getHeldScaleWindowSizes() {
        const fit = this.getContentFit();
        if (!fit) return;

        const zoom = definedZoomState(this.ctx.chartState.getValue('zoom'));
        const xSize = zoom.x.max - zoom.x.min;
        const ySize = zoom.y.max - zoom.y.min;
        if (xSize <= 0 || ySize <= 0) return;

        const previous = this.zoomedPaddedBounds;
        const scaleFit = (previous ? this.getBoundsFit(previous) : undefined) ?? fit;
        const scale = this.constrainScale(Math.min(scaleFit.x / xSize, scaleFit.y / ySize));

        return this.getWindowSizesForScale(fit, scale);
    }

    private getPendingViewBounds() {
        const pendingVertex = this.getPendingVertex();
        if (pendingVertex) return this.layout.getNodeBBox(pendingVertex);

        // Falling back to the content keeps the chart off the raw `[0, 1]` default while a requested
        // item stays unresolvable; the item still centres later, once it can be found.
        if (!this.hasCentredContent) return this.layout.getContentBBox();
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
        const zoom = this.getUpdatedZoom();
        if (!zoom) return;

        // Only spent once the requested item actually resolved, so an unresolvable one is retried.
        if (this.getPendingVertex()) {
            this.pendingView = undefined;
        }
        this.hasCentredContent = true;
        this.ctx.zoomManager?.updateZoom(
            { source: 'chart-update', sourceDetail: 'internal-networkSeriesFocusChange' },
            zoom
        );
    }

    // `active:load-memento` only fires for state-restore / programmatic setState (not hover).
    private onActiveLoadMemento({ activeItem }: _ModuleSupport.ActiveLoadMementoEvent) {
        if (activeItem?.seriesId !== this.id) return;
        this.centreItem(activeItem.itemId);
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
        const changed = this.ctx.collapsedManager.isCollapsed(clickedNode.itemId)
            ? this.expandItem(clickedNode.itemId, 'user-interaction')
            : this.collapseItem(clickedNode.itemId, 'user-interaction');

        // A prevented toggle leaves the layout alone, so there is nothing to pan away from.
        if (changed) {
            this.revealItem(clickedNode.itemId);
        }
    }

    private onSeriesAreaKeynavExpand(event: _ModuleSupport.SeriesKeyNavExpandEvent) {
        const { nodeDatum, widgetEvent } = event;
        if (nodeDatum.itemId == null || nodeDatum.series !== this) return;
        widgetEvent.sourceEvent.preventDefault();
        if (this.expandItem(nodeDatum.itemId, 'user-interaction')) {
            this.revealItem(nodeDatum.itemId);
        }
        this.ctx.eventsHub.emit('chart:request-update', { type: ChartUpdateType.PERFORM_LAYOUT });
    }

    private onSeriesAreaKeynavCollapse(event: _ModuleSupport.SeriesKeyNavCollapseEvent) {
        const { nodeDatum, widgetEvent } = event;
        if (nodeDatum.itemId == null || nodeDatum.series !== this) return;
        widgetEvent.sourceEvent.preventDefault();
        if (this.collapseItem(nodeDatum.itemId, 'user-interaction')) {
            this.revealItem(nodeDatum.itemId);
        }
        this.ctx.eventsHub.emit('chart:request-update', { type: ChartUpdateType.PERFORM_LAYOUT });
    }

    private onZoomChangeRequest(event: _ModuleSupport.ZoomChangeRequestEvent) {
        if (event.isReset) return;
        this.constrainZoomWindow(event);
    }

    private onZoomChangeComplete(event: _ModuleSupport.ZoomChangeCompleteEvent) {
        // A user gesture takes precedence over any centring not yet applied.
        if (event.source === 'user-interaction') {
            this.pendingView = undefined;
            this.hasCentredContent = true;
        }

        this.zoomedPaddedBounds = this.getPaddedContentBounds();

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
        if (!fit || xSize <= 0 || ySize <= 0) return;

        // The least-zoomed axis wins, so content is preserved rather than cropped.
        const requestedScale = Math.min(fit.x / xSize, fit.y / ySize);

        return this.getWindowSizesForScale(fit, this.constrainScale(requestedScale));
    }

    private getWindowSizesForScale(fit: { x: number; y: number }, scale: number) {
        return { x: Math.min(1, fit.x / scale), y: Math.min(1, fit.y / scale) };
    }

    /**
     * Holds a scale between the content fitting the viewport and its native pixel size. Content
     * smaller than the viewport cannot do both, and native size wins.
     */
    private constrainScale(scale: number) {
        const minScale = this.getMinScale();
        if (minScale == null) return scale;

        return Math.min(Math.max(scale, minScale), 1);
    }

    private getStateWindowSizes(state: _ModuleSupport.ZoomChangeState) {
        let x;
        let y;

        for (const id of strictObjectKeys(state)) {
            const entry = state[id];
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

    /**
     * A zoom already at a limit has its size change absorbed entirely by the clamp, leaving only the
     * cursor-anchored midpoint to be applied — which reads as a pan. Such a request is dropped rather
     * than constrained. Pans are unaffected, as they do not change the window size.
     */
    private isZoomAtLimit(event: _ModuleSupport.ZoomChangeRequestEvent, requested: WindowSizes, sizes: WindowSizes) {
        const previous = this.getStateWindowSizes(event.oldState);
        if (!previous) return false;

        const wantsZoom =
            Math.abs(requested.x - previous.x) > ZOOM_EPSILON || Math.abs(requested.y - previous.y) > ZOOM_EPSILON;

        return (
            wantsZoom && Math.abs(sizes.x - previous.x) < ZOOM_EPSILON && Math.abs(sizes.y - previous.y) < ZOOM_EPSILON
        );
    }

    private restoreZoomWindow(event: _ModuleSupport.ZoomChangeRequestEvent) {
        const restored: _ModuleSupport.CoreZoomState = {};

        for (const id of strictObjectKeys(event.oldState)) {
            const entry = event.oldState[id];
            if (entry == null) continue;

            restored[id] = {
                min: entry.min,
                max: entry.max,
                direction: entry.direction === 'x' ? ChartAxisDirection.X : ChartAxisDirection.Y,
            };
        }

        event.constrainChanges(restored);
    }

    // Holds the zoom to a single shared scale between the content fitting the viewport and native
    // pixel size, then slides each window back inside `[0, 1]`.
    private constrainZoomWindow(event: _ModuleSupport.ZoomChangeRequestEvent) {
        const requested = this.getStateWindowSizes(event.state);
        if (!requested) return;

        const padded = this.getPaddedContentBounds();
        if (!padded) return;

        const sizes = this.getSharedScaleWindowSizes(requested.x, requested.y);
        if (!sizes) return;

        if (this.isZoomAtLimit(event, requested, sizes)) {
            this.restoreZoomWindow(event);
            return;
        }

        const constrained: _ModuleSupport.CoreZoomState = {};
        let didConstrain = false;

        for (const id of strictObjectKeys(event.state)) {
            const entry = event.state[id];
            if (entry == null) continue;

            const { min, max, direction } = entry;
            const isX = direction === 'x';

            const size = isX ? sizes.x : sizes.y;
            const mid = clampMid((min + max) / 2, size, isX ? padded.limitX : padded.limitY);

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
        const padded = this.getPaddedContentBounds();
        if (!padded) return;

        return this.getBoundsFit(padded);
    }

    /** Window sizes that would fill the viewport at scale 1 for the given bounds. */
    private getBoundsFit(bounds: PaddedBounds) {
        const { seriesRect } = this;
        if (!seriesRect || bounds.width <= 0 || bounds.height <= 0) return;

        return { x: seriesRect.width / bounds.width, y: seriesRect.height / bounds.height };
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
