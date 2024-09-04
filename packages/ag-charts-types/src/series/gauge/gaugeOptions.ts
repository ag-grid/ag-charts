import type { AgBaseAxisOptions } from '../../chart/axisOptions';
import type { AgBaseThemeableChartOptions } from '../../chart/chartOptions';
import type { AgLinearGaugeSeriesOptions } from './linearGaugeOptions';
import type { AgRadialGaugeSeriesOptions } from './radialGaugeOptions';

export type AgGaugeSeriesOptions = AgRadialGaugeSeriesOptions | AgLinearGaugeSeriesOptions;

export interface AgBaseGaugeChartOptions {
    /** Series configurations. */
    series?: AgGaugeSeriesOptions[];

    /** Axis configurations. */
    axes?: AgBaseAxisOptions[];
}

export interface AgBaseGaugeThemeOptions extends AgBaseThemeableChartOptions {}
