import type { AgBaseThemeableChartOptions } from '../../chart/chartOptions';
import type { ContextDefault, DatumDefault } from '../../chart/types';
import type { AgPyramidSeriesOptions } from './pyramidOptions';

export type AgStandaloneSeriesOptions<TDatum = DatumDefault, TContext = ContextDefault> = AgPyramidSeriesOptions<
    TDatum,
    TContext
>;

export interface AgBaseStandaloneChartOptions<TDatum = DatumDefault, TContext = ContextDefault> {
    /** Series configurations. */
    series?: AgStandaloneSeriesOptions<TDatum, TContext>[];
}

export interface AgBaseStandaloneThemeOptions<TDatum = ContextDefault, TContext = ContextDefault>
    extends AgBaseThemeableChartOptions<TDatum, TContext> {}
