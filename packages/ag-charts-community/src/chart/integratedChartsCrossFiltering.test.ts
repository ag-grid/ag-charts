import { afterEach, describe, expect, it } from '@jest/globals';

import { AgCharts } from '../api/agCharts';
import type { ChartOrProxy } from './test/utils';
import {
    IMAGE_SNAPSHOT_DEFAULTS,
    extractImageData,
    prepareTestOptions,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from './test/utils';

const INTEGRATED_THEME = {
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
        pie: {
            series: {
                strokeWidth: 8,
                fills: {
                    $applyCycle: [
                        { $cacheMax: { $size: { $path: ['./data', { $path: '/data' }] } } },
                        { $palette: 'fills' },
                        {
                            $if: [
                                { $eq: [{ $value: '$parentIndex' }, 0] },
                                { $mix: [{ $value: '$1' }, { $ref: 'backgroundColor' }, 0.7] },
                                { $value: '$1' },
                            ],
                        },
                    ],
                },
                strokes: {
                    $applyCycle: [
                        { $cacheMax: { $size: { $path: ['./data', { $path: '/data' }] } } },
                        { $palette: 'strokes' },
                        {
                            $if: [
                                { $eq: [{ $value: '$parentIndex' }, 0] },
                                { $mix: [{ $value: '$1' }, { $ref: 'backgroundColor' }, 0.7] },
                                { $value: '$1' },
                            ],
                        },
                    ],
                },
            },
        },
    },
};

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
            theme: INTEGRATED_THEME,
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

    it('should render pie series with more segments than fills', async () => {
        const options: any = {
            theme: INTEGRATED_THEME,
            data: [
                { salesRep: 'Alton Watson', 'sale-filtered-out': 300, sale: 878 },
                { salesRep: 'Kace Singleton', 'sale-filtered-out': 300, sale: 998 },
                { salesRep: 'Iliana Good', 'sale-filtered-out': 300, sale: 2246 },
                { salesRep: 'Aden Moreno', 'sale-filtered-out': 300, sale: 2266 },
                { salesRep: 'Zariyah Leal', 'sale-filtered-out': 300, sale: 4353 },
                { salesRep: 'Cedric Spence', 'sale-filtered-out': 300, sale: 1547 },
                { salesRep: 'Roland Hodges', 'sale-filtered-out': 300, sale: 849 },
                { salesRep: 'Eve Schmidt', 'sale-filtered-out': 300, sale: 2176 },
                { salesRep: 'Aislinn Callahan', 'sale-filtered-out': 300, sale: 2037 },
                { salesRep: 'Kennedy Bartlett', 'sale-filtered-out': 0, sale: 279 },
                { salesRep: 'Caleb Scott', 'sale-filtered-out': 300, sale: 1348 },
                { salesRep: 'Zayden Booth', 'sale-filtered-out': 0, sale: 279 },
                { salesRep: 'Jermaine Price', 'sale-filtered-out': 300, sale: 868 },
                { salesRep: 'Reis Vasquez', 'sale-filtered-out': 300, sale: 828 },
                { salesRep: 'Cathy Wilkins', 'sale-filtered-out': 0, sale: 849 },
                { salesRep: 'Malaysia Morton', 'sale-filtered-out': 300, sale: 499 },
            ].map((d: any) => {
                const colId = 'sale';
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
                    angleKey: 'sale-total',
                    legendItemKey: 'salesRep',
                    radiusKey: 'sale-filtered-out',
                    radiusMin: 0,
                    radiusMax: 1,
                    showInLegend: false,
                },
                {
                    type: 'pie',
                    angleKey: 'sale-total',
                    legendItemKey: 'salesRep',
                    radiusKey: 'sale',
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
            theme: INTEGRATED_THEME,
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
