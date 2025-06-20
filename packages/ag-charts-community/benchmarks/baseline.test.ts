import { AgCartesianChartOptions } from 'ag-charts-types';

import { benchmark, setupBenchmark } from './benchmark';

const expectations = { expectedRelativeMB: 15, expectedCanvasCount: 0, autoSnapshot: false };

describe('baseline benchmark', () => {
    const ctx = setupBenchmark<AgCartesianChartOptions>('simple-chart').repeatCount(500);

    benchmark('array push and truncate', ctx, expectations, () => {
        const arr: number[] = [];
        for (let i = 0; i < 1000000; i++) {
            arr.push(i);
        }
        arr.splice(0, arr.length);
    });

    benchmark('json parse and stringify', ctx, expectations, () => {
        JSON.parse(JSON.stringify(ctx.options));
    });

    benchmark('Math.sqrt()', ctx, expectations, () => {
        for (let i = 0; i < 1000000; i++) {
            expect(Math.sqrt(i)).toBeDefined();
        }
    });

    benchmark('Math.random()', ctx, expectations, () => {
        for (let i = 0; i < 1000000; i++) {
            expect(Math.random()).toBeDefined();
        }
    });
});
