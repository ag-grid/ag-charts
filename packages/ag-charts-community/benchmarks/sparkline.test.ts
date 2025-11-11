import { beforeEach, describe as jestDescribe } from '@jest/globals';

import { AgCartesianChartOptions } from 'ag-charts-types';

import { benchmark, setupBenchmark } from './benchmark';
import { isAtOrAfterVersion } from './compatibility';

let describe: any = jestDescribe;
if (!isAtOrAfterVersion(11, 0, 0)) {
    describe = jestDescribe.skip;
}

describe('sparkline benchmark', () => {
    const ctx = setupBenchmark<AgCartesianChartOptions>('simple-sparkline', {
        createApi: '__createSparkline',
    }).repeatCount(500);

    benchmark(
        'initial load',
        ctx,
        { expectedRetainedSizeMB: 6, expectedCanvasCount: 2 },
        async () => {
            await ctx.create({ pool: false });
        },
        40_000
    );

    benchmark(
        'initial load (pooled)',
        ctx,
        { expectedRelativeMB: 6, expectedCanvasCount: 2, autoSnapshot: false },
        async () => {
            await ctx.create({ container: document.createElement('div') });
        },
        40_000
    );

    describe('after load', () => {
        beforeEach(async () => {
            await ctx.create();
        });

        benchmark('update', ctx, { expectedRelativeMB: 1, expectedCanvasCount: 2, autoSnapshot: false }, async () => {
            ctx.options.data = ctx.options.data?.map((d) => ({ x: d.x, y: Math.random() * d.y }));
            await ctx.update();
        });

        benchmark(
            'updateDelta',
            ctx,
            { expectedRelativeMB: 1, expectedCanvasCount: 2, autoSnapshot: false },
            async () => {
                await ctx.updateDelta({
                    data: ctx.options.data?.map((d) => ({ x: d.x, y: Math.random() * d.y })),
                });
            }
        );
    });
});
