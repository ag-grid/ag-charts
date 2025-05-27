import type { AgDonutSeriesOptions } from '../series/polar/donutOptions';
import type { AgNightingaleSeriesOptions } from '../series/polar/nightingaleOptions';
import type { AgPieSeriesOptions } from '../series/polar/pieOptions';
import type { AgRadarAreaSeriesOptions } from '../series/polar/radarAreaOptions';
import type { AgRadarLineSeriesOptions } from '../series/polar/radarLineOptions';
import type { AgRadialBarSeriesOptions } from '../series/polar/radialBarOptions';
import type { AgRadialColumnSeriesOptions } from '../series/polar/radialColumnOptions';
import type { AgBaseThemeableChartOptions } from './chartOptions';
import type { FormatterConfiguration } from './formatterOptions';
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

export type AgPolarFormatterPropertyType = 'angle' | 'radius' | 'label' | 'calloutLabel' | 'sectorLabel';

export type AgPolarFormatter<TDatum> = FormatterConfiguration<TDatum, AgPolarFormatterPropertyType>;

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

    /** Global formatter configuration. */
    formatter?: AgPolarFormatter<any>;
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
