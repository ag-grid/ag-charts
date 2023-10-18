import type { Node } from '../scene/node';
import type { Selection } from '../scene/selection';
import { isNodeArray } from './animation';

/**
 * Implements a per-node reset.
 *
 * @param selections contains nodes to be reset
 * @param propsFn callback to determine per-node properties
 */
export function resetMotion<N extends Node, T extends Partial<N>, D>(
    selectionsOrNodes: Selection<N, D>[] | N[],
    propsFn: (node: N, datum: D) => T
) {
    const isNodes = isNodeArray<N>(selectionsOrNodes);
    const nodes = isNodes ? selectionsOrNodes : [];
    const selections = !isNodes ? selectionsOrNodes : [];

    for (const selection of selections) {
        for (const node of selection.nodes()) {
            const from = propsFn(node, node.datum);

            node.setProperties(from);
        }

        selection.cleanup();
    }
    for (const node of nodes) {
        const from = propsFn(node, node.datum);

        node.setProperties(from);
    }
}
