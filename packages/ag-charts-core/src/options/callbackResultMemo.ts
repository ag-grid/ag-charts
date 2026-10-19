const MAX_ENTRIES = 1024;

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

/** Whether every value is a string, number or boolean, and none reads a CSS variable. */
export function hasOnlyPlainValues(result: object): boolean {
    for (const key of Object.keys(result)) {
        if (!isPlainValue((result as Record<string, unknown>)[key])) return false;
    }
    return true;
}

/**
 * Remembers what a callback's result became, keyed by the result's values. A result that cannot be keyed safely has
 * no key, so it takes the caller's normal path every time and a stale entry is never served.
 *
 * Once full it stops adding entries rather than evicting, so a callback returning a distinct result per datum
 * pays for one failed lookup instead of churning the map.
 */
export class CallbackResultMemo<T> {
    private readonly entries = new Map<string, T>();

    keyFor(result: unknown): string | undefined {
        if (typeof result !== 'object' || result === null || Array.isArray(result)) return;

        let key = '';
        for (const name of Object.keys(result)) {
            const value = (result as Record<string, unknown>)[name];
            if (!isPlainValue(value)) return;

            // Lengths delimit the text, so no value can impersonate the boundary between two others.
            key += `${name.length}:${name}`;
            key += typeof value === 'string' ? `s${value.length}:${value}` : `${typeof value}${value}`;
        }
        return key;
    }

    get(key: string): T | undefined {
        return this.entries.get(key);
    }

    set(key: string, value: T) {
        if (this.entries.size < MAX_ENTRIES) this.entries.set(key, value);
    }
}
