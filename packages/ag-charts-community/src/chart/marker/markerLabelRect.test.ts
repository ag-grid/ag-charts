import { describe, expect, it } from 'vitest';

import { setupMockCanvas } from '../../util/test/mockCanvas';
import { markerLabelRect } from './markerLabelRect';

describe('markerLabelRect', () => {
    setupMockCanvas();

    it('uses almost the whole square, centred', () => {
        const { width, height, cx, cy } = markerLabelRect('square');
        expect(width).toBeGreaterThan(0.9);
        expect(height).toBeGreaterThan(0.9);
        expect(cx).toBeCloseTo(0, 1);
        expect(cy).toBeCloseTo(0, 1);
    });

    it('inscribes a near-square in a circle and a smaller one in a diamond, both centred', () => {
        const circle = markerLabelRect('circle');
        const diamond = markerLabelRect('diamond');
        expect(circle.width).toBeCloseTo(0.7, 1);
        expect(circle.cx).toBeCloseTo(0, 1);
        expect(diamond.width).toBeCloseTo(0.5, 1);
        // A circle holds a larger inscribed rectangle than a diamond of the same diameter.
        expect(circle.width).toBeGreaterThan(diamond.width);
    });

    it('finds a wide, short rectangle for a heart', () => {
        const { width, height } = markerLabelRect('heart');
        expect(width).toBeGreaterThan(0.7);
        expect(width).toBeGreaterThan(height * 2);
    });

    it('offsets the rectangle into the wide part of an asymmetric shape', () => {
        // A triangle is widest at its base (bottom), so its largest rectangle sits below the centre.
        expect(markerLabelRect('triangle').cy).toBeGreaterThan(0.05);
        // A pin tapers to a point at the bottom, so its rectangle sits above the centre in the head.
        expect(markerLabelRect('pin').cy).toBeLessThan(-0.05);
    });

    it('falls back to the inscribed square for a custom shape that draws nothing', () => {
        const { width, height, cx, cy } = markerLabelRect(() => {});
        expect(width).toBeCloseTo(Math.SQRT1_2);
        expect(height).toBeCloseTo(Math.SQRT1_2);
        expect(cx).toBe(0);
        expect(cy).toBe(0);
    });

    it('analyses a custom rectangular path and caches the result per shape', () => {
        // A wide custom rectangle spanning 80% width, 30% height, centred.
        const wide = (p: any) => {
            const { path, x, y, size } = p;
            path.clear();
            path.rect(x - 0.4 * size, y - 0.15 * size, 0.8 * size, 0.3 * size);
        };
        const first = markerLabelRect(wide);
        expect(first.width).toBeGreaterThan(0.7);
        expect(first.height).toBeCloseTo(0.3, 1);
        // Same shape reference returns the identical cached object.
        expect(markerLabelRect(wide)).toBe(first);
    });
});
