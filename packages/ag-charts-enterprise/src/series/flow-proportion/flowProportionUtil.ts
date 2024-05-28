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
    includeCircularReferences: boolean
) {
    if (!includeCircularReferences) {
        links = removeCircularLinks(links);
    }

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
            computePathLength(nodeGraph, links, node, id, -1, []) +
                computePathLength(nodeGraph, links, node, id, 1, []) +
                1
        );
    });

    return { links, nodeGraph, maxPathLength };
}

function findCircularLinks<N extends Node, L extends Link<N>>(links: L[], link: L, into: Set<L>, stack: L[]) {
    const stackIndex = stack.indexOf(link);
    if (stackIndex !== -1) {
        for (let i = stackIndex; i < stack.length; i += 1) {
            into.add(stack[i] as any);
        }
        return;
    }

    stack.push(link);
    const { toNode } = link;
    for (const next of links) {
        if (next.fromNode === toNode) {
            findCircularLinks(links, next, into, stack);
        }
    }
    stack.pop();
}

function removeCircularLinks<N extends Node, L extends Link<N>>(links: L[]) {
    const circularLinks = new Set<L>();
    for (const link of links) {
        findCircularLinks(links, link, circularLinks, []);
    }

    return circularLinks.size === 0 ? links : links.filter((link) => !circularLinks.has(link));
}

function computePathLength<N extends Node, L extends Link<N>>(
    nodeGraph: Map<string, NodeGraphEntry<N, L>>,
    links: L[],
    node: NodeGraphEntry<N, L>,
    id: string,
    direction: -1 | 1,
    stack: string[]
) {
    if (stack.includes(id)) {
        return Infinity;
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
