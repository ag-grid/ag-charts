import { staticFromToMotion } from '../../../motion/fromToMotion';
import type { Selection } from '../../../scene/selection';
import type { Path } from '../../../scene/shape/path';
import type { AnimationManager } from '../../interaction/animationManager';
import type { NodeDataDependant } from '../seriesTypes';

export function pathSwipeInAnimation(
    { id, visible, nodeDataDependencies }: { id: string; visible: boolean } & NodeDataDependant,
    animationManager: AnimationManager,
    ...paths: Path[]
) {
    const { seriesRectWidth: width, seriesRectHeight: height } = nodeDataDependencies;
    staticFromToMotion(
        id,
        'path_properties',
        animationManager,
        paths,
        { clipX: 0 },
        { clipX: width },
        {
            phase: 'initial',
            start: { clip: true, clipY: height, visible },
            finish: { clip: false, visible },
        }
    );
}

export function pathFadeInAnimation<D>(
    { id }: { id: string },
    subId: string,
    animationManager: AnimationManager,
    phase: 'add' | 'trailing' = 'add',
    ...selection: Selection<D, Path<D>>[] | Path<D>[]
) {
    staticFromToMotion(id, subId, animationManager, selection, { opacity: 0 }, { opacity: 1 }, { phase });
}

export function buildResetPathFn(opts: { getVisible(): boolean; getOpacity(): number }) {
    return (_node: Path) => ({
        visible: opts.getVisible(),
        opacity: opts.getOpacity(),
        clipScalingX: 1,
        clip: false,
    });
}

export function updateClipPath({ nodeDataDependencies }: NodeDataDependant, path: Path): void {
    const toFinite = (value: number) => (isFinite(value) ? value : 0);
    path.clipX = toFinite(nodeDataDependencies.seriesRectWidth);
    path.clipY = toFinite(nodeDataDependencies.seriesRectHeight);
}
