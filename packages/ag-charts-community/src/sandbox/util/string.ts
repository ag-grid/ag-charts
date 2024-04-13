/**
 * Joins an array of strings or objects into a formatted string, adding a custom conjunction before the last item.
 * Useful for creating human-readable lists from arrays with an option to limit the number of items shown.
 * @param values An array of strings or objects to join. Objects are converted to strings using the `format` function.
 * @param conjunction The word to use before the last item in the list, defaulting to 'and'.
 * @param format A function that formats each item in the array. By default, items are converted to strings using `String`.
 * @param maxItems The maximum number of items to show before truncating, defaults to showing all items.
 * @returns A string that is the result of joining the formatted values with commas, truncating if necessary, and appending the specified conjunction before the last item.
 */
export function joinFormatted(
    values: string[],
    conjunction: string = 'and',
    format: (value: any) => string = String,
    maxItems = Infinity
): string {
    if (values.length === 1) {
        return format(values[0]);
    }
    values = values.map(format);
    const lastValue = values.pop();
    if (values.length > maxItems - 1) {
        const remainingCount = values.length - maxItems - 1;
        return `${values.slice(0, maxItems - 1).join(', ')}, and ${remainingCount} more ${conjunction} ${lastValue}`;
    }
    return `${values.join(', ')} ${conjunction} ${lastValue}`;
}
