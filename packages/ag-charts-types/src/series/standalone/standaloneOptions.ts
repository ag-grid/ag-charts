import type { AgBaseThemeableChartOptions } from '../../chart/chartOptions';
import type { TContextDefault, TDatumDefault } from '../../chart/types';
import type { AgPyramidSeriesOptions } from './pyramidOptions';
import type { AgSunburstSeriesOptions } from './sunburstOptions';
import type { AgTreemapSeriesOptions } from './treemapOptions';

export type AgStandaloneSeriesOptions<TDatum = TDatumDefault, TContext = TContextDefault> =
    | AgPyramidSeriesOptions<TDatum, TContext>
    | AgTreemapSeriesOptions<TDatum, TContext>
    | AgSunburstSeriesOptions<TDatum, TContext>;

export interface AgBaseStandaloneChartOptions<TDatum = TDatumDefault, TContext = TContextDefault> {
    /** Series configurations. */
    series?: AgStandaloneSeriesOptions<TDatum, TContext>[];
}

export interface AgBaseStandaloneThemeOptions<TDatum = TContextDefault, TContext = TContextDefault>
    extends AgBaseThemeableChartOptions<TDatum, TContext> {}
