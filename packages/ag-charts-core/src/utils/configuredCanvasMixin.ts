/** Type representing a constructor function. */
export type Constructor<T> = new (...args: any[]) => T;

/**
 * Minimal interface for what a Canvas-like class must provide.
 * This allows the mixin to work with any canvas implementation (e.g., skia-canvas).
 * Uses loose typing to accommodate different canvas implementations.
 */
export interface CanvasLike {
    width: number;
    height: number;
    gpu: boolean;
    getContext(type: '2d'): unknown;
    toBuffer(format: string, options?: { quality?: number; msaa?: boolean }): Promise<Uint8Array>;
    toDataURLSync?(mimeType: string): string;
}

/** Default canvas width for test/SSR rendering. */
export const CANVAS_WIDTH = 800;

/** Default canvas height for test/SSR rendering. */
export const CANVAS_HEIGHT = 600;

/** Default buffer options for consistent rendering output. */
export const CANVAS_TO_BUFFER_DEFAULTS = { quality: 1 };

/**
 * Mixin that configures a Canvas class for consistent SSR/test rendering.
 * Disables GPU acceleration and MSAA for deterministic output.
 *
 * Usage:
 * ```typescript
 * import { Canvas } from 'skia-canvas';
 * import { ConfiguredCanvasMixin } from 'ag-charts-core';
 *
 * export const ConfiguredCanvas = ConfiguredCanvasMixin(Canvas);
 * ```
 */
export function ConfiguredCanvasMixin<T extends Constructor<CanvasLike>>(Base: T) {
    const ConfiguredCanvasClass = class ConfiguredCanvas extends Base {
        constructor(...args: any[]) {
            super(...args);
            this.gpu = false;
        }

        override toBuffer(format: string, options?: { quality?: number; msaa?: boolean }): Promise<Uint8Array> {
            return super.toBuffer(format, { ...options, msaa: false });
        }

        transferToImageBitmap(): CanvasLike {
            const { width, height } = this;
            const bitmap = new ConfiguredCanvasClass(Math.max(1, width), Math.max(1, height));
            if (width > 0 && height > 0) {
                (bitmap.getContext('2d') as any).drawCanvas(this, 0, 0, width, height);
            }
            Object.defineProperty(bitmap, 'close', {
                value: () => {},
            });
            return bitmap;
        }
    };
    return ConfiguredCanvasClass;
}

let patchesApplied = false;

/**
 * Apply skia-canvas patches for consistent rendering.
 * Call once at module initialization in consuming packages.
 *
 * Patches:
 * - createConicGradient: Fixes angle offset (https://github.com/samizdatco/skia-canvas/issues/241)
 * - fillText: Uses path-based text rendering for consistent output
 *
 * Usage:
 * ```typescript
 * import * as SkiaCanvas from 'skia-canvas';
 * import { DOMMatrix } from 'skia-canvas';
 * import { applySkiaPatches } from 'ag-charts-core';
 *
 * applySkiaPatches(SkiaCanvas.CanvasRenderingContext2D, DOMMatrix);
 * ```
 */
export function applySkiaPatches(CanvasRenderingContext2D: any, DOMMatrix: any) {
    if (patchesApplied) return;
    patchesApplied = true;

    const superCreateConicGradient = CanvasRenderingContext2D.prototype.createConicGradient;
    Object.defineProperty(CanvasRenderingContext2D.prototype, 'createConicGradient', {
        value: function (this: CanvasRenderingContext2D, angle: number, x: number, y: number) {
            return superCreateConicGradient.call(this, angle + Math.PI / 2, x, y);
        },
        writable: true,
        configurable: true,
    });

    Object.defineProperty(CanvasRenderingContext2D.prototype, 'fillText', {
        value: function (this: CanvasRenderingContext2D, text: string, x: number, y: number) {
            // @ts-expect-error Skia-canvas specific API
            let path2d = this.outlineText(text);
            path2d = path2d.transform(new DOMMatrix([1, 0, 0, 1, x, y]));
            this.fill(path2d);
        },
        writable: true,
        configurable: true,
    });
}
