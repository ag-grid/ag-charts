import type { AgMarkerShape, AgMarkerShapeFn, AgMarkerShapeFnParams } from 'ag-charts-types';

import { ExtendedPath2D } from '../../scene/extendedPath2D';
import { MARKER_SHAPES } from './shapes';

/**
 * Origin-centred {@link ExtendedPath2D} authored once per `(shape, size)` and shared across all
 * markers using those parameters. Callers apply a per-marker `ctx.translate(x, y)` (with anchor
 * offset) at draw time, so the same Path2D is reused across every marker and every render pass.
 *
 * Pixel-alignment for `square` is performed on the translate target — not baked into the path —
 * so the cache is independent of `pixelRatio`.
 *
 * Custom shape functions are cached by function identity; we assume they are pure for a given
 * `size` (the built-in shape generators in `shapes.ts` are all pure).
 */

interface CacheEntry {
    path: ExtendedPath2D;
}

const stringShapeCache = new Map<string, CacheEntry>();
const functionShapeCache = new WeakMap<AgMarkerShapeFn, Map<number, CacheEntry>>();

function buildEntry(shape: AgMarkerShape, size: number): CacheEntry {
    const path = new ExtendedPath2D();
    const drawParams: AgMarkerShapeFnParams = {
        path,
        x: 0,
        y: 0,
        size,
        pixelRatio: 1,
    };
    if (typeof shape === 'string') {
        MARKER_SHAPES[shape](drawParams);
    } else {
        shape(drawParams);
    }
    return { path };
}

export function getSharedMarkerPath(shape: AgMarkerShape, size: number): ExtendedPath2D {
    if (typeof shape === 'string') {
        const key = `${shape}:${size}`;
        let entry = stringShapeCache.get(key);
        if (entry === undefined) {
            entry = buildEntry(shape, size);
            stringShapeCache.set(key, entry);
        }
        return entry.path;
    }
    if (typeof shape === 'function') {
        let sizeMap = functionShapeCache.get(shape);
        if (sizeMap === undefined) {
            sizeMap = new Map();
            functionShapeCache.set(shape, sizeMap);
        }
        let entry = sizeMap.get(size);
        if (entry === undefined) {
            entry = buildEntry(shape, size);
            sizeMap.set(size, entry);
        }
        return entry.path;
    }
    // Fallback for unset/invalid shape — build a one-off square so rendering doesn't crash.
    return buildEntry('square', size).path;
}

export function clearMarkerPathCache(): void {
    stringShapeCache.clear();
}
