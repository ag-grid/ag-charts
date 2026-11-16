import type { Node, Selection } from 'ag-charts-core';

import { deconstructSelectionsOrNodes } from './animation';

/**
 * Implements a per-node reset.
 * Uses batchedUpdate to consolidate markDirty calls per selection.
 *
 * @param selectionsOrNodes contains nodes to be reset
 * @param propsFn callback to determine per-node properties
 * @param cleanup false leaves removed nodes for the motion that owns their removal
 */
export function resetMotion<D, N extends Node<D>, T extends Partial<N>>(
    selectionsOrNodes: Selection<D, N>[] | N[],
    propsFn: (node: N, datum: D) => T,
    { cleanup = true }: { cleanup?: boolean } = {}
) {
    const { nodes, selections } = deconstructSelectionsOrNodes(selectionsOrNodes);

    for (const selection of selections) {
        const selectionNodes = selection.nodes();
        selection.batchedUpdate(function resetMotionNodes() {
            for (const node of selectionNodes) {
                const from = propsFn(node, node.unsafeDatum);
                node.setProperties(from);
            }
            if (cleanup) selection.cleanup();
        });
    }
    for (const node of nodes) {
        const from = propsFn(node, node.unsafeDatum);
        node.setProperties(from);
    }
}
