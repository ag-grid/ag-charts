import { afterEach, describe, expect } from '@jest/globals';

import {
    type AgAnnotationsEvent,
    type AgChartClickEvent,
    type AgChartContextMenuEvent,
    type AgChartDoubleClickEvent,
    type AgChartInstance,
    type AgChartLegendClickEvent,
    type AgChartLegendContextMenuEvent,
    type AgChartLegendDoubleClickEvent,
    type AgChartOptions,
    AgCharts,
    type AgContextMenuItemShowOn,
    type AgGaugeOptions,
    type AgLinearGaugeOptions,
    type AgNodeClickEvent,
    type AgNodeContextMenuActionEvent,
    type AgRadialGaugeOptions,
    type AgSeriesAreaContextMenuActionEvent,
    type AgSeriesVisibilityChange,
    type AgZoomEvent,
} from 'ag-charts-community';
import {
    type MockAPICallback,
    MockActiveChangeListener,
    type MockAnnotationsListener,
    type MockChartClickListener,
    type MockChartDblClickListener,
    type MockChartLabelFormatter,
    type MockChartLabelItemStyler,
    type MockChartSeriesVisibilityChangeListener,
    type MockContextMenuAction,
    type MockGetDataCallback,
    type MockLegendItemClickListener,
    type MockLegendItemDblClickListener,
    type MockSeriesNodeClickListener,
    type MockSeriesNodeDblClickListener,
    type MockZoomListener,
    clickAction,
    contextMenuAction,
    deproxy,
    doubleClickAction,
    expectWarningsCalls,
    hoverAction,
    newFreezableMock,
    scrollAction,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from 'ag-charts-community-test';
import { DeepReadonly } from 'ag-charts-core';
import type {
    AgActiveChangeEvent,
    AgActiveItemState,
    AgCartesianChartOptions,
    AgDataSourceCallbackParams,
} from 'ag-charts-types';

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
        zoomListener.expect().toHaveBeenCalledTimes(2).withContext(context);
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

describe('AG-15850 labels', () => {
    setupMockConsole();
    setupMockCanvas();

    type D = unknown;
    type C = unknown;
    type Formatter = MockChartLabelFormatter<D, C>;
    type ItemStyler = MockChartLabelItemStyler<D, C>;

    let chart: AgChartInstance<AgGaugeOptions | AgChartOptions<D, C>>;
    let mockFormatter: ReturnType<typeof newFreezableMock<D, C, Formatter>>;
    let mockItemStyler: ReturnType<typeof newFreezableMock<D, C, ItemStyler>>;

    const basicData = [
        { myCategory: 'CatA', myValue: 10, myValue2: 7, mySize: 5 },
        { myCategory: 'CatB', myValue: 20, myValue2: 14, mySize: 10 },
    ];

    const hierarchyData = [
        {
            myLabel: 'root',
            children: [
                { myLabel: 'LabA', myValue: 10 },
                { myLabel: 'LabB', myValue: 20 },
            ],
        },
    ];

    const flowData = [
        { myFrom: 'myNode1', myTo: 'myNode2', mySize: 5 },
        { myFrom: 'myNode2', myTo: 'myNode3', mySize: 3 },
    ];

    const geoJson = {
        type: 'FeatureCollection',
        features: [
            {
                type: 'Feature',
                properties: { name: 'myPoly' },
                geometry: {
                    type: 'Polygon',
                    coordinates: [
                        [
                            [0, 0],
                            [1, 0],
                            [1, 1],
                            [0, 1],
                            [0, 0],
                        ],
                    ],
                },
            },
            {
                type: 'Feature',
                properties: { name: 'myLine' },
                geometry: {
                    type: 'LineString',
                    coordinates: [
                        [0, 0],
                        [1, 0],
                        [1, 1],
                        [0, 1],
                    ],
                },
            },
        ],
    };

    beforeEach(() => {
        mockFormatter = newFreezableMock<D, C, Formatter>((p) => `${p.value}`);
        mockItemStyler = newFreezableMock<D, C, ItemStyler>();
    });

    afterEach(() => {
        chart?.destroy();
        (chart as unknown) = undefined;
    });

    async function createChart<O extends AgChartOptions>(opts: O): Promise<void> {
        prepareEnterpriseTestOptions(opts);
        chart = AgCharts.create(opts);
        await waitForChartStability(chart);
    }

    async function createGauge<O extends AgGaugeOptions>(opts: O): Promise<void> {
        prepareEnterpriseTestOptions(opts);
        chart = AgCharts.createGauge(opts);
        await waitForChartStability(chart);
    }

    describe('sankey', () => {
        beforeEach(async () => {
            await createChart({
                data: flowData,
                series: [
                    {
                        type: 'sankey',
                        fromKey: 'myFrom',
                        toKey: 'myTo',
                        sizeKey: 'mySize',
                        label: {
                            formatter: mockFormatter.frozen,
                            itemStyler: mockItemStyler.frozen,
                        },
                    },
                ],
            });
        });

        test('formatter', () => {
            expect(mockFormatter.mock.mock.calls).toMatchSnapshot();
        });

        test('itemStyler', () => {
            expect(mockItemStyler.mock.mock.calls).toMatchSnapshot();
        });
    });

    describe('chord', () => {
        beforeEach(async () => {
            await createChart({
                data: flowData,
                series: [
                    {
                        type: 'chord',
                        fromKey: 'myFrom',
                        toKey: 'myTo',
                        sizeKey: 'mySize',
                        label: {
                            formatter: mockFormatter.frozen,
                            itemStyler: mockItemStyler.frozen,
                        },
                    },
                ],
            });
        });

        test('formatter', () => {
            expect(mockFormatter.mock.mock.calls).toMatchSnapshot();
        });

        test('itemStyler', () => {
            expect(mockItemStyler.mock.mock.calls).toMatchSnapshot();
        });
    });

    describe('pyramid', () => {
        beforeEach(async () => {
            await createChart({
                data: basicData,
                series: [
                    {
                        type: 'pyramid',
                        valueKey: 'myValue',
                        stageKey: 'myCategory',
                        label: {
                            formatter: mockFormatter.frozen,
                            itemStyler: mockItemStyler.frozen,
                        },
                    },
                ],
            });
        });

        test('formatter', () => {
            expect(mockFormatter.mock.mock.calls).toMatchSnapshot();
        });

        test('itemStyler', () => {
            expect(mockItemStyler.mock.mock.calls).toMatchSnapshot();
        });
    });

    describe('funnel', () => {
        beforeEach(async () => {
            await createChart<AgCartesianChartOptions<D, C>>({
                data: basicData,
                series: [
                    {
                        type: 'funnel',
                        valueKey: 'myValue',
                        stageKey: 'myCategory',
                        label: {
                            formatter: mockFormatter.frozen,
                            itemStyler: mockItemStyler.frozen,
                        },
                    },
                ],
            });
        });

        test('formatter', () => {
            expect(mockFormatter.mock.mock.calls).toMatchSnapshot();
        });

        test('itemStyler', () => {
            expect(mockItemStyler.mock.mock.calls).toMatchSnapshot();
        });
    });

    describe('map-shape', () => {
        beforeEach(async () => {
            await createChart({
                data: [{ myId: 'myPoly', myValue: 10 }],
                topology: geoJson,
                series: [
                    {
                        type: 'map-shape',
                        colorKey: 'myValue',
                        labelKey: 'myId',
                        idKey: 'myId',
                        label: {
                            enabled: true,
                            formatter: mockFormatter.frozen,
                            itemStyler: mockItemStyler.frozen,
                        },
                    },
                ],
            });
        });

        test('formatter', () => {
            expect(mockFormatter.mock.mock.calls).toMatchSnapshot();
        });

        test('itemStyler', () => {
            expect(mockItemStyler.mock.mock.calls).toMatchSnapshot();
        });
    });

    describe('map-marker', () => {
        beforeEach(async () => {
            await createChart({
                topology: geoJson,
                data: [{ myId: 'myPoly', myLat: 0.5, myLon: 0.5 }],
                series: [
                    {
                        type: 'map-shape-background',
                    },
                    {
                        type: 'map-marker',
                        latitudeKey: 'myLat',
                        longitudeKey: 'myLon',
                        labelKey: 'myId',
                        size: 50,
                        label: {
                            enabled: true,
                            formatter: mockFormatter.frozen,
                            itemStyler: mockItemStyler.frozen,
                        },
                    },
                ],
            });
        });

        test('formatter', () => {
            expect(mockFormatter.mock.mock.calls).toMatchSnapshot();
        });

        test('itemStyler', () => {
            expect(mockItemStyler.mock.mock.calls).toMatchSnapshot();
        });
    });

    describe('map-line', () => {
        beforeEach(async () => {
            await createChart({
                data: [{ myId: 'myLine', myValue: 10 }],
                topology: geoJson,
                series: [
                    {
                        type: 'map-line',
                        idKey: 'myId',
                        labelKey: 'myId',
                        sizeKey: 'myValue',
                        label: {
                            formatter: mockFormatter.frozen,
                            itemStyler: mockItemStyler.frozen,
                        },
                    },
                ],
            });
        });

        test('formatter', () => {
            expect(mockFormatter.mock.mock.calls).toMatchSnapshot();
        });

        test('itemStyler', () => {
            expect(mockItemStyler.mock.mock.calls).toMatchSnapshot();
        });
    });

    describe('sunburst', () => {
        beforeEach(async () => {
            await createChart({
                data: hierarchyData,
                series: [
                    {
                        type: 'sunburst',
                        labelKey: 'myLabel',
                        sizeKey: 'myValue',
                        label: {
                            formatter: mockFormatter.frozen,
                            itemStyler: mockItemStyler.frozen,
                        },
                    },
                ],
            });
        });

        test('formatter', () => {
            expect(mockFormatter.mock.mock.calls).toMatchSnapshot();
        });

        test('itemStyler', () => {
            expect(mockItemStyler.mock.mock.calls).toMatchSnapshot();
        });
    });

    describe('treemap', () => {
        beforeEach(async () => {
            await createChart({
                data: hierarchyData,
                series: [
                    {
                        type: 'treemap',
                        labelKey: 'myLabel',
                        sizeKey: 'myValue',
                        tile: {
                            label: {
                                formatter: mockFormatter.frozen,
                                itemStyler: mockItemStyler.frozen,
                            },
                        },
                    },
                ],
            });
        });

        test('formatter', () => {
            expect(mockFormatter.mock.mock.calls).toMatchSnapshot();
        });

        test('itemStyler', () => {
            expect(mockItemStyler.mock.mock.calls).toMatchSnapshot();
        });
    });

    describe('line', () => {
        beforeEach(async () => {
            await createChart({
                data: basicData,
                series: [
                    {
                        type: 'line',
                        xKey: 'myCategory',
                        yKey: 'myValue',
                        label: {
                            formatter: mockFormatter.frozen,
                            itemStyler: mockItemStyler.frozen,
                        },
                    },
                ],
            });
        });

        test('formatter', () => {
            expect(mockFormatter.mock.mock.calls).toMatchSnapshot();
        });

        test('itemStyler', () => {
            expect(mockItemStyler.mock.mock.calls).toMatchSnapshot();
        });
    });

    describe('area', () => {
        beforeEach(async () => {
            await createChart({
                data: basicData,
                series: [
                    {
                        type: 'area',
                        xKey: 'myCategory',
                        yKey: 'myValue',
                        label: {
                            formatter: mockFormatter.frozen,
                            itemStyler: mockItemStyler.frozen,
                        },
                    },
                ],
            });
        });

        test('formatter', () => {
            expect(mockFormatter.mock.mock.calls).toMatchSnapshot();
        });

        test('itemStyler', () => {
            expect(mockItemStyler.mock.mock.calls).toMatchSnapshot();
        });
    });

    describe('bar', () => {
        beforeEach(async () => {
            await createChart({
                data: basicData,
                series: [
                    {
                        type: 'bar',
                        xKey: 'myCategory',
                        yKey: 'myValue',
                        label: {
                            formatter: mockFormatter.frozen,
                            itemStyler: mockItemStyler.frozen,
                        },
                    },
                ],
            });
        });

        test('formatter', () => {
            expect(mockFormatter.mock.mock.calls).toMatchSnapshot();
        });

        test('itemStyler', () => {
            expect(mockItemStyler.mock.mock.calls).toMatchSnapshot();
        });
    });

    describe('range-area', () => {
        beforeEach(async () => {
            await createChart({
                data: basicData,
                series: [
                    {
                        type: 'range-area',
                        xKey: 'myCategory',
                        yLowKey: 'myValue2',
                        yHighKey: 'myValue',
                        label: {
                            formatter: mockFormatter.frozen,
                            itemStyler: mockItemStyler.frozen,
                        },
                    },
                ],
            });
        });

        test('formatter', () => {
            expect(mockFormatter.mock.mock.calls).toMatchSnapshot();
        });

        test('itemStyler', () => {
            expect(mockItemStyler.mock.mock.calls).toMatchSnapshot();
        });
    });

    describe('range-bar', () => {
        beforeEach(async () => {
            await createChart({
                data: basicData,
                series: [
                    {
                        type: 'range-bar',
                        xKey: 'myCategory',
                        yLowKey: 'myValue2',
                        yHighKey: 'myValue',
                        label: {
                            formatter: mockFormatter.frozen,
                            itemStyler: mockItemStyler.frozen,
                        },
                    },
                ],
            });
        });

        test('formatter', () => {
            expect(mockFormatter.mock.mock.calls).toMatchSnapshot();
        });

        test('itemStyler', () => {
            expect(mockItemStyler.mock.mock.calls).toMatchSnapshot();
        });
    });

    describe('bubble', () => {
        beforeEach(async () => {
            await createChart({
                data: basicData,
                series: [
                    {
                        type: 'bubble',
                        xKey: 'myValue',
                        yKey: 'myValue2',
                        sizeKey: 'mySize',
                        label: {
                            formatter: mockFormatter.frozen,
                            itemStyler: mockItemStyler.frozen,
                        },
                    },
                ],
            });
        });

        test('formatter', () => {
            expect(mockFormatter.mock.mock.calls).toMatchSnapshot();
        });

        test('itemStyler', () => {
            expect(mockItemStyler.mock.mock.calls).toMatchSnapshot();
        });
    });

    describe('donut', () => {
        beforeEach(async () => {
            await createChart({
                data: basicData,
                series: [
                    {
                        type: 'donut',
                        angleKey: 'myValue',
                        calloutLabelKey: 'myCategory',
                        calloutLabel: {
                            formatter: mockFormatter.frozen,
                            itemStyler: mockItemStyler.frozen,
                        },
                    },
                ],
            });
        });

        test('formatter', () => {
            expect(mockFormatter.mock.mock.calls).toMatchSnapshot();
        });

        test('itemStyler', () => {
            expect(mockItemStyler.mock.mock.calls).toMatchSnapshot();
        });
    });

    describe('radial-bar', () => {
        beforeEach(async () => {
            await createChart({
                data: basicData,
                series: [
                    {
                        type: 'radial-bar',
                        angleKey: 'myValue',
                        radiusKey: 'myValue2',
                        label: {
                            formatter: mockFormatter.frozen,
                            itemStyler: mockItemStyler.frozen,
                        },
                    },
                ],
            });
        });

        test('formatter', () => {
            expect(mockFormatter.mock.mock.calls).toMatchSnapshot();
        });

        test('itemStyler', () => {
            expect(mockItemStyler.mock.mock.calls).toMatchSnapshot();
        });
    });

    describe('radial-column', () => {
        beforeEach(async () => {
            await createChart({
                data: basicData,
                series: [
                    {
                        type: 'radial-column',
                        angleKey: 'myCategory',
                        radiusKey: 'myValue',
                        label: {
                            formatter: mockFormatter.frozen,
                            itemStyler: mockItemStyler.frozen,
                        },
                    },
                ],
            });
        });

        test('formatter', () => {
            expect(mockFormatter.mock.mock.calls).toMatchSnapshot();
        });

        test('itemStyler', () => {
            expect(mockItemStyler.mock.mock.calls).toMatchSnapshot();
        });
    });

    describe('radars', () => {
        beforeEach(async () => {
            await createChart({
                data: basicData,
                series: [
                    {
                        type: 'radar-line',
                        angleKey: 'myCategory',
                        radiusKey: 'myValue',
                        label: {
                            formatter: mockFormatter.frozen,
                            itemStyler: mockItemStyler.frozen,
                        },
                    },
                ],
            });
        });

        test('formatter', () => {
            expect(mockFormatter.mock.mock.calls).toMatchSnapshot();
        });

        test('itemStyler', () => {
            expect(mockItemStyler.mock.mock.calls).toMatchSnapshot();
        });
    });

    describe('radial-gauge', () => {
        beforeEach(async () => {
            await createGauge({
                type: 'radial-gauge',
                value: 70,
                label: {
                    formatter: mockFormatter.frozen,
                    itemStyler: mockItemStyler.frozen,
                },
            });
        });

        test('formatter', () => {
            expect(mockFormatter.mock.mock.calls).toMatchSnapshot();
        });

        test('itemStyler', () => {
            expect(mockItemStyler.mock.mock.calls).toMatchSnapshot();
        });
    });

    describe('linear-gauge', () => {
        beforeEach(async () => {
            await createGauge({
                type: 'linear-gauge',
                value: 40,
                label: {
                    formatter: mockFormatter.frozen,
                    itemStyler: mockItemStyler.frozen,
                },
            });
        });

        test('formatter', () => {
            expect(mockFormatter.mock.mock.calls).toMatchSnapshot();
        });

        test('itemStyler', () => {
            expect(mockItemStyler.mock.mock.calls).toMatchSnapshot();
        });
    });

    describe('waterfall', () => {
        beforeEach(async () => {
            await createChart({
                data: [
                    { myCategory: 'CatA', myValue: 10 },
                    { myCategory: 'CatB', myValue: -5 },
                    { myCategory: 'CatC', myValue: 15 },
                ],
                series: [
                    {
                        type: 'waterfall',
                        xKey: 'myCategory',
                        yKey: 'myValue',
                        item: {
                            positive: {
                                label: {
                                    formatter: mockFormatter.frozen,
                                    itemStyler: mockItemStyler.frozen,
                                },
                            },
                            negative: {
                                label: {
                                    formatter: mockFormatter.frozen,
                                    itemStyler: mockItemStyler.frozen,
                                },
                            },
                            total: {
                                label: {
                                    formatter: mockFormatter.frozen,
                                    itemStyler: mockItemStyler.frozen,
                                },
                            },
                        },
                    },
                ],
            });
        });

        test('formatter', () => {
            expect(mockFormatter.mock.mock.calls).toMatchSnapshot();
        });

        test('itemStyler', () => {
            expect(mockItemStyler.mock.mock.calls).toMatchSnapshot();
        });
    });

    describe('histogram', () => {
        beforeEach(async () => {
            await createChart({
                data: [{ myValue: 1 }, { myValue: 2 }, { myValue: 3 }, { myValue: 4 }],
                series: [
                    {
                        type: 'histogram',
                        xKey: 'myValue',
                        label: {
                            formatter: mockFormatter.frozen,
                            itemStyler: mockItemStyler.frozen,
                        },
                    },
                ],
            });
        });

        test('formatter', () => {
            expect(mockFormatter.mock.mock.calls).toMatchSnapshot();
        });

        test('itemStyler', () => {
            expect(mockItemStyler.mock.mock.calls).toMatchSnapshot();
        });
    });
});

describe('AG-15850 activeChange', () => {
    setupMockConsole();
    setupMockCanvas();

    type D = unknown;
    type C = unknown;
    type M = MockActiveChangeListener<D, C>;

    let chart: AgChartInstance<AgGaugeOptions | AgChartOptions<D, C>>;
    let mockActiveChange: ReturnType<typeof newFreezableMock<D, C, M>>;
    let version: string | undefined = undefined;

    const INACTIVE_SETSTATE_EVENT: DeepReadonly<AgActiveChangeEvent<unknown, unknown>> = {
        activeItem: undefined,
        datum: undefined,
        frozen: false,
        source: 'state-change',
        type: 'activeChange',
    };

    const INACTIVE_USERINTERACTION_EVENT: DeepReadonly<AgActiveChangeEvent<unknown, unknown>> = {
        activeItem: undefined,
        datum: undefined,
        frozen: false,
        source: 'user-interaction',
        type: 'activeChange',
    };

    beforeEach(() => {
        mockActiveChange = newFreezableMock<D, C, M>();
    });

    afterEach(() => {
        chart?.destroy();
        (chart as unknown) = undefined;
        expect(popCalls()).toEqual([]);
    });

    // TODO: there's multiple `createChart` wrapper with the same implement but different scopes (i.e. reference different `chart` variables). This could be improved.
    // eslint-disable-next-line sonarjs/no-identical-functions
    async function createChart<O extends AgChartOptions>(opts: O): Promise<void> {
        prepareEnterpriseTestOptions(opts);
        chart = AgCharts.create(opts);
        await waitForChartStability(chart);
    }

    async function hover(x: number, y: number): Promise<void> {
        await hoverAction(x, y)(deproxy(chart));
    }

    async function setActiveItem(activeItem: AgActiveItemState | undefined): Promise<void> {
        version ??= chart.getState().version;
        await chart.setState({ version, active: { activeItem, frozen: false } });
    }

    function popCalls(): AgActiveChangeEvent<D, C>[][] {
        const calls = mockActiveChange.mock.mock.calls;
        mockActiveChange.mock.mockClear();
        return calls;
    }

    describe('line', () => {
        beforeEach(async () => {
            await createChart({
                data: [
                    { myCategory: 'CatA', myValue: 10, myValue2: 7 },
                    { myCategory: 'CatB', myValue: 20, myValue2: 14 },
                    { myCategory: 'CatC', myValue: 12, myValue2: 5 },
                    { myCategory: 'CatD', myValue: 15, myValue2: 11 },
                ],
                series: [
                    {
                        type: 'line',
                        xKey: 'myCategory',
                        yKey: 'myValue',
                    },
                    {
                        type: 'line',
                        xKey: 'myCategory',
                        yKey: 'myValue2',
                    },
                ],
                listeners: {
                    activeChange: mockActiveChange.frozen,
                },
            });
            expect(popCalls()).toEqual([]);
        });

        test('mouse', async () => {
            // hover on a datum in the series area
            await hover(71, 197);
            expect(popCalls()).toMatchSnapshot();

            // hover on another datum in the series area
            await hover(546, 436);
            expect(popCalls()).toMatchSnapshot();

            // hover on a legend item
            await hover(472, 571);
            expect(popCalls()).toMatchSnapshot();

            // hover nowhere (miss)
            await hover(166, 560);
            expect(popCalls()).toMatchSnapshot();
        });

        test('setState', async () => {
            await setActiveItem({ type: 'series-area', itemId: 0, seriesId: 'LineSeries-1' });
            expect(popCalls()).toMatchSnapshot();

            await setActiveItem({ type: 'series-area', itemId: 3, seriesId: 'LineSeries-2' });
            expect(popCalls()).toMatchSnapshot();

            await setActiveItem({ type: 'legend', itemId: 'myValue2', seriesId: 'LineSeries-2' });
            expect(popCalls()).toMatchSnapshot();

            await setActiveItem(undefined);
            expect(popCalls()).toMatchSnapshot();
        });

        test('setState series-area seriesId not found', async () => {
            await setActiveItem({ type: 'series-area', itemId: 0, seriesId: 'LineSeries-1000' });
            expectWarningsCalls().toEqual([['AG Charts - Cannot find seriesId: "LineSeries-1000"']]);
            expect(popCalls()).toEqual([[INACTIVE_SETSTATE_EVENT]]);
        });

        test('setState series-area itemId not found', async () => {
            await setActiveItem({ type: 'series-area', itemId: 1000, seriesId: 'LineSeries-1' });
            expectWarningsCalls().toEqual([['AG Charts - Cannot find itemId: 1000']]);
            expect(popCalls()).toEqual([[INACTIVE_SETSTATE_EVENT]]);
        });

        test('setState legend seriesId not found', async () => {
            await setActiveItem({ type: 'legend', itemId: 'myValue', seriesId: 'LineSeries-1000' });
            expectWarningsCalls().toEqual([['AG Charts - Cannot find seriesId: "LineSeries-1000"']]);
            expect(popCalls()).toEqual([[INACTIVE_SETSTATE_EVENT]]);
        });

        test('setState legend itemId not found', async () => {
            await setActiveItem({ type: 'legend', itemId: 'myValue22', seriesId: 'LineSeries-2' });
            expectWarningsCalls().toEqual([
                ['AG Charts - cannot find legend item: {"seriesId":"LineSeries-2","itemId":"myValue22"}'],
            ]);
            expect(popCalls()).toEqual([[INACTIVE_SETSTATE_EVENT]]);
        });

        test('setState validation failure', async () => {
            await setActiveItem('invalid AgActiveItemState test' as unknown as AgActiveItemState);
            expectWarningsCalls().toEqual([
                [
                    'AG Charts - Could not restore [active] data, value was invalid, ignoring.\n\nOption `activeItem` cannot be set to `"invalid AgActiveItemState test"`; expecting an object, ignoring.\n\n',
                    { activeItem: 'invalid AgActiveItemState test', frozen: false },
                ],
            ]);
            expect(popCalls()).toEqual([]);
        });
    });

    describe('bar', () => {
        beforeEach(async () => {
            await createChart({
                data: [
                    { myCategory: 'CatA', myValue: 10, myValue2: 7 },
                    { myCategory: 'CatB', myValue: 20, myValue2: 14 },
                    { myCategory: 'CatC', myValue: 12, myValue2: 5 },
                    { myCategory: 'CatD', myValue: 15, myValue2: 11 },
                ],
                series: [
                    {
                        type: 'bar',
                        xKey: 'myCategory',
                        yKey: 'myValue',
                    },
                    {
                        type: 'bar',
                        xKey: 'myCategory',
                        yKey: 'myValue2',
                    },
                ],
                listeners: {
                    activeChange: mockActiveChange.frozen,
                },
            });
            expect(popCalls()).toEqual([]);
        });

        test('mouse', async () => {
            // hover on a bar (myValue2-CatA)
            await hover(168, 423);
            expect(popCalls()).toMatchSnapshot();

            // hover on another bar (myValue-CatC)
            await hover(475, 360);
            expect(popCalls()).toMatchSnapshot();

            // hover on a legend item
            await hover(357, 574);
            expect(popCalls()).toMatchSnapshot();

            // hover nowhere (miss)
            await hover(166, 560);
            expect(popCalls()).toMatchSnapshot();
        });

        test('setState', async () => {
            await setActiveItem({ type: 'series-area', itemId: 0, seriesId: 'BarSeries-1' });
            expect(popCalls()).toMatchSnapshot();

            await setActiveItem({ type: 'series-area', itemId: 3, seriesId: 'BarSeries-2' });
            expect(popCalls()).toMatchSnapshot();

            await setActiveItem({ type: 'legend', itemId: 'myValue2', seriesId: 'BarSeries-2' });
            expect(popCalls()).toMatchSnapshot();

            await setActiveItem(undefined);
            expect(popCalls()).toEqual([[INACTIVE_SETSTATE_EVENT]]);
        });

        test('setState series-area seriesId not found', async () => {
            await setActiveItem({ type: 'series-area', itemId: 0, seriesId: 'BarSeries-1000' });
            expectWarningsCalls().toEqual([['AG Charts - Cannot find seriesId: "BarSeries-1000"']]);
            expect(popCalls()).toEqual([[INACTIVE_SETSTATE_EVENT]]);
        });

        test('setState series-area itemId not found', async () => {
            await setActiveItem({ type: 'series-area', itemId: 1000, seriesId: 'BarSeries-1' });
            expectWarningsCalls().toEqual([['AG Charts - Cannot find itemId: 1000']]);
            expect(popCalls()).toEqual([[INACTIVE_SETSTATE_EVENT]]);
        });

        test('setState legend seriesId not found', async () => {
            await setActiveItem({ type: 'legend', itemId: 'myValue', seriesId: 'BarSeries-1000' });
            expectWarningsCalls().toEqual([['AG Charts - Cannot find seriesId: "BarSeries-1000"']]);
            expect(popCalls()).toEqual([[INACTIVE_SETSTATE_EVENT]]);
        });

        test('setState legend itemId not found', async () => {
            await setActiveItem({ type: 'legend', itemId: 'myValue22', seriesId: 'BarSeries-2' });
            expectWarningsCalls().toEqual([
                ['AG Charts - cannot find legend item: {"seriesId":"BarSeries-2","itemId":"myValue22"}'],
            ]);
            expect(popCalls()).toEqual([[INACTIVE_SETSTATE_EVENT]]);
        });
    });

    describe('area', () => {
        beforeEach(async () => {
            await createChart({
                data: [
                    { myCategory: 'CatA', myValue: 10, myValue2: 7 },
                    { myCategory: 'CatB', myValue: 20, myValue2: 14 },
                    { myCategory: 'CatC', myValue: 12, myValue2: 5 },
                    { myCategory: 'CatD', myValue: 15, myValue2: 11 },
                ],
                series: [
                    {
                        type: 'area',
                        xKey: 'myCategory',
                        yKey: 'myValue',
                    },
                    {
                        type: 'area',
                        xKey: 'myCategory',
                        yKey: 'myValue2',
                    },
                ],
                listeners: {
                    activeChange: mockActiveChange.frozen,
                },
            });
            expect(popCalls()).toEqual([]);
        });

        test('mouse', async () => {
            // hover on a marker (myValue2-CatB)
            await hover(292, 184);
            expect(popCalls()).toMatchSnapshot();

            // hover on another marker (myValue-CatD)
            await hover(745, 137);
            expect(popCalls()).toMatchSnapshot();

            // hover on a legend item (myValue)
            await hover(360, 573);
            expect(popCalls()).toMatchSnapshot();

            // hover nowhere (miss)
            await hover(15, 15);
            expect(popCalls()).toMatchSnapshot();
        });

        test('setState', async () => {
            await setActiveItem({ type: 'series-area', itemId: 1, seriesId: 'AreaSeries-1' });
            expect(popCalls()).toMatchSnapshot();

            await setActiveItem({ type: 'series-area', itemId: 3, seriesId: 'AreaSeries-2' });
            expect(popCalls()).toMatchSnapshot();

            await setActiveItem({ type: 'legend', itemId: 'myValue2', seriesId: 'AreaSeries-2' });
            expect(popCalls()).toMatchSnapshot();

            await setActiveItem(undefined);
            expect(popCalls()).toEqual([[INACTIVE_SETSTATE_EVENT]]);
        });

        test('setState series-area seriesId not found', async () => {
            await setActiveItem({ type: 'series-area', itemId: 0, seriesId: 'AreaSeries-1000' });
            expectWarningsCalls().toEqual([['AG Charts - Cannot find seriesId: "AreaSeries-1000"']]);
            expect(popCalls()).toEqual([[INACTIVE_SETSTATE_EVENT]]);
        });

        test('setState series-area itemId not found', async () => {
            await setActiveItem({ type: 'series-area', itemId: 1000, seriesId: 'AreaSeries-1' });
            expectWarningsCalls().toEqual([['AG Charts - Cannot find itemId: 1000']]);
            expect(popCalls()).toEqual([[INACTIVE_SETSTATE_EVENT]]);
        });

        test('setState legend seriesId not found', async () => {
            await setActiveItem({ type: 'legend', itemId: 'myValue', seriesId: 'AreaSeries-1000' });
            expectWarningsCalls().toEqual([['AG Charts - Cannot find seriesId: "AreaSeries-1000"']]);
            expect(popCalls()).toEqual([[INACTIVE_SETSTATE_EVENT]]);
        });

        test('setState legend itemId not found', async () => {
            await setActiveItem({ type: 'legend', itemId: 'myValue22', seriesId: 'AreaSeries-2' });
            expectWarningsCalls().toEqual([
                ['AG Charts - cannot find legend item: {"seriesId":"AreaSeries-2","itemId":"myValue22"}'],
            ]);
            expect(popCalls()).toEqual([[INACTIVE_SETSTATE_EVENT]]);
        });
    });

    describe('donut-shared-legend', () => {
        beforeEach(async () => {
            await createChart({
                data: [
                    { name: 'Slice0', outerSlices: 8000, innerSlices: 5000 },
                    { name: 'Slice1', outerSlices: 4500, innerSlices: 3000 },
                    { name: 'Slice2', outerSlices: 70000, innerSlices: 40000 },
                    { name: 'Slice3', outerSlices: 30000, innerSlices: 60000 },
                    { name: 'Slice4', outerSlices: 5000, innerSlices: 7000 },
                ],
                series: [
                    {
                        type: 'donut',
                        outerRadiusRatio: 1,
                        innerRadiusRatio: 0.7,
                        angleKey: 'outerSlices',
                        calloutLabelKey: 'name',
                        legendItemKey: 'name',
                    },
                    {
                        type: 'donut',
                        outerRadiusRatio: 0.4,
                        innerRadiusRatio: 0,
                        angleKey: 'innerSlices',
                        calloutLabelKey: 'name',
                        legendItemKey: 'name',
                        showInLegend: false,
                    },
                ],
                listeners: {
                    activeChange: mockActiveChange.frozen,
                },
            });
            expect(popCalls()).toEqual([]);
        });

        test('mouse', async () => {
            // hover on a datum in series[0] (outer slices).
            await hover(410, 464);
            expect(popCalls()).toMatchSnapshot();

            // hover on another datum in another series (inner slices).
            await hover(364, 280);
            expect(popCalls()).toMatchSnapshot();

            // hover on a legend item
            await hover(545, 579);
            expect(popCalls()).toMatchSnapshot();

            // hover nowhere (miss)
            await hover(141, 465);
            expect(popCalls()).toMatchSnapshot();
        });

        test('setState', async () => {
            await setActiveItem({ type: 'series-area', itemId: 0, seriesId: 'DonutSeries-1' });
            expect(popCalls()).toMatchSnapshot();

            await setActiveItem({ type: 'series-area', itemId: 3, seriesId: 'DonutSeries-2' });
            expect(popCalls()).toMatchSnapshot();

            await setActiveItem({ type: 'legend', itemId: 2, seriesId: 'DonutSeries-1' });
            expect(popCalls()).toMatchSnapshot();

            await setActiveItem(undefined);
            expect(popCalls()).toEqual([[INACTIVE_SETSTATE_EVENT]]);
        });

        test('setState series-area seriesId not found', async () => {
            await setActiveItem({ type: 'series-area', itemId: 0, seriesId: 'DonutSeries-1000' });
            expectWarningsCalls().toEqual([['AG Charts - Cannot find seriesId: "DonutSeries-1000"']]);
            expect(popCalls()).toEqual([[INACTIVE_SETSTATE_EVENT]]);
        });

        test('setState series-area itemId not found', async () => {
            await setActiveItem({ type: 'series-area', itemId: 1000, seriesId: 'DonutSeries-1' });
            expectWarningsCalls().toEqual([['AG Charts - Cannot find itemId: 1000']]);
            expect(popCalls()).toEqual([[INACTIVE_SETSTATE_EVENT]]);
        });

        test('setState legend seriesId not found', async () => {
            await setActiveItem({ type: 'legend', itemId: 0, seriesId: 'DonutSeries-1000' });
            expectWarningsCalls().toEqual([['AG Charts - Cannot find seriesId: "DonutSeries-1000"']]);
            expect(popCalls()).toEqual([[INACTIVE_SETSTATE_EVENT]]);
        });

        test('setState legend seriesId not shown', async () => {
            await setActiveItem({ type: 'legend', itemId: 0, seriesId: 'DonutSeries-2' });
            expectWarningsCalls().toEqual([
                ['AG Charts - cannot find legend item: {"seriesId":"DonutSeries-2","itemId":0}'],
            ]);
            expect(popCalls()).toEqual([[INACTIVE_SETSTATE_EVENT]]);
        });

        test('setState legend itemId not found', async () => {
            await setActiveItem({ type: 'legend', itemId: 1000, seriesId: 'DonutSeries-1' });
            expectWarningsCalls().toEqual([
                ['AG Charts - cannot find legend item: {"seriesId":"DonutSeries-1","itemId":1000}'],
            ]);
            expect(popCalls()).toEqual([[INACTIVE_SETSTATE_EVENT]]);
        });
    });

    describe('waterfall', () => {
        beforeEach(async () => {
            await createChart({
                data: [
                    { myX: 'Positive 1', myY: 185 },
                    { myX: 'Positive 2', myY: 145 },
                    { myX: 'Positive 3', myY: 134 },
                    { myX: 'Positive 4', myY: 55 },
                    { myX: 'Positive 5', myY: 34 },
                    { myX: 'Negative 1', myY: -155 },
                    { myX: 'Negative 2', myY: -112 },
                    { myX: 'Negative 3', myY: -165 },
                    { myX: 'Negative 4', myY: -163 },
                    { myX: 'Negative 5', myY: -91 },
                ],
                series: [
                    {
                        type: 'waterfall',
                        xKey: 'myX',
                        yKey: 'myY',
                        totals: [
                            { totalType: 'subtotal', index: 4, axisLabel: 'Subtotal 1' },
                            { totalType: 'subtotal', index: 9, axisLabel: 'Subtotal 2' },
                            { totalType: 'total', index: 9, axisLabel: 'Total' },
                        ],
                    },
                ],
                listeners: {
                    activeChange: mockActiveChange.frozen,
                },
            });
            expect(popCalls()).toEqual([]);
        });

        test('mouse', async () => {
            let calls: AgActiveChangeEvent<any, C>[][];

            // hover on waterfall bar (Positive 2)
            await hover(145, 218);
            calls = popCalls();
            expect(calls?.[0]?.[0]?.datum?.myX).toEqual('Positive 2');
            expect(calls).toMatchSnapshot();

            // hover on another waterfall bar (Subtotal 1)
            await hover(365, 204);
            calls = popCalls();
            expect(calls?.[0]?.[0]?.datum?.myX).toEqual('Subtotal 1');
            expect(calls).toMatchSnapshot();

            // hover on a legend item (Negative 3)
            await hover(526, 249);
            calls = popCalls();
            expect(calls?.[0]?.[0]?.datum?.myX).toEqual('Negative 3');
            expect(calls).toMatchSnapshot();

            // hover on a legend item (Negative)
            await hover(209, 572);
            expect(popCalls()).toMatchSnapshot(); // non-interactive

            // hover nowhere (miss)
            await hover(55, 555);
            expect(popCalls()).toEqual([]);
        });

        test('setState', async () => {
            let calls: AgActiveChangeEvent<any, C>[][];

            // Positive 2
            await setActiveItem({ type: 'series-area', itemId: 1, seriesId: 'WaterfallSeries-1' });
            calls = popCalls();
            expect(calls?.[0]?.[0]?.datum?.myX).toEqual('Positive 2');
            expect(calls).toMatchSnapshot();

            // Subtotal 1
            await setActiveItem({ type: 'series-area', itemId: 5, seriesId: 'WaterfallSeries-1' });
            calls = popCalls();
            expect(calls?.[0]?.[0]?.datum?.myX).toEqual('Subtotal 1');
            expect(calls).toMatchSnapshot();

            // Negative 3
            await setActiveItem({ type: 'series-area', itemId: 8, seriesId: 'WaterfallSeries-1' });
            calls = popCalls();
            expect(calls?.[0]?.[0]?.datum?.myX).toEqual('Negative 3');
            expect(calls).toMatchSnapshot();

            await setActiveItem(undefined);
            expect(popCalls()).toEqual([[INACTIVE_SETSTATE_EVENT]]);
        });

        test('setState series-area seriesId not found', async () => {
            await setActiveItem({ type: 'series-area', itemId: 0, seriesId: 'WaterfallSeries-2' });
            expectWarningsCalls().toEqual([['AG Charts - Cannot find seriesId: "WaterfallSeries-2"']]);
            expect(popCalls()).toEqual([[INACTIVE_SETSTATE_EVENT]]);
        });

        test('setState series-area itemId not found', async () => {
            await setActiveItem({ type: 'series-area', itemId: 1000, seriesId: 'WaterfallSeries-1' });
            expectWarningsCalls().toEqual([['AG Charts - Cannot find itemId: 1000']]);
            expect(popCalls()).toEqual([[INACTIVE_SETSTATE_EVENT]]);
        });
    });

    describe('box-plot', () => {
        beforeEach(async () => {
            await createChart({
                data: [
                    {
                        myX: 'CatA',
                        plot1min: 10,
                        plot1q1: 44,
                        plot1median: 57,
                        plot1q3: 88,
                        plot1max: 148,
                        plot2min: 8,
                        plot2q1: 35,
                        plot2median: 52,
                        plot2q3: 81,
                        plot2max: 140,
                    },
                    {
                        myX: 'CatB',
                        plot1min: 10,
                        plot1q1: 27,
                        plot1median: 43,
                        plot1q3: 77,
                        plot1max: 148,
                        plot2min: 12,
                        plot2q1: 30,
                        plot2median: 46,
                        plot2q3: 70,
                        plot2max: 135,
                    },
                    {
                        myX: 'CatC',
                        plot1min: 15,
                        plot1q1: 26,
                        plot1median: 40,
                        plot1q3: 97,
                        plot1max: 197,
                        plot2min: 18,
                        plot2q1: 33,
                        plot2median: 55,
                        plot2q3: 110,
                        plot2max: 185,
                    },
                ],
                series: [
                    {
                        type: 'box-plot',
                        yName: 'myBoxPlot1',
                        xKey: 'myX',
                        minKey: 'plot1min',
                        q1Key: 'plot1q1',
                        medianKey: 'plot1median',
                        q3Key: 'plot1q3',
                        maxKey: 'plot1max',
                    },
                    {
                        type: 'box-plot',
                        yName: 'myBoxPlot2',
                        xKey: 'myX',
                        minKey: 'plot2min',
                        q1Key: 'plot2q1',
                        medianKey: 'plot2median',
                        q3Key: 'plot2q3',
                        maxKey: 'plot2max',
                    },
                ],
                listeners: {
                    activeChange: mockActiveChange.frozen,
                },
            });
            expect(popCalls()).toEqual([]);
        });

        test('mouse', async () => {
            // hover on a bar (myBoxPlot1-CatB)
            await hover(375, 380);
            expect(popCalls()).toMatchSnapshot();

            // hover on another bar (myBoxPlot2-CatC)
            await hover(700, 341);
            expect(popCalls()).toMatchSnapshot();

            // hover on a legend item (myBoxPlot2)
            await hover(459, 571);
            expect(popCalls()).toMatchSnapshot();

            // hover nowhere (miss)
            await hover(166, 560);
            expect(popCalls()).toMatchSnapshot();
        });

        test('setState', async () => {
            await setActiveItem({ type: 'series-area', itemId: 1, seriesId: 'BoxPlotSeries-1' });
            expect(popCalls()).toMatchSnapshot();

            await setActiveItem({ type: 'series-area', itemId: 2, seriesId: 'BoxPlotSeries-2' });
            expect(popCalls()).toMatchSnapshot();

            await setActiveItem({ type: 'legend', itemId: 'BoxPlotSeries-2', seriesId: 'BoxPlotSeries-2' });
            expect(popCalls()).toMatchSnapshot();

            await setActiveItem(undefined);
            expect(popCalls()).toEqual([[INACTIVE_SETSTATE_EVENT]]);
        });

        test('setState series-area seriesId not found', async () => {
            await setActiveItem({ type: 'series-area', itemId: 0, seriesId: 'BoxPlotSeries-1000' });
            expectWarningsCalls().toEqual([['AG Charts - Cannot find seriesId: "BoxPlotSeries-1000"']]);
            expect(popCalls()).toEqual([[INACTIVE_SETSTATE_EVENT]]);
        });

        test('setState series-area itemId not found', async () => {
            await setActiveItem({ type: 'series-area', itemId: 1000, seriesId: 'BoxPlotSeries-1' });
            expectWarningsCalls().toEqual([['AG Charts - Cannot find itemId: 1000']]);
            expect(popCalls()).toEqual([[INACTIVE_SETSTATE_EVENT]]);
        });

        test('setState legend seriesId not found', async () => {
            await setActiveItem({ type: 'legend', itemId: 'BoxPlotSeries-1000', seriesId: 'BoxPlotSeries-1000' });
            expectWarningsCalls().toEqual([['AG Charts - Cannot find seriesId: "BoxPlotSeries-1000"']]);
            expect(popCalls()).toEqual([[INACTIVE_SETSTATE_EVENT]]);
        });

        test('setState legend itemId not found', async () => {
            await setActiveItem({ type: 'legend', itemId: 0, seriesId: 'BoxPlotSeries-1' });
            expectWarningsCalls().toEqual([
                ['AG Charts - cannot find legend item: {"seriesId":"BoxPlotSeries-1","itemId":0}'],
            ]);
            expect(popCalls()).toEqual([[INACTIVE_SETSTATE_EVENT]]);
        });
    });

    describe('sankey', () => {
        beforeEach(async () => {
            await createChart({
                data: [
                    { myFrom: 'A', myTo: 'C', mySize: 10 },
                    { myFrom: 'A', myTo: 'D', mySize: 15 },
                    { myFrom: 'B', myTo: 'C', mySize: 20 },
                    { myFrom: 'B', myTo: 'E', mySize: 25 },
                    { myFrom: 'C', myTo: 'E', mySize: 30 },
                ],
                series: [
                    {
                        type: 'sankey',
                        fromKey: 'myFrom',
                        toKey: 'myTo',
                        sizeKey: 'mySize',
                        label: { enabled: true },
                    },
                ],
                listeners: {
                    activeChange: mockActiveChange.frozen,
                },
            });
            expect(popCalls()).toEqual([]);
        });

        test('mouse', async () => {
            let calls: AgActiveChangeEvent<any, C>[][];

            // Hover on a link (A - D)
            await hover(397, 85);
            calls = popCalls();
            expect(calls?.[0]?.[0]?.datum).toEqual({ myFrom: 'A', myTo: 'D', mySize: 15 });
            expect(calls).toMatchSnapshot();

            // Hover on another link (B - E)
            await hover(387, 247);
            calls = popCalls();
            expect(calls?.[0]?.[0]?.datum).toEqual({ myFrom: 'B', myTo: 'E', mySize: 25 });
            expect(calls).toMatchSnapshot();

            // Hover on a node (A)
            await hover(43, 119);
            calls = popCalls();
            expect(calls?.[0]?.[0]?.activeItem?.itemId).toEqual('node-0');
            expect(calls).toMatchSnapshot();

            // Hover on another node (E)
            await hover(757, 357);
            calls = popCalls();
            expect(calls?.[0]?.[0]?.activeItem?.itemId).toEqual('node-4');
            expect(calls).toMatchSnapshot();

            // Hover miss
            await hover(9, 9);
            expect(popCalls()).toEqual([[INACTIVE_USERINTERACTION_EVENT]]);
        });

        test('setState', async () => {
            let calls: AgActiveChangeEvent<any, C>[][];

            await setActiveItem({ type: 'series-area', itemId: 'link-1', seriesId: 'SankeySeries-1' });
            calls = popCalls();
            expect(calls?.[0]?.[0]?.datum).toEqual({ myFrom: 'A', myTo: 'D', mySize: 15 });
            expect(calls).toMatchSnapshot();

            await setActiveItem({ type: 'series-area', itemId: 'link-3', seriesId: 'SankeySeries-1' });
            calls = popCalls();
            expect(calls?.[0]?.[0]?.datum).toEqual({ myFrom: 'B', myTo: 'E', mySize: 25 });
            expect(calls).toMatchSnapshot();

            await setActiveItem({ type: 'series-area', itemId: 'node-0', seriesId: 'SankeySeries-1' });
            calls = popCalls();
            expect(calls?.[0]?.[0]?.activeItem?.itemId).toEqual('node-0');
            expect(calls).toMatchSnapshot();

            await setActiveItem({ type: 'series-area', itemId: 'node-4', seriesId: 'SankeySeries-1' });
            calls = popCalls();
            expect(calls?.[0]?.[0]?.activeItem?.itemId).toEqual('node-4');
            expect(calls).toMatchSnapshot();

            await setActiveItem(undefined);
            expect(popCalls()).toEqual([[INACTIVE_SETSTATE_EVENT]]);
        });

        test('setState series-area seriesId not found', async () => {
            await setActiveItem({ type: 'series-area', itemId: 'node-0', seriesId: 'SankeySeries-2' });
            expectWarningsCalls().toEqual([['AG Charts - Cannot find seriesId: "SankeySeries-2"']]);
            expect(popCalls()).toEqual([[INACTIVE_SETSTATE_EVENT]]);
        });

        test('setState series-area link not found', async () => {
            await setActiveItem({ type: 'series-area', itemId: 'link-1000', seriesId: 'SankeySeries-1' });
            expectWarningsCalls().toEqual([['AG Charts - Cannot find itemId: "link-1000"']]);
            expect(popCalls()).toEqual([[INACTIVE_SETSTATE_EVENT]]);
        });

        test('setState series-area node not found', async () => {
            await setActiveItem({ type: 'series-area', itemId: 'node-1000', seriesId: 'SankeySeries-1' });
            expectWarningsCalls().toEqual([['AG Charts - Cannot find itemId: "node-1000"']]);
            expect(popCalls()).toEqual([[INACTIVE_SETSTATE_EVENT]]);
        });
    });

    describe('chord', () => {
        beforeEach(async () => {
            await createChart({
                data: [
                    { myFrom: 'A', myTo: 'C', mySize: 10 },
                    { myFrom: 'A', myTo: 'D', mySize: 15 },
                    { myFrom: 'B', myTo: 'C', mySize: 20 },
                    { myFrom: 'B', myTo: 'E', mySize: 25 },
                    { myFrom: 'C', myTo: 'E', mySize: 30 },
                ],
                series: [
                    {
                        type: 'chord',
                        fromKey: 'myFrom',
                        toKey: 'myTo',
                        sizeKey: 'mySize',
                        label: { enabled: true },
                    },
                ],
                listeners: {
                    activeChange: mockActiveChange.frozen,
                },
            });
            expect(popCalls()).toEqual([]);
        });

        test('mouse', async () => {
            let calls: AgActiveChangeEvent<any, C>[][];

            // Hover on a link (A - D)
            await hover(182, 331);
            calls = popCalls();
            expect(calls?.[0]?.[0]?.datum).toEqual({ myFrom: 'A', myTo: 'D', mySize: 15 });
            expect(calls).toMatchSnapshot();

            // Hover on another link (B - E)
            await hover(329, 130);
            calls = popCalls();
            expect(calls?.[0]?.[0]?.datum).toEqual({ myFrom: 'B', myTo: 'E', mySize: 25 });
            expect(calls).toMatchSnapshot();

            // Hover on a node (A)
            await hover(640, 404);
            calls = popCalls();
            expect(calls?.[0]?.[0]?.activeItem?.itemId).toEqual('node-0');
            expect(calls).toMatchSnapshot();

            // Hover on another node (E)
            await hover(565, 98);
            calls = popCalls();
            expect(calls?.[0]?.[0]?.activeItem?.itemId).toEqual('node-4');
            expect(calls).toMatchSnapshot();

            // Hover miss
            await hover(9, 9);
            expect(popCalls()).toEqual([[INACTIVE_USERINTERACTION_EVENT]]);
        });

        test('setState', async () => {
            let calls: AgActiveChangeEvent<any, C>[][];

            await setActiveItem({ type: 'series-area', itemId: 'link-1', seriesId: 'ChordSeries-1' });
            calls = popCalls();
            expect(calls?.[0]?.[0]?.datum).toEqual({ myFrom: 'A', myTo: 'D', mySize: 15 });
            expect(calls).toMatchSnapshot();

            await setActiveItem({ type: 'series-area', itemId: 'link-3', seriesId: 'ChordSeries-1' });
            calls = popCalls();
            expect(calls?.[0]?.[0]?.datum).toEqual({ myFrom: 'B', myTo: 'E', mySize: 25 });
            expect(calls).toMatchSnapshot();

            await setActiveItem({ type: 'series-area', itemId: 'node-0', seriesId: 'ChordSeries-1' });
            calls = popCalls();
            expect(calls?.[0]?.[0]?.activeItem?.itemId).toEqual('node-0');
            expect(calls).toMatchSnapshot();

            await setActiveItem({ type: 'series-area', itemId: 'node-4', seriesId: 'ChordSeries-1' });
            calls = popCalls();
            expect(calls?.[0]?.[0]?.activeItem?.itemId).toEqual('node-4');
            expect(calls).toMatchSnapshot();

            await setActiveItem(undefined);
            expect(popCalls()).toEqual([[INACTIVE_SETSTATE_EVENT]]);
        });

        test('setState series-area seriesId not found', async () => {
            await setActiveItem({ type: 'series-area', itemId: 'node-0', seriesId: 'ChordSeries-2' });
            expectWarningsCalls().toEqual([['AG Charts - Cannot find seriesId: "ChordSeries-2"']]);
            expect(popCalls()).toEqual([[INACTIVE_SETSTATE_EVENT]]);
        });

        test('setState series-area link not found', async () => {
            await setActiveItem({ type: 'series-area', itemId: 'link-1000', seriesId: 'ChordSeries-1' });
            expectWarningsCalls().toEqual([['AG Charts - Cannot find itemId: "link-1000"']]);
            expect(popCalls()).toEqual([[INACTIVE_SETSTATE_EVENT]]);
        });

        test('setState series-area node not found', async () => {
            await setActiveItem({ type: 'series-area', itemId: 'node-1000', seriesId: 'ChordSeries-1' });
            expectWarningsCalls().toEqual([['AG Charts - Cannot find itemId asdfasdf: "node-1000"']]);
            expect(popCalls()).toEqual([[INACTIVE_SETSTATE_EVENT]]);
        });
    });

    describe('treemap', () => {
        beforeEach(async () => {
            await createChart({
                data: [
                    {
                        name: 'Root',
                        children: [
                            {
                                name: 'A',
                                size: 100,
                                children: [
                                    { name: 'A1', size: 30 },
                                    { name: 'A2', size: 70 },
                                ],
                            },
                            {
                                name: 'B',
                                size: 80,
                                children: [
                                    { name: 'B1', size: 50 },
                                    { name: 'B2', size: 30 },
                                ],
                            },
                        ],
                    },
                ],
                series: [
                    {
                        type: 'treemap',
                        labelKey: 'name',
                        sizeKey: 'size',
                        secondaryLabelKey: 'size',
                        tile: {
                            label: { enabled: true },
                            secondaryLabel: { enabled: true },
                        },
                        group: {
                            label: { enabled: true },
                        },
                    },
                ],
                listeners: {
                    activeChange: mockActiveChange.frozen,
                },
            });
            expect(popCalls()).toEqual([]);
        });

        test('mouse', async () => {
            let calls: AgActiveChangeEvent<any, C>[][];

            await hover(28, 28);
            calls = popCalls();
            expect(calls?.[0]?.[0]?.datum?.name).toEqual('Root');
            expect(calls).toMatchSnapshot();

            await hover(231, 271);
            calls = popCalls();
            expect(calls?.[0]?.[0]?.datum?.name).toEqual('A2');
            expect(calls).toMatchSnapshot();

            await hover(525, 54);
            calls = popCalls();
            expect(calls?.[0]?.[0]?.datum?.name).toEqual('B');
            expect(calls).toMatchSnapshot();

            await hover(9, 9); //miss
            expect(popCalls()).toEqual([[INACTIVE_USERINTERACTION_EVENT]]);
        });

        test('setState', async () => {
            let calls: AgActiveChangeEvent<any, C>[][];

            await setActiveItem({ type: 'series-area', itemId: '0', seriesId: 'TreemapSeries-1' });
            calls = popCalls();
            expect(calls?.[0]?.[0]?.datum?.name).toEqual('Root');
            expect(calls).toMatchSnapshot();

            await setActiveItem({ type: 'series-area', itemId: '0;0;1', seriesId: 'TreemapSeries-1' });
            calls = popCalls();
            expect(calls?.[0]?.[0]?.datum?.name).toEqual('A2');
            expect(calls).toMatchSnapshot();

            await setActiveItem({ type: 'series-area', itemId: '0;1', seriesId: 'TreemapSeries-1' });
            calls = popCalls();
            expect(calls?.[0]?.[0]?.datum?.name).toEqual('B');
            expect(calls).toMatchSnapshot();

            await setActiveItem(undefined);
            expect(popCalls()).toEqual([[INACTIVE_SETSTATE_EVENT]]);
        });

        test('setState series-area seriesId not found', async () => {
            await setActiveItem({ type: 'series-area', itemId: '0', seriesId: 'TreemapSeries-2' });
            expectWarningsCalls().toEqual([['AG Charts - Cannot find seriesId: "TreemapSeries-2"']]);
            expect(popCalls()).toEqual([[INACTIVE_SETSTATE_EVENT]]);
        });

        test('setState series-area itemId not found', async () => {
            await setActiveItem({ type: 'series-area', itemId: '0;0;4', seriesId: 'TreemapSeries-1' });
            expectWarningsCalls().toEqual([['AG Charts - Cannot find itemId: "0;0;4"']]);
            expect(popCalls()).toEqual([[INACTIVE_SETSTATE_EVENT]]);
        });
    });

    describe('sunburst', () => {
        beforeEach(async () => {
            await createChart({
                data: [
                    {
                        name: 'Root',
                        children: [
                            {
                                name: 'A',
                                size: 100,
                                children: [
                                    { name: 'A1', size: 30 },
                                    { name: 'A2', size: 70 },
                                ],
                            },
                            {
                                name: 'B',
                                size: 80,
                                children: [
                                    { name: 'B1', size: 50 },
                                    { name: 'B2', size: 30 },
                                ],
                            },
                        ],
                    },
                ],
                series: [
                    {
                        type: 'sunburst',
                        labelKey: 'name',
                        sizeKey: 'size',
                        secondaryLabelKey: 'size',
                        label: { enabled: true },
                    },
                ],
                listeners: {
                    activeChange: mockActiveChange.frozen,
                },
            });
            expect(popCalls()).toEqual([]);
        });

        test('mouse', async () => {
            let calls: AgActiveChangeEvent<any, C>[][];

            await hover(400, 300);
            calls = popCalls();
            expect(calls?.[0]?.[0]?.datum?.name).toEqual('Root');
            expect(calls).toMatchSnapshot();

            await hover(596, 179);
            calls = popCalls();
            expect(calls?.[0]?.[0]?.datum?.name).toEqual('A2');
            expect(calls).toMatchSnapshot();

            await hover(266, 293);
            calls = popCalls();
            expect(calls?.[0]?.[0]?.datum?.name).toEqual('B');
            expect(calls).toMatchSnapshot();

            await hover(9, 9); //miss
            expect(popCalls()).toEqual([[INACTIVE_USERINTERACTION_EVENT]]);
        });

        test('setState', async () => {
            let calls: AgActiveChangeEvent<any, C>[][];

            await setActiveItem({ type: 'series-area', itemId: '0', seriesId: 'SunburstSeries-1' });
            calls = popCalls();
            expect(calls?.[0]?.[0]?.datum?.name).toEqual('Root');
            expect(calls).toMatchSnapshot();

            await setActiveItem({ type: 'series-area', itemId: '0;0;1', seriesId: 'SunburstSeries-1' });
            calls = popCalls();
            expect(calls?.[0]?.[0]?.datum?.name).toEqual('A2');
            expect(calls).toMatchSnapshot();

            await setActiveItem({ type: 'series-area', itemId: '0;1', seriesId: 'SunburstSeries-1' });
            calls = popCalls();
            expect(calls?.[0]?.[0]?.datum?.name).toEqual('B');
            expect(calls).toMatchSnapshot();

            await setActiveItem(undefined);
            expect(popCalls()).toEqual([[INACTIVE_SETSTATE_EVENT]]);
        });

        test('setState series-area seriesId not found', async () => {
            await setActiveItem({ type: 'series-area', itemId: '0', seriesId: 'SunburstSeries-2' });
            expectWarningsCalls().toEqual([['AG Charts - Cannot find seriesId: "SunburstSeries-2"']]);
            expect(popCalls()).toEqual([[INACTIVE_SETSTATE_EVENT]]);
        });

        test('setState series-area itemId not found', async () => {
            await setActiveItem({ type: 'series-area', itemId: '0;0;4', seriesId: 'SunburstSeries-1' });
            expectWarningsCalls().toEqual([['AG Charts - Cannot find itemId: "0;0;4"']]);
            expect(popCalls()).toEqual([[INACTIVE_SETSTATE_EVENT]]);
        });
    });
});
