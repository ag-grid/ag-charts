import * as Logger from '../../logging/logger';

export function clamp(min: number, value: number, max: number) {
    return Math.min(max, Math.max(min, value));
}

/**
 * Coerces a `number | bigint` to a `number` for rendering/positioning maths, where finite precision is
 * sufficient (the exact value is retained elsewhere for tooltips and tick labels). A `bigint` magnitude
 * beyond `Number.MAX_VALUE` coerces to `Infinity`, which would poison downstream scale arithmetic, so we
 * warn once and clamp to `±Number.MAX_VALUE` to keep the result finite.
 */
export function toFiniteNumber(value: number | bigint): number {
    if (typeof value === 'number') return value;

    const n = Number(value);
    if (Number.isFinite(n)) return n;

    Logger.warnOnce(`the value ${value} exceeds the representable Number range and was clamped for rendering.`);
    return value < 0n ? -Number.MAX_VALUE : Number.MAX_VALUE;
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
