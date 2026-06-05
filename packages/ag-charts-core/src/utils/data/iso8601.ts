// Strict ISO 8601 detection, used by the time-axis data pipeline to recognise and coerce date strings.
//
// This runs per datum on date-string columns, so it must not allocate. The regex bounds every time and
// offset component to a legal range, and the calendar check — which the regex cannot express, because
// month lengths and leap years aren't regular — reads the year/month/day digits via `charCodeAt`
// arithmetic rather than constructing `Date` objects. The calendar check is what rejects rollover dates
// like `"2024-02-30"` that `new Date()` would otherwise silently advance to `"2024-03-01"`.
const ISO_8601 = /^\d{4}-\d{2}-\d{2}(T([01]\d|2[0-3]):[0-5]\d(:[0-5]\d(\.\d+)?)?(Z|[+-]([01]\d|2[0-3]):[0-5]\d)?)?$/;

const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

/** Reads a fixed-width run of ASCII digits as an integer without allocating. */
function readUint(value: string, start: number, length: number): number {
    let n = 0;
    for (let i = 0; i < length; i++) {
        n = n * 10 + (value.charCodeAt(start + i) - 48);
    }
    return n;
}

/**
 * Returns true only for valid, canonical ISO 8601 date / date-time strings.
 *
 * The date portion is validated against the real calendar (month range, month length, leap years) so
 * impossible dates are rejected rather than rolled over. The wall-clock date is honoured as written:
 * an offset form whose UTC instant lands on a different day (e.g. `"2024-01-15T02:00:00+05:30"`) keeps
 * its literal `2024-01-15` date, because only the leading `YYYY-MM-DD` is inspected.
 */
export function isISO8601(value: unknown): value is string {
    if (typeof value !== 'string' || !ISO_8601.test(value)) return false;
    const month = readUint(value, 5, 2);
    if (month < 1 || month > 12) return false;
    const year = readUint(value, 0, 4);
    const day = readUint(value, 8, 2);
    const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    const maxDay = month === 2 && isLeapYear ? 29 : DAYS_IN_MONTH[month - 1];
    return day >= 1 && day <= maxDay;
}

/**
 * Coerce a strict ISO 8601 string to a `Date` for domain construction; anything else passes through
 * unchanged. The raw string is preserved in the data column (for timezone-correct display); this
 * coercion only applies to the domain extent, which must be numeric/`Date` for the time scales. The
 * scales themselves already parse ISO via `timeValueToNumber`, so only the domain classes need this.
 */
export function coerceIso8601Date(value: unknown): unknown {
    return isISO8601(value) ? new Date(value) : value;
}
