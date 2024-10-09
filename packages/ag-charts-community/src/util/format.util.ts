const percentFormatter = new Intl.NumberFormat(navigator.language, { style: 'percent' });

/**
 * Formats a value as a string. If the value is a number, it formats it with two fraction digits.
 * If the value is not a number, it returns an empty string or the string representation of the value.
 *
 * @param value - The value to format.
 * @returns A formatted string.
 */
export function formatValue(value: unknown): string {
    if (typeof value === 'number') {
        return formatNumber(value, 2);
    }
    return String(value ?? '');
}

/**
 * Formats a number as a percentage using the current locale.
 *
 * @param value - A decimal number representing the percentage (e.g., 0.25 for 25%).
 * @returns A percentage string.
 */
export function formatPercent(value: number): string {
    return percentFormatter.format(value);
}

/**
 * `Number.toFixed(n)` always formats a number so that it has `n` digits after the decimal point.
 * For example, `Number(0.00003427).toFixed(2)` returns `0.00`.
 * That's not very helpful, because all the meaningful information is lost.
 * In this case we would want the formatted value to have at least two significant digits: `0.000034`,
 * not two fraction digits.
 *
 * This function provides a better solution by formatting small numbers using significant digits
 * and larger numbers with fraction digits.
 *
 * @param value - The number to format.
 * @param fractionOrSignificantDigits - Number of fraction digits (if >= 1) or significant digits (if < 1).
 * @returns A formatted string.
 */
export function formatNumber(value: number, fractionOrSignificantDigits: number): string {
    const absValue = Math.abs(value);
    if (absValue === 0 || absValue >= 1) {
        return value.toFixed(fractionOrSignificantDigits); // fraction digits
    }
    const decimalPlaces = Math.abs(Math.floor(Math.log(absValue) / Math.LN10)) - 1;
    return value.toFixed(decimalPlaces + fractionOrSignificantDigits); // significant digits
}
