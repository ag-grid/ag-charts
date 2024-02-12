import type { BBox } from '../bbox';

interface BBoxProvider {
    computeBBox(): BBox | undefined;
}

interface BBoxNode<V> {
    value: V;
    bbox: BBoxProvider;
}

function nodeContainsPoint<V>(node: BBoxNode<V>, x: number, y: number): boolean {
    return node.bbox.computeBBox()?.containsPoint(x, y) ?? false;
}

function nodeArea<V>(node: BBoxNode<V>): number {
    const { width = 0, height = 0 } = node.bbox.computeBBox() ?? {};
    return width * height;
}

export class BBoxSet<V> {
    private nodes: BBoxNode<V>[] = [];

    add(value: V, bbox: BBoxProvider): void {
        this.nodes.push({ value, bbox });
    }

    find(x: number, y: number): V[] {
        // Sort matches by area.
        // This ensure that we prioritise smaller regions are contained inside larger regions.
        return this.nodes
            .filter((node) => nodeContainsPoint(node, x, y))
            .sort((node) => nodeArea(node))
            .map((node) => node.value);
    }
}
