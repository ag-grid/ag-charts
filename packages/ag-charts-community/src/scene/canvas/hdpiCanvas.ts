import { Debug } from '../../util/debug';
import { createElement, getWindow } from '../../util/dom';
import { ObserveChanges } from '../../util/proxy';
import { hasConstrainedCanvasMemory } from '../../util/userAgent';

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
export class HdpiCanvas {
    static is(value: unknown): value is HdpiCanvas {
        return value instanceof HdpiCanvas;
    }

    readonly element: HTMLCanvasElement;
    readonly context: CanvasRenderingContext2D & { verifyDepthZero?: () => void };

    @ObserveChanges<HdpiCanvas>((target) => target.onEnabledChange())
    enabled: boolean = true;

    width: number = 600;
    height: number = 300;
    pixelRatio: number;

    constructor(options: CanvasOptions) {
        const { width, height, pixelRatio, canvasElement, willReadFrequently = false } = options;

        this.pixelRatio = hasConstrainedCanvasMemory() ? 1 : pixelRatio ?? getWindow('devicePixelRatio');

        // Create canvas and immediately apply width + height to avoid out-of-memory errors on iOS/iPadOS Safari.
        this.element = canvasElement ?? createElement('canvas');
        // Safari needs a width and height set before calling getContext or the output can appear blurry
        // Must also be `display: block` so the height doesn't get increased by `inline-block` layout
        this.element.style.display = 'block';
        this.element.style.width = (width ?? this.width) + 'px';
        this.element.style.height = (height ?? this.height) + 'px';
        this.element.width = Math.round((width ?? this.width) * this.pixelRatio);
        this.element.height = Math.round((height ?? this.height) * this.pixelRatio);

        this.context = this.element.getContext('2d', { willReadFrequently })!;

        this.onEnabledChange(); // Force `display: block` style
        this.resize(width ?? 0, height ?? 0);

        HdpiCanvas.debugContext(this.context);
    }

    drawImage(context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, dx = 0, dy = 0) {
        return context.drawImage(this.context.canvas, dx, dy);
    }

    toDataURL(type?: string): string {
        return this.element.toDataURL(type);
    }

    resize(width: number, height: number) {
        if (!(width > 0 && height > 0)) return;

        const { element, context, pixelRatio } = this;
        element.width = Math.round(width * pixelRatio);
        element.height = Math.round(height * pixelRatio);
        context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

        element.style.width = width + 'px';
        element.style.height = height + 'px';

        this.width = width;
        this.height = height;
    }

    clear() {
        this.context.save();
        this.context.setTransform(this.pixelRatio, 0, 0, this.pixelRatio, 0, 0);
        this.context.clearRect(0, 0, this.width, this.height);
        this.context.restore();
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

    private onEnabledChange() {
        if (this.element) {
            this.element.style.display = this.enabled ? '' : 'none';
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
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
