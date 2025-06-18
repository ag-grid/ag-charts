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
import type { TContextDefault, TDatumDefault } from './types';

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

type ThemeOmittedAxisOptions = 'type' | 'crossLines';

export interface AgAngleCategoryAxisThemeOptions<TContext = TContextDefault>
    extends Omit<AgAngleCategoryAxisOptions<TContext>, ThemeOmittedAxisOptions>,
        AgAngleAxesCrossLineThemeOptions {}

export interface AgAngleNumberAxisThemeOptions<TContext = TContextDefault>
    extends Omit<AgAngleNumberAxisOptions<TContext>, ThemeOmittedAxisOptions>,
        AgAngleAxesCrossLineThemeOptions {}

export interface AgRadiusCategoryAxisThemeOptions<TContext = TContextDefault>
    extends Omit<AgRadiusCategoryAxisOptions<TContext>, ThemeOmittedAxisOptions>,
        AgRadiusAxesCrossLineThemeOptions {}

export interface AgRadiusNumberAxisThemeOptions<TContext = TContextDefault>
    extends Omit<AgRadiusNumberAxisOptions<TContext>, ThemeOmittedAxisOptions>,
        AgRadiusAxesCrossLineThemeOptions {}

export interface AgPolarAxesTheme<TContext = TContextDefault> {
    'angle-category'?: AgAngleCategoryAxisThemeOptions<TContext>;
    'angle-number'?: AgAngleNumberAxisThemeOptions<TContext>;
    'radius-category'?: AgRadiusCategoryAxisThemeOptions<TContext>;
    'radius-number'?: AgRadiusNumberAxisThemeOptions<TContext>;
}

export interface AgBasePolarThemeOptions<TDatum = TDatumDefault, TContext = TContextDefault>
    extends AgBaseThemeableChartOptions<TDatum, TContext> {
    /** Axis configurations. */
    axes?: AgPolarAxesTheme<TContext>;
}
