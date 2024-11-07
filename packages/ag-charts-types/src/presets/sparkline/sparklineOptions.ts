import type { AgAreaSeriesOptions } from '../../series/cartesian/areaOptions';
import type { AgBarSeriesOptions } from '../../series/cartesian/barOptions';
import type { AgLineSeriesOptions } from '../../series/cartesian/lineOptions';
import type { AgSparklineAxisOptions } from './sparklineAxisOptions';

export interface AgSparklineBaseThemeableOptions {
    /** y-axis configurations. */
    axis?: AgSparklineAxisOptions;
    /** User override for the automatically determined min value (based on series data). */
    min?: number;
    /** User override for the automatically determined max value (based on series data). */
    max?: number;
    /** Reverse the axis scale domain if `true`. */
    reverse?: boolean;
}

export interface AgBarSparklinePreset
    extends AgSparklineBaseThemeableOptions,
        Omit<
            AgBarSeriesOptions,
            'showInLegend' | 'showInMiniChart' | 'grouped' | 'stacked' | 'stackGroup' | 'errorBar'
        > {}
export interface AgLineSparklinePreset
    extends AgSparklineBaseThemeableOptions,
        Omit<AgLineSeriesOptions, 'showInLegend' | 'showInMiniChart' | 'stacked' | 'stackGroup' | 'errorBar'> {}
export interface AgAreaSparklinePreset
    extends AgSparklineBaseThemeableOptions,
        Omit<AgAreaSeriesOptions, 'showInLegend' | 'showInMiniChart' | 'stacked' | 'stackGroup'> {}

export type AgSparklinePresets = AgBarSparklinePreset | AgLineSparklinePreset | AgAreaSparklinePreset;
