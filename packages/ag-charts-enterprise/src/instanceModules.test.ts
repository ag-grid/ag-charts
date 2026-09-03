import { afterEach, describe, expect, it } from 'vitest';

import type { AgCartesianChartOptions, AgChartInstance } from 'ag-charts-community';
import { setupMockCanvas, setupMockConsole, waitForChartStability } from 'ag-charts-community-test';

import { AgCharts } from './main';
import { prepareEnterpriseTestOptions } from './test/utils';

describe('instance modules', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: AgChartInstance;

    afterEach(() => {
        chart?.destroy();
        (chart as unknown) = undefined;
    });

    it('answers isModuleRegistered() for the exported names of enterprise plugin modules', async () => {
        const options: AgCartesianChartOptions = {
            data: [{ x: 'A', y: 1 }],
            series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
        };
        chart = AgCharts.create(prepareEnterpriseTestOptions(options));
        await waitForChartStability(chart);

        expect(chart.isModuleRegistered('AxisInteractionModule')).toBe(true);
        expect(chart.isModuleRegistered('ZoomModule')).toBe(true);
        expect(chart.isModuleRegistered('QuadrantChartModule')).toBe(true);
        expect(chart.isModuleRegistered('NotAModule')).toBe(false);
    });
});
