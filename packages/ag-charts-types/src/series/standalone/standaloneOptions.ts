import type { AgBaseThemeableChartOptions } from '../../chart/chartOptions';
import type { AgPyramidSeriesOptions } from './pyramidOptions';

export type AgStandaloneSeriesOptions<TDatum> = AgPyramidSeriesOptions<TDatum>;

export interface AgBaseStandaloneChartOptions<TDatum> {
    /** Series configurations. */
    series?: AgStandaloneSeriesOptions<TDatum>[];
}

export interface AgBaseStandaloneThemeOptions<TDatum> extends AgBaseThemeableChartOptions<TDatum> {}
