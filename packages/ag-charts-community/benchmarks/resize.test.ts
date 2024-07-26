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
        let container: HTMLElement | undefined;

        beforeEach(async () => {
            delete ctx.options.width;
            delete ctx.options.height;

            await ctx.create();
        });

        benchmark('10x resize', ctx, EXPECTATIONS, async () => {
            const height = 600;
            const ratios = [0.9, 0.8, 0.7, 0.6, 0.5];

            for (let i = 0; i < 10; i++) {
                (ctx.chart as any).chart.parentResize({ width: 800, height: height * ratios[i % ratios.length] });

                await ctx.waitForUpdate();
            }
        });
    });
});
