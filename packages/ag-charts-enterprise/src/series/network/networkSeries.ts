import { type AgActiveItemState, _ModuleSupport } from 'ag-charts-community';
import { type ChartAnimationPhase, type ChartAxisDirection, Property, Vertex } from 'ag-charts-core';

import { NetworkGraph } from './networkGraph';

export type NetworkSeriesDatumIndex = number;

export interface NetworkSeriesDatum<NetworkVertex, NetworkEdge>
    extends _ModuleSupport.SeriesNodeDatum<NetworkSeriesDatumIndex> {
    vertex: Vertex<NetworkVertex, NetworkEdge>;
}

export interface NetworkSeriesOptions {}

export class NetworkSeriesProperties extends _ModuleSupport.SeriesProperties<object> {
    @Property
    readonly tooltip = _ModuleSupport.makeSeriesTooltip<any>();
}

export interface NetworkSeriesContextNodeData<NetworkVertex, NetworkEdge>
    extends _ModuleSupport.SeriesNodeDataContext<
        NetworkSeriesDatumIndex,
        NetworkSeriesDatum<NetworkVertex, NetworkEdge>
    > {}

/**
 *
 */
export abstract class AbstractNetworkSeries<
    NetworkVertex = unknown,
    NetworkEdge = undefined,
    TNetworkGraph extends NetworkGraph<NetworkVertex, NetworkEdge> = NetworkGraph<NetworkVertex, NetworkEdge>,
    TNode extends _ModuleSupport.Node = _ModuleSupport.Node,
    TDatum extends NetworkSeriesDatum<NetworkVertex, NetworkEdge> = NetworkSeriesDatum<NetworkVertex, NetworkEdge>,
> extends _ModuleSupport.Series<
    NetworkSeriesDatumIndex,
    NetworkSeriesDatum<NetworkVertex, NetworkEdge>,
    NetworkSeriesOptions,
    NetworkSeriesProperties
> {
    override properties = new NetworkSeriesProperties();

    protected dataModel?: _ModuleSupport.DataModel<any, any, any>;
    protected processedData?: _ModuleSupport.ProcessedData<any>;

    protected readonly graph: TNetworkGraph;

    protected readonly dataNodeGroup = this.contentGroup.appendChild(
        new _ModuleSupport.TranslatableGroup({ name: `${this.id}-series-dataNodes`, zIndex: 1 })
    );

    protected readonly datumSelection: _ModuleSupport.Selection<TNode, TDatum> = _ModuleSupport.Selection.select(
        this.dataNodeGroup,
        () => this.nodeFactory()
    );

    protected contextNodeData?: NetworkSeriesContextNodeData<NetworkVertex, NetworkEdge>;

    constructor(moduleCtx: _ModuleSupport.ModuleContext) {
        super({ moduleCtx, pickModes: [] });

        this.graph = this.createNetworkGraph();
    }

    abstract createNetworkGraph(): TNetworkGraph;

    abstract nodeFactory(): TNode;

    dataCount() {
        return this.graph.getVertexCount();
    }

    findNodeDatum(
        _itemIdOrIndex: AgActiveItemState['itemId']
    ): NetworkSeriesDatum<NetworkVertex, NetworkEdge> | undefined {
        return undefined;
    }

    override update(_opts: { seriesRect?: _ModuleSupport.BBox }) {
        console.log('NetworkSeries.update()');
        // TODO: this.contentGroup.batchedUpdate() ?

        this.updateSelections();
        this.updateNodes();
    }

    private updateSelections() {
        this.contextNodeData = this.createNodeData();
        if (!this.contextNodeData) return;

        this.datumSelection.update(this.contextNodeData.nodeData as TDatum[]);
    }

    private updateNodes() {
        this.updateDatumNodes(this.datumSelection);
    }

    abstract updateDatumNodes(datumSelection: _ModuleSupport.Selection<TNode, TDatum>): void;

    hasItemStylers() {
        return false;
    }

    getTooltipContent(
        _datumIndex: NetworkSeriesDatumIndex,
        _removeThisDatum: NetworkSeriesDatum<NetworkVertex, NetworkEdge> | undefined
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
