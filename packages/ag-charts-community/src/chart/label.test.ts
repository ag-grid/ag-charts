import type { AgChartInstance } from 'ag-charts-types';

import { AgCharts } from '../api/agCharts';
import {
    extractImageData,
    prepareTestOptions,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from './test/utils';

describe('Labels', () => {
    setupMockConsole();
    const ctx = setupMockCanvas();
    let chart: AgChartInstance;

    afterEach(() => {
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
        jest.restoreAllMocks();
    });

    async function compare() {
        await waitForChartStability(chart);
        const imageData = extractImageData(ctx);
        expect(imageData).toMatchImageSnapshot();
    }

    describe('AG-8917', () => {
        test('itemStyler auto-enables border', async () => {
            const options = prepareTestOptions({
                data: [
                    { x: "Q1'18", y: 140 },
                    { x: "Q2'18", y: 124 },
                    { x: "Q3'18", y: 112 },
                    { x: "Q4'18", y: 118 },
                ],
                series: [
                    {
                        type: 'bar',
                        xKey: 'x',
                        yKey: 'y',
                        label: {
                            itemStyler: () => {
                                return { border: { strokeWidth: 2, stroke: 'black' } };
                            },
                        },
                    },
                ],
            });
            chart = AgCharts.create(options);
            await compare();
        });
    });
});
