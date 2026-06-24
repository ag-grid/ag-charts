import { describe, expect, it } from 'vitest';

import { type BoxBounds, boxCollides } from 'ag-charts-core';

import { LabelManager } from './labelManager';

/** Deterministic LCG so the randomised oracle test is reproducible. */
function makeRng(seed: number) {
    let s = seed;
    return () => {
        s = (s * 1103515245 + 12345) & 0x7fffffff;
        return s / 0x7fffffff;
    };
}

function randomBox(rng: () => number): BoxBounds {
    return { x: rng() * 400 - 200, y: rng() * 400 - 200, width: 5 + rng() * 50, height: 5 + rng() * 50 };
}

describe('LabelManager.anyObstacleCollision', () => {
    const collidesExactly = (a: BoxBounds, b: BoxBounds) => boxCollides(a, b.x, b.y, b.width, b.height);

    it('returns false when there are no query boxes or no obstacles', () => {
        const manager = new LabelManager();
        const boxes: BoxBounds[] = [{ x: 0, y: 0, width: 10, height: 10 }];
        const obstacles = boxes.map((box) => ({ box, ref: box }));

        expect(manager.anyObstacleCollision([], obstacles, collidesExactly)).toBe(false);
        expect(manager.anyObstacleCollision(boxes, [], collidesExactly)).toBe(false);
    });

    it('matches a brute-force scan exactly when the exact predicate is AABB overlap', () => {
        // The index is conservative (never prunes a true overlap) and the exact predicate runs on
        // every survivor, so an index-backed any-collision must equal the brute-force result.
        const manager = new LabelManager();
        const rng = makeRng(0x1234567);

        for (let trial = 0; trial < 500; trial++) {
            const queryCount = 1 + Math.floor(rng() * 12);
            const obstacleCount = 1 + Math.floor(rng() * 12);
            const queryBoxes = Array.from({ length: queryCount }, () => randomBox(rng));
            const obstacles = Array.from({ length: obstacleCount }, () => {
                const box = randomBox(rng);
                return { box, ref: box };
            });

            const bruteForce = obstacles.some((o) => queryBoxes.some((q) => collidesExactly(q, o.ref)));
            expect(manager.anyObstacleCollision(queryBoxes, obstacles, collidesExactly)).toBe(bruteForce);
        }
    });

    it('reuses its scratch index correctly across consecutive calls', () => {
        const manager = new LabelManager();
        const far: BoxBounds = { x: 1000, y: 1000, width: 10, height: 10 };
        const hitA: BoxBounds = { x: 0, y: 0, width: 10, height: 10 };
        const hitB: BoxBounds = { x: 5, y: 5, width: 10, height: 10 };

        // A real collision, then a clear miss reusing the same scratch index, then a collision again.
        expect(manager.anyObstacleCollision([hitA], [{ box: hitB, ref: hitB }], collidesExactly)).toBe(true);
        expect(manager.anyObstacleCollision([hitA], [{ box: far, ref: far }], collidesExactly)).toBe(false);
        expect(manager.anyObstacleCollision([hitA], [{ box: hitB, ref: hitB }], collidesExactly)).toBe(true);
    });

    it('only reports a collision the exact predicate confirms, not merely a cell co-residency', () => {
        // Two boxes can share a grid cell without their AABBs overlapping; the exact predicate must
        // have the final say.
        const manager = new LabelManager();
        const query: BoxBounds = { x: 0, y: 0, width: 4, height: 4 };
        const nearMiss: BoxBounds = { x: 5, y: 5, width: 4, height: 4 };

        expect(collidesExactly(query, nearMiss)).toBe(false);
        expect(manager.anyObstacleCollision([query], [{ box: nearMiss, ref: nearMiss }], collidesExactly)).toBe(false);
    });
});
