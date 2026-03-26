import type { AgCartesianChartOptions } from 'ag-charts-types';

import { benchmark, setupBenchmark } from './benchmark';

const expectations = { expectedRelativeMB: 2, expectedCanvasCount: 1, autoSnapshot: false };

describe('baseline benchmark', () => {
    const ctx = setupBenchmark<AgCartesianChartOptions>('simple-chart').repeatCount(10);

    benchmark('array push and truncate x1M', ctx, expectations, () => {
        const arr: number[] = [];
        for (let i = 0; i < 1_000_000; i++) {
            arr.push(i);
        }
        arr.splice(0, arr.length);
    });

    benchmark('json parse and stringify x10K', ctx, expectations, () => {
        for (let i = 0; i < 10000; i++) {
            JSON.parse(JSON.stringify(ctx.options));
        }
    });

    benchmark('Math.sqrt() x10K', ctx, expectations, () => {
        for (let i = 0; i < 10000; i++) {
            expect(Math.sqrt(i)).toBeDefined();
        }
    });

    benchmark('Math.random() x10K', ctx, expectations, () => {
        for (let i = 0; i < 10000; i++) {
            expect(Math.random()).toBeDefined();
        }
    });
});
