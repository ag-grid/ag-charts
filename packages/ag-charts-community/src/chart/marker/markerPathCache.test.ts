import { describe, expect, it } from '@jest/globals';

import type { AgMarkerShapeFn, AgMarkerShapeFnParams } from 'ag-charts-types';

import { clearMarkerPathCache, getSharedMarkerPath } from './markerPathCache';

describe('markerPathCache', () => {
    it('returns the same ExtendedPath2D for the same (shape, size)', () => {
        clearMarkerPathCache();
        const a = getSharedMarkerPath('circle', 12);
        const b = getSharedMarkerPath('circle', 12);
        expect(a).toBe(b);
        expect(a.getPath2D()).toBe(b.getPath2D());
    });

    it('returns distinct paths for different sizes', () => {
        clearMarkerPathCache();
        const small = getSharedMarkerPath('circle', 8);
        const large = getSharedMarkerPath('circle', 16);
        expect(small).not.toBe(large);
    });

    it('returns distinct paths for different shapes', () => {
        clearMarkerPathCache();
        const circle = getSharedMarkerPath('circle', 12);
        const square = getSharedMarkerPath('square', 12);
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

        const a1 = getSharedMarkerPath(customA, 10);
        const a2 = getSharedMarkerPath(customA, 10);
        const a3 = getSharedMarkerPath(customA, 20);
        const b1 = getSharedMarkerPath(customB, 10);

        expect(a1).toBe(a2);
        expect(a1).not.toBe(a3);
        expect(a1).not.toBe(b1);
    });

    it('authors square geometry at origin (no pixelRatio dependence)', () => {
        clearMarkerPathCache();
        const path = getSharedMarkerPath('square', 10);
        const bb = path.computeBBox();
        // Square of size 10 centred at origin spans (-5, -5) to (5, 5).
        expect(bb.x).toBeCloseTo(-5);
        expect(bb.y).toBeCloseTo(-5);
        expect(bb.width).toBeCloseTo(10);
        expect(bb.height).toBeCloseTo(10);
    });
});
