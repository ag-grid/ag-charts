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
 * hit rate near 100% for any reasonable rendering session. A custom shape's path that a marker
 * still holds is found after its entry is cleared, so no path in use is traced twice.
 */

// Soft cap per shape entry. Sized to cover realistic axis/legend/series usage across multiple
// distinct shapes while preventing unbounded growth from continuous-size series.
const MAX_CACHE_ENTRIES = 1024;

const stringShapeCache = new Map<string, ExtendedPath2D>();

/** One custom shape's paths at one pixel ratio, by size. */
interface CustomPaths {
    readonly recent: Map<number, ExtendedPath2D>;
    // Every path a marker may still hold, so clearing `recent` never retraces a path in use.
    readonly held: Map<number, WeakRef<ExtendedPath2D>>;
    sweepAt: number;
}
// Keyed by pixel ratio, then size, so a lookup builds no key string.
const functionShapeCache = new WeakMap<AgMarkerShapeFn, Map<number, CustomPaths>>();

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
    let paths = byPixelRatio.get(pixelRatio);
    if (paths === undefined) {
        paths = { recent: new Map(), held: new Map(), sweepAt: 2 * MAX_CACHE_ENTRIES };
        byPixelRatio.set(pixelRatio, paths);
    }
    const { recent, held } = paths;
    let path = recent.get(size);
    if (path !== undefined) return path;
    path = held.get(size)?.deref();
    if (path === undefined) {
        path = traceMarkerShape(shape, size, pixelRatio);
        held.set(size, new WeakRef(path));
        if (held.size >= paths.sweepAt) sweepReleasedPaths(paths);
    }
    if (recent.size >= MAX_CACHE_ENTRIES) recent.clear();
    recent.set(size, path);
    return path;
}

function sweepReleasedPaths(paths: CustomPaths) {
    for (const [size, ref] of paths.held) {
        if (ref.deref() === undefined) paths.held.delete(size);
    }
    // Relative to what survives, so a large set of paths in use is not swept on every trace.
    paths.sweepAt = 2 * Math.max(MAX_CACHE_ENTRIES, paths.held.size);
}

/** @internal — test-only escape hatch. The runtime never needs to clear the cache. */
export function clearMarkerPathCache(): void {
    stringShapeCache.clear();
}
