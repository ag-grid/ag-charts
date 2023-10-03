import type { Node } from '../scene/node';
import type { Selection } from '../scene/selection';
import type { AnimationValue } from './animation';

/**
 * Implements a per-node reset.
 *
 * @param selections contains nodes to be reset
 * @param propsFn callback to determine per-node properties
 */
export function resetMotion<N extends Node, T extends AnimationValue & Partial<N>, D>(
    selections: Selection<N, D>[],
    propsFn: (node: N, datum: D) => T
) {
    for (const selection of selections) {
        for (const node of selection.nodes()) {
            const from = propsFn(node, node.datum);

            node.setProperties(from);
        }

        selection.cleanup();
    }
}
