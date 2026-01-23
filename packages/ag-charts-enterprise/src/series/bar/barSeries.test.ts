import { describe, expect, it } from '@jest/globals';

import { type AgCartesianChartOptions, type AgChartInstance, AgCharts } from 'ag-charts-community';
import {
    IMAGE_SNAPSHOT_DEFAULTS,
    deproxy,
    extractImageData,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from 'ag-charts-community-test';

import { prepareEnterpriseTestOptions } from '../../test/utils';

describe('BarSeries', () => {
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

    const compare = async (defaults = IMAGE_SNAPSHOT_DEFAULTS) => {
        await waitForChartStability(chart);

        const imageData = extractImageData(ctx);
        expect(imageData).toMatchImageSnapshot(defaults);
    };

    describe('with data-per-series', () => {
        const options: AgCartesianChartOptions = {
            series: [
                {
                    type: 'bar',
                    xKey: 'product',
                    yKey: 'value',
                    yName: 'iPhone',
                    data: [{ product: 'iPhone', value: 140 }],
                },
                {
                    type: 'bar',
                    xKey: 'product',
                    yKey: 'value',
                    yName: 'Mac',
                    data: [{ product: 'Mac', value: 20 }],
                },
            ],
        };

        beforeEach(async () => {
            chart = AgCharts.create(
                prepareEnterpriseTestOptions({ ...options, animation: { enabled: true, duration: 10_000 } })
            );

            await waitForChartStability(chart);
        });

        it('should initially animate', () => {
            const {
                ctx: { animationManager },
            } = deproxy(chart);

            const remainingAnimationTime = animationManager.getRemainingTime('initial');
            expect(remainingAnimationTime).toBeGreaterThan(6000);
        });
    });

    describe('fixed widths', () => {
        const data = [
            { quarter: "Q1'18", iphone: 40, mac: 16, ipad: 14, wearables: 12 },
            { quarter: "Q2'18", iphone: 24, mac: 20, ipad: 14, wearables: 12 },
            { quarter: "Q3'18", iphone: 12, mac: 20, ipad: 18, wearables: 14 },
            { quarter: "Q4'18", iphone: 18, mac: 24, ipad: 14, wearables: 14 },
        ];

        const zeroPadding = {
            paddingInner: 0,
            paddingOuter: 0,
            groupPaddingInner: 0,
        };

        describe('scrollbar', () => {
            const cases: [string, any, any][] = [
                [
                    'grouped series',
                    [
                        { type: 'bar', xKey: 'quarter', yKey: 'iphone', width: 200 },
                        { type: 'bar', xKey: 'quarter', yKey: 'mac', width: 100 },
                        { type: 'bar', xKey: 'quarter', yKey: 'ipad', width: 50 },
                        { type: 'bar', xKey: 'quarter', yKey: 'wearables', width: 100 },
                    ],
                    zeroPadding,
                ],
                [
                    'grouped series with default padding',
                    [
                        { type: 'bar', xKey: 'quarter', yKey: 'iphone', width: 200 },
                        { type: 'bar', xKey: 'quarter', yKey: 'mac', width: 100 },
                        { type: 'bar', xKey: 'quarter', yKey: 'ipad', width: 50 },
                        { type: 'bar', xKey: 'quarter', yKey: 'wearables', width: 100 },
                    ],
                    {},
                ],
                [
                    'grouped series with unfixed widths',
                    [
                        { type: 'bar', xKey: 'quarter', yKey: 'iphone', width: 200 },
                        { type: 'bar', xKey: 'quarter', yKey: 'mac' },
                        { type: 'bar', xKey: 'quarter', yKey: 'ipad' },
                        { type: 'bar', xKey: 'quarter', yKey: 'wearables', width: 100 },
                    ],
                    zeroPadding,
                ],
                [
                    'stacked series',
                    [
                        { type: 'bar', xKey: 'quarter', yKey: 'iphone', width: 200, stackGroup: 'one' },
                        { type: 'bar', xKey: 'quarter', yKey: 'mac', width: 100, stackGroup: 'one' },
                        { type: 'bar', xKey: 'quarter', yKey: 'ipad', width: 50, stackGroup: 'two' },
                        { type: 'bar', xKey: 'quarter', yKey: 'wearables', width: 100, stackGroup: 'two' },
                    ],
                    zeroPadding,
                ],
                [
                    'stacked series with default padding',
                    [
                        { type: 'bar', xKey: 'quarter', yKey: 'iphone', width: 200, stackGroup: 'one' },
                        { type: 'bar', xKey: 'quarter', yKey: 'mac', width: 100, stackGroup: 'one' },
                        { type: 'bar', xKey: 'quarter', yKey: 'ipad', width: 50, stackGroup: 'two' },
                        { type: 'bar', xKey: 'quarter', yKey: 'wearables', width: 100, stackGroup: 'two' },
                    ],
                    {},
                ],
                [
                    'stacked series with unfixed widths',
                    [
                        { type: 'bar', xKey: 'quarter', yKey: 'iphone', width: 100, stackGroup: 'one' },
                        { type: 'bar', xKey: 'quarter', yKey: 'mac', stackGroup: 'one' },
                        { type: 'bar', xKey: 'quarter', yKey: 'ipad', stackGroup: 'two' },
                        { type: 'bar', xKey: 'quarter', yKey: 'wearables', width: 100, stackGroup: 'two' },
                    ],
                    zeroPadding,
                ],
            ];

            it.each(cases)('%s', async (_, seriesOptions, axisOptions) => {
                const options: AgCartesianChartOptions = {
                    data: data,
                    series: seriesOptions,
                    axes: {
                        x: axisOptions,
                    },
                    scrollbar: { enabled: true },
                };
                prepareEnterpriseTestOptions(options);
                chart = AgCharts.create(options);
                await compare();
            });
        });
    });
});
