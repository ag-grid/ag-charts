import * as SkiaCanvas from 'skia-canvas';
import { Canvas, DOMMatrix } from 'skia-canvas';

import { ConfiguredCanvasMixin, applySkiaPatches as applyCoreSkiaPatches } from 'ag-charts-core';

// skia-canvas exports CanvasRenderingContext2D as a class but TypeScript types don't reflect this
const { CanvasRenderingContext2D } = SkiaCanvas as typeof SkiaCanvas & {
    CanvasRenderingContext2D: { prototype: CanvasRenderingContext2D & { outlineText(text: string): Path2D } };
};

// Create configured canvas class using the mixin
const NodeCanvasClass = ConfiguredCanvasMixin(Canvas);
export const NodeCanvas = NodeCanvasClass;
// Export type for use in type annotations (declaration merging)
export type NodeCanvas = InstanceType<typeof NodeCanvasClass>;

// Apply patches on module load to fix skia-canvas rendering bugs. The patches modify
// skia-canvas's CanvasRenderingContext2D prototype (not browser APIs), are guarded
// against multiple applications, and are necessary for correct SSR chart rendering.
applyCoreSkiaPatches(CanvasRenderingContext2D, DOMMatrix);
