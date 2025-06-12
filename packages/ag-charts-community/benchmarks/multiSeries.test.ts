import { beforeEach, describe } from '@jest/globals';

import { AgCartesianChartOptions } from '../src/main';
import { addSeriesNodePoints, benchmark, setupBenchmark } from './benchmark';

describe('multi-series benchmark', () => {
    const ctx = setupBenchmark<AgCartesianChartOptions>('multi-series');

    benchmark('initial load', ctx, { expectedRelativeMB: 75, expectedCanvasCount: 32 }, async () => {
        await ctx.create();
    });

    describe('after load', () => {
        beforeEach(async () => {
            await ctx.create();
            await addSeriesNodePoints(ctx, 2, 5);
            await addSeriesNodePoints(ctx, 3, 5);
            await addSeriesNodePoints(ctx, 5, 5);
        });

        benchmark('1x legend toggle', ctx, { expectedRelativeMB: 65, expectedCanvasCount: 32 }, async () => {
            await ctx.legendToggle();
            await ctx.legendToggle();
        });

        benchmark('10x legend toggle', ctx, { expectedRelativeMB: 65, expectedCanvasCount: 32 }, async () => {
            for (let i = 0; i < 5; i++) {
                await ctx.legendToggle(i);
                await ctx.legendToggle(i);
            }
        });

        benchmark('1x datum highlight', ctx, { expectedRelativeMB: 65, expectedCanvasCount: 32 }, async () => {
            const point = ctx.nodePositions[0][2];
            await ctx.hover(point.x, point.y);
            await ctx.waitForUpdate();
        });

        benchmark('15x datum highlight', ctx, { expectedRelativeMB: 65, expectedCanvasCount: 32 }, async () => {
            for (let nodeIdx = 0; nodeIdx < 5; nodeIdx++) {
                for (let seriesIdx = 0; seriesIdx < 3; seriesIdx++) {
                    const point = ctx.nodePositions[seriesIdx][nodeIdx];
                    await ctx.hover(point.x, point.y);
                    await ctx.waitForUpdate();
                }
            }
        });
    });
});
