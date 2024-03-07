import { beforeEach, describe } from '@jest/globals';

// eslint-disable-next-line @nx/enforce-module-boundaries
import { benchmark, setupBenchmark } from '../../ag-charts-community/benchmarks/benchmark';
import { AgCharts } from '../src/main';

/** Placeholder tests until we have real tests for Enterprise. */
describe('multi-series benchmark', () => {
    const ctx = setupBenchmark('multi-series');

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

        benchmark('10x legend toggle', ctx, async () => {
            for (let i = 0; i < 5; i++) {
                for (const visible of [false, true]) {
                    ctx.options.series![i].visible = visible;
                    AgCharts.update(ctx.chart, ctx.options);
                    await (ctx.chart as any).chart.waitForUpdate();
                }
            }
        });
    });
});
