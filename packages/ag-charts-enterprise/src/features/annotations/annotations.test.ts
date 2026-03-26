import { afterEach, describe, expect, it } from '@jest/globals';

import { type AgCartesianChartOptions, AgCharts } from 'ag-charts-community';
import { extractImageData, setupMockCanvas, setupMockConsole, waitForChartStability } from 'ag-charts-community-test';

import { prepareEnterpriseTestOptions } from '../../test/utils';

describe('Annotations', () => {
    setupMockConsole();
    let chart: any;
    const ctx = setupMockCanvas();

    const EXAMPLE_OPTIONS: AgCartesianChartOptions = {
        data: [
            { x: new Date('2024-01-05'), y: 5 },
            { x: new Date('2024-06-15'), y: 50 },
            { x: new Date('2024-12-25'), y: 95 },
        ],
        series: [{ type: 'scatter', xKey: 'x', yKey: 'y' }],
        axes: { y: { type: 'number' }, x: { type: 'time' } },
        annotations: {
            enabled: true,
            toolbar: {
                enabled: false,
            },
        },
    };

    async function prepareChart(
        initialStateOptions?: AgCartesianChartOptions['initialState'],
        baseOptions = EXAMPLE_OPTIONS
    ) {
        const options: AgCartesianChartOptions = {
            ...baseOptions,
            initialState: { ...baseOptions.initialState, ...(initialStateOptions ?? {}) },
        };
        prepareEnterpriseTestOptions(options);
        chart = AgCharts.create(options);
        await waitForChartStability(chart);
    }

    afterEach(() => {
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
    });

    const compare = async () => {
        await waitForChartStability(chart);

        const imageData = extractImageData(ctx);
        expect(imageData).toMatchImageSnapshot({
            failureThreshold: 0,
            failureThresholdType: 'percent',
        });
    };

    describe('initial', () => {
        it('should render a line annotation', async () => {
            await prepareChart({
                annotations: [
                    {
                        type: 'line',
                        start: { x: { __type: 'date', value: '2024-03-01' }, y: 25 },
                        end: { x: { __type: 'date', value: '2024-09-01' }, y: 75 },
                    },
                ],
            });
            await compare();
        });

        it('should render a horizontal cross-line annotation', async () => {
            await prepareChart({
                annotations: [
                    {
                        type: 'horizontal-line',
                        value: 75,
                    },
                ],
            });
            await compare();
        });

        it('should render a vertical cross-line annotation', async () => {
            await prepareChart({
                annotations: [
                    {
                        type: 'vertical-line',
                        value: { __type: 'date', value: '2024-09-01' },
                    },
                ],
            });
            await compare();
        });

        it('should render a parallel-channel annotation', async () => {
            await prepareChart({
                annotations: [
                    {
                        type: 'parallel-channel',
                        start: { x: { __type: 'date', value: '2024-03-01' }, y: 40 },
                        end: { x: { __type: 'date', value: '2024-09-01' }, y: 90 },
                        height: 30,
                    },
                ],
            });
            await compare();
        });

        it('should render a disjoint-channel annotation', async () => {
            await prepareChart({
                annotations: [
                    {
                        type: 'disjoint-channel',
                        start: { x: { __type: 'date', value: '2024-03-01' }, y: 35 },
                        end: { x: { __type: 'date', value: '2024-09-01' }, y: 95 },
                        startHeight: 20,
                        endHeight: 40,
                    },
                ],
            });
            await compare();
        });

        it('should render a text annotation', async () => {
            await prepareChart({
                annotations: [
                    {
                        type: 'text',
                        text: 'Hello',
                        x: { __type: 'date', value: '2024-07-01' },
                        y: 75,
                    },
                ],
            });
            await compare();
        });

        it('should render a comment annotation', async () => {
            await prepareChart({
                annotations: [
                    {
                        type: 'comment',
                        text: 'Hello',
                        x: { __type: 'date', value: '2024-07-01' },
                        y: 75,
                    },
                ],
            });
            await compare();
        });

        it('should render a note annotation', async () => {
            await prepareChart({
                annotations: [
                    {
                        type: 'note',
                        text: 'Hello',
                        x: { __type: 'date', value: '2024-07-01' },
                        y: 75,
                    },
                ],
            });
            await compare();
        });

        it('should render a callout annotation', async () => {
            await prepareChart({
                annotations: [
                    {
                        type: 'callout',
                        text: 'Hello',
                        start: { x: { __type: 'date', value: '2024-05-01' }, y: 50 },
                        end: { x: { __type: 'date', value: '2024-07-01' }, y: 75 },
                    },
                ],
            });
            await compare();
        });

        it('should render a date range annotation', async () => {
            await prepareChart({
                annotations: [
                    {
                        type: 'date-range',
                        start: { x: { __type: 'date', value: '2024-03-01' }, y: 25 },
                        end: { x: { __type: 'date', value: '2024-09-01' }, y: 75 },
                    },
                ],
            });
            await compare();
        });

        it('should render a price range annotation', async () => {
            await prepareChart({
                annotations: [
                    {
                        type: 'price-range',
                        start: { x: { __type: 'date', value: '2024-03-01' }, y: 25 },
                        end: { x: { __type: 'date', value: '2024-09-01' }, y: 75 },
                    },
                ],
            });
            await compare();
        });

        it('should render a date price range annotation', async () => {
            await prepareChart({
                annotations: [
                    {
                        type: 'date-price-range',
                        start: { x: { __type: 'date', value: '2024-03-01' }, y: 25 },
                        end: { x: { __type: 'date', value: '2024-09-01' }, y: 75 },
                    },
                ],
            });
            await compare();
        });

        it('should render a fibonacci retracement annotation with positive gradient', async () => {
            await prepareChart({
                annotations: [
                    {
                        type: 'fibonacci-retracement',
                        start: { x: { __type: 'date', value: '2024-03-01' }, y: 45 },
                        end: { x: { __type: 'date', value: '2024-09-01' }, y: 65 },
                    },
                ],
            });
            await compare();
        });

        it('should render a reversed fibonacci retracement annotation with positive gradient', async () => {
            await prepareChart({
                annotations: [
                    {
                        type: 'fibonacci-retracement',
                        start: { x: { __type: 'date', value: '2024-03-01' }, y: 45 },
                        end: { x: { __type: 'date', value: '2024-09-01' }, y: 65 },
                        reverse: true,
                    },
                ],
            });
            await compare();
        });

        it('should render a fibonacci retracement annotation with negative gradient', async () => {
            await prepareChart({
                annotations: [
                    {
                        type: 'fibonacci-retracement',
                        start: { x: { __type: 'date', value: '2024-03-01' }, y: 65 },
                        end: { x: { __type: 'date', value: '2024-09-01' }, y: 45 },
                    },
                ],
            });
            await compare();
        });

        it('should render a revered fibonacci retracement annotation with negative gradient', async () => {
            await prepareChart({
                annotations: [
                    {
                        type: 'fibonacci-retracement',
                        start: { x: { __type: 'date', value: '2024-03-01' }, y: 65 },
                        end: { x: { __type: 'date', value: '2024-09-01' }, y: 45 },
                        reverse: true,
                    },
                ],
            });
            await compare();
        });

        // Trend based
        it('should render a fibonacci retracement annotation with positive gradient', async () => {
            await prepareChart({
                annotations: [
                    {
                        type: 'fibonacci-retracement-trend-based',
                        start: { x: { __type: 'date', value: '2024-03-01' }, y: 45 },
                        end: { x: { __type: 'date', value: '2024-07-01' }, y: 65 },
                        endRetracement: { x: { __type: 'date', value: '2024-10-01' }, y: 65 },
                    },
                ],
            });
            await compare();
        });

        it('should render a reversed fibonacci retracement annotation with positive gradient', async () => {
            await prepareChart({
                annotations: [
                    {
                        type: 'fibonacci-retracement-trend-based',
                        start: { x: { __type: 'date', value: '2024-03-01' }, y: 45 },
                        end: { x: { __type: 'date', value: '2024-07-01' }, y: 65 },
                        endRetracement: { x: { __type: 'date', value: '2024-10-01' }, y: 65 },
                        reverse: true,
                    },
                ],
            });
            await compare();
        });

        it('should render a fibonacci retracement annotation with negative gradient', async () => {
            await prepareChart({
                annotations: [
                    {
                        type: 'fibonacci-retracement-trend-based',
                        start: { x: { __type: 'date', value: '2024-03-01' }, y: 65 },
                        end: { x: { __type: 'date', value: '2024-07-01' }, y: 45 },
                        endRetracement: { x: { __type: 'date', value: '2024-10-01' }, y: 65 },
                    },
                ],
            });
            await compare();
        });

        it('should render a revered fibonacci retracement annotation with negative gradient', async () => {
            await prepareChart({
                annotations: [
                    {
                        type: 'fibonacci-retracement-trend-based',
                        start: { x: { __type: 'date', value: '2024-03-01' }, y: 65 },
                        end: { x: { __type: 'date', value: '2024-07-01' }, y: 45 },
                        endRetracement: { x: { __type: 'date', value: '2024-10-01' }, y: 65 },
                        reverse: true,
                    },
                ],
            });
            await compare();
        });
    });

    describe('lines with text', () => {
        const annotations = [
            {
                text: {
                    label: 'Lorem ipsum',
                    position: 'top',
                    alignment: 'left',
                },
            },
            {
                text: {
                    label: 'Lorem ipsum',
                    position: 'top',
                    alignment: 'center',
                },
            },
            {
                text: {
                    label: 'Lorem ipsum',
                    position: 'top',
                    alignment: 'right',
                },
            },
            {
                text: {
                    label: 'Lorem ipsum',
                    position: 'center',
                    alignment: 'left',
                },
            },
            {
                text: {
                    label: 'Lorem ipsum',
                    position: 'center',
                    alignment: 'center',
                },
            },
            {
                text: {
                    label: 'Lorem ipsum',
                    position: 'center',
                    alignment: 'right',
                },
            },
            {
                text: {
                    label: 'Lorem ipsum',
                    position: 'bottom',
                    alignment: 'left',
                },
            },
            {
                text: {
                    label: 'Lorem ipsum',
                    position: 'bottom',
                    alignment: 'center',
                },
            },
            {
                text: {
                    label: 'Lorem ipsum',
                    position: 'bottom',
                    alignment: 'right',
                },
            },
        ];

        it('should render line annotations with text', async () => {
            await prepareChart({
                annotations: annotations.map((annotation, index) => {
                    let y = 100;
                    if (index > 2) y = 70;
                    if (index > 5) y = 40;
                    const month = [2, 6, 10][index % 3];

                    return {
                        ...(annotation as any),
                        type: 'line',
                        start: { x: { __type: 'date', value: `2024-${String(month).padStart(2, '0')}-01` }, y: y },
                        end: {
                            x: { __type: 'date', value: `2024-${String(month + 2).padStart(2, '0')}-01` },
                            y: y - 30,
                        },
                    };
                }),
            });
            await compare();
        });

        it('should render horizontal line annotations with text', async () => {
            await prepareChart({
                annotations: annotations.map((annotation, index) => ({
                    ...(annotation as any),
                    type: 'horizontal-line',
                    value: 90 - index * 10,
                })),
            });
            await compare();
        });

        it('should render vertical line annotations with text', async () => {
            await prepareChart({
                annotations: annotations.map((annotation, index) => ({
                    ...(annotation as any),
                    type: 'vertical-line',
                    value: { __type: 'date', value: `2024-${String(2 + index).padStart(2, '0')}-01` },
                })),
            });
            await compare();
        });

        it('should render parallel channel annotations with text', async () => {
            await prepareChart({
                annotations: annotations.map((annotation, index) => {
                    let y = 100;
                    if (index > 2) y = 70;
                    if (index > 5) y = 40;
                    const month = [2, 6, 10][index % 3];

                    return {
                        text: {
                            ...annotation.text,
                            position: annotation.text.position === 'center' ? 'inside' : annotation.text.position,
                        },
                        type: 'parallel-channel',
                        start: { x: { __type: 'date', value: `2024-${String(month).padStart(2, '0')}-01` }, y: y },
                        end: {
                            x: { __type: 'date', value: `2024-${String(month + 2).padStart(2, '0')}-01` },
                            y: y - 20,
                        },
                        height: 15,
                    } as any;
                }),
            });
            await compare();
        });

        it('should render disjoint channel annotations with text', async () => {
            await prepareChart({
                annotations: annotations.map((annotation, index) => {
                    let y = 100;
                    if (index > 2) y = 70;
                    if (index > 5) y = 40;
                    const month = [2, 6, 10][index % 3];

                    return {
                        text: {
                            ...annotation.text,
                            position: annotation.text.position === 'center' ? 'inside' : annotation.text.position,
                        },
                        type: 'disjoint-channel',
                        start: { x: { __type: 'date', value: `2024-${String(month).padStart(2, '0')}-01` }, y: y },
                        end: {
                            x: { __type: 'date', value: `2024-${String(month + 2).padStart(2, '0')}-01` },
                            y: y - 20,
                        },
                        startHeight: 10,
                        endHeight: 20,
                    } as any;
                }),
            });
            await compare();
        });

        it('should render date price range annotations with text', async () => {
            await prepareChart({
                annotations: annotations.map((annotation, index) => {
                    let y = 100;
                    if (index > 2) y = 70;
                    if (index > 5) y = 40;
                    const month = [1, 5, 9][index % 3];

                    return {
                        ...(annotation as any),
                        type: 'date-price-range',
                        start: { x: { __type: 'date', value: `2024-${String(month).padStart(2, '0')}-01` }, y: y },
                        end: {
                            x: { __type: 'date', value: `2024-${String(month + 3).padStart(2, '0')}-01` },
                            y: y - 20,
                        },
                    };
                }),
            });
            await compare();
        });

        it('should render stacked annotations with text', async () => {
            await prepareChart({
                annotations: [
                    {
                        type: 'vertical-line',
                        value: { __type: 'date', value: '2024-05-01' },
                        text: {
                            label: 'Lorem ipsum',
                            position: 'center',
                            alignment: 'center',
                        },
                    },
                    {
                        type: 'parallel-channel',
                        start: { x: { __type: 'date', value: '2024-03-01' }, y: 40 },
                        end: { x: { __type: 'date', value: '2024-09-01' }, y: 90 },
                        height: 30,
                    },
                    {
                        type: 'vertical-line',
                        value: { __type: 'date', value: '2024-07-01' },
                        text: {
                            label: 'Lorem ipsum',
                            position: 'center',
                            alignment: 'center',
                        },
                    },
                ],
            });
            await compare();
        });
    });

    describe('extending lines', () => {
        it('should render an extended parallel-channel annotation', async () => {
            await prepareChart({
                annotations: [
                    {
                        type: 'parallel-channel',
                        start: { x: { __type: 'date', value: '2024-03-01' }, y: 40 },
                        end: { x: { __type: 'date', value: '2024-09-01' }, y: 90 },
                        height: 30,
                        extendStart: true,
                        extendEnd: true,
                    },
                ],
            });
            await compare();
        });
    });

    describe('bar series with groupPercentage', () => {
        const BAR_SERIES_OPTIONS: AgCartesianChartOptions = {
            data: [
                { category: 'Q1', value: 50 },
                { category: 'Q2', value: 70 },
                { category: 'Q3', value: 60 },
                { category: 'Q4', value: 80 },
            ],
            series: [{ type: 'bar', xKey: 'category', yKey: 'value' }],
            axes: {
                x: { type: 'category', position: 'bottom' },
                y: { type: 'number', position: 'left' },
            },
            annotations: {
                enabled: true,
                toolbar: {
                    enabled: false,
                },
            },
            width: 800,
            height: 400,
        };

        it('should render vertical line annotations at extreme groupPercentage values', async () => {
            await prepareChart(
                {
                    annotations: [
                        {
                            type: 'vertical-line',
                            value: { value: 'Q2', groupPercentage: -0.5 },
                            text: { label: '-0.5' },
                        },
                        {
                            type: 'vertical-line',
                            value: { value: 'Q2', groupPercentage: -1 },
                            text: { label: '-1' },
                        },
                        {
                            type: 'vertical-line',
                            value: { value: 'Q2', groupPercentage: 0 },
                            text: { label: '0' },
                        },
                        {
                            type: 'vertical-line',
                            value: { value: 'Q3', groupPercentage: 1 },
                            text: { label: '1' },
                        },
                        {
                            type: 'vertical-line',
                            value: { value: 'Q3', groupPercentage: 2 },
                            text: { label: '2' },
                        },
                    ],
                },
                BAR_SERIES_OPTIONS
            );
            await compare();
        });

        it('should render annotations on grouped bar series', async () => {
            const GROUPED_BAR_OPTIONS: AgCartesianChartOptions = {
                data: [
                    { category: 'Q1', sales: 50, profit: 30, expenses: 20 },
                    { category: 'Q2', sales: 70, profit: 45, expenses: 25 },
                    { category: 'Q3', sales: 60, profit: 35, expenses: 25 },
                    { category: 'Q4', sales: 80, profit: 50, expenses: 30 },
                ],
                series: [
                    { type: 'bar', xKey: 'category', yKey: 'sales', yName: 'Sales' },
                    { type: 'bar', xKey: 'category', yKey: 'profit', yName: 'Profit' },
                    { type: 'bar', xKey: 'category', yKey: 'expenses', yName: 'Expenses' },
                ],
                axes: {
                    x: { type: 'category', position: 'bottom' },
                    y: { type: 'number', position: 'left' },
                },
                annotations: {
                    enabled: true,
                    toolbar: {
                        enabled: false,
                    },
                },
                width: 800,
                height: 400,
            };

            await prepareChart(
                {
                    annotations: [
                        {
                            type: 'vertical-line',
                            value: { value: 'Q2', groupPercentage: -1 },
                            text: { label: 'Far left' },
                        },
                        {
                            type: 'vertical-line',
                            value: { value: 'Q2', groupPercentage: 0 },
                            text: { label: 'Center' },
                        },
                        {
                            type: 'vertical-line',
                            value: { value: 'Q3', groupPercentage: 1.5 },
                            text: { label: 'Far right' },
                        },
                        {
                            type: 'horizontal-line',
                            value: 40,
                            text: { label: 'Target' },
                        },
                    ],
                },
                GROUPED_BAR_OPTIONS
            );
            await compare();
        });

        it('should render point annotations with groupPercentage on bar series', async () => {
            await prepareChart(
                {
                    annotations: [
                        {
                            type: 'text',
                            text: 'Left',
                            x: { value: 'Q1', groupPercentage: -1 },
                            y: 60,
                        },
                        {
                            type: 'comment',
                            text: 'Center',
                            x: { value: 'Q2', groupPercentage: 0 },
                            y: 80,
                        },
                        {
                            type: 'note',
                            text: 'Right',
                            x: { value: 'Q3', groupPercentage: 1 },
                            y: 70,
                        },
                        {
                            type: 'callout',
                            text: 'Outside',
                            start: { x: { value: 'Q4', groupPercentage: 1.5 }, y: 90 },
                            end: { x: { value: 'Q4', groupPercentage: 2 }, y: 100 },
                        },
                    ],
                },
                BAR_SERIES_OPTIONS
            );
            await compare();
        });
    });
});
