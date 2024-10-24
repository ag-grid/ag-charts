import type { AgAreaSeriesOptions } from '../../series/cartesian/areaOptions';
import type { AgBarSeriesOptions } from '../../series/cartesian/barOptions';
import type { AgLineSeriesOptions } from '../../series/cartesian/lineOptions';
import type { AgSparklineAxisOptions } from './sparklineAxisOptions';

export interface AgSparklineBaseThemeableOptions {
    /** x-axis configurations. */
    xAxis?: AgSparklineAxisOptions;
    /** y-axis configurations. */
    yAxis?: AgSparklineAxisOptions;
}

export interface AgBarSparklinePreset
    extends AgSparklineBaseThemeableOptions,
        Omit<AgBarSeriesOptions, 'grouped' | 'stacked' | 'stackGroup'> {}
export interface AgLineSparklinePreset
    extends AgSparklineBaseThemeableOptions,
        Omit<AgLineSeriesOptions, 'stacked' | 'stackGroup'> {}
export interface AgAreaSparklinePreset
    extends AgSparklineBaseThemeableOptions,
        Omit<AgAreaSeriesOptions, 'stacked' | 'stackGroup'> {}

export type AgSparklinePresets = AgBarSparklinePreset | AgLineSparklinePreset | AgAreaSparklinePreset;
