import type { AgAreaSeriesOptions } from '../../series/cartesian/areaOptions';
import type { AgBarSeriesOptions } from '../../series/cartesian/barOptions';
import type { AgLineSeriesOptions } from '../../series/cartesian/lineOptions';

export type SparklineBarPreset = Omit<AgBarSeriesOptions, 'grouped' | 'stacked' | 'stackGroup'>;
export type SparklineLinePreset = Omit<AgLineSeriesOptions, 'stacked' | 'stackGroup'>;
export type SparklineAreaPreset = Omit<AgAreaSeriesOptions, 'stacked' | 'stackGroup'>;

export type SparklinePresets = SparklineBarPreset | SparklineLinePreset | SparklineAreaPreset;
