import { describe as originalDescribe } from '@jest/globals';

import type { AgCartesianChartOptions } from 'ag-charts-types';

import { benchmark, isAtOrAfterVersion, setupBenchmark } from './benchmark';

let describe = originalDescribe;
if (!isAtOrAfterVersion(11, 0, 0)) {
    describe = originalDescribe.skip as any;
}

describe('line series benchmark', () => {
    const ctx = setupBenchmark<AgCartesianChartOptions>('high-perf-line', { isEnterprise: true });

    benchmark(
        'initial load',
        ctx,
        { expectedRetainedSizeMB: 200, expectedCanvasCount: 3, autoSnapshot: false },
        async () => {
            await ctx.create();
        },
        30_000
    );

    describe('after load', () => {
        beforeEach(async () => {
            await ctx.create();
        });

        benchmark(
            '20x zoom',
            ctx,
            { expectedRelativeMB: 65, expectedCanvasCount: 3, autoSnapshot: false },
            async () => {
                for (let i = 0; i < 20; i++) {
                    await ctx.scroll(ctx.options.width! / 2, ctx.options.height! / 2, -1, 0);
                }
            },
            30_000
        );
    });
});
