import type { CssColor, DurationMs, Opacity } from './types';

export type AgFlashOnUpdateItem = 'chart' | 'category';

export interface AgFlashOnUpdateOptions {
    /** Whether the flash effect is enabled. */
    enabled?: boolean;
    /** What part of the chart to flash. */
    item?: AgFlashOnUpdateItem;
    /** The colour of the flash effect. */
    color?: CssColor;
    /** The opacity of the flash effect. */
    opacity?: Opacity;
    /** The flash hold duration in milliseconds before fading begins. Actual timing may vary when animations are enabled. */
    flashDuration?: DurationMs;
    /** The fade-out duration in milliseconds. Actual timing may vary when animations are enabled. */
    fadeOutDuration?: DurationMs;
}
