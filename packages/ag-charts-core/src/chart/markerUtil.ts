import type { AgMarkerShape, AgMarkerShapeFn, AgMarkerSizeMode } from 'ag-charts-types';

type MarkerSupportedShapes = Exclude<AgMarkerShape, AgMarkerShapeFn>;

const MARKER_SUPPORTED_SHAPES = new Set([
    'circle',
    'cross',
    'diamond',
    'heart',
    'pin',
    'plus',
    'square',
    'star',
    'triangle',
]);

export function isSupportedMarkerShape(shape: unknown): shape is MarkerSupportedShapes {
    return typeof shape === 'string' && MARKER_SUPPORTED_SHAPES.has(shape);
}

/**
 * Marker diameter at ratio `t` through `[min, max]` such that the marker area grows linearly with `t`.
 * The endpoints are exact, and a collapsed or inverted range resolves to `min`.
 */
export function areaSizeAtRatio(t: number, min: number, max: number): number {
    if (t <= 0 || max <= min) return min;
    if (t >= 1) return max;
    return Math.sqrt(min * min + t * (max * max - min * min));
}

/**
 * Re-maps a size that is linear in the value over `[min, max]` according to `sizeMode`.
 * In `'area'` mode the returned diameter makes the marker area linear in the value instead.
 */
export function applySizeMode(linearSize: number, min: number, max: number, sizeMode: AgMarkerSizeMode): number {
    if (sizeMode !== 'area' || max <= min) return linearSize;
    return areaSizeAtRatio((linearSize - min) / (max - min), min, max);
}
