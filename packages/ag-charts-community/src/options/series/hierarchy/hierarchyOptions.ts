import type { AgBaseThemeableChartOptions } from '../../chart/chartOptions';
import type { AgTreemapSeriesOptions } from './treemapOptions';

export type AgHierarchySeriesOptions = AgTreemapSeriesOptions;

export interface AgBaseHierarchyChartOptions {
    data?: any;
    /** Series configurations. */
    series?: AgHierarchySeriesOptions[];
}

export interface AgBaseHierarchyThemeOptions extends AgBaseThemeableChartOptions {}
