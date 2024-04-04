/**
 * Joins an array of strings or objects into a formatted string, with a custom conjunction before the last item.
 * This function is useful for creating human-readable lists from arrays.
 * @param values An array of strings or objects to join. Objects are converted to strings using the `format` function.
 * @param conjunction The word to use before the last item in the list, defaulting to 'and'.
 * @param format A function that formats each item in the array. By default, items are converted to strings using `String`.
 * @returns A string that is the result of joining the formatted values with commas and the specified conjunction before the last item.
 */
export function joinFormatted(
    values: string[],
    conjunction: string = 'and',
    format: (value: any) => string = String
): string {
    if (values.length === 1) {
        return format(values[0]);
    }
    values = values.map(format);
    const lastValue = values.pop();
    return `${values.join(', ')} ${conjunction} ${lastValue}`;
}
