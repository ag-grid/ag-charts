import { afterEach, beforeEach } from '@jest/globals';

import {
    CANVAS_HEIGHT,
    CANVAS_WIDTH,
    WheelDeltaMode,
    flushTimings,
    loadBuiltExampleOptions,
    logTimings,
    makeMockEvent,
    mockCanvas,
    mouseMoveEvent,
    recordTiming,
    setupMockConsole,
    wheelEvent,
} from 'ag-charts-test';
import { AgChartInstance, AgChartOptions } from 'ag-charts-types';

import { AgCharts } from '../src/main';
import {
    getVersion,
    isAtOrAfterVersion,
    isHistoricBenchmarkTest,
    prepareTestOptions,
    waitForUpdate,
} from './compatibility.ts';

if (isHistoricBenchmarkTest()) {
    console.warn('Attempting to run against version: ', getVersion().join('.'));
}

globalThis.agChartsDebugTimeout = 60_000; // Use Jest timeouts

interface BenchmarkExpectations {
    expectedMaxMemoryMB?: number;
    expectedRelativeMB?: number;
    expectedCanvasCount?: number;
    autoSnapshot?: boolean;
}

export class BenchmarkContext<T extends AgChartOptions = AgChartOptions> {
    chart?: AgChartInstance;
    options: T;
    nodePositions: { x: number; y: number }[][] = [];
    repeat = 1;

    public constructor(
        readonly canvasCtx: mockCanvas.MockContext,
        readonly createApi: 'create' | '__createSparkline',
        readonly isEnterprise: boolean
    ) {}

    async create(extraOpts?: object) {
        if (this.chart) this.chart.destroy();

        this.chart = AgCharts[this.createApi]({ ...this.options, ...extraOpts } as any);
        await this.waitForUpdate();
    }

    async update() {
        if (isAtOrAfterVersion(10, 0, 0)) {
            await this.chart?.update(this.options);
            return;
        }
        (AgCharts as any).update(this.chart, this.options);
        await this.waitForUpdate();
    }

    async updateDelta(options: Partial<T>) {
        if (isAtOrAfterVersion(10, 0, 0)) {
            await this.chart?.updateDelta(options as T);
            return;
        }
        await (AgCharts as any).updateDelta(this.chart, this.options);
    }

    async waitForUpdate() {
        if (isAtOrAfterVersion(11, 0, 0)) {
            await this.chart?.waitForUpdate();
            return;
        }
        await waitForUpdate(this.chart);
    }

    async legendToggle(index = 0) {
        if (isAtOrAfterVersion(10, 0, 0)) {
            this.options.container
                ?.querySelectorAll('.ag-charts-proxy-legend-toolbar button')
                ?.[index].dispatchEvent(new Event('click'));
            await this.chart?.waitForUpdate();
            return;
        }

        const options = this.options as any;
        options.series![index].visible = !(options.series![index].visible ?? true);
        await this.update();
    }

    async blur() {
        let selector = 'canvas';
        if (isAtOrAfterVersion(10, 3, 0)) {
            selector = '.ag-charts-series-area';
        }

        const element = this.options.container?.querySelector(selector) as HTMLElement;
        if (!element) throw new Error('No series area element found');
        element.dispatchEvent(new Event('blur'));
        await this.waitForUpdate();
    }

    async hover(x: number, y: number) {
        let selector = 'canvas';
        let offsetX = 0;
        let offsetY = 0;
        if (isAtOrAfterVersion(11, 0, 0)) {
            selector = '.ag-charts-series-area';
        } else if (isAtOrAfterVersion(10, 3, 0)) {
            // Workaround differences in coordinate calculation between 10.0 and 11.0.
            selector = '.ag-charts-series-area';
            offsetX = this.chart.chart.seriesAreaManager.seriesRect?.x ?? 0;
            offsetY = this.chart.chart.seriesAreaManager.seriesRect?.y ?? 0;
        }

        const element = this.options.container?.querySelector(selector) as HTMLElement;
        if (!element) throw new Error('No series area element found');
        const elementBBox = element.getBoundingClientRect();
        const mockEvent = makeMockEvent({
            target: element,
            offsetX: x + offsetX,
            offsetY: y + offsetY,
            clientX: x + elementBBox.x + offsetX,
            clientY: y + elementBBox.y + offsetY,
        });
        element.dispatchEvent(mouseMoveEvent(mockEvent, x, y));
        await this.waitForUpdate();
    }

    async scroll(
        x: number,
        y: number,
        deltaY: number,
        deltaMode: WheelDeltaMode = WheelDeltaMode.Lines,
        deltaX: number = 0
    ) {
        let selector = 'canvas';
        if (isAtOrAfterVersion(10, 3, 0)) {
            selector = '.ag-charts-series-area';
        }

        const element = this.options.container?.querySelector(selector) as HTMLElement;

        if (!element) throw new Error('No series area element found');
        const mockEvent = makeMockEvent({ target: element, offsetX: x, offsetY: y, clientX: x, clientY: y });
        element.dispatchEvent(wheelEvent(mockEvent, { deltaX, deltaY, deltaMode }));
        await this.waitForUpdate();
    }

    repeatCount(count: number) {
        this.repeat = count;
        return this;
    }
}

function defaultTimeoutMs(ctx: BenchmarkContext) {
    if (ctx.repeat >= 100) {
        return 30_000;
    } else if (ctx.repeat >= 10) {
        return 20_000;
    } else if (ctx.repeat >= 5) {
        return 15_000;
    }
    return 10_000;
}

export function benchmark(
    name: string,
    ctx: BenchmarkContext,
    expectations: BenchmarkExpectations,
    callback: () => Promise<void> | void,
    timeoutMs = defaultTimeoutMs(ctx)
) {
    if (!global.gc) {
        // Just warn and fail on exit - this allows us to run the benchmarks for debugging from VSCode.
        console.warn('GC flags disabled - invoke via `npm run benchmark` to collect heap usage stats');
        process.exitCode = 1;
    }

    it(
        name,
        async () => {
            global.gc?.();
            const memoryUsageBefore = process.memoryUsage();

            const { repeat: runCount = 1 } = ctx;
            let duration = 0;
            for (let i = 0; i < runCount; i++) {
                const start = performance.now();
                await callback();
                const end = performance.now();
                duration += end - start;

                global.gc?.();
            }

            duration /= runCount;

            await new Promise((r) => setTimeout(r, 100));
            global.gc?.();

            const memoryUsageAfter = process.memoryUsage();
            const canvasInstances = (
                ctx.canvasCtx.getActiveCanvasInstances() as { width: number; height: number }[]
            ).concat(ctx.canvasCtx.getActiveOffscreenCanvasInstances());
            const { currentTestName, testPath } = expect.getState();

            if (testPath == null || currentTestName == null) {
                throw new Error('Unable to resolve current test name.');
            }

            const memory = recordTiming(testPath, currentTestName, {
                timeMs: duration,
                runCount,
                memory: {
                    before: memoryUsageBefore,
                    after: memoryUsageAfter,
                    nativeAllocations: {
                        canvas: {
                            count: canvasInstances.length,
                            bytes: canvasInstances.reduce(
                                (totalBytes, canvas) => totalBytes + getBitmapMemoryUsage(canvas),
                                0
                            ),
                        },
                    },
                },
            });

            if (isHistoricBenchmarkTest()) {
                return;
            }

            const { autoSnapshot, ...expected } = expectations;
            if (autoSnapshot ?? true) {
                const newImageData = mockCanvas.extractImageData(ctx.canvasCtx.ctx);
                expect(newImageData).toMatchImageSnapshot({
                    failureThresholdType: 'pixel',
                    failureThreshold: 5,
                    customDiffConfig: {
                        threshold: 0.05,
                    },
                });
            }

            const BYTES_PER_MB = 1024 ** 2;
            const actual = {
                expectedMaxMemoryMB: memory.totalMemoryUse / BYTES_PER_MB,
                expectedRelativeMB: memory.relativeMemoryUse / BYTES_PER_MB,
                expectedCanvasCount: canvasInstances.length,
            };

            for (const key in expected) {
                expect(actual[key]).toBeLessThanOrEqual(expected[key]);
                if (actual[key] < expected[key] * 0.8) {
                    console.log(
                        `[${currentTestName}]: ${key} is much less than expected (expected: ${expected[key]}, actual: ${actual[key]})`
                    );
                }
            }
        },
        timeoutMs
    );
}

export function setupBenchmark<T extends AgChartOptions>(
    exampleName: string,
    opts?: {
        createApi?: 'create' | '__createSparkline';
        isEnterprise?: boolean;
    }
): BenchmarkContext<T> {
    const canvasCtx = new mockCanvas.MockContext(CANVAS_WIDTH, CANVAS_HEIGHT, globalThis.window.document);
    canvasCtx.mockText = true;

    const { createApi = 'create' } = opts ?? {};
    setupMockConsole();

    beforeEach(() => {
        mockCanvas.setup(canvasCtx);
        const { isEnterprise, options } = loadBuiltExampleOptions(exampleName);
        if (isEnterprise && !ctx.isEnterprise) {
            throw new Error('Cannot exercise enterprise example in ag-charts-community');
        }
        ctx.options = prepareTestOptions(options, globalThis.window.document.body, ctx.isEnterprise);
    });

    afterEach(() => {
        if (ctx.chart) {
            ctx.chart.destroy();
            (ctx.chart as unknown) = undefined;
        }
        mockCanvas.teardown(canvasCtx);
    });

    afterAll(() => {
        logTimings();
    });

    const ctx = new BenchmarkContext<T>(canvasCtx, createApi, opts?.isEnterprise ?? false);
    return ctx;
}

afterAll(() => {
    flushTimings();
});

export async function addSeriesNodePoints<T extends AgChartOptions>(
    ctx: BenchmarkContext<T>,
    seriesIdx: number,
    nodeCount: number
) {
    if (ctx.chart == null) throw new Error('No ctx.chart to update');

    const series = (ctx.chart as any).chart.series[seriesIdx];
    const { nodeData = [] } = getSeriesNodeData(series) ?? {};

    if (nodeCount < nodeData.length) {
        expect(nodeData.length).toBeGreaterThanOrEqual(nodeCount);
    }

    const results: { x: number; y: number }[] = [];
    const addResult = async (idx: number) => {
        const node = nodeData.at(Math.floor(idx));
        const midPoint = node?.midPoint;
        if (!midPoint) throw new Error('No node midPoint found.');

        const point = await toCanvasPoint(series.contentGroup, midPoint.x, midPoint.y);
        results.push(point);
    };

    for (let i = 0; i < nodeCount; i++) {
        await addResult(Math.floor(nodeData.length / nodeCount) * i);
    }

    ctx.nodePositions.push(results);
}

function getBitmapMemoryUsage(dimensions: { width: number; height: number }, bitsPerPixel: number = 32): number {
    const { width, height } = dimensions;
    const numPixels = width * height;
    const bytesPerPixel = bitsPerPixel / 8;
    return numPixels * bytesPerPixel;
}

type ContentNodeData = { nodeData: { midPoint?: { x: number; y: number } }[] };
function getSeriesNodeData(series: any): ContentNodeData | null {
    if (!series.contextNodeData) return null;
    // HACK: support running the benchmark script against old versions of the library.
    // Previous versions of the library used to support multiple `contextNodeData` per series, so take the first item.
    if (Array.isArray(series.contextNodeData)) {
        return (series.contextNodeData as ContentNodeData[])[0];
    }
    return series.contextNodeData;
}

function toCanvasPoint(contentGroup: any, x: number, y: number) {
    if (isAtOrAfterVersion(10, 2, 0)) {
        let node = contentGroup;
        while (node) {
            ({ x, y } = node.toParentPoint?.(x, y) ?? { x, y });
            node = node.parent;
        }
        return { x, y };
    } else {
        return contentGroup.inverseTransformPoint(x, y);
    }
}
