/**
 * Compares two arrays and returns the differences between them, identifying added and removed elements.
 *
 * @template T - The type of elements in the arrays.
 * @param {T[]} previous - The original array before changes.
 * @param {T[]} current - The modified array after changes.
 * @returns {{ changed: boolean, added: Set<T>, removed: Set<T> }}
 * - An object containing:
 *   - `changed`: A boolean indicating if there are any changes.
 *   - `added`: A set of elements that were added to the current array.
 *   - `removed`: A set of elements that were removed from the previous array.
 */
export function diffArrays<T>(previous: T[], current: T[]): { changed: boolean; added: Set<T>; removed: Set<T> } {
    const size = Math.max(previous.length, current.length);
    const added = new Set<T>();
    const removed = new Set<T>();

    for (let i = 0; i < size; i++) {
        const prev = previous[i];
        const curr = current[i];

        if (prev === curr) continue;

        if (removed.has(curr)) {
            removed.delete(curr);
        } else if (curr) {
            added.add(curr);
        }

        if (added.has(prev)) {
            added.delete(prev);
        } else if (prev) {
            removed.add(prev);
        }
    }

    return { changed: added.size > 0 || removed.size > 0, added, removed };
}
