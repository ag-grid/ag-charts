import { AgCartesianChartOptions, AgChartInstance } from 'ag-charts-types';

import { AgCharts } from '../api/agCharts';
import type {
    MockAxisLabelFormatter,
    MockItemStyler,
    MockSeriesLabelFormatter,
    MockTooltipRenderer,
} from './test/freezableMock';
import { newFreezableMock } from './test/freezableMock';
import {
    AgCartesianChartOptionsWithContext,
    Chart,
    IMAGE_SNAPSHOT_DEFAULTS,
    createChart,
    expectWarningsCalls,
    extractImageData,
    hoverAction,
    prepareTestOptions,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from './test/utils';

describe('AG-13024 API context', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: Chart;
    let options: AgCartesianChartOptionsWithContext;
    let seriesContext0: object;
    let seriesContext1: object;
    let seriesContext2: object;
    let axisContext: object;
    const itemStyler = newFreezableMock<MockItemStyler>((_params) => undefined);
    const axisLabelFormatter = newFreezableMock<MockAxisLabelFormatter>((_params: any) => undefined);
    const seriesLabelFormatter = newFreezableMock<MockSeriesLabelFormatter>((_params) => undefined);
    const tooltipRenderer = newFreezableMock<MockTooltipRenderer>((_params) => '');

    beforeEach(async () => {
        seriesContext0 = { name: '[0]: toyota' };
        seriesContext1 = { name: '[1]: ford' };
        seriesContext2 = { name: '[2]: bmw' };
        axisContext = { name: 'X axis context' };
        itemStyler.mock.mockClear();
        axisLabelFormatter.mock.mockClear();
        seriesLabelFormatter.mock.mockClear();
        tooltipRenderer.mock.mockClear();
        options = {
            theme: {
                overrides: {
                    bar: {
                        series: {
                            itemStyler: itemStyler.frozen,
                            label: { formatter: seriesLabelFormatter.frozen },
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
                    label: { formatter: axisLabelFormatter.frozen },
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
        expect(Object.isFrozen(axisContext)).toBe(false);
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
    test('seriesLabelFormatter', () => {
        seriesLabelFormatter.expect().toHaveBeenCalledTimes(12);
        seriesLabelFormatter.expect().nthCalledWithContext(0, seriesContext0);
        seriesLabelFormatter.expect().nthCalledWithContext(1, seriesContext0);
        seriesLabelFormatter.expect().nthCalledWithContext(2, seriesContext0);
        seriesLabelFormatter.expect().nthCalledWithContext(3, seriesContext0);
        seriesLabelFormatter.expect().nthCalledWithContext(4, seriesContext1);
        seriesLabelFormatter.expect().nthCalledWithContext(5, seriesContext1);
        seriesLabelFormatter.expect().nthCalledWithContext(6, seriesContext1);
        seriesLabelFormatter.expect().nthCalledWithContext(7, seriesContext1);
        seriesLabelFormatter.expect().nthCalledWithContext(8, seriesContext2);
        seriesLabelFormatter.expect().nthCalledWithContext(9, seriesContext2);
        seriesLabelFormatter.expect().nthCalledWithContext(10, seriesContext2);
        seriesLabelFormatter.expect().nthCalledWithContext(11, seriesContext2);
    });
    test('axisLabelFormatter', () => {
        axisLabelFormatter.expect().toHaveBeenCalledTimes(4).withContext(axisContext);
    });
    test('tooltipRenderer', async () => {
        tooltipRenderer.expect().toHaveBeenCalledTimes(0);

        await hoverAction(130, 363)(chart); // datum 1, series 1
        await waitForChartStability(chart);
        await hoverAction(163, 369)(chart); // datum 2, series 1
        await waitForChartStability(chart);
        await hoverAction(205, 370)(chart); // datum 3, series 1
        await waitForChartStability(chart);

        tooltipRenderer.expect().toHaveBeenCalledTimes(6);
        tooltipRenderer.expect().nthCalledWithContext(0, seriesContext0);
        tooltipRenderer.expect().nthCalledWithContext(1, seriesContext0);
        tooltipRenderer.expect().nthCalledWithContext(2, seriesContext1);
        tooltipRenderer.expect().nthCalledWithContext(3, seriesContext1);
        tooltipRenderer.expect().nthCalledWithContext(4, seriesContext2);
        tooltipRenderer.expect().nthCalledWithContext(5, seriesContext2);
    });
});

describe('AG-13024 API context validation', () => {
    let chart: Chart;
    setupMockConsole();
    setupMockCanvas();
    afterEach(() => chart?.destroy());
    test('tooltip.context error', async () => {
        const opts: AgCartesianChartOptions & { tooltip: { context: unknown } } = {
            data: [{ x: 0, y: 0 }],
            series: [{ xKey: 'x', yKey: 'y' }],
            tooltip: { context: {} },
        };
        chart = await createChart(opts);
        expectWarningsCalls().toMatchSnapshot();
    });
    test('legend.context error', async () => {
        const opts: AgCartesianChartOptions & { legend: { context: unknown } } = {
            data: [{ x: 0, y: 0 }],
            series: [{ xKey: 'x', yKey: 'y' }],
            legend: { context: {} },
        };
        chart = await createChart(opts);
        expectWarningsCalls().toMatchSnapshot();
    });
});

describe('callback cache', () => {
    let chart: AgChartInstance;
    setupMockConsole();
    const ctx = setupMockCanvas();

    async function compare(customSnapshotIdentifier: string) {
        await waitForChartStability(chart);
        const imageData = extractImageData(ctx);
        expect(imageData).toMatchImageSnapshot({
            ...IMAGE_SNAPSHOT_DEFAULTS,
            failureThreshold: 0,
            customSnapshotIdentifier,
        });
    }

    afterEach(() => chart?.destroy());
    test('AG-10112 re-evaluate callbacks on update', async () => {
        let selectedCountry: string;

        const opts = prepareTestOptions({
            data: [
                { gdp: 1419, country: 'Spain' },
                { gdp: 2855, country: 'UK' },
                { gdp: 3948, country: 'Germany' },
            ],
            series: [
                {
                    type: 'bar',
                    xKey: 'country',
                    yKey: 'gdp',
                    showInLegend: false,
                    itemStyler: (params) => {
                        return { fill: params.datum[params.xKey] === selectedCountry ? 'red' : params.fill };
                    },
                },
            ],
            tooltip: { enabled: false },
            theme: {
                overrides: {
                    bar: {
                        series: { highlightStyle: { item: { fillOpacity: 0, stroke: undefined, strokeWidth: 0 } } },
                    },
                },
            },
        });

        selectedCountry = 'Spain';
        chart = AgCharts.create(opts);
        await compare('AG-10112-reevaluate-Spain');

        selectedCountry = 'UK';
        await chart.update(opts);
        await compare('AG-10112-reevaluate-UK');

        selectedCountry = 'Germany';
        await chart.update(opts);
        await compare('AG-10112-reevaluate-Germany');
    });
});
