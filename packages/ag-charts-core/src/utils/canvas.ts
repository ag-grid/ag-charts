import { getDocument, getOffscreenCanvas } from './dom/globalsProxy';

// Firefox resolves the `system-ui`/`-apple-system` font keywords against the document, so a
// document-less OffscreenCanvas reports narrower text metrics than the same font renders at.
export function createCanvasContext(width = 0, height = 0): CanvasRenderingContext2D {
    const canvasElement = getDocument()?.createElement('canvas');
    if (canvasElement) {
        canvasElement.width = width;
        canvasElement.height = height;
        return canvasElement.getContext('2d')!;
    }

    const OffscreenCanvasCtor = getOffscreenCanvas();
    return new OffscreenCanvasCtor(width, height).getContext('2d') as unknown as CanvasRenderingContext2D;
}
