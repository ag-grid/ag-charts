import type { ChartModuleDefinition } from 'ag-charts-core';
import type { AgChartThemeParams } from 'ag-charts-types';

// Structural-output cache for `ChartOptions.slowSetup`, gated by callers on
// `optionMetadata.domMode === 'minimal'` (sparkline preset). Holds ONLY
// chart-independent outputs — never `activeTheme`, `annotationThemes` raw
// refs, or `optionsGraph`. Those retain chart-bound state via resolution
// closures and previously caused heap leaks under cumulative worker-test load.
//
// Entries are keyed by a signature of the user options excluding `data` and
// `container`. `ChartTheme` instances transitively referenced by
// `processedOptions` are owned by the `sanitizeThemeModules` cache (not chart-
// instance scoped), so retaining them here does not pin charts.

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

// Returns a stable signature for the structural-output cache, or undefined
// when the options contain values we can't safely hash (functions, etc.) so
// callers fall through to the uncached path rather than risk false-positive
// cache hits.
//
// The sparkline preset's `processData` / `create` paths derive series and
// axis config from the data shape (tuples vs scalars vs `{x, y}` objects),
// so the signature includes a coarse data-shape descriptor — same options +
// same data shape produce identical structural outputs.
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

// Coarse data-shape descriptor — enough to distinguish the preset-relevant
// cases (scalar, tuple, object, mixed/empty/null-leading) without inspecting
// every datum.
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
    // Re-insert to mark as most-recently-used.
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
