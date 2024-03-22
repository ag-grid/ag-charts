import { staticFromToMotion } from '../../motion/fromToMotion';
import type { NodeWithOpacity } from '../../scene/node';
import type { Selection } from '../../scene/selection';
import type { AnimationManager } from '../interaction/animationManager';

export function seriesLabelFadeInAnimation<T>(
    { id }: { id: string },
    subId: string,
    animationManager: AnimationManager,
    ...labelSelections: Selection<NodeWithOpacity, T>[]
) {
    staticFromToMotion(
        id,
        subId,
        animationManager,
        labelSelections,
        { opacity: 0 },
        { opacity: 1 },
        { phase: 'trailing' }
    );
}

export function seriesLabelFadeOutAnimation<T>(
    { id }: { id: string },
    subId: string,
    animationManager: AnimationManager,
    ...labelSelections: Selection<NodeWithOpacity, T>[]
) {
    staticFromToMotion(
        id,
        subId,
        animationManager,
        labelSelections,
        { opacity: 1 },
        { opacity: 0 },
        { phase: 'remove' }
    );
}

export function resetLabelFn(_node: NodeWithOpacity) {
    return { opacity: 1 };
}
