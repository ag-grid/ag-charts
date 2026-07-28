import { vi } from 'vitest';

import { Logger, type ScaleTickParams, ambientLogger } from 'ag-charts-core';
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

    describe('convert extrapolation beyond domain bounds', () => {
        const DAY_MS = 24 * 60 * 60 * 1000;

        it('extrapolates a value beyond max to a finite position past the last band', () => {
            const scale = createScale([new Date(2024, 0, 1), new Date(2024, 0, 10)], 'day');

            const lastBand = scale.convert(new Date(2024, 0, 10));
            const beyondMax = scale.convert(new Date(new Date(2024, 0, 10).valueOf() + DAY_MS));

            expect(Number.isFinite(beyondMax)).toBe(true);
            expect(beyondMax).toBeGreaterThan(lastBand);
        });

        it('extrapolates a value before min to a finite position before the first band', () => {
            const scale = createScale([new Date(2024, 0, 1), new Date(2024, 0, 10)], 'day');

            const firstBand = scale.convert(new Date(2024, 0, 1));
            const beforeMin = scale.convert(new Date(new Date(2024, 0, 1).valueOf() - DAY_MS));

            expect(Number.isFinite(beforeMin)).toBe(true);
            expect(beforeMin).toBeLessThan(firstBand);
        });

        it('leaves the in-bounds conversion unchanged', () => {
            const scale = new UnitTimeScale();
            scale.range = [0, 100];
            scale.domain = [new Date(2022, 0, 1), new Date(2022, 11, 1)];
            scale.interval = 'month';

            expect(scale.convert(new Date(2022, 11, 31))).toBeCloseTo(92, 0);
        });

        it('returns NaN when the domain has fewer than two bands', () => {
            const scale = new UnitTimeScale();
            scale.range = [0, 100];
            scale.domain = [new Date(2024, 0, 1)];
            scale.interval = 'day';

            expect(scale.convert(new Date(2024, 0, 5))).toBeNaN();
        });
    });

    it('coerces ISO string and bigint epoch to the same position as the equivalent Date', () => {
        const scale = new UnitTimeScale();
        scale.range = [0, 100];
        scale.domain = [new Date(Date.UTC(2022, 0, 1)), new Date(Date.UTC(2022, 11, 1))];
        scale.interval = 'month';

        const date = new Date(Date.UTC(2022, 5, 15));
        const expected = scale.convert(date);
        expect(scale.convert('2022-06-15T00:00:00Z')).toBeCloseTo(expected);
        expect(scale.convert(BigInt(date.valueOf()))).toBeCloseTo(expected);
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

    describe('too-many-bands warning routing', () => {
        // A ~54-year span at millisecond granularity yields ~1.7e12 bands, far past MAX_BANDS.
        const HUGE_DOMAIN: [Date, Date] = [new Date(1970, 0, 1), new Date(2024, 0, 1)];
        const WARNING = 'the configured unit results in too many bands, ignoring. Supply a larger unit.';

        it('routes the warning through the threaded per-chart logger, not the ambient one', () => {
            const scale = new UnitTimeScale();
            const logger = new Logger();
            const scopedWarn = vi.spyOn(logger, 'warnOnce').mockImplementation(() => {});
            const ambientWarn = vi.spyOn(ambientLogger, 'warnOnce').mockImplementation(() => {});

            scale.logger = logger;
            scale.domain = HUGE_DOMAIN;
            scale.interval = 'millisecond';
            scale.getBandCountForUpdate();

            expect(scopedWarn).toHaveBeenCalledWith(WARNING);
            expect(ambientWarn).not.toHaveBeenCalled();

            scopedWarn.mockRestore();
            ambientWarn.mockRestore();
        });

        it('falls back to the ambient logger when none is threaded', () => {
            const scale = new UnitTimeScale();
            const ambientWarn = vi.spyOn(ambientLogger, 'warnOnce').mockImplementation(() => {});

            scale.domain = HUGE_DOMAIN;
            scale.interval = 'millisecond';
            scale.getBandCountForUpdate();

            expect(ambientWarn).toHaveBeenCalledWith(WARNING);

            ambientWarn.mockRestore();
        });
    });
});
