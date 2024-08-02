export function clamp(min: number, value: number, max: number) {
    return Math.min(max, Math.max(min, value));
}

export function clampArray(value: number, array: number[]) {
    const [min, max] = findMinMax(array);
    return clamp(min, value, max);
}

export function findMinMax(array: number[]) {
    if (array.length === 0) return [];

    // Optimized min/max algorithm, single array pass.
    const result = [Infinity, -Infinity];
    for (const val of array) {
        if (val < result[0]) result[0] = val;
        if (val > result[1]) result[1] = val;
    }
    return result;
}

export function findRangeExtent(array: number[]) {
    const [min, max] = findMinMax(array);
    return max - min;
}

export function isEqual(a: number, b: number, epsilon: number = 1e-10) {
    return Math.abs(a - b) < epsilon;
}

export function isNegative(value: number) {
    return Math.sign(value) === -1 || Object.is(value, -0);
}

export function round(value: number, decimals: number = 2) {
    const base = 10 ** decimals;
    return Math.round(value * base) / base;
}

/**
 * `Number.toFixed(n)` always formats a number so that it has `n` digits after the decimal point.
 * For example, `Number(0.00003427).toFixed(2)` returns `0.00`.
 * That's not very helpful, because all the meaningful information is lost.
 * In this case we would want the formatted value to have at least two significant digits: `0.000034`,
 * not two fraction digits.
 * @param value
 * @param fractionOrSignificantDigits
 */
export function toFixed(value: number, fractionOrSignificantDigits = 2): string {
    const power = Math.floor(Math.log(Math.abs(value)) / Math.LN10);
    if (power >= 0 || !isFinite(power)) {
        return value.toFixed(fractionOrSignificantDigits); // fraction digits
    }
    return value.toFixed(Math.abs(power) - 1 + fractionOrSignificantDigits); // significant digits
}

/**
 * Returns the mathematically correct n modulus of m. For context, the JS % operator is remainder
 * NOT modulus, which is why this is needed.
 */
export function mod(n: number, m: number) {
    return Math.floor((n % m) + (n < 0 ? m : 0));
}

export function countFractionDigits(value: number) {
    // Highly optimized fraction counting algorithm. This was highlighted as a hot-spot for
    // tick generation on canvas resize.
    if (Math.floor(value) === value) return 0;
    return String(value).split('.')[1]?.length ?? 0;
}

/**
 * @param ratio A number from 0 to 1.
 * @param locale The locale to use to format the number.
 */
export function formatNormalizedPercentage(ratio: number, locale?: string) {
    locale = locale ?? navigator.language;
    return new Intl.NumberFormat(locale, { style: 'percent' }).format(ratio);
}

/**
 * @param percent A number from 0 to 100.
 * @param locale The locale to use to format the number.
 */
export function formatPercentage(percent: number, locale?: string) {
    return formatNormalizedPercentage(percent / 100, locale);
}
