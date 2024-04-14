import { Canvas, PngConfig, createCanvas } from 'canvas';
import type { MatchImageSnapshotOptions } from 'jest-image-snapshot';

import { mockCanvas } from 'ag-charts-test';

import { getDocument } from '../../util/dom';
import { AgCharts, type ChartInstance } from '../agCharts';
import type { AgChartOptions, IChart, IChartOptions } from '../chart/chartTypes';
import type { IStage } from '../drawing/drawingTypes';
import type { Frame } from '../types/commonTypes';
import { mapValues } from './object';

export interface TestInstance<T extends AgChartOptions> extends Omit<ChartInstance<T>, 'chart' | 'options' | 'scene'> {
    chart: IChart<T>;
    options: IChartOptions<T>;
    stage: IStage;
}

const CanvasWidth = 800;
const CanvasHeight = 600;
const CanvasToBufferDefaults: PngConfig = { compressionLevel: 6, filters: Canvas.prototype.PNG_NO_FILTERS };
const SnapshotFailureThreshold = Number(process.env.SNAPSHOT_FAILURE_THRESHOLD ?? 0);

export function createTestInstance<T extends AgChartOptions>(options: T) {
    options.container ??= getDocument('body');
    options.width ??= CanvasWidth;
    options.height ??= CanvasHeight;

    return AgCharts.create(options) as unknown as TestInstance<T>;
}

export function setupMockCanvas(width = CanvasWidth, height = CanvasHeight) {
    const mockCtx = new mockCanvas.MockContext(width, height, getDocument());

    beforeEach(() => {
        mockCanvas.setup({ mockCtx, width, height, document: getDocument(), mockText: true });
    });

    afterEach(() => {
        mockCanvas.teardown(mockCtx);
    });

    return mockCtx.ctx;
}

export function expectCanvasToMatchImageSnapshot(
    ctx: mockCanvas.MockContext['ctx'],
    options?: MatchImageSnapshotOptions,
    bbox?: Frame
) {
    const imageData = extractImageData(ctx, bbox);
    expect(imageData).toMatchImageSnapshot({
        failureThreshold: SnapshotFailureThreshold,
        failureThresholdType: 'percent',
        ...options,
    });
}

export function extractImageData({ nodeCanvas }: mockCanvas.MockContext['ctx'], bbox?: Frame) {
    let sourceCanvas = nodeCanvas;

    if (bbox) {
        const { x, y, width, height } = mapValues(bbox, Math.round);
        sourceCanvas = createCanvas(width, height);
        sourceCanvas.getContext('2d').drawImage(nodeCanvas, x, y, width, height, 0, 0, width, height);
    }

    return sourceCanvas?.toBuffer('image/png', CanvasToBufferDefaults);
}
