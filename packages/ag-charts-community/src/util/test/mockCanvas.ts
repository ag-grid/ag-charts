import { Canvas } from 'skia-canvas';

import { resetIds } from 'ag-charts-core';
import { CANVAS_HEIGHT, CANVAS_WIDTH, mockCanvas } from 'ag-charts-test';

export const CANVAS_TO_BUFFER_DEFAULTS = { quality: 1 };

export { CANVAS_HEIGHT, CANVAS_WIDTH, toMatchImage } from 'ag-charts-test';

export function extractImageData({
    nodeCanvas,
    bbox,
}: {
    nodeCanvas: Canvas;
    bbox?: { x: number; y: number; width: number; height: number };
}) {
    let sourceCanvas = nodeCanvas;
    if (bbox && nodeCanvas) {
        const { x, y, width, height } = bbox;

        // Canvas must have a valid size, otherwise node-canvas fails.
        if (width < 0.5 || height < 0.5) {
            throw new Error('Invalid image size provided, dimensions must be greater than zero.');
        }

        sourceCanvas = new mockCanvas.ConfiguredCanvas(width, height);
        sourceCanvas
            ?.getContext('2d')
            .drawImage(
                nodeCanvas,
                Math.round(x),
                Math.round(y),
                Math.round(width),
                Math.round(height),
                0,
                0,
                Math.round(width),
                Math.round(height)
            );
    }

    return sourceCanvas?.toBufferSync('png', CANVAS_TO_BUFFER_DEFAULTS);
}

export function setupMockCanvas({ width = CANVAS_WIDTH, height = CANVAS_HEIGHT } = {}): {
    nodeCanvas: Canvas;
    snapshot: () => ImageData;
    getRenderContext2D: () => CanvasRenderingContext2D;
    getActiveCanvasInstances: () => Canvas[];
    getActiveOffscreenCanvasInstances: () => OffscreenCanvas[];
} {
    const mockCtx: mockCanvas.MockContext = new mockCanvas.MockContext(width, height, document);
    mockCtx.mockText = true;

    beforeEach(() => {
        resetIds();

        mockCanvas.setup(mockCtx);
    });

    afterEach(() => {
        mockCanvas.teardown(mockCtx);
    });

    return mockCtx.ctx;
}
