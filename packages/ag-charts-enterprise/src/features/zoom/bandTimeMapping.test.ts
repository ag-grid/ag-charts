import { describe, expect, it } from 'vitest';

import { createBandTimeMapping } from './bandTimeMapping';

const day = 1000 * 60 * 60 * 24;

describe('createBandTimeMapping', () => {
    // Bands start on days 0, 4, 8 and 9, so the time axis spans 12 days with the last band as wide as the average band, 3 days.
    const bands = [0, 4, 8, 9].map((offset) => new Date(offset * day));

    it('maps band positions to the share of time they start at', () => {
        const mapping = createBandTimeMapping(bands)!;

        expect(mapping.toTimeRatio(0)).toBe(0);
        expect(mapping.toTimeRatio(0.25)).toBeCloseTo(1 / 3);
        expect(mapping.toTimeRatio(0.5)).toBeCloseTo(2 / 3);
        expect(mapping.toTimeRatio(0.75)).toBeCloseTo(0.75);
        expect(mapping.toTimeRatio(1)).toBeCloseTo(1);
    });

    it('interpolates within a band', () => {
        const mapping = createBandTimeMapping(bands)!;

        expect(mapping.toTimeRatio(0.125)).toBeCloseTo(1 / 6);
        expect(mapping.fromTimeRatio(1 / 6)).toBeCloseTo(0.125);
    });

    it('is the identity for evenly spaced bands', () => {
        const mapping = createBandTimeMapping([0, 2, 4, 6, 8].map((offset) => new Date(offset * day)))!;

        for (const ratio of [0, 0.2, 0.5, 0.9, 1]) {
            expect(mapping.toTimeRatio(ratio)).toBeCloseTo(ratio);
        }
    });

    it('round-trips ratios', () => {
        const mapping = createBandTimeMapping(bands)!;

        for (const ratio of [0, 0.1, 0.25, 0.4, 0.5, 0.77, 0.9, 1]) {
            expect(mapping.fromTimeRatio(mapping.toTimeRatio(ratio))).toBeCloseTo(ratio);
        }
    });

    it('clamps out-of-range ratios', () => {
        const mapping = createBandTimeMapping(bands)!;

        expect(mapping.toTimeRatio(-1)).toBe(0);
        expect(mapping.toTimeRatio(2)).toBeCloseTo(1);
        expect(mapping.fromTimeRatio(-1)).toBe(0);
        expect(mapping.fromTimeRatio(2)).toBeCloseTo(1);
    });

    it('has no mapping without at least two bands', () => {
        expect(createBandTimeMapping([])).toBeUndefined();
        expect(createBandTimeMapping([new Date(0)])).toBeUndefined();
    });
});
