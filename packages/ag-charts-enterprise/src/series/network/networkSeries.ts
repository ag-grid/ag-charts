import { type AgActiveItemState, _ModuleSupport } from 'ag-charts-community';
import { type ChartAnimationPhase, type ChartAxisDirection, Property, Vec2, Vertex } from 'ag-charts-core';

import { NetworkGraph } from './networkGraph';
import type { NetworkLayout } from './networkLayout';

export type NetworkSeriesDatumIndex = number;

export interface NetworkSeriesDatum<NetworkVertex, TNetworkEdge>
    extends _ModuleSupport.SeriesNodeDatum<NetworkSeriesDatumIndex> {
    bbox: _ModuleSupport.BBox;
    vertex: Vertex<NetworkVertex, TNetworkEdge>;
}

export interface NetworkSeriesOptions {}

export class NetworkSeriesProperties extends _ModuleSupport.SeriesProperties<object> {
    @Property
    readonly tooltip = _ModuleSupport.makeSeriesTooltip<any>();
}

export interface NetworkSeriesContextNodeData<NetworkVertex, TNetworkEdge>
    extends _ModuleSupport.SeriesNodeDataContext<
        NetworkSeriesDatumIndex,
        NetworkSeriesDatum<NetworkVertex, TNetworkEdge>
    > {}

export type NetworkLinkNode = _ModuleSupport.TranslatableGroup;
export interface NetworkLinkDatum {}

/**
 *
 */
export abstract class AbstractNetworkSeries<
    TVertex,
    TEdge,
    TGraph extends NetworkGraph<TVertex, TEdge>,
    TNode extends _ModuleSupport.TranslatableGroup,
    TDatum extends NetworkSeriesDatum<TVertex, TEdge>,
    TLayout extends NetworkLayout<TVertex, TEdge>,
> extends _ModuleSupport.Series<
    NetworkSeriesDatumIndex,
    NetworkSeriesDatum<TVertex, TEdge>,
    NetworkSeriesOptions,
    NetworkSeriesProperties
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

    protected readonly datumSelection: _ModuleSupport.Selection<TNode, TDatum> = _ModuleSupport.Selection.select(
        this.dataNodeGroup,
        () => this.nodeFactory()
    );

    protected readonly linkSelection: _ModuleSupport.Selection<NetworkLinkNode, NetworkLinkDatum> =
        _ModuleSupport.Selection.select(this.linkGroup, () => this.linkFactory());

    protected contextNodeData?: NetworkSeriesContextNodeData<TVertex, TEdge>;

    constructor(moduleCtx: _ModuleSupport.ModuleContext) {
        super({ moduleCtx, pickModes: [] });

        this.graph = this.createNetworkGraph();
        this.layout = this.createNetworkLayout();
    }

    abstract createNetworkGraph(): TGraph;
    abstract createNetworkLayout(): TLayout;

    abstract nodeFactory(): TNode;

    private linkFactory(): NetworkLinkNode {
        return new _ModuleSupport.TranslatableGroup();
    }

    dataCount() {
        return this.graph.getVertexCount();
    }

    findNodeDatum(_itemIdOrIndex: AgActiveItemState['itemId']): NetworkSeriesDatum<TVertex, TEdge> | undefined {
        return undefined;
    }

    override update(_opts: { seriesRect?: _ModuleSupport.BBox }) {
        // TODO: this.contentGroup.batchedUpdate() ?

        this.updateSelections();
        this.updateNodes();
    }

    private updateSelections() {
        this.contextNodeData = this.createNodeData();
        if (!this.contextNodeData) return;

        this.updateDatumSelection(this.contextNodeData.nodeData as TDatum[], this.datumSelection);
        this.updateLinkSelection(this.contextNodeData.nodeData as TDatum[], this.linkSelection);
    }

    abstract updateDatumSelection(nodeData: TDatum[], datumSelection: _ModuleSupport.Selection<TNode, TDatum>): void;

    private updateLinkSelection(
        nodeData: TDatum[],
        linkSelection: _ModuleSupport.Selection<NetworkLinkNode, NetworkLinkDatum>
    ) {
        linkSelection.update(nodeData);
    }

    private updateNodes() {
        this.updateDatumNodes(this.datumSelection);
        this.updateLinkNodes(this.linkSelection);
        this.layout.update(
            this.graph,
            this.getRootVertices(),
            this.getDatumNodeBBox.bind(this),
            this.layoutDatumNode.bind(this),
            this.layoutLinkNode.bind(this)
        );
    }

    abstract updateDatumNodes(datumSelection: _ModuleSupport.Selection<TNode, TDatum>): void;
    abstract updateLinkNodes(linkSelection: _ModuleSupport.Selection<NetworkLinkNode, NetworkLinkDatum>): void;

    private getDatumNodeBBox(vertex: Vertex<any, any>) {
        const datumIndex = this.graph.findNeighbourValue(vertex, 'datumIndex' as TEdge);
        if (typeof datumIndex !== 'number') return;

        const group = this.datumSelection.at(datumIndex) as _ModuleSupport.Group | undefined;
        if (!group) return;

        return this.datumSelection.at(datumIndex)?.getBBox();
    }

    private layoutDatumNode(vertex: Vertex<TVertex, TEdge>, groupBBox: _ModuleSupport.BBox) {
        const datumIndex = this.graph.findNeighbourValue(vertex, 'datumIndex' as TEdge);
        if (typeof datumIndex !== 'number') return;

        this.positionDatumNode(this.datumSelection.at(datumIndex)!, groupBBox);
    }

    private layoutLinkNode(
        vertex: Vertex<TVertex, TEdge>,
        parentBBox: _ModuleSupport.BBox,
        childBBox: _ModuleSupport.BBox
    ) {
        const datumIndex = this.graph.findNeighbourValue(vertex, 'datumIndex' as TEdge);
        if (typeof datumIndex !== 'number') return;

        const link = this.linkSelection.at(datumIndex);
        if (!link) return;

        const path = link.children().next().value as _ModuleSupport.Path | undefined;
        if (!path) return;

        const start = Vec2.from(parentBBox.x + parentBBox.width / 2, parentBBox.y + parentBBox.height);
        const end = Vec2.from(childBBox.x + childBBox.width / 2, childBBox.y);
        const elbowDist = Vec2.from(0, (end.y - start.y) / 2);

        const elbow1 = Vec2.add(start, elbowDist);
        const elbow2 = Vec2.sub(end, elbowDist);

        path.path.moveTo(start.x, start.y);
        path.path.lineTo(elbow1.x, elbow1.y);
        path.path.lineTo(elbow2.x, elbow2.y);
        path.path.lineTo(end.x, end.y);

        path.visible = true;
    }

    abstract getRootVertices(): Vertex<TVertex, TEdge>[];
    abstract positionDatumNode(node: TNode, groupBBox: _ModuleSupport.BBox): void;

    hasItemStylers() {
        return false;
    }

    getTooltipContent(
        _datumIndex: NetworkSeriesDatumIndex,
        _removeThisDatum: NetworkSeriesDatum<TVertex, TEdge> | undefined
    ): _ModuleSupport.TooltipContent | undefined {
        return undefined;
    }

    getCategoryValue(_datumIndex: NetworkSeriesDatumIndex): any {
        return;
    }

    datumIndexForCategoryValue(_categoryValue: any): NetworkSeriesDatumIndex | undefined {
        return;
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
