// @todo(xxxx) - backwards compat - delete this file
import type { AgBaseThemeableChartOptions } from '../../chart/chartOptions';
import type { TContextDefault, TDatumDefault } from '../../chart/types';
import type { AgSunburstSeriesOptions } from './sunburstOptions';
import type { AgTreemapSeriesOptions } from './treemapOptions';

export type AgHierarchySeriesOptions<TDatum = TDatumDefault, TContext = TContextDefault> =
    | AgTreemapSeriesOptions<TDatum, TContext>
    | AgSunburstSeriesOptions<TDatum, TContext>;

export interface AgBaseHierarchyChartOptions<TDatum = TDatumDefault, TContext = TContextDefault> {
    /** Series configurations. */
    series?: AgHierarchySeriesOptions<TDatum, TContext>[];
}

export interface AgBaseHierarchyThemeOptions<TDatum = TDatumDefault, TContext = TContextDefault>
    extends AgBaseThemeableChartOptions<TDatum, TContext> {}
