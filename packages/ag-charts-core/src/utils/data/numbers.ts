import type { AgNumericValue } from 'ag-charts-types';

import * as ambientLog from '../../logging/logger';

export function clamp(min: number, value: number, max: number) {
    return Math.min(max, Math.max(min, value));
}

/** Coerce a `number | bigint` to `number` for rendering maths; warns once when a bigint exceeds the Number range. */
export function toNumber(value: AgNumericValue): number {
    if (typeof value === 'number') return value;

    const n = Number(value);
    if (!Number.isFinite(n)) {
        ambientLog.warnOnce(`the value ${value} exceeds the representable Number range and cannot be rendered.`);
    }
    return n;
}

/**
 * Like {@link toNumber} but accepts any value: bigints warn on out-of-range magnitudes, while all
 * other values keep raw `Number()` coercion semantics (`null` → 0, `undefined`/invalid → NaN).
 */
export function narrowToNumber(value: unknown): number {
    return typeof value === 'bigint' ? toNumber(value) : Number(value);
}

/** Like {@link toNumber} but passes `null`/`undefined` through and stays silent on out-of-range magnitudes. */
export function toNumberOrUndefined(value: AgNumericValue | undefined): number | undefined {
    return value == null ? undefined : Number(value);
}

/** Both operands can combine exactly as bigints (each is already a bigint or an integral number). */
function bothIntegral(a: AgNumericValue, b: AgNumericValue): boolean {
    return (typeof a === 'bigint' || Number.isInteger(a)) && (typeof b === 'bigint' || Number.isInteger(b));
}

/** Adds two operands, promoting to `bigint` when both are integral so a large-magnitude result stays exact. */
export function addValues(a: AgNumericValue, b: AgNumericValue): AgNumericValue {
    if (typeof a === 'bigint' || typeof b === 'bigint') {
        return bothIntegral(a, b) ? BigInt(a) + BigInt(b) : Number(a) + Number(b);
    }
    return a + b;
}

/** Subtracts `b` from `a`, promoting to `bigint` under the same rules as {@link addValues}. */
export function subtractValues(a: AgNumericValue, b: AgNumericValue): AgNumericValue {
    if (typeof a === 'bigint' || typeof b === 'bigint') {
        return bothIntegral(a, b) ? BigInt(a) - BigInt(b) : Number(a) - Number(b);
    }
    return a - b;
}

/** Smaller of two operands via comparison, preserving an exact `bigint` (`Math.min` throws on bigint). */
export function minValue(a: AgNumericValue, b: AgNumericValue): AgNumericValue {
    if (typeof a === 'number' && typeof b === 'number') return Math.min(a, b);
    // A NaN number operand can't be ordered against a bigint; surface it like Math.min rather than the bigint.
    if (typeof a === 'number' && Number.isNaN(a)) return a;
    if (typeof b === 'number' && Number.isNaN(b)) return b;
    return a < b ? a : b;
}

/** Returns the larger of two operands, preserving an exact `bigint`. Mirror of {@link minValue}. */
export function maxValue(a: AgNumericValue, b: AgNumericValue): AgNumericValue {
    if (typeof a === 'number' && typeof b === 'number') return Math.max(a, b);
    if (typeof a === 'number' && Number.isNaN(a)) return a;
    if (typeof b === 'number' && Number.isNaN(b)) return b;
    return a > b ? a : b;
}

/** Returns the absolute value, preserving an exact `bigint` rather than coercing. */
export function absValue(value: AgNumericValue): AgNumericValue {
    if (typeof value === 'bigint') return value < 0n ? -value : value;
    return Math.abs(value);
}

/** Returns a zero of the same kind as `value` (`0n` for a `bigint`), keeping exact bigint arithmetic. */
export function zeroLike(value: AgNumericValue): AgNumericValue {
    return typeof value === 'bigint' ? 0n : 0;
}

export function inRange(value: number, range: [number, number], epsilon: number = 1e-10) {
    return value >= range[0] - epsilon && value <= range[1] + epsilon;
}

export function isNumberEqual(a: number, b: number, epsilon: number = 1e-10) {
    return a === b || Math.abs(a - b) < epsilon;
}

export function isNegative(value: AgNumericValue) {
    if (typeof value === 'bigint') return value < 0n;
    return Math.sign(value) === -1 || Object.is(value, -0);
}

export function isInteger(value: number) {
    return value % 1 === 0;
}

export function roundTo(value: number, decimals: number = 2) {
    const base = 10 ** decimals;
    return Math.round(value * base) / base;
}

export function ceilTo(value: number, decimals: number = 2) {
    const base = 10 ** decimals;
    return Math.ceil(value * base) / base;
}

/**
 * Returns the mathematically correct n modulus of m. For context, the JS % operator is remainder
 * NOT modulus, which is why this is needed.
 */
export function modulus(n: number, m: number) {
    return Math.floor((n % m) + (n < 0 ? Math.abs(m) : 0));
}

export function countFractionDigits(value: number): number {
    // Highly optimized fraction counting algorithm. This was highlighted as a hot-spot for
    // tick generation on canvas resize.
    if (Math.floor(value) === value) {
        return 0;
    }

    let valueString = String(value);
    let exponent = 0;
    if (value < 1e-6 || value >= 1e21) {
        // Scientific notation (the range is spec defined, so we can avoid a call to .includes('e'))
        let exponentString;
        [valueString, exponentString] = valueString.split('e');

        if (exponentString != null) {
            exponent = Number(exponentString);
        }
    }

    const decimalPlaces = valueString.split('.')[1]?.length ?? 0;

    return Math.max(decimalPlaces - exponent, 0);
}
