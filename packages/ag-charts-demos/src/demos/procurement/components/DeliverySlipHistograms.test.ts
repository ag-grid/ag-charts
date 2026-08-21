import { describe, expect, it } from 'vitest';

import type { SlipDistribution } from '../types';
import { MAX_SLIP_DAYS, binned } from './DeliverySlipHistograms';

const distribution = (supplierId: string, slips: number[]): SlipDistribution => ({
    supplierId,
    supplier: supplierId,
    slips: [...slips].sort((a, b) => a - b),
});

const categories = (rows: SlipDistribution[]) =>
    binned(rows)
        .bars.values()
        .next()
        .value!.map((bar) => bar.day);

describe('slip histogram binning', () => {
    it('draws one bar per day up to the worst slip in the record', () => {
        const { bars } = binned([distribution('A', [-2, 0, 1, 1, 3])]);
        expect(bars.get('A')!.map((bar) => bar.day)).toEqual(['1', '2', '3']);
        // Early and on-time deliveries are the pie's to report, not the histogram's.
        expect(bars.get('A')!.map((bar) => bar.count)).toEqual([2, 0, 1]);
    });

    it('gives every supplier the same categories, so the facets line up', () => {
        const { bars } = binned([distribution('A', [1, 1]), distribution('B', [5])]);
        expect(bars.get('A')!.map((bar) => bar.day)).toEqual(bars.get('B')!.map((bar) => bar.day));
        expect(bars.get('B')!.at(-1)).toMatchObject({ day: '5', count: 1 });
    });

    /**
     * The guard that matters: one bad outlier must not set the category count. Without it a single
     * delivery a year late draws 365 near-empty bars in every facet.
     */
    it('folds everything past the cap into one terminal bar rather than widening the axis', () => {
        const outlier = MAX_SLIP_DAYS + 200;
        const { bars } = binned([distribution('A', [2, MAX_SLIP_DAYS + 1, outlier])]);
        const row = bars.get('A')!;

        expect(row.length).toBe(MAX_SLIP_DAYS + 1);
        const overflow = row.at(-1)!;
        expect(overflow.day).toBe(`${MAX_SLIP_DAYS + 1}+`);
        // Folded, not truncated — a cluster out in the tail is what this chart exists to surface.
        expect(overflow.count).toBe(2);
        expect(row.reduce((sum, bar) => sum + bar.count, 0)).toBe(3);
    });

    it('leaves the axis alone when nothing reaches the cap', () => {
        expect(categories([distribution('A', [MAX_SLIP_DAYS])])).toHaveLength(MAX_SLIP_DAYS);
        expect(categories([distribution('A', [MAX_SLIP_DAYS])]).at(-1)).toBe(String(MAX_SLIP_DAYS));
    });

    it('keeps one bar and a finite scale for a roster that missed nothing', () => {
        const { bars, maxCount } = binned([distribution('A', [-3, 0])]);
        expect(bars.get('A')).toEqual([{ day: '1', count: 0, slipLabel: '1d late' }]);
        expect(maxCount).toBe(1);
    });

    it('tops every facet out at the tallest bar any supplier puts up', () => {
        expect(binned([distribution('A', [1, 1, 1]), distribution('B', [1, 2])]).maxCount).toBe(3);
    });
});
