import { type AgFillType, _ModuleSupport } from 'ag-charts-community';

interface TopologySeriesNodeDatum extends _ModuleSupport.DataModelSeriesNodeDatum {}

interface TopologySeriesNodeDataContext<
    TDatum extends TopologySeriesNodeDatum = TopologySeriesNodeDatum,
    TLabel extends object = object,
> extends _ModuleSupport.DataModelSeriesNodeDataContext<TDatum, TLabel> {}

const { isGradientFill } = _ModuleSupport;

abstract class TopologySeriesProperties<T extends object> extends _ModuleSupport.SeriesProperties<T> {}

export abstract class TopologySeries<
    TDatum extends TopologySeriesNodeDatum,
    TProps extends TopologySeriesProperties<any>,
    TLabel extends object,
    TContext extends TopologySeriesNodeDataContext<TDatum, TLabel> = TopologySeriesNodeDataContext<TDatum, TLabel>,
> extends _ModuleSupport.DataModelSeries<TDatum, TProps, TLabel, TContext> {
    override addChartEventListeners(): void {
        this.destroyFns.push(
            this.ctx.chartEventManager.addListener('legend-item-click', (event) => {
                this.onLegendItemClick(event);
            }),
            this.ctx.chartEventManager.addListener('legend-item-double-click', (event) => {
                this.onLegendItemDoubleClick(event);
            })
        );
    }

    override getSeriesDomain() {
        return [NaN, NaN];
    }

    override getSeriesRange(
        _direction: _ModuleSupport.ChartAxisDirection,
        _visibleRange: [any, any]
    ): [number, number] {
        return [NaN, NaN];
    }

    protected getNodeFill(fill: AgFillType, defaultColorRange: string[]): Required<AgFillType> {
        if (!isGradientFill(fill)) return fill;

        return {
            type: 'gradient',
            gradient: fill.gradient ?? 'linear',
            bounds: fill.bounds ?? 'item',
            colorStops: fill.colorStops ?? defaultColorRange.map((color) => ({ color })),
            rotation: fill.rotation ?? 0,
        };
    }
}
