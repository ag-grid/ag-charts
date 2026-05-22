import { type ChartModuleDefinition, LRUCache, ModuleRegistry, deepFreeze } from 'ag-charts-core';
import type { AgChartThemeParams } from 'ag-charts-types';

// Structural-output cache for `ChartOptions.slowSetup`, gated by callers on
// `domMode: 'minimal'`. `processedOptions` is cached WITHOUT `data` — the per-call
// data is re-attached on hit so two charts with the same option shape but different
// data arrays do not alias.

export interface StructuralCacheEntry {
    /** `processedOptions` with `data` stripped — caller splices in fresh data on read. */
    processedOptions: unknown;
    themeParameters: AgChartThemeParams;
    googleFonts: Set<string> | undefined;
    annotationThemes: any;
    chartDef: ChartModuleDefinition<any>;
}

const STRUCTURAL_CACHE_MAX = 8;
const structuralCache = new LRUCache<StructuralCacheEntry>(STRUCTURAL_CACHE_MAX);
let structuralCacheRevision = -1;

const IGNORED_SIGNATURE_KEYS = new Set(['data', 'container', 'document', 'window', 'styleContainer', 'context']);

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
    return structuralCache.get(key);
}

export function setStructuralCacheEntry(key: string, value: StructuralCacheEntry) {
    invalidateIfRegistryChanged();
    structuralCache.set(key, deepFreeze(value));
}
