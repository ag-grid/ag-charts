import { _ModuleSupport } from 'ag-charts-community';

interface TopologySeriesNodeDatum<TStyle> extends _ModuleSupport.DataModelSeriesNodeDatum<TStyle> {}

interface TopologySeriesNodeDataContext<
    TStyle extends object,
    TDatum extends TopologySeriesNodeDatum<TStyle> = TopologySeriesNodeDatum<TStyle>,
    TLabel extends object = object,
> extends _ModuleSupport.DataModelSeriesNodeDataContext<TDatum, TLabel> {}

abstract class TopologySeriesProperties<T extends object> extends _ModuleSupport.SeriesProperties<T> {}

export abstract class TopologySeries<
    TDatum extends TopologySeriesNodeDatum<TStyle>,
    TOpts extends object,
    TProps extends TopologySeriesProperties<TOpts>,
    TStyle extends object,
    TLabel extends object,
    TContext extends TopologySeriesNodeDataContext<TStyle, TDatum, TLabel> = TopologySeriesNodeDataContext<
        TStyle,
        TDatum,
        TLabel
    >,
> extends _ModuleSupport.DataModelSeries<TDatum, TOpts, TProps, TStyle, TLabel, TContext> {
    override addChartEventListeners(): void {
        this.cleanup.register(
            this.ctx.eventsHub.on('legend:item-click', (event) => {
                this.onLegendItemClick(event);
            }),
            this.ctx.eventsHub.on('legend:item-double-click', (event) => {
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
}
