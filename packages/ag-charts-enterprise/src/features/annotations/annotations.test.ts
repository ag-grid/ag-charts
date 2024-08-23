import { afterEach, describe, expect, it } from '@jest/globals';

import { type AgCartesianChartOptions, AgCharts } from 'ag-charts-community';
import { extractImageData, setupMockCanvas, waitForChartStability } from 'ag-charts-community-test';

import { prepareEnterpriseTestOptions } from '../../test/utils';

describe('Annotations', () => {
    let chart: any;
    const ctx = setupMockCanvas();

    const EXAMPLE_OPTIONS: AgCartesianChartOptions = {
        data: [
            { x: new Date('2024-01-05'), y: 5 },
            { x: new Date('2024-06-15'), y: 50 },
            { x: new Date('2024-12-25'), y: 95 },
        ],
        series: [{ type: 'scatter', xKey: 'x', yKey: 'y' }],
        axes: [{ type: 'number' }, { type: 'time' }],
        annotations: {
            enabled: true,
        },
        toolbar: {
            enabled: false,
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
});
