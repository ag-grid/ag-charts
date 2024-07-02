/**
 * Finds the maximum value that matches a condition within a specified range.
 *
 * @template T
 * @param {number} min - The minimum number in the range.
 * @param {number} max - The maximum number in the range.
 * @param {function(number): (T | undefined)} iteratee - A function that takes a number and returns a value of type T or undefined.
 * @returns {T | undefined} - The maximum value that matches the condition, or undefined if no match is found.
 */
export function findMaxValue<T>(min: number, max: number, iteratee: (value: number) => T | undefined): T | undefined {
    if (min > max) return;
    let found: T | undefined;
    while (max >= min) {
        const index = Math.floor((max + min) / 2);
        const value = iteratee(index);
        if (value == null) {
            max = index - 1;
        } else {
            found = value;
            min = index + 1;
        }
    }
    return found;
}
