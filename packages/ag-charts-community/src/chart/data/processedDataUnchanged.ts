import type { ProcessedData } from './dataModelTypes';
import type { DataSet } from './dataSet';

function sameValue(a: unknown, b: unknown): boolean {
    if (a === b) return true;
    // NaN is the only value not equal to itself.
    if (a !== a && b !== b) return true;
    // Dates compare by time; any other object is a different one, however alike.
    return a instanceof Date && b instanceof Date && a.getTime() === b.getTime();
}

function sameArray(a: readonly unknown[], b: readonly unknown[]): boolean {
    const length = a.length;
    if (length !== b.length) return false;
    for (let i = 0; i < length; i++) {
        if (!sameValue(a[i], b[i])) return false;
    }
    return true;
}

function sameArrayMap(a: Map<string, readonly unknown[]> | undefined, b: Map<string, readonly unknown[]> | undefined) {
    if (a == null || b == null) return a == b;
    if (a.size !== b.size) return false;
    for (const [id, values] of a) {
        const other = b.get(id);
        if (other == null || !sameArray(values, other)) return false;
    }
    return true;
}

/** Whether two rows hold the same values, field by field. A nested object counts as different unless it is the same one. */
function sameRow(a: unknown, b: unknown): boolean {
    if (a === b) return true;
    if (a == null || b == null || typeof a !== 'object' || typeof b !== 'object') return false;
    const rowA = a as Record<string, unknown>;
    const rowB = b as Record<string, unknown>;
    let fieldCount = 0;
    for (const key in rowA) {
        if (!sameValue(rowA[key], rowB[key])) return false;
        fieldCount++;
    }
    for (const _ in rowB) {
        fieldCount--;
    }
    return fieldCount === 0;
}

function sameRows(a: DataSet<any>, b: DataSet<any>): boolean {
    const rowsA = a.data;
    const rowsB = b.data;
    const length = rowsA.length;
    if (length !== rowsB.length) return false;
    for (let i = 0; i < length; i++) {
        if (!sameRow(rowsA[i], rowsB[i])) return false;
    }
    return true;
}

/**
 * Whether `next` holds exactly what `previous` did: the same processed keys and values, validity and missing-ness, and
 * the same rows behind them. A series that finds so can keep the node data it built from `previous`.
 *
 * Only ungrouped data qualifies, and processed columns are compared by value so that mutating the data array in place
 * is caught. The rows are compared too, as callbacks and tooltips can read fields no column holds.
 *
 * The comparison is O(n) in the columns and rows and gives up at the first difference.
 */
export function processedDataUnchanged(previous: ProcessedData<any>, next: ProcessedData<any>): boolean {
    if (previous === next) return false; // An incremental update mutates in place: there is nothing to compare against.
    // The series of one request share their processed data, so each is asked the same question.
    const known = comparisons.get(next);
    if (known?.previous === previous) return known.unchanged;
    const unchanged = compareProcessedData(previous, next);
    comparisons.set(next, { previous, unchanged });
    return unchanged;
}

const comparisons = new WeakMap<ProcessedData<any>, { previous: ProcessedData<any>; unchanged: boolean }>();

function compareProcessedData(previous: ProcessedData<any>, next: ProcessedData<any>): boolean {
    if (previous.type !== 'ungrouped' || next.type !== 'ungrouped') return false;
    if (previous.input.count !== next.input.count) return false;
    if (previous.columns.length !== next.columns.length || previous.keys.length !== next.keys.length) return false;
    if (previous.partialValidDataCount !== next.partialValidDataCount) return false;
    if (previous.aggregation != null || next.aggregation != null) return false;

    for (let i = 0; i < previous.columns.length; i++) {
        if (!sameArray(previous.columns[i], next.columns[i])) return false;
    }
    for (let i = 0; i < previous.keys.length; i++) {
        if (!sameArrayMap(previous.keys[i], next.keys[i])) return false;
    }
    if (
        !sameArrayMap(previous.invalidKeys, next.invalidKeys) ||
        !sameArrayMap(previous.invalidData, next.invalidData) ||
        !sameArrayMap(previous.missingData, next.missingData)
    ) {
        return false;
    }

    if (previous.dataSources.size !== next.dataSources.size) return false;
    const compared = new Set<DataSet<any>>();
    for (const [id, dataSet] of previous.dataSources) {
        const other = next.dataSources.get(id);
        if (other == null) return false;
        if (compared.has(dataSet)) continue; // Scopes of one request share a data set.
        compared.add(dataSet);
        if (!sameRows(dataSet, other)) return false;
    }
    return true;
}
