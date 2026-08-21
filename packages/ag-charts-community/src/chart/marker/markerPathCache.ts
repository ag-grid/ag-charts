import type { AgMarkerShape, AgMarkerShapeFn, AgMarkerShapeFnParams } from 'ag-charts-types';

import { ExtendedPath2D } from '../../scene/extendedPath2D';
import { MARKER_SHAPES } from './shapes';

/**
 * Origin-centred {@link ExtendedPath2D} authored once per `(shape, size [, pixelRatio])` and
 * shared across all markers using those parameters. Callers apply a per-marker
 * `ctx.translate(x, y)` (with anchor offset) at draw time, so the same Path2D is reused across
 * every marker and every render pass.
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
const functionShapeCache = new WeakMap<AgMarkerShapeFn, Map<string, ExtendedPath2D>>();

function buildPath(shape: AgMarkerShape, size: number, pixelRatio: number): ExtendedPath2D {
    const path = new ExtendedPath2D();
    const drawParams: AgMarkerShapeFnParams = { path, x: 0, y: 0, size, pixelRatio };
    if (typeof shape === 'string') {
        MARKER_SHAPES[shape](drawParams);
    } else {
        shape(drawParams);
    }
    return path;
}

export function getSharedMarkerPath(shape: AgMarkerShape, size: number, pixelRatio: number = 1): ExtendedPath2D {
    if (typeof shape === 'string') {
        const key = `${shape}:${size}`;
        let path = stringShapeCache.get(key);
        if (path === undefined) {
            if (stringShapeCache.size >= MAX_CACHE_ENTRIES) stringShapeCache.clear();
            path = buildPath(shape, size, 1);
            stringShapeCache.set(key, path);
        }
        return path;
    }
    if (typeof shape === 'function') {
        let sizeMap = functionShapeCache.get(shape);
        if (sizeMap === undefined) {
            sizeMap = new Map();
            functionShapeCache.set(shape, sizeMap);
        }
        const key = `${size}:${pixelRatio}`;
        let path = sizeMap.get(key);
        if (path === undefined) {
            if (sizeMap.size >= MAX_CACHE_ENTRIES) sizeMap.clear();
            path = buildPath(shape, size, pixelRatio);
            sizeMap.set(key, path);
        }
        return path;
    }
    // Fallback for unset/invalid shape — build a one-off square so rendering doesn't crash.
    // Not cached: this branch should only be reachable via options that failed validation.
    return buildPath('square', size, pixelRatio);
}

/** @internal — test-only escape hatch. The runtime never needs to clear the cache. */
export function clearMarkerPathCache(): void {
    stringShapeCache.clear();
}
