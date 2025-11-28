export interface AgFlashOnUpdateOptions {
    /** Whether the flash effect is enabled. */
    enabled?: boolean;
    /** What part of the chart to flash. */
    item?: 'chart' | 'category';
    /** The color of the flash effect. */
    color?: string;
    /** The opacity of the flash effect. */
    opacity?: number;
    /** The duration of the flash in milliseconds. */
    flashDuration?: number;
    /** The duration of the fade-out effect in milliseconds. */
    fadeDuration?: number;
}
