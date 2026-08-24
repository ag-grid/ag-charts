import * as SkiaCanvas from 'skia-canvas';
import { Canvas, DOMMatrix } from 'skia-canvas';

import { ConfiguredCanvasMixin, applySkiaPatches as applyCoreSkiaPatches } from 'ag-charts-core';

// skia-canvas exports CanvasRenderingContext2D as a class but TypeScript types don't reflect this
const { CanvasRenderingContext2D } = SkiaCanvas as typeof SkiaCanvas & {
    CanvasRenderingContext2D: { prototype: CanvasRenderingContext2D & { outlineText(text: string): Path2D } };
};

export const NodeCanvas = ConfiguredCanvasMixin(Canvas);
export type NodeCanvasInstance = InstanceType<typeof NodeCanvas>;

// skia-canvas's own CanvasRenderingContext2D prototype (not a browser API) needs patching for correct
// SSR rendering; the patches are guarded against re-application.
applyCoreSkiaPatches(CanvasRenderingContext2D, DOMMatrix);
