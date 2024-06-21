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
});
