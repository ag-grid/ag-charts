import { AgBarSeriesStyle, AgCartesianChartOptions, AgTooltipRendererResult } from 'ag-charts-types';

import { Chart, createChart, setupMockCanvas, setupMockConsole } from './test/utils';

type UndocumentedOptions = Omit<AgCartesianChartOptions, 'series' | 'axes'> & {
    series?: (NonNullable<AgCartesianChartOptions['series']>[number] & { context?: unknown })[];
    axes?: (NonNullable<AgCartesianChartOptions['axes']>[number] & { context?: unknown })[];
};

describe('Chart', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: Chart;
    let options: UndocumentedOptions;
    let itemStyler: jest.Mock<AgBarSeriesStyle | undefined, unknown[], unknown>;
    let labelFormatter: jest.Mock<string, unknown[], unknown>;
    let tooltipRenderer: jest.Mock<string | AgTooltipRendererResult, unknown[], unknown>;

    beforeEach(async () => {
        itemStyler = jest.fn<AgBarSeriesStyle | undefined, unknown[], unknown>();
        labelFormatter = jest.fn<string, unknown[], unknown>();
        tooltipRenderer = jest.fn<string | AgTooltipRendererResult, unknown[], unknown>();
        options = {
            theme: {
                overrides: {
                    bar: {
                        series: {
                            itemStyler,
                            label: { formatter: labelFormatter },
                            tooltip: { renderer: tooltipRenderer },
                        },
                    },
                },
            },
            data: [
                { quarter: 'q1', Toyota: 120000, Ford: 95000, BMW: 80000 },
                { quarter: 'q2', Toyota: 150000, Ford: 110000, BMW: 90000 },
                { quarter: 'q3', Toyota: 170000, Ford: 120000, BMW: 95000 },
                { quarter: 'q4', Toyota: 160000, Ford: 115000, BMW: 92000 },
            ],
            series: [
                { type: 'bar', xKey: 'quarter', yKey: 'Toyota' },
                { type: 'bar', xKey: 'quarter', yKey: 'Ford' },
                { type: 'bar', xKey: 'quarter', yKey: 'BMW' },
            ],
            axes: [
                {
                    type: 'category',
                    position: 'bottom',
                    label: {
                        formatter: (params) => `Quarter ${params.value.toUpperCase()}`,
                    },
                },
                { type: 'number', position: 'left' },
            ],
        };
        chart = await createChart(options);
    });

    afterEach(() => {
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
    });

    test('TODO', () => {
        expect(itemStyler).not.toHaveBeenCalled();
        expect(labelFormatter).not.toHaveBeenCalled();
        expect(tooltipRenderer).not.toHaveBeenCalled();
    });
});
