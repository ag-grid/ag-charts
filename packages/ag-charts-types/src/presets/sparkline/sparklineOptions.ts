import type { AgAreaSeriesOptions } from '../../series/cartesian/areaOptions';
import type { AgBarSeriesOptions } from '../../series/cartesian/barOptions';
import type { AgLineSeriesOptions } from '../../series/cartesian/lineOptions';

export type AgBarSparklinePreset = Omit<AgBarSeriesOptions, 'grouped' | 'stacked' | 'stackGroup'>;
export type AgLineSparklinePreset = Omit<AgLineSeriesOptions, 'stacked' | 'stackGroup'>;
export type AgAreaSparklinePreset = Omit<AgAreaSeriesOptions, 'stacked' | 'stackGroup'>;

export type AgSparklinePresets = AgBarSparklinePreset | AgLineSparklinePreset | AgAreaSparklinePreset;
