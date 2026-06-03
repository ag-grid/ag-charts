import * as Logger from '../../logging/logger';

export function clamp(min: number, value: number, max: number) {
    return Math.min(max, Math.max(min, value));
}

/**
 * Coerces a `number | bigint` to a `number` for rendering/positioning maths, where finite precision is
 * sufficient (the exact value is retained elsewhere for tooltips and tick labels). A `bigint` magnitude
 * beyond `Number.MAX_VALUE` coerces to `Infinity`; the result is then handled as any other non-finite value
 * (dropped from rendering), and we warn once so the precision-loss is observable rather than silent.
 */
export function toNumber(value: number | bigint): number {
    if (typeof value === 'number') return value;

    const n = Number(value);
    if (!Number.isFinite(n)) {
        Logger.warnOnce(`the value ${value} exceeds the representable Number range and cannot be rendered.`);
    }
    return n;
}

/** Both operands can combine exactly as bigints (each is already a bigint or an integral number). */
function bothIntegral(a: number | bigint, b: number | bigint): boolean {
    return (typeof a === 'bigint' || Number.isInteger(a)) && (typeof b === 'bigint' || Number.isInteger(b));
}

/**
 * Adds two operands, promoting to `bigint` when either is a `bigint` so a large-magnitude result stays
 * exact. A fractional operand mixed with a `bigint` forces a (lossy) `number` sum rather than throwing,
 * matching {@link toNumber}'s precision-loss policy.
 */
export function addValues(a: number | bigint, b: number | bigint): number | bigint {
    if (typeof a === 'bigint' || typeof b === 'bigint') {
        return bothIntegral(a, b) ? BigInt(a) + BigInt(b) : Number(a) + Number(b);
    }
    return a + b;
}

/** Subtracts `b` from `a`, promoting to `bigint` under the same rules as {@link addValues}. */
export function subtractValues(a: number | bigint, b: number | bigint): number | bigint {
    if (typeof a === 'bigint' || typeof b === 'bigint') {
        return bothIntegral(a, b) ? BigInt(a) - BigInt(b) : Number(a) - Number(b);
    }
    return a - b;
}

/**
 * Returns the smaller of two operands, preserving an exact `bigint` rather than coercing. `Math.min`
 * throws on a `bigint` (it calls `ToNumber`); JS comparison operators do not, so a `bigint`-involving
 * comparison stays lossless and lets the exact value reach the scale's full-precision path. The pure-number
 * path keeps `Math.min` semantics (including `NaN` propagation).
 */
export function minValue(a: number | bigint, b: number | bigint): number | bigint {
    if (typeof a === 'number' && typeof b === 'number') return Math.min(a, b);
    return a < b ? a : b;
}

/** Returns the larger of two operands, preserving an exact `bigint`. Mirror of {@link minValue}. */
export function maxValue(a: number | bigint, b: number | bigint): number | bigint {
    if (typeof a === 'number' && typeof b === 'number') return Math.max(a, b);
    return a > b ? a : b;
}

export function inRange(value: number, range: [number, number], epsilon: number = 1e-10) {
    return value >= range[0] - epsilon && value <= range[1] + epsilon;
}

export function isNumberEqual(a: number, b: number, epsilon: number = 1e-10) {
    return a === b || Math.abs(a - b) < epsilon;
}

export function isNegative(value: number | bigint) {
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
