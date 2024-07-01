import type { AgBaseThemeableChartOptions } from '../../chart/chartOptions';
import type { AgChordSeriesOptions } from './chordOptions';
import type { AgSankeySeriesOptions } from './sankeyOptions';
export type AgFlowProportionSeriesOptions = AgSankeySeriesOptions | AgChordSeriesOptions;
export interface AgBaseFlowProportionChartOptions {
    /** Series configurations. */
    series?: AgFlowProportionSeriesOptions[];
    /** Nodes to use instead of inferring from data. */
    nodes?: any[];
}
export interface AgBaseFlowProportionThemeOptions extends AgBaseThemeableChartOptions {
}
