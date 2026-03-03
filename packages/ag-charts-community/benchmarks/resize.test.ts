import { beforeEach, describe } from '@jest/globals';

import type { AgCartesianChartOptions } from 'ag-charts-types';

import { benchmark, setupBenchmark } from './benchmark';
import { isAtOrAfterVersion } from './compatibility';

describe('resize benchmark', () => {
    const ctx = setupBenchmark<AgCartesianChartOptions>('resize').repeatCount(20);

    benchmark('initial load', ctx, { expectedRetainedSizeMB: 7, expectedCanvasCount: 4 }, async () => {
        await ctx.create();
    });

    describe('after load', () => {
        beforeEach(async () => {
            delete ctx.options.width;
            delete ctx.options.height;

            if (!isAtOrAfterVersion(10, 0, 0)) {
                (ctx.options as any).autoSize = true;
            }

            await ctx.create();
        });

        benchmark('10x resize', ctx, { expectedRelativeMB: 1, expectedCanvasCount: 3 }, async () => {
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
