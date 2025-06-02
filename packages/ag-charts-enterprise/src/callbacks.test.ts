import { afterEach, describe, expect } from '@jest/globals';

import {
    AgChartContextMenuEvent,
    AgChartInstance,
    AgChartLegendContextMenuEvent,
    AgChartOptions,
    AgCharts,
    AgContextMenuItemShowOn,
    AgLinearGaugeOptions,
    AgNodeContextMenuActionEvent,
    AgRadialGaugeOptions,
    AgSeriesAreaContextMenuActionEvent,
    AgZoomEvent,
} from 'ag-charts-community';
import {
    AgLinearGaugeOptionsWithContext,
    AgRadialGaugeOptionsWithContext,
    MockChartLabelFormatter,
    MockContextMenuAction,
    MockZoomListener,
    contextMenuAction,
    newFreezableMock,
    scrollAction,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from 'ag-charts-community-test';

import { prepareEnterpriseTestOptions } from './test/utils';

describe('AG-14631 context enterprise', () => {
    setupMockConsole();
    setupMockCanvas();
    let chart: AgChartInstance;
    afterEach(() => {
        chart?.destroy();
        (chart as unknown) = undefined;
    });

    async function createChart(options: AgChartOptions): Promise<AgChartInstance> {
        prepareEnterpriseTestOptions(options);
        chart = AgCharts.create(options);
        await waitForChartStability(chart);
        return chart;
    }

    test('zoom', async () => {
        const zoomListener = newFreezableMock<MockZoomListener>((_params: AgZoomEvent) => {});
        const context = { name: 'chart context' } as const;
        const opts: AgChartOptions<{ x: number; y: number }, typeof context> = {
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

    describe('contextMenu', () => {
        type TDatum = Readonly<{ x: number; a: number; b: number; c: number }>;
        type TContext = Readonly<{ readonly name: string }>;

        let alwaysAction: ReturnType<typeof newFreezableMock<MockContextMenuAction>>;
        let seriesAreaAction: ReturnType<typeof newFreezableMock<MockContextMenuAction>>;
        let seriesNodeAction: ReturnType<typeof newFreezableMock<MockContextMenuAction>>;
        let legendItemAction: ReturnType<typeof newFreezableMock<MockContextMenuAction>>;
        let chartContext: TContext;
        let series0Context: TContext;
        let series1Context: TContext;

        function newFreezable<T extends MockContextMenuAction>(fn: T) {
            return newFreezableMock<MockContextMenuAction>(fn);
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
            alwaysAction = newFreezable((_params: AgChartContextMenuEvent) => {});
            seriesAreaAction = newFreezable((_params: AgSeriesAreaContextMenuActionEvent) => {});
            seriesNodeAction = newFreezable((_params: AgNodeContextMenuActionEvent<TDatum>) => {});
            legendItemAction = newFreezable((_params: AgChartLegendContextMenuEvent) => {});
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
            seriesNodeAction.expect().nthCalledWithoutContext(2);
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
            legendItemAction.expect().nthCalledWithoutContext(2);
        });
    });
});

describe('AG-13024 API context gauges', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: AgChartInstance;
    let rootContext: object;
    const chartLabelFormatter = newFreezableMock<MockChartLabelFormatter>((_params) => undefined);

    async function createChart(options: AgRadialGaugeOptions | AgLinearGaugeOptions): Promise<AgChartInstance> {
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
        function initOptions(): AgRadialGaugeOptionsWithContext {
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

    describe('linear-gauge', () => {
        function initOptions(): AgLinearGaugeOptionsWithContext {
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
            chartLabelFormatter.expect().toHaveBeenCalledTimes(2).withoutContext();
        });

        test('defined to undefined', async () => {
            const options = initOptions();
            options.context = undefined;
            chart = await createChart(options);
            chartLabelFormatter.expect().toHaveBeenCalledTimes(2).withoutContext();
        });

        test('defined to null', async () => {
            const options = initOptions();
            options.context = null;
            chart = await createChart(options);
            chartLabelFormatter.expect().toHaveBeenCalledTimes(2).withContext(null);
        });

        test('defined to object', async () => {
            const options = initOptions();
            options.context = rootContext;
            chart = await createChart(options);
            chartLabelFormatter.expect().toHaveBeenCalledTimes(2).withContext(rootContext);
        });
    });
});
