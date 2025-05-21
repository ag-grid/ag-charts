import type { AgBaseThemeableChartOptions } from '../../chart/chartOptions';
import type {
    AgAngleAxesCrossLineThemeOptions,
    AgAngleCategoryAxisOptions,
    AgAngleNumberAxisOptions,
} from '../../chart/polarAxisOptions';
import type {
    AgRadiusAxesCrossLineThemeOptions,
    AgRadiusCategoryAxisOptions,
    AgRadiusNumberAxisOptions,
} from '../../chart/radiusAxisOptions';
import type { TContextDefault, TDatumDefault } from '../../chart/types';
import type { AgDonutSeriesOptions } from './donutOptions';
import type { AgNightingaleSeriesOptions } from './nightingaleOptions';
import type { AgPieSeriesOptions } from './pieOptions';
import type { AgRadarAreaSeriesOptions } from './radarAreaOptions';
import type { AgRadarLineSeriesOptions } from './radarLineOptions';
import type { AgRadialBarSeriesOptions } from './radialBarOptions';
import type { AgRadialColumnSeriesOptions } from './radialColumnOptions';

export type AgPolarSeriesOptions<TDatum = TDatumDefault, TContext = TContextDefault> =
    | AgDonutSeriesOptions<TDatum, TContext>
    | AgPieSeriesOptions<TDatum, TContext>
    | AgRadarLineSeriesOptions<TDatum, TContext>
    | AgRadarAreaSeriesOptions<TDatum, TContext>
    | AgRadialBarSeriesOptions<TDatum, TContext>
    | AgRadialColumnSeriesOptions<TDatum, TContext>
    | AgNightingaleSeriesOptions<TDatum, TContext>;

export type AgPolarAxisOptions<TContext = TContextDefault> =
    | AgAngleCategoryAxisOptions<TContext>
    | AgAngleNumberAxisOptions<TContext>
    | AgRadiusCategoryAxisOptions<TContext>
    | AgRadiusNumberAxisOptions<TContext>;

export type AgPolarAxisType<TContext = TContextDefault> = AgPolarAxisOptions<TContext>['type'];

export interface AgBasePolarChartOptions<TDatum = TDatumDefault, TContext = TContextDefault> {
    /** Series configurations. */
    series?: AgPolarSeriesOptions<TDatum, TContext>[];

    /** Axis configurations. */
    axes?: AgPolarAxisOptions<TContext>[];
}

type ThemeOmittedAxisOptions = 'context' | 'type' | 'crossLines';

export interface AgAngleCategoryAxisThemeOptions
    extends Omit<AgAngleCategoryAxisOptions<never>, ThemeOmittedAxisOptions>,
        AgAngleAxesCrossLineThemeOptions {}

export interface AgAngleNumberAxisThemeOptions
    extends Omit<AgAngleNumberAxisOptions<never>, ThemeOmittedAxisOptions>,
        AgAngleAxesCrossLineThemeOptions {}

export interface AgRadiusCategoryAxisThemeOptions
    extends Omit<AgRadiusCategoryAxisOptions<never>, ThemeOmittedAxisOptions>,
        AgRadiusAxesCrossLineThemeOptions {}

export interface AgRadiusNumberAxisThemeOptions
    extends Omit<AgRadiusNumberAxisOptions<never>, ThemeOmittedAxisOptions>,
        AgRadiusAxesCrossLineThemeOptions {}

export interface AgPolarAxesTheme {
    'angle-category'?: AgAngleCategoryAxisThemeOptions;
    'angle-number'?: AgAngleNumberAxisThemeOptions;
    'radius-category'?: AgRadiusCategoryAxisThemeOptions;
    'radius-number'?: AgRadiusNumberAxisThemeOptions;
}

export interface AgBasePolarThemeOptions<TDatum = TDatumDefault> extends AgBaseThemeableChartOptions<TDatum> {
    /** Axis configurations. */
    axes?: AgPolarAxesTheme;
}
