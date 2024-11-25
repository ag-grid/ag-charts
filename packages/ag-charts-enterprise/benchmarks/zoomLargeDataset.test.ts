import { describe } from '@jest/globals';

import { scrollAction } from '../../ag-charts-community/src/chart/test/utils';
import { AgCartesianChartOptions } from '../src/main';
import { benchmark, setupBenchmark } from './benchmark';

const EXPECTATIONS = {
    expectedMaxMemoryMB: 945,
};

describe('large-dataset benchmark', () => {
    const ctx = setupBenchmark<AgCartesianChartOptions>('enterprise-1M-line-series', { isEnterprise: true });

    benchmark('initial load', ctx, EXPECTATIONS, async () => {
        await ctx.create();
    });

    describe('after load', () => {
        beforeEach(async () => {
            await ctx.create();
        });

        benchmark(
            '100x zoom',
            ctx,
            EXPECTATIONS,
            async () => {
                const zoomIn = scrollAction(ctx.options.width! / 2, ctx.options.height! / 2, -1, 0);
                for (let i = 0; i < 100; i++) {
                    await zoomIn(ctx.chart!);
                    await ctx.waitForUpdate();
                }
            },
            20_000
        );
    });
});
