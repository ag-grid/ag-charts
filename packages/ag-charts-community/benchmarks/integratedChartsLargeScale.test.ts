import { beforeEach, describe } from '@jest/globals';

import { AgCartesianChartOptions } from '../src/main';
import { benchmark, setupBenchmark } from './benchmark';

const EXPECTATIONS = {
    expectedMaxMemoryMB: 280,
};

describe('integrated charts large scale benchmark', () => {
    const ctx = setupBenchmark<AgCartesianChartOptions>('integrated-large-scale');

    benchmark('initial load', ctx, EXPECTATIONS, async () => {
        await await ctx.create();
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

        benchmark('4x legend toggle', ctx, EXPECTATIONS, async () => {
            for (let i = 0; i < 2; i++) {
                for (const visible of [false, true]) {
                    ctx.options.series![i].visible = visible;
                    await ctx.update();
                }
            }
        });
    });
});
