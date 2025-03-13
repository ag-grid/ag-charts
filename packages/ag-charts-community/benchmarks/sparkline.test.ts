import { beforeEach, describe } from '@jest/globals';

import { AgCartesianChartOptions } from '../src/main';
import { benchmark, setupBenchmark } from './benchmark';
import { isAtOrAfterVersion } from './compatibility';

let suite: any = describe;
if (!isAtOrAfterVersion(11, 0, 0)) {
    suite = describe.skip;
}

suite('sparkline benchmark', () => {
    const ctx = setupBenchmark<AgCartesianChartOptions>('simple-sparkline', {
        createApi: '__createSparkline',
    }).repeatCount(500);

    benchmark('initial load', ctx, { expectedRelativeMB: 10, expectedCanvasCount: 2 }, async () => {
        await ctx.create({ pool: false });
    });

    benchmark(
        'initial load (pooled)',
        ctx,
        { expectedRelativeMB: 3, expectedCanvasCount: 1, autoSnapshot: false },
        async () => {
            await ctx.create({ container: document.createElement('div') });
        }
    );

    describe('after load', () => {
        beforeEach(async () => {
            await ctx.create();
        });

        benchmark('update', ctx, { expectedRelativeMB: 0.9, expectedCanvasCount: 0, autoSnapshot: false }, async () => {
            ctx.options.data = ctx.options.data?.map((d) => ({ x: d.x, y: Math.random() * d.y }));
            await ctx.update();
        });

        benchmark(
            'updateDelta',
            ctx,
            { expectedRelativeMB: 0.5, expectedCanvasCount: 0, autoSnapshot: false },
            async () => {
                await ctx.updateDelta({
                    data: ctx.options.data?.map((d) => ({ x: d.x, y: Math.random() * d.y })),
                });
            }
        );
    });
});
