import type { ChartModuleDefinition } from 'ag-charts-core';
import type { AgChartThemeParams } from 'ag-charts-types';

// Structural-output cache for `ChartOptions.slowSetup`, gated by callers on
// `domMode: 'minimal'`. Excludes `activeTheme` / `optionsGraph` etc. — those retain
// chart-bound state via resolution closures and would pin chart instances.

export interface StructuralCacheEntry {
    processedOptions: unknown;
    themeParameters: AgChartThemeParams;
    googleFonts: Set<string> | undefined;
    annotationThemes: any;
    chartDef: ChartModuleDefinition<any>;
}

const STRUCTURAL_CACHE_MAX = 8;
const structuralCache = new Map<string, StructuralCacheEntry>();

const IGNORED_SIGNATURE_KEYS = new Set(['data', 'container', 'document', 'window', 'styleContainer', 'context']);

// Returns undefined when options contain unhashable values (functions) so callers fall
// through to the uncached path. Data shape is part of the key — preset `processData`/`create`
// branch on tuple-vs-scalar-vs-object datums, so the same options + different shape are not
// structurally equivalent.
export function computeStructuralCacheKey(options: object): string | undefined {
    let unsafe = false;
    const replacer = (key: string, value: unknown) => {
        if (IGNORED_SIGNATURE_KEYS.has(key)) return undefined;
        if (typeof value === 'function') {
            unsafe = true;
            return undefined;
        }
        return value;
    };
    try {
        const key = JSON.stringify(options, replacer);
        if (unsafe || !key) return undefined;
        const dataShape = describeDataShape((options as { data?: unknown }).data);
        return `${key}|${dataShape}`;
    } catch {
        return undefined;
    }
}

function describeDataShape(data: unknown): string {
    if (!Array.isArray(data)) return data == null ? 'null' : typeof data;
    if (data.length === 0) return 'empty';
    const sample = data.slice(0, Math.min(4, data.length));
    return sample.map(describeDatumShape).join(',');
}

function describeDatumShape(datum: unknown): string {
    if (datum == null) return 'null';
    if (Array.isArray(datum)) return `tuple${datum.length}`;
    const t = typeof datum;
    if (t !== 'object') return t;
    return 'obj';
}

export function getStructuralCacheEntry(key: string): StructuralCacheEntry | undefined {
    if (!structuralCache.has(key)) return undefined;
    const value = structuralCache.get(key)!;
    structuralCache.delete(key);
    structuralCache.set(key, value);
    return value;
}

export function setStructuralCacheEntry(key: string, value: StructuralCacheEntry) {
    if (structuralCache.has(key)) structuralCache.delete(key);
    structuralCache.set(key, value);
    while (structuralCache.size > STRUCTURAL_CACHE_MAX) {
        const oldest = structuralCache.keys().next().value;
        if (oldest === undefined) break;
        structuralCache.delete(oldest);
    }
}
