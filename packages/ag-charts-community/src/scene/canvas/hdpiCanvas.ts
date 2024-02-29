import { Debug } from '../../util/debug';
import { createElement, getWindow } from '../../util/dom';
import { ObserveChanges } from '../../util/proxy';
import { hasConstrainedCanvasMemory } from '../../util/userAgent';

// Work-around for typing issues with Angular 13+ (see AG-6969),
type OffscreenCanvasRenderingContext2D = any;

interface CanvasOptions {
    width?: number;
    height?: number;
    pixelRatio?: number;
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

    @ObserveChanges<HdpiCanvas>((target, newValue, oldValue) => target.onContainerChange(newValue, oldValue))
    container?: HTMLElement;

    width: number = 0;
    height: number = 0;
    pixelRatio: number;

    constructor(options: CanvasOptions) {
        const { width = 600, height = 300, pixelRatio } = options;

        // Create canvas and immediately apply width + height to avoid out-of-memory
        // errors on iOS/iPadOS Safari.
        this.element = createElement('canvas');
        this.element.width = width;
        this.element.height = height;

        this.context = this.element.getContext('2d')!;
        this.pixelRatio = hasConstrainedCanvasMemory() ? 1 : pixelRatio ?? getWindow('devicePixelRatio');

        this.onEnabledChange(); // Force `display: block` style
        this.resize(width, height);

        HdpiCanvas.debugContext(this.context);
    }

    drawImage(context: CanvasRenderingContext2D, dx = 0, dy = 0) {
        return context.drawImage(this.context.canvas, dx, dy);
    }

    toDataURL(type?: string): string {
        return this.element.toDataURL(type);
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
        context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

        this.width = width;
        this.height = height;
    }

    snapshot() {
        // No-op for compatibility with HdpiOffscreenCanvas.
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

    private onContainerChange(newValue?: HTMLElement, oldValue?: HTMLElement) {
        if (newValue !== oldValue) {
            this.element.parentNode?.removeChild(this.element);
            this.container?.appendChild(this.element);
        }
    }

    private onEnabledChange() {
        if (this.element) {
            this.element.style.display = this.enabled ? 'block' : 'none';
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
