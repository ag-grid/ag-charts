import { afterEach, describe, expect, it } from '@jest/globals';

import { type AgCartesianChartOptions, AgCharts } from 'ag-charts-community';
import { clickAction, extractImageData, setupMockCanvas, waitForChartStability } from 'ag-charts-community-test';

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

    let width = 0;
    let height = 0;

    async function prepareChart(
        annotationsOptions?: AgCartesianChartOptions['annotations'],
        baseOptions = EXAMPLE_OPTIONS
    ) {
        const options: AgCartesianChartOptions = {
            ...baseOptions,
            annotations: { ...baseOptions.annotations, ...(annotationsOptions ?? {}) },
        };
        prepareEnterpriseTestOptions(options);
        width = options.width!;
        height = options.height!;
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
                initial: [
                    {
                        type: 'line',
                        start: { x: new Date('2024-03-01'), y: 25 },
                        end: { x: new Date('2024-09-01'), y: 75 },
                    },
                ],
            });
            await compare();
        });

        it('should render a horizontal cross-line annotation', async () => {
            await prepareChart({
                initial: [
                    {
                        type: 'cross-line',
                        direction: 'horizontal',
                        value: 75,
                    },
                ],
            });
            await compare();
        });

        it('should render a vertical cross-line annotation', async () => {
            await prepareChart({
                initial: [
                    {
                        type: 'cross-line',
                        direction: 'vertical',
                        value: new Date('2024-09-01'),
                    },
                ],
            });
            await compare();
        });

        it('should render a parallel-channel annotation', async () => {
            await prepareChart({
                initial: [
                    {
                        type: 'parallel-channel',
                        start: { x: new Date('2024-03-01'), y: 40 },
                        end: { x: new Date('2024-09-01'), y: 90 },
                        height: 30,
                    },
                ],
            });
            await compare();
        });

        it('should render a disjoint-channel annotation', async () => {
            await prepareChart({
                initial: [
                    {
                        type: 'disjoint-channel',
                        start: { x: new Date('2024-03-01'), y: 35 },
                        end: { x: new Date('2024-09-01'), y: 95 },
                        startHeight: 20,
                        endHeight: 40,
                    },
                ],
            });
            await compare();
        });
    });

    describe('cross-line', () => {
        it('when y-axis is clicked it should create a horizontal cross-line', async () => {
            await prepareChart();
            await clickAction(40, height / 3)(chart);
            await compare();
        });

        it('when x-axis is clicked it should create a vertical cross-line', async () => {
            await prepareChart();
            await clickAction(width / 3, height - 30)(chart);
            await compare();
        });
    });
});
