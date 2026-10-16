import { describe, expect, it } from 'vitest';

import {
    type OrientedRect,
    orientedRectOverlapsBox,
    orientedRectOverlapsCircle,
    orientedRectsOverlap,
    writeOrientedRect,
} from './orientedRect';

const rect = (cx: number, cy: number, width: number, height: number, rotationDeg: number): OrientedRect =>
    writeOrientedRect(
        { cx: 0, cy: 0, halfWidth: 0, halfHeight: 0, cos: 1, sin: 0 },
        cx,
        cy,
        width,
        height,
        rotationDeg
    );

describe('orientedRectsOverlap', () => {
    it('clears rotated rectangles lying side by side whose bounding boxes overlap', () => {
        const offset = 24 * Math.SQRT1_2;
        expect(orientedRectsOverlap(rect(100, 100, 50, 20, 45), rect(100 - offset, 100 + offset, 50, 20, 45))).toBe(
            false
        );
    });

    it('detects rotated rectangles that cross', () => {
        expect(orientedRectsOverlap(rect(100, 100, 50, 10, 45), rect(100, 100, 50, 10, -45))).toBe(true);
    });

    it('treats rectangles that only touch as clear', () => {
        expect(orientedRectsOverlap(rect(0, 0, 10, 10, 0), rect(10, 0, 10, 10, 0))).toBe(false);
    });

    it('is symmetric', () => {
        const tilted = rect(0, 0, 40, 6, 30);
        const crossing = rect(18, 14, 40, 6, -60);
        expect(orientedRectsOverlap(tilted, crossing)).toBe(orientedRectsOverlap(crossing, tilted));
    });
});

describe('orientedRectOverlapsBox', () => {
    const diagonal = rect(50, 50, 60, 10, 45);

    it('clears a box in the corner the rotated rectangle leaves empty', () => {
        expect(orientedRectOverlapsBox(diagonal, { x: 60, y: 25, width: 10, height: 10 })).toBe(false);
    });

    it('detects a box on the rotated rectangle', () => {
        expect(orientedRectOverlapsBox(diagonal, { x: 60, y: 60, width: 10, height: 10 })).toBe(true);
    });
});

describe('orientedRectOverlapsCircle', () => {
    const diagonal = rect(50, 50, 60, 10, 45);

    it('clears a circle in the corner the rotated rectangle leaves empty', () => {
        expect(orientedRectOverlapsCircle(diagonal, 65, 30, 5)).toBe(false);
    });

    it('detects a circle on the rotated rectangle', () => {
        expect(orientedRectOverlapsCircle(diagonal, 65, 65, 5)).toBe(true);
    });
});
