import { getWindow } from '../../draw/draw-utils';
import { hasConstrainedCanvasMemory } from '../../util/userAgent';
import { HdpiCanvas } from './hdpiCanvas';

// Work-around for typing issues with Angular 13+ (see AG-6969),
type OffscreenCanvasRenderingContext2D = any;
type OffscreenCanvas = any;

interface OffscreenCanvasOptions {
    width: number;
    height: number;
    overrideDevicePixelRatio?: number;
}

/**
 * Wraps a native OffscreenCanvas and overrides its OffscreenCanvasRenderingContext2D to
 * provide resolution independent rendering based on `window.devicePixelRatio`.
 */
export class HdpiOffscreenCanvas {
    readonly context: OffscreenCanvasRenderingContext2D & { verifyDepthZero?: () => void };
    readonly canvas: OffscreenCanvas;
    imageSource: ImageBitmap;

    enabled: boolean = true;

    static isSupported() {
        return typeof OffscreenCanvas !== 'undefined' && OffscreenCanvas.prototype.transferToImageBitmap != null;
    }

    constructor({ width = 600, height = 300, overrideDevicePixelRatio }: OffscreenCanvasOptions) {
        this.canvas = new OffscreenCanvas(width, height);
        this.context = this.canvas.getContext('2d')!;
        this.imageSource = this.canvas.transferToImageBitmap();

        this._pixelRatio = hasConstrainedCanvasMemory() ? 1 : overrideDevicePixelRatio ?? getWindow('devicePixelRatio');
        HdpiCanvas.debugContext(this.context);
        this.resize(width, height);
    }

    snapshot() {
        this.imageSource.close();
        this.imageSource = this.canvas.transferToImageBitmap();
    }

    destroy() {
        this.imageSource.close();

        // Workaround memory allocation quirks in iOS Safari by resizing to 0x0 and clearing.
        // See https://bugs.webkit.org/show_bug.cgi?id=195325.
        this.canvas.width = 0;
        this.canvas.height = 0;
        this.context.clearRect(0, 0, 0, 0);
    }

    clear() {
        this.context.save();
        this.context.setTransform(this._pixelRatio, 0, 0, this._pixelRatio, 0, 0);
        this.context.clearRect(0, 0, this.width, this.height);
        this.context.restore();
    }

    // `NaN` is deliberate here, so that overrides are always applied
    // and the `resetTransform` inside the `resize` method works in IE11.
    _pixelRatio: number = NaN;
    get pixelRatio(): number {
        return this._pixelRatio;
    }

    private _width: number = 0;
    get width(): number {
        return this._width;
    }

    private _height: number = 0;
    get height(): number {
        return this._height;
    }

    resize(width: number, height: number) {
        if (!(width > 0 && height > 0)) {
            return;
        }
        const { canvas, context, pixelRatio } = this;
        canvas.width = Math.round(width * pixelRatio);
        canvas.height = Math.round(height * pixelRatio);
        context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

        this._width = width;
        this._height = height;
    }
}
