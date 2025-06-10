import { beforeEach, describe } from '@jest/globals';

import { AgCartesianChartOptions } from '../src/main';
import { benchmark, setupBenchmark } from './benchmark';

describe('simple-chart benchmark', () => {
    const ctx = setupBenchmark<AgCartesianChartOptions>('simple-chart').repeatCount(10);

    benchmark('initial load', ctx, { expectedRelativeMB: 18, expectedCanvasCount: 4 }, async () => {
        await ctx.create();
    });

    describe('after load', () => {
        beforeEach(async () => {
            await ctx.create();
        });

        benchmark('1x legend toggle', ctx, { expectedRelativeMB: 5, expectedCanvasCount: 3 }, async () => {
            await ctx.legendToggle();
            await ctx.legendToggle();
        });

        benchmark('10x legend toggle', ctx, { expectedRelativeMB: 5.2, expectedCanvasCount: 3 }, async () => {
            for (let i = 0; i < 5; i++) {
                await ctx.legendToggle(i);
                await ctx.legendToggle(i);
            }
        });

        // benchmark('1x datum highlight', ctx, EXPECTATIONS, async () => {
        //     const point = (ctx.chart as any).chart.series;
        //     await hoverAction(point.x, point.y)(ctx.chart);
        //     await ctx.waitForUpdate();
        // });

        // benchmark('15x datum highlight', ctx, EXPECTATIONS, async () => {
        //     for (let nodeIdx = 0; nodeIdx < 5; nodeIdx++) {
        //         for (let seriesIdx = 0; seriesIdx < 3; seriesIdx++) {
        //             const point = ctx.nodePositions[seriesIdx][nodeIdx];
        //             await hoverAction(point.x, point.y)(ctx.chart);
        //             await ctx.waitForUpdate();
        //         }
        //     }
        // });
    });
});
