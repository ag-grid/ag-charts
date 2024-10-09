import type { AgAreaSeriesOptions } from '../../series/cartesian/areaOptions';
import type { AgBarSeriesOptions } from '../../series/cartesian/barOptions';
import type { AgLineSeriesOptions } from '../../series/cartesian/lineOptions';

export type AgSparklineBarPreset = Omit<AgBarSeriesOptions, 'grouped' | 'stacked' | 'stackGroup'>;
export type AgSparklineLinePreset = Omit<AgLineSeriesOptions, 'stacked' | 'stackGroup'>;
export type AgSparklineAreaPreset = Omit<AgAreaSeriesOptions, 'stacked' | 'stackGroup'>;

export type AgSparklinePresets = AgSparklineBarPreset | AgSparklineLinePreset | AgSparklineAreaPreset;
