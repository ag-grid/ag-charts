import { getOffscreenCanvas } from '../../dom/globalsProxy';

export interface SpreadCanvas {
    readonly canvas: OffscreenCanvas;
    readonly context: OffscreenCanvasRenderingContext2D;
}

const MIN_DIMENSION = 64;

const spreadCanvases = new WeakMap<object, Map<number, SpreadCanvas>>();

function bucket(dimension: number, max: number): number {
    return Math.min(Math.max(MIN_DIMENSION, 2 ** Math.ceil(Math.log2(dimension))), Math.max(max, dimension));
}

/**
 * The scratch canvas a shadow `spread` draws its dilated silhouette into. There is one per context (so per layer) and
 * size class, each created the first time a shape of that size is drawn on the context. A canvas that has just been
 * drawn from is copied whole when it is next drawn to, so a canvas as large as the layer would make every shape pay
 * for the layer.
 */
export function getSpreadCanvas(
    ctx: object,
    width: number,
    height: number,
    maxWidth: number,
    maxHeight: number
): SpreadCanvas {
    let sizes = spreadCanvases.get(ctx);
    if (sizes == null) {
        sizes = new Map();
        spreadCanvases.set(ctx, sizes);
    }

    const canvasWidth = bucket(width, maxWidth);
    const canvasHeight = bucket(height, maxHeight);
    const key = canvasWidth * 0x10000 + canvasHeight;
    let spreadCanvas = sizes.get(key);
    if (spreadCanvas == null) {
        const OffscreenCanvasCtor = getOffscreenCanvas();
        const canvas = new OffscreenCanvasCtor(canvasWidth, canvasHeight);
        spreadCanvas = { canvas, context: canvas.getContext('2d')! };
        sizes.set(key, spreadCanvas);
    }
    return spreadCanvas;
}

export function releaseSpreadCanvas(ctx: object) {
    const sizes = spreadCanvases.get(ctx);
    if (sizes == null) return;

    // Workaround memory allocation quirks in iOS Safari, as for the layer canvases.
    for (const { canvas } of sizes.values()) {
        canvas.width = 0;
        canvas.height = 0;
    }
    spreadCanvases.delete(ctx);
}
