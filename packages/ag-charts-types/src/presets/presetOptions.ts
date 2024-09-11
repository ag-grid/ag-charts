import type { AgFinancialChartPresets } from './financial/financialOptions';
import type { AgGaugePreset } from './gauge/gaugeOptions';

export type * from './financial/financialOptions';
export type * from './gauge/gaugeOptions';

export type Preset = AgFinancialChartPresets | AgGaugePreset;
