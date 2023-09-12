import type { AgPieSeriesOptions } from './pieOptions';
import type { AgAngleCategoryAxisOptions } from '../../options/polarAxisOptions';
import type { AgRadiusNumberAxisOptions } from '../../options/radiusAxisOptions';
import type { AgRadarLineSeriesOptions } from './radarLineOptions';
import type { AgRadarAreaSeriesOptions } from './radarAreaOptions';
import type { AgRadialColumnSeriesOptions } from './radialColumnOptions';
import type { AgNightingaleSeriesOptions } from './nightingaleOptions';
import type { AgBaseThemeableChartOptions } from '../../options/chartOptions';

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
    'angle-category': AgAngleCategoryAxisOptions;
    'radius-number': AgRadiusNumberAxisOptions;
}

export interface AgBasePolarThemeOptions extends AgBaseThemeableChartOptions {
    /** Axis configurations. */
    axes?: AgPolarAxesTheme;
}
