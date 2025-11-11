import { beforeEach, describe } from '@jest/globals';

import { AgCartesianChartOptions } from 'ag-charts-types';

import { addSeriesNodePoints, benchmark, setupBenchmark } from './benchmark';

describe('large-dataset benchmark', () => {
    const ctx = setupBenchmark<AgCartesianChartOptions>('large-dataset');

    benchmark(
        'initial load',
        ctx,
        { expectedRetainedSizeMB: 210, expectedCanvasCount: 5 },
        async () => await ctx.create(),
        15_000
    );

    describe('after load', () => {
        beforeEach(async () => {
            await ctx.create();
            await addSeriesNodePoints(ctx, 0, 4);
        }, 1_000);

        benchmark(
            '1x legend toggle',
            ctx,
            { expectedRelativeMB: 40, expectedCanvasCount: 6 },
            async () => {
                await ctx.legendToggle();
                await ctx.legendToggle();
            },
            15_000
        );

        benchmark(
            '1x datum highlight',
            ctx,
            { expectedRelativeMB: 26, expectedCanvasCount: 6 },
            async () => {
                const point = ctx.nodePositions[0][1];
                await ctx.hover(point.x, point.y);
            },
            15_000
        );

        benchmark(
            '4x datum highlight',
            ctx,
            { expectedRelativeMB: 26, expectedCanvasCount: 6 },
            async () => {
                for (const point of ctx.nodePositions[0]) {
                    await ctx.hover(point.x, point.y);
                }
            },
            30_000
        );
    });
});
