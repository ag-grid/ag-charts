import { beforeEach, describe } from '@jest/globals';

import { AgCartesianChartOptions } from 'ag-charts-types';

import { benchmark, setupBenchmark } from './benchmark';

describe('large-scale multi-series benchmark', () => {
    const ctx = setupBenchmark<AgCartesianChartOptions>('large-scale-multi-series').repeatCount(10);

    benchmark(
        'initial load',
        ctx,
        { expectedRetainedSizeMB: 33, expectedCanvasCount: 5 },
        async () => {
            await ctx.create();
        },
        15_000
    );

    describe('after load', () => {
        beforeEach(async () => {
            await ctx.create();
        });

        benchmark(
            '1x legend toggle',
            ctx,
            { expectedRelativeMB: 3.3, expectedCanvasCount: 4 },
            async () => {
                await ctx.legendToggle();
                await ctx.legendToggle();
            },
            20_000
        );

        benchmark(
            '4x legend toggle',
            ctx,
            { expectedRelativeMB: 3.3, expectedCanvasCount: 4 },
            async () => {
                for (let i = 0; i < 2; i++) {
                    await ctx.legendToggle(i);
                    await ctx.legendToggle(i);
                }
            },
            30_000
        );
    });
});
