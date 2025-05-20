import type { AgBaseThemeableChartOptions } from '../../chart/chartOptions';
import type { AgChordSeriesOptions } from './chordOptions';
import type { AgSankeySeriesOptions } from './sankeyOptions';

export type AgFlowProportionSeriesOptions<TDatum, TContext> =
    | AgSankeySeriesOptions<TDatum, TContext>
    | AgChordSeriesOptions<TDatum, TContext>;

export interface AgBaseFlowProportionChartOptions<TDatum, TContext> {
    /** Series configurations. */
    series?: AgFlowProportionSeriesOptions<TDatum, TContext>[];
    /** Nodes to use instead of inferring from data. */
    nodes?: any[];
}

export interface AgBaseFlowProportionThemeOptions<TDatum> extends AgBaseThemeableChartOptions<TDatum> {}
