import { AgBarSeriesThemeableOptions, AgCartesianChartOptions } from 'ag-charts-types';

import { Chart, createChart, setupMockCanvas, setupMockConsole } from './test/utils';

type UndocumentedOptions = Omit<AgCartesianChartOptions, 'series' | 'axes'> & {
    series?: (NonNullable<AgCartesianChartOptions['series']>[number] & { context?: unknown })[];
    axes?: (NonNullable<AgCartesianChartOptions['axes']>[number] & { context?: unknown })[];
};
type ItemStyler = NonNullable<AgBarSeriesThemeableOptions['itemStyler']>;
type LabelFormatter = NonNullable<NonNullable<AgBarSeriesThemeableOptions['label']>['formatter']>;
type TooltipRenderer = NonNullable<NonNullable<AgBarSeriesThemeableOptions['tooltip']>['renderer']>;

// AG Charts calls Object.freeze on theme options, so we must create intermediate functions to circumvent that.
function initMock<F extends ItemStyler | LabelFormatter | TooltipRenderer>(mockImp: F) {
    type Rtn = ReturnType<F>;
    type Arg = Parameters<F>[0];

    const mock: jest.Mock<Rtn, Arg[], unknown> = jest.fn<any, any>(mockImp);
    const frozen = Object.freeze((params: Arg): Rtn => mock(params));
    return { mock, frozen };
}

describe('Chart', () => {
    setupMockConsole({ debugShowOutput: true });
    setupMockCanvas();

    let chart: Chart;
    let options: UndocumentedOptions;
    let itemStyler = initMock<ItemStyler>((_params) => undefined);
    let labelFormatter = initMock<LabelFormatter>((_params) => undefined);
    let tooltipRenderer = initMock<TooltipRenderer>((_params) => '');

    beforeEach(async () => {
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
        expect(itemStyler.mock).not.toHaveBeenCalled();
        expect(labelFormatter.mock).not.toHaveBeenCalled();
        expect(tooltipRenderer.mock).not.toHaveBeenCalled();
    });
});
