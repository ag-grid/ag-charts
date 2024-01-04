import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { toMatchImageSnapshot } from 'jest-image-snapshot';

import type { AgChartInstance } from 'ag-charts-community';
import {
    IMAGE_SNAPSHOT_DEFAULTS,
    deproxy,
    extractImageData,
    hoverAction,
    setupMockCanvas,
    waitForChartStability,
} from 'ag-charts-community-test';

import { AgCharts } from '../../main';
import { prepareEnterpriseTestOptions } from '../../test/utils';

expect.extend({ toMatchImageSnapshot });

type TChart = Parameters<typeof waitForChartStability>[0];
type TCtx = ReturnType<typeof setupMockCanvas>;

const compare = async (chart: TChart | AgChartInstance | undefined, ctx: TCtx) => {
    expect(chart).toBeDefined();
    if (chart === undefined) return;

    await waitForChartStability(chart as TChart);
    const imageData = extractImageData(ctx);
    expect(imageData).toMatchImageSnapshot({ ...IMAGE_SNAPSHOT_DEFAULTS, failureThreshold: 0 });
};

describe('BulletSeries', () => {
    describe('rendering', () => {
        let chart: AgChartInstance | undefined;
        const ctx = setupMockCanvas();

        beforeEach(() => {
            // eslint-disable-next-line no-console
            console.warn = jest.fn();
        });

        afterEach(() => {
            chart?.destroy();
            chart = undefined;
            // eslint-disable-next-line no-console
            expect(console.warn).not.toBeCalled();
        });

        const getTooltipHtml = (): string => {
            const series = (chart as any)['series'][0];
            const datum = (chart as any)['series'][0].contextNodeData[0].nodeData[0];
            return series.getTooltipHtml(datum);
        };

        const hoverOnBullet = async () => {
            const series = chart['series'][0];
            const item = series['contextNodeData'][0].nodeData[0];
            const { x, y } = series.rootGroup.inverseTransformPoint(item.midPoint.x, item.midPoint.y);
            await hoverAction(x, y)(chart);
        };

        const opts = prepareEnterpriseTestOptions({});

        it('should render simple bullet', async () => {
            chart = AgCharts.create({
                ...opts,
                series: [
                    {
                        type: 'bullet',
                        data: [{ income: 11, objective: 7 }],
                        valueKey: 'income',
                    },
                ],
            });
            await compare(chart, ctx);
        });

        it('should render a vertical bullet by default', async () => {
            chart = AgCharts.create({
                ...opts,
                series: [
                    {
                        type: 'bullet',
                        data: [{ income: 11, objective: 7 }],
                        valueKey: 'income',
                        valueName: 'Actual income',
                        targetKey: 'objective',
                        targetName: 'Target income',
                        colorRanges: [{ color: 'red', stop: 5 }, { color: 'yellow', stop: 8 }, { color: 'green' }],
                    },
                ],
            });
            await compare(chart, ctx);
        });

        it('should render a horizontal bullet as expected', async () => {
            chart = AgCharts.create({
                ...opts,
                series: [
                    {
                        type: 'bullet',
                        data: [{ income: 11, objective: 7 }],
                        valueKey: 'income',
                        valueName: 'Actual income',
                        targetKey: 'objective',
                        targetName: 'Target income',
                        direction: 'horizontal',
                        colorRanges: [{ color: 'red', stop: 5 }, { color: 'yellow', stop: 8 }, { color: 'green' }],
                    },
                ],
            });
            await compare(chart, ctx);
        });

        it('should clip everything to scale.max', async () => {
            chart = AgCharts.create({
                ...opts,
                series: [
                    {
                        type: 'bullet',
                        data: [{ income: 11, objective: 7 }],
                        scale: { max: 5 },
                        valueKey: 'income',
                        targetKey: 'objective',
                        colorRanges: [{ color: 'yellow', stop: 45 }],
                    },
                ],
            });
            await compare(chart, ctx);
        });

        it('should extend final color to scale.max', async () => {
            chart = AgCharts.create({
                ...opts,
                series: [
                    {
                        type: 'bullet',
                        data: [{ income: 11, objective: 7 }],
                        scale: { max: 20 },
                        valueKey: 'income',
                        targetKey: 'objective',
                        colorRanges: [{ color: 'red', stop: 5 }, { color: 'yellow', stop: 8 }, { color: 'green' }],
                    },
                ],
            });
            await compare(chart, ctx);
        });

        it('should use explicit axis max', async () => {
            chart = AgCharts.create({
                ...opts,
                axes: [{ type: 'number', max: 50 }, { type: 'category' }],
                series: [
                    {
                        type: 'bullet',
                        data: [{ income: 11 }],
                        scale: { max: 20 },
                        valueKey: 'income',
                    },
                ],
            });
            await compare(chart, ctx);
        });

        it('should process first datum only', async () => {
            chart = AgCharts.create({
                ...opts,
                series: [
                    {
                        type: 'bullet',
                        data: [{ income: 1 }, { income: 2 }, { income: 3 }],
                        scale: { max: 1.5 },
                        valueKey: 'income',
                    },
                ],
            });
            await compare(chart, ctx);
        });

        it('should not render crosshair', async () => {
            chart = deproxy(
                AgCharts.create({
                    ...opts,
                    series: [
                        {
                            type: 'bullet',
                            data: [{ income: 1 }],
                            scale: { max: 2 },
                            valueKey: 'income',
                        },
                    ],
                })
            );
            await waitForChartStability(chart);
            await hoverOnBullet();
            await compare(chart, ctx);
        });

        test('tooltip valueKey only', async () => {
            chart = deproxy(
                AgCharts.create({
                    ...opts,
                    series: [
                        {
                            type: 'bullet',
                            valueKey: 'income',
                            data: [{ income: 11, objective: 7 }],
                        },
                    ],
                })
            );
            await waitForChartStability(chart);

            const tooltipHtml = getTooltipHtml();
            expect(tooltipHtml).toEqual('<div class="ag-chart-tooltip-content"><b>income</b>: 11.00</div>');
        });

        test('tooltip no names', async () => {
            chart = deproxy(
                AgCharts.create({
                    ...opts,
                    series: [
                        {
                            type: 'bullet',
                            valueKey: 'income',
                            targetKey: 'objective',
                            data: [{ income: 11, objective: 7 }],
                        },
                    ],
                })
            );
            await waitForChartStability(chart);

            const tooltipHtml = getTooltipHtml();
            expect(tooltipHtml).toEqual(
                '<div class="ag-chart-tooltip-content"><b>income</b>: 11.00<br/><b>objective</b>: 7.00</div>'
            );
        });

        test('tooltip with names', async () => {
            chart = deproxy(
                AgCharts.create({
                    ...opts,
                    series: [
                        {
                            type: 'bullet',
                            valueKey: 'income',
                            valueName: 'Actual income',
                            targetKey: 'objective',
                            targetName: 'Target income',
                            data: [{ income: 11, objective: 7 }],
                        },
                    ],
                })
            );
            await waitForChartStability(chart);

            const tooltipHtml = getTooltipHtml();
            expect(tooltipHtml).toEqual(
                '<div class="ag-chart-tooltip-content"><b>Actual income</b>: 11.00<br/><b>Target income</b>: 7.00</div>'
            );
        });
    });

    /* eslint-disable no-console */
    describe('validation', () => {
        let chart: AgChartInstance | undefined;
        const ctx = setupMockCanvas();

        beforeEach(() => {
            console.warn = jest.fn();
        });

        afterEach(() => {
            chart?.destroy();
            chart = undefined;
        });

        const opts = prepareEnterpriseTestOptions({});

        it('should ignore empty colorRange arrays', async () => {
            chart = AgCharts.create({
                ...opts,
                series: [
                    {
                        type: 'bullet',
                        data: [{ income: 11 }],
                        scale: { max: 20 },
                        valueKey: 'income',
                        colorRanges: [],
                    },
                ],
            });
            await waitForChartStability(chart);

            expect(console.warn).toBeCalledTimes(1);
            expect(console.warn).toBeCalledWith(
                'AG Charts - Property [colorRanges] of [BulletSeries] cannot be set to [[]]; expecting a non-empty array, ignoring.'
            );
            await compare(chart, ctx);
        });

        it('should ignore trailing bullet series', async () => {
            chart = AgCharts.create({
                ...opts,
                series: [
                    {
                        type: 'bullet',
                        data: [{ income: 78, objective: 90 }],
                        scale: { max: 100 },
                        valueKey: 'income',
                        targetKey: 'objective',
                    },
                    {
                        type: 'bullet',
                        data: [{ income: 234 }],
                        scale: { max: 300 },
                        valueKey: 'income',
                        colorRanges: [{ color: 'red' }],
                    },
                    {
                        type: 'bullet',
                        data: [{ cost: 30, costTarget: 60 }],
                        scale: { max: 120 },
                        valueKey: 'cost',
                        targetKey: 'costTarget',
                        fill: 'blue',
                        target: { stroke: 'green' },
                    },
                ],
            });
            await waitForChartStability(chart);

            expect(console.warn).toBeCalledTimes(1);
            expect(console.warn).toBeCalledWith(
                `AG Charts - series[0] of type 'bullet' is incompatible with other series types. Only processing series[0]`
            );
            await compare(chart, ctx);
        });

        it('should ignore other trailing series', async () => {
            chart = AgCharts.create({
                ...opts,
                data: [
                    { a: 23, b: 17, yr: '1990' },
                    { a: 53, b: 59, yr: '2000' },
                    { a: 47, b: 65, yr: '2010' },
                ],
                series: [
                    {
                        type: 'bullet',
                        data: [{ cost: 30, costTarget: 60 }],
                        scale: { max: 120 },
                        valueKey: 'cost',
                        targetKey: 'costTarget',
                        fill: 'blue',
                        target: { stroke: 'green' },
                    },
                    { type: 'line', xKey: 'yr', yKey: 'a' },
                    { type: 'bar', xKey: 'yr', yKey: 'b' },
                ],
            });
            await waitForChartStability(chart);

            expect(console.warn).toBeCalledTimes(1);
            expect(console.warn).toBeCalledWith(
                `AG Charts - series[0] of type 'bullet' is incompatible with other series types. Only processing series[0]`
            );
            await compare(chart, ctx);
        });

        it('should filter bullet series from line chart', async () => {
            chart = AgCharts.create({
                ...opts,
                data: [
                    { a: 23, b: 17, yr: '1990' },
                    { a: 53, b: 59, yr: '2000' },
                    { a: 47, b: 65, yr: '2010' },
                ],
                series: [
                    { type: 'line', xKey: 'yr', yKey: 'a' },
                    { type: 'line', xKey: 'yr', yKey: 'b' },

                    {
                        type: 'bullet',
                        data: [{ income: 78 }],
                        scale: { max: 100 },
                        valueKey: 'income',
                    },
                    {
                        type: 'bullet',
                        data: [{ cost: 30, costTarget: 60 }],
                        scale: { max: 120 },
                        valueKey: 'cost',
                        targetKey: 'costTarget',
                        fill: 'blue',
                        target: { stroke: 'green' },
                    },
                ],
            });
            await waitForChartStability(chart);

            expect(console.warn).toBeCalledTimes(1);
            expect(console.warn).toBeCalledWith(
                'AG Charts - Unable to mix these series types with the lead series type: bullet'
            );
            await compare(chart, ctx);
        });

        test('warning negative value', async () => {
            chart = AgCharts.create({
                ...opts,
                series: [{ type: 'bullet', data: [{ v: -1 }], valueKey: 'v' }],
            });
            await waitForChartStability(chart);

            expect(console.warn).toBeCalledTimes(1);
            expect(console.warn).toBeCalledWith('AG Charts - negative values are not supported, clipping to 0.');
            await compare(chart, ctx);
        });

        test('warning negative target', async () => {
            chart = AgCharts.create({
                ...opts,
                series: [{ type: 'bullet', data: [{ v: 11, t: -1 }], valueKey: 'v', targetKey: 't' }],
            });
            await waitForChartStability(chart);

            expect(console.warn).toBeCalledTimes(1);
            expect(console.warn).toBeCalledWith('AG Charts - negative targets are not supported, ignoring.');
            await compare(chart, ctx);
        });

        test('warning negative max', async () => {
            chart = AgCharts.create({
                ...opts,
                series: [{ type: 'bullet', data: [{ v: 11 }], valueKey: 'v', scale: { max: -1 } }],
            });
            await waitForChartStability(chart);

            expect(console.warn).toBeCalledTimes(1);
            expect(console.warn).toBeCalledWith(
                'AG Charts - Property [max] of [BulletScale] cannot be set to [-1]; expecting a number greater than or equal to 0, ignoring.'
            );
            await compare(chart, ctx);
        });

        test('warning negative colorRange stop', async () => {
            chart = AgCharts.create({
                ...opts,
                series: [
                    { type: 'bullet', data: [{ v: 11 }], valueKey: 'v', colorRanges: [{ color: 'blue', stop: -1 }] },
                ],
            });
            await waitForChartStability(chart);

            expect(console.warn).toBeCalledTimes(1);
            expect(console.warn).toBeCalledWith(
                'AG Charts - Property [stop] of [BulletColorRange] cannot be set to [-1]; expecting a number greater than or equal to 0, ignoring.'
            );
            await compare(chart, ctx);
        });
    });
    /* eslint-enable no-console */
});
