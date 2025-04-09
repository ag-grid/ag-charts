import { afterEach, describe, expect } from '@jest/globals';

import { AgChartInstance, AgCharts, AgLinearGaugeOptions, AgRadialGaugeOptions } from 'ag-charts-community';
import {
    AgLinearGaugeOptionsWithContext,
    AgRadialGaugeOptionsWithContext,
    MockChartLabelFormatter,
    newFreezableMock,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from 'ag-charts-community-test';

import { prepareEnterpriseTestOptions } from './test/utils';

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
