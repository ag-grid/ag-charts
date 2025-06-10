import { afterEach, describe, expect, it } from '@jest/globals';

import { AgCharts } from '../api/agCharts';
import {
    IMAGE_SNAPSHOT_DEFAULTS,
    extractImageData,
    prepareTestOptions,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from './test/utils';
import type { ChartOrProxy } from './test/utils';

describe('Integrated Charts Cross Filtering', () => {
    setupMockConsole();
    const ctx = setupMockCanvas();

    let chart: ChartOrProxy;

    afterEach(() => {
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
    });

    const compare = async () => {
        await waitForChartStability(chart);

        const imageData = extractImageData(ctx);
        expect(imageData).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);
    };

    it('should render pie series as expected', async () => {
        const options: any = {
            theme: {
                overrides: {
                    pie: {
                        series: {
                            fills: {
                                $if: [
                                    { $eq: [{ $value: '$index' }, 0] },
                                    {
                                        $map: [
                                            { $mix: [{ $value: '$1' }, { $ref: 'backgroundColor' }, 0.7] },
                                            { $palette: 'fills' },
                                        ],
                                    },
                                    { $palette: 'fills' },
                                ],
                            },
                            strokes: {
                                $if: [
                                    { $eq: [{ $value: '$index' }, 0] },
                                    {
                                        $map: [
                                            { $mix: [{ $value: '$1' }, { $ref: 'backgroundColor' }, 0.7] },
                                            { $palette: 'strokes' },
                                        ],
                                    },
                                    { $palette: 'strokes' },
                                ],
                            },
                        },
                    },
                },
            },
            data: [
                { asset: 'Stocks', amount: 30000, 'amount-filtered-out': 30000 },
                { asset: 'Bonds', amount: 25000, 'amount-filtered-out': 15000 },
                { asset: 'Cash', amount: 6000, 'amount-filtered-out': 1000 },
                { asset: 'Real Estate', amount: 1000, 'amount-filtered-out': 4000 },
                { asset: 'Commodities', amount: 2500, 'amount-filtered-out': 500 },
            ].map((d: any) => {
                const colId = 'amount';
                const filteredOutColId = `${colId}-filtered-out`;
                const total = d[colId] + d[filteredOutColId];
                d[`${colId}-total`] = total;
                d[filteredOutColId] = 1; // normalise to 1
                d[colId] = d[colId] / total; // fraction of 1
                return d;
            }),
            series: [
                {
                    type: 'pie',
                    angleKey: 'amount-total',
                    legendItemKey: 'asset',
                    radiusKey: 'amount-filtered-out',
                    radiusMin: 0,
                    radiusMax: 1,
                    showInLegend: false,
                },
                {
                    type: 'pie',
                    angleKey: 'amount-total',
                    legendItemKey: 'asset',
                    radiusKey: 'amount',
                    radiusMin: 0,
                    radiusMax: 1,
                },
            ],
        };
        prepareTestOptions(options);

        chart = AgCharts.create(options);
        await waitForChartStability(chart);
        await compare();
    });

    it('should render bar series as expected', async () => {
        const options: any = {
            theme: {
                overrides: {
                    bar: {
                        series: {
                            fill: {
                                $if: [
                                    { $isEven: [{ $value: '$index' }] },
                                    { $palette: 'fill' },
                                    {
                                        $mix: [
                                            {
                                                $path: ['../$prevIndex/fill', { $palette: 'fill' }],
                                            },
                                            { $ref: 'backgroundColor' },
                                            0.7,
                                        ],
                                    },
                                ],
                            },
                            stroke: {
                                $if: [
                                    { $isEven: [{ $value: '$index' }] },
                                    { $palette: 'stroke' },
                                    {
                                        $mix: [
                                            {
                                                $path: ['../$prevIndex/fill', { $palette: 'stroke' }],
                                            },
                                            { $ref: 'backgroundColor' },
                                            0.7,
                                        ],
                                    },
                                ],
                            },
                        },
                    },
                },
            },
            data: [
                { asset: 'Stocks', amount: 30000, 'amount-filtered-out': 30000 },
                { asset: 'Bonds', amount: 25000, 'amount-filtered-out': 15000 },
                { asset: 'Cash', amount: 6000, 'amount-filtered-out': 1000 },
                { asset: 'Real Estate', amount: 1000, 'amount-filtered-out': 4000 },
                { asset: 'Commodities', amount: 2500, 'amount-filtered-out': 500 },
            ].map((d: any) => {
                const colId = 'amount';
                const filteredOutColId = `${colId}-filtered-out`;
                const total = d[colId] + d[filteredOutColId];
                d[`${colId}-total`] = total;
                d[filteredOutColId] = 1; // normalise to 1
                d[colId] = d[colId] / total; // fraction of 1
                return d;
            }),
            series: [
                {
                    type: 'bar',
                    xKey: 'asset',
                    yKey: 'amount',
                    stacked: true,
                },
                {
                    type: 'bar',
                    xKey: 'asset',
                    yKey: 'amount-filtered-out',
                    stacked: true,
                    showInLegend: false,
                },
            ],
        };
        prepareTestOptions(options);

        chart = AgCharts.create(options);
        await waitForChartStability(chart);
        await compare();
    });
});
