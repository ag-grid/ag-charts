import { clearContext, debugContext } from './canvasUtil';

// Work-around for typing issues with Angular 13+ (see AG-6969),
type OffscreenCanvasRenderingContext2D = any;

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
        this.canvas = new OffscreenCanvas(canvasWidth, canvasHeight);

        this.context = this.canvas.getContext('2d', { willReadFrequently })!;
        this.context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

        debugContext(this.context);
    }

    drawImage(context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, dx = 0, dy = 0) {
        return context.drawImage(this.canvas, dx, dy);
    }

    transferToImageBitmap(): ImageBitmap {
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
