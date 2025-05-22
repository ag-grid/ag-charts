import type { AgDonutSeriesOptions } from '../series/polar/donutOptions';
import type { AgNightingaleSeriesOptions } from '../series/polar/nightingaleOptions';
import type { AgPieSeriesOptions } from '../series/polar/pieOptions';
import type { AgRadarAreaSeriesOptions } from '../series/polar/radarAreaOptions';
import type { AgRadarLineSeriesOptions } from '../series/polar/radarLineOptions';
import type { AgRadialBarSeriesOptions } from '../series/polar/radialBarOptions';
import type { AgRadialColumnSeriesOptions } from '../series/polar/radialColumnOptions';
import type { AgBaseThemeableChartOptions } from './chartOptions';
import type {
    AgAngleAxesCrossLineThemeOptions,
    AgAngleCategoryAxisOptions,
    AgAngleNumberAxisOptions,
} from './polarAxisOptions';
import type {
    AgRadiusAxesCrossLineThemeOptions,
    AgRadiusCategoryAxisOptions,
    AgRadiusNumberAxisOptions,
} from './radiusAxisOptions';

export type AgPolarSeriesOptions =
    | AgDonutSeriesOptions
    | AgPieSeriesOptions
    | AgRadarLineSeriesOptions
    | AgRadarAreaSeriesOptions
    | AgRadialBarSeriesOptions
    | AgRadialColumnSeriesOptions
    | AgNightingaleSeriesOptions;

export type AgPolarAxisOptions =
    | AgAngleCategoryAxisOptions
    | AgAngleNumberAxisOptions
    | AgRadiusCategoryAxisOptions
    | AgRadiusNumberAxisOptions;

export type AgPolarAxisType = AgPolarAxisOptions['type'];

export interface AgBasePolarChartOptions {
    /** Series configurations. */
    series?: AgPolarSeriesOptions[];

    /** Axis configurations. */
    axes?: AgPolarAxisOptions[];
}

export interface AgAngleCategoryAxisThemeOptions
    extends Omit<AgAngleCategoryAxisOptions, 'type' | 'crossLines'>,
        AgAngleAxesCrossLineThemeOptions {}
export interface AgAngleNumberAxisThemeOptions
    extends Omit<AgAngleNumberAxisOptions, 'type' | 'crossLines'>,
        AgAngleAxesCrossLineThemeOptions {}
export interface AgRadiusCategoryAxisThemeOptions
    extends Omit<AgRadiusCategoryAxisOptions, 'type' | 'crossLines'>,
        AgRadiusAxesCrossLineThemeOptions {}
export interface AgRadiusNumberAxisThemeOptions
    extends Omit<AgRadiusNumberAxisOptions, 'type' | 'crossLines'>,
        AgRadiusAxesCrossLineThemeOptions {}

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
