import type { AgBaseThemeableChartOptions } from '../../chart/chartOptions';
import type { AgChordSeriesOptions } from './chordOptions';
import type { AgSankeySeriesOptions } from './sankeyOptions';

export type AgFlowProportionSeriesOptions<TDatum> = AgSankeySeriesOptions<TDatum> | AgChordSeriesOptions<TDatum>;

export interface AgBaseFlowProportionChartOptions<TDatum> {
    /** Series configurations. */
    series?: AgFlowProportionSeriesOptions<TDatum>[];
    /** Nodes to use instead of inferring from data. */
    nodes?: any[];
}

export interface AgBaseFlowProportionThemeOptions<TDatum> extends AgBaseThemeableChartOptions<TDatum> {}
