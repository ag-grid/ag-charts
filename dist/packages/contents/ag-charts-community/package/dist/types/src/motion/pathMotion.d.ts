import type { AnimationManager } from '../chart/interaction/animationManager';
import type { Path } from '../scene/shape/path';
/**
 * Implements a per-path "to/from" animation.
 *
 * @param id prefix for all animation ids generated by this call
 * @param animationManager used to schedule generated animations
 * @param paths contains paths to be animated
 * @param intermediateFn callback to update path
 * @param extraOpts optional additional animation properties to pass to AnimationManager#animate.
 */
export declare function pathMotion(groupId: string, subId: string, animationManager: AnimationManager, paths: Path[], fns: {
    addPhaseFn: (ratio: number, path: Path) => void;
    updatePhaseFn: (ratio: number, path: Path) => void;
    removePhaseFn: (ratio: number, path: Path) => void;
}): void;