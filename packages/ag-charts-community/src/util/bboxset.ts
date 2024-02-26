export interface BBoxLike {
    x: number;
    y: number;
    width: number;
    height: number;
    containsPoint(x: number, y: number): boolean;
}

export interface BBoxProvider {
    computeBBox(): BBoxLike | undefined;
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
            .sort((a, b) => nodeArea(a) - nodeArea(b))
            .map((node) => node.value);
    }

    *[Symbol.iterator](): IterableIterator<V> {
        for (const { value } of Object.values(this.nodes)) {
            yield value;
        }
    }

    clear() {
        this.nodes.length = 0;
    }
}
