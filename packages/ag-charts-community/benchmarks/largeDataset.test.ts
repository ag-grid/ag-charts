import { describe } from '@jest/globals';

import { hoverAction } from '../src/chart/test/utils';
import { AgCartesianChartOptions } from '../src/main';
import { addSeriesNodePoints, benchmark, setupBenchmark } from './benchmark';

describe('large-dataset benchmark', () => {
    const ctx = setupBenchmark<AgCartesianChartOptions>('large-dataset');

    benchmark('initial load', ctx, { expectedRelativeMB: 760, expectedCanvasCount: 9 }, async () => {
        await ctx.create();
    });

    describe('after load', () => {
        beforeEach(async () => {
            await ctx.create();
            await addSeriesNodePoints(ctx, 0, 4);
        }, 10_000);

        benchmark(
            '1x legend toggle',
            ctx,
            { expectedRelativeMB: 160, expectedCanvasCount: 9 },
            async () => {
                ctx.options.series![0].visible = false;
                await ctx.update();

                ctx.options.series![0].visible = true;
                await ctx.update();
            },
            15_000
        );

        benchmark('1x datum highlight', ctx, { expectedRelativeMB: 45, expectedCanvasCount: 9 }, async () => {
            const point = ctx.nodePositions[0][1];
            await hoverAction(point.x, point.y)(ctx.chart);
            await ctx.waitForUpdate();
        });

        benchmark(
            '4x datum highlight',
            ctx,
            { expectedRelativeMB: 45, expectedCanvasCount: 9 },
            async () => {
                for (const point of ctx.nodePositions[0]) {
                    await hoverAction(point.x, point.y)(ctx.chart);
                    await ctx.waitForUpdate();
                }
            },
            20_000
        );
    });
});
