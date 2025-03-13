import { describe } from '@jest/globals';

import { scrollAction } from '../../ag-charts-community/src/chart/test/utils';
import { AgCartesianChartOptions } from '../src/main';
import { benchmark, setupBenchmark } from './benchmark';

describe('zoom-large-dataset benchmark', () => {
    const ctx = setupBenchmark<AgCartesianChartOptions>('enterprise-1M-line-series', { isEnterprise: true });

    benchmark('initial load', ctx, { expectedMaxMemoryMB: 390, autoSnapshot: false }, async () => {
        await ctx.create();
    });

    describe('after load', () => {
        beforeEach(async () => {
            await ctx.create();
        });

        benchmark(
            '100x zoom',
            ctx,
            { expectedMaxMemoryMB: 560, autoSnapshot: false },
            async () => {
                const zoomIn = scrollAction(ctx.options.width! / 2, ctx.options.height! / 2, -1, 0);
                for (let i = 0; i < 100; i++) {
                    await zoomIn(ctx.chart!);
                    await ctx.waitForUpdate();
                }
            },
            30_000
        );
    });
});
