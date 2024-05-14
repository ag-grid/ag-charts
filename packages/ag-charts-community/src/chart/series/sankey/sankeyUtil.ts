export interface NodePathLengthEntry {
    id: string;
    maxPathLengthBefore: number;
    maxPathLengthAfter: number;
}

interface Link {
    fromId: string;
    toId: string;
}

const stack: string[] = [];
export function computePathLength(
    nodesById: Map<string, NodePathLengthEntry>,
    links: Link[],
    node: NodePathLengthEntry,
    direction: -1 | 1
) {
    const { id } = node;
    if (stack.includes(id)) {
        throw new Error(`Circular reference: ${[...stack, id].join(', ')}`);
    }

    let maxPathLength = direction === -1 ? node.maxPathLengthBefore : node.maxPathLengthAfter;
    if (maxPathLength === -1) {
        maxPathLength = 0;
        for (const { fromId, toId } of links) {
            const linkId = direction === -1 ? toId : fromId;
            const nextNodeId = direction === -1 ? fromId : toId;
            const nextNode = id === linkId ? nodesById.get(nextNodeId) : undefined;
            if (nextNode != null) {
                stack.push(id);
                maxPathLength = Math.max(maxPathLength, computePathLength(nodesById, links, nextNode, direction) + 1);
                stack.pop();
            }
        }

        if (direction === -1) {
            node.maxPathLengthBefore = maxPathLength;
        } else {
            node.maxPathLengthAfter = maxPathLength;
        }
    }

    return maxPathLength;
}
