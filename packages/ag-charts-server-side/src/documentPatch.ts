import type { ExportFormat } from 'skia-canvas';
import { Image } from 'skia-canvas';

import type { NodeCanvasInstance } from './canvasConfig';

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
    const doc = document as MockableDocument;
    const realCreateElement = doc.createElement.bind(doc);

    doc.createElement = (tag: string, opts?: ElementCreationOptions): HTMLElement => {
        if (tag === 'canvas') {
            const canvas = options.getCanvas();
            const mockElement = realCreateElement(tag, opts) as HTMLCanvasElement;

            const originalGetContext = mockElement.getContext.bind(mockElement);
            Object.defineProperty(mockElement, 'getContext', {
                value: (contextId: string, _options?: unknown) => {
                    if (contextId === '2d') {
                        return canvas.getContext('2d');
                    }
                    return originalGetContext(contextId as '2d');
                },
                writable: true,
                configurable: true,
            });

            Object.defineProperty(mockElement, 'toDataURL', {
                value: (mimeType = 'image/png') => {
                    return canvas.toDataURLSync(mimeType.split('/')[1] as ExportFormat);
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
