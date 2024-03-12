import { describe } from '@jest/globals';

import { hoverAction } from '../src/chart/test/utils';
import { AgCartesianChartOptions } from '../src/main';
import { addSeriesNodePoints, benchmark, setupBenchmark } from './benchmark';

describe('large-dataset benchmark', () => {
    const ctx = setupBenchmark<AgCartesianChartOptions>('large-dataset');

    benchmark('initial load', ctx, async () => {
        ctx.create();
        await ctx.waitForUpdate();
    });

    describe('after load', () => {
        beforeEach(async () => {
            ctx.create();
            await ctx.waitForUpdate();
            addSeriesNodePoints(ctx, 0, 4);
        });

        benchmark('1x legend toggle', ctx, async () => {
            ctx.options.series![0].visible = false;
            ctx.update();
            await ctx.waitForUpdate();

            ctx.options.series![0].visible = true;
            ctx.update();
            await ctx.waitForUpdate();
        });

        benchmark('1x datum highlight', ctx, async () => {
            const point = ctx.nodePositions[0][1];
            await hoverAction(point.x, point.y)(ctx.chart);
            await ctx.waitForUpdate();
        });

        benchmark('4x datum highlight', ctx, async () => {
            for (const point of ctx.nodePositions[0]) {
                await hoverAction(point.x, point.y)(ctx.chart);
                await ctx.waitForUpdate();
            }
        });
    });
});
