import type { AgCrosshairOptions } from '../../chart/crosshairOptions';
import type { AgAreaSeriesOptions } from '../../series/cartesian/areaOptions';
import type { AgBarSeriesOptions } from '../../series/cartesian/barOptions';
import type { AgLineSeriesOptions } from '../../series/cartesian/lineOptions';
import type { AgSparklineAxisOptions } from './sparklineAxisOptions';

export interface AgSparklineCrosshairOptions extends Omit<AgCrosshairOptions, 'label'> {}

export interface AgSparklineBaseThemeableOptions {
    /** crosshair configurations. */
    crosshair?: AgSparklineCrosshairOptions;
    /** y-axis configurations. */
    axis?: AgSparklineAxisOptions;
    /** User override for the automatically determined min value (based on series data). */
    min?: number;
    /** User override for the automatically determined max value (based on series data). */
    max?: number;
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
