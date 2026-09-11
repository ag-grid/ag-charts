import { LRUCache, type PlainObject, isPlainObject } from 'ag-charts-core';

// Sized for the handful of distinct styles a styler yields; one returning a distinct style per datum evicts
// rather than growing without bound.
const PARTIAL_CACHE_MAX = 512;

// Depth cap doubles as the cycle guard: a self-referential payload bails out as uncacheable.
const CACHE_KEY_MAX_DEPTH = 6;

export interface PartialCacheKeyOptions {
    permissivePath?: boolean;
    pick?: boolean;
    proxyPaths?: Record<string, Array<string>>;
}

interface PartialCacheEntry {
    value: PlainObject | undefined;
}

/**
 * Resolved partials, keyed by request. A styler resolves one per datum and resolving is not a read — operations
 * graft theme branches onto the graph, resolve them, then roll them back — so repeating an identical request
 * rebuilds and discards the same sub-graph once per datum.
 */
export class OptionsPartialCache {
    private readonly entries = new LRUCache<PartialCacheEntry>(PARTIAL_CACHE_MAX);
    private resolvedState: unknown;

    clear() {
        this.entries.clear();
    }

    /**
     * Drop everything resolved against a superseded root object. Checked on access rather than hooked to the call
     * that replaces it, because the path that serves a chart from the structural cache never resolves the graph at
     * all — an invalidation the graph has to remember to announce is one that path would silently skip.
     */
    invalidateIfStale(resolvedState: unknown) {
        if (this.resolvedState === resolvedState) return;

        this.resolvedState = resolvedState;
        this.entries.clear();
    }

    /**
     * A key identifying the request, or `undefined` when it must not be cached: `proxyPaths` rewrites the caller's
     * own object rather than only reading it.
     */
    keyFor(path: Array<string>, partialOptions: PlainObject, resolveOptions?: PartialCacheKeyOptions) {
        if (resolveOptions?.proxyPaths != null) return;

        const key: Array<string> = [
            path.join('.'),
            resolveOptions?.permissivePath === true ? 'P' : '-',
            resolveOptions?.pick === false ? 'K' : '-',
        ];
        if (!appendCacheKey(key, partialOptions, 0)) return;

        // NUL cannot occur in an option string, so no value can impersonate the boundary between two.
        return key.join('\u0000');
    }

    read(key: string): PartialCacheEntry | undefined {
        const entry = this.entries.get(key);
        if (!entry) return;

        return { value: entry.value && copyResult(entry.value) };
    }

    write(key: string, value: PlainObject | undefined) {
        this.entries.set(key, { value: value && copyResult(value) });
    }
}

// Line and area series set `marker ??= {}` on the result, so neither side may hold the object the other reads.
// The copy is shallow, so nested values stay shared and no caller may write through one.
function copyResult(value: PlainObject): PlainObject {
    // Spreading an array into an object would rewrite it as index keys.
    return Array.isArray(value) ? [...value] : { ...value };
}

/**
 * Append a value to a cache key, returning `false` if it cannot be represented. Type tags keep distinct values
 * distinct once joined, so differing key order costs a miss rather than risking a false hit.
 */
function appendCacheKey(key: Array<string>, value: unknown, depth: number): boolean {
    if (depth > CACHE_KEY_MAX_DEPTH) return false;

    if (value === null) {
        key.push('null');
        return true;
    }

    switch (typeof value) {
        case 'undefined':
            key.push('undefined');
            return true;
        case 'string':
            key.push('s', value);
            return true;
        case 'number':
        case 'bigint':
        case 'boolean':
            key.push(typeof value, String(value));
            return true;
        case 'object':
            break;
        default:
            return false;
    }

    if (Array.isArray(value)) {
        key.push('[');
        for (const item of value) {
            if (!appendCacheKey(key, item, depth + 1)) return false;
        }
        key.push(']');
        return true;
    }

    if (!isPlainObject(value)) return false;

    key.push('{');
    for (const objectKey of Object.keys(value)) {
        key.push(objectKey);
        if (!appendCacheKey(key, value[objectKey], depth + 1)) return false;
    }
    key.push('}');

    return true;
}

/**
 * Callers re-derive CSS variables from the partial on each request, so the map arrives fresh every time and is
 * almost always a repeat of what the graph already holds.
 */
export function hasUnmergedCssVariables(current: Record<string, string>, incoming: Record<string, string>) {
    for (const key of Object.keys(incoming)) {
        if (current[key] !== incoming[key]) return true;
    }

    return false;
}
