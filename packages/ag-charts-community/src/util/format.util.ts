const defaultNumberFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2, useGrouping: false });
const percentFormatter = new Intl.NumberFormat('en-US', { style: 'percent' });

/**
 * Formats a value as a string. If the value is a number, it formats it with the specified
 * maximum number of fraction digits. If the value is not a number, it returns an empty string
 * or the string representation of the value.
 *
 * @param value - The value to format.
 * @param maximumFractionDigits - The maximum number of fraction digits to display when formatting numbers.
 * @returns A formatted string representation of the value.
 */
export function formatValue(value: unknown, maximumFractionDigits: number = 2): string {
    if (typeof value === 'number') {
        return formatNumber(value, maximumFractionDigits);
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
 * Formats a number with a specified maximum number of fraction digits.
 *
 * This function improves upon `Number.toFixed(n)`, which always displays exactly `n` digits after the decimal point.
 * Instead, this function limits the number of fraction digits to a maximum value, making it useful for
 * displaying both small and large numbers with an appropriate level of precision.
 *
 * @param value - The number to format.
 * @param maximumFractionDigits - The maximum number of fraction digits to display.
 * @returns A string representing the formatted number.
 */
export function formatNumber(value: number, maximumFractionDigits: number): string {
    if (maximumFractionDigits === 2) {
        return defaultNumberFormatter.format(value);
    }
    return new Intl.NumberFormat('en-US', { maximumFractionDigits, useGrouping: false }).format(value);
}
