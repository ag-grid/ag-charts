import { nextPowerOf2 } from '../data/numberArray';
import { seedRandom } from '../test/random';
import {
    AGGREGATION_INDEX_UNSET,
    AGGREGATION_INDEX_X_MIN,
    AGGREGATION_INDEX_Y_MAX,
    AGGREGATION_INDEX_Y_MIN,
    AGGREGATION_MIN_RANGE,
    AGGREGATION_SPAN,
    aggregationRangeFittingPoints,
    computeExtremesAggregation,
    createAggregationIndices,
    epochColumnForTimeScale,
    narrowBigIntColumn,
    narrowBigIntColumnRelative,
} from './aggregation';

// Off the power-of-2 boundary so the ULP is uniform (256): bigints within 128 narrow to the same double.
const HIGH_MAGNITUDE = 2n ** 60n + 123_456_789n;
const SUB_ULP_DELTA = 100n; // < half-ULP (128)

describe('aggregation column preprocessing', () => {
    describe('narrowBigIntColumn (absolute)', () => {
        it('preserves sign and magnitude across the safe-integer boundary', () => {
            const big = 9_007_199_254_740_993n; // MAX_SAFE_INTEGER + 2
            const result = narrowBigIntColumn([-big, 0n, big]);

            expect(result).toEqual([Number(-big), 0, Number(big)]);
            expect(result[0]).toBeLessThan(0);
            expect(result[2]).toBeGreaterThan(0);
        });

        it('coerces bigint elements and passes other element types through', () => {
            expect(narrowBigIntColumn([5, 10n, null, undefined])).toEqual([5, 10, null, undefined]);
        });

        it('collapses a high-magnitude narrow span (the reason it must not back comparison extrema)', () => {
            const result = narrowBigIntColumn([
                HIGH_MAGNITUDE - SUB_ULP_DELTA,
                HIGH_MAGNITUDE,
                HIGH_MAGNITUDE + SUB_ULP_DELTA,
            ]) as number[];

            expect(new Set(result).size).toBe(1);
        });

        it('returns the input reference unchanged when the column holds no bigint', () => {
            const values = [1, 2, 3];
            expect(narrowBigIntColumn(values)).toBe(values);
        });

        it('caches by column identity so repeated calls return the same narrowed reference', () => {
            const values = [1n, 2n, 3n];
            const first = narrowBigIntColumn(values);
            expect(narrowBigIntColumn(values)).toBe(first);
        });
    });

    describe('narrowBigIntColumnRelative (offset)', () => {
        it('preserves a high-magnitude narrow span by offsetting against the column minimum', () => {
            const result = narrowBigIntColumnRelative([
                HIGH_MAGNITUDE,
                HIGH_MAGNITUDE + SUB_ULP_DELTA,
                HIGH_MAGNITUDE - SUB_ULP_DELTA,
            ]) as number[];

            // Offsetting by the min in bigint before narrowing keeps the values distinct.
            expect(result).toEqual([100, 200, 0]);
            expect(new Set(result).size).toBe(3);
        });

        it('offsets number elements by the same real minimum and passes null/undefined through', () => {
            expect(narrowBigIntColumnRelative([10n, 25, null, undefined])).toEqual([0, 15, null, undefined]);
        });

        it('returns the input reference unchanged when the column holds no bigint', () => {
            const values = [1, 2, 3];
            expect(narrowBigIntColumnRelative(values)).toBe(values);
        });

        it('caches by column identity so repeated calls return the same narrowed reference', () => {
            const values = [3n, 1n, 2n];
            const first = narrowBigIntColumnRelative(values);
            expect(narrowBigIntColumnRelative(values)).toBe(first);
        });
    });

    describe('epochColumnForTimeScale', () => {
        it('parses ISO 8601 strings to epoch milliseconds on a time scale and clears needsValueOf', () => {
            const iso = ['2024-01-01T00:00:00.000Z', '2024-01-02T00:00:00.000Z'];
            const result = epochColumnForTimeScale('time', iso, false);
            expect(result.values).toEqual([Date.UTC(2024, 0, 1), Date.UTC(2024, 0, 2)]);
            expect(result.needsValueOf).toBe(false);
        });

        it('returns the input reference unchanged on a non-time scale, preserving needsValueOf', () => {
            const iso = ['2024-01-01T00:00:00.000Z'];
            const result = epochColumnForTimeScale('number', iso, false);
            expect(result.values).toBe(iso);
            expect(result.needsValueOf).toBe(false);
        });

        it('returns the input reference unchanged when xNeedsValueOf (Date columns are valueOf-handled)', () => {
            const dates = [new Date('2024-01-01T00:00:00.000Z')];
            const result = epochColumnForTimeScale('time', dates, true);
            expect(result.values).toBe(dates);
            expect(result.needsValueOf).toBe(true);
        });

        it('returns a numeric epoch column unchanged rather than rescanning it', () => {
            const epochs = [Date.UTC(2024, 0, 1), Date.UTC(2024, 0, 2)];
            const result = epochColumnForTimeScale('time', epochs, false);
            expect(result.values).toBe(epochs);
            expect(result.needsValueOf).toBe(false);
        });

        it('caches by column identity so repeated calls return the same parsed reference', () => {
            const iso = ['2024-01-01T00:00:00.000Z', '2024-01-02T00:00:00.000Z'];
            const first = epochColumnForTimeScale('time', iso, false);
            expect(epochColumnForTimeScale('time', iso, false).values).toBe(first.values);
        });
    });
});

describe('aggregationRangeFittingPoints', () => {
    it('bounds the bucket count to the dataset size on a wide continuous domain', () => {
        // A 1-unit smallest interval over a 2^28 domain span yields an unbounded maxRange of
        // nextPowerOf2(2^28) >> 3 = 2^25, which createAggregationIndices cannot allocate.
        const xValues = Array.from({ length: 2200 }, (_, i) => i);
        const maxRange = aggregationRangeFittingPoints(xValues, 0, 2 ** 28, { smallestKeyInterval: 1 });

        expect(maxRange).toBeLessThanOrEqual(nextPowerOf2(xValues.length));
    });
});

describe('createAggregationIndices', () => {
    it('leaves empty split-mode buckets unset on a category domain', () => {
        const count = 64;
        const xValues = Array.from({ length: count }, (_, i) => `c${i}`);
        const yValues = Array.from({ length: count }, (_, i) => i + 1);

        const { indexData, negativeIndexData } = createAggregationIndices(
            xValues,
            yValues,
            yValues,
            Number.NaN,
            Number.NaN,
            16,
            { split: true, xNeedsValueOf: false, yNeedsValueOf: false }
        );

        for (let i = 0; i < 16; i++) {
            expect(indexData[i * AGGREGATION_SPAN + AGGREGATION_INDEX_X_MIN]).not.toBe(AGGREGATION_INDEX_UNSET);
            expect(negativeIndexData![i * AGGREGATION_SPAN + AGGREGATION_INDEX_X_MIN]).toBe(AGGREGATION_INDEX_UNSET);
        }
    });
});

describe('computeExtremesAggregation', () => {
    type Case = {
        length: number;
        domain: [number, number];
        x?: (i: number) => number;
        high?: (i: number) => number;
        low?: (i: number) => number;
        smallestKeyInterval?: number;
    };

    let random: () => number;
    beforeEach(() => {
        random = seedRandom(4721);
    });

    function run({
        length,
        domain,
        x = (i) => i,
        high = () => random() * 100,
        low = () => random() * 100,
        smallestKeyInterval,
    }: Case) {
        const xValues = Array.from({ length }, (_, i) => x(i));
        const highValues = Array.from({ length }, (_, i) => high(i));
        const lowValues = Array.from({ length }, (_, i) => low(i));
        const filters = computeExtremesAggregation(domain, xValues, highValues, lowValues, {
            smallestKeyInterval,
            xNeedsValueOf: false,
            yNeedsValueOf: false,
        });
        return { xValues, filters };
    }

    it.each<[string, Case]>([
        ['empty data', { length: 0, domain: [0, 0] }],
        ['a single data point', { length: 1, domain: [0, 1] }],
        ['500 points', { length: 500, domain: [0, 500] }],
    ])('returns undefined below the threshold: %s', (_name, input) => {
        expect(run(input).filters).toBeUndefined();
    });

    // finestMaxRange is nextPowerOf2(1 / smallest pixel interval) >> 3, where the interval is the
    // smallestKeyInterval over the domain width, or the estimated spacing of the x values.
    it.each<[string, Case & { finestMaxRange?: number }]>([
        ['1000 points, at the threshold', { length: 1000, domain: [0, 1000], finestMaxRange: 128 }],
        ['1200 points', { length: 1200, domain: [0, 1200], finestMaxRange: 256 }],
        ['1500 points', { length: 1500, domain: [0, 1500], finestMaxRange: 256 }],
        ['2000 points', { length: 2000, domain: [0, 2000], finestMaxRange: 256 }],
        ['3000 points', { length: 3000, domain: [0, 3000], finestMaxRange: 512 }],
        ['5000 points', { length: 5000, domain: [0, 5000], finestMaxRange: 1024 }],
        [
            'sparse x, smallestKeyInterval 10',
            { length: 1000, domain: [0, 10000], x: (i) => i * 10, smallestKeyInterval: 10, finestMaxRange: 128 },
        ],
        [
            'x every 2, smallestKeyInterval 2',
            { length: 1200, domain: [0, 2400], x: (i) => i * 2, smallestKeyInterval: 2, finestMaxRange: 256 },
        ],
        ['irregular x intervals', { length: 1200, domain: [0, 1200], x: (i) => i + random() * 0.5 }],
    ])('builds levels from coarse to fine, halving down to the minimum range: %s', (_name, input) => {
        const { filters } = run(input);

        expect(filters).toBeDefined();
        expect(filters![0].maxRange).toBeLessThanOrEqual(AGGREGATION_MIN_RANGE);
        for (let i = 1; i < filters!.length; i++) {
            expect(filters![i].maxRange).toBe(filters![i - 1].maxRange * 2);
            expect(filters![i].maxRange).toBeGreaterThan(AGGREGATION_MIN_RANGE);
        }
        for (const { maxRange, indexData, valueData, midpointIndices } of filters!) {
            expect(indexData).toBeInstanceOf(Uint32Array);
            expect(indexData.length).toBe(maxRange * AGGREGATION_SPAN);
            expect(valueData.length).toBe(maxRange * AGGREGATION_SPAN);
            expect(midpointIndices).toBeInstanceOf(Uint32Array);
            expect(midpointIndices.length).toBe(maxRange);
        }
        if (input.finestMaxRange != null) {
            expect(filters!.at(-1)!.maxRange).toBe(input.finestMaxRange);
        }
    });

    it.each<[string, number, number, number]>([
        ['negative ranges', 1200, -10, -50],
        ['extreme high/low spread', 1000, 1e6, -1e6],
    ])('records the constant high and low as every bucket extreme: %s', (_name, length, high, low) => {
        const { filters } = run({ length, domain: [0, length], high: () => high, low: () => low });

        expect(filters).toBeDefined();
        for (const { maxRange, indexData, valueData } of filters!) {
            for (let i = 0; i < maxRange; i++) {
                const aggIndex = i * AGGREGATION_SPAN;
                expect(indexData[aggIndex + AGGREGATION_INDEX_Y_MAX]).not.toBe(AGGREGATION_INDEX_UNSET);
                expect(valueData[aggIndex + AGGREGATION_INDEX_Y_MAX]).toBe(high);
                expect(valueData[aggIndex + AGGREGATION_INDEX_Y_MIN]).toBe(low);
            }
        }
    });

    it('leaves buckets inside a gap in the data unset', () => {
        // x runs 0-499, 1000-1499 and 2000-2499.
        const { filters } = run({ length: 1500, domain: [0, 2500], x: (i) => i + 500 * Math.floor(i / 500) });

        expect(filters).toBeDefined();
        for (const { maxRange, indexData } of filters!) {
            const bucketAt = (x: number) => Math.floor((x / 2500) * maxRange) * AGGREGATION_SPAN;
            expect(indexData[bucketAt(750) + AGGREGATION_INDEX_X_MIN]).toBe(AGGREGATION_INDEX_UNSET);
            expect(indexData[bucketAt(1700) + AGGREGATION_INDEX_X_MIN]).toBe(AGGREGATION_INDEX_UNSET);
            expect(indexData[bucketAt(1200) + AGGREGATION_INDEX_X_MIN]).not.toBe(AGGREGATION_INDEX_UNSET);
        }
    });

    it.each<[number, [number, number]]>([
        [3000, [500, 2500]],
        [2000, [500, 1500]],
    ])('starts the first bucket at the domain start: %i points, domain %j', (length, domain) => {
        const { xValues, filters } = run({ length, domain });
        const [d0, d1] = domain;

        expect(filters).toBeDefined();
        for (const { maxRange, indexData } of filters!) {
            // Datums below the domain are dropped, so x = d0 (datum index d0) opens the first bucket.
            expect(indexData[AGGREGATION_INDEX_X_MIN]).toBe(d0);
            for (let i = 0; i < maxRange; i++) {
                const xMinIndex = indexData[i * AGGREGATION_SPAN + AGGREGATION_INDEX_X_MIN];
                expect(xMinIndex).not.toBe(AGGREGATION_INDEX_UNSET);
                expect(xValues[xMinIndex]).toBeGreaterThanOrEqual(d0);
                expect(xValues[xMinIndex]).toBeLessThanOrEqual(d1);
            }
        }
    });
});
