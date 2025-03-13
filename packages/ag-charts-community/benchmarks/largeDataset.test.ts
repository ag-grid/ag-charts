import { describe } from '@jest/globals';

import { hoverAction } from '../src/chart/test/utils';
import { AgCartesianChartOptions } from '../src/main';
import { addSeriesNodePoints, benchmark, setupBenchmark } from './benchmark';

describe('large-dataset benchmark', () => {
    const ctx = setupBenchmark<AgCartesianChartOptions>('large-dataset');

    benchmark('initial load', ctx, { expectedMaxMemoryMB: 945 }, async () => {
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
            { expectedMaxMemoryMB: 1500 },
            async () => {
                ctx.options.series![0].visible = false;
                await ctx.update();

                ctx.options.series![0].visible = true;
                await ctx.update();
            },
            15_000
        );

        benchmark('1x datum highlight', ctx, { expectedMaxMemoryMB: 970 }, async () => {
            const point = ctx.nodePositions[0][1];
            await hoverAction(point.x, point.y)(ctx.chart);
            await ctx.waitForUpdate();
        });

        benchmark(
            '4x datum highlight',
            ctx,
            { expectedMaxMemoryMB: 960 },
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
