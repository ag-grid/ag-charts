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
    /**
     * The flash hold duration in milliseconds before fading begins. Applied as a proportion of the default
     * animation time and scaled by the phase (add/remove/update), capped at 2x the default duration.
     */
    flashDuration?: DurationMs;
    /**
     * The fade-out duration in milliseconds. Applied as a proportion of the default animation time and scaled
     * by the phase (add/remove/update), capped at 2x the default duration.
     */
    fadeOutDuration?: DurationMs;
}
