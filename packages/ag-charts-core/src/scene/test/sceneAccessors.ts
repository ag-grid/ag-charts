// Typed helpers for the scene tests. The scene is isolated from the rest of the package by a dependency rule, so these
// live beside it rather than in `src/test`; `**/test/**` is excluded from the library and type builds.

/**
 * A hand-built test double typed as `T`. Give it only the members the code under test reads; a member it does not read
 * is `undefined` at runtime. This is the one place a scene double is cast to `T`, so the cast is not repeated in each
 * test. (`src/test/coreAccessors.ts` has the same helper for the tests outside the scene.)
 */
export function fake<T>(members: object): T {
    return members as unknown as T;
}

/**
 * Sets the `agChartsDebug` flag the debug selectors are read from, and returns the function that puts the previous
 * value back. Debug logging is switched on by a global, so there is no option to pass instead.
 *
 * Duplicates `setAgChartsDebug` in the community `chart/test/seriesAccessors.ts` (same signature and behaviour): that
 * file sits in the community package, which core cannot import. Consolidating the two is left as a follow-up.
 */
export function setAgChartsDebug(selectors: boolean | string | (boolean | string)[]): () => void {
    const previous = Reflect.has(globalThis, 'agChartsDebug') ? Reflect.get(globalThis, 'agChartsDebug') : undefined;
    Reflect.set(globalThis, 'agChartsDebug', selectors);
    return () => {
        if (previous === undefined) {
            Reflect.deleteProperty(globalThis, 'agChartsDebug');
        } else {
            Reflect.set(globalThis, 'agChartsDebug', previous);
        }
    };
}
