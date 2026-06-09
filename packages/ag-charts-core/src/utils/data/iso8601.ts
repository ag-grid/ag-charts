// Runs per datum, so it must not allocate; the calendar check below rejects rollover dates the regex can't.
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

/** True only for valid ISO 8601 date / date-time strings, validated against the real calendar. */
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

/** Coerce an ISO 8601 string to a `Date` for domain construction; anything else passes through unchanged. */
export function coerceIso8601Date(value: unknown): unknown {
    return isISO8601(value) ? new Date(value) : value;
}
