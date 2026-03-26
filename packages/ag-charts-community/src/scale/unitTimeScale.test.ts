import type { ScaleTickParams } from 'ag-charts-core';
import type { AgTimeInterval, AgTimeIntervalUnit } from 'ag-charts-types';

import { UnitTimeScale } from './unitTimeScale';

type TickInterval = AgTimeInterval | AgTimeIntervalUnit | number;

function createScale(domain: [Date, Date], interval: AgTimeIntervalUnit | AgTimeInterval) {
    const scale = new UnitTimeScale();
    scale.range = [0, 100];
    scale.domain = domain;
    scale.interval = interval;
    return scale;
}

function tickParams(interval: TickInterval): ScaleTickParams<TickInterval> {
    return { interval, nice: [false], tickCount: undefined, minTickCount: 0, maxTickCount: Infinity };
}

function tickTimestamps(
    scale: UnitTimeScale,
    interval: TickInterval,
    domain?: Date[],
    visibleRange?: [number, number]
) {
    const result = scale.ticks(tickParams(interval), domain, visibleRange);
    return result?.ticks.map((d) => d.valueOf()) ?? [];
}

describe('UnitTimeScale', () => {
    it('converts a monthly value in the final band', () => {
        const scale = new UnitTimeScale();
        scale.range = [0, 100];
        scale.domain = [new Date(2022, 0, 1), new Date(2022, 11, 1)];
        scale.interval = 'month';

        const lastBandValue = new Date(2022, 11, 31);
        const convertedValue = scale.convert(lastBandValue);

        expect(convertedValue).toBeCloseTo(92, 0);
    });

    describe('ticksFromNumericBands equivalence', () => {
        it('produces ticks for daily interval with year tick step', () => {
            const domain: [Date, Date] = [new Date(2020, 0, 1), new Date(2024, 0, 1)];
            const scale = createScale(domain, 'day');

            const result = tickTimestamps(scale, { unit: 'year', step: 1 });
            expect(result.length).toBeGreaterThan(0);

            const d0 = domain[0].valueOf();
            const d1 = domain[1].valueOf();
            for (const t of result) {
                expect(t).toBeGreaterThanOrEqual(d0);
                expect(t).toBeLessThanOrEqual(d1);
            }
        });

        it('produces ticks for monthly interval with year tick step', () => {
            const domain: [Date, Date] = [new Date(2020, 0, 1), new Date(2025, 0, 1)];
            const scale = createScale(domain, 'month');

            const result = tickTimestamps(scale, { unit: 'year', step: 1 });
            expect(result.length).toBeGreaterThan(0);

            for (const t of result) {
                const d = new Date(t);
                expect(d.getMonth()).toBe(0);
                expect(d.getDate()).toBe(1);
            }
        });

        it('produces ticks for hourly interval with day tick step', () => {
            const domain: [Date, Date] = [new Date(2024, 0, 1), new Date(2024, 0, 3)];
            const scale = createScale(domain, 'hour');

            const result = tickTimestamps(scale, { unit: 'day', step: 1 });
            expect(result.length).toBeGreaterThan(0);
        });

        it('produces ticks for numeric interval', () => {
            const domain: [Date, Date] = [new Date(2024, 0, 1), new Date(2024, 0, 10)];
            const scale = createScale(domain, 'day');

            const result = tickTimestamps(scale, 9);
            expect(result.length).toBeGreaterThan(0);
        });

        it('fast path ticks contain all fallback path ticks for a sub-domain', () => {
            const domain: [Date, Date] = [new Date(2024, 0, 1), new Date(2024, 6, 1)];
            const scale = createScale(domain, 'day');

            // Own domain → fast path (ticksFromNumericBands)
            const fastResult = tickTimestamps(scale, { unit: 'month', step: 1 });

            // Sub-domain → fallback path (ticksFromBands)
            const subDomain = [new Date(2024, 1, 1), new Date(2024, 5, 1)];
            const fallbackResult = tickTimestamps(scale, { unit: 'month', step: 1 }, subDomain);

            for (const t of fallbackResult) {
                expect(fastResult).toContain(t);
            }
        });
    });

    describe('domain setter value equality', () => {
        it('preserves bands cache when domain values are unchanged', () => {
            const scale = createScale([new Date(2024, 0, 1), new Date(2024, 3, 1)], 'day');

            const bands1 = scale.bands;
            expect(bands1.length).toBeGreaterThan(0);

            // New array with identical date values
            scale.domain = [new Date(2024, 0, 1), new Date(2024, 3, 1)];

            const bands2 = scale.bands;
            expect(bands2).toBe(bands1);
        });

        it('invalidates caches when domain values change', () => {
            const scale = createScale([new Date(2024, 0, 1), new Date(2024, 3, 1)], 'day');

            const bands1 = scale.bands;
            expect(bands1.length).toBeGreaterThan(0);

            scale.domain = [new Date(2024, 0, 1), new Date(2024, 6, 1)];

            const bands2 = scale.bands;
            expect(bands2).not.toBe(bands1);
            expect(bands2.length).toBeGreaterThan(bands1.length);
        });
    });

    describe('edge cases', () => {
        it('returns undefined for empty domain', () => {
            const scale = new UnitTimeScale();
            scale.range = [0, 100];
            scale.domain = [];
            scale.interval = 'day';

            const result = scale.ticks(tickParams({ unit: 'day', step: 1 }));
            expect(result).toBeUndefined();
        });

        it('handles single-day domain', () => {
            const d = new Date(2024, 5, 15);
            const scale = createScale([d, d], 'day');

            const result = scale.ticks(tickParams({ unit: 'day', step: 1 }));
            expect(result?.ticks.length ?? 0).toBeLessThanOrEqual(1);
        });

        it('handles reversed domain', () => {
            const scale = createScale([new Date(2024, 6, 1), new Date(2024, 0, 1)], 'month');

            const result = tickTimestamps(scale, { unit: 'month', step: 1 });
            expect(result.length).toBeGreaterThanOrEqual(0);
        });

        it('handles partial visible range', () => {
            const scale = createScale([new Date(2024, 0, 1), new Date(2024, 11, 31)], 'day');

            const fullRange = tickTimestamps(scale, { unit: 'month', step: 1 });
            const partialRange = tickTimestamps(scale, { unit: 'month', step: 1 }, undefined, [0.25, 0.75]);

            expect(partialRange.length).toBeLessThanOrEqual(fullRange.length);
        });

        it('repeated ticks() calls are fast due to caching', () => {
            const start = new Date(2000, 0, 1);
            const end = new Date(2027, 4, 19);
            const scale = createScale([start, end], 'day');

            const t0 = performance.now();
            for (let i = 0; i < 10; i++) {
                scale.ticks(tickParams({ unit: 'year', step: 1 }));
            }
            const elapsed = performance.now() - t0;

            expect(elapsed).toBeLessThan(100);
        });
    });
});
