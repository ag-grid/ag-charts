import type { MockItemStyler, MockLabelFormatter, MockTooltipRenderer } from './test/freezableMock';
import { newFreezableMock } from './test/freezableMock';
import {
    AgCartesianChartOptionsWithContext,
    Chart,
    createChart,
    hoverAction,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from './test/utils';

describe('Chart', () => {
    setupMockConsole({ debugShowOutput: true });
    setupMockCanvas();

    let chart: Chart;
    let options: AgCartesianChartOptionsWithContext;
    let itemStyler = newFreezableMock<MockItemStyler>((_params) => undefined);
    let labelFormatter = newFreezableMock<MockLabelFormatter>((_params) => undefined);
    let tooltipRenderer = newFreezableMock<MockTooltipRenderer>((_params) => '');
    let seriesContext: object;
    let axisContext: object;

    beforeEach(async () => {
        seriesContext = {};
        axisContext = {};
        itemStyler.mock.mockClear();
        labelFormatter.mock.mockClear();
        tooltipRenderer.mock.mockClear();
        options = {
            theme: {
                overrides: {
                    bar: {
                        series: {
                            itemStyler: itemStyler.frozen,
                            label: { formatter: labelFormatter.frozen },
                            tooltip: { renderer: tooltipRenderer.frozen },
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
                { type: 'bar', xKey: 'quarter', yKey: 'Toyota', context: seriesContext },
                { type: 'bar', xKey: 'quarter', yKey: 'Ford', context: seriesContext },
                { type: 'bar', xKey: 'quarter', yKey: 'BMW', context: seriesContext },
            ],
            axes: [
                {
                    type: 'category',
                    position: 'bottom',
                    label: {
                        formatter: (params) => `Quarter ${params.value.toUpperCase()}`,
                    },
                    context: axisContext,
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

    test('itemStyler', () => {
        itemStyler.expect().toHaveBeenCalledTimes(12).withContext(seriesContext);
    });
    xtest('labelFormatter', () => {
        labelFormatter.expect().toHaveBeenCalledTimes(12).withContext(axisContext);
    });
    xtest('tooltipRenderer', async () => {
        tooltipRenderer.expect().toHaveBeenCalledTimes(0);

        await hoverAction(53, 363)(chart); // datum 1, series 1
        await waitForChartStability(chart);

        await hoverAction(87, 369)(chart); // datum 2, series 1
        await waitForChartStability(chart);

        await hoverAction(128, 370)(chart); // datum 3, series 1
        await waitForChartStability(chart);

        tooltipRenderer.expect().toHaveBeenCalledTimes(3).withContext(seriesContext);
    });
});
