import type { AgBaseThemeableChartOptions } from '../../chart/chartOptions';
import type { AgSunburstSeriesOptions } from './sunburstOptions';
import type { AgTreemapSeriesOptions } from './treemapOptions';

export type AgHierarchySeriesOptions<TDatum, TContext> =
    | AgTreemapSeriesOptions<TDatum, TContext>
    | AgSunburstSeriesOptions<TDatum, TContext>;

export interface AgBaseHierarchyChartOptions<TDatum, TContext> {
    /** Series configurations. */
    series?: AgHierarchySeriesOptions<TDatum, TContext>[];
}

export interface AgBaseHierarchyThemeOptions<TDatum> extends AgBaseThemeableChartOptions<TDatum> {}
