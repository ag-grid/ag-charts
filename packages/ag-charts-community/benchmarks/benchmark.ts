import { afterEach, beforeEach } from '@jest/globals';

import { flushTimings, loadBuiltExampleOptions, logTimings, recordTiming, setupMockConsole } from 'ag-charts-test';

import { IMAGE_SNAPSHOT_DEFAULTS, prepareTestOptions } from '../src/chart/test/utils';
import { AgChartInstance, AgChartOptions } from '../src/options/agChartOptions';
import { extractImageData, setupMockCanvas } from '../src/util/test/mockCanvas';

type BenchmarkContext = {
    canvasCtx: ReturnType<typeof setupMockCanvas>;
    options: AgChartOptions;
    chart: AgChartInstance;
};

export function benchmark(name: string, ctx: BenchmarkContext, callback: () => Promise<void>, timeoutMs = 10000) {
    it(
        name,
        async () => {
            const start = performance.now();
            await callback();
            const duration = performance.now() - start;

            const newImageData = extractImageData(ctx.canvasCtx);
            expect(newImageData).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);

            const { currentTestName, testPath } = expect.getState();
            if (testPath == null || currentTestName == null) {
                throw new Error('Unable to resolve current test name.');
            }
            recordTiming(testPath, currentTestName, duration);
        },
        timeoutMs
    );
}

export function setupBenchmark(exampleName: string): BenchmarkContext {
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

    const ctx: BenchmarkContext = {
        canvasCtx,
        options: undefined as unknown as any,
        chart: undefined as unknown as any,
    };

    return ctx;
}

afterAll(() => {
    flushTimings();
});
