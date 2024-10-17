import { getWindow } from '../../util/dom';
import { hasConstrainedCanvasMemory } from '../../util/userAgent';
import { clearContext, debugContext } from './canvasUtil';

// Work-around for typing issues with Angular 13+ (see AG-6969),
type OffscreenCanvasRenderingContext2D = any;

export interface CanvasOptions {
    width?: number;
    height?: number;
    pixelRatio?: number;
    willReadFrequently?: boolean;
    canvasElement?: HTMLCanvasElement;
}

/**
 * Wraps the native Canvas element and overrides its CanvasRenderingContext2D to
 * provide resolution independent rendering based on `window.devicePixelRatio`.
 */
export class HdpiOffscreenCanvas {
    readonly canvas: OffscreenCanvas;
    readonly context: OffscreenCanvasRenderingContext2D & { verifyDepthZero?: () => void };

    width: number = 600;
    height: number = 300;
    pixelRatio: number;

    constructor(options: CanvasOptions) {
        const { width, height, pixelRatio, willReadFrequently = false } = options;

        this.pixelRatio = hasConstrainedCanvasMemory() ? 1 : pixelRatio ?? getWindow('devicePixelRatio');

        this.canvas = new OffscreenCanvas(width ?? this.width, height ?? this.height);

        this.context = this.canvas.getContext('2d', { willReadFrequently })!;

        this.resize(width ?? 0, height ?? 0);

        debugContext(this.context);
    }

    drawImage(context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, dx = 0, dy = 0) {
        return context.drawImage(this.context.canvas, dx, dy);
    }

    resize(width: number, height: number) {
        if (!(width > 0 && height > 0)) return;

        const { canvas, context, pixelRatio } = this;
        canvas.width = Math.round(width * pixelRatio);
        canvas.height = Math.round(height * pixelRatio);
        context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

        this.width = width;
        this.height = height;
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

        Object.freeze(this);
    }
}
