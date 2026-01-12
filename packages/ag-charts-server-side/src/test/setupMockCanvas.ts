import { ExportFormat, Image } from 'skia-canvas';

import { NodeCanvas } from '../canvas-config';
import { CANVAS_HEIGHT, CANVAS_WIDTH } from './constants';

export interface MockCanvasContext {
    nodeCanvas: NodeCanvas;
    snapshot: () => ImageData;
    getRenderContext2D: () => CanvasRenderingContext2D;
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

        // Setup global canvas mocking
        (globalThis as any).agChartsSceneRenderModel = 'composite';

        // Patch document.createElement
        (document as any).createElement = (tag: string, options?: any) => {
            if (tag === 'canvas') {
                const mockElement = mockState!.realCreateElement.call(document, tag, options) as HTMLCanvasElement;

                const originalGetContext = mockElement.getContext.bind(mockElement);
                (mockElement as any).getContext = (type: string, _attrs?: any) => {
                    if (type === '2d') {
                        return canvas.getContext('2d');
                    }
                    return originalGetContext(type);
                };

                (mockElement as any).toDataURL = (mimeType = 'image/png') => {
                    return canvas.toDataURLSync(mimeType.split('/')[1] as ExportFormat);
                };

                return mockElement;
            }
            if (tag === 'img') {
                return new Image();
            }
            return mockState!.realCreateElement.call(document, tag, options);
        };
    });

    afterEach(() => {
        if (mockState) {
            (document as any).createElement = mockState.realCreateElement;
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
