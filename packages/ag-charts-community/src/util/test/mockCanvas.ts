import * as fs from 'fs';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import { Canvas } from 'skia-canvas';

import { resetIds } from 'ag-charts-core';
import { mockCanvas } from 'ag-charts-test';

export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 600;
export const CANVAS_TO_BUFFER_DEFAULTS = { quality: 1 };

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

        sourceCanvas = new Canvas(width, height);
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

export function toMatchImage(this: any, actual: Buffer, expected: Buffer, { writeDiff = true } = {}) {
    // Grab values from enclosing Jest scope.
    const { testPath, currentTestName } = this;

    const width = CANVAS_WIDTH;
    const height = CANVAS_HEIGHT;
    const diff = new PNG({ width, height });
    const result = pixelmatch(actual, expected, diff.data, width, height, { threshold: 0.01 });

    const diffOutputFilename = `${testPath.substring(
        0,
        testPath.lastIndexOf('/')
    )}/__image_snapshots__/${currentTestName}-diff.png`;
    const diffPercentage = (result * 100) / (width * height);
    const pass = diffPercentage <= 0.05;

    if (!pass && writeDiff) {
        fs.writeFileSync(diffOutputFilename, PNG.sync.write(diff));
    } else if (fs.existsSync(diffOutputFilename)) {
        fs.unlinkSync(diffOutputFilename);
    }

    return { message: () => `Images were ${result} (${diffPercentage.toFixed(2)}%) pixels different`, pass };
}
