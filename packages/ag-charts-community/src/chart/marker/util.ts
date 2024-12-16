import type { AgMarkerShape, AgMarkerShapeFn } from 'ag-charts-types';

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
