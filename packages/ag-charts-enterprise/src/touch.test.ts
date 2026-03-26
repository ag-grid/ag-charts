import { describe, expect, test } from '@jest/globals';

import { type AgCartesianChartOptions, type AgChartOptions, AgCharts } from 'ag-charts-community';
import {
    extractImageData,
    setupMockCanvas,
    setupMockConsole,
    touchDragAction,
    waitForChartStability,
} from 'ag-charts-community-test';

import { prepareEnterpriseTestOptions } from './test/utils';

describe('Touch', () => {
    setupMockConsole();
    const ctx = setupMockCanvas();

    let chart: any;

    async function compare(customSnapshotIdentifier?: string) {
        await waitForChartStability(chart);
        const imageData = extractImageData(ctx);
        expect(imageData).toMatchImageSnapshot({
            failureThreshold: 0,
            failureThresholdType: 'percent',
            customSnapshotIdentifier,
        });
    }

    describe('dragAction', () => {
        async function prepareChart(opts: AgCartesianChartOptions) {
            const options: AgChartOptions = { ...OPTIONS, ...opts };
            prepareEnterpriseTestOptions(options);
            chart = AgCharts.create(options);
            await waitForChartStability(chart);
        }

        test(`'none'`, async () => {
            await prepareChart({ touch: { dragAction: 'none' } });
            await compare('dragAction-none');
            await touchDragAction({ x: 200, y: 200 }, { x: 400, y: 400 })(chart);
            await compare('dragAction-none');
        });

        test(`'drag'`, async () => {
            await prepareChart({ touch: { dragAction: 'drag' } });
            await touchDragAction({ x: 200, y: 200 }, { x: 400, y: 250 })(chart);
            await compare('dragAction-dragged');
        });

        test(`'hover'`, async () => {
            await prepareChart({ touch: { dragAction: 'hover' } });
            await touchDragAction({ x: 200, y: 200 }, { x: 400, y: 400 })(chart);
            await compare('dragAction-hovered');
        });

        test(`'drag' zoomed out`, async () => {
            await prepareChart({ touch: { dragAction: 'drag' }, zoom: { enabled: true }, initialState: {} });
            await compare('dragAction-drag-zoomed-out');
            await touchDragAction({ x: 200, y: 200 }, { x: 400, y: 400 })(chart);
            await compare('dragAction-drag-zoomed-out');
        });

        test(`'drag' zoom disabled`, async () => {
            await prepareChart({ touch: { dragAction: 'drag' }, zoom: { enabled: false } });
            await compare('dragAction-drag-zoomed-out');
            await touchDragAction({ x: 200, y: 200 }, { x: 400, y: 400 })(chart);
            await compare('dragAction-drag-zoomed-out');
        });
    });
});

// These options closely replicate the Touch page's `single-finger-touch-dragging` example.
function getOptions(): AgCartesianChartOptions {
    function seedRandom(seed = 1337): () => number {
        function sfc32(a: number, b: number, c: number, d: number) {
            return function () {
                a >>>= 0;
                b >>>= 0;
                c >>>= 0;
                d >>>= 0;
                let t = Math.trunc(a + b);
                a = b ^ (b >>> 9);
                b = Math.trunc(c + (c << 3));
                c = (c << 21) | (c >>> 11);
                d = Math.trunc(d + 1);
                t = Math.trunc(t + d);
                c = Math.trunc(c + t);
                return (t >>> 0) / 4294967296;
            };
        }
        return sfc32(0x9e3779b9, 0x243f6a88, 0xb7e15162, seed ^ 0xdeadbeef);
    }

    function getData(days: number) {
        const startPrice = 100;
        const maxDailyPriceChange = 5;
        const maxRangeDelta = 1;
        let currentPrice = startPrice;
        const random = seedRandom();
        return Array.from({ length: days }, (_, i) => {
            // Note time is reversed
            const close = currentPrice;
            const open = close + (random() * 2 - 1) * maxDailyPriceChange;
            currentPrice = open;

            const high = Math.max(open, close) + random() * maxRangeDelta;
            const low = Math.min(open, close) - random() * maxRangeDelta;

            const timestamp = new Date(2024, 0, 0 /* End of 2023 */, -i);

            return { timestamp, open, close, high, low };
        }).reverse();
    }

    return {
        data: getData(1e3),
        touch: { dragAction: 'hover' },
        zoom: { enabled: true },
        initialState: { zoom: { ratioX: { start: 0.48, end: 0.52 }, ratioY: { start: 0.15, end: 0.6 } } },
        series: [
            {
                type: 'candlestick',
                xKey: 'timestamp',
                lowKey: 'low',
                highKey: 'high',
                openKey: 'open',
                closeKey: 'close',
            },
        ],
    };
}

const OPTIONS: Readonly<AgCartesianChartOptions> = getOptions();
