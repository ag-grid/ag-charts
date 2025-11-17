/**
 * Canvas shim for legacy benchmark compatibility
 *
 * This shim provides a compatibility layer for the old 'canvas' package API
 * when running benchmarks against older release branches (e.g., b11.3.1)
 * that still import from 'canvas' instead of 'skia-canvas'.
 *
 * The shim re-exports skia-canvas types and provides legacy helpers:
 * - createCanvas() function
 * - PNG_NO_FILTERS constant
 * - toBuffer() method wrapper
 */

import {
    Canvas as SkiaCanvas,
    CanvasRenderingContext2D as SkiaCanvasRenderingContext2D,
    CanvasPattern as SkiaCanvasPattern,
    DOMMatrix as SkiaDOMMatrix,
    Image as SkiaImage,
    type ExportFormat,
    type RenderOptions,
} from 'skia-canvas';

// Re-export types and classes from skia-canvas
export { CanvasRenderingContext2D, CanvasPattern, DOMMatrix, Image } from 'skia-canvas';

// Legacy PngConfig type matching node-canvas API
export interface PngConfig {
    compressionLevel?: number;
    filters?: number;
    palette?: Uint8ClampedArray;
    backgroundIndex?: number;
    resolution?: number;
}

// PNG_NO_FILTERS constant (node-canvas used this as a static property)
// Value matches node-canvas PNG_NO_FILTERS = 0x00
export const PNG_NO_FILTERS = 0x00;

// Extend Canvas to add legacy methods and properties
class Canvas extends SkiaCanvas {
    // Add PNG_NO_FILTERS as both static and instance property for compatibility
    // Old code used: new Canvas(0, 0).PNG_NO_FILTERS
    static readonly PNG_NO_FILTERS = PNG_NO_FILTERS;
    readonly PNG_NO_FILTERS = PNG_NO_FILTERS;

    // Legacy toBuffer method that matches node-canvas API
    // node-canvas: toBuffer(mimeType: string, options?: PngConfig): Buffer
    // skia-canvas: toBufferSync(format: ExportFormat, options?: RenderOptions): Buffer
    toBuffer(mimeType: string = 'image/png', options?: PngConfig): Buffer {
        // Convert 'image/png' to 'png', 'image/jpeg' to 'jpg', etc.
        const formatMap: Record<string, ExportFormat> = {
            'image/png': 'png',
            'image/jpeg': 'jpg',
            'image/jpg': 'jpg',
        };

        const format = formatMap[mimeType] || 'png';

        // Convert PngConfig to RenderOptions
        const renderOptions: RenderOptions = {};
        if (options?.compressionLevel !== undefined) {
            // skia-canvas uses quality (0-1) instead of compressionLevel (0-9)
            // Approximate conversion: quality = 1 - (compressionLevel / 9)
            renderOptions.quality = 1 - options.compressionLevel / 9;
        }

        return this.toBufferSync(format, renderOptions);
    }
}

// Legacy createCanvas function matching node-canvas API
export function createCanvas(width: number, height: number): Canvas {
    return new Canvas(width, height);
}

// Export Canvas class
export { Canvas };

