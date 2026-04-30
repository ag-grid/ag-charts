import { describe as jestDescribe } from '@jest/globals';

import type { AgCartesianChartOptions } from 'ag-charts-types';

import { benchmark, setupBenchmark } from './benchmark';
import { isAtOrAfterVersion } from './compatibility';

const describeWhenSupported = isAtOrAfterVersion(12, 3, 0) ? jestDescribe : jestDescribe.skip;

describeWhenSupported('high-frequency data bar benchmark', () => {
    const ctx = setupBenchmark<AgCartesianChartOptions>('high-freq-bar');

    type Datum = {
        timestamp: number;
        price: number;
        volume: number;
    };

    const INITIAL_POINTS = 100_000;
    const BATCH_SIZE = 100;
    const DATA_INTERVAL_MS = 250;
    const START_TIMESTAMP = Date.UTC(2024, 0, 1, 0, 0, 0);
    const BASE_PRICE = 100;

    class HighFrequencyBarDataGenerator {
        private index = 0;
        private price = BASE_PRICE;

        reset() {
            this.index = 0;
            this.price = BASE_PRICE;
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
            const drift = Math.sin(index / 12) * 0.7 + Math.cos(index / 24) * 0.4;
            this.price = Number((this.price + drift).toFixed(2));
            return {
                timestamp,
                price: this.price,
                volume: 600 + Math.round((Math.sin(index / 8) + 1) * 220),
            };
        }
    }

    const barDataGenerator = new HighFrequencyBarDataGenerator();

    let data: Datum[] = [];

    function createSeedData(count: number): Datum[] {
        barDataGenerator.reset();
        return barDataGenerator.take(count);
    }

    function createBatch(count: number): Datum[] {
        return barDataGenerator.take(count);
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
            '10x append batch (1k points total)',
            ctx.repeatCount(10),
            { expectedRelativeMB: 0.5, expectedCanvasCount: 3, autoSnapshot: false },
            async () => {
                const append = createBatch(BATCH_SIZE);
                data = data.concat(append);
                await (ctx.chart as any).applyTransaction({ append });
            },
            30_000
        );

        benchmark(
            '1x remove batch (100 points)',
            ctx.repeatCount(1),
            { expectedRelativeMB: 0.5, expectedCanvasCount: 3, autoSnapshot: false },
            async () => {
                const remove = data.slice(0, BATCH_SIZE);
                data = data.slice(BATCH_SIZE);
                await (ctx.chart as any).applyTransaction({ remove });
            },
            15_000
        );

        benchmark(
            '10x rolling window update (append + remove)',
            ctx.repeatCount(10),
            { expectedRelativeMB: 0.5, expectedCanvasCount: 3, autoSnapshot: false },
            async () => {
                const remove = data.slice(0, BATCH_SIZE);
                const append = createBatch(BATCH_SIZE);
                data = data.slice(BATCH_SIZE).concat(append);
                await (ctx.chart as any).applyTransaction({ append, remove });
            },
            30_000
        );
    });
});
