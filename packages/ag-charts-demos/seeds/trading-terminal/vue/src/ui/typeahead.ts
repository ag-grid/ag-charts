// Radix's typeahead search (`useTypeaheadSearch`) for the Select trigger. reka-ui runs its own
// inside the open listbox, where focus moves to the match as in Radix, but on the closed trigger it
// only focuses the match, which is detached while the listbox is closed, whereas Radix moves the
// value to it. The Select wrapper reproduces that half with these helpers.

/** How long Radix's typeahead keeps what has been typed after the last character. */
const TYPEAHEAD_RESET_MS = 1000;

/**
 * Characters typed within a second of each other accumulate into one search, which clears a second
 * after the last.
 */
export function createTypeahead() {
    let search = '';
    let timer: ReturnType<typeof setTimeout> | undefined;
    return {
        /** Whether a search is in progress, when Space extends it rather than opening. */
        get active() {
            return search !== '';
        },
        /** Add a typed character and return the search it makes. */
        add(key: string): string {
            search += key;
            clearTimeout(timer);
            timer = setTimeout(() => {
                search = '';
            }, TYPEAHEAD_RESET_MS);
            return search;
        },
        /** Drop the search, as Radix does when the listbox opens. */
        reset() {
            clearTimeout(timer);
            search = '';
        },
    };
}

/**
 * Radix `findNextItem`: the first of `items` at or after `current` (wrapping round) whose label
 * starts with the search, case-insensitively. A run of one repeated character searches on that
 * character alone and skips `current`, so pressing it again cycles through the items starting with
 * it. Nothing is returned when the match is `current` itself.
 */
export function findNextItem<T>(
    items: readonly T[],
    labelOf: (item: T) => string,
    search: string,
    current: T | undefined
): T | undefined {
    const repeated = search.length > 1 && Array.from(search).every((char) => char === search[0]);
    const needle = (repeated ? search[0] : search).toLowerCase();
    const start = Math.max(current ? items.indexOf(current) : -1, 0);
    let candidates = items.map((_, index) => items[(start + index) % items.length]);
    if (needle.length === 1) candidates = candidates.filter((item) => item !== current);
    const next = candidates.find((item) => labelOf(item).toLowerCase().startsWith(needle));
    return next !== current ? next : undefined;
}
