import type { ContextDefault, DatumDefault } from '../../chart/types';
import type { AgBaseSeriesOptions, AgBaseSeriesThemeableOptions } from '../seriesOptions';

export interface AgOrganisationSeriesOptions<TDatum = DatumDefault, TContext = ContextDefault>
    extends AgBaseSeriesOptions<TDatum, TContext> {
    /** Configuration for the Organisation Series. */
    type: 'organisation';
}

export interface AgOrganisationSeriesThemeableOptions<TDatum = DatumDefault, TContext = ContextDefault>
    extends AgBaseSeriesThemeableOptions<TDatum, TContext> {}
