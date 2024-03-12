import { beforeEach, describe } from '@jest/globals';

import { hoverAction } from '../src/chart/test/utils';
import { AgCartesianChartOptions } from '../src/main';
import { addSeriesNodePoints, benchmark, setupBenchmark } from './benchmark';

describe('multi-series benchmark', () => {
    const ctx = setupBenchmark<AgCartesianChartOptions>('multi-series');

    benchmark('initial load', ctx, async () => {
        ctx.create();
        await ctx.waitForUpdate();
    });

    describe('after load', () => {
        beforeEach(async () => {
            ctx.create();
            await ctx.waitForUpdate();
            addSeriesNodePoints(ctx, 2, 5);
            addSeriesNodePoints(ctx, 3, 5);
            addSeriesNodePoints(ctx, 5, 5);
        });

        benchmark('1x legend toggle', ctx, async () => {
            ctx.options.series![0].visible = false;
            ctx.update();
            await ctx.waitForUpdate();

            ctx.options.series![0].visible = true;
            ctx.update();
            await ctx.waitForUpdate();
        });

        benchmark('10x legend toggle', ctx, async () => {
            for (let i = 0; i < 5; i++) {
                for (const visible of [false, true]) {
                    ctx.options.series![i].visible = visible;
                    ctx.update();
                    await ctx.waitForUpdate();
                }
            }
        });

        benchmark('1x datum highlight', ctx, async () => {
            const point = ctx.nodePositions[0][2];
            await hoverAction(point.x, point.y)(ctx.chart);
            await ctx.waitForUpdate();
        });

        benchmark('15x datum highlight', ctx, async () => {
            for (let nodeIdx = 0; nodeIdx < 5; nodeIdx++) {
                for (let seriesIdx = 0; seriesIdx < 3; seriesIdx++) {
                    const point = ctx.nodePositions[seriesIdx][nodeIdx];
                    await hoverAction(point.x, point.y)(ctx.chart);
                    await ctx.waitForUpdate();
                }
            }
        });
    });
});
