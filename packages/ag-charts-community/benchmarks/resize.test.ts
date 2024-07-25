import { beforeEach, describe } from '@jest/globals';

import { AgCartesianChartOptions } from '../src/main';
import { benchmark, setupBenchmark } from './benchmark';

const EXPECTATIONS = {
    expectedMaxMemoryMB: 270,
};

describe('resize benchmark', () => {
    const ctx = setupBenchmark<AgCartesianChartOptions>('resize');

    benchmark('initial load', ctx, EXPECTATIONS, async () => {
        await ctx.create();
    });

    describe('after load', () => {
        beforeEach(async () => {
            await ctx.create();
        });

        benchmark('10x resize', ctx, EXPECTATIONS, async () => {
            const height = ctx.options.height ?? 600;
            const ratios = [0.9, 0.8, 0.7, 0.6, 0.5];

            for (let i = 0; i < 10; i++) {
                ctx.options.height = height * ratios[i % ratios.length];
                await ctx.update();
            }
        });
    });
});
