import { beforeEach, describe } from '@jest/globals';

import { AgCartesianChartOptions } from 'ag-charts-types';

import { addSeriesNodePoints, benchmark, setupBenchmark } from './benchmark';

describe('simple-chart benchmark', () => {
    const ctx = setupBenchmark<AgCartesianChartOptions>('simple-chart').repeatCount(20);

    benchmark('initial load', ctx, { expectedRetainedSizeMB: 8.5, expectedCanvasCount: 5 }, async () => {
        await ctx.create();
    });

    describe('after load', () => {
        beforeEach(async () => {
            await ctx.create();
            await addSeriesNodePoints(ctx, 0, 5);
            await addSeriesNodePoints(ctx, 1, 5);
            await addSeriesNodePoints(ctx, 2, 5);
        });

        afterEach(async () => {
            await ctx.blur();
        });

        benchmark('1x legend toggle', ctx, { expectedRelativeMB: 3.8, expectedCanvasCount: 6 }, async () => {
            await ctx.legendToggle();
            await ctx.legendToggle();
        });

        benchmark('10x legend toggle', ctx, { expectedRelativeMB: 1.9, expectedCanvasCount: 6 }, async () => {
            for (let i = 0; i < 5; i++) {
                await ctx.legendToggle(i);
                await ctx.legendToggle(i);
            }
        });

        benchmark('1x datum highlight', ctx, { expectedRelativeMB: 1.9, expectedCanvasCount: 6 }, async () => {
            const point = ctx.nodePositions[0][1];
            await ctx.hover(point.x, point.y);
        });

        benchmark('15x datum highlight', ctx, { expectedRelativeMB: 1.9, expectedCanvasCount: 6 }, async () => {
            for (let nodeIdx = 0; nodeIdx < 5; nodeIdx++) {
                for (let seriesIdx = 0; seriesIdx < 3; seriesIdx++) {
                    const point = ctx.nodePositions[seriesIdx][nodeIdx];
                    await ctx.hover(point.x, point.y);
                }
            }
        });
    });
});
