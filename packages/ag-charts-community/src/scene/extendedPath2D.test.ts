import { describe, expect, test } from 'vitest';

import { ExtendedPath2D } from './extendedPath2D';

const square = (path: ExtendedPath2D, half: number, reverse = false) => {
    const corners = [
        [-half, -half],
        [half, -half],
        [half, half],
        [-half, half],
    ];
    if (reverse) corners.reverse();
    path.moveTo(corners[0][0], corners[0][1]);
    for (const [x, y] of corners.slice(1)) {
        path.lineTo(x, y);
    }
    path.closePath();
};

describe('ExtendedPath2D', () => {
    describe('distanceSquared', () => {
        test('keeps the nearest curve when a farther one follows', () => {
            const path = new ExtendedPath2D();
            path.moveTo(100, 0);
            path.arc(0, 0, 100, 0, 2 * Math.PI);
            path.moveTo(50, 0);
            path.arc(0, 0, 50, 0, 2 * Math.PI);

            expect(path.distanceSquared(102, 0)).toBeLessThan(9);
            expect(path.distanceSquared(0, 52)).toBeLessThan(9);
        });
    });

    describe('isPointInPath', () => {
        test('a ring of two closed subpaths excludes its hole', () => {
            const path = new ExtendedPath2D();
            square(path, 100);
            square(path, 50, true);

            expect(path.isPointInPath(10, 75)).toBe(true);
            expect(path.isPointInPath(75, 10)).toBe(true);
            expect(path.isPointInPath(10, 0)).toBe(false);
            expect(path.isPointInPath(0, 25)).toBe(false);
            expect(path.isPointInPath(10, 125)).toBe(false);
        });

        test('two coincident closed subpaths have no interior', () => {
            const path = new ExtendedPath2D();
            square(path, 100);
            square(path, 100, true);

            expect(path.isPointInPath(10, 0)).toBe(false);
            expect(path.isPointInPath(0, 50)).toBe(false);
        });
    });
});
