import { timeValueToNumber } from '../time/timeFormatDefaults';

// Hot paths (domain computation, aggregation bucketing, sort-order detection) cannot interpret
// ISO 8601 strings, so a string time column is parsed to epoch ms exactly once and memoized by
// source-column identity. Columns mutated in place must be invalidated via invalidateEpochColumn.
const epochColumnCache = new WeakMap<readonly unknown[], unknown[]>();

function parseEpochValue(value: unknown): unknown {
    return typeof value === 'string' ? timeValueToNumber(value) : value;
}

/**
 * Resolve the epoch-ms representation of a time column, parsing and caching on first use.
 * @returns the input `values` unchanged when the column holds no strings.
 */
export function ensureEpochColumn(values: unknown[]): unknown[] {
    const cached = epochColumnCache.get(values);
    if (cached !== undefined) return cached;

    const sample = values.find((v) => v != null);
    const converted = typeof sample === 'string' ? values.map(parseEpochValue) : values;
    epochColumnCache.set(values, converted);
    return converted;
}

/** Cached epoch column for `values`, or `undefined` when none has been materialised. */
export function getEpochColumn(values: unknown[]): unknown[] | undefined {
    return epochColumnCache.get(values);
}

/** Drop the cached epoch column after `values` is mutated in place (incremental updates). */
export function invalidateEpochColumn(values: unknown[]): void {
    epochColumnCache.delete(values);
}
