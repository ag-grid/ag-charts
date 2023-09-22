import type { AgPieSeriesOptions } from './pieOptions';
import type { AgAngleCategoryAxisOptions } from '../../chart/polarAxisOptions';
import type { AgRadiusNumberAxisOptions } from '../../chart/radiusAxisOptions';
import type { AgRadarLineSeriesOptions } from './radarLineOptions';
import type { AgRadarAreaSeriesOptions } from './radarAreaOptions';
import type { AgRadialColumnSeriesOptions } from './radialColumnOptions';
import type { AgNightingaleSeriesOptions } from './nightingaleOptions';
import type { AgBaseThemeableChartOptions } from '../../chart/chartOptions';

export type AgPolarSeriesOptions =
    | AgPieSeriesOptions
    | AgRadarLineSeriesOptions
    | AgRadarAreaSeriesOptions
    | AgRadialColumnSeriesOptions
    | AgNightingaleSeriesOptions;
export type AgPolarAxisOptions = AgAngleCategoryAxisOptions | AgRadiusNumberAxisOptions;

export interface AgBasePolarChartOptions {
    /** Series configurations. */
    series?: AgPolarSeriesOptions[];

    /** Axis configurations. */
    axes?: AgPolarAxisOptions[];
}

export interface AgPolarAxesTheme {
    'angle-category'?: AgAngleCategoryAxisOptions;
    'radius-number'?: AgRadiusNumberAxisOptions;
}

export interface AgBasePolarThemeOptions extends AgBaseThemeableChartOptions {
    /** Axis configurations. */
    axes?: AgPolarAxesTheme;
}
