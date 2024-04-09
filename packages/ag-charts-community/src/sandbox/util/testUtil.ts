import { Canvas, PngConfig, createCanvas } from 'canvas';

import { mockCanvas } from 'ag-charts-test';

import { getDocument } from '../../util/dom';
import { AgCharts } from '../agCharts';
import type { AgChartOptions } from '../types/agChartsTypes';
import type { Box } from '../types/commonTypes';
import type { TestInstance } from '../types/testTypes';
import { mapValues } from './object';

export const CanvasWidth = 800;
export const CanvasHeight = 600;
export const CanvasToBufferDefaults: PngConfig = { compressionLevel: 6, filters: Canvas.prototype.PNG_NO_FILTERS };

export function createTestInstance<T extends AgChartOptions>(options: T) {
    options.container ??= getDocument('body');
    options.width ??= CanvasWidth;
    options.height ??= CanvasHeight;

    return AgCharts.create(options) as unknown as TestInstance<T>;
}

export function setupMockCanvas(width = CanvasWidth, height = CanvasHeight) {
    const mockCtx = new mockCanvas.MockContext(width, height, getDocument());

    beforeEach(() => {
        mockCanvas.setup({ mockCtx, width, height, mockText: true });
    });

    afterEach(() => {
        mockCanvas.teardown(mockCtx);
    });

    return mockCtx.ctx;
}

export function extractImageData({ nodeCanvas }: mockCanvas.MockContext['ctx'], bbox?: Box) {
    let sourceCanvas = nodeCanvas;

    if (bbox) {
        const { x, y, width, height } = mapValues(bbox, Math.round);
        sourceCanvas = createCanvas(width, height);
        sourceCanvas.getContext('2d').drawImage(nodeCanvas, x, y, width, height, 0, 0, width, height);
    }

    return sourceCanvas?.toBuffer('image/png', CanvasToBufferDefaults);
}
