import { afterEach, beforeEach, expect, jest } from '@jest/globals';
import type { PngConfig } from 'canvas';
import { Canvas, createCanvas } from 'canvas';
import * as fs from 'fs';
import type { MatchImageSnapshotOptions } from 'jest-image-snapshot';
import * as pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

import { AgChart, type AgChartProxy, _ModuleSupport } from '../../main';
import type {
    AgCartesianChartOptions,
    AgChartInstance,
    AgChartOptions,
    AgChartTheme,
    AgPolarChartOptions,
} from '../../options/agChartOptions';
import type { Chart } from '../chart';
import * as mockCanvas from './mock-canvas';

const { Animation, AnimationManager, resetIds } = _ModuleSupport;

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
export const IMAGE_SNAPSHOT_DEFAULTS: MatchImageSnapshotOptions = {
    failureThreshold: FAILURE_THRESHOLD,
    failureThresholdType: 'percent',
};
export const CANVAS_TO_BUFFER_DEFAULTS: PngConfig = { compressionLevel: 6, filters: new Canvas(0, 0).PNG_NO_FILTERS };

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

export function prepareTestOptions<T extends AgChartOptions>(options: T, container = document.body) {
    options.autoSize = false;
    options.width = CANVAS_WIDTH;
    options.height = CANVAS_HEIGHT;
    options.container = container;

    let baseTestTheme: AgChartTheme = {
        baseTheme: 'ag-default',
        palette: {
            fills: ['#f3622d', '#fba71b', '#57b757', '#41a9c9', '#4258c9', '#9a42c8', '#c84164', '#888888'],
            strokes: ['#aa4520', '#b07513', '#3d803d', '#2d768d', '#2e3e8d', '#6c2e8c', '#8c2d46', '#5f5f5f'],
        },
    };

    if (typeof options?.theme === 'object' && options?.theme.palette != null) {
        // Keep existing theme.
        baseTestTheme = options.theme;
    } else if (typeof options?.theme === 'object') {
        // Keep theme supplied, just override palette colours.
        baseTestTheme = {
            ...options.theme,
            palette: baseTestTheme.palette,
        };
    } else if (typeof options?.theme === 'string') {
        // Override colours.
        baseTestTheme.baseTheme = options.theme;
    }

    options.theme = baseTestTheme;

    return options;
}

function isChartInstance(chartOrProxy: AgChartInstance): chartOrProxy is Chart {
    return chartOrProxy.constructor.name !== 'AgChartInstanceProxy' || chartOrProxy.className != null;
}

export function deproxy(chartOrProxy: AgChartProxy | Chart): Chart {
    return isChartInstance(chartOrProxy) ? chartOrProxy : chartOrProxy.chart;
}

export function repeat<T>(value: T, count: number): T[] {
    return new Array(count).fill(value);
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

export async function waitForChartStability(chartOrProxy: Chart | AgChartProxy, timeoutMs = 5000): Promise<void> {
    const chart = deproxy(chartOrProxy);
    const chartAny = chart as any; // to access private properties
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
    const event = new MouseEvent('mousemove', { bubbles: true });
    Object.assign(event, { offsetX, offsetY, pageX: offsetX, pageY: offsetY });
    return event;
}

export function clickEvent({ offsetX, offsetY }: { offsetX: number; offsetY: number }): MouseEvent {
    const event = new MouseEvent('click', { bubbles: true });
    Object.assign(event, { offsetX, offsetY, pageX: offsetX, pageY: offsetY });
    return event;
}

export function doubleClickEvent({ offsetX, offsetY }: { offsetX: number; offsetY: number }): MouseEvent {
    const event = new MouseEvent('dblclick', { bubbles: true });
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
    return new WheelEvent('wheel', { bubbles: true, clientX, clientY, deltaY });
}

export function cartesianChartAssertions(params?: { type?: string; axisTypes?: string[]; seriesTypes?: string[] }) {
    const { axisTypes = ['category', 'number'], seriesTypes = ['bar', 'bar'] } = params ?? {};

    return async (chartOrProxy: Chart | AgChartProxy) => {
        const chart = deproxy(chartOrProxy);
        expect(chart?.constructor?.name).toEqual('CartesianChart');
        expect(chart.axes).toHaveLength(axisTypes.length);
        expect(chart.axes.map((a) => a.type)).toEqual(axisTypes);
        expect(chart.series.map((s) => s.type)).toEqual(seriesTypes);
    };
}

export function polarChartAssertions(params?: { seriesTypes?: string[] }) {
    const { seriesTypes = ['pie'] } = params ?? {};

    return async (chartOrProxy: Chart | AgChartProxy) => {
        const chart = deproxy(chartOrProxy);
        expect(chart?.constructor?.name).toEqual('PolarChart');
        expect(chart.axes).toHaveLength(0);
        expect(chart.series.map((s) => s.type)).toEqual(seriesTypes);
    };
}

export function hierarchyChartAssertions(params?: { seriesTypes?: string[] }) {
    const { seriesTypes = ['treemap'] } = params ?? {};

    return async (chartOrProxy: Chart | AgChartProxy) => {
        const chart = deproxy(chartOrProxy);
        expect(chart?.constructor?.name).toEqual('HierarchyChart');
        expect(chart.axes).toHaveLength(0);
        expect(chart.series.map((s) => s.type)).toEqual(seriesTypes);
    };
}

const checkTargetValid = (target: HTMLElement) => {
    if (!target.isConnected) throw new Error('Chart must be configured with a container for event testing to work');
};

export function hoverAction(x: number, y: number): (chart: Chart | AgChartProxy) => Promise<void> {
    return async (chartOrProxy) => {
        const chart = deproxy(chartOrProxy);
        const target = chart.scene.canvas.element;
        checkTargetValid(target);

        // Reveal tooltip.
        target?.dispatchEvent(mouseMoveEvent({ offsetX: x - 1, offsetY: y - 1 }));
        target?.dispatchEvent(mouseMoveEvent({ offsetX: x, offsetY: y }));

        return new Promise((resolve) => {
            setTimeout(resolve, 50);
        });
    };
}

export function clickAction(x: number, y: number): (chart: Chart | AgChartProxy) => Promise<void> {
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

export function doubleClickAction(x: number, y: number): (chart: Chart | AgChartProxy) => Promise<void> {
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

export function scrollAction(x: number, y: number, delta: number): (chart: Chart | AgChartProxy) => Promise<void> {
    return async (chartOrProxy) => {
        const chart = deproxy(chartOrProxy);
        const target = chart.scene.canvas.element;
        target?.dispatchEvent(wheelEvent({ clientX: x, clientY: y, deltaY: delta }));
        await new Promise((resolve) => {
            setTimeout(resolve, 50);
        });
    };
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
        fs.writeFileSync(diffOutputFilename, PNG.sync.write(diff));
    } else if (fs.existsSync(diffOutputFilename)) {
        fs.unlinkSync(diffOutputFilename);
    }

    return { message: () => `Images were ${result} (${diffPercentage.toFixed(2)}%) pixels different`, pass };
}

export async function createChart(options: AgChartOptions) {
    options = prepareTestOptions({ ...options });
    const chart = deproxy(AgChart.create(options));
    await waitForChartStability(chart);
    return chart;
}

export function spyOnAnimationManager(totalDuration: number, ratio: number) {
    jest.spyOn(AnimationManager.prototype, 'isSkipped').mockImplementation(() => false);
    jest.spyOn(AnimationManager.prototype, 'animate').mockImplementation((opts) => {
        const controller = new Animation(opts);
        return controller.update(totalDuration * ratio);
    });
}
