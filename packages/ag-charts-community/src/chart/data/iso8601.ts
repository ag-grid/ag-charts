// Strict ISO 8601 detection. String parsing is a time-axis concern, not a general one, so this lives
// alongside the data pipeline rather than in the shared value utilities.
const ISO_8601 = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})?)?$/;

/**
 * Returns true only for strings that are valid, canonical ISO 8601 date / date-time values.
 *
 * The regex alone is insufficient: V8 silently rolls impossible calendar dates such as `"2024-02-30"`
 * forward to `"2024-03-01"`. We round-trip the leading `YYYY-MM-DD` (which the regex guarantees is
 * present) through `Date`: parsing the date portion alone fixes it at UTC midnight, so re-deriving the
 * calendar components in UTC and requiring them to match catches any silent rollover. Parsing the date
 * portion in isolation deliberately ignores any time-zone offset — comparing UTC components against the
 * full instant would wrongly reject valid offset forms such as `"2024-01-15T02:00:00+05:30"`, which land
 * on the previous UTC day.
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
