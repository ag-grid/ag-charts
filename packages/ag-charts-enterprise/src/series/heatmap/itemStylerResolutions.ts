import type { PlainObject } from 'ag-charts-core';

const MAX_ENTRIES = 4;

interface Resolution {
    readonly input: PlainObject;
    readonly keys: readonly string[];
    readonly resolved: PlainObject;
}

/**
 * Keeps the options-graph resolution of the most recent `itemStyler` results. A styler usually returns one of a few
 * flat objects across thousands of cells, so a shallow comparison replaces resolving each one against the graph.
 *
 * Only flat objects of numbers, booleans and non-`var()` strings are remembered: anything else can resolve
 * differently for equal input, and `var()` colours are read from the DOM. Resolved objects are shared between cells
 * and must not be mutated. Entries live as long as the datum callback cache they are cleared with.
 */
export class ItemStylerResolutions {
    private entries: Resolution[] = [];
    private nextSlot = 0;

    clear() {
        this.entries = [];
        this.nextSlot = 0;
    }

    lookup(result: PlainObject | undefined): PlainObject | undefined {
        if (result == null) return;

        const keys = Object.keys(result);
        if (!isRememberable(result, keys)) return;

        for (const entry of this.entries) {
            if (entry.keys.length === keys.length && matches(entry.input, result, keys)) {
                return entry.resolved;
            }
        }
    }

    store(result: PlainObject | undefined, resolved: PlainObject | undefined) {
        if (result == null || resolved == null) return;

        const keys = Object.keys(result);
        if (!isRememberable(result, keys)) return;

        // A copy, so a styler that reuses and mutates its returned object cannot alter what later results match.
        this.entries[this.nextSlot] = { input: { ...result }, keys, resolved };
        this.nextSlot = (this.nextSlot + 1) % MAX_ENTRIES;
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
