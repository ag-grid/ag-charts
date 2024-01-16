/**
 * Loops through an array of items right (starting from 0 till the middle item)
 * and left (starting from 0, continuing with the last item till the middle item).
 * Breaks if the iterator returns a truthy value.
 * @param items Array of items.
 * @param step Step to increment.
 * @param iterator Iterator function that accepts an item and the next item.
 * @returns `true` if the `iterator` returned `true`, or `false` if it never happened.
 */
export declare function loopSymmetrically<T>(items: T[], step: number, iterator: (prev: T, next: T) => any): boolean;
