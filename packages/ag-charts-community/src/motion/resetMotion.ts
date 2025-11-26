import type { Node } from '../scene/node';
import type { Selection } from '../scene/selection';
import { deconstructSelectionsOrNodes } from './animation';

/**
 * Implements a per-node reset.
 * Uses batchedUpdate to consolidate markDirty calls per selection.
 *
 * @param selectionsOrNodes contains nodes to be reset
 * @param propsFn callback to determine per-node properties
 */
export function resetMotion<N extends Node, T extends Partial<N>, D>(
    selectionsOrNodes: Selection<N, D>[] | N[],
    propsFn: (node: N, datum: D) => T
) {
    const { nodes, selections } = deconstructSelectionsOrNodes(selectionsOrNodes);

    for (const selection of selections) {
        const selectionNodes = selection.nodes();
        selection.batchedUpdate(function resetMotionNodes() {
            for (const node of selectionNodes) {
                const from = propsFn(node, node.datum);
                node.setProperties(from);
            }
            selection.cleanup();
        });
    }
    for (const node of nodes) {
        const from = propsFn(node, node.datum);
        node.setProperties(from);
    }
}
