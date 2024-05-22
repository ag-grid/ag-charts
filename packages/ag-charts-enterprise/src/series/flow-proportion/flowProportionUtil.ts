export interface Node {
    id: string;
}

export interface Link<N extends Node> {
    fromNode: N;
    toNode: N;
}

export interface LinkedNode<N extends Node, L extends Link<N>> {
    node: NodeGraphEntry<N, L>;
    link: L;
}

export interface NodeGraphEntry<N extends Node, L extends Link<N>> {
    datum: N;
    linksBefore: LinkedNode<N, L>[];
    linksAfter: LinkedNode<N, L>[];
    maxPathLengthBefore: number;
    maxPathLengthAfter: number;
}

export function computeNodeGraph<N extends Node, L extends Link<N>>(
    nodes: Iterable<N>,
    links: L[],
    allowCircularReferences: boolean
) {
    const nodeGraph = new Map<string, NodeGraphEntry<N, L>>();
    for (const datum of nodes) {
        nodeGraph.set(datum.id, {
            datum,
            linksBefore: [],
            linksAfter: [],
            maxPathLengthBefore: -1,
            maxPathLengthAfter: -1,
        });
    }

    let maxPathLength = 0;
    nodeGraph.forEach((node, id) => {
        maxPathLength = Math.max(
            maxPathLength,
            computePathLength(nodeGraph, links, node, id, -1, allowCircularReferences) +
                computePathLength(nodeGraph, links, node, id, 1, allowCircularReferences) +
                1
        );
    });

    return { nodeGraph, maxPathLength };
}

const stack: string[] = [];
function computePathLength<N extends Node, L extends Link<N>>(
    nodeGraph: Map<string, NodeGraphEntry<N, L>>,
    links: L[],
    node: NodeGraphEntry<N, L>,
    id: string,
    direction: -1 | 1,
    allowCircularReferences: boolean
) {
    if (stack.includes(id)) {
        if (allowCircularReferences) {
            return Infinity;
        } else {
            throw new Error(`Circular reference: ${[...stack, id].join(', ')}`);
        }
    }

    let maxPathLength = direction === -1 ? node.maxPathLengthBefore : node.maxPathLengthAfter;
    if (maxPathLength === -1) {
        maxPathLength = 0;
        const connectedLinks = direction === -1 ? node.linksBefore : node.linksAfter;
        for (const link of links) {
            const { fromNode, toNode } = link;
            const linkId = direction === -1 ? toNode.id : fromNode.id;
            const nextNodeId = direction === -1 ? fromNode.id : toNode.id;
            const nextNode = id === linkId ? nodeGraph.get(nextNodeId) : undefined;
            if (nextNode == null) continue;

            connectedLinks.push({ node: nextNode, link });

            stack?.push(id);
            maxPathLength = Math.max(
                maxPathLength,
                computePathLength(nodeGraph, links, nextNode, nextNodeId, direction, allowCircularReferences) + 1
            );
            stack?.pop();
        }

        if (direction === -1) {
            node.maxPathLengthBefore = maxPathLength;
        } else {
            node.maxPathLengthAfter = maxPathLength;
        }
    }

    return maxPathLength;
}
