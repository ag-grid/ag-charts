/**
 * Visit item pairs while walking away from index 0 in both directions around a circular list.
 * The visitor receives `(previous, current)` pairs and may stop early by returning `true`.
 *
 * Order:
 * - Forward: 0 -> step -> 2*step -> ... -> middle (inclusive)
 * - Backward: 0 -> lastStep -> lastStep-step -> ... -> just above the middle
 *
 * @param items Items to walk.
 * @param step Step size for each hop.
 * @param visitPair Visitor called with `(previous, current)` pairs.
 * @returns `true` if the visitor stopped the walk.
 */
export function walkPairsOutward<T>(
    items: T[],
    step: number,
    visitPair: (previous: T, current: T) => boolean | void
): boolean {
    const middleIndex = Math.floor(items.length / 2);
    return (
        walkPairsByStep(items, step, middleIndex, step, visitPair) ||
        walkPairsByStep(items, items.length - step, middleIndex, -step, visitPair)
    );
}

/**
 * Visit `(previous, current)` pairs by stepping through a single range.
 *
 * @param items Items to walk.
 * @param startIndex First index to visit.
 * @param endIndex End boundary (inclusive for positive steps).
 * @param step Step size for each hop.
 * @param visitPair Visitor called with `(previous, current)` pairs.
 * @returns `true` if the visitor stopped the walk.
 */
function walkPairsByStep<T>(
    items: T[],
    startIndex: number,
    endIndex: number,
    step: number,
    visitPair: (previous: T, current: T) => boolean | void
): boolean {
    let previous = items[0];
    for (let i = startIndex; step > 0 ? i <= endIndex : i > endIndex; i += step) {
        const current = items[i];
        if (visitPair(previous, current)) {
            return true;
        }
        previous = current;
    }
    return false;
}
