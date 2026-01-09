import { afterEach, describe, expect } from '@jest/globals';

import {
    AgAnnotationsEvent,
    AgChartClickEvent,
    AgChartContextMenuEvent,
    AgChartDoubleClickEvent,
    AgChartInstance,
    AgChartLegendClickEvent,
    AgChartLegendContextMenuEvent,
    AgChartLegendDoubleClickEvent,
    AgChartOptions,
    AgCharts,
    AgContextMenuItemShowOn,
    AgGaugeOptions,
    AgLinearGaugeOptions,
    AgNodeClickEvent,
    AgNodeContextMenuActionEvent,
    AgRadialGaugeOptions,
    AgSeriesAreaContextMenuActionEvent,
    AgSeriesVisibilityChange,
    AgZoomEvent,
} from 'ag-charts-community';
import {
    MockAPICallback,
    MockAnnotationsListener,
    MockChartClickListener,
    MockChartDblClickListener,
    MockChartLabelFormatter,
    MockChartSeriesVisibilityChangeListener,
    MockContextMenuAction,
    MockGetDataCallback,
    MockLegendItemClickListener,
    MockLegendItemDblClickListener,
    MockSeriesNodeClickListener,
    MockSeriesNodeDblClickListener,
    MockZoomListener,
    clickAction,
    contextMenuAction,
    doubleClickAction,
    newFreezableMock,
    scrollAction,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from 'ag-charts-community-test';
import { AgDataSourceCallbackParams } from 'ag-charts-types';

import { prepareEnterpriseTestOptions } from './test/utils';

describe('AG-14631 context enterprise', () => {
    setupMockConsole();
    setupMockCanvas();
    let chart: AgChartInstance;
    afterEach(() => {
        chart?.destroy();
        (chart as unknown) = undefined;
    });

    async function createChart(options: AgChartOptions<any, any>): Promise<AgChartInstance> {
        prepareEnterpriseTestOptions(options);
        chart = AgCharts.create(options);
        await waitForChartStability(chart);
        return chart;
    }

    test('zoom', async () => {
        type TDatum = Readonly<{ x: number; y: number }>;
        type TContext = Readonly<{ name: string }>;
        type TMock = MockZoomListener<TDatum, TContext>;
        const zoomListener = newFreezableMock<TDatum, TContext, TMock>((_params: AgZoomEvent) => {});
        const context: TContext = { name: 'chart context' } as const;
        const opts: AgChartOptions<TDatum, TContext> = {
            data: [
                { x: 0, y: 0 },
                { x: 1, y: 1 },
                { x: 2, y: 2 },
            ],
            context,
            series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
            zoom: { enabled: true },
            listeners: { zoom: zoomListener.frozen },
        };

        chart = await createChart(opts);
        await scrollAction(400, 300, -1)(chart);
        await scrollAction(400, 300, 1)(chart);

        expect(Object.isFrozen(context)).toBe(false);
        zoomListener.expect().toHaveBeenCalledTimes(3).withContext(context);
        expect(zoomListener.mock.mock.calls).toEqual([
            [expect.objectContaining({ source: 'chart-update' })], // callback event from `createChart`
            [expect.objectContaining({ source: 'user-interaction' })], // callback event from 1st `scrollAction`
            [expect.objectContaining({ source: 'user-interaction' })], // callback event from 2nd `scrollAction`
        ]);
    });

    test('annotations', async () => {
        type TDatum = Readonly<{ x: string; y: number }>;
        type TContext = Readonly<{ name: string }>;
        type TMock = MockAnnotationsListener<TDatum, TContext>;
        const annotationsListener = newFreezableMock<TDatum, TContext, TMock>((_params: AgAnnotationsEvent) => {});
        const context: TContext = { name: 'chart context' };
        const opts: AgChartOptions<TDatum, TContext> = {
            data: [
                { x: 'Jan', y: 62 },
                { x: 'Feb', y: 45 },
                { x: 'Mar', y: 38 },
            ],
            context,
            series: [{ type: 'line', xKey: 'x', yKey: 'y', context: { name: 'series context' } }],
            annotations: { enabled: true },
            listeners: { annotations: annotationsListener.frozen },
            initialState: { annotations: [{ type: 'comment', x: 'Feb', y: 46, text: '$45,000' }] },
        };

        chart = await createChart(opts);
        expect(Object.isFrozen(context)).toBe(false);
        annotationsListener.expect().toHaveBeenCalledTimes(1).withContext(context);
    });

    test('dataSource', async () => {
        type TDatum = Readonly<{ x: string; y: number }>;
        type TContext = Readonly<{ name: string }>;
        type TMock = MockGetDataCallback<TDatum, TContext>;
        const promise = new Promise<TDatum[]>((_resolve) => [
            { x: 'Jan', y: 62 },
            { x: 'Feb', y: 45 },
            { x: 'Mar', y: 38 },
        ]);
        const imp = (_params: AgDataSourceCallbackParams<TContext>): Promise<TDatum[]> => promise;
        const getDataCallback = newFreezableMock<TDatum, TContext, TMock>(imp);
        const chartContext: TContext = { name: 'chart context' };
        const seriesContext: TContext = { name: 'series context' };
        const opts: AgChartOptions<unknown, { name: string }> = {
            dataSource: {
                // @ts-expect-error Set undocumented options to instantly resolve for tests
                requestThrottle: 0,
                updateThrottle: 0,
                updateDuringInteraction: true,
                getData: getDataCallback.frozen,
            },
            context: chartContext,
            series: [{ type: 'line', xKey: 'x', yKey: 'y', context: seriesContext }],
            zoom: { enabled: true },
        };

        chart = await createChart(opts);
        await clickAction(400, 300)(chart);
        expect(Object.isFrozen(chartContext)).toBe(false);
        expect(Object.isFrozen(seriesContext)).toBe(false);
        getDataCallback.expect().toHaveBeenCalledTimes(1).withContext(chartContext);
    });

    describe('clicks', () => {
        type TDatum = Readonly<{ x: number; a: number; b: number; c: number }>;
        type TContext = Readonly<{ readonly name: string }>;
        type TFreezable<TMock extends MockAPICallback<TDatum, TContext>> = ReturnType<typeof newFreezable<TMock>>;

        let click: TFreezable<MockChartClickListener<TDatum, TContext>>;
        let doubleClick: TFreezable<MockChartDblClickListener<TDatum, TContext>>;
        let chartSeriesNodeClick: TFreezable<MockSeriesNodeClickListener<TDatum, TContext>>;
        let chartSeriesNodeDoubleClick: TFreezable<MockSeriesNodeDblClickListener<TDatum, TContext>>;
        let chartSeriesVisibilityChange: TFreezable<MockChartSeriesVisibilityChangeListener<TDatum, TContext>>;
        let seriesNodeClick: TFreezable<MockSeriesNodeClickListener<TDatum, TContext>>;
        let seriesNodeDoubleClick: TFreezable<MockSeriesNodeDblClickListener<TDatum, TContext>>;
        let legendItemClick: TFreezable<MockLegendItemClickListener<TDatum, TContext>>;
        let legendItemDoubleClick: TFreezable<MockLegendItemDblClickListener<TDatum, TContext>>;

        let chartContext: TContext;
        let series0Context: TContext;
        let series1Context: TContext;

        function newFreezable<TMock extends MockAPICallback<TDatum, TContext>>(fn: TMock) {
            return newFreezableMock<TDatum, TContext, TMock>(fn);
        }

        beforeEach(async () => {
            click = newFreezable((_p: AgChartClickEvent<TContext>) => {});
            doubleClick = newFreezable((_p: AgChartDoubleClickEvent<TContext>) => {});
            chartSeriesNodeClick = newFreezable((_p: AgNodeClickEvent<'seriesNodeClick', TDatum, TContext>) => {});
            chartSeriesNodeDoubleClick = newFreezable(
                (_p: AgNodeClickEvent<'seriesNodeDoubleClick', TDatum, TContext>) => {}
            );
            chartSeriesVisibilityChange = newFreezable((_p: AgSeriesVisibilityChange<TContext>) => {});
            seriesNodeClick = newFreezable((_p: AgNodeClickEvent<'seriesNodeClick', TDatum, TContext>) => {});
            seriesNodeDoubleClick = newFreezable(
                (_p: AgNodeClickEvent<'seriesNodeDoubleClick', TDatum, TContext>) => {}
            );
            legendItemClick = newFreezable((_p: AgChartLegendClickEvent<TContext>) => {});
            legendItemDoubleClick = newFreezable((_p: AgChartLegendDoubleClickEvent<TContext>) => {});

            chartContext = { name: 'chart context' } as const;
            series0Context = { name: 'series 0 context' } as const;
            series1Context = { name: 'series 1 context' } as const;
            const seriesListeners = {
                seriesNodeClick: seriesNodeClick.frozen,
                seriesNodeDoubleClick: seriesNodeDoubleClick.frozen,
            };
            const legendListeners = {
                legendItemClick: legendItemClick.frozen,
                legendItemDoubleClick: legendItemDoubleClick.frozen,
            };
            const chartListeners = {
                click: click.frozen,
                doubleClick: doubleClick.frozen,
                seriesNodeClick: chartSeriesNodeClick.frozen,
                seriesNodeDoubleClick: chartSeriesNodeDoubleClick.frozen,
                seriesVisibilityChange: chartSeriesVisibilityChange.frozen,
            };
            const opts: AgChartOptions<TDatum, TContext> = {
                data: [
                    { x: 0, a: 1, b: 2, c: 3 },
                    { x: 1, a: 1, b: 2, c: 3 },
                    { x: 2, a: 1, b: 2, c: 3 },
                ],
                context: chartContext,
                series: [
                    { type: 'bar', xKey: 'x', yKey: 'a', listeners: seriesListeners, context: series0Context },
                    { type: 'bar', xKey: 'x', yKey: 'b', listeners: seriesListeners, context: series1Context },
                    { type: 'bar', xKey: 'x', yKey: 'c', listeners: seriesListeners },
                ],
                legend: { listeners: legendListeners },
                listeners: chartListeners,
                zoom: { enabled: true },
            };
            chart = await createChart(opts);
        });

        afterEach(() => {
            expect(Object.isFrozen(chartContext)).toBe(false);
            expect(Object.isFrozen(series0Context)).toBe(false);
            expect(Object.isFrozen(series1Context)).toBe(false);
        });

        function expectNothingCalled() {
            click.expect().toHaveBeenCalledTimes(0);
            doubleClick.expect().toHaveBeenCalledTimes(0);
            chartSeriesNodeClick.expect().toHaveBeenCalledTimes(0);
            chartSeriesNodeDoubleClick.expect().toHaveBeenCalledTimes(0);
            chartSeriesVisibilityChange.expect().toHaveBeenCalledTimes(0);
            seriesNodeClick.expect().toHaveBeenCalledTimes(0);
            seriesNodeDoubleClick.expect().toHaveBeenCalledTimes(0);
            legendItemClick.expect().toHaveBeenCalledTimes(0);
            legendItemDoubleClick.expect().toHaveBeenCalledTimes(0);
        }

        test('chart', async () => {
            await doubleClickAction(146, 133)(chart);
            click.expect().toHaveBeenCalledTimes(2).withContext(chartContext).mockClear();
            doubleClick.expect().toHaveBeenCalledTimes(1).withContext(chartContext).mockClear();

            expectNothingCalled();
        });

        test('series', async () => {
            await doubleClickAction(118, 400)(chart);
            chartSeriesNodeClick.expect().toHaveBeenCalledTimes(2).withContext(series0Context).mockClear();
            chartSeriesNodeDoubleClick.expect().toHaveBeenCalledTimes(1).withContext(series0Context).mockClear();
            seriesNodeClick.expect().toHaveBeenCalledTimes(2).withContext(series0Context).mockClear();
            seriesNodeDoubleClick.expect().toHaveBeenCalledTimes(1).withContext(series0Context).mockClear();

            await doubleClickAction(171, 400)(chart);
            chartSeriesNodeClick.expect().toHaveBeenCalledTimes(2).withContext(series1Context).mockClear();
            chartSeriesNodeDoubleClick.expect().toHaveBeenCalledTimes(1).withContext(series1Context).mockClear();
            seriesNodeClick.expect().toHaveBeenCalledTimes(2).withContext(series1Context).mockClear();
            seriesNodeDoubleClick.expect().toHaveBeenCalledTimes(1).withContext(series1Context).mockClear();

            await doubleClickAction(234, 400)(chart);
            chartSeriesNodeClick.expect().toHaveBeenCalledTimes(2).withContext(chartContext).mockClear();
            chartSeriesNodeDoubleClick.expect().toHaveBeenCalledTimes(1).withContext(chartContext).mockClear();
            seriesNodeClick.expect().toHaveBeenCalledTimes(2).withContext(chartContext).mockClear();
            seriesNodeDoubleClick.expect().toHaveBeenCalledTimes(1).withContext(chartContext).mockClear();

            expectNothingCalled();
        });

        test('series-visibility', async () => {
            await clickAction(356, 572)(chart);
            chartSeriesVisibilityChange.expect().toHaveBeenCalledTimes(1).withContext(series0Context).mockClear();

            await clickAction(406, 572)(chart);
            chartSeriesVisibilityChange.expect().toHaveBeenCalledTimes(1).withContext(series1Context).mockClear();

            await clickAction(451, 572)(chart);
            chartSeriesVisibilityChange.expect().toHaveBeenCalledTimes(1).withContext(chartContext).mockClear();

            legendItemClick.expect().toHaveBeenCalledTimes(3).mockClear();
            expectNothingCalled();
        });

        test('legend', async () => {
            await doubleClickAction(356, 572)(chart);
            legendItemClick.expect().toHaveBeenCalledTimes(2).withContext(series0Context).mockClear();
            legendItemDoubleClick.expect().toHaveBeenCalledTimes(1).withContext(series0Context).mockClear();

            await doubleClickAction(406, 572)(chart);
            legendItemClick.expect().toHaveBeenCalledTimes(2).withContext(series1Context).mockClear();
            legendItemDoubleClick.expect().toHaveBeenCalledTimes(1).withContext(series1Context).mockClear();

            await doubleClickAction(451, 572)(chart);
            legendItemClick.expect().toHaveBeenCalledTimes(2).withContext(chartContext).mockClear();
            legendItemDoubleClick.expect().toHaveBeenCalledTimes(1).withContext(chartContext).mockClear();

            chartSeriesVisibilityChange.expect().toHaveBeenCalledTimes(15).mockClear();
            expectNothingCalled();
        });
    });

    describe('contextMenu', () => {
        type TDatum = Readonly<{ x: number; a: number; b: number; c: number }>;
        type TContext = Readonly<{ name: string }>;
        type TFreezable<TEvent> = ReturnType<typeof newFreezable<TEvent, MockContextMenuAction<TDatum, TContext>>>;

        let alwaysAction: TFreezable<AgChartContextMenuEvent<TContext>>;
        let seriesAreaAction: TFreezable<AgSeriesAreaContextMenuActionEvent<TContext>>;
        let seriesNodeAction: TFreezable<AgNodeContextMenuActionEvent<TDatum, TContext>>;
        let legendItemAction: TFreezable<AgChartLegendContextMenuEvent<TContext>>;
        let chartContext: TContext;
        let series0Context: TContext;
        let series1Context: TContext;

        function newFreezable<TEvent, TMock extends MockContextMenuAction<TDatum, TContext>>(
            fn: TMock & ((e: TEvent) => any)
        ) {
            return newFreezableMock<TDatum, TContext, TMock & ((e: TEvent) => any)>(fn);
        }

        async function clickMenuItem(label: AgContextMenuItemShowOn) {
            let matchedNode: Element | undefined;
            for (const node of Array.from(document.querySelectorAll('[role="menuitem"]'))) {
                if (node.textContent === label) {
                    matchedNode = node;
                    break;
                }
            }
            expect(matchedNode).toBeDefined();
            matchedNode!.dispatchEvent(new MouseEvent('click'));
            await waitForChartStability(chart);
        }

        beforeEach(async () => {
            alwaysAction = newFreezable((_params: AgChartContextMenuEvent<TContext>) => {});
            seriesAreaAction = newFreezable((_params: AgSeriesAreaContextMenuActionEvent<TContext>) => {});
            seriesNodeAction = newFreezable((_params: AgNodeContextMenuActionEvent<TDatum, TContext>) => {});
            legendItemAction = newFreezable((_params: AgChartLegendContextMenuEvent<TContext>) => {});
            chartContext = { name: 'chart context' } as const;
            series0Context = { name: 'series 0 context' } as const;
            series1Context = { name: 'series 1 context' } as const;
            const opts: AgChartOptions<TDatum, TContext> = {
                data: [
                    { x: 0, a: 1, b: 2, c: 3 },
                    { x: 1, a: 1, b: 2, c: 3 },
                    { x: 2, a: 1, b: 2, c: 3 },
                ],
                context: chartContext,
                contextMenu: {
                    enabled: true,
                    items: [
                        { showOn: 'always', label: 'always', action: alwaysAction.frozen },
                        { showOn: 'series-area', label: 'series-area', action: seriesAreaAction.frozen },
                        { showOn: 'series-node', label: 'series-node', action: seriesNodeAction.frozen },
                        { showOn: 'legend-item', label: 'legend-item', action: legendItemAction.frozen },
                    ],
                },
                series: [
                    { type: 'bar', xKey: 'x', yKey: 'a', context: series0Context },
                    { type: 'bar', xKey: 'x', yKey: 'b', context: series1Context },
                    { type: 'bar', xKey: 'x', yKey: 'c' },
                ],
                zoom: { enabled: true },
            };
            chart = await createChart(opts);
        });

        afterEach(() => {
            expect(Object.isFrozen(chartContext)).toBe(false);
            expect(Object.isFrozen(series0Context)).toBe(false);
            expect(Object.isFrozen(series1Context)).toBe(false);
        });

        test('always', async () => {
            await contextMenuAction(146, 133)(chart);
            await clickMenuItem('always');
            seriesAreaAction.expect().toHaveBeenCalledTimes(0);
            seriesNodeAction.expect().toHaveBeenCalledTimes(0);
            legendItemAction.expect().toHaveBeenCalledTimes(0);

            alwaysAction.expect().toHaveBeenCalledTimes(1).withContext(chartContext);
        });

        test('series-area', async () => {
            await contextMenuAction(146, 133)(chart);
            await clickMenuItem('series-area');
            alwaysAction.expect().toHaveBeenCalledTimes(0);
            seriesNodeAction.expect().toHaveBeenCalledTimes(0);
            legendItemAction.expect().toHaveBeenCalledTimes(0);

            seriesAreaAction.expect().toHaveBeenCalledTimes(1).withContext(chartContext);
        });

        test('series-node', async () => {
            await contextMenuAction(118, 400)(chart);
            await clickMenuItem('series-node');
            await contextMenuAction(171, 400)(chart);
            await clickMenuItem('series-node');
            await contextMenuAction(234, 400)(chart);
            await clickMenuItem('series-node');

            alwaysAction.expect().toHaveBeenCalledTimes(0);
            seriesAreaAction.expect().toHaveBeenCalledTimes(0);
            legendItemAction.expect().toHaveBeenCalledTimes(0);

            seriesNodeAction.expect().toHaveBeenCalledTimes(3);
            seriesNodeAction.expect().nthCalledWithContext(0, series0Context);
            seriesNodeAction.expect().nthCalledWithContext(1, series1Context);
            seriesNodeAction.expect().nthCalledWithContext(2, chartContext);
        });

        test('legend-item', async () => {
            await contextMenuAction(356, 572)(chart);
            await clickMenuItem('legend-item');
            await contextMenuAction(406, 572)(chart);
            await clickMenuItem('legend-item');
            await contextMenuAction(451, 572)(chart);
            await clickMenuItem('legend-item');

            alwaysAction.expect().toHaveBeenCalledTimes(0);
            seriesAreaAction.expect().toHaveBeenCalledTimes(0);
            seriesNodeAction.expect().toHaveBeenCalledTimes(0);

            legendItemAction.expect().toHaveBeenCalledTimes(3);
            legendItemAction.expect().nthCalledWithContext(0, series0Context);
            legendItemAction.expect().nthCalledWithContext(1, series1Context);
            legendItemAction.expect().nthCalledWithContext(2, chartContext);
        });
    });
});

describe('AG-13024 API context gauges', () => {
    setupMockConsole();
    setupMockCanvas();

    type TDatum = unknown;
    type TContext = object;
    type TMock = MockChartLabelFormatter<TDatum, TContext>;
    let chart: AgChartInstance<AgGaugeOptions>;
    let rootContext: object;
    const chartLabelFormatter = newFreezableMock<TDatum, TContext, TMock>((_params) => undefined);

    async function createChart(
        options: AgRadialGaugeOptions | AgLinearGaugeOptions
    ): Promise<AgChartInstance<AgGaugeOptions>> {
        prepareEnterpriseTestOptions(options);
        chart = AgCharts.createGauge(options);
        await waitForChartStability(chart);
        return chart;
    }

    beforeEach(() => {
        rootContext = { name: 'root context' };
        chartLabelFormatter.mock.mockClear();
    });

    afterEach(() => {
        expect(Object.isFrozen(rootContext)).toBe(false);
        chart?.destroy();
        (chart as unknown) = undefined;
    });

    describe('radial-gauge', () => {
        function initOptions(): AgRadialGaugeOptions {
            return {
                type: 'radial-gauge',
                value: 80,
                scale: { min: 0, max: 100, label: { enabled: false } },
                label: { formatter: chartLabelFormatter.frozen },
                secondaryLabel: { text: 'Test Score' },
            };
        }

        test('undefined', async () => {
            const options = initOptions();
            expect(options).not.toHaveProperty('context');
            chart = await createChart(options);
            chartLabelFormatter.expect().toHaveBeenCalledTimes(4).withoutContext();
        });

        test('defined to undefined', async () => {
            const options = initOptions();
            options.context = undefined;
            chart = await createChart(options);
            chartLabelFormatter.expect().toHaveBeenCalledTimes(4).withoutContext();
        });

        test('defined to null', async () => {
            const options = initOptions();
            options.context = null;
            chart = await createChart(options);
            chartLabelFormatter.expect().toHaveBeenCalledTimes(4).withContext(null);
        });

        test('defined to object', async () => {
            const options = initOptions();
            options.context = rootContext;
            chart = await createChart(options);
            chartLabelFormatter.expect().toHaveBeenCalledTimes(4).withContext(rootContext);
        });
    });

    describe('linear-gauge', () => {
        function initOptions(): AgLinearGaugeOptions {
            return {
                type: 'linear-gauge',
                value: 80,
                scale: { min: 0, max: 100, label: { enabled: false } },
                label: { formatter: chartLabelFormatter.frozen },
            };
        }

        test('undefined', async () => {
            const options = initOptions();
            expect(options).not.toHaveProperty('context');
            chart = await createChart(options);
            chartLabelFormatter.expect().toHaveBeenCalledTimes(3).withoutContext();
        });

        test('defined to undefined', async () => {
            const options = initOptions();
            options.context = undefined;
            chart = await createChart(options);
            chartLabelFormatter.expect().toHaveBeenCalledTimes(3).withoutContext();
        });

        test('defined to null', async () => {
            const options = initOptions();
            options.context = null;
            chart = await createChart(options);
            chartLabelFormatter.expect().toHaveBeenCalledTimes(3).withContext(null);
        });

        test('defined to object', async () => {
            const options = initOptions();
            options.context = rootContext;
            chart = await createChart(options);
            chartLabelFormatter.expect().toHaveBeenCalledTimes(3).withContext(rootContext);
        });
    });
});
