import { Debug } from '../../util/debug';

const debug = Debug.create(true, 'transaction-utils');

/**
 * Normalises remove references into a canonical array of references.
 * Handles both single values and arrays.
 */
export function normaliseRemoveReferences<T>(remove: T | T[] | undefined): T[] {
    if (remove == null) {
        return [];
    }
    return Array.isArray(remove) ? remove : [remove];
}

/**
 * Maps user-provided removal references to canonical references that match
 * the actual data array indices. Uses reference equality.
 *
 * @param data - The source data array (must be non-null array)
 * @param removeRefs - Array of datum references to remove (must be non-null array)
 * @returns Array of unique datum references that exist in the data array
 */
export function mapToCanonicalReferences<T>(data: readonly T[], removeRefs: readonly T[]): T[] {
    if (!Array.isArray(data)) {
        throw new Error('AG Charts - mapToCanonicalReferences expects "data" to be an array.');
    }

    if (!Array.isArray(removeRefs)) {
        throw new Error('AG Charts - mapToCanonicalReferences expects "removeRefs" to be an array.');
    }

    if (removeRefs.length === 0) {
        return [];
    }

    // Build a Set of references to remove for O(1) lookup
    const toRemove = new Set(removeRefs);

    // Find canonical references in data array using reference equality
    const canonical: T[] = [];
    const seen = new Set<T>();

    for (const datum of data) {
        if (toRemove.has(datum) && !seen.has(datum)) {
            canonical.push(datum);
            seen.add(datum);
        }
    }

    if (debug.check() && canonical.length !== removeRefs.length) {
        debug('mapToCanonicalReferences() - reference count mismatch', {
            requested: removeRefs.length,
            found: canonical.length,
        });
    }

    return canonical;
}

/**
 * Removes items from an array by reference equality.
 * Optimized for performance with minimal memory allocation.
 *
 * @param data - The array to remove items from (must be non-null array)
 * @param removeRefs - Array of references to remove (must be non-null array)
 * @param mutate - If true, mutates data in-place; if false, returns new array
 * @returns The array with items removed (either mutated original or new array)
 */
export function applyRemoveByReference<T>(data: T[], removeRefs: readonly T[]): T[] {
    if (!Array.isArray(data)) {
        throw new Error('AG Charts - applyRemoveByReference expects "data" to be an array.');
    }

    if (!Array.isArray(removeRefs)) {
        throw new Error('AG Charts - applyRemoveByReference expects "removeRefs" to be an array.');
    }

    if (removeRefs.length === 0) {
        return data;
    }

    // Build a Set for O(1) lookup
    const toRemove = new Set(removeRefs);

    // In-place removal by shifting elements
    let writeIndex = 0;
    for (let readIndex = 0; readIndex < data.length; readIndex++) {
        if (!toRemove.has(data[readIndex])) {
            if (writeIndex !== readIndex) {
                data[writeIndex] = data[readIndex];
            }
            writeIndex++;
        }
    }
    // Truncate array to new length
    data.length = writeIndex;
    return data;
}

/**
 * Finds the indices of references in the original data array using reference equality.
 * Returns a sorted array of unique indices.
 *
 * @param data - The source data array
 * @param removeRefs - Array of datum references to find
 * @returns Sorted array of indices where the references were found
 */
export function findIndicesInOriginalArray<T>(data: readonly T[], removeRefs: readonly T[]): number[] {
    if (!Array.isArray(data)) {
        throw new Error('AG Charts - findIndicesInOriginalArray expects "data" to be an array.');
    }

    if (!Array.isArray(removeRefs)) {
        throw new Error('AG Charts - findIndicesInOriginalArray expects "removeRefs" to be an array.');
    }

    if (removeRefs.length === 0) {
        return [];
    }

    // Build a Set of references for O(1) lookup
    const toFind = new Set(removeRefs);
    const indices: number[] = [];

    // Find all matching indices
    for (let i = 0; i < data.length; i++) {
        if (toFind.has(data[i])) {
            indices.push(i);
        }
    }

    // Sort indices for easier processing
    indices.sort((a, b) => a - b);

    if (debug.check() && indices.length !== removeRefs.length) {
        debug('findIndicesInOriginalArray() - reference count mismatch', {
            requested: removeRefs.length,
            found: indices.length,
        });
    }

    return indices;
}
