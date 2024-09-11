import type { AgLinearGaugePreset } from './linearGaugeOptions';
import type { AgRadialGaugePreset } from './radialGaugeOptions';

export type * from './linearGaugeOptions';
export type * from './radialGaugeOptions';
export type * from './gaugeCommonOptions';

export type AgGaugePreset = AgLinearGaugePreset | AgRadialGaugePreset;
