import { afterEach, beforeEach, expect, jest } from '@jest/globals';
import type { PngConfig } from 'canvas';
import { Canvas, createCanvas } from 'canvas';
import * as fs from 'fs';
import type { MatchImageSnapshotOptions } from 'jest-image-snapshot';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

import { mockCanvas } from 'ag-charts-test';

import { AgCharts, _ModuleSupport } from '../../main';
import type {
    AgCartesianChartOptions,
    AgChartInstance,
    AgChartOptions,
    AgChartTheme,
    AgPolarChartOptions,
} from '../../options/agChartOptions';
import type { Chart } from '../chart';
import type { AgChartProxy } from '../chartProxy';

const { Animation, AnimationManager, resetIds } = _ModuleSupport;

export interface TestCase {
    options: AgChartOptions;
    assertions: (chart: Chart | AgChartProxy) => Promise<void>;
    extraScreenshotActions?: (chart: AgChartInstance) => Promise<void>;
    warnings?: Array<string | Array<string>>;
}

export interface CartesianOrPolarTestCase extends TestCase {
    options: AgCartesianChartOptions | AgPolarChartOptions;
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

async function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

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
    return chartOrProxy.constructor.name !== 'AgChartInstanceProxy' || (chartOrProxy as Chart).className != null;
}

export function deproxy(chartOrProxy: AgChartProxy | Chart): Chart {
    return isChartInstance(chartOrProxy) ? chartOrProxy : (chartOrProxy.chart as Chart);
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

export async function waitForChartStability(chartOrProxy: Chart | AgChartProxy, animationAdvanceMs = 0): Promise<void> {
    const timeoutMs = 5000;
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

    if (activeAnimateCb) {
        await activeAnimateCb(0, 1);
        if (animationAdvanceMs > 0) {
            await activeAnimateCb(animationAdvanceMs, 1);
        }
        await chart.waitForUpdate(timeoutMs);
    } else if (animationAdvanceMs > 0) {
        throw new Error(`animationAdvancedMs is non-zero, but no animation mocks are present.`);
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

export enum WheelDeltaMode {
    Pixels = 0,
    Lines = 1,
    Pages = 2,
}

type WheelEventData = {
    clientX: number;
    clientY: number;
    deltaX: number;
    deltaY: number;
    deltaMode: WheelDeltaMode;
};

export function wheelEvent({ clientX, clientY, deltaX, deltaY, deltaMode }: WheelEventData): WheelEvent {
    return new WheelEvent('wheel', { bubbles: true, clientX, clientY, deltaX, deltaY, deltaMode });
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

        return delay(50);
    };
}

export function clickAction(x: number, y: number): (chart: Chart | AgChartProxy) => Promise<void> {
    return async (chartOrProxy) => {
        const chart = deproxy(chartOrProxy);
        const target = chart.scene.canvas.element;
        checkTargetValid(target);

        target?.dispatchEvent(clickEvent({ offsetX: x, offsetY: y }));
        return delay(50);
    };
}

export function doubleClickAction(x: number, y: number): (chart: Chart | AgChartProxy) => Promise<void> {
    return async (chartOrProxy) => {
        const chart = deproxy(chartOrProxy);
        const target = chart.scene.canvas.element;
        // A double click is always preceded by two single clicks, simulate here to ensure correct handling
        target?.dispatchEvent(clickEvent({ offsetX: x, offsetY: y }));
        target?.dispatchEvent(clickEvent({ offsetX: x, offsetY: y }));
        await delay(50);
        await waitForChartStability(chart);
        target?.dispatchEvent(doubleClickEvent({ offsetX: x, offsetY: y }));
        return delay(50);
    };
}

export function scrollAction(
    x: number,
    y: number,
    deltaY: number,
    deltaMode: WheelDeltaMode = WheelDeltaMode.Lines,
    deltaX: number = 0,
): (chart: Chart | AgChartProxy) => Promise<void> {
    return async (chartOrProxy) => {
        const chart = deproxy(chartOrProxy);
        const target = chart.scene.canvas.element;
        target?.dispatchEvent(wheelEvent({ clientX: x, clientY: y, deltaY, deltaX, deltaMode }));
        await delay(50);
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

export function setupMockCanvas({ width = CANVAS_WIDTH, height = CANVAS_HEIGHT } = {}): { nodeCanvas: Canvas } {
    const mockCtx: mockCanvas.MockContext = new mockCanvas.MockContext(CANVAS_WIDTH, CANVAS_HEIGHT, document);

    beforeEach(() => {
        resetIds();

        mockCanvas.setup({ mockCtx, width, height, mockText: true });
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
    const chart = deproxy(AgCharts.create(options) as AgChartProxy);
    await waitForChartStability(chart);
    return chart;
}

let activeAnimateCb: ((totalDuration: number, ratio: number) => Promise<void>) | undefined;
export function spyOnAnimationManager() {
    const mocks: jest.SpiedFunction<(...args: any[]) => any>[] = [];
    const rafCbs: Map<number, Parameters<typeof requestAnimationFrame>[0]> = new Map();
    let nextRafId = 1;
    const animateParameters = [0, 0];

    let time = Date.now();
    const animateCb = async (totalDuration: number, ratio: number) => {
        time += totalDuration * ratio;
        const cbs = [...rafCbs.values()];
        rafCbs.clear();

        await Promise.all(cbs.map((cb) => cb(time)));
    };

    beforeEach(() => {
        const skippedMock = jest.spyOn(AnimationManager.prototype, 'isSkipped');
        skippedMock.mockImplementation(() => false);

        const animateMock = jest.spyOn(AnimationManager.prototype, 'animate');
        animateMock.mockImplementation((opts) => {
            const controller = new Animation(opts);
            return controller.update(animateParameters[0] * animateParameters[1]);
        });
        const skippingFramesMock = jest.spyOn(AnimationManager.prototype, 'isSkippingFrames');
        skippingFramesMock.mockImplementation(() => false);

        const safMock = jest.spyOn(AnimationManager.prototype, 'scheduleAnimationFrame');
        safMock.mockImplementation(function (this: _ModuleSupport.AnimationManager, cb) {
            (this as any).requestId = nextRafId++;

            const rafId = nextRafId++;
            rafCbs.set(rafId, cb);
        });
        mocks.push(skippedMock, animateMock, skippingFramesMock, safMock);

        if (activeAnimateCb) throw new Error('activeAnimateCb already initialized - something is very wrong!');
        activeAnimateCb = animateCb;
    });

    afterEach(() => {
        activeAnimateCb = undefined;
        mocks.forEach((mock) => mock.mockRestore());
        rafCbs.clear();
    });

    return (totalDuration: number, ratio: number) => {
        animateParameters[0] = totalDuration;
        animateParameters[1] = ratio;
    };
}

export function reverseAxes<T extends AgCartesianChartOptions | AgPolarChartOptions>(opts: T, reverse: boolean): T {
    return {
        ...opts,
        axes: opts.axes?.map((axis) => ({ ...axis, reverse })),
    };
}

export function mixinReversedAxesCases(
    baseCases: Record<string, CartesianOrPolarTestCase & { skip?: boolean; skipWarningsReversed?: boolean }>
): Record<string, CartesianOrPolarTestCase> {
    const result = { ...baseCases };

    Object.entries(baseCases).forEach(([name, baseCase]) => {
        result[name + '_REVERSED_AXES'] = {
            ...baseCase,
            options: reverseAxes(baseCase.options, true),
            warnings: baseCase.skipWarningsReversed === false ? baseCase.warnings : [],
        };
    });

    return result;
}
