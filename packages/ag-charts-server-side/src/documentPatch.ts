import type { ExportFormat } from 'skia-canvas';
import { Image } from 'skia-canvas';

import { NodeCanvas, type NodeCanvasInstance } from './canvasConfig';

/** Document with overridable createElement for canvas injection */
export interface MockableDocument extends Document {
    createElement: (tagName: string, options?: ElementCreationOptions) => HTMLElement;
}

export interface DocumentPatchOptions {
    /** Factory function to get a canvas for each createElement('canvas') call */
    getCanvas: () => NodeCanvasInstance;
}

export interface DocumentPatchResult {
    /** Restore the original createElement */
    restore: () => void;
}

/**
 * Patches document.createElement to intercept 'canvas' and 'img' element creation,
 * redirecting them to skia-canvas implementations.
 */
export function patchDocumentCreateElement(document: Document, options: DocumentPatchOptions): DocumentPatchResult {
    const doc = document;
    const realCreateElement = doc.createElement.bind(doc);

    doc.createElement = (tag: string, opts?: ElementCreationOptions): HTMLElement => {
        if (tag === 'canvas') {
            const mockElement = realCreateElement(tag, opts);

            // Claimed on first use so the render canvas goes to a real render target: a zero-sized
            // canvas has no bitmap and is only ever scratch space for text measurement.
            let canvas: NodeCanvasInstance | undefined;
            const backing = (): NodeCanvasInstance => {
                canvas ??= mockElement.width > 0 && mockElement.height > 0 ? options.getCanvas() : new NodeCanvas(1, 1);
                return canvas;
            };

            const originalGetContext = mockElement.getContext.bind(mockElement);
            Object.defineProperty(mockElement, 'getContext', {
                value: (contextId: string, _options?: unknown) => {
                    if (contextId === '2d') {
                        return backing().getContext('2d');
                    }
                    return originalGetContext(contextId as '2d');
                },
                writable: true,
                configurable: true,
            });

            Object.defineProperty(mockElement, 'toDataURL', {
                value: (mimeType = 'image/png') => {
                    return backing().toDataURL(mimeType.split('/')[1] as ExportFormat);
                },
                writable: true,
                configurable: true,
            });

            return mockElement;
        }
        if (tag === 'img') {
            return new Image() as unknown as HTMLImageElement;
        }
        return realCreateElement(tag, opts);
    };

    return {
        restore: () => {
            doc.createElement = realCreateElement;
        },
    };
}
