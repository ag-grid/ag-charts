import { epochColumnForTimeScale, narrowBigIntColumn, narrowBigIntColumnRelative } from './aggregation';

// Off the power-of-2 boundary so the ULP of a double is uniform (256) around it: any two bigints within
// 128 of each other narrow to the same double under absolute Number() coercion.
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

            // All three round onto the same double, so the span — and any extrema within it — is lost.
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

            // Subtracting the min (HIGH_MAGNITUDE - SUB_ULP_DELTA) in bigint before crossing to Number keeps
            // the values distinct, where absolute narrowing collapses them onto a single double.
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
