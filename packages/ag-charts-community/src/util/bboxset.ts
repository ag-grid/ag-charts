interface BBoxLike {
    width: number;
    height: number;
    containsPoint(x: number, y: number): boolean;
}

export interface BBoxProvider {
    getCachedBBox(): BBoxLike;
}

export class BBoxSet<V> {
    private map: Map<V, BBoxProvider[]> = new Map<V, BBoxProvider[]>();

    add(value: V, getters: BBoxProvider[]): void {
        this.map.set(value, getters);
    }

    find(x: number, y: number): V[] {
        // Sort matches by area.
        // This ensure that we prioritise smaller regions are contained inside larger regions.
        const matches: [V, number][] = [];
        for (const [value, bboxProviders] of this.map.entries()) {
            for (const provider of bboxProviders) {
                const bbox = provider.getCachedBBox();
                if (bbox.containsPoint(x, y)) {
                    matches.push([value, bbox.width * bbox.height]);
                }
            }
        }
        return matches.sort((a, b) => a[1] - b[1]).map((m) => m[0]);
    }

    *keys(): IterableIterator<V> {
        for (const key of this.map.keys()) {
            yield key;
        }
    }

    clear() {
        this.map.clear();
    }
}
