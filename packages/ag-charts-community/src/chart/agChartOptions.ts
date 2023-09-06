import type { AgBaseChartOptions } from './options/chartOptions';
import type { AgBaseChartTheme, AgBaseChartThemeOptions, AgBaseChartThemeOverrides } from './options/themeOptions';
import type { AgBaseCartesianChartOptions, AgBaseCartesianThemeOptions } from './series/cartesian/cartesianOptions';
import type { AgBaseHierarchyChartOptions, AgBaseHierarchyThemeOptions } from './series/hierarchy/hierarchyOptions';
import type { AgBasePolarChartOptions, AgBasePolarThemeOptions } from './series/polar/polarOptions';

export * from './options/axisOptions';
export * from './options/crosshairOptions';
export * from './options/chartOptions';
export * from './options/crossLineOptions';
export * from './options/dropShadowOptions';
export * from './options/eventOptions';
export * from './options/labelOptions';
export * from './options/legendOptions';
export * from './options/polarAxisOptions';
export * from './options/tooltipOptions';
export * from './options/themeOptions';
export * from './options/types';
export * from './options/zoomOptions';
export * from './series/seriesOptions';
export * from './series/cartesian/cartesianOptions';
export * from './series/cartesian/cartesianLabelOptions';
export * from './series/cartesian/cartesianSeriesMarkerOptions';
export * from './series/cartesian/cartesianSeriesTooltipOptions';
export * from './series/cartesian/cartesianSeriesTypes';
export * from './series/cartesian/areaOptions';
export * from './series/cartesian/barOptions';
export * from './series/cartesian/boxPlotOptions';
export * from './series/cartesian/commonOptions';
export * from './series/cartesian/lineOptions';
export * from './series/cartesian/heatmapOptions';
export * from './series/cartesian/histogramOptions';
export * from './series/cartesian/rangeBarOptions';
export * from './series/cartesian/rangeAreaOptions';
export * from './series/cartesian/scatterOptions';
export * from './series/cartesian/waterfallOptions';
export * from './series/hierarchy/hierarchyOptions';
export * from './series/hierarchy/treemapOptions';
export * from './series/polar/nightingaleOptions';
export * from './series/polar/pieOptions';
export * from './series/polar/polarOptions';
export * from './series/polar/polarTooltipOptions';
export * from './series/polar/radarOptions';
export * from './series/polar/radarLineOptions';
export * from './series/polar/radarAreaOptions';
export * from './series/polar/radialColumnOptions';

export interface AgCartesianChartOptions extends AgBaseCartesianChartOptions, AgBaseChartOptions {}
export interface AgPolarChartOptions extends AgBasePolarChartOptions, AgBaseChartOptions {}
export interface AgHierarchyChartOptions extends AgBaseHierarchyChartOptions, AgBaseChartOptions<any> {}
export type AgChartOptions = AgCartesianChartOptions | AgPolarChartOptions | AgHierarchyChartOptions;

export interface AgChartThemeOptions extends AgBaseChartThemeOptions<AgBaseChartOptions> {}
export type AgChartTheme = AgBaseChartTheme<AgBaseChartOptions>;
export type AgChartThemeOverrides = AgBaseChartThemeOverrides<AgBaseChartOptions>;
export type AgCartesianThemeOptions = AgBaseCartesianThemeOptions & AgBaseChartOptions;
export type AgPolarThemeOptions = AgBasePolarThemeOptions & AgBaseChartOptions;
export type AgHierarchyThemeOptions = AgBaseHierarchyThemeOptions & AgBaseChartOptions;

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
