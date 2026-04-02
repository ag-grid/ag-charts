import type { AgSeriesTooltip, AgSeriesTooltipRendererParams } from '../../chart/tooltipOptions';
import type { ContextDefault, DatumDefault } from '../../chart/types';
import type { AgBaseSeriesOptions, AgBaseSeriesThemeableOptions } from '../seriesOptions';

export interface AgOrganisationSeriesOptions<TDatum = DatumDefault, TContext = ContextDefault>
    extends AgBaseSeriesOptions<TDatum, TContext>,
        AgOrganisationSeriesOptionsKeys,
        AgOrganisationSeriesThemeableOptions<TDatum, TContext> {
    /** Configuration for the Organisation Series. */
    type: 'organization';
}

export interface AgOrganisationSeriesOptionsKeys {
    idKey?: string;
    parentIdKey?: string;
}

export interface AgOrganisationSeriesThemeableOptions<TDatum = DatumDefault, TContext = ContextDefault>
    extends AgBaseSeriesThemeableOptions<TDatum, TContext> {
    /** Series-specific tooltip configuration. */
    tooltip?: AgSeriesTooltip<AgOrganisationSeriesTooltipRendererParams<TDatum, TContext>>;
}

export interface AgOrganisationSeriesTooltipRendererParams<TDatum, TContext = ContextDefault>
    extends AgSeriesTooltipRendererParams<TDatum, TContext>,
        AgOrganisationSeriesOptionsKeys {}
