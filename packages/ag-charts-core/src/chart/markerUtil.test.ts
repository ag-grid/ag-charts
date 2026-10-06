import { describe, expect, it } from 'vitest';

import { applySizeMode, areaSizeAtRatio } from './markerUtil';

describe('markerUtil size mode', () => {
    describe('areaSizeAtRatio', () => {
        it('returns exact endpoints', () => {
            expect(areaSizeAtRatio(0, 10, 30)).toBe(10);
            expect(areaSizeAtRatio(1, 10, 30)).toBe(30);
            expect(areaSizeAtRatio(-1, 10, 30)).toBe(10);
            expect(areaSizeAtRatio(2, 10, 30)).toBe(30);
        });

        it('makes area linear in the ratio', () => {
            expect(areaSizeAtRatio(0.5, 10, 30) ** 2).toBeCloseTo((10 ** 2 + 30 ** 2) / 2);
        });

        it('doubles the area for double the ratio when min is 0', () => {
            expect(areaSizeAtRatio(0.5, 0, 20) ** 2 * 2).toBeCloseTo(areaSizeAtRatio(1, 0, 20) ** 2);
        });

        it('resolves a collapsed or inverted range to min', () => {
            expect(areaSizeAtRatio(0.5, 10, 10)).toBe(10);
            expect(areaSizeAtRatio(0.5, 30, 10)).toBe(30);
        });
    });

    describe('applySizeMode', () => {
        it('leaves the size untouched in diameter mode', () => {
            expect(applySizeMode(17, 10, 30, 'diameter')).toBe(17);
        });

        it('re-maps the size in area mode', () => {
            expect(applySizeMode(10, 10, 30, 'area')).toBe(10);
            expect(applySizeMode(30, 10, 30, 'area')).toBe(30);
            expect(applySizeMode(20, 10, 30, 'area')).toBeCloseTo(Math.sqrt((10 ** 2 + 30 ** 2) / 2));
        });

        it('returns the size unchanged when max <= min', () => {
            expect(applySizeMode(10, 10, 10, 'area')).toBe(10);
        });
    });
});
