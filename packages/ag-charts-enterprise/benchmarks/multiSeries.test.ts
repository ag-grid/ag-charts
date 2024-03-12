import { beforeEach, describe } from '@jest/globals';

// eslint-disable-next-line @nx/enforce-module-boundaries
import { benchmark, setupBenchmark } from '../../ag-charts-community/benchmarks/benchmark';
import { AgCartesianChartOptions, AgCharts } from '../src/main';

/** Placeholder tests until we have real tests for Enterprise. */
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
    });
});
