import { describe, expect, it } from 'vitest';

import { type BoxBounds, boxCollides } from './boxBounds';
import { SpatialIndex, anyOverlap } from './spatialIndex';

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

    it('caps total grid cells for a degenerate cell size, preserving correctness', () => {
        const largeBounds: BoxBounds = { x: 0, y: 0, width: 2000, height: 2000 };
        const index = new SpatialIndex<BoxBounds>();
        // A 1px cell size over 2000×2000 would be 4,000,000 cells without the cap.
        index.reset(largeBounds, 1);
        const cellCount = (index as unknown as { cellCount: number }).cellCount;
        expect(cellCount).toBeLessThanOrEqual(1 << 14);

        const stored = { x: 100, y: 100, width: 20, height: 20 };
        index.insert(stored, stored);
        const hit = { x: 110, y: 110, width: 5, height: 5 };
        const miss = { x: 1500, y: 1500, width: 5, height: 5 };
        expect(index.query(hit, (ref) => boxCollides(ref, hit.x, hit.y, hit.width, hit.height))).toBe(true);
        expect(index.query(miss, (ref) => boxCollides(ref, miss.x, miss.y, miss.width, miss.height))).toBe(false);
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

describe('anyOverlap', () => {
    const collidesExactly = (a: BoxBounds, b: BoxBounds) => boxCollides(a, b.x, b.y, b.width, b.height);
    const randomBox = (next: () => number): BoxBounds => ({
        x: next() * 400 - 200,
        y: next() * 400 - 200,
        width: 5 + next() * 50,
        height: 5 + next() * 50,
    });

    it('returns false when there are no query boxes or no obstacles', () => {
        const boxes: BoxBounds[] = [{ x: 0, y: 0, width: 10, height: 10 }];
        const obstacles = boxes.map((box) => ({ box, ref: box }));

        expect(anyOverlap([], obstacles, collidesExactly)).toBe(false);
        expect(anyOverlap(boxes, [], collidesExactly)).toBe(false);
    });

    it('matches a brute-force scan exactly when the exact predicate is AABB overlap', () => {
        // The index is conservative (never prunes a true overlap) and the exact predicate runs on
        // every survivor, so an index-backed any-collision must equal the brute-force result.
        let seed = 0x1234567;
        const next = () => {
            seed = (seed * 1103515245 + 12345) & 0x7fffffff;
            return seed / 0x7fffffff;
        };

        for (let trial = 0; trial < 500; trial++) {
            const queryCount = 1 + Math.floor(next() * 12);
            const obstacleCount = 1 + Math.floor(next() * 12);
            const queryBoxes = Array.from({ length: queryCount }, () => randomBox(next));
            const obstacles = Array.from({ length: obstacleCount }, () => {
                const box = randomBox(next);
                return { box, ref: box };
            });

            const bruteForce = obstacles.some((o) => queryBoxes.some((q) => collidesExactly(q, o.ref)));
            expect(anyOverlap(queryBoxes, obstacles, collidesExactly)).toBe(bruteForce);
        }
    });

    it('reuses its scratch index correctly across consecutive calls', () => {
        const far: BoxBounds = { x: 1000, y: 1000, width: 10, height: 10 };
        const hitA: BoxBounds = { x: 0, y: 0, width: 10, height: 10 };
        const hitB: BoxBounds = { x: 5, y: 5, width: 10, height: 10 };

        // A real collision, then a clear miss reusing the same scratch index, then a collision again.
        expect(anyOverlap([hitA], [{ box: hitB, ref: hitB }], collidesExactly)).toBe(true);
        expect(anyOverlap([hitA], [{ box: far, ref: far }], collidesExactly)).toBe(false);
        expect(anyOverlap([hitA], [{ box: hitB, ref: hitB }], collidesExactly)).toBe(true);
    });

    it('only reports a collision the exact predicate confirms, not merely a cell co-residency', () => {
        // Two boxes can share a grid cell without their AABBs overlapping; the exact predicate must
        // have the final say.
        const query: BoxBounds = { x: 0, y: 0, width: 4, height: 4 };
        const nearMiss: BoxBounds = { x: 5, y: 5, width: 4, height: 4 };

        expect(collidesExactly(query, nearMiss)).toBe(false);
        expect(anyOverlap([query], [{ box: nearMiss, ref: nearMiss }], collidesExactly)).toBe(false);
    });
});
