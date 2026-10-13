import {
    createBigIntBins,
    createBigIntTickBins,
    createBigIntTicks,
    createTicks,
    niceBigIntDomain,
    tickFormat,
} from './ticks';

describe('tickFormat', () => {
    test('formats a bigint tick with the chart-wide en-US grouping', () => {
        // Bigint ticks must pin en-US grouping to match createNumberFormatter, regardless of the
        // runtime's default locale.
        const format = tickFormat([0, 1]);

        expect(format!(9_007_199_254_740_993n)).toBe('9,007,199,254,740,993');
    });

    test('applies the user tick format prefix and suffix to a bigint tick', () => {
        // The bigint branch must run the user's format string (prefix/suffix), not just emit a bare
        // grouped number — number ticks already honour the format, so bigint ticks should too.
        const format = tickFormat([0, 1], '$#{,} USD');

        expect(format!(9_007_199_254_740_993n)).toBe('$9,007,199,254,740,993 USD');
    });
});

describe('ticks', () => {
    test('createTicks', () => {
        const ticks_1_to_2 = [2, 97];
        const ticks_2_to_3 = [50];
        const ticks_4_to_6 = [20, 40, 60, 80];
        const ticks_7_to_13 = [10, 20, 30, 40, 50, 60, 70, 80, 90];
        const ticks_14_30 = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95];

        expect(createTicks(2, 97, 1).ticks).toEqual(ticks_1_to_2);
        expect(createTicks(2, 97, 2).ticks).toEqual(ticks_2_to_3);
        expect(createTicks(2, 97, 3).ticks).toEqual(ticks_2_to_3);
        expect(createTicks(2, 97, 4).ticks).toEqual(ticks_4_to_6);
        expect(createTicks(2, 97, 5).ticks).toEqual(ticks_4_to_6);
        expect(createTicks(2, 97, 6).ticks).toEqual(ticks_4_to_6);
        expect(createTicks(2, 97, 7).ticks).toEqual(ticks_4_to_6);
        expect(createTicks(2, 97, 8).ticks).toEqual(ticks_7_to_13);
        expect(createTicks(2, 97, 9).ticks).toEqual(ticks_7_to_13);
        expect(createTicks(2, 97, 10).ticks).toEqual(ticks_7_to_13);
        expect(createTicks(2, 97, 20).ticks).toEqual(ticks_14_30);
    });

    test('floating point errors', () => {
        expect(createTicks(1.1e-11, 1.4e-11, 7).ticks).toEqual([
            1.1e-11, 1.15e-11, 1.2e-11, 1.25e-11, 1.3e-11, 1.35e-11, 1.4e-11,
        ]);
    });
});

describe('createBigIntTicks', () => {
    test('produces nice, evenly-spaced ticks (AC #15a)', () => {
        expect(createBigIntTicks(0n, 100n, 5)).toEqual([0n, 20n, 40n, 60n, 80n, 100n]);
    });

    test.each([
        { d0: 0n, d1: 100n, count: 5 },
        { d0: 0n, d1: 1000n, count: 5 },
        { d0: 13n, d1: 9871n, count: 7 },
        { d0: 0n, d1: 10n ** 21n, count: 5 },
        { d0: -(10n ** 15n), d1: 10n ** 15n, count: 10 },
    ])('keeps tick count within 5–15 regardless of span ($d0..$d1) (AC #15a)', ({ d0, d1, count }) => {
        // Mirror the axis pipeline: nice the domain outward, then generate ticks across nice bounds.
        const [n0, n1] = niceBigIntDomain(d0, d1, count);
        const ticks = createBigIntTicks(n0, n1, count);
        expect(ticks.length).toBeGreaterThanOrEqual(5);
        expect(ticks.length).toBeLessThanOrEqual(15);
    });

    test('includes 0n when the domain crosses zero (AC #15b)', () => {
        expect(createBigIntTicks(-50n, 50n, 5)).toContain(0n);
        expect(createBigIntTicks(-37n, 91n, 6)).toContain(0n);
    });

    test('supports descending domains (AC #15c)', () => {
        const ascending = createBigIntTicks(-50n, 50n, 5);
        const descending = createBigIntTicks(50n, -50n, 5);
        expect(descending).toEqual([...ascending].reverse());
    });

    test('handles sub-step ranges via Number-computed steps (AC #15d)', () => {
        expect(createBigIntTicks(0n, 5n, 5)).toEqual([0n, 1n, 2n, 3n, 4n, 5n]);
        expect(createBigIntTicks(0n, 7n, 7)).toEqual([0n, 1n, 2n, 3n, 4n, 5n, 6n, 7n]);
    });

    test('keeps exact values for spans beyond Number.MAX_SAFE_INTEGER (AC #16)', () => {
        const ticks = createBigIntTicks(0n, 10n ** 21n, 5);
        expect(ticks).toEqual([0n, 2n * 10n ** 20n, 4n * 10n ** 20n, 6n * 10n ** 20n, 8n * 10n ** 20n, 10n ** 21n]);
        // Every tick is a true multiple — no float64 collapse of adjacent high-magnitude values.
        expect(ticks.every((t) => t % (2n * 10n ** 20n) === 0n)).toBe(true);
    });

    test('returns a single tick for a zero-width domain', () => {
        expect(createBigIntTicks(42n, 42n, 5)).toEqual([42n]);
    });

    test('stays bounded for spans far beyond Number.MAX_VALUE', () => {
        // The nice-step picker keeps step ∝ extent/count, so the tick count never explodes even when
        // the span dwarfs Number.MAX_VALUE (where a naive Number(extent) would be Infinity).
        for (const exp of [100, 400]) {
            const ticks = createBigIntTicks(0n, 10n ** BigInt(exp), 5);
            expect(ticks.length).toBeGreaterThanOrEqual(5);
            expect(ticks.length).toBeLessThanOrEqual(15);
        }
    });
});

describe('createBigIntTickBins', () => {
    test('aligns bin boundaries to nice tick steps with a leading bin covering the minimum', () => {
        // Mirrors the Number histogram path for domain [2, 97] with the default bin count of 10:
        // step 10, ticks 10..90, plus the leading [0, 10] bin.
        const bins = createBigIntTickBins(2n, 97n, 10);
        expect(bins[0]).toEqual([0n, 10n]);
        expect(bins.at(-1)).toEqual([90n, 100n]);
        expect(bins).toHaveLength(10);
        expect(bins.every(([a, b]) => a % 10n === 0n && b - a === 10n)).toBe(true);
    });

    test('is magnitude-invariant for scaled domains beyond Number.MAX_VALUE', () => {
        const scale = 10n ** 309n;
        const small = createBigIntTickBins(2n, 97n, 10);
        const scaled = createBigIntTickBins(2n * scale, 97n * scale, 10);
        expect(scaled).toEqual(small.map(([a, b]) => [a * scale, b * scale]));
    });

    test('adds a leading bin even when the minimum sits on a tick', () => {
        const bins = createBigIntTickBins(0n, 100n, 10);
        expect(bins[0]).toEqual([-10n, 0n]);
        expect(bins.at(-1)).toEqual([100n, 110n]);
    });

    test('returns a single degenerate bin for a zero-width domain', () => {
        expect(createBigIntTickBins(42n, 42n, 5)).toEqual([[42n, 42n]]);
    });
});

describe('niceBigIntDomain', () => {
    test('extends endpoints outward to step multiples', () => {
        expect(niceBigIntDomain(13n, 97n, 5)).toEqual([0n, 100n]);
    });

    test('preserves orientation for descending domains', () => {
        expect(niceBigIntDomain(97n, 13n, 5)).toEqual([100n, 0n]);
    });

    test('leaves already-nice bounds unchanged', () => {
        expect(niceBigIntDomain(0n, 100n, 5)).toEqual([0n, 100n]);
    });
});

describe('createBigIntBins', () => {
    test('produces contiguous equal-width bins covering a nice domain', () => {
        expect(createBigIntBins(0n, 100n, 5)).toEqual([
            [0n, 20n],
            [20n, 40n],
            [40n, 60n],
            [60n, 80n],
            [80n, 100n],
        ]);
    });

    test('returns exactly `count` equal-width bins anchored at the domain minimum', () => {
        expect(createBigIntBins(13n, 97n, 4)).toEqual([
            [13n, 34n],
            [34n, 55n],
            [55n, 76n],
            [76n, 97n],
        ]);
    });

    test('is magnitude-invariant: a scaled Number domain yields proportionally identical boundaries', () => {
        // Number path for [1, 10] with 5 bins: [1, 2.8], [2.8, 4.6], [4.6, 6.4], [6.4, 8.2], [8.2, 10].
        const edge = (tenths: bigint) => tenths * 10n ** 308n;
        expect(createBigIntBins(10n ** 309n, 10n ** 310n, 5)).toEqual([
            [edge(10n), edge(28n)],
            [edge(28n), edge(46n)],
            [edge(46n), edge(64n)],
            [edge(64n), edge(82n)],
            [edge(82n), edge(100n)],
        ]);
    });

    test('always produces the requested bin count', () => {
        for (const count of [1, 2, 3, 7, 13]) {
            expect(createBigIntBins(13n, 9871n, count)).toHaveLength(count);
        }
    });

    test('returns contiguous bins (each bin starts where the previous ends)', () => {
        const bins = createBigIntBins(-37n, 91n, 6);
        for (let i = 1; i < bins.length; i++) {
            expect(bins[i][0]).toBe(bins[i - 1][1]);
        }
    });

    test('returns a single bin for a degenerate domain', () => {
        expect(createBigIntBins(42n, 42n, 5)).toEqual([[42n, 42n]]);
    });

    test('stays exact for spans beyond Number.MAX_SAFE_INTEGER', () => {
        const bins = createBigIntBins(0n, 10n ** 21n, 5);
        expect(bins[0][0]).toBe(0n);
        expect(bins.at(-1)![1]).toBe(10n ** 21n);
        for (let i = 1; i < bins.length; i++) {
            expect(bins[i][0]).toBe(bins[i - 1][1]);
        }
    });
});
