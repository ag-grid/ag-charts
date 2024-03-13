import { afterEach, beforeEach } from '@jest/globals';

import { flushTimings, loadBuiltExampleOptions, logTimings, recordTiming, setupMockConsole } from 'ag-charts-test';

import { CartesianSeries, CartesianSeriesNodeDatum } from '../src/chart/series/cartesian/cartesianSeries';
import { AgChartProxy, IMAGE_SNAPSHOT_DEFAULTS, deproxy, prepareTestOptions } from '../src/chart/test/utils';
import { AgCharts } from '../src/main';
import { AgChartInstance, AgChartOptions } from '../src/options/agChartOptions';
import { Point } from '../src/scene/point';
import { extractImageData, setupMockCanvas } from '../src/util/test/mockCanvas';

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

export function benchmark(name: string, ctx: BenchmarkContext, callback: () => Promise<void>, timeoutMs = 10000) {
    it(
        name,
        async () => {
            const start = performance.now();
            await callback();
            const duration = performance.now() - start;

            const { currentTestName, testPath } = expect.getState();
            if (testPath == null || currentTestName == null) {
                throw new Error('Unable to resolve current test name.');
            }
            recordTiming(testPath, currentTestName, duration);

            const newImageData = extractImageData(ctx.canvasCtx);
            expect(newImageData).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);
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
    const { nodeData } = series.contextNodeData[0];

    if (nodeCount < nodeData.length) {
        expect(nodeData.length).toBeGreaterThanOrEqual(nodeCount);
    }

    const results: Point[] = [];
    const addResult = (idx: number) => {
        const node: CartesianSeriesNodeDatum = nodeData.at(Math.floor(idx));
        const { midPoint } = node;
        if (!midPoint) throw new Error('No node midPoint found.');

        const point = series.contentGroup.inverseTransformPoint(midPoint.x, midPoint.y);
        results.push(point);
    };

    for (let i = 0; i < nodeCount; i++) {
        addResult(Math.floor(nodeData.length / nodeCount) * i);
    }

    ctx.nodePositions.push(results);
}
