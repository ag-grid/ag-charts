import type { AgBaseThemeableChartOptions } from '../../chart/chartOptions';
import type { AgPyramidSeriesOptions } from './pyramidOptions';

export type AgStandaloneSeriesOptions<TDatum, TContext> = AgPyramidSeriesOptions<TDatum, TContext>;

export interface AgBaseStandaloneChartOptions<TDatum, TContext> {
    /** Series configurations. */
    series?: AgStandaloneSeriesOptions<TDatum, TContext>[];
}

export interface AgBaseStandaloneThemeOptions<TDatum> extends AgBaseThemeableChartOptions<TDatum> {}
