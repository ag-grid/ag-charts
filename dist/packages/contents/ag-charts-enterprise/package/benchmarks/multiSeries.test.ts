import { beforeEach, describe } from '@jest/globals';

// eslint-disable-next-line @nx/enforce-module-boundaries
import { benchmark, setupBenchmark } from '../../ag-charts-community/benchmarks/benchmark';
import { AgCartesianChartOptions } from '../src/main';

const EXPECTATIONS = {
    expectedMaxMemoryMB: 270,
};

/** Placeholder tests until we have real tests for Enterprise. */
describe('multi-series benchmark', () => {
    const ctx = setupBenchmark<AgCartesianChartOptions>('multi-series');

    benchmark('initial load', ctx, EXPECTATIONS, async () => {
        await ctx.create();
    });

    describe('after load', () => {
        beforeEach(async () => {
            await ctx.create();
        });

        benchmark('1x legend toggle', ctx, EXPECTATIONS, async () => {
            ctx.options.series![0].visible = false;
            await ctx.update();

            ctx.options.series![0].visible = true;
            await ctx.update();
        });

        benchmark('10x legend toggle', ctx, EXPECTATIONS, async () => {
            for (let i = 0; i < 5; i++) {
                for (const visible of [false, true]) {
                    ctx.options.series![i].visible = visible;
                    await ctx.update();
                }
            }
        });
    });
});
