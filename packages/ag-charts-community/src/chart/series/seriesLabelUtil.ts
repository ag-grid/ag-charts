import { staticFromToMotion } from '../../motion/fromToMotion';
import type { Node } from '../../scene/node';
import type { Selection } from '../../scene/selection';
import type { AnimationManager } from '../interaction/animationManager';

type NodeWithOpacity = Node & { opacity: number };
export function seriesLabelFadeInAnimation<T>(
    { id }: { id: string },
    animationManager: AnimationManager,
    labelSelections: Selection<NodeWithOpacity, T>[]
) {
    const duration = animationManager.defaultDuration;
    staticFromToMotion(
        `${id}_labels`,
        animationManager,
        labelSelections,
        { opacity: 0 },
        { opacity: 1 },
        { delay: duration, duration: 200 }
    );
}
