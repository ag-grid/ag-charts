import { LABEL_PHASE } from '../../motion/animation';
import { staticFromToMotion } from '../../motion/fromToMotion';
import type { Node } from '../../scene/node';
import type { Selection } from '../../scene/selection';
import type { AnimationManager } from '../interaction/animationManager';

type NodeWithOpacity = Node & { opacity: number };
export function seriesLabelFadeInAnimation<T>(
    { id }: { id: string },
    subId: string,
    animationManager: AnimationManager,
    labelSelections: Selection<NodeWithOpacity, T>[]
) {
    staticFromToMotion(id, subId, animationManager, labelSelections, { opacity: 0 }, { opacity: 1 }, LABEL_PHASE);
}

export function seriesLabelFadeOutAnimation<T>(
    { id }: { id: string },
    subId: string,
    animationManager: AnimationManager,
    labelSelections: Selection<NodeWithOpacity, T>[]
) {
    staticFromToMotion(id, subId, animationManager, labelSelections, { opacity: 1 }, { opacity: 0 }, LABEL_PHASE);
}

export function resetLabelFn(_node: NodeWithOpacity) {
    return { opacity: 1 };
}
