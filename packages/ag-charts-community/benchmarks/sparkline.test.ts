import { beforeEach, describe } from '@jest/globals';

import { AgCartesianChartOptions } from '../src/main';
import { benchmark, setupBenchmark } from './benchmark';

const EXPECTATIONS = {
    expectedMaxMemoryMB: 2048,
};

describe('sparkline benchmark', () => {
    const ctx = setupBenchmark<AgCartesianChartOptions>('simple-sparkline', {
        createApi: '__createSparkline',
    }).repeatCount(500);

    benchmark('initial load', ctx, EXPECTATIONS, async () => {
        await ctx.create({ pool: false });
    });

    benchmark('initial load (pooled)', ctx, { ...EXPECTATIONS, autoSnapshot: false }, async () => {
        await ctx.create();
    });

    describe('after load', () => {
        beforeEach(async () => {
            await ctx.create();
        });

        benchmark('update', ctx, { ...EXPECTATIONS, autoSnapshot: false }, async () => {
            ctx.options.data = ctx.options.data?.map((d) => ({ x: d.x, y: Math.random() * d.y }));
            await ctx.update();
        });

        benchmark('updateDelta', ctx, { ...EXPECTATIONS, autoSnapshot: false }, async () => {
            await ctx.updateDelta({
                data: ctx.options.data?.map((d) => ({ x: d.x, y: Math.random() * d.y })),
            });
        });
    });
});
