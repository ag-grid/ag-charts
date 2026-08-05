import { Canvas } from 'skia-canvas';
import { afterEach, beforeEach } from 'vitest';

import { resetIds } from 'ag-charts-core';
import { CANVAS_HEIGHT, CANVAS_WIDTH, mockCanvas } from 'ag-charts-test';

export { CANVAS_HEIGHT, CANVAS_WIDTH, toMatchImage, mockCanvas } from 'ag-charts-test';

const { extractImageData, CANVAS_TO_BUFFER_DEFAULTS } = mockCanvas;
export { extractImageData, CANVAS_TO_BUFFER_DEFAULTS };

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
