import { Debug } from '../../util/debug';
import { createElement, getWindow } from '../../util/dom';
import { hasConstrainedCanvasMemory } from '../../util/userAgent';

export type Size = { width: number; height: number };

// Work-around for typing issues with Angular 13+ (see AG-6969),
type OffscreenCanvasRenderingContext2D = any;

/**
 * Wraps the native Canvas element and overrides its CanvasRenderingContext2D to
 * provide resolution independent rendering based on `window.devicePixelRatio`.
 */
export class HdpiCanvas {
    readonly element: HTMLCanvasElement;
    readonly context: CanvasRenderingContext2D & { verifyDepthZero?: () => void };
    readonly imageSource: HTMLCanvasElement;

    constructor(opts: {
        width?: number;
        height?: number;
        domLayer?: boolean;
        zIndex?: number;
        name?: string;
        overrideDevicePixelRatio?: number;
    }) {
        const { width = 600, height = 300, zIndex = 0, domLayer, name, overrideDevicePixelRatio } = opts;

        // Create canvas and immediately apply width + height to avoid out-of-memory
        // errors on iOS/iPadOS Safari.
        this.element = createElement('canvas');
        this.element.width = width;
        this.element.height = height;

        this.context = this.element.getContext('2d')!;
        this.imageSource = this.context.canvas;

        const { style } = this.element;

        style.userSelect = 'none';
        style.display = 'block';

        if (domLayer) {
            style.position = 'absolute';
            style.zIndex = String(zIndex);
            style.top = '0';
            style.left = '0';
            style.pointerEvents = 'none';
            style.opacity = `1`;
            if (name) {
                this.element.id = name;
            }
        }

        this._pixelRatio = hasConstrainedCanvasMemory() ? 1 : overrideDevicePixelRatio ?? getWindow('devicePixelRatio');
        HdpiCanvas.debugContext(this.context);
        this.resize(width, height);
    }

    private _container?: HTMLElement;
    set container(value: HTMLElement | undefined) {
        if (this._container !== value) {
            this.remove();

            if (value) {
                value.appendChild(this.element);
            }

            this._container = value;
        }
    }
    get container(): HTMLElement | undefined {
        return this._container;
    }

    private _enabled: boolean = true;
    set enabled(value: boolean) {
        this.element.style.display = value ? 'block' : 'none';
        this._enabled = Boolean(value);
    }
    get enabled() {
        return this._enabled;
    }

    private remove() {
        const { parentNode } = this.element;

        if (parentNode != null) {
            parentNode.removeChild(this.element);
        }
    }

    destroy() {
        this.element.remove();

        // Workaround memory allocation quirks in iOS Safari by resizing to 0x0 and clearing.
        // See https://bugs.webkit.org/show_bug.cgi?id=195325.
        this.element.width = 0;
        this.element.height = 0;
        this.context.clearRect(0, 0, 0, 0);

        Object.freeze(this);
    }

    snapshot() {
        // No-op for compatibility with HdpiOffscreenCanvas.
    }

    clear() {
        this.context.save();
        this.context.setTransform(this._pixelRatio, 0, 0, this._pixelRatio, 0, 0);
        this.context.clearRect(0, 0, this.width, this.height);
        this.context.restore();
    }

    getDataURL(type?: string): string {
        return this.element.toDataURL(type);
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
        const { element, context, pixelRatio } = this;
        element.width = Math.round(width * pixelRatio);
        element.height = Math.round(height * pixelRatio);
        element.style.width = width + 'px';
        element.style.height = height + 'px';
        context.setTransform(this._pixelRatio, 0, 0, this._pixelRatio, 0, 0);

        this._width = width;
        this._height = height;
    }

    // 2D canvas context used for measuring text.
    private static _textMeasuringContext?: CanvasRenderingContext2D;
    private static get textMeasuringContext(): CanvasRenderingContext2D {
        if (this._textMeasuringContext) {
            return this._textMeasuringContext;
        }
        const canvas = createElement('canvas');
        this._textMeasuringContext = canvas.getContext('2d')!;
        return this._textMeasuringContext;
    }

    static measureText(
        text: string,
        font: string,
        textBaseline: CanvasTextBaseline,
        textAlign: CanvasTextAlign
    ): TextMetrics {
        const ctx = this.textMeasuringContext;
        ctx.font = font;
        ctx.textBaseline = textBaseline;
        ctx.textAlign = textAlign;
        return ctx.measureText(text);
    }

    /**
     * Returns the width and height of the measured text.
     * @param text The single-line text to measure.
     * @param font The font shorthand string.
     */
    static getTextSize(text: string, font: string): Size {
        const ctx = this.textMeasuringContext;
        ctx.font = font;
        const metrics = ctx.measureText(text);

        return {
            width: metrics.width,
            height: metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent,
        };
    }

    static debugContext(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D) {
        if (Debug.check('canvas')) {
            const save = ctx.save.bind(ctx);
            const restore = ctx.restore.bind(ctx);
            let depth = 0;
            Object.assign(ctx, {
                save() {
                    save();
                    depth++;
                },
                restore() {
                    if (depth === 0) {
                        throw new Error('AG Charts - Unable to restore() past depth 0');
                    }
                    restore();
                    depth--;
                },
                verifyDepthZero() {
                    if (depth !== 0) {
                        throw new Error(`AG Charts - Save/restore depth is non-zero: ${depth}`);
                    }
                },
            });
        }
    }
}
