import type { AgFinancialChartPresets } from './financial/financialOptions';
import type { AgGaugePresets } from './gauge/gaugeOptions';
import type { AgSparklinePresets } from './sparkline/sparklineOptions';

export type AgPreset<TDatum> = AgFinancialChartPresets | AgGaugePresets | AgSparklinePresets<TDatum>;
