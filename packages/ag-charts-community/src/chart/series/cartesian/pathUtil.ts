import { staticFromToMotion } from '../../../motion/fromToMotion';
import type { Path } from '../../../scene/shape/path';
import type { AnimationManager } from '../../interaction/animationManager';
import type { MarkerChange } from './markerUtil';

export type PathPoint = {
    from?: { x: number; y: number };
    to?: { x: number; y: number };
    marker: MarkerChange;
    moveTo: true | false | 'in' | 'out';
};
export type PathPointMap = {
    [key in 'moved' | 'added' | 'removed']: { [key: string]: PathPoint };
};

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
