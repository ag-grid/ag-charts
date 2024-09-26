import { type Node, RedrawType } from './node';

export function nodeCount(node: Node) {
    let count = 1;
    let visibleCount = node.visible ? 1 : 0;
    let dirtyCount = node.dirty > RedrawType.NONE ? 1 : 0;

    for (const child of node.children(false)) {
        const c = nodeCount(child);
        count += c.count;
        dirtyCount += c.dirtyCount;
        visibleCount += c.visibleCount;
    }

    return { count, visibleCount, dirtyCount };
}
