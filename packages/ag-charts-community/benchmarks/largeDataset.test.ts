import { describe } from '@jest/globals';

import { AgCharts } from '../src/main';
import { benchmark, setupBenchmark } from './benchmark';

describe('large-dataset benchmark', () => {
    const ctx = setupBenchmark('large-dataset');

    benchmark('initial load', ctx, async () => {
        ctx.chart = AgCharts.create(ctx.options);
        await (ctx.chart as any).chart.waitForUpdate();
    });

    // describe('after load', () => {
    //     beforeAll(async () => {
    //         ctx.chart = AgCharts.create(ctx.options);
    //         await (ctx.chart as any).chart.waitForUpdate();
    //     });

    //     benchmark('legend toggle', ctx, async () => {
    //         ctx.options.series![0].visible = false;
    //         AgCharts.update(ctx.chart, ctx.options);
    //         await (ctx.chart as any).chart.waitForUpdate();
    //     });

    //     benchmark('3x legend toggle', ctx, async () => {
    //         for (let i = 0; i < 5; i++) {
    //             for (const visible of [false, true]) {
    //                 ctx.options.series![i].visible = visible;
    //                 AgCharts.update(ctx.chart, ctx.options);
    //                 await (ctx.chart as any).chart.waitForUpdate();
    //             }
    //         }
    //     });
    // });
});
