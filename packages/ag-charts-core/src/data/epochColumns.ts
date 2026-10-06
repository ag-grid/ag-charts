import { timeValueToNumber } from '../time/timeFormatDefaults';

// Hot paths cannot interpret ISO 8601 strings, so a string time column is parsed to epoch ms once and
// memoized by source-column identity. Columns mutated in place must be invalidated via invalidateEpochColumn.
const epochColumnCache = new WeakMap<readonly unknown[], unknown[]>();

function parseEpochValue(value: unknown): unknown {
    // Strings only enter date-typed columns via strict isISO8601 gates upstream (extraction,
    // continuity checks, sort-order detection), so Date.parse's leniency is not reachable here.
    return typeof value === 'string' ? timeValueToNumber(value) : value;
}

/**
 * Resolve the epoch-ms representation of a time column, parsing and caching on first use.
 * The whole column is scanned for strings: mixed columns (e.g. Date objects first, ISO strings
 * later) must still parse, and the result is cached by identity so a wrong guess would never
 * self-correct.
 * @returns the input `values` unchanged when the column holds no strings.
 */
export function ensureEpochColumn(values: unknown[]): unknown[] {
    const cached = epochColumnCache.get(values);
    if (cached !== undefined) return cached;

    const hasStrings = values.some((v) => typeof v === 'string');
    const converted = hasStrings ? values.map(parseEpochValue) : values;
    epochColumnCache.set(values, converted);
    return converted;
}

/**
 * Register a string-free column as its own epoch representation. Extraction's type-tracking pass
 * already knows whether a column holds any string, so seeding the cache here lets a later
 * {@link ensureEpochColumn} return on the cache hit instead of repeating the O(n) string scan.
 * No-op when an epoch column is already cached (e.g. a parsed ISO column must not be overwritten).
 */
export function seedEpochColumnIdentity(values: unknown[]): void {
    if (!epochColumnCache.has(values)) {
        epochColumnCache.set(values, values);
    }
}

/** Cached epoch column for `values`, or `undefined` when none has been materialised. */
export function getEpochColumn(values: unknown[]): unknown[] | undefined {
    return epochColumnCache.get(values);
}

/** Drop the cached epoch column after `values` is mutated in place (incremental updates). */
export function invalidateEpochColumn(values: unknown[]): void {
    epochColumnCache.delete(values);
}
