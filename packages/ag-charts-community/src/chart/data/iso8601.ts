// Strict ISO 8601 detection. String parsing is a time-axis concern, not a general one, so this lives
// alongside the data pipeline rather than in the shared value utilities.
const ISO_8601 = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})?)?$/;

/**
 * Returns true only for valid, canonical ISO 8601 date / date-time strings.
 *
 * The regex alone is insufficient — V8 silently rolls impossible dates (`"2024-02-30"` → `"2024-03-01"`),
 * so we round-trip the leading `YYYY-MM-DD` through `Date` (UTC midnight) and require the calendar
 * components to match. The date portion is parsed in isolation so an offset form landing on the previous
 * UTC day (e.g. `"2024-01-15T02:00:00+05:30"`) is not wrongly rejected.
 */
export function isISO8601(value: unknown): value is string {
    if (typeof value !== 'string' || !ISO_8601.test(value)) return false;
    if (Number.isNaN(new Date(value).getTime())) return false;
    const datePart = value.slice(0, 10);
    const d = new Date(datePart);
    if (Number.isNaN(d.getTime())) return false;
    const y = d.getUTCFullYear();
    const m = d.getUTCMonth() + 1;
    const day = d.getUTCDate();
    const canonical = `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return datePart === canonical;
}
