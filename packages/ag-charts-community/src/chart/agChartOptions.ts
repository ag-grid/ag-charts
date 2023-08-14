import type { AgCartesianChartOptions } from './series/cartesian/cartesianOptions';
import type { AgHierarchyChartOptions } from './series/hierarchy/hierarchyOptions';
import type { AgPolarChartOptions } from './series/polar/polarOptions';

export * from './options/axisOptions';
export * from './options/crosshairOptions';
export * from './options/chartOptions';
export * from './options/crossLineOptions';
export * from './options/eventOptions';
export * from './options/legendOptions';
export * from './options/polarAxisOptions';
export * from './options/tooltipOptions';
export * from './options/themeOptions';
export * from './options/types';
export * from './options/zoomOptions';
export * from './series/seriesOptions';
export * from './series/cartesian/cartesianOptions';
export * from './series/cartesian/areaOptions';
export * from './series/cartesian/barOptions';
export * from './series/cartesian/lineOptions';
export * from './series/cartesian/heatmapOptions';
export * from './series/cartesian/histogramOptions';
export * from './series/cartesian/rangeBarOptions';
export * from './series/cartesian/scatterOptions';
export * from './series/cartesian/waterfallOptions';
export * from './series/hierarchy/hierarchyOptions';
export * from './series/hierarchy/treemapOptions';
export * from './series/polar/nightingaleOptions';
export * from './series/polar/pieOptions';
export * from './series/polar/polarOptions';
export * from './series/polar/radarOptions';
export * from './series/polar/radarLineOptions';
export * from './series/polar/radarAreaOptions';
export * from './series/polar/radialColumnOptions';

export type AgChartOptions = AgCartesianChartOptions | AgPolarChartOptions | AgHierarchyChartOptions;
export interface AgChartInstance {
    /** Get the `AgChartOptions` representing the current chart configuration. */
    getOptions(): AgChartOptions;
    /** Destroy the chart instance and any allocated resources to support its rendering. */
    destroy(): void;
}

/**
 * Internal Use Only: Used to ensure this file is treated as a module until we can use moduleDetection flag in Ts v4.7
 */
export const __FORCE_MODULE_DETECTION = 0;
