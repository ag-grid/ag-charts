import { expect, beforeEach, afterEach, jest } from '@jest/globals';
import type { PngConfig } from 'canvas';
import { Canvas, createCanvas } from 'canvas';
import * as pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import * as fs from 'fs';

import type {
    AgCartesianChartOptions,
    AgChartInstance,
    AgChartOptions,
    AgPolarChartOptions,
} from '../../options/agChartOptions';
import { _ModuleSupport, type _Scene } from '../../main';
import * as mockCanvas from './mock-canvas';
import type { IAnimation } from 'packages/ag-charts-community/src/animte/animation';

const { AnimationManager, resetIds } = _ModuleSupport;

type Chart = {
    autoSize: boolean;
    width: number;
    height: number;
    scene: _Scene.Scene;
    axes: { type: 'string' }[];
    series: { type: 'string' }[];
    waitForUpdate: (timeoutMs: number) => Promise<void>;
};

export interface TestCase {
    options: AgChartOptions;
    assertions: (chart: AgChartInstance) => Promise<void>;
    extraScreenshotActions?: (chart: AgChartInstance) => Promise<void>;
}

export interface CartesianTestCase extends TestCase {
    options: AgCartesianChartOptions;
}

export interface PolarTestCase extends TestCase {
    options: AgPolarChartOptions;
}

const FAILURE_THRESHOLD = Number(process.env.SNAPSHOT_FAILURE_THRESHOLD ?? 0.001);
export const IMAGE_SNAPSHOT_DEFAULTS = { failureThreshold: FAILURE_THRESHOLD, failureThresholdType: 'percent' };
export const CANVAS_TO_BUFFER_DEFAULTS: PngConfig = { compressionLevel: 6, filters: (Canvas as any).PNG_NO_FILTERS };

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

export function prepareTestOptions<T extends AgChartOptions>(options: T, container = document.body) {
    options.autoSize = false;
    options.width = CANVAS_WIDTH;
    options.height = CANVAS_HEIGHT;
    options.container = container;
    return options;
}

export function deproxy(chartOrProxy: Chart | AgChartInstance): Chart {
    const isChartInstance =
        chartOrProxy?.constructor?.name !== 'AgChartInstanceProxy' || (chartOrProxy as any)?.className != null;
    return isChartInstance ? (chartOrProxy as any) : (chartOrProxy as any).chart;
}

export function repeat<T>(value: T, count: number): T[] {
    const result = new Array(count);
    for (let idx = 0; idx < count; idx++) {
        result[idx] = value;
    }
    return result;
}

export function range(start: number, end: number, step = 1): number[] {
    const result = new Array(Math.floor((end - start) / step));

    let resultIndex = 0;
    for (let index = start; index <= end; index += step) {
        result[resultIndex++] = index;
    }

    return result;
}

export function dateRange(start: Date, end: Date, step = 24 * 60 * 60 * 1000): Date[] {
    const result: Date[] = [];

    let next = start.getTime();
    const endTime = end.getTime();
    while (next <= endTime) {
        result.push(new Date(next));

        next += step;
    }

    return result;
}

export async function waitForChartStability(chartOrProxy: Chart | AgChartInstance, timeoutMs = 5000): Promise<void> {
    const chart = deproxy(chartOrProxy);
    const chartAny = chart as any;
    await chart.waitForUpdate(timeoutMs);
    if (chart.autoSize === true && !chartAny._lastAutoSize) {
        // Bypass wait for SizeObservable callback - it's never going to be invoked.
        const width = chart.width ?? chart.scene.canvas.width;
        const height = chart.height ?? chart.scene.canvas.height;
        chartAny._lastAutoSize = [width, height];
        chartAny.resize(width, height);
        await chart.waitForUpdate(timeoutMs);
    }
}

export function mouseMoveEvent({ offsetX, offsetY }: { offsetX: number; offsetY: number }): MouseEvent {
    const event = new MouseEvent('mousemove', { bubbles: true } as any);
    Object.assign(event, { offsetX, offsetY, pageX: offsetX, pageY: offsetY });
    return event;
}

export function clickEvent({ offsetX, offsetY }: { offsetX: number; offsetY: number }): MouseEvent {
    const event = new MouseEvent('click', { bubbles: true } as any);
    Object.assign(event, { offsetX, offsetY, pageX: offsetX, pageY: offsetY });
    return event;
}

export function doubleClickEvent({ offsetX, offsetY }: { offsetX: number; offsetY: number }): MouseEvent {
    const event = new MouseEvent('dblclick', { bubbles: true } as any);
    Object.assign(event, { offsetX, offsetY, pageX: offsetX, pageY: offsetY });
    return event;
}

export function wheelEvent({
    clientX,
    clientY,
    deltaY,
}: {
    clientX: number;
    clientY: number;
    deltaY: number;
}): WheelEvent {
    return new WheelEvent('wheel', { bubbles: true, clientX, clientY, deltaY } as any);
}

export function cartesianChartAssertions(params?: { type?: string; axisTypes?: string[]; seriesTypes?: string[] }) {
    const { axisTypes = ['category', 'number'], seriesTypes = ['bar', 'bar'] } = params ?? {};

    return async (chartOrProxy: Chart | AgChartInstance) => {
        const chart = deproxy(chartOrProxy);
        expect(chart?.constructor?.name).toEqual('CartesianChart');
        expect(chart.axes).toHaveLength(axisTypes.length);
        expect(chart.axes.map((a) => a.type)).toEqual(axisTypes);
        expect(chart.series.map((s) => s.type)).toEqual(seriesTypes);
    };
}

export function polarChartAssertions(params?: { seriesTypes?: string[] }) {
    const { seriesTypes = ['pie'] } = params ?? {};

    return async (chartOrProxy: Chart | AgChartInstance) => {
        const chart = deproxy(chartOrProxy);
        expect(chart?.constructor?.name).toEqual('PolarChart');
        expect(chart.axes).toHaveLength(0);
        expect(chart.series.map((s) => s.type)).toEqual(seriesTypes);
    };
}

export function hierarchyChartAssertions(params?: { seriesTypes?: string[] }) {
    const { seriesTypes = ['treemap'] } = params ?? {};

    return async (chartOrProxy: Chart | AgChartInstance) => {
        const chart = deproxy(chartOrProxy);
        expect(chart?.constructor?.name).toEqual('HierarchyChart');
        expect(chart.axes).toHaveLength(0);
        expect(chart.series.map((s) => s.type)).toEqual(seriesTypes);
    };
}

const checkTargetValid = (target: HTMLElement) => {
    if (!target.isConnected) throw new Error('Chart must be configured with a container for event testing to work');
};

export function hoverAction(x: number, y: number): (chart: Chart | AgChartInstance) => Promise<void> {
    return async (chartOrProxy) => {
        const chart = deproxy(chartOrProxy);
        const target = chart.scene.canvas.element as HTMLElement;
        checkTargetValid(target);

        // Reveal tooltip.
        target?.dispatchEvent(mouseMoveEvent({ offsetX: x - 1, offsetY: y - 1 }));
        target?.dispatchEvent(mouseMoveEvent({ offsetX: x, offsetY: y }));

        return new Promise((resolve) => {
            setTimeout(resolve, 50);
        });
    };
}

export function clickAction(x: number, y: number): (chart: Chart | AgChartInstance) => Promise<void> {
    return async (chartOrProxy) => {
        const chart = deproxy(chartOrProxy);
        const target = chart.scene.canvas.element;
        checkTargetValid(target);

        target?.dispatchEvent(clickEvent({ offsetX: x, offsetY: y }));
        return new Promise((resolve) => {
            setTimeout(resolve, 50);
        });
    };
}

export function doubleClickAction(x: number, y: number): (chart: Chart | AgChartInstance) => Promise<void> {
    return async (chartOrProxy) => {
        const chart = deproxy(chartOrProxy);
        const target = chart.scene.canvas.element;
        // A double click is always preceeded by two single clicks, simulate here to ensure correct handling
        target?.dispatchEvent(clickEvent({ offsetX: x, offsetY: y }));
        target?.dispatchEvent(clickEvent({ offsetX: x, offsetY: y }));
        await new Promise((resolve) => {
            setTimeout(resolve, 50);
        });
        await waitForChartStability(chart);
        target?.dispatchEvent(doubleClickEvent({ offsetX: x, offsetY: y }));
        return new Promise((resolve) => {
            setTimeout(resolve, 50);
        });
    };
}

export function scrollAction(x: number, y: number, delta: number): Promise<void> {
    window.dispatchEvent(wheelEvent({ clientX: x, clientY: y, deltaY: delta }));
    return new Promise((resolve) => {
        setTimeout(resolve, 50);
    });
}

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
        sourceCanvas = createCanvas(width, height);
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

    return sourceCanvas?.toBuffer('image/png', CANVAS_TO_BUFFER_DEFAULTS);
}

export function setupMockCanvas(): { nodeCanvas: Canvas } {
    const mockCtx: mockCanvas.MockContext = new mockCanvas.MockContext(CANVAS_WIDTH, CANVAS_HEIGHT, document);

    beforeEach(() => {
        resetIds();

        mockCanvas.setup({ mockCtx, width: CANVAS_WIDTH, height: CANVAS_HEIGHT, mockText: true });
    });

    afterEach(() => {
        mockCanvas.teardown(mockCtx);
    });

    return mockCtx?.ctx;
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
        fs.writeFileSync(diffOutputFilename, (PNG as any).sync.write(diff));
    } else if (fs.existsSync(diffOutputFilename)) {
        fs.unlinkSync(diffOutputFilename);
    }

    return { message: () => `Images were ${result} (${diffPercentage.toFixed(2)}%) pixels different`, pass };
}

export function spyOnAnimationManager(totalDuration: number, ratio: number) {
    jest.spyOn(AnimationManager.prototype, 'animate').mockImplementation(({ from, to, delay, onUpdate }) => {
        const delayRatio = delay ? delay / totalDuration : 0;
        if (ratio < delayRatio) {
            onUpdate?.(from as number, null as unknown as IAnimation);
        } else {
            const squashedRatio = Math.max(0, Math.min(1, (ratio - delayRatio) / (1 - delayRatio)));
            onUpdate?.(
                ((to as number) - (from as number)) * squashedRatio + (from as number),
                null as unknown as IAnimation
            );
        }
        return Promise.resolve() as any;
    });
}
