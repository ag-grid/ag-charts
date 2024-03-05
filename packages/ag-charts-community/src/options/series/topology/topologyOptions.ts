import type { AgBaseThemeableChartOptions } from '../../chart/chartOptions';
import type { AgMapMarkerSeriesOptions } from './mapMarkerOptions';
import type { AgMapSeriesOptions } from './mapOptions';

export type AgTopologySeriesOptions = AgMapSeriesOptions | AgMapMarkerSeriesOptions;

export interface AgBaseTopologyChartOptions {
    /** Series configurations. */
    series?: AgTopologySeriesOptions[];
}

export interface AgBaseTopologyThemeOptions extends AgBaseThemeableChartOptions {}
