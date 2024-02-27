/**
 * Loops through an array of items right (starting from 0 till the middle item)
 * and left (starting from 0, continuing with the last item till the middle item).
 * Breaks if the iterator returns a truthy value.
 * @param items Array of items.
 * @param step Step to increment.
 * @param iterator Iterator function that accepts an item and the next item.
 * @returns `true` if the `iterator` returned `true`, or `false` if it never happened.
 */
export function loopSymmetrically<T>(items: T[], step: number, iterator: (prev: T, next: T) => any) {
    const loop = (start: number, end: number, loopStep: number, loopIterator: (prev: T, next: T) => any) => {
        let prev = items[0];
        for (let i = start; loopStep > 0 ? i <= end : i > end; i += loopStep) {
            const curr = items[i];
            if (loopIterator(prev, curr)) return true;
            prev = curr;
        }
        return false;
    };

    const midIndex = Math.floor(items.length / 2);

    if (loop(step, midIndex, step, iterator)) return true;
    return loop(items.length - step, midIndex, -step, iterator);
}
