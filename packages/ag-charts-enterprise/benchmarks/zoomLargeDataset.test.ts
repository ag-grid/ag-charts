import { describe as originalDescribe } from '@jest/globals';

import { AgCartesianChartOptions } from 'ag-charts-types';

import { benchmark, isAtOrAfterVersion, setupBenchmark } from './benchmark';

let describe = originalDescribe;
if (!isAtOrAfterVersion(11, 0, 0)) {
    describe = originalDescribe.skip as any;
}

describe('zoom-large-dataset benchmark', () => {
    const ctx = setupBenchmark<AgCartesianChartOptions>('enterprise-1M-line-series', { isEnterprise: true });

    benchmark(
        'initial load',
        ctx,
        { expectedRetainedSizeMB: 174, expectedCanvasCount: 5, autoSnapshot: false },
        async () => {
            await ctx.create();
        }
    );

    describe('after load', () => {
        beforeEach(async () => {
            await ctx.create();
        });

        benchmark(
            '100x zoom',
            ctx,
            { expectedRelativeMB: 1, expectedCanvasCount: 5, autoSnapshot: false },
            async () => {
                for (let i = 0; i < 100; i++) {
                    await ctx.scroll(ctx.options.width! / 2, ctx.options.height! / 2, -1, 0);
                }
            },
            30_000
        );
    });
});
