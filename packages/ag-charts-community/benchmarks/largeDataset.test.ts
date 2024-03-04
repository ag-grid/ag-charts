import { describe } from '@jest/globals';

import { AgCharts } from '../src/main';
import { benchmark, setupBenchmark } from './benchmark';

describe('large-dataset benchmark', () => {
    const ctx = setupBenchmark('large-dataset');

    benchmark('initial load', ctx, async () => {
        ctx.chart = AgCharts.create(ctx.options);
        await (ctx.chart as any).chart.waitForUpdate();
    });
});
