import type { PlainObject } from 'ag-charts-core';

const MAX_ENTRIES = 4;

interface Resolution {
    readonly input: PlainObject;
    readonly keys: readonly string[];
    readonly resolved: PlainObject;
}

/**
 * Remembers the last few flat `itemStyler` results with their resolution, so a styler that returns one of a few
 * objects across thousands of cells skips the options graph. Only results of numbers, booleans and non-`var()`
 * strings are remembered; `var()` colours are read from the DOM. Remembered inputs are held by reference, which
 * relies on the validated styler returning a fresh object per call. Resolved objects are shared and read-only.
 * Entries are evicted oldest first and cleared with the datum callback cache.
 */
export class ItemStylerResolutions {
    private entries: Resolution[] = [];
    private nextSlot = 0;

    constructor(private readonly resolveFn: (result: PlainObject | undefined) => PlainObject | undefined) {}

    clear() {
        this.entries = [];
        this.nextSlot = 0;
    }

    resolve(result: PlainObject | undefined): PlainObject | undefined {
        if (result == null) return this.resolveFn(result);

        const keys = Object.keys(result);
        if (!isRememberable(result, keys)) return this.resolveFn(result);

        for (const entry of this.entries) {
            if (entry.keys.length === keys.length && matches(entry.input, result, keys)) {
                return entry.resolved;
            }
        }

        const resolved = this.resolveFn(result);
        if (resolved != null) {
            this.entries[this.nextSlot] = { input: result, keys, resolved };
            this.nextSlot = (this.nextSlot + 1) % MAX_ENTRIES;
        }
        return resolved;
    }
}

function isRememberable(result: PlainObject, keys: string[]) {
    for (const key of keys) {
        const value = result[key];
        switch (typeof value) {
            case 'number':
            case 'boolean':
                break;
            case 'string':
                if (value.startsWith('var(')) return false;
                break;
            default:
                return false;
        }
    }
    return true;
}

function matches(input: PlainObject, result: PlainObject, keys: string[]) {
    for (const key of keys) {
        if (input[key] !== result[key]) return false;
    }
    return true;
}
