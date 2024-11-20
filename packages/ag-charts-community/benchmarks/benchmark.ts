import { afterEach, beforeEach } from '@jest/globals';

import { flushTimings, loadBuiltExampleOptions, logTimings, recordTiming, setupMockConsole } from 'ag-charts-test';
import { AgChartInstance, AgChartOptions } from 'ag-charts-types';

import { AgCharts } from '../src/main';
import { Point } from '../src/scene/point';
import { extractImageData, setupMockCanvas } from '../src/util/test/mockCanvas';

export interface BenchmarkExpectations {
    expectedMaxMemoryMB: number;
    autoSnapshot?: boolean;
}

export class BenchmarkContext<T extends AgChartOptions = AgChartOptions> {
    chart?: AgChartInstance;
    options: T;
    nodePositions: Point[][] = [];
    repeat = 1;

    public constructor(
        readonly canvasCtx: ReturnType<typeof setupMockCanvas>,
        readonly createApi: 'create' | '__createSparkline'
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
        await (AgCharts as any).update(this.chart, this.options);
    }

    async updateDelta(options: Partial<T>) {
        if (isAtOrAfterVersion(10, 0, 0)) {
            await this.chart?.updateDelta(options as T);
            return;
        }
        await (AgCharts as any).updateDelta(this.chart, this.options);
    }

    async waitForUpdate() {
        if (isAtOrAfterVersion(10, 0, 0)) {
            await this.chart?.waitForUpdate();
            return;
        }
        await (this.chart as any).chart.waitForUpdate();
    }

    repeatCount(count: number) {
        this.repeat = count;
        return this;
    }
}

function isHistoricBenchmarkTest() {
    return process.env.AG_LIBRARY_VERSION != null;
}

function getVersion() {
    if (process.env.AG_LIBRARY_VERSION == null) return [11, 0, 0];

    const result = process.env.AG_LIBRARY_VERSION.split('.')
        .map((n) => /(\d+)/.exec(n)?.[1])
        .map(Number);
    if (result.length !== 3 || result.some((n) => isNaN(n))) {
        throw new Error("Couldn't parse semver of: " + process.env.AG_LIBRARY_VERSION);
    }
    return result;
}

export function isAtOrAfterVersion(major: number, minor: number, patch: number) {
    const current = getVersion();

    if (major < current[0]) return true;
    if (major > current[0]) return false;
    if (minor < current[1]) return true;
    if (minor > current[1]) return false;
    if (patch < current[2]) return true;

    return patch === current[2];
}

export function prepareTestOptions<T extends AgChartOptions>(options: T, container: HTMLElement) {
    if (!isAtOrAfterVersion(10, 0, 0)) {
        (options as any).autoSize = false;
    }
    options.width = 800;
    options.height = 600;
    options.container = container;

    let baseTestTheme = {
        baseTheme: 'ag-default',
        palette: {
            fills: ['#f3622d', '#fba71b', '#57b757', '#41a9c9', '#4258c9', '#9a42c8', '#c84164', '#888888'],
            strokes: ['#aa4520', '#b07513', '#3d803d', '#2d768d', '#2e3e8d', '#6c2e8c', '#8c2d46', '#5f5f5f'],
        },
    };

    if (typeof options?.theme === 'object' && options?.theme.palette != null) {
        // Keep existing theme.
        baseTestTheme = options.theme as any;
    } else if (typeof options?.theme === 'object') {
        // Keep theme supplied, just override palette colours.
        baseTestTheme = {
            ...options.theme,
            palette: baseTestTheme.palette,
        } as any;
    } else if (typeof options?.theme === 'string') {
        // Override colours.
        baseTestTheme.baseTheme = options.theme;
    }

    options.theme = baseTestTheme as any;

    return options;
}

export function benchmark(
    name: string,
    ctx: BenchmarkContext,
    expectations: BenchmarkExpectations,
    callback: () => Promise<void>,
    timeoutMs = 10000
) {
    if (!global.gc) {
        throw new Error('GC flags disabled - invoke via `npm run benchmark` to collect heap usage stats');
    }

    it(
        name,
        async () => {
            global.gc?.();
            const memoryUsageBefore = process.memoryUsage();

            const start = performance.now();
            const { repeat: runCount = 1 } = ctx;
            for (let i = 0; i < runCount; i++) {
                await callback();
            }
            const duration = (performance.now() - start) / runCount;

            if (runCount > 1) global.gc?.();
            const memoryUsageAfter = process.memoryUsage();
            const canvasInstances = ctx.canvasCtx.getActiveCanvasInstances();
            const { currentTestName, testPath } = expect.getState();

            if (testPath == null || currentTestName == null) {
                throw new Error('Unable to resolve current test name.');
            }

            const memoryUse = recordTiming(testPath, currentTestName, {
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

            if (expectations.autoSnapshot ?? !isHistoricBenchmarkTest()) {
                const newImageData = extractImageData(ctx.canvasCtx);
                expect(newImageData).toMatchImageSnapshot({ failureThresholdType: 'pixel', failureThreshold: 5 });
            }

            const BYTES_PER_MB = 1024 ** 2;
            expect(memoryUse / BYTES_PER_MB).toBeLessThanOrEqual(expectations.expectedMaxMemoryMB);
        },
        timeoutMs
    );
}

export function setupBenchmark<T extends AgChartOptions>(
    exampleName: string,
    opts?: {
        createApi: 'create' | '__createSparkline';
    }
): BenchmarkContext<T> {
    const canvasCtx = setupMockCanvas();
    const { createApi = 'create' } = opts ?? {};
    setupMockConsole();

    beforeEach(() => {
        ctx.options = prepareTestOptions(loadBuiltExampleOptions(exampleName), globalThis.window.document.body);

        if (!isAtOrAfterVersion(10, 0, 0)) {
            ctx.options.series = ctx.options.series?.map((s) => {
                if (s.type === 'scatter' && s.shape != null) {
                    const { shape, ...sOther } = s;
                    return { ...sOther, marker: { ...sOther.marker, shape } };
                }
                return s;
            });

            (ctx.options as any).axes = (ctx.options as any).axes?.map((a) => {
                if (a.interval != null) {
                    const { interval, ...aOther } = a;
                    return { ...aOther, tick: { ...aOther.tick, ...interval } };
                }
                return a;
            });
        }

        if (
            !isAtOrAfterVersion(11, 0, 0) &&
            ctx.options.mode === 'integrated' &&
            (ctx.options.axes as any)?.some((a) => a.type === 'grouped-category')
        ) {
            ctx.options.data.forEach((d: object) => {
                const labels = d['ag-Grid-AutoColumn'];
                d['ag-Grid-AutoColumn'] = { labels, toString: () => labels.join(' - ') };
            });
        }
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

    const ctx = new BenchmarkContext<T>(canvasCtx, createApi);
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

    const results: Point[] = [];
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

async function toCanvasPoint(contentGroup: any, x: number, y: number) {
    if (isAtOrAfterVersion(10, 2, 0)) {
        return import('../src/scene/transformable.ts').then(({ Transformable }) =>
            Transformable.toCanvasPoint(contentGroup, x, y)
        );
    } else {
        return contentGroup.inverseTransformPoint(x, y);
    }
}
