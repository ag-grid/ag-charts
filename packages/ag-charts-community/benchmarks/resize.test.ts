import { beforeEach, describe } from '@jest/globals';

import { AgCartesianChartOptions } from '../src/main';
import { benchmark, setupBenchmark } from './benchmark';
import { isAtOrAfterVersion } from './compatibility';

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
            delete ctx.options.width;
            delete ctx.options.height;

            await ctx.create();
        });

        benchmark('10x resize', ctx, EXPECTATIONS, async () => {
            const height = 600;
            const ratios = [0.9, 0.8, 0.7, 0.6, 0.5];
            const method = isAtOrAfterVersion(10, 0, 0) ? 'parentResize' : 'rawResize';

            for (let i = 0; i < 10; i++) {
                (ctx.chart as any).chart[method]({ width: 800, height: height * ratios[i % ratios.length] });

                await ctx.waitForUpdate();
            }
        });
    });
});
