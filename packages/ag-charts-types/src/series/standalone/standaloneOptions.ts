import type { AgBaseThemeableChartOptions } from '../../chart/chartOptions';
import type { TContextDefault, TDatumDefault } from '../../chart/types';
import type { AgPyramidSeriesOptions } from './pyramidOptions';

export type AgStandaloneSeriesOptions<TDatum = TDatumDefault, TContext = TContextDefault> = AgPyramidSeriesOptions<
    TDatum,
    TContext
>;

export interface AgBaseStandaloneChartOptions<TDatum = TDatumDefault, TContext = TContextDefault> {
    /** Series configurations. */
    series?: AgStandaloneSeriesOptions<TDatum, TContext>[];
}

export interface AgBaseStandaloneThemeOptions<TDatum = TContextDefault> extends AgBaseThemeableChartOptions<TDatum> {}
