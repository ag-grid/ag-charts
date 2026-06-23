import { describe, expect, it } from 'vitest';

import { type BoxBounds, boxCollides } from './boxBounds';
import { SpatialIndex } from './spatialIndex';

function makeBoxes(count: number, bounds: BoxBounds): BoxBounds[] {
    // Deterministic pseudo-random spread so the test is reproducible.
    const boxes: BoxBounds[] = [];
    let seed = 1;
    const next = () => {
        seed = (seed * 1103515245 + 12345) & 0x7fffffff;
        return seed / 0x7fffffff;
    };
    for (let i = 0; i < count; i++) {
        const w = 5 + next() * 40;
        const h = 5 + next() * 20;
        const x = bounds.x + next() * (bounds.width - w);
        const y = bounds.y + next() * (bounds.height - h);
        boxes.push({ x, y, width: w, height: h });
    }
    return boxes;
}

function bruteForceCollides(boxes: BoxBounds[], box: BoxBounds): boolean {
    return boxes.some((b) => boxCollides(b, box.x, box.y, box.width, box.height));
}

describe('SpatialIndex', () => {
    const bounds: BoxBounds = { x: -50, y: -20, width: 800, height: 600 };

    it('matches brute-force collision results for inserted boxes', () => {
        const boxes = makeBoxes(500, bounds);
        const index = new SpatialIndex<BoxBounds>();
        index.reset(bounds, 30);
        for (const b of boxes) {
            index.insert(b, b);
        }

        const queries = makeBoxes(500, bounds);
        for (const q of queries) {
            const expected = bruteForceCollides(boxes, q);
            const actual = index.query(q, (ref) => boxCollides(ref, q.x, q.y, q.width, q.height));
            expect(actual).toBe(expected);
        }
    });

    it('never misses an overlap on cell boundaries', () => {
        const index = new SpatialIndex<BoxBounds>();
        index.reset({ x: 0, y: 0, width: 100, height: 100 }, 10);
        const stored = { x: 9, y: 9, width: 2, height: 2 };
        index.insert(stored, stored);

        const straddling = { x: 10, y: 10, width: 1, height: 1 };
        const found = index.query(straddling, (ref) =>
            boxCollides(ref, straddling.x, straddling.y, straddling.width, straddling.height)
        );
        expect(found).toBe(bruteForceCollides([stored], straddling));
    });

    it('reuses backing storage across resets without leaking stale refs', () => {
        const index = new SpatialIndex<string>();
        index.reset(bounds, 30);
        index.insert({ x: 0, y: 0, width: 10, height: 10 }, 'first');

        index.reset(bounds, 30);
        const visited: string[] = [];
        index.query({ x: 0, y: 0, width: 10, height: 10 }, (ref) => {
            visited.push(ref);
        });
        expect(visited).toEqual([]);
    });

    it('stops early when the visitor returns true', () => {
        const index = new SpatialIndex<number>();
        index.reset({ x: 0, y: 0, width: 100, height: 100 }, 50);
        const box = { x: 0, y: 0, width: 100, height: 100 };
        for (let i = 0; i < 5; i++) {
            index.insert(box, i);
        }

        let visits = 0;
        const found = index.query(box, () => {
            visits++;
            return true;
        });
        expect(found).toBe(true);
        expect(visits).toBe(1);
    });
});
