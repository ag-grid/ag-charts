export function clamp(min: number, value: number, max: number) {
    return Math.min(max, Math.max(min, value));
}

export function inRange(value: number, range: [number, number], epsilon: number = 1e-10) {
    return value >= range[0] - epsilon && value <= range[1] + epsilon;
}

export function isNumberEqual(a: number, b: number, epsilon: number = 1e-10) {
    return a === b || Math.abs(a - b) < epsilon;
}

export function isNegative(value: number) {
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
