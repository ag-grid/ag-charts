import { describe, expect, it, test } from 'vitest';

import { ExtendedPath2D, strokeOpenLineEnds } from 'ag-charts-core';

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

/** The segments that `strokeOpenLineEnds` draws, as `[x, y, x, y]`. */
const openLineEnds = (path: ExtendedPath2D, reach: number) => {
    const segments: number[][] = [];
    strokeOpenLineEnds(
        path,
        {
            beginPath: () => {},
            moveTo: (x, y) => segments.push([x, y]),
            lineTo: (x, y) => segments.at(-1)?.push(x, y),
            stroke: () => {},
        },
        reach
    );
    return segments;
};

describe('ExtendedPath2D', () => {
    describe('strokeOpenLineEnds', () => {
        it('should extend both ends of an open run of lines by the reach, in line with the end segments', () => {
            const path = new ExtendedPath2D();
            path.moveTo(0, 0);
            path.lineTo(10, 0);
            path.lineTo(10, 20);

            const ends = openLineEnds(path, 3);

            // Each starts a unit inside the end segment, and runs the reach past the end.
            expect(ends).toEqual([
                [1, 0, -3, 0],
                [10, 19, 10, 23],
            ]);
        });

        it('should skip closed subpaths, curves and zero-length lines', () => {
            const path = new ExtendedPath2D();
            square(path, 5);
            path.moveTo(20, 0);
            path.arc(20, 0, 5, 0, Math.PI);
            path.moveTo(40, 0);
            path.lineTo(40, 0);

            expect(openLineEnds(path, 3)).toEqual([]);
        });

        it('should allocate end storage only for a path with an open run of lines', () => {
            const closed = new ExtendedPath2D();
            square(closed, 5);
            closed.moveTo(20, 0);
            closed.arc(20, 0, 5, 0, Math.PI);
            const open = new ExtendedPath2D();
            open.moveTo(0, 0);
            open.lineTo(10, 0);

            openLineEnds(closed, 3);
            openLineEnds(open, 3);

            expect(closed['openEnds']).toBeUndefined();
            expect(open['openEnds']).toHaveLength(8);
        });

        it('should draw nothing for a reach of 0', () => {
            const path = new ExtendedPath2D();
            path.moveTo(0, 0);
            path.lineTo(10, 0);

            expect(openLineEnds(path, 0)).toEqual([]);
        });

        it('should find the ends of a path cleared and rebuilt to the same number of commands with other geometry', () => {
            const path = new ExtendedPath2D();
            path.moveTo(0, 0);
            path.lineTo(10, 0);
            const before = openLineEnds(path, 3);

            path.clear();
            path.moveTo(50, 50);
            path.lineTo(50, 70);
            const after = openLineEnds(path, 3);

            expect(before).toEqual([
                [1, 0, -3, 0],
                [9, 0, 13, 0],
            ]);
            expect(after).toEqual([
                [50, 51, 50, 47],
                [50, 69, 50, 73],
            ]);
        });
    });

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
        test('a wedge excludes points on the diagonal through its apex', () => {
            const path = new ExtendedPath2D();
            path.moveTo(0, 0);
            path.lineTo(200, -200);
            path.arc(0, 0, 200 * Math.SQRT2, -Math.PI / 4, (3 * Math.PI) / 4);
            path.closePath();

            expect(path.isPointInPath(100, 100)).toBe(true);
            expect(path.isPointInPath(300, 300)).toBe(false);
            expect(path.isPointInPath(500, 500)).toBe(false);
            expect(path.isPointInPath(-300, -300)).toBe(false);
        });

        test('a point level with a vertex is classified by the edges around it', () => {
            const path = new ExtendedPath2D();
            path.moveTo(0, -100);
            path.lineTo(100, 0);
            path.lineTo(0, 100);
            path.lineTo(-100, 0);
            path.closePath();

            expect(path.isPointInPath(50, 0)).toBe(true);
            expect(path.isPointInPath(150, 0)).toBe(false);
            expect(path.isPointInPath(-150, 0)).toBe(false);
            expect(path.isPointInPath(0, 50)).toBe(true);
            expect(path.isPointInPath(0, 150)).toBe(false);
        });

        test('a circle built from arcs is classified level with its curve joins', () => {
            const path = new ExtendedPath2D();
            path.moveTo(100, 0);
            path.arc(0, 0, 100, 0, 2 * Math.PI);
            path.closePath();

            expect(path.isPointInPath(50, 0)).toBe(true);
            expect(path.isPointInPath(-50, 0)).toBe(true);
            expect(path.isPointInPath(150, 0)).toBe(false);
            expect(path.isPointInPath(-150, 0)).toBe(false);
            expect(path.isPointInPath(0, 50)).toBe(true);
            expect(path.isPointInPath(0, 150)).toBe(false);
            expect(path.isPointInPath(60, 60)).toBe(true);
            expect(path.isPointInPath(80, 80)).toBe(false);
        });

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
