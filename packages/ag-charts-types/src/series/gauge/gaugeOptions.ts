import type { AgBaseThemeableChartOptions } from '../../chart/chartOptions';
import type { AgPolarAxisOptions } from '../polar/polarOptions';
import type { AgRadialGaugeSeriesOptions } from './radialGaugeOptions';

export type AgGaugeSeriesOptions = AgRadialGaugeSeriesOptions;

export interface AgBaseGaugeChartOptions {
    /** Series configurations. */
    series?: AgGaugeSeriesOptions[];

    /** Axis configurations. */
    axes?: AgPolarAxisOptions[];
}

export interface AgBaseGaugeThemeOptions extends AgBaseThemeableChartOptions {}
