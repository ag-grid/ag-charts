import { getDocument } from 'ag-charts-core';
import {
    AgAxisLabelFormatterParams,
    AgBarSeriesItemStylerParams,
    AgCartesianChartOptions,
    AgChartInstance,
} from 'ag-charts-types';

import { AgCharts } from '../api/agCharts';
import type {
    MockAPICallback,
    MockAxisLabelFormatter,
    MockBarItemStyler,
    MockOverlayRenderer,
    MockSeriesLabelFormatter,
    MockTooltipRenderer,
} from './test/freezableMock';
import { newFreezableMock } from './test/freezableMock';
import {
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
    const myTest: AgCartesianChartOptions<any, number> = {
        theme: {
            overrides: {
                common: {
                    axes: {
                        number: {},
                    },
                },
            },
        },
    };
    myTest satisfies any;

    type TDatum = { quarter: 'q1' | 'q2' | 'q3' | 'q4'; Toyota: number; Ford: number; BMW: number };
    type TContext = { name: string };
    type TFreezable<TMock extends MockAPICallback<TDatum, TContext>> = ReturnType<typeof newFreezable<TMock>>;

    let chart: Chart;
    let options: AgCartesianChartOptions<TDatum, TContext>;
    let seriesContext0: TContext;
    let seriesContext1: TContext;
    let seriesContext2: TContext;
    let axisContext: TContext;
    let rootContext: TContext;
    let itemStyler: TFreezable<MockBarItemStyler<TDatum, TContext>>;
    let axisLabelFormatter: TFreezable<MockAxisLabelFormatter<TDatum, TContext>>;
    let seriesLabelFormatter: TFreezable<MockSeriesLabelFormatter<TDatum, TContext>>;
    let tooltipRenderer: TFreezable<MockTooltipRenderer<TDatum, TContext>>;

    function newFreezable<TMock extends MockAPICallback<TDatum, TContext>>(fn: TMock) {
        return newFreezableMock<TDatum, TContext, TMock>(fn);
    }

    async function oneTooltipCallback() {
        await hoverAction(130, 363)(chart); // datum 1, series 1
        await waitForChartStability(chart);
    }

    async function threeTooltipCallback() {
        await hoverAction(130, 363)(chart); // datum 1, series 1
        await waitForChartStability(chart);
        await hoverAction(163, 369)(chart); // datum 2, series 1
        await waitForChartStability(chart);
        await hoverAction(205, 370)(chart); // datum 3, series 1
        await waitForChartStability(chart);
    }

    beforeEach(() => {
        seriesContext0 = { name: '[0]: toyota' };
        seriesContext1 = { name: '[1]: ford' };
        seriesContext2 = { name: '[2]: bmw' };
        axisContext = { name: 'X axis context' };
        rootContext = { name: 'root context' };
        itemStyler = newFreezable<MockBarItemStyler<TDatum, TContext>>(
            (params: AgBarSeriesItemStylerParams<TDatum, TContext>) => {
                params.context satisfies TContext | undefined;
                return undefined;
            }
        );
        axisLabelFormatter = newFreezable<MockAxisLabelFormatter<TDatum, TContext>>(
            (params: AgAxisLabelFormatterParams<TContext>) => {
                params.context satisfies TContext | undefined;
                return undefined;
            }
        );
        seriesLabelFormatter = newFreezable<MockSeriesLabelFormatter<TDatum, TContext>>((params) => {
            params.context satisfies TContext | undefined;
            return undefined;
        });
        tooltipRenderer = newFreezable<MockTooltipRenderer<TDatum, TContext>>((params) => {
            params.context satisfies TContext | undefined;
            return '';
        });
        options = {
            theme: {
                overrides: {
                    bar: {
                        series: {
                            itemStyler: itemStyler.frozen,
                            label: { enabled: true, formatter: seriesLabelFormatter.frozen },
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
            axes: {
                x: {
                    type: 'category',
                    position: 'bottom',
                    label: { formatter: axisLabelFormatter.frozen },
                    context: axisContext,
                },
                y: { type: 'number', position: 'left' },
            },
        };
    });

    afterEach(() => {
        expect(Object.isFrozen(seriesContext0)).toBe(false);
        expect(Object.isFrozen(seriesContext1)).toBe(false);
        expect(Object.isFrozen(seriesContext2)).toBe(false);
        expect(Object.isFrozen(axisContext)).toBe(false);
        expect(Object.isFrozen(rootContext)).toBe(false);
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
    });

    describe('without root context', () => {
        beforeEach(async () => {
            chart = await createChart(options);
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
            axisLabelFormatter.expect().toHaveBeenCalledTimes(8).withContext(axisContext);
        });
        test('tooltipRenderer', async () => {
            tooltipRenderer.expect().toHaveBeenCalledTimes(0);
            await threeTooltipCallback();
            tooltipRenderer.expect().toHaveBeenCalledTimes(9);
            tooltipRenderer.expect().nthCalledWithContext(0, seriesContext0);
            tooltipRenderer.expect().nthCalledWithContext(1, seriesContext1);
            tooltipRenderer.expect().nthCalledWithContext(2, seriesContext2);
            tooltipRenderer.expect().nthCalledWithContext(3, seriesContext1);
            tooltipRenderer.expect().nthCalledWithContext(4, seriesContext0);
            tooltipRenderer.expect().nthCalledWithContext(5, seriesContext2);
            tooltipRenderer.expect().nthCalledWithContext(6, seriesContext2);
            tooltipRenderer.expect().nthCalledWithContext(7, seriesContext0);
            tooltipRenderer.expect().nthCalledWithContext(8, seriesContext1);
        });
    });

    describe('with root context', () => {
        beforeEach(() => {
            options.context = rootContext;
        });
        test('no pass-through', async () => {
            chart = await createChart(options);
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
            axisLabelFormatter.expect().toHaveBeenCalledTimes(8).withContext(axisContext);
            await oneTooltipCallback();
            tooltipRenderer.expect().toHaveBeenCalledTimes(3);
            tooltipRenderer.expect().nthCalledWithContext(0, seriesContext0);
        });
        test('with pass-through', async () => {
            delete options.series![0].context;
            delete options.series![1].context;
            delete options.series![2].context;
            delete options.axes!.x!.context;
            chart = await createChart(options);
            itemStyler.expect().toHaveBeenCalledTimes(12).withContext(rootContext);
            seriesLabelFormatter.expect().toHaveBeenCalledTimes(12).withContext(rootContext);
            axisLabelFormatter.expect().toHaveBeenCalledTimes(8).withContext(rootContext);
            await oneTooltipCallback();
            tooltipRenderer.expect().toHaveBeenCalledTimes(3).withContext(rootContext);
        });
    });

    describe('nullish', () => {
        describe('without root context', () => {
            beforeEach(() => {
                delete options.context;
            });
            test('undefined', async () => {
                delete options.series![0].context;
                delete options.series![1].context;
                delete options.series![2].context;
                delete options.axes!.x!.context;
                chart = await createChart(options);
                itemStyler.expect().toHaveBeenCalledTimes(12).withoutContext();
                seriesLabelFormatter.expect().toHaveBeenCalledTimes(12).withoutContext();
                axisLabelFormatter.expect().toHaveBeenCalledTimes(8).withoutContext();
                await oneTooltipCallback();
                tooltipRenderer.expect().toHaveBeenCalledTimes(3).withoutContext();
            });
            test('defined to undefined', async () => {
                options.series![0].context = undefined;
                options.series![1].context = undefined;
                options.series![2].context = undefined;
                options.axes!.x!.context = undefined;
                chart = await createChart(options);
                itemStyler.expect().toHaveBeenCalledTimes(12).withoutContext();
                seriesLabelFormatter.expect().toHaveBeenCalledTimes(12).withoutContext();
                axisLabelFormatter.expect().toHaveBeenCalledTimes(8).withoutContext();
                await oneTooltipCallback();
                tooltipRenderer.expect().toHaveBeenCalledTimes(3).withoutContext();
            });
            test('defined to null', async () => {
                options.series![0].context = null as unknown as TContext;
                options.series![1].context = null as unknown as TContext;
                options.series![2].context = null as unknown as TContext;
                options.axes!.x!.context = null as unknown as TContext;
                chart = await createChart(options);
                itemStyler.expect().toHaveBeenCalledTimes(12).withContext(null);
                seriesLabelFormatter.expect().toHaveBeenCalledTimes(12).withContext(null);
                axisLabelFormatter.expect().toHaveBeenCalledTimes(8).withContext(null);
                await oneTooltipCallback();
                tooltipRenderer.expect().toHaveBeenCalledTimes(3).withContext(null);
            });
        });
        describe('with root context', () => {
            beforeEach(() => {
                options.context = rootContext;
            });
            test('defined to undefined', async () => {
                options.series![0].context = undefined;
                options.series![1].context = undefined;
                options.series![2].context = undefined;
                options.axes!.x!.context = undefined;
                chart = await createChart(options);
                itemStyler.expect().toHaveBeenCalledTimes(12).withContext(rootContext);
                seriesLabelFormatter.expect().toHaveBeenCalledTimes(12).withContext(rootContext);
                axisLabelFormatter.expect().toHaveBeenCalledTimes(8).withContext(rootContext);
                await oneTooltipCallback();
                tooltipRenderer.expect().toHaveBeenCalledTimes(3).withContext(rootContext);
            });
            test('defined to null', async () => {
                options.series![0].context = null as unknown as TContext;
                options.series![1].context = null as unknown as TContext;
                options.series![2].context = null as unknown as TContext;
                options.axes!.x!.context = null as unknown as TContext;
                chart = await createChart(options);
                itemStyler.expect().toHaveBeenCalledTimes(12).withContext(null);
                seriesLabelFormatter.expect().toHaveBeenCalledTimes(12).withContext(null);
                axisLabelFormatter.expect().toHaveBeenCalledTimes(8).withContext(null);
                await oneTooltipCallback();
                tooltipRenderer.expect().toHaveBeenCalledTimes(3).withContext(null);
            });
        });
    });
});

describe('AG-13024 API context - overlays', () => {
    setupMockConsole();
    setupMockCanvas();

    type TDatum = undefined;
    type TContext = { name: string };
    type TMock = MockOverlayRenderer<TDatum, TContext>;
    let chart: Chart;
    let context: TContext;
    let overlayRenderer: ReturnType<typeof newFreezableMock<TDatum, TContext, TMock>>;

    beforeEach(() => {
        context = { name: 'myContext' };
        overlayRenderer = newFreezableMock<TDatum, TContext, TMock>((params) => {
            params.context satisfies TContext | undefined;
            return '';
        });
    });

    afterEach(() => {
        chart?.destroy();
        (chart as unknown) = undefined;
        expect(Object.isFrozen(context)).toBe(false);
    });

    test('with context', async () => {
        await createChart({
            context,
            overlays: { noData: { renderer: overlayRenderer.frozen } },
        });
        overlayRenderer.expect().toHaveBeenCalledTimes(1).withContext(context);
    });

    test('without context', async () => {
        await createChart({
            overlays: { noData: { renderer: overlayRenderer.frozen } },
        });
        overlayRenderer.expect().toHaveBeenCalledTimes(1).withoutContext();
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
            series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
            tooltip: { context: {} },
        };
        chart = await createChart(opts);
        expectWarningsCalls().toMatchSnapshot();
    });
    test('legend.context error', async () => {
        const opts: AgCartesianChartOptions & { legend: { context: unknown } } = {
            data: [{ x: 0, y: 0 }],
            series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
            legend: { context: {} },
        };
        chart = await createChart(opts);
        expectWarningsCalls().toMatchSnapshot();
    });
});

describe('AG-15283 context precedence', () => {
    let chart: Chart;
    setupMockCanvas();
    afterEach(() => chart?.destroy());

    test('context precedence', async () => {
        const opts: AgCartesianChartOptions = {
            data: [
                { quarter: "Q1'18", iphone: 140, mac: 16 },
                { quarter: "Q2'18", iphone: 124, mac: 20 },
                { quarter: "Q3'18", iphone: 112, mac: 20 },
                { quarter: "Q4'18", iphone: 118, mac: 24 },
            ],
            series: [
                {
                    type: 'bar',
                    xKey: 'quarter',
                    yKey: 'iphone',
                    context: {
                        source: 'series-iphone',
                    },
                },
                {
                    type: 'bar',
                    xKey: 'quarter',
                    yKey: 'mac',
                },
            ],
            axes: {
                x: {
                    type: 'category',
                    position: 'bottom',
                    context: {
                        source: 'axis-category',
                    },
                },
                y: {
                    type: 'number',
                    position: 'left',
                    context: {
                        source: 'axis-number',
                    },
                },
            },
            context: {
                source: 'root',
            },
            formatter: (params) => {
                return (params.context as any)?.source;
            },
        };

        chart = await createChart(opts);

        await hoverAction(130, 363)(chart); // datum 1, series 1
        await waitForChartStability(chart);

        const element = Array.from(getDocument('body').querySelectorAll('.ag-charts-tooltip span'));
        expect(element.map((e) => e.textContent)).toEqual([
            'series-iphone', // x value
            '',
            'iphone', // (series name)
            'series-iphone', // y value
            'axis-category', // x value
            '',
            'mac', // (series name)
            'axis-number', // x value
        ]);
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
                        series: {
                            highlight: { highlightedItem: { fillOpacity: 0, stroke: undefined, strokeWidth: 0 } },
                        },
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
