export interface NodePathLengthEntry {
    linksBefore: NodePathLengthEntry[];
    linksAfter: NodePathLengthEntry[];
    maxPathLengthBefore: number;
    maxPathLengthAfter: number;
}

interface Link {
    fromId: string;
    toId: string;
}

export function computeNodeGraph(nodes: Iterable<string>, links: Link[]) {
    const nodeGraph = new Map<string, NodePathLengthEntry>();
    for (const id of nodes) {
        nodeGraph.set(id, { linksBefore: [], linksAfter: [], maxPathLengthBefore: -1, maxPathLengthAfter: -1 });
    }

    let maxPathLength = 0;
    nodeGraph.forEach((node, id) => {
        maxPathLength = Math.max(
            maxPathLength,
            computePathLength(nodeGraph, links, node, id, -1) + computePathLength(nodeGraph, links, node, id, 1) + 1
        );
    });

    return { nodeGraph, maxPathLength };
}

const stack: string[] = [];
function computePathLength(
    nodeGraph: Map<string, NodePathLengthEntry>,
    links: Link[],
    node: NodePathLengthEntry,
    id: string,
    direction: -1 | 1
) {
    if (stack.includes(id)) {
        throw new Error(`Circular reference: ${[...stack, id].join(', ')}`);
    }

    let maxPathLength = direction === -1 ? node.maxPathLengthBefore : node.maxPathLengthAfter;
    if (maxPathLength === -1) {
        maxPathLength = 0;
        const connectedLinks = direction === -1 ? node.linksBefore : node.linksAfter;
        for (const { fromId, toId } of links) {
            const linkId = direction === -1 ? toId : fromId;
            const nextNodeId = direction === -1 ? fromId : toId;
            const nextNode = id === linkId ? nodeGraph.get(nextNodeId) : undefined;
            if (nextNode == null) continue;

            connectedLinks.push(nextNode);

            stack.push(id);
            maxPathLength = Math.max(
                maxPathLength,
                computePathLength(nodeGraph, links, nextNode, nextNodeId, direction) + 1
            );
            stack.pop();
        }

        if (direction === -1) {
            node.maxPathLengthBefore = maxPathLength;
        } else {
            node.maxPathLengthAfter = maxPathLength;
        }
    }

    return maxPathLength;
}
