import type { AgBaseThemeableChartOptions } from '../../chart/chartOptions';
import type { AgRadialGaugeSeriesOptions } from './radialGaugeOptions';

export type AgGaugeSeriesOptions = AgRadialGaugeSeriesOptions;

export interface AgBaseGaugeChartOptions {
    /** Series configurations. */
    series?: AgGaugeSeriesOptions[];
}

export interface AgBaseGaugeThemeOptions extends AgBaseThemeableChartOptions {}
