import { staticFromToMotion } from '../../../motion/fromToMotion';
import type { Path } from '../../../scene/shape/path';
import type { AnimationManager } from '../../interaction/animationManager';

export function pathSwipeInAnimation({ id }: { id: string }, animationManager: AnimationManager, paths: Path[]) {
    staticFromToMotion(
        id,
        'path_properties',
        animationManager,
        paths,
        { clipScalingX: 0 },
        { clipScalingX: 1 },
        {
            start: { clipMode: 'normal' },
            finish: { clipMode: undefined },
        }
    );
}

export function resetPathFn(_node: Path) {
    return { opacity: 1, clipScalingX: 1, clipMode: undefined };
}
