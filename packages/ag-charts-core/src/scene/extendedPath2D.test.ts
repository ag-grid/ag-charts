import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ExtendedPath2D } from './extendedPath2D';

/** Records the calls made on it, standing in for the canvas Path2D that jsdom lacks. */
class RecordingPath2D {
    calls: string[] = [];
    moveTo(x: number, y: number) {
        this.calls.push(`M ${x.toFixed(3)} ${y.toFixed(3)}`);
    }
    lineTo(x: number, y: number) {
        this.calls.push(`L ${x.toFixed(3)} ${y.toFixed(3)}`);
    }
    bezierCurveTo() {
        this.calls.push('C');
    }
    closePath() {
        this.calls.push('Z');
    }
}

function callsOf(path2d: unknown): string[] {
    if (!(path2d instanceof RecordingPath2D)) throw new Error('Expected a RecordingPath2D');
    return path2d.calls;
}

describe('ExtendedPath2D', () => {
    beforeEach(() => {
        vi.stubGlobal('Path2D', RecordingPath2D);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    describe('getFlattenedPath2D', () => {
        it('replaces a closed circle with line segments that keep its endpoints', () => {
            const path = new ExtendedPath2D();
            path.arc(0, 0, 10, 0, 2 * Math.PI);
            path.closePath();

            const calls = callsOf(path.getFlattenedPath2D(10));

            expect(calls.every((call) => /^[MLZ]/.test(call))).toBe(true);
            expect(calls[0]).toBe('M 10.000 0.000');
            expect(calls.at(-2)).toBe('L 10.000 -0.000');
            expect(calls.at(-1)).toBe('Z');
            expect(calls).toContain('L 0.000 10.000');
            expect(calls).toContain('L -10.000 0.000');
        });

        it('joins a full arc that is left open where it began', () => {
            const path = new ExtendedPath2D();
            path.arc(0, 0, 10, 0, 2 * Math.PI);
            path.moveTo(20, 0);
            path.lineTo(30, 0);

            const calls = callsOf(path.getFlattenedPath2D(10));

            expect(calls.indexOf('Z')).toBe(calls.indexOf('M 20.000 0.000') - 1);
            expect(calls.filter((call) => call === 'Z')).toHaveLength(1);
        });

        it('splits curves more finely as the stroke reaches further', () => {
            const path = new ExtendedPath2D();
            path.arc(0, 0, 10, 0, 2 * Math.PI);

            const near = callsOf(path.getFlattenedPath2D(5));
            const far = callsOf(path.getFlattenedPath2D(100));

            expect(near).toHaveLength(1 + 4 * 8 + 1);
            expect(far.length).toBeGreaterThan(near.length);
        });

        it('is rebuilt after the path is cleared or extended', () => {
            const path = new ExtendedPath2D();
            path.arc(0, 0, 10, 0, Math.PI);
            const first = path.getFlattenedPath2D(10);
            expect(path.getFlattenedPath2D(10)).toBe(first);

            path.lineTo(-20, 0);
            const extended = path.getFlattenedPath2D(10);
            expect(extended).not.toBe(first);
            expect(callsOf(extended).at(-1)).toBe('L -20.000 0.000');

            path.clear();
            path.arc(0, 0, 5, 0, Math.PI);
            expect(callsOf(path.getFlattenedPath2D(10))[0]).toBe('M 5.000 0.000');
        });
    });

    describe('minCurveRadius', () => {
        it('is the radius of an arc', () => {
            const path = new ExtendedPath2D();
            path.arc(0, 0, 3.5, 0, 2 * Math.PI);
            expect(path.minCurveRadius()).toBeCloseTo(3.5, 1);
        });

        it('is Infinity for a path without curves', () => {
            const path = new ExtendedPath2D();
            path.rect(0, 0, 10, 10);
            expect(path.minCurveRadius()).toBe(Infinity);
        });

        it('is recomputed after the path is cleared', () => {
            const path = new ExtendedPath2D();
            path.arc(0, 0, 10, 0, 2 * Math.PI);
            expect(path.minCurveRadius()).toBeCloseTo(10, 0);

            path.clear();
            path.rect(0, 0, 10, 10);
            expect(path.minCurveRadius()).toBe(Infinity);
        });
    });
});
