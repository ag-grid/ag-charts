import type { TContextDefault } from '../../chart/types';
import type { AgLinearGaugePreset } from './linearGaugeOptions';
import type { AgRadialGaugePreset } from './radialGaugeOptions';

export type AgGaugePresets<TContext = TContextDefault> = AgLinearGaugePreset<TContext> | AgRadialGaugePreset<TContext>;
