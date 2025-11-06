import { describe as jestDescribe } from '@jest/globals';

import type { AgCartesianChartOptions } from 'ag-charts-types';

import { benchmark, setupBenchmark } from './benchmark';
import { isAtOrAfterVersion } from './compatibility';

const describeWhenSupported = isAtOrAfterVersion(12, 3, 0) ? jestDescribe : jestDescribe.skip;

describeWhenSupported('high-frequency data line benchmark', () => {
    const ctx = setupBenchmark<AgCartesianChartOptions>('high-freq-line');

    type Datum = {
        timestamp: number;
        value: number;
    };

    const INITIAL_POINTS = 100_000;
    const BATCH_SIZE = 100;
    const DATA_INTERVAL_MS = 250;
    const START_TIMESTAMP = Date.UTC(2024, 0, 1, 0, 0, 0);

    class HighFrequencyLineDataGenerator {
        private index = 0;

        reset() {
            this.index = 0;
        }

        take(count: number): Datum[] {
            const batch: Datum[] = [];
            for (let i = 0; i < count; i++) {
                batch.push(this.next());
            }
            return batch;
        }

        private next(): Datum {
            const index = this.index++;
            const timestamp = START_TIMESTAMP + index * DATA_INTERVAL_MS;
            const trend = Math.sin(index / 240) * 40 + Math.cos(index / 80) * 25;
            const volatility = Math.sin(index / 15) * 5;
            const baseline = 1_000 + index * 0.02;

            return {
                timestamp,
                value: Number((baseline + trend + volatility).toFixed(2)),
            };
        }
    }

    const lineDataGenerator = new HighFrequencyLineDataGenerator();

    let data: Datum[] = [];

    function createSeedData(count: number): Datum[] {
        lineDataGenerator.reset();
        return lineDataGenerator.take(count);
    }

    function createBatch(count: number): Datum[] {
        return lineDataGenerator.take(count);
    }

    beforeEach(() => {
        data = createSeedData(INITIAL_POINTS);
    });

    describe('applyTransaction updates', () => {
        beforeEach(async () => {
            ctx.options.data = data;
            await ctx.create();
        });

        benchmark(
            '1x append batch (100 points)',
            ctx,
            { expectedRelativeMB: 0.5, expectedCanvasCount: 2, autoSnapshot: false },
            async () => {
                const append = createBatch(BATCH_SIZE);
                data = data.concat(append);
                await (ctx.chart as any).applyTransaction({ append });
            },
            15_000
        );

        benchmark(
            '10x append batch (1k points total)',
            ctx.repeatCount(10),
            { expectedRelativeMB: 0.5, expectedCanvasCount: 2, autoSnapshot: false },
            async () => {
                const append = createBatch(BATCH_SIZE);
                data = data.concat(append);
                await (ctx.chart as any).applyTransaction({ append });
            },
            30_000
        );

        benchmark(
            '1x remove batch (100 points)',
            ctx,
            { expectedRelativeMB: 0.5, expectedCanvasCount: 2, autoSnapshot: false },
            async () => {
                const remove = data.slice(0, BATCH_SIZE);
                data = data.slice(BATCH_SIZE);
                await (ctx.chart as any).applyTransaction({ remove });
            },
            15_000
        );

        benchmark(
            '1x rolling window update (append + remove)',
            ctx,
            { expectedRelativeMB: 0.5, expectedCanvasCount: 2, autoSnapshot: false },
            async () => {
                const remove = data.slice(0, BATCH_SIZE);
                const append = createBatch(BATCH_SIZE);
                data = data.slice(BATCH_SIZE).concat(append);
                await (ctx.chart as any).applyTransaction({ append, remove });
            },
            15_000
        );

        benchmark(
            '10x rolling window update (append + remove)',
            ctx.repeatCount(10),
            { expectedRelativeMB: 0.5, expectedCanvasCount: 2, autoSnapshot: false },
            async () => {
                const remove = data.slice(0, BATCH_SIZE);
                const append = createBatch(BATCH_SIZE);
                data = data.slice(BATCH_SIZE).concat(append);
                await (ctx.chart as any).applyTransaction({ append, remove });
            },
            30_000
        );

        benchmark(
            '50x rolling window update (append + remove)',
            ctx.repeatCount(50),
            { expectedRelativeMB: 0.5, expectedCanvasCount: 2, autoSnapshot: false },
            async () => {
                const remove = data.slice(0, BATCH_SIZE);
                const append = createBatch(BATCH_SIZE);
                data = data.slice(BATCH_SIZE).concat(append);
                await (ctx.chart as any).applyTransaction({ append, remove });
            },
            60_000
        );
    });

    describe('different batch sizes', () => {
        beforeEach(async () => {
            ctx.options.data = data;
            await ctx.create();
        });

        benchmark(
            'applyTransaction - 10 points rolling window',
            ctx.repeatCount(10),
            { expectedRelativeMB: 0.5, expectedCanvasCount: 2, autoSnapshot: false },
            async () => {
                const batchSize = 10;
                const remove = data.slice(0, batchSize);
                const append = createBatch(batchSize);
                data = data.slice(batchSize).concat(append);
                await (ctx.chart as any).applyTransaction({ append, remove });
            },
            30_000
        );

        benchmark(
            'applyTransaction - 500 points rolling window',
            ctx.repeatCount(10),
            { expectedRelativeMB: 0.5, expectedCanvasCount: 2, autoSnapshot: false },
            async () => {
                const batchSize = 500;
                const remove = data.slice(0, batchSize);
                const append = createBatch(batchSize);
                data = data.slice(batchSize).concat(append);
                await (ctx.chart as any).applyTransaction({ append, remove });
            },
            30_000
        );

        benchmark(
            'applyTransaction - 1000 points rolling window',
            ctx.repeatCount(10),
            { expectedRelativeMB: 0.5, expectedCanvasCount: 2, autoSnapshot: false },
            async () => {
                const batchSize = 1000;
                const remove = data.slice(0, batchSize);
                const append = createBatch(batchSize);
                data = data.slice(batchSize).concat(append);
                await (ctx.chart as any).applyTransaction({ append, remove });
            },
            30_000
        );
    });
});
