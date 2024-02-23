interface BBoxLike {
    width: number;
    height: number;
    containsPoint(x: number, y: number): boolean;
}

export interface BBoxProvider {
    computeBBox(): BBoxLike | undefined;
}

interface BBoxElem<V> {
    value: V;
    getter: BBoxProvider;
}

function nodeContainsPoint<V>(elem: BBoxElem<V>, x: number, y: number): boolean {
    return elem.getter.computeBBox()?.containsPoint(x, y) ?? false;
}

function nodeArea<V>(elem: BBoxElem<V>): number {
    const { width = 0, height = 0 } = elem.getter.computeBBox() ?? {};
    return width * height;
}

export class BBoxSet<V> {
    private elems: BBoxElem<V>[] = [];

    add(value: V, getter: BBoxProvider): void {
        this.elems.push({ value, getter });
    }

    find(x: number, y: number): V[] {
        // Sort matches by area.
        // This ensure that we prioritise smaller regions are contained inside larger regions.
        return this.elems
            .filter((elem) => nodeContainsPoint(elem, x, y))
            .sort((a, b) => nodeArea(a) - nodeArea(b))
            .map((node) => node.value);
    }

    *[Symbol.iterator](): IterableIterator<V> {
        for (const { value } of Object.values(this.elems)) {
            yield value;
        }
    }

    clear() {
        this.elems.length = 0;
    }
}
