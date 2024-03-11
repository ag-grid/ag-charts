import type { GeoJSON } from '../../agChartOptions';
import type { AgBaseThemeableChartOptions } from '../../chart/chartOptions';
import type { AgMapLineSeriesOptions } from './mapLineOptions';
import type { AgMapMarkerSeriesOptions } from './mapMarkerOptions';
import type { AgMapShapeAccessoryOptions } from './mapShapeAccessoryOptions';
import type { AgMapShapeSeriesOptions } from './mapShapeOptions';

export type AgTopologySeriesOptions =
    | AgMapShapeSeriesOptions
    | AgMapLineSeriesOptions
    | AgMapMarkerSeriesOptions
    | AgMapShapeAccessoryOptions;

export interface AgBaseTopologyChartOptions {
    /** Series configurations. */
    series?: AgTopologySeriesOptions[];
    /** Topology to use in all series. */
    topology?: GeoJSON;
}

export interface AgBaseTopologyThemeOptions extends AgBaseThemeableChartOptions {}
