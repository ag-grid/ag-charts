import { type ChartModuleDefinition, Debug, LRUCache, ModuleRegistry, deepFreeze } from 'ag-charts-core';
import type { AgChartThemeParams } from 'ag-charts-types';

// Structural-output cache for `ChartOptions.slowSetup`, gated by callers on
// `domMode: 'minimal'`. `processedOptions` is cached with per-instance keys
// (data/container/context) stripped — callers re-attach them from `userOptions`
// on hit so two charts with the same option shape but different per-instance
// values do not alias.

export interface StructuralCacheEntry {
    /** `processedOptions` with `VOLATILE_KEYS` stripped — caller re-attaches them from `userOptions` on read. */
    processedOptions: unknown;
    themeParameters: AgChartThemeParams;
    googleFonts: Set<string> | undefined;
    annotationThemes: any;
    chartDef: ChartModuleDefinition<any>;
}

const STRUCTURAL_CACHE_MAX = 8;
const structuralCache = new LRUCache<StructuralCacheEntry>(STRUCTURAL_CACHE_MAX);
let structuralCacheRevision = -1;
const structuralCacheDebug = Debug.create(true, 'perf', 'opts');

// Keys that vary per chart instance — must not contribute to the cache key.
// `document`/`window`/`styleContainer` are extracted to `specialOverrides` before
// `slowSetup` runs so they never reach `processedOptions`; the others are
// re-attached from `userOptions` on cache hit (see `VOLATILE_KEYS`).
const IGNORED_SIGNATURE_KEYS = new Set(['data', 'container', 'document', 'window', 'styleContainer', 'context']);

/**
 * Keys that survive into `processedOptions` but are intrinsically per-instance — they
 * must be stripped before cache write and re-attached from the consuming chart's
 * `userOptions` on cache hit, otherwise charts that share a cache entry would alias
 * each other's container reference / user-supplied context payload.
 */
export const VOLATILE_KEYS = ['container', 'context'] as const;

export function computeStructuralCacheKey(options: object): string | undefined {
    let unsafe = false;
    const replacer = (key: string, value: unknown) => {
        if (IGNORED_SIGNATURE_KEYS.has(key)) return undefined;
        if (typeof value === 'function' || value instanceof Date || value instanceof Map || value instanceof Set) {
            unsafe = true;
            return undefined;
        }
        return value;
    };
    try {
        const key = JSON.stringify(options, replacer);
        if (unsafe || !key) return undefined;
        return `${key}|${describeDataShape((options as { data?: unknown }).data)}`;
    } catch {
        return undefined;
    }
}

// Keep in sync with sparklineDataPreset() in api/preset/sparkline.ts — the preset
// branches on the type of the first non-null datum, so the cache key must too.
// For plain-object datums, top-level keys are appended so {x,y} doesn't collide with
// {date,value} (downstream paths can infer config from datum field names).
function describeDataShape(data: unknown): string {
    if (!Array.isArray(data)) return data == null ? 'no-data' : 'object';
    if (data.length === 0) return 'empty';
    const firstNonNull = data.find((v) => v != null);
    if (firstNonNull == null) return 'null';
    if (typeof firstNonNull === 'number') return 'number';
    if (Array.isArray(firstNonNull)) return 'tuple';
    if (typeof firstNonNull === 'object') {
        return `object:${Object.keys(firstNonNull)
            .sort((a, b) => a.localeCompare(b))
            .join(',')}`;
    }
    return typeof firstNonNull;
}

function invalidateIfRegistryChanged() {
    structuralCacheRevision = ModuleRegistry.ifRegistryChanged(structuralCacheRevision, () => {
        structuralCache.clear();
    });
}

export function getStructuralCacheEntry(key: string): StructuralCacheEntry | undefined {
    invalidateIfRegistryChanged();
    const entry = structuralCache.get(key);
    structuralCacheDebug('[CACHE] StructuralOptions', entry ? 'hit' : 'miss');
    return entry;
}

export function setStructuralCacheEntry(key: string, value: StructuralCacheEntry) {
    invalidateIfRegistryChanged();
    structuralCache.set(key, deepFreeze(value));
}

/** Test-only: drop all cached entries so cases start from a known cold state. */
export function __clearStructuralCacheForTests() {
    structuralCache.clear();
    structuralCacheRevision = -1;
}
