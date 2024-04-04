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
