import { getWindow } from '../../util/dom';
import { hasConstrainedCanvasMemory } from '../../util/userAgent';
import { HdpiCanvas } from './hdpiCanvas';

// Work-around for typing issues with Angular 13+ (see AG-6969),
type OffscreenCanvasRenderingContext2D = any;
type OffscreenCanvas = any;

interface OffscreenCanvasOptions {
    width?: number;
    height?: number;
    pixelRatio?: number;
}

/**
 * Wraps a native OffscreenCanvas and overrides its OffscreenCanvasRenderingContext2D to
 * provide resolution independent rendering based on `window.devicePixelRatio`.
 */
export class HdpiOffscreenCanvas {
    readonly context: OffscreenCanvasRenderingContext2D & { verifyDepthZero?: () => void };
    readonly canvas: OffscreenCanvas;

    protected imageSource: ImageBitmap;

    enabled: boolean = true;

    width: number = 0;
    height: number = 0;
    pixelRatio: number;

    static isSupported() {
        return (
            typeof OffscreenCanvas !== 'undefined' &&
            Object.getPrototypeOf(OffscreenCanvas).transferToImageBitmap != null
        );
    }

    constructor({ width = 600, height = 300, pixelRatio }: OffscreenCanvasOptions) {
        this.canvas = new OffscreenCanvas(width, height);
        this.context = this.canvas.getContext('2d')!;
        this.imageSource = this.canvas.transferToImageBitmap();
        this.pixelRatio = hasConstrainedCanvasMemory() ? 1 : pixelRatio ?? getWindow('devicePixelRatio');

        this.resize(width, height);

        HdpiCanvas.debugContext(this.context);
    }

    drawImage(context: CanvasRenderingContext2D, dx = 0, dy = 0) {
        return context.drawImage(this.imageSource, dx, dy);
    }

    resize(width: number, height: number) {
        if (!(width > 0 && height > 0)) {
            return;
        }
        const { canvas, context, pixelRatio } = this;
        canvas.width = Math.round(width * pixelRatio);
        canvas.height = Math.round(height * pixelRatio);
        context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

        this.width = width;
        this.height = height;
    }

    snapshot() {
        this.imageSource.close();
        this.imageSource = this.canvas.transferToImageBitmap();
    }

    clear() {
        this.context.save();
        this.context.setTransform(this.pixelRatio, 0, 0, this.pixelRatio, 0, 0);
        this.context.clearRect(0, 0, this.width, this.height);
        this.context.restore();
    }

    destroy() {
        this.imageSource.close();

        // Workaround memory allocation quirks in iOS Safari by resizing to 0x0 and clearing.
        // See https://bugs.webkit.org/show_bug.cgi?id=195325.
        this.canvas.width = 0;
        this.canvas.height = 0;
        this.context.clearRect(0, 0, 0, 0);
    }
}
