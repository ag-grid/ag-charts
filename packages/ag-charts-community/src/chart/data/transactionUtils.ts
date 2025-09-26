export const REMOVE_ERROR_PREFIX = 'AG Charts - data transaction "remove"';

export function normaliseRemoveReferences<T>(remove?: T[]): T[] {
    if (remove == null) return [];
    if (!Array.isArray(remove)) {
        throw new Error(`${REMOVE_ERROR_PREFIX} must be an array.`);
    }
    return remove;
}

export function resolveRemovalIndices<T>(source: readonly T[], removals: readonly T[]): number[] {
    if (removals.length === 0) return [];

    const taken = new Set<number>();
    const indices: number[] = [];

    removals.forEach((ref) => {
        const index = source.findIndex((value, idx) => value === ref && !taken.has(idx));
        if (index === -1) {
            throw new Error(`${REMOVE_ERROR_PREFIX} entries must reference an existing datum.`);
        }
        taken.add(index);
        indices.push(index);
    });

    indices.sort((a, b) => a - b);
    return indices;
}

export function applyRemoveByReference<T>(
    source: T[],
    removals: T[],
    mutate = false
): { result: T[]; removedIndices: number[] } {
    if (removals.length === 0) {
        return { result: mutate ? source : source.slice(), removedIndices: [] };
    }

    const indices = resolveRemovalIndices(source, removals);
    const target = mutate ? source : source.slice();

    for (const index of [...indices].sort((a, b) => b - a)) {
        target.splice(index, 1);
    }

    return { result: target, removedIndices: indices };
}

export function mapToCanonicalReferences<T>(source: readonly T[] | undefined, removals: readonly T[]): T[] {
    if (!source) return [...removals];
    return removals.map((candidate) => {
        const index = source.indexOf(candidate);
        return index >= 0 ? source[index] : candidate;
    });
}
