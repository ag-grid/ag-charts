import type { AgBaseThemeableChartOptions } from '../../chart/chartOptions';
import type { AgTreemapSeriesOptions } from './treemapOptions';

export type AgHierarchySeriesOptions = AgTreemapSeriesOptions;

export interface AgBaseHierarchyChartOptions<TDatum = any> {
    data?: TDatum[];
    /** Series configurations. */
    series?: AgHierarchySeriesOptions[];
}

export interface AgBaseHierarchyThemeOptions extends AgBaseThemeableChartOptions {}
