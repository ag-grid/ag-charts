import type { AgBaseThemeableChartOptions } from '../../chart/chartOptions';
import type { GeoJSON, TContextDefault, TDatumDefault } from '../../chart/types';
import type { AgMapLineBackgroundOptions } from './mapLineBackgroundOptions';
import type { AgMapLineSeriesOptions } from './mapLineOptions';
import type { AgMapMarkerSeriesOptions } from './mapMarkerOptions';
import type { AgMapShapeBackgroundOptions } from './mapShapeBackgroundOptions';
import type { AgMapShapeSeriesOptions } from './mapShapeOptions';

export type AgTopologySeriesOptions<TDatum = TDatumDefault, TContext = TContextDefault> =
    | AgMapShapeSeriesOptions<TDatum, TContext>
    | AgMapLineSeriesOptions<TDatum, TContext>
    | AgMapMarkerSeriesOptions<TDatum, TContext>
    | AgMapShapeBackgroundOptions
    | AgMapLineBackgroundOptions;

export interface AgBaseTopologyChartOptions<TDatum = TDatumDefault, TContext = TContextDefault> {
    /** Series configurations. */
    series?: AgTopologySeriesOptions<TDatum, TContext>[];
    /** Topology to use in all series. */
    topology?: GeoJSON;
}

export interface AgBaseTopologyThemeOptions<TDatum = TDatumDefault, TContext = TContextDefault>
    extends AgBaseThemeableChartOptions<TDatum, TContext> {}
