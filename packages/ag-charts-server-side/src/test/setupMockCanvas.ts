import type { ExportFormat } from 'skia-canvas';
import { Image } from 'skia-canvas';

import { NodeCanvas } from '../canvas-config';
import { CANVAS_HEIGHT, CANVAS_WIDTH } from './constants';

export interface MockCanvasContext {
    nodeCanvas: NodeCanvas;
    snapshot: () => ImageData;
    getRenderContext2D: () => CanvasRenderingContext2D;
}

/** Document with overridable createElement for mock canvas injection */
interface MockableDocument extends Document {
    createElement: (tagName: string, options?: ElementCreationOptions) => HTMLElement;
}

interface MockContextState {
    canvas: NodeCanvas;
    realCreateElement: Document['createElement'];
}

let mockState: MockContextState | null = null;

export function setupMockCanvas(opts: { width?: number; height?: number } = {}): MockCanvasContext {
    const { width = CANVAS_WIDTH, height = CANVAS_HEIGHT } = opts;

    const canvas = new NodeCanvas(width, height);

    beforeEach(() => {
        // Store original createElement
        mockState = {
            canvas,
            realCreateElement: document.createElement.bind(document),
        };

        // Patch document.createElement
        const doc = document as MockableDocument;
        doc.createElement = (tag: string, options?: ElementCreationOptions): HTMLElement => {
            if (tag === 'canvas') {
                const mockElement = mockState!.realCreateElement.call(document, tag, options) as HTMLCanvasElement;

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
            return mockState!.realCreateElement.call(document, tag, options);
        };
    });

    afterEach(() => {
        if (mockState) {
            (document as MockableDocument).createElement = mockState.realCreateElement;
            mockState = null;
        }
    });

    return {
        nodeCanvas: canvas,
        snapshot: () => {
            const ctx = canvas.getContext('2d');
            return ctx.getImageData(0, 0, width, height);
        },
        getRenderContext2D: () => canvas.getContext('2d') as unknown as CanvasRenderingContext2D,
    };
}
