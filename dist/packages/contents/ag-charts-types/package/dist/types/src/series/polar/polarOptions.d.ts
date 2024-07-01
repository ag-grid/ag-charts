import type { AgBaseThemeableChartOptions } from '../../chart/chartOptions';
import type { AgAngleCategoryAxisOptions, AgAngleNumberAxisOptions } from '../../chart/polarAxisOptions';
import type { AgRadiusCategoryAxisOptions, AgRadiusNumberAxisOptions } from '../../chart/radiusAxisOptions';
import type { AgDonutSeriesOptions } from './donutOptions';
import type { AgNightingaleSeriesOptions } from './nightingaleOptions';
import type { AgPieSeriesOptions } from './pieOptions';
import type { AgRadarAreaSeriesOptions } from './radarAreaOptions';
import type { AgRadarLineSeriesOptions } from './radarLineOptions';
import type { AgRadialBarSeriesOptions } from './radialBarOptions';
import type { AgRadialColumnSeriesOptions } from './radialColumnOptions';
export type AgPolarSeriesOptions = AgDonutSeriesOptions | AgPieSeriesOptions | AgRadarLineSeriesOptions | AgRadarAreaSeriesOptions | AgRadialBarSeriesOptions | AgRadialColumnSeriesOptions | AgNightingaleSeriesOptions;
export type AgPolarAxisOptions = AgAngleCategoryAxisOptions | AgAngleNumberAxisOptions | AgRadiusCategoryAxisOptions | AgRadiusNumberAxisOptions;
export type AgPolarAxisType = AgPolarAxisOptions['type'];
export interface AgBasePolarChartOptions {
    /** Series configurations. */
    series?: AgPolarSeriesOptions[];
    /** Axis configurations. */
    axes?: AgPolarAxisOptions[];
}
export interface AgAngleCategoryAxisThemeOptions extends Omit<AgAngleCategoryAxisOptions, 'type'> {
}
export interface AgAngleNumberAxisThemeOptions extends Omit<AgAngleNumberAxisOptions, 'type'> {
}
export interface AgRadiusCategoryAxisThemeOptions extends Omit<AgRadiusCategoryAxisOptions, 'type'> {
}
export interface AgRadiusNumberAxisThemeOptions extends Omit<AgRadiusNumberAxisOptions, 'type'> {
}
export interface AgPolarAxesTheme {
    'angle-category'?: AgAngleCategoryAxisThemeOptions;
    'angle-number'?: AgAngleNumberAxisThemeOptions;
    'radius-category'?: AgRadiusCategoryAxisThemeOptions;
    'radius-number'?: AgRadiusNumberAxisThemeOptions;
}
export interface AgBasePolarThemeOptions extends AgBaseThemeableChartOptions {
    /** Axis configurations. */
    axes?: AgPolarAxesTheme;
}
