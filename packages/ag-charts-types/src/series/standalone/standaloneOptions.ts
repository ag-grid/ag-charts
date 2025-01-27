import type { AgBaseThemeableChartOptions } from '../../chart/chartOptions';
import type { AgPyramidSeriesOptions } from './pyramidOptions';

export interface AgStandaloneSeriesOptions extends AgPyramidSeriesOptions {}

export interface AgBaseStandaloneChartOptions {
    /** Series configurations. */
    series?: AgStandaloneSeriesOptions[];
}

export interface AgBaseStandaloneThemeOptions extends AgBaseThemeableChartOptions {}
