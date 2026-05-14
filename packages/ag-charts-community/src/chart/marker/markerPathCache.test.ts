import { describe, expect, it } from '@jest/globals';

import type { AgMarkerShapeFn, AgMarkerShapeFnParams } from 'ag-charts-types';

import { clearMarkerPathCache, getSharedMarkerPath } from './markerPathCache';

const CENTRE = { x: 0.5, y: 0.5 };
const BOTTOM_ANCHOR = { x: 0.5, y: 1 };

describe('markerPathCache', () => {
    it('returns the same ExtendedPath2D for the same (shape, size)', () => {
        clearMarkerPathCache();
        const a = getSharedMarkerPath('circle', 12, CENTRE);
        const b = getSharedMarkerPath('circle', 12, CENTRE);
        expect(a).toBe(b);
        expect(a.getPath2D()).toBe(b.getPath2D());
    });

    it('returns distinct paths for different sizes', () => {
        clearMarkerPathCache();
        const small = getSharedMarkerPath('circle', 8, CENTRE);
        const large = getSharedMarkerPath('circle', 16, CENTRE);
        expect(small).not.toBe(large);
    });

    it('returns distinct paths for different shapes', () => {
        clearMarkerPathCache();
        const circle = getSharedMarkerPath('circle', 12, CENTRE);
        const square = getSharedMarkerPath('square', 12, CENTRE);
        expect(circle).not.toBe(square);
    });

    it('caches custom shape functions by identity and size', () => {
        clearMarkerPathCache();
        const customA: AgMarkerShapeFn = ({ path, size }: AgMarkerShapeFnParams) => {
            const r = size / 2;
            path.arc(0, 0, r, 0, Math.PI * 2);
            path.closePath();
        };
        const customB: AgMarkerShapeFn = ({ path, size }: AgMarkerShapeFnParams) => {
            path.moveTo(0, 0);
            path.lineTo(size, size);
            path.closePath();
        };

        const a1 = getSharedMarkerPath(customA, 10, CENTRE);
        const a2 = getSharedMarkerPath(customA, 10, CENTRE);
        const a3 = getSharedMarkerPath(customA, 20, CENTRE);
        const b1 = getSharedMarkerPath(customB, 10, CENTRE);

        expect(a1).toBe(a2);
        expect(a1).not.toBe(a3);
        expect(a1).not.toBe(b1);
    });

    it('authors centre-anchored shapes around the origin', () => {
        clearMarkerPathCache();
        const path = getSharedMarkerPath('square', 10, CENTRE);
        const bb = path.computeBBox();
        // Square of size 10 with centre anchor spans (-5, -5) to (5, 5).
        expect(bb.x).toBeCloseTo(-5);
        expect(bb.y).toBeCloseTo(-5);
        expect(bb.width).toBeCloseTo(10);
        expect(bb.height).toBeCloseTo(10);
    });

    it('shifts geometry so the anchor lands at the origin', () => {
        clearMarkerPathCache();
        // Pin-style bottom anchor (y=1): geometry should extend above the origin only.
        const path = getSharedMarkerPath('square', 10, BOTTOM_ANCHOR);
        const bb = path.computeBBox();
        expect(bb.x).toBeCloseTo(-5);
        expect(bb.y).toBeCloseTo(-10);
        expect(bb.width).toBeCloseTo(10);
        expect(bb.height).toBeCloseTo(10);
    });
});
