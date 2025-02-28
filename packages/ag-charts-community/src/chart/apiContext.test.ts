import type { MockItemStyler, MockLabelFormatter, MockTooltipRenderer } from './test/freezableMock';
import { newFreezableMock } from './test/freezableMock';
import {
    AgCartesianChartOptionsWithContext,
    Chart,
    createChart,
    setupMockCanvas,
    setupMockConsole,
} from './test/utils';

describe('Chart', () => {
    setupMockConsole({ debugShowOutput: true });
    setupMockCanvas();

    let chart: Chart;
    let options: AgCartesianChartOptionsWithContext;
    let seriesContext0: object;
    let seriesContext1: object;
    let seriesContext2: object;
    let axisContext: object;
    const itemStyler = newFreezableMock<MockItemStyler>((_params) => undefined);
    const labelFormatter = newFreezableMock<MockLabelFormatter>((_params) => undefined);
    const tooltipRenderer = newFreezableMock<MockTooltipRenderer>((_params) => '');

    beforeEach(async () => {
        seriesContext0 = { name: '[0]: toyota' };
        seriesContext1 = { name: '[1]: ford' };
        seriesContext2 = { name: '[2]: bmw' };
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
                { type: 'bar', xKey: 'quarter', yKey: 'Toyota', context: seriesContext0 },
                { type: 'bar', xKey: 'quarter', yKey: 'Ford', context: seriesContext1 },
                { type: 'bar', xKey: 'quarter', yKey: 'BMW', context: seriesContext2 },
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
        expect(Object.isFrozen(seriesContext0)).toBe(false);
        expect(Object.isFrozen(seriesContext1)).toBe(false);
        expect(Object.isFrozen(seriesContext2)).toBe(false);
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
    });

    test('itemStyler', () => {
        itemStyler.expect().toHaveBeenCalledTimes(12);
        itemStyler.expect().nthCalledWithContext(0, seriesContext0);
        itemStyler.expect().nthCalledWithContext(1, seriesContext0);
        itemStyler.expect().nthCalledWithContext(2, seriesContext0);
        itemStyler.expect().nthCalledWithContext(3, seriesContext0);
        itemStyler.expect().nthCalledWithContext(4, seriesContext1);
        itemStyler.expect().nthCalledWithContext(5, seriesContext1);
        itemStyler.expect().nthCalledWithContext(6, seriesContext1);
        itemStyler.expect().nthCalledWithContext(7, seriesContext1);
        itemStyler.expect().nthCalledWithContext(8, seriesContext2);
        itemStyler.expect().nthCalledWithContext(9, seriesContext2);
        itemStyler.expect().nthCalledWithContext(10, seriesContext2);
        itemStyler.expect().nthCalledWithContext(11, seriesContext2);
    });
    /*
    // TODO: Skip these tests (`xtest` triggers a sonarjs/no-skipped-test lint error in the CI)
    test('labelFormatter', () => {
        labelFormatter.expect().toHaveBeenCalledTimes(12).withContext(axisContext);
    });
    test('tooltipRenderer', async () => {
        tooltipRenderer.expect().toHaveBeenCalledTimes(0);

        await hoverAction(53, 363)(chart); // datum 1, series 1
        await waitForChartStability(chart);

        await hoverAction(87, 369)(chart); // datum 2, series 1
        await waitForChartStability(chart);

        await hoverAction(128, 370)(chart); // datum 3, series 1
        await waitForChartStability(chart);

        tooltipRenderer.expect().toHaveBeenCalledTimes(3).withContext(seriesContext);
    });
    //*/
});
