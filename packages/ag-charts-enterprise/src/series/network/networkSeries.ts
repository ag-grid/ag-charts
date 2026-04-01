import { type AgActiveItemState, _ModuleSupport } from 'ag-charts-community';
import type { ChartAnimationPhase, ChartAxisDirection } from 'ag-charts-core';

import { NetworkGraph } from './networkGraph';

type NetworkSeriesDatumIndex = number;

interface NetworkSeriesDatum extends _ModuleSupport.SeriesNodeDatum<number> {}

interface NetworkSeriesOptions {}

class NetworkSeriesProperties extends _ModuleSupport.SeriesProperties<object> {
    readonly tooltip = _ModuleSupport.makeSeriesTooltip<any>();
}

/**
 *
 */
export abstract class AbstractNetworkSeries<
    NetworkVertex = unknown,
    NetworkEdge = undefined,
> extends _ModuleSupport.Series<
    NetworkSeriesDatumIndex,
    NetworkSeriesDatum,
    NetworkSeriesOptions,
    NetworkSeriesProperties
> {
    override properties = new NetworkSeriesProperties();

    private readonly graph: NetworkGraph<NetworkVertex, NetworkEdge>;

    constructor(moduleCtx: _ModuleSupport.ModuleContext) {
        super({ moduleCtx, pickModes: [] });

        this.graph = this.createNetworkGraph();
    }

    abstract createNetworkGraph(): NetworkGraph<NetworkVertex, NetworkEdge>;

    dataCount() {
        return this.graph.getVertexCount();
    }

    processData(_dataController: _ModuleSupport.DataController) {
        return;
    }

    createNodeData() {
        return undefined;
    }

    findNodeDatum(_itemIdOrIndex: AgActiveItemState['itemId']): NetworkSeriesDatum | undefined {
        return undefined;
    }

    update(_opts: { seriesRect?: _ModuleSupport.BBox }) {
        return;
    }

    hasItemStylers() {
        return false;
    }

    getTooltipContent(
        _datumIndex: NetworkSeriesDatumIndex,
        _removeThisDatum: NetworkSeriesDatum | undefined
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
