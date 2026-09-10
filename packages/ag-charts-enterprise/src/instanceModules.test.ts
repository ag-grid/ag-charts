import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
    type AgCartesianChartOptions,
    type AgChartInstance,
    CategoryAxisModule,
    NumberAxisModule,
} from 'ag-charts-community';
import { expectErrorsCalls, setupMockCanvas, setupMockConsole, waitForChartStability } from 'ag-charts-community-test';
import { type ModuleDefinition, ModuleRegistry } from 'ag-charts-core';

import { AgCharts, RangeBarSeriesModule } from './main';
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

// The range-bar template enables `crosshair` by default; only a user-set crosshair should report the module.
describe('theme defaults for unregistered modules', () => {
    setupMockConsole();
    setupMockCanvas();

    const OPTIONS: AgCartesianChartOptions = {
        data: [
            { month: 'Jan', low: -3, high: 8 },
            { month: 'Feb', low: -1, high: 11 },
        ],
        series: [{ type: 'range-bar', xKey: 'month', yLowKey: 'low', yHighKey: 'high' }],
    };

    let chart: AgChartInstance | undefined;
    let registeredModules: ModuleDefinition[];

    beforeEach(() => {
        registeredModules = [...ModuleRegistry.listModules()];
        ModuleRegistry.reset();
        ModuleRegistry.registerModules([RangeBarSeriesModule, CategoryAxisModule, NumberAxisModule]);
    });

    afterEach(() => {
        chart?.destroy();
        chart = undefined;
        ModuleRegistry.reset();
        ModuleRegistry.registerModules(registeredModules);
    });

    async function createChart(options: AgCartesianChartOptions) {
        chart = AgCharts.create(prepareEnterpriseTestOptions({ ...options }));
        await waitForChartStability(chart);
    }

    it('drops the template crosshair default without reporting CrosshairModule', async () => {
        await createChart(OPTIONS);

        expect(console.error).not.toHaveBeenCalled();
    });

    it('reports CrosshairModule when enabled through theme overrides', async () => {
        await createChart({
            ...OPTIONS,
            theme: { overrides: { common: { axes: { number: { crosshair: { enabled: true } } } } } },
        });

        expectErrorsCalls().toContainEqual([expect.stringContaining('CrosshairModule')]);
    });

    it('reports CrosshairModule when enabled through options', async () => {
        await createChart({
            ...OPTIONS,
            axes: {
                x: { type: 'category' },
                y: { type: 'number', crosshair: { enabled: true } },
            },
        });

        expectErrorsCalls().toContainEqual([expect.stringContaining('CrosshairModule')]);
    });
});
