import { beforeEach, describe } from '@jest/globals';

import { AgCartesianChartOptions } from 'ag-charts-types';

import { benchmark, setupBenchmark } from './benchmark';

describe('large-scale multi-series benchmark', () => {
    const ctx = setupBenchmark<AgCartesianChartOptions>('large-scale-multi-series').repeatCount(10);

    benchmark('initial load', ctx, { expectedRelativeMB: 301, expectedCanvasCount: 4 }, async () => {
        await ctx.create();
    });

    describe('after load', () => {
        beforeEach(async () => {
            await ctx.create();
        });

        benchmark('1x legend toggle', ctx, { expectedRelativeMB: 8, expectedCanvasCount: 3 }, async () => {
            await ctx.legendToggle();
            await ctx.legendToggle();
        });

        benchmark('4x legend toggle', ctx, { expectedRelativeMB: 8, expectedCanvasCount: 3 }, async () => {
            for (let i = 0; i < 2; i++) {
                await ctx.legendToggle(i);
                await ctx.legendToggle(i);
            }
        });
    });
});
