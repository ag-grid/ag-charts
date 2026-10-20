import { describe, expect, it } from 'vitest';

import type { AgInitialStateZoomRatio } from 'ag-charts-community';

import { fitWidthZoom } from './DeliveryMap';

/** A ratio's bounds, as NaN when absent so an assertion on a missing ratio fails rather than passes. */
const bounds = (ratio: AgInitialStateZoomRatio | undefined) => ({
    start: ratio?.start ?? Number.NaN,
    end: ratio?.end ?? Number.NaN,
});

describe('fitWidthZoom', () => {
    it('leaves a box the unzoomed map already fills, or one not yet measured, alone', () => {
        expect(fitWidthZoom(400, 2000)).toBeUndefined();
        expect(fitWidthZoom(0, 0)).toBeUndefined();
    });

    it('spans the full width with an equal share of the height, inside the map', () => {
        const zoom = fitWidthZoom(2000, 500);
        const x = bounds(zoom?.ratioX);
        const y = bounds(zoom?.ratioY);
        expect(x.start + x.end).toBeCloseTo(1, 10);
        expect(y.end - y.start).toBeCloseTo(x.end - x.start, 10);
        expect(y.start).toBeGreaterThanOrEqual(0);
        expect(y.end).toBeLessThanOrEqual(1);
    });

    it('keeps the band of latitudes centred on the same lanes as the box changes shape', () => {
        const centre = (width: number, height: number) => {
            const y = bounds(fitWidthZoom(width, height)?.ratioY);
            expect(y.start).toBeGreaterThan(0);
            expect(y.end).toBeLessThan(1);
            return (y.start + y.end) / 2;
        };
        expect(centre(2000, 500)).toBeCloseTo(centre(2000, 700), 10);
    });
});
