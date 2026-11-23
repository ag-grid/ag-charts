import type { AgMarkerShape, AgMarkerShapeFn } from 'ag-charts-types';

import type { ExtendedPath2D } from '../scene/extendedPath2D';
import { traceMarkerShape } from './markerShapes';

/**
 * Origin-centred {@link ExtendedPath2D} authored once per `(shape, size [, pixelRatio])` and
 * shared across all markers using those parameters. Callers apply a per-marker
 * `ctx.translate(x, y)` (with anchor offset) at draw time, so the same Path2D is reused across
 * every marker and every render pass. Label placement reads the same paths, so a shape is traced
 * once for both.
 *
 * **Built-in shapes** are pixel-ratio independent (they author at the origin; pixel-alignment
 * happens at the per-marker translate target — see `Marker.drawPath`). They are cached by
 * `(shape, size)` only.
 *
 * **Custom shape functions** receive `pixelRatio` in `AgMarkerShapeFnParams` and may use it for
 * HiDPI-aware drawing, so they are cached by `(shape, size, pixelRatio)` to avoid serving a
 * path authored for the wrong DPR.
 *
 * Custom shape functions are cached by function identity (we assume them pure for a given
 * `(size, pixelRatio)`); reused identities across different captured state will see stale
 * geometry — same trade-off the built-in shape generators take.
 *
 * Each shape cache is soft-capped at {@link MAX_CACHE_ENTRIES} entries; on overflow the cache
 * is cleared wholesale. This handles pathological workloads (e.g. bubble series with thousands
 * of continuous distinct sizes) without unbounded memory growth, while keeping the steady-state
 * hit rate near 100% for any reasonable rendering session.
 */

// Soft cap per shape entry. Sized to cover realistic axis/legend/series usage across multiple
// distinct shapes while preventing unbounded growth from continuous-size series.
const MAX_CACHE_ENTRIES = 1024;

const stringShapeCache = new Map<string, ExtendedPath2D>();
// Keyed by pixel ratio, then size, so a lookup builds no key string.
const functionShapeCache = new WeakMap<AgMarkerShapeFn, Map<number, Map<number, ExtendedPath2D>>>();

export function getSharedMarkerPath(shape: AgMarkerShape, size: number, pixelRatio: number = 1): ExtendedPath2D {
    if (typeof shape === 'string') {
        const key = `${shape}:${size}`;
        let path = stringShapeCache.get(key);
        if (path === undefined) {
            if (stringShapeCache.size >= MAX_CACHE_ENTRIES) stringShapeCache.clear();
            path = traceMarkerShape(shape, size, 1);
            stringShapeCache.set(key, path);
        }
        return path;
    }
    if (typeof shape === 'function') {
        return sharedCustomPath(shape, size, pixelRatio);
    }
    // Fallback for unset/invalid shape — build a one-off square so rendering doesn't crash.
    // Not cached: this branch should only be reachable via options that failed validation.
    return traceMarkerShape('square', size, pixelRatio);
}

function sharedCustomPath(shape: AgMarkerShapeFn, size: number, pixelRatio: number): ExtendedPath2D {
    let byPixelRatio = functionShapeCache.get(shape);
    if (byPixelRatio === undefined) {
        byPixelRatio = new Map();
        functionShapeCache.set(shape, byPixelRatio);
    }
    let bySize = byPixelRatio.get(pixelRatio);
    if (bySize === undefined) {
        bySize = new Map();
        byPixelRatio.set(pixelRatio, bySize);
    }
    let path = bySize.get(size);
    if (path === undefined) {
        if (bySize.size >= MAX_CACHE_ENTRIES) bySize.clear();
        path = traceMarkerShape(shape, size, pixelRatio);
        bySize.set(size, path);
    }
    return path;
}

/** @internal — test-only escape hatch. The runtime never needs to clear the cache. */
export function clearMarkerPathCache(): void {
    stringShapeCache.clear();
}
