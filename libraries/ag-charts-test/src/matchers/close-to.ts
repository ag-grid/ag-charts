/**
 * Asymmetric matchers for approximate `bigint` and `Date` equality.
 *
 * `expect.closeTo` only accepts numbers. Converting a value to compare it — `Number(big)`,
 * `date.getTime()` — also drops the check that the value arrived as the type under test, which for a
 * bigint is exactly the precision guarantee worth asserting. These keep the comparison in the value's
 * own units, so a tolerance reads in the same units as the expectation.
 *
 * `number` needs no equivalent: use the built-in `expect.closeTo`.
 */
export interface AsymmetricValueMatcher {
    asymmetricMatch(actual: unknown): boolean;
    toString(): string;
}

/** Matches a `bigint` within `tolerance` (inclusive) of `expected`. Rejects any non-bigint. */
export function closeToBigInt(expected: bigint, tolerance: bigint): AsymmetricValueMatcher {
    return {
        asymmetricMatch(actual: unknown) {
            if (typeof actual !== 'bigint') return false;
            return (actual > expected ? actual - expected : expected - actual) <= tolerance;
        },
        toString() {
            return `closeToBigInt(${expected} ± ${tolerance})`;
        },
    };
}

/** Matches a `Date` within `toleranceMs` (inclusive) of `expected`. Rejects a bare epoch timestamp. */
export function closeToDate(expected: Date, toleranceMs: number): AsymmetricValueMatcher {
    return {
        asymmetricMatch(actual: unknown) {
            return actual instanceof Date && Math.abs(actual.getTime() - expected.getTime()) <= toleranceMs;
        },
        toString() {
            return `closeToDate(${expected.toISOString()} ± ${toleranceMs}ms)`;
        },
    };
}
