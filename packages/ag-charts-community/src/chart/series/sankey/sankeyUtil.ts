interface Link {
    fromId: string;
    toId: string;
}

interface LinkedNode<T, L extends Link> {
    node: NodePathLengthEntry<T, L>;
    link: L;
}

export interface NodePathLengthEntry<T, L extends Link> {
    datum: T;
    linksBefore: LinkedNode<T, L>[];
    linksAfter: LinkedNode<T, L>[];
    maxPathLengthBefore: number;
    maxPathLengthAfter: number;
}

export function computeNodeGraph<T, L extends Link>(
    nodes: Map<string, T>,
    links: L[],
    allowCircularReferences: boolean
) {
    const nodeGraph = new Map<string, NodePathLengthEntry<T, L>>();
    for (const [id, datum] of nodes) {
        nodeGraph.set(id, { datum, linksBefore: [], linksAfter: [], maxPathLengthBefore: -1, maxPathLengthAfter: -1 });
    }

    let maxPathLength = 0;
    const stack: string[] | undefined = allowCircularReferences ? [] : undefined;
    nodeGraph.forEach((node, id) => {
        maxPathLength = Math.max(
            maxPathLength,
            computePathLength(nodeGraph, links, node, id, -1, stack) +
                computePathLength(nodeGraph, links, node, id, 1, stack) +
                1
        );
    });

    return { nodeGraph, maxPathLength };
}

function computePathLength<T, L extends Link>(
    nodeGraph: Map<string, NodePathLengthEntry<T, L>>,
    links: L[],
    node: NodePathLengthEntry<T, L>,
    id: string,
    direction: -1 | 1,
    stack: string[] | undefined
) {
    if (stack?.includes(id) === true) {
        throw new Error(`Circular reference: ${[...stack, id].join(', ')}`);
    }

    let maxPathLength = direction === -1 ? node.maxPathLengthBefore : node.maxPathLengthAfter;
    if (maxPathLength === -1) {
        maxPathLength = 0;
        const connectedLinks = direction === -1 ? node.linksBefore : node.linksAfter;
        for (const link of links) {
            const { fromId, toId } = link;
            const linkId = direction === -1 ? toId : fromId;
            const nextNodeId = direction === -1 ? fromId : toId;
            const nextNode = id === linkId ? nodeGraph.get(nextNodeId) : undefined;
            if (nextNode == null) continue;

            connectedLinks.push({ node: nextNode, link });

            stack?.push(id);
            maxPathLength = Math.max(
                maxPathLength,
                computePathLength(nodeGraph, links, nextNode, nextNodeId, direction, stack) + 1
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
