import type { AgBaseThemeableChartOptions } from '../../chart/chartOptions';
import type { AgMapSeriesOptions } from './mapOptions';

export type AgTopologySeriesOptions = AgMapSeriesOptions;

export interface AgBaseTopologyChartOptions {
    /** Series configurations. */
    series?: AgTopologySeriesOptions[];
}

export interface AgBaseTopologyThemeOptions extends AgBaseThemeableChartOptions {}
