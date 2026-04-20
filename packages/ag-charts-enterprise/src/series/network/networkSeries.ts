import { _ModuleSupport } from 'ag-charts-community';
import { type ChartAnimationPhase, type ChartAxisDirection, Property, Vertex } from 'ag-charts-core';

import { NetworkGraph } from './networkGraph';
import type { NetworkLayout } from './networkLayout';
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

    protected readonly dataNodeGroup = this.contentGroup.appendChild(
        new _ModuleSupport.TranslatableGroup({ name: `${this.id}-series-dataNodes`, zIndex: 2 })
    );

    protected readonly linkGroup = this.contentGroup.appendChild(
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

    private pendingCollapsedIds?: string[];

    constructor(moduleCtx: _ModuleSupport.ModuleContext) {
        super({
            moduleCtx,
            pickModes: [_ModuleSupport.SeriesNodePickMode.EXACT_SHAPE_MATCH],
        });

        this.graph = this.createNetworkGraph();
        this.layout = this.createNetworkLayout();

        moduleCtx.eventsHub.on('collapsed:restore', ({ collapsed }) => {
            if (!collapsed) return;
            if (this.graph.getVertexCount() === 0) {
                this.pendingCollapsedIds = collapsed;
            }
        });

        moduleCtx.eventsHub.on('active:update', (blob) => {
            if (blob?.seriesId !== this.id) return;
            this.expandNetworkToItem(blob.itemId);
        });

        moduleCtx.eventsHub.on('series-area:click', ({ type, clickedNode }) => {
            if (type !== 'click' || clickedNode?.series !== this || clickedNode.itemId == null) return;
            if (this.ctx.collapsedManager.isCollapsed(clickedNode.itemId)) {
                this.expandItem(clickedNode.itemId);
            } else {
                this.collapseItem(clickedNode.itemId);
            }
        });
    }

    abstract createNetworkGraph(): TGraph;
    abstract createNetworkLayout(): TLayout;
    abstract nodeFactory(): TNode;

    abstract getRootVertices(): Vertex<TVertex, TEdge>[];
    abstract updateDatumSelection(nodeData: TDatum[], datumSelection: _ModuleSupport.Selection<TDatum, TNode>): void;
    abstract updateDatumNodes(datumSelection: _ModuleSupport.Selection<TDatum, TNode>): void;
    abstract updateLinkNodes(
        linkSelection: _ModuleSupport.Selection<
            NetworkLinkDatum<TVertex, TEdge>,
            NetworkLinkNode<NetworkLinkDatum<TVertex, TEdge>>
        >
    ): void;

    abstract positionDatumNode(node: TNode, groupBBox: _ModuleSupport.BBox): void;
    abstract getLinkInterpolation(from: Vertex<TVertex, TEdge>, to: Vertex<TVertex, TEdge>): NetworkLinkInterpolation;

    abstract expandNetworkToItem(itemIdOrIndex: string | number): void;
    abstract expandItem(itemIdOrIndex: string | number): void;
    abstract collapseItem(itemIdOrIndex: string | number): void;

    dataCount() {
        return this.graph.getVertexCount();
    }

    override update(_opts: { seriesRect?: _ModuleSupport.BBox }) {
        // TODO: this.contentGroup.batchedUpdate() ?

        this.updateSelections();
        this.updateNodes();
    }

    hasItemStylers() {
        return false;
    }

    getTooltipContent(
        _datumIndex: NetworkSeriesDatumIndex,
        _removeThisDatum: NetworkDatum<TVertex, TEdge> | undefined
    ): _ModuleSupport.TooltipContent | undefined {
        return undefined;
    }

    getCategoryValue(_datumIndex: NetworkSeriesDatumIndex): any {
        return;
    }

    datumIndexForCategoryValue(_categoryValue: any): NetworkSeriesDatumIndex | undefined {
        return;
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
        this.layout.update(
            this.graph,
            this.getRootVertices(),
            this.getDatumNodeBBox.bind(this),
            this.getLinkInterpolation.bind(this),
            this.layoutDatumNode.bind(this),
            this.layoutLinkNode.bind(this)
        );
    }

    private getDatumNodeBBox(vertex: Vertex<any, any>) {
        const nodeDatumIndex = this.graph.findNeighbourValue(vertex, 'nodeDatumIndex' as TEdge);
        if (typeof nodeDatumIndex !== 'number') return;

        const group = this.datumSelection.at(nodeDatumIndex) as _ModuleSupport.Group | undefined;
        if (!group) return;

        return this.datumSelection.at(nodeDatumIndex)?.getBBox();
    }

    private layoutDatumNode(vertex: Vertex<TVertex, TEdge>, groupBBox: _ModuleSupport.BBox) {
        const nodeDatumIndex = this.graph.findNeighbourValue(vertex, 'nodeDatumIndex' as TEdge);
        if (typeof nodeDatumIndex !== 'number') return;

        this.positionDatumNode(this.datumSelection.at(nodeDatumIndex)!, groupBBox);
    }

    private layoutLinkNode(vertex: Vertex<TVertex, TEdge>, drawLink: (path: _ModuleSupport.ExtendedPath2D) => void) {
        const nodeDatumIndex = this.graph.findNeighbourValue(vertex, 'nodeDatumIndex' as TEdge);
        if (typeof nodeDatumIndex !== 'number') return;

        const link = this.linkSelection.at(nodeDatumIndex);
        if (!link) return;

        const path = link.children().next().value as _ModuleSupport.Path | undefined;
        if (!path) return;

        drawLink(path.path);

        path.visible = true;
    }

    // ---
    // UNUSED METHODS

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
