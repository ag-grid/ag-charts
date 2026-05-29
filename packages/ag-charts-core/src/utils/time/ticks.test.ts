import { createBigIntTicks, createTicks, niceBigIntDomain } from './ticks';

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
