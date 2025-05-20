import type { AgBaseThemeableChartOptions } from '../../chart/chartOptions';
import type { GeoJSON } from '../../chart/types';
import type { AgMapLineBackgroundOptions } from './mapLineBackgroundOptions';
import type { AgMapLineSeriesOptions } from './mapLineOptions';
import type { AgMapMarkerSeriesOptions } from './mapMarkerOptions';
import type { AgMapShapeBackgroundOptions } from './mapShapeBackgroundOptions';
import type { AgMapShapeSeriesOptions } from './mapShapeOptions';

export type AgTopologySeriesOptions<TDatum, TContext> =
    | AgMapShapeSeriesOptions<TDatum, TContext>
    | AgMapLineSeriesOptions<TDatum, TContext>
    | AgMapMarkerSeriesOptions<TDatum, TContext>
    | AgMapShapeBackgroundOptions
    | AgMapLineBackgroundOptions;

export interface AgBaseTopologyChartOptions<TDatum, TContext> {
    /** Series configurations. */
    series?: AgTopologySeriesOptions<TDatum, TContext>[];
    /** Topology to use in all series. */
    topology?: GeoJSON;
}

export interface AgBaseTopologyThemeOptions<TDatum> extends AgBaseThemeableChartOptions<TDatum> {}
