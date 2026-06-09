/**
 * A numeric data value. A `bigint` may be supplied for integer values outside
 * the safe-integer range (beyond `Number.MAX_SAFE_INTEGER`).
 */
export type AgNumericValue = number | bigint;

/**
 * A time data value, accepted on time axes only. A `number` or `bigint` is
 * interpreted as a Unix epoch in milliseconds; valid epochs lie within the
 * safe-integer range, so a `bigint` is narrowed to Number without loss. A
 * `string` must be a strict ISO 8601 date or date-time — other string formats
 * are rejected.
 */
export type AgTimeValue = Date | number | bigint | string;
