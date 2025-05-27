import type { AgBaseThemeableChartOptions } from '../../chart/chartOptions';
import type { FormatterConfiguration } from '../../chart/formatterOptions';
import type { TContextDefault, TDatumDefault } from '../../chart/types';
import type { AgPyramidSeriesOptions } from './pyramidOptions';

export type AgStandaloneFormatterPropertyType = 'y';

export type AgStandaloneFormatter<TDatum = any> = FormatterConfiguration<TDatum, AgStandaloneFormatterPropertyType>;

export type AgStandaloneSeriesOptions<TDatum = TDatumDefault, TContext = TContextDefault> = AgPyramidSeriesOptions<
    TDatum,
    TContext
>;

export interface AgBaseStandaloneChartOptions<TDatum = TDatumDefault, TContext = TContextDefault> {
    /** Series configurations. */
    series?: AgStandaloneSeriesOptions<TDatum, TContext>[];
    /** Global formatter configuration. */
    formatter?: AgStandaloneFormatter<TDatum>;
}

export interface AgBaseStandaloneThemeOptions<TDatum = TContextDefault> extends AgBaseThemeableChartOptions<TDatum> {}
