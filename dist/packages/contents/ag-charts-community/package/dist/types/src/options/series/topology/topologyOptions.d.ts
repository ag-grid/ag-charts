import type { AgBaseThemeableChartOptions } from '../../chart/chartOptions';
import type { GeoJSON } from '../../chart/types';
import type { AgMapLineBackgroundOptions } from './mapLineBackgroundOptions';
import type { AgMapLineSeriesOptions } from './mapLineOptions';
import type { AgMapMarkerSeriesOptions } from './mapMarkerOptions';
import type { AgMapShapeBackgroundOptions } from './mapShapeBackgroundOptions';
import type { AgMapShapeSeriesOptions } from './mapShapeOptions';
export type AgTopologySeriesOptions = AgMapShapeSeriesOptions | AgMapLineSeriesOptions | AgMapMarkerSeriesOptions | AgMapShapeBackgroundOptions | AgMapLineBackgroundOptions;
export interface AgBaseTopologyChartOptions {
    /** Series configurations. */
    series?: AgTopologySeriesOptions[];
    /** Topology to use in all series. */
    topology?: GeoJSON;
}
export interface AgBaseTopologyThemeOptions extends AgBaseThemeableChartOptions {
}
