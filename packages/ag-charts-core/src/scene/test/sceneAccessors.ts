// The scene is isolated from the rest of the package by a dependency rule, so its test helpers live beside it.

/** A hand-built test double typed as `T`, holding only the members the code under test reads. */
export function fake<T>(members: object): T {
    return members as unknown as T;
}

/** Sets the global `agChartsDebug` flag and returns the function that restores the previous value. */
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
