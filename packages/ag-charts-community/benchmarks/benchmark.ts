import { afterEach, beforeEach } from '@jest/globals';
import * as fs from 'node:fs';
import * as path from 'node:path';

import {
    CANVAS_HEIGHT,
    CANVAS_WIDTH,
    SizeMetadata,
    WheelDeltaMode,
    flushTimings,
    loadBuiltExampleOptions,
    logTimings,
    makeMockEvent,
    mockCanvas,
    mouseMoveEvent,
    recordTiming,
    setupMockConsole,
    sizeOf,
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
} from './compatibility';

if (isHistoricBenchmarkTest()) {
    console.warn('Attempting to run against version: ', getVersion().join('.'));
}

(globalThis as any).agChartsDebugTimeout = 60_000; // Use Jest timeouts
const repeatLimit = process.env.AG_BENCHMARK_REPEAT_LIMIT
    ? Number.parseInt(process.env.AG_BENCHMARK_REPEAT_LIMIT)
    : undefined;
const softFailMode = ['1', 'true'].includes(process.env.AG_BENCHMARK_SOFT_FAIL ?? '0');
const debugMode = ['1', 'true'].includes(process.env.AG_BENCHMARK_DEBUG ?? '0');

interface BenchmarkExpectations {
    expectedRelativeMB?: number;
    expectedRetainedSizeMB?: number;
    expectedCanvasCount?: number;
    autoSnapshot?: boolean;
}

interface ExpectationBreach {
    testName: string;
    type: 'memory' | 'canvasCount' | 'snapshot';
    expected: number | string;
    actual: number | string;
}

// Global array to collect breaches when in soft-fail mode
const expectationBreaches: ExpectationBreach[] = [];

export class BenchmarkContext<T extends AgChartOptions = AgChartOptions> {
    chart?: AgChartInstance<T>;
    options!: T;
    nodePositions: { x: number; y: number }[][] = [];
    repeat = 1;

    public constructor(
        readonly canvasCtx: mockCanvas.MockContext,
        readonly createApi: 'create' | '__createSparkline',
        readonly isEnterprise: boolean
    ) {}

    async create(extraOpts?: object) {
        if (this.chart) this.chart.destroy();

        this.chart = AgCharts[this.createApi]({ ...this.options, ...extraOpts } as any) as AgChartInstance<T>;
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
            await this.chart?.updateDelta(options as any);
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
            offsetX = (this.chart as any).chart.seriesAreaManager.seriesRect?.x ?? 0;
            offsetY = (this.chart as any).chart.seriesAreaManager.seriesRect?.y ?? 0;
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
        this.repeat = Math.min(count, repeatLimit ?? Infinity);
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

function runAutoSnapshot(ctx: BenchmarkContext, expectations: BenchmarkExpectations, currentTestName: string) {
    const { autoSnapshot } = expectations;
    // Skip snapshots when AG_BENCHMARK_SOFT_FAIL is enabled (overnight benchmark runs)
    if (softFailMode) return;
    if (!(autoSnapshot ?? true)) return;

    const newImageData = mockCanvas.extractImageData(ctx.canvasCtx.ctx);
    const assertSnapshot = () => {
        expect(newImageData).toMatchImageSnapshot({
            failureThresholdType: 'pixel',
            failureThreshold: 5,
            customDiffConfig: {
                threshold: 0.05,
            },
        });
    };
    if (!softFailMode) {
        // Normal mode - let the assertion fail
        assertSnapshot();
        return;
    }

    // In soft-fail mode, try-catch snapshot assertions
    try {
        assertSnapshot();
    } catch {
        // Collect snapshot breach
        expectationBreaches.push({
            testName: currentTestName,
            type: 'snapshot',
            expected: 'snapshot match',
            actual: 'snapshot mismatch',
        });
        console.log(`[${currentTestName}]: BREACH - Snapshot mismatch detected`);
    }
}

function runExpectations(
    _ctx: BenchmarkContext,
    expectations: BenchmarkExpectations,
    currentTestName: string,
    _memory: ReturnType<typeof recordTiming>,
    canvasInstances: unknown[],
    initialRetainedSize: number,
    finalRetainedSizeResult: SizeMetadata | undefined
) {
    const { expectedRelativeMB, expectedRetainedSizeMB, expectedCanvasCount } = expectations;
    const BYTES_PER_MB = 1024 ** 2;
    const fudgeFactorForSmallNumbers = 1; // absolute fudge factor for small numbers.

    // Handle expectedRetainedSizeMB for initial load tests
    if (expectedRetainedSizeMB !== undefined && finalRetainedSizeResult) {
        const actualRetainedSizeMB = finalRetainedSizeResult.size / BYTES_PER_MB;

        if (actualRetainedSizeMB + fudgeFactorForSmallNumbers < expectedRetainedSizeMB * 0.8) {
            console.log(
                `[${currentTestName}]: expectedRetainedSizeMB is much less than expected (expected: ${expectedRetainedSizeMB}, actual: ${actualRetainedSizeMB.toFixed(1)})`
            );
        } else if (actualRetainedSizeMB > expectedRetainedSizeMB) {
            if (!softFailMode) {
                expect(actualRetainedSizeMB).toBeLessThanOrEqual(expectedRetainedSizeMB);
                return;
            }
            expectationBreaches.push({
                testName: currentTestName,
                type: 'memory',
                expected: expectedRetainedSizeMB,
                actual: actualRetainedSizeMB,
            });
            console.log(
                `[${currentTestName}]: BREACH - expectedRetainedSizeMB exceeded expected (expected: ${expectedRetainedSizeMB}, actual: ${actualRetainedSizeMB.toFixed(1)})`
            );
        }
    }

    // Handle expectedRelativeMB for interaction tests (retained size difference)
    if (expectedRelativeMB !== undefined && finalRetainedSizeResult) {
        const retainedSizeDiffMB = (finalRetainedSizeResult.size - initialRetainedSize) / BYTES_PER_MB;

        if (retainedSizeDiffMB + fudgeFactorForSmallNumbers < expectedRelativeMB * 0.8) {
            console.log(
                `[${currentTestName}]: expectedRelativeMB is much less than expected (expected: ${expectedRelativeMB}, actual: ${retainedSizeDiffMB.toFixed(1)})`
            );
        } else if (retainedSizeDiffMB > expectedRelativeMB) {
            if (!softFailMode) {
                expect(retainedSizeDiffMB).toBeLessThanOrEqual(expectedRelativeMB);
                return;
            }
            expectationBreaches.push({
                testName: currentTestName,
                type: 'memory',
                expected: expectedRelativeMB,
                actual: retainedSizeDiffMB,
            });
            console.log(
                `[${currentTestName}]: BREACH - expectedRelativeMB exceeded expected (expected: ${expectedRelativeMB}, actual: ${retainedSizeDiffMB.toFixed(1)})`
            );
        }
    }

    // Handle canvas count expectations
    if (expectedCanvasCount !== undefined) {
        const actualCanvasCount = canvasInstances.length;

        if (actualCanvasCount + fudgeFactorForSmallNumbers < expectedCanvasCount * 0.8) {
            console.log(
                `[${currentTestName}]: expectedCanvasCount is much less than expected (expected: ${expectedCanvasCount}, actual: ${actualCanvasCount})`
            );
        } else if (actualCanvasCount > expectedCanvasCount) {
            if (!softFailMode) {
                expect(actualCanvasCount).toBeLessThanOrEqual(expectedCanvasCount);
                return;
            }
            expectationBreaches.push({
                testName: currentTestName,
                type: 'canvasCount',
                expected: expectedCanvasCount,
                actual: actualCanvasCount,
            });
            console.log(
                `[${currentTestName}]: BREACH - expectedCanvasCount exceeded expected (expected: ${expectedCanvasCount}, actual: ${actualCanvasCount})`
            );
        }
    }
}

export function benchmark(
    name: string,
    ctx: BenchmarkContext,
    expectations: BenchmarkExpectations,
    callback: () => Promise<void> | void,
    timeoutMs = defaultTimeoutMs(ctx)
) {
    if (!globalThis.gc) {
        // Just warn and fail on exit - this allows us to run the benchmarks for debugging from VSCode.
        console.warn('GC flags disabled - invoke via `npm run benchmark` to collect heap usage stats');
        process.exitCode = 1;
    }

    it(
        name,
        async () => {
            globalThis.gc?.();

            const { repeat: runCount = 1 } = ctx;

            // Measure initial retained size for non-initial-load tests
            let initialRetainedSize = 0;
            if (ctx.chart) {
                const initialResult = sizeOf(ctx.chart);
                initialRetainedSize = initialResult.size;
            }

            // Execute the test
            let totalDuration = 0;
            const memoryBefore = process.memoryUsage();

            for (let i = 0; i < runCount; i++) {
                const start = performance.now();
                await callback();
                const end = performance.now();
                totalDuration += end - start;
                globalThis.gc?.();
            }

            await new Promise((r) => setTimeout(r, 100));
            globalThis.gc?.();

            const memoryAfter = process.memoryUsage();

            // Measure final retained size
            let finalRetainedSizeResult: SizeMetadata | undefined;
            if (ctx.chart) {
                finalRetainedSizeResult = sizeOf(ctx.chart);
            }

            if (debugMode && finalRetainedSizeResult) {
                console.log(
                    `Retained size: ${(finalRetainedSizeResult.size / (1024 * 1024)).toFixed(2)}MB`,
                    finalRetainedSizeResult
                );
            }

            // Get canvas information
            const canvasInstances = (
                ctx.canvasCtx.getActiveCanvasInstances() as { width: number; height: number }[]
            ).concat(ctx.canvasCtx.getActiveOffscreenCanvasInstances());
            const { currentTestName, testPath } = expect.getState();

            if (testPath == null || currentTestName == null) {
                throw new Error('Unable to resolve current test name.');
            }

            // Record results
            const memory = recordTiming(testPath, currentTestName, {
                timeMs: totalDuration / runCount,
                runCount,
                memory: {
                    before: memoryBefore,
                    after: memoryAfter,
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
                retainedSize: finalRetainedSizeResult,
                initialRetainedSize,
            });

            if (isHistoricBenchmarkTest()) {
                return;
            }

            runAutoSnapshot(ctx, expectations, currentTestName);
            runExpectations(
                ctx,
                expectations,
                currentTestName,
                memory,
                canvasInstances,
                initialRetainedSize,
                finalRetainedSizeResult
            );
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

    // If we're in soft-fail mode and have breaches, write them to a file
    if (softFailMode && expectationBreaches.length > 0) {
        const breachesPath = path.join(__dirname, '../../../reports/benchmark-breaches.json');

        // Ensure reports directory exists
        const reportsDir = path.dirname(breachesPath);
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir, { recursive: true });
        }

        fs.writeFileSync(breachesPath, JSON.stringify(expectationBreaches, null, 2));
        console.log(`\nWrote ${expectationBreaches.length} expectation breaches to ${breachesPath}`);
    }
});

// Export function to get breaches programmatically
export function getExpectationBreaches(): ExpectationBreach[] {
    return [...expectationBreaches];
}

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
