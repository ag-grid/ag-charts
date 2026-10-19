const MAX_ENTRIES = 1024;

/** Cleared results of a callback result with only plain values, so no theme reference or `var()` colour is left in them. */
const plainResults = new WeakSet<object>();

function isPlainValue(value: unknown): value is string | number | boolean {
    switch (typeof value) {
        case 'number':
        case 'boolean':
            return true;
        case 'string':
            // CSS variables are read from the DOM, so the same string can resolve differently over time.
            return !value.includes('var(');
        default:
            return false;
    }
}

export function isPlainResult(result: object): boolean {
    return plainResults.has(result);
}

interface MemoNode<T> {
    /** Child nodes by property name, then by that property's value (`Map` keeps `1`, `'1'` and `true` apart). */
    readonly next: Map<string, Map<unknown, MemoNode<T>>>;
    value?: T;
}

/**
 * Remembers what a callback's result became, as a tree of property names and values in the result's own order. A
 * result with a value that cannot be remembered safely is never found, so it takes the caller's normal path.
 *
 * Once full it stops adding rather than evicting; `clear` makes room again between passes.
 */
export class CallbackResultMemo<T extends object> {
    private root: MemoNode<T> = { next: new Map() };
    private size = 0;

    /** Whether the result `recall` looked at last holds only plain values. */
    private plain = false;

    /** One scan and no allocation: this is the per-datum path. */
    recall(result: unknown): T | undefined {
        let node: MemoNode<T> | undefined = this.root;
        this.plain = false;
        if (typeof result !== 'object' || result === null || Array.isArray(result)) return;

        // `for...in` skips the array `Object.keys` would allocate; a result literal has no inherited properties.
        for (const name in result) {
            const value = (result as Record<string, unknown>)[name];
            if (!isPlainValue(value)) return;

            node = node?.next.get(name)?.get(value);
        }
        this.plain = true;
        return node?.value;
    }

    /** Stores `cleared` for the result `recall` just missed on, if that result is plain. */
    remember(result: object, cleared: T) {
        if (!this.plain) return;

        plainResults.add(cleared);
        if (this.size >= MAX_ENTRIES) return;

        let node = this.root;
        for (const name in result) {
            const value = (result as Record<string, unknown>)[name];
            let byValue = node.next.get(name);
            if (byValue == null) {
                byValue = new Map();
                node.next.set(name, byValue);
            }
            let child = byValue.get(value);
            if (child == null) {
                child = { next: new Map() };
                byValue.set(value, child);
            }
            node = child;
        }
        node.value = cleared;
        this.size++;
    }

    clear() {
        this.root = { next: new Map() };
        this.size = 0;
    }
}
