import { type Mock, vi } from 'vitest';

import type { AgTimeInterval, AgTimeIntervalUnit } from 'ag-charts-types';

import { Logger, ambientLogger } from '../../logging/logger';
import { intervalRangeNumeric } from '../../time/range';
import { ScaleAlignment, type ScaleTickParams } from '../../types/scales';
import { UnitTimeScale } from './unitTimeScale';

vi.mock('../../time/range', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../../time/range')>();
    return { ...actual, intervalRangeNumeric: vi.fn(actual.intervalRangeNumeric) };
});

const intervalRangeNumericSpy = intervalRangeNumeric as Mock<typeof intervalRangeNumeric>;

class ExposedUnitTimeScale extends UnitTimeScale {
    get exposedNumericBands() {
        return this.numericBands;
    }
}

type TickInterval = AgTimeInterval | AgTimeIntervalUnit | number;

function createScale(domain: [Date, Date], interval: AgTimeIntervalUnit | AgTimeInterval) {
    const scale = new ExposedUnitTimeScale();
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
    beforeEach(() => {
        intervalRangeNumericSpy.mockClear();
    });

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

    describe('clamped convert', () => {
        const createMonthlyScale = () => createScale([new Date(2022, 0, 1), new Date(2022, 11, 1)], 'month');

        it('keeps a value inside the final band on that band', () => {
            const scale = createMonthlyScale();

            expect(scale.convert(new Date(2022, 11, 15), { clamp: true })).toBeCloseTo(
                scale.convert(new Date(2022, 11, 1))
            );
        });

        it('clamps a value past the final band to the range end', () => {
            const scale = createMonthlyScale();

            expect(scale.convert(new Date(2023, 0, 1), { clamp: true })).toBe(100);
        });

        it('clamps a trailing-aligned value inside the final band to the range end', () => {
            const scale = createMonthlyScale();

            expect(scale.convert(new Date(2022, 11, 15), { clamp: true, alignment: ScaleAlignment.Trailing })).toBe(
                100
            );
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

    describe('band caches across temporary domain swaps', () => {
        const DOMAIN: [Date, Date] = [new Date(2020, 0, 1), new Date(2024, 0, 1)];
        const sameDomain = (): [Date, Date] => [new Date(DOMAIN[0]), new Date(DOMAIN[1])];

        function observe(scale: ExposedUnitTimeScale) {
            const probe = new Date(2022, 5, 15, 10);
            return {
                convert: scale.convert(probe),
                convertClamped: scale.convert(new Date(2030, 0, 1), { clamp: true }),
                invert: scale.invert(37)?.valueOf(),
                invertNearest: scale.invert(61, true)?.valueOf(),
                ticks: tickTimestamps(scale, { unit: 'month', step: 1 }),
                partialTicks: tickTimestamps(scale, { unit: 'month', step: 1 }, undefined, [0.25, 0.75]),
                findIndexLeading: scale.findIndex(probe),
                findIndexTrailing: scale.findIndex(probe, ScaleAlignment.Trailing),
                bands: scale.bands.map((d) => d.valueOf()),
                numericBands: [...scale.exposedNumericBands],
                linearParams: scale.getLinearParams(),
                uniformity: scale.getUniformityCache(),
                partialUniformity: scale.getUniformityCache([0.25, 0.75]),
            };
        }

        it('reuses the bands across a [] → D → [] → D round trip', () => {
            const scale = createScale(DOMAIN, 'day');
            const bands = scale.bands;
            const numericBands = scale.exposedNumericBands;
            expect(intervalRangeNumericSpy).toHaveBeenCalledTimes(1);

            scale.domain = [];
            scale.domain = sameDomain();
            scale.domain = [];
            scale.domain = sameDomain();

            expect(scale.bands).toBe(bands);
            expect(scale.exposedNumericBands).toBe(numericBands);
            expect(intervalRangeNumericSpy).toHaveBeenCalledTimes(1);
        });

        it('returns identical results after a round trip', () => {
            const scale = createScale(DOMAIN, 'day');
            const before = observe(scale);
            expect(before.uniformity?.isUniform).toBe(true);

            scale.domain = [];
            scale.domain = sameDomain();

            expect(observe(scale)).toEqual(before);
            expect(intervalRangeNumericSpy).toHaveBeenCalledTimes(1);
        });

        it('keeps the bands when different endpoints floor to the same band range', () => {
            const scale = createScale([new Date(2024, 0, 1), new Date(2024, 0, 10)], 'day');
            const bands = scale.bands;

            scale.domain = [new Date(2024, 0, 1, 6), new Date(2024, 0, 10, 18)];

            expect(scale.bands).toBe(bands);
            expect(intervalRangeNumericSpy).toHaveBeenCalledTimes(1);
        });

        it('rebuilds when the floored endpoints change', () => {
            const scale = createScale([new Date(2024, 0, 1), new Date(2024, 0, 10)], 'day');
            const bands = scale.bands;

            scale.domain = [new Date(2024, 0, 1), new Date(2024, 0, 11)];

            expect(scale.bands).not.toBe(bands);
            expect(scale.bands).toHaveLength(bands.length + 1);
            expect(intervalRangeNumericSpy).toHaveBeenCalledTimes(2);
        });

        it('rebuilds when the floored endpoints change across an empty domain', () => {
            const scale = createScale([new Date(2024, 0, 1), new Date(2024, 0, 10)], 'day');
            const bands = scale.bands;

            scale.domain = [];
            scale.domain = [new Date(2024, 0, 2), new Date(2024, 0, 10)];

            expect(scale.bands).not.toBe(bands);
            expect(scale.bands).toHaveLength(bands.length - 1);
            expect(intervalRangeNumericSpy).toHaveBeenCalledTimes(2);
        });

        it.each([
            ['unit', { unit: 'hour' }],
            ['step', { unit: 'day', step: 2 }],
        ] as const)('rebuilds when the interval %s changes', (_field, changed) => {
            const scale = createScale([new Date(2024, 0, 1), new Date(2024, 0, 10)], 'day');
            const bands = scale.bands;

            scale.interval = changed;

            expect(scale.bands).not.toBe(bands);
            expect(intervalRangeNumericSpy).toHaveBeenCalledTimes(2);
        });

        it('reuses the bands when the interval is set to an equal value', () => {
            const scale = createScale([new Date(2024, 0, 1), new Date(2024, 0, 10)], 'day');
            const bands = scale.bands;

            scale.interval = { unit: 'day' };

            expect(scale.bands).toBe(bands);
            expect(intervalRangeNumericSpy).toHaveBeenCalledTimes(1);
        });

        // The interval setter ignores epoch and utc changes, so they only reach the scale
        // when the interval object is edited in place.
        it.each([
            ['epoch', (interval: AgTimeInterval) => (interval.epoch = new Date(2024, 0, 3))],
            ['utc', (interval: AgTimeInterval) => (interval.utc = true)],
        ])('rebuilds when the interval %s changes', (_field, mutate) => {
            const interval: AgTimeInterval = { unit: 'day', step: 1 };
            const scale = createScale([new Date(2024, 0, 1), new Date(2024, 0, 10)], interval);
            const bands = scale.bands;

            mutate(interval);
            scale.domain = [];
            scale.domain = [new Date(2024, 0, 1), new Date(2024, 0, 10)];

            expect(scale.bands).not.toBe(bands);
            expect(intervalRangeNumericSpy).toHaveBeenCalledTimes(2);
        });

        it('returns no bands while the domain is empty and keeps the entry for the return', () => {
            const scale = createScale(DOMAIN, 'day');
            const bands = scale.bands;

            scale.domain = [];

            expect(scale.bands).toEqual([]);
            expect(scale.exposedNumericBands).toEqual([]);
            expect(scale.getBandCountForUpdate()).toBe(0);
            expect(scale.getLinearParams()).toBeUndefined();
            expect(scale.getUniformityCache()).toBeUndefined();
            expect(scale.convert(DOMAIN[0])).toBeNaN();

            scale.domain = sameDomain();

            expect(scale.bands).toBe(bands);
            expect(intervalRangeNumericSpy).toHaveBeenCalledTimes(1);
        });

        it('returns no bands for a single-element domain and keeps the entry for the return', () => {
            const scale = createScale(DOMAIN, 'day');
            const bands = scale.bands;

            scale.domain = [DOMAIN[0]];
            expect(scale.bands).toEqual([]);

            scale.domain = sameDomain();
            expect(scale.bands).toBe(bands);
            expect(intervalRangeNumericSpy).toHaveBeenCalledTimes(1);
        });

        it('returns no bands without an interval and keeps the entry for the return', () => {
            const scale = createScale(DOMAIN, 'day');
            const bands = scale.bands;

            scale.interval = undefined;
            expect(scale.bands).toEqual([]);
            expect(scale.getBandCountForUpdate()).toBe(0);

            scale.interval = 'day';
            expect(scale.bands).toBe(bands);
            expect(intervalRangeNumericSpy).toHaveBeenCalledTimes(1);
        });

        it('does not return a stale entry after an over-limit domain swap', () => {
            const ambientWarn = vi.spyOn(ambientLogger, 'warnOnce').mockImplementation(() => {});
            const small: [Date, Date] = [new Date(2024, 0, 1), new Date(2024, 0, 2)];
            const scale = createScale(small, 'second');
            const smallBands = scale.bands.map((d) => d.valueOf());
            expect(smallBands.length).toBeGreaterThan(0);

            scale.domain = [new Date(1970, 0, 1), new Date(2024, 0, 1)];
            expect(scale.bands).toEqual([]);
            expect(scale.getBandCountForUpdate()).toBe(0);
            expect(scale.exposedNumericBands).toEqual([]);

            scale.domain = small;
            expect(scale.bands.map((d) => d.valueOf())).toEqual(smallBands);

            ambientWarn.mockRestore();
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
