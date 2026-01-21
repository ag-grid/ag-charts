import { getOffscreenCanvas } from 'ag-charts-core';

import { clearContext, debugContext } from './canvasUtil';

interface CanvasOptions {
    width: number;
    height: number;
    pixelRatio: number;
    willReadFrequently?: boolean;
    canvasElement?: HTMLCanvasElement;
}

function canvasDimensions(width: number, height: number, pixelRatio: number) {
    return [Math.floor(width * pixelRatio), Math.floor(height * pixelRatio)] as const;
}

let fallbackCanvas: OffscreenCanvas | undefined;
function getFallbackCanvas(): OffscreenCanvas {
    const OffscreenCanvasCtor = getOffscreenCanvas();
    fallbackCanvas ??= new OffscreenCanvasCtor(1, 1);
    return fallbackCanvas;
}

/**
 * Wraps the native Canvas element and overrides its CanvasRenderingContext2D to
 * provide resolution independent rendering based on `window.devicePixelRatio`.
 */
export class HdpiOffscreenCanvas {
    readonly canvas: OffscreenCanvas;
    readonly context: OffscreenCanvasRenderingContext2D & { verifyDepthZero?: () => void };

    width: number;
    height: number;
    pixelRatio: number;

    constructor(options: CanvasOptions) {
        const { width, height, pixelRatio, willReadFrequently = false } = options;

        this.width = width;
        this.height = height;
        this.pixelRatio = pixelRatio;

        const [canvasWidth, canvasHeight] = canvasDimensions(width, height, pixelRatio);
        const OffscreenCanvasCtor = getOffscreenCanvas();
        this.canvas = new OffscreenCanvasCtor(canvasWidth, canvasHeight);

        this.context = this.canvas.getContext('2d', { willReadFrequently })!;
        this.context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

        debugContext(this.context);
    }

    drawImage(context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, dx = 0, dy = 0) {
        return context.drawImage(this.canvas, dx, dy);
    }

    transferToImageBitmap(): ImageBitmap {
        // Return fallback for invalid dimensions to prevent rendering errors
        if (this.canvas.width < 1 || this.canvas.height < 1) {
            return getFallbackCanvas().transferToImageBitmap();
        }
        return this.canvas.transferToImageBitmap();
    }

    resize(width: number, height: number, pixelRatio: number) {
        if (!(width > 0 && height > 0)) return;

        const { canvas, context } = this;
        if (width !== this.width || height !== this.height || pixelRatio !== this.pixelRatio) {
            const [canvasWidth, canvasHeight] = canvasDimensions(width, height, pixelRatio);
            canvas.width = canvasWidth;
            canvas.height = canvasHeight;
        }
        context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

        this.width = width;
        this.height = height;
        this.pixelRatio = pixelRatio;
    }

    clear() {
        clearContext(this);
    }

    destroy() {
        // Workaround memory allocation quirks in iOS Safari by resizing to 0x0 and clearing.
        // See https://bugs.webkit.org/show_bug.cgi?id=195325.
        this.canvas.width = 0;
        this.canvas.height = 0;
        this.context.clearRect(0, 0, 0, 0);

        (this as any).canvas = null!;
        (this as any).context = null!;

        Object.freeze(this);
    }
}
