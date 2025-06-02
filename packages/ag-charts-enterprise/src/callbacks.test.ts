import { afterEach, describe, expect } from '@jest/globals';

import {
    AgChartInstance,
    AgChartOptions,
    AgCharts,
    AgLinearGaugeOptions,
    AgRadialGaugeOptions,
    AgZoomEvent,
} from 'ag-charts-community';
import {
    AgLinearGaugeOptionsWithContext,
    AgRadialGaugeOptionsWithContext,
    MockChartLabelFormatter,
    MockZoomListener,
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
