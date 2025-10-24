import { beforeEach, describe } from '@jest/globals';

import { AgCartesianChartOptions } from 'ag-charts-types';

import { benchmark, setupBenchmark } from './benchmark';

describe('integrated charts large scale benchmark', () => {
    const ctx = setupBenchmark<AgCartesianChartOptions>('integrated-large-scale').repeatCount(10);

    benchmark('initial load', ctx, { expectedRetainedSizeMB: 72, expectedCanvasCount: 34 }, async () => {
        await ctx.create();
    });

    describe('after load', () => {
        beforeEach(async () => {
            await ctx.create();
        });

        benchmark('1x legend toggle', ctx, { expectedRelativeMB: 1, expectedCanvasCount: 32 }, async () => {
            await ctx.legendToggle();
            await ctx.legendToggle();
        });

        benchmark('4x legend toggle', ctx, { expectedRelativeMB: 1, expectedCanvasCount: 32 }, async () => {
            for (let i = 0; i < 2; i++) {
                await ctx.legendToggle(i);
                await ctx.legendToggle(i);
            }
        });
    });
});
