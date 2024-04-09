import { afterEach, beforeEach } from '@jest/globals';

import { flushTimings, loadBuiltExampleOptions, logTimings, recordTiming, setupMockConsole } from 'ag-charts-test';

import {
    CartesianSeries,
    CartesianSeriesNodeDataContext,
    CartesianSeriesNodeDatum,
} from '../src/chart/series/cartesian/cartesianSeries';
import { AgChartProxy, IMAGE_SNAPSHOT_DEFAULTS, deproxy, prepareTestOptions } from '../src/chart/test/utils';
import { AgCharts } from '../src/main';
import { AgChartInstance, AgChartOptions } from '../src/options/agChartOptions';
import { Point } from '../src/scene/point';
import { extractImageData, setupMockCanvas } from '../src/util/test/mockCanvas';

export interface BenchmarkExpectations {
    expectedMaxMemoryMB: number;
}

export class BenchmarkContext<T extends AgChartOptions = AgChartOptions> {
    chart: AgChartProxy | AgChartInstance;
    options: T;
    nodePositions: Point[][] = [];

    public constructor(readonly canvasCtx: ReturnType<typeof setupMockCanvas>) {}

    async create() {
        this.chart = AgCharts.create(this.options);
        await this.waitForUpdate();
    }

    async update() {
        AgCharts.update(this.chart, this.options);
        await this.waitForUpdate();
    }

    async waitForUpdate() {
        await (this.chart as any).chart.waitForUpdate();
    }
}

export function benchmark(
    name: string,
    ctx: BenchmarkContext,
    expectations: BenchmarkExpectations,
    callback: () => Promise<void>,
    timeoutMs = 10000
) {
    const isGcEnabled = 'gc' in global;
    if (!isGcEnabled) {
        global.console.warn('GC flags disabled - invoke via `npm run benchmark` to collect heap usage stats');
    }
    function getMemoryUsage(): NodeJS.MemoryUsage | null {
        if (!global.gc) return null;
        global.gc();
        return process.memoryUsage();
    }

    it(
        name,
        async () => {
            const memoryUsageBefore = getMemoryUsage();
            const start = performance.now();
            await callback();
            const duration = performance.now() - start;
            const memoryUsageAfter = getMemoryUsage();
            const canvasInstances = memoryUsageBefore && memoryUsageAfter && ctx.canvasCtx.getActiveCanvasInstances();

            const { currentTestName, testPath } = expect.getState();
            if (testPath == null || currentTestName == null) {
                throw new Error('Unable to resolve current test name.');
            }

            const memoryUse = recordTiming(testPath, currentTestName, {
                timeMs: duration,
                memory:
                    memoryUsageBefore && memoryUsageAfter
                        ? {
                              before: memoryUsageBefore,
                              after: memoryUsageAfter,
                              nativeAllocations: canvasInstances
                                  ? {
                                        canvas: {
                                            count: canvasInstances.length,
                                            bytes: canvasInstances.reduce(
                                                (totalBytes, canvas) => totalBytes + getBitmapMemoryUsage(canvas),
                                                0
                                            ),
                                        },
                                    }
                                  : undefined,
                          }
                        : undefined,
            });

            const newImageData = extractImageData(ctx.canvasCtx);
            expect(newImageData).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);

            if (memoryUse != null) {
                const BYTES_PER_MB = 1024 ** 2;
                expect(memoryUse / BYTES_PER_MB).toBeLessThanOrEqual(expectations.expectedMaxMemoryMB);
            }
        },
        timeoutMs
    );
}

export function setupBenchmark<T extends AgChartOptions>(exampleName: string): BenchmarkContext<T> {
    const canvasCtx = setupMockCanvas();
    setupMockConsole();

    beforeEach(() => {
        ctx.options = prepareTestOptions(loadBuiltExampleOptions(exampleName));
    });

    afterEach(() => {
        if (ctx.chart) {
            ctx.chart.destroy();
            (ctx.chart as unknown) = undefined;
        }
    });

    afterAll(() => {
        logTimings();
    });

    const ctx = new BenchmarkContext<T>(canvasCtx);
    return ctx;
}

afterAll(() => {
    flushTimings();
});

export function addSeriesNodePoints<T extends AgChartOptions>(
    ctx: BenchmarkContext<T>,
    seriesIdx: number,
    nodeCount: number
) {
    const series = deproxy(ctx.chart).series[seriesIdx] as CartesianSeries<any, any, any>;
    const { nodeData = [] } = getSeriesNodeData(series) ?? {};

    if (nodeCount < nodeData.length) {
        expect(nodeData.length).toBeGreaterThanOrEqual(nodeCount);
    }

    const results: Point[] = [];
    const addResult = (idx: number) => {
        const node = nodeData.at(Math.floor(idx));
        const midPoint = node?.midPoint;
        if (!midPoint) throw new Error('No node midPoint found.');

        const point = series.contentGroup.inverseTransformPoint(midPoint.x, midPoint.y);
        results.push(point);
    };

    for (let i = 0; i < nodeCount; i++) {
        addResult(Math.floor(nodeData.length / nodeCount) * i);
    }

    ctx.nodePositions.push(results);
}

function getBitmapMemoryUsage(dimensions: { width: number; height: number }, bitsPerPixel: number = 32): number {
    const { width, height } = dimensions;
    const numPixels = width * height;
    const bytesPerPixel = bitsPerPixel / 8;
    return numPixels * bytesPerPixel;
}

function getSeriesNodeData(
    series: CartesianSeries<any, any, any, any, CartesianSeriesNodeDataContext<CartesianSeriesNodeDatum, any>>
): CartesianSeriesNodeDataContext<CartesianSeriesNodeDatum, any> | null {
    if (!series.contextNodeData) return null;
    // HACK: support running the benchmark script against old versions of the library.
    // Previous versions of the library used to support multiple `contextNodeData` per series, so take the first item.
    if (Array.isArray(series.contextNodeData)) {
        return (series.contextNodeData as Array<CartesianSeriesNodeDataContext<any, any>>)[0];
    }
    return series.contextNodeData;
}
