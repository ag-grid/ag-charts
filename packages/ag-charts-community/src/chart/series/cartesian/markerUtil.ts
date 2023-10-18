import { staticFromToMotion } from '../../../motion/fromToMotion';
import type { Node } from '../../../scene/node';
import type { Selection } from '../../../scene/selection';
import type { AnimationManager } from '../../interaction/animationManager';

type NodeWithOpacity = Node & { opacity: number };
export function markerFadeInAnimation<T>(
    { id }: { id: string },
    animationManager: AnimationManager,
    markerSelections: Selection<NodeWithOpacity, T>[],
    delay?: true
) {
    const params = delay
        ? { delay: animationManager.defaultDuration, duration: 200 }
        : { duration: animationManager.defaultDuration };
    staticFromToMotion(`${id}_markers`, animationManager, markerSelections, { opacity: 0 }, { opacity: 1 }, params);
}

export function markerScaleInAnimation<T>(
    { id }: { id: string },
    animationManager: AnimationManager,
    markerSelections: Selection<Node, T>[]
) {
    staticFromToMotion(
        `${id}_markers`,
        animationManager,
        markerSelections,
        { scalingX: 0, scalingY: 0 },
        { scalingX: 1, scalingY: 1 },
        { duration: animationManager.defaultDuration }
    );
}

export function resetMarkerFn(_node: NodeWithOpacity & Node) {
    return { opacity: 1, scalingX: 1, scalingY: 1 };
}
