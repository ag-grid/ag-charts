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
        const datum = data[i];
        if (toFind.has(datum)) {
            indices.push(i);
            toFind.delete(datum);

            if (toFind.size === 0) {
                break;
            }
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
