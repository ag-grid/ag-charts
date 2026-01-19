import { afterEach, describe, expect } from '@jest/globals';

import { type AgChartLegendPosition, type AgChartOptions, AgCharts } from 'ag-charts-community';
import {
    IMAGE_SNAPSHOT_DEFAULTS,
    extractImageData,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from 'ag-charts-community-test';

import { prepareEnterpriseTestOptions } from '../test/utils';

describe('GradientLegend', () => {
    setupMockConsole();

    let chart: any;
    const ctx = setupMockCanvas();

    afterEach(() => {
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
    });

    const EXAMPLE_OPTIONS: AgChartOptions = {
        data: [
            { year: '2020', person: 'Florian', spending: 10 },
            { year: '2020', person: 'Julian', spending: 20 },
            { year: '2020', person: 'Martian', spending: 30 },
            { year: '2021', person: 'Florian', spending: 20 },
            { year: '2021', person: 'Julian', spending: 30 },
            { year: '2021', person: 'Martian', spending: 40 },
            { year: '2022', person: 'Florian', spending: 30 },
            { year: '2022', person: 'Julian', spending: 40 },
            { year: '2022', person: 'Martian', spending: 50 },
        ],
        series: [
            {
                type: 'heatmap',
                xKey: 'year',
                yKey: 'person',
                colorKey: 'spending',
                colorRange: ['white', 'yellow', 'red', 'blue', 'black'],
            },
        ],
        legend: {
            enabled: true,
        },
        gradientLegend: {
            gradient: {
                preferredLength: 200,
            },
        },
    };

    const compare = async () => {
        await waitForChartStability(chart);

        const imageData = extractImageData(ctx);
        expect(imageData).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);
    };

    describe('AG-7868 gradientLegend.position', () => {
        async function testPosition(position: AgChartLegendPosition) {
            const options: AgChartOptions = { ...EXAMPLE_OPTIONS };
            prepareEnterpriseTestOptions(options as any);
            options.gradientLegend!.position = position;
            chart = AgCharts.create(options);
            await compare();
        }

        test('top', async () => {
            await testPosition('top');
        });
        test('top-right', async () => {
            await testPosition('top-right');
        });
        test('top-left', async () => {
            await testPosition('top-left');
        });
        test('bottom', async () => {
            await testPosition('bottom');
        });
        test('bottom-right', async () => {
            await testPosition('bottom-right');
        });
        test('bottom-left', async () => {
            await testPosition('bottom-left');
        });
        test('right', async () => {
            await testPosition('right');
        });
        test('right-top', async () => {
            await testPosition('right-top');
        });
        test('right-bottom', async () => {
            await testPosition('right-bottom');
        });
        test('left', async () => {
            await testPosition('left');
        });
        test('left-top', async () => {
            await testPosition('left-top');
        });
        test('left-bottom', async () => {
            await testPosition('left-bottom');
        });
    });

    it('should render fill and border as expected', async () => {
        const options: AgChartOptions = {
            ...EXAMPLE_OPTIONS,
            gradientLegend: {
                ...EXAMPLE_OPTIONS.gradientLegend,
                position: 'bottom',
                border: { stroke: 'green', strokeWidth: 10 },
                fill: 'red',
                fillOpacity: 0.2,
                cornerRadius: 14,
                padding: 50,
            },
        };
        prepareEnterpriseTestOptions(options);
        chart = AgCharts.create(options);
        await compare();
    });
});
