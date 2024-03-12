import { beforeEach, describe } from '@jest/globals';

import { AgCartesianChartOptions } from '../src/main';
import { benchmark, setupBenchmark } from './benchmark';

describe('integrated charts large scale benchmark', () => {
    const ctx = setupBenchmark<AgCartesianChartOptions>('integrated-large-scale');

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

        benchmark('4x legend toggle', ctx, async () => {
            for (let i = 0; i < 2; i++) {
                for (const visible of [false, true]) {
                    ctx.options.series![i].visible = visible;
                    ctx.update();
                    await ctx.waitForUpdate();
                }
            }
        });
    });
});
