import { afterEach, describe, expect } from '@jest/globals';

import { AgChartInstance, AgCharts } from 'ag-charts-community';
import {
    AgRadialGaugeOptionsWithContext,
    MockChartLabelFormatter,
    newFreezableMock,
    setupMockCanvas,
    setupMockConsole,
} from 'ag-charts-community-test';

import { prepareEnterpriseTestOptions } from './test/utils';

describe('AG-13024 API context gauges', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: AgChartInstance;
    let rootContext: object;
    const chartLabelFormatter = newFreezableMock<MockChartLabelFormatter>((_params) => undefined);

    beforeEach(() => {
        rootContext = { name: 'root context' };
        chartLabelFormatter.mock.mockClear();
        const options: AgRadialGaugeOptionsWithContext = {
            type: 'radial-gauge',
            context: rootContext,
            value: 80,
            scale: { min: 0, max: 100, label: { enabled: false } },
            label: { formatter: chartLabelFormatter.frozen },
            secondaryLabel: { text: 'Test Score' },
        };
        prepareEnterpriseTestOptions(options);
        chart = AgCharts.createGauge(options);
    });

    afterEach(() => {
        expect(Object.isFrozen(rootContext)).toBe(false);
        chart?.destroy();
        (chart as unknown) = undefined;
    });

    test('itemStyler', () => {
        chartLabelFormatter.expect().toHaveBeenCalledTimes(3);
        chartLabelFormatter.expect().nthCalledWithContext(0, rootContext);
        chartLabelFormatter.expect().nthCalledWithContext(1, rootContext);
        chartLabelFormatter.expect().nthCalledWithContext(2, rootContext);
    });
});
