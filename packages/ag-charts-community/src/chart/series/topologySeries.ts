import { DataModelSeries } from './dataModelSeries';
import { Series, type SeriesNodeDataContext } from './series';
import { SeriesProperties } from './seriesProperties';
import type { SeriesNodeDatum } from './seriesTypes';
import type { LonLatBBox } from './topology/lonLatBbox';
import type { MercatorScale } from './topology/mercatorScale';

export interface ITopology extends Series<any, any> {
    topologyBounds: LonLatBBox | undefined;
    scale: MercatorScale | undefined;
    setChartTopology(topology: any): void;
}

export interface TopologySeriesNodeDatum extends SeriesNodeDatum {}

export interface TopologySeriesNodeDataContext<
    TDatum extends TopologySeriesNodeDatum = TopologySeriesNodeDatum,
    TLabel extends {} = {},
> extends SeriesNodeDataContext<TDatum, TLabel> {}

export abstract class TopologySeriesProperties<T extends object> extends SeriesProperties<T> {}

export abstract class TopologySeries<
    TDatum extends TopologySeriesNodeDatum,
    TProps extends TopologySeriesProperties<any>,
    TLabel extends {},
    TContext extends TopologySeriesNodeDataContext<TDatum, TLabel> = TopologySeriesNodeDataContext<TDatum, TLabel>,
> extends DataModelSeries<TDatum, TProps, TLabel, TContext> {
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
