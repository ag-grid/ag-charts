import type { AgContextMenuOptions } from '../../options/contextOptions';
import type { AgChartBaseLegendOptions } from '../../options/legendOptions';
import type { AgTreemapSeriesOptions } from './treemapOptions';

export type AgHierarchySeriesOptions = AgTreemapSeriesOptions;

export interface AgBaseHierarchyChartOptions {
    data?: any;
    /** Series configurations. */
    series?: AgHierarchySeriesOptions[];
    /** Configuration for the chart legend. */
    legend?: AgHierarchyChartLegendOptions;
    contextMenu?: AgContextMenuOptions;
}

export interface AgBaseHierarchyThemeOptions<S> {
    /** Series configurations. */
    series?: S;
    /** Configuration for the chart legend. */
    legend?: AgHierarchyChartLegendOptions;
}

export interface AgHierarchyChartLegendOptions extends AgChartBaseLegendOptions {
    /** Whether or not to show the legend. By default, the chart displays a legend when there is more than one series present. */
    enabled?: boolean;
}
