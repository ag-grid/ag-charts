import { beforeAll, describe, expect, it } from 'vitest';

import type { AgMarkerShape, AgMarkerShapeFn, AgMarkerShapeFnParams } from 'ag-charts-types';

import { stubPath2D } from '../test/stubPath2D';
import { clearMarkerPathCache, getSharedMarkerPath } from './markerPathCache';

beforeAll(stubPath2D);

describe('markerPathCache', () => {
    it('returns the same ExtendedPath2D for the same (shape, size)', () => {
        clearMarkerPathCache();
        const a = getSharedMarkerPath('circle', 12);
        const b = getSharedMarkerPath('circle', 12);
        expect(a).toBe(b);
        expect(a.getPath2D()).toBe(b.getPath2D());
    });

    it('throws for a name with no built-in shape', () => {
        clearMarkerPathCache();
        expect(() => getSharedMarkerPath('no-such-shape' as AgMarkerShape, 12)).toThrow(TypeError);
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

    it('serves a held custom path again after more sizes than the cache holds', () => {
        let traces = 0;
        const shape: AgMarkerShapeFn = ({ path, size }: AgMarkerShapeFnParams) => {
            traces++;
            path.rect(-size / 2, -size / 2, size, size);
        };
        const held = Array.from({ length: 3000 }, (_, size) => getSharedMarkerPath(shape, size + 1));
        expect(held.map((path, size) => getSharedMarkerPath(shape, size + 1) === path)).not.toContain(false);
        expect(traces).toBe(held.length);
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
