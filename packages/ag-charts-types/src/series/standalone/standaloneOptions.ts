import type { AgBaseThemeableChartOptions } from '../../chart/chartOptions';
import type { AgPyramidSeriesOptions } from './pyramidOptions';

export type AgStandaloneSeriesOptions = AgPyramidSeriesOptions;

export interface AgBaseStandaloneChartOptions {
    /** Series configurations. */
    series?: AgStandaloneSeriesOptions[];
}

export interface AgBaseStandaloneThemeOptions extends AgBaseThemeableChartOptions {}
