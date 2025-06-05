import type { AgBaseThemeableChartOptions } from '../../chart/chartOptions';
import type { TContextDefault, TDatumDefault } from '../../chart/types';
import type { AgChordSeriesOptions } from './chordOptions';
import type { AgSankeySeriesOptions } from './sankeyOptions';

export type AgFlowProportionSeriesOptions<TDatum = TDatumDefault, TContext = TContextDefault> =
    | AgSankeySeriesOptions<TDatum, TContext>
    | AgChordSeriesOptions<TDatum, TContext>;

export interface AgBaseFlowProportionChartOptions<TDatum = TDatumDefault, TContext = TContextDefault> {
    /** Series configurations. */
    series?: AgFlowProportionSeriesOptions<TDatum, TContext>[];
    /** Nodes to use instead of inferring from data. */
    nodes?: any[];
}

export interface AgBaseFlowProportionThemeOptions<TDatum = TDatumDefault, TContext = TContextDefault>
    extends AgBaseThemeableChartOptions<TDatum, TContext> {}
