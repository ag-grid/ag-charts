import { beforeEach, describe } from '@jest/globals';

import { AgCartesianChartOptions } from 'ag-charts-types';

import { addSeriesNodePoints, benchmark, setupBenchmark } from './benchmark';

describe('multi-series benchmark', () => {
    const ctx = setupBenchmark<AgCartesianChartOptions>('multi-series').repeatCount(20);

    benchmark('initial load', ctx, { expectedRetainedSizeMB: 12.5, expectedCanvasCount: 4 }, async () => {
        await ctx.create();
    });

    describe('after load', () => {
        beforeEach(async () => {
            await ctx.create();
            await addSeriesNodePoints(ctx, 2, 5);
            await addSeriesNodePoints(ctx, 3, 5);
            await addSeriesNodePoints(ctx, 5, 5);
        });

        benchmark('1x legend toggle', ctx, { expectedRelativeMB: 1, expectedCanvasCount: 4 }, async () => {
            await ctx.legendToggle();
            await ctx.legendToggle();
        });

        benchmark('10x legend toggle', ctx, { expectedRelativeMB: 1, expectedCanvasCount: 4 }, async () => {
            for (let i = 0; i < 5; i++) {
                await ctx.legendToggle(i);
                await ctx.legendToggle(i);
            }
        });

        benchmark('1x datum highlight', ctx, { expectedRelativeMB: 1, expectedCanvasCount: 4 }, async () => {
            const point = ctx.nodePositions[0][2];
            await ctx.hover(point.x, point.y);
        });

        benchmark('15x datum highlight', ctx, { expectedRelativeMB: 1, expectedCanvasCount: 4 }, async () => {
            for (let nodeIdx = 0; nodeIdx < 5; nodeIdx++) {
                for (let seriesIdx = 0; seriesIdx < 3; seriesIdx++) {
                    const point = ctx.nodePositions[seriesIdx][nodeIdx];
                    await ctx.hover(point.x, point.y);
                }
            }
        });
    });
});
