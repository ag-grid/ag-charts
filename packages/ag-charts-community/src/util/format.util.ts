export function formatValue(value: unknown) {
    if (typeof value === 'number') {
        return value.toFixed(2);
    }
    return String(value ?? '');
}
