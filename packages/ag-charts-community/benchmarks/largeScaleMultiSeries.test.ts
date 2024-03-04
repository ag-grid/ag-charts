import { beforeEach, describe } from '@jest/globals';

import { AgCharts } from '../src/main';
import { benchmark, setupBenchmark } from './benchmark';

describe('large-scale multi-series benchmark', () => {
    const ctx = setupBenchmark('large-scale-multi-series');

    benchmark('initial load', ctx, async () => {
        ctx.chart = AgCharts.create(ctx.options);
        await (ctx.chart as any).chart.waitForUpdate();
    });

    describe('after load', () => {
        beforeEach(async () => {
            ctx.chart = AgCharts.create(ctx.options);
            await (ctx.chart as any).chart.waitForUpdate();
        });

        benchmark('1x legend toggle', ctx, async () => {
            ctx.options.series![0].visible = false;
            AgCharts.update(ctx.chart, ctx.options);
            await (ctx.chart as any).chart.waitForUpdate();

            ctx.options.series![0].visible = true;
            AgCharts.update(ctx.chart, ctx.options);
            await (ctx.chart as any).chart.waitForUpdate();
        });

        benchmark('4x legend toggle', ctx, async () => {
            for (let i = 0; i < 2; i++) {
                for (const visible of [false, true]) {
                    ctx.options.series![i].visible = visible;
                    AgCharts.update(ctx.chart, ctx.options);
                    await (ctx.chart as any).chart.waitForUpdate();
                }
            }
        });
    });
});
