import type { CssColor, DurationMs, Opacity } from 'ag-charts-types';

export type AgFlashOnUpdateItem = 'chart' | 'category';

export interface AgFlashOnUpdateOptions {
    /** Whether the flash effect is enabled. */
    enabled?: boolean;
    /** What part of the chart to flash. */
    item?: AgFlashOnUpdateItem;
    /** The color of the flash effect. */
    color?: CssColor;
    /** The opacity of the flash effect. */
    opacity?: Opacity;
    /** The duration of the flash in milliseconds. */
    flashDuration?: DurationMs;
    /** The duration of the fade-out effect in milliseconds. */
    fadeDuration?: DurationMs;
}
