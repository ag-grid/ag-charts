import { _ModuleSupport } from 'ag-charts-community';

export interface TopologySeriesNodeDatum extends _ModuleSupport.SeriesNodeDatum {}

export interface TopologySeriesNodeDataContext<
    TDatum extends TopologySeriesNodeDatum = TopologySeriesNodeDatum,
    TLabel extends object = object,
> extends _ModuleSupport.SeriesNodeDataContext<TDatum, TLabel> {}

export abstract class TopologySeriesProperties<T extends object> extends _ModuleSupport.SeriesProperties<T> {}

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
}
