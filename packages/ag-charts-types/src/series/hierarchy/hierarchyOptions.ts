import type { AgBaseThemeableChartOptions } from '../../chart/chartOptions';
import type { AgSunburstSeriesOptions } from './sunburstOptions';
import type { AgTreemapSeriesOptions } from './treemapOptions';

export type AgHierarchySeriesOptions<TDatum> = AgTreemapSeriesOptions<TDatum> | AgSunburstSeriesOptions<TDatum>;

export interface AgBaseHierarchyChartOptions<TDatum> {
    /** Series configurations. */
    series?: AgHierarchySeriesOptions<TDatum>[];
}

export interface AgBaseHierarchyThemeOptions<TDatum> extends AgBaseThemeableChartOptions<TDatum> {}
