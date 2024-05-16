import type { AgBaseThemeableChartOptions } from '../../chart/chartOptions';
import type { AgChordSeriesOptions } from './chordOptions';
import type { AgSankeySeriesOptions } from './sankeyOptions';

export type AgFlowProportionSeriesOptions = AgSankeySeriesOptions | AgChordSeriesOptions;

export interface AgBaseFlowProportionChartOptions {
    /** Series configurations. */
    series?: AgFlowProportionSeriesOptions[];
    /** Node options */
    nodes?: any[];
}

export interface AgBaseFlowProportionThemeOptions extends AgBaseThemeableChartOptions {}
