import type { DurationMs } from './types';

export interface AgAnimationOptions {
    /** Set to `true` to enable the animation module. Defaults to `false` when `flashOnUpdate.enabled` is `true`. */
    enabled?: boolean;
    /** The total duration of the animation on initial load and updates. */
    duration?: DurationMs;
}
