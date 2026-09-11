import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
    type AgCartesianChartOptions,
    type AgChartInstance,
    AllCartesianAxesModule as AllCommunityCartesianAxesModule,
    CategoryAxisModule,
    LineSeriesModule,
    NumberAxisModule,
} from 'ag-charts-community';
import {
    clickAction,
    expectErrorsCalls,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from 'ag-charts-community-test';
import { type ModuleDefinition, ModuleRegistry } from 'ag-charts-core';

import { NumberAxisModule as EnterpriseNumberAxisModule } from './axes/cartesian/cartesianAxisModules';
import { AgCharts, RangeBarSeriesModule } from './main';
import { AllCartesianAxesModule } from './module-bundles/cartesian-axes';
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

describe('enterprise cartesian axis modules', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: AgChartInstance | undefined;
    let registeredModules: ModuleDefinition[];

    beforeEach(() => {
        registeredModules = [...ModuleRegistry.listModules()];
        ModuleRegistry.reset();
    });

    afterEach(() => {
        chart?.destroy();
        chart = undefined;
        ModuleRegistry.reset();
        ModuleRegistry.registerModules(registeredModules);
    });

    it('registers axis interaction alongside the enterprise axis modules', () => {
        ModuleRegistry.registerModules([LineSeriesModule, EnterpriseNumberAxisModule]);

        expect(ModuleRegistry.hasModule('axis-dom-proxy')).toBe(true);
    });

    it('replaces a community axis module regardless of registration order', () => {
        ModuleRegistry.registerModules([NumberAxisModule, EnterpriseNumberAxisModule]);
        expect(ModuleRegistry.getAxisModule('number')?.enterprise).toBe(true);

        ModuleRegistry.reset();
        ModuleRegistry.registerModules([EnterpriseNumberAxisModule, NumberAxisModule]);
        expect(ModuleRegistry.getAxisModule('number')?.enterprise).toBe(true);
    });

    it('fires axis click listeners without registering AxisInteractionModule by hand', async () => {
        ModuleRegistry.registerModules([LineSeriesModule, EnterpriseNumberAxisModule]);
        const click = vi.fn();
        chart = AgCharts.create(
            prepareEnterpriseTestOptions({
                data: Array.from({ length: 11 }, (_, i) => ({ x: i * 100, y: i })),
                axes: {
                    x: { type: 'number', listeners: { click } },
                    y: { type: 'number' },
                },
                series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
            })
        );
        await waitForChartStability(chart);

        expect(chart.isModuleRegistered('AxisInteractionModule')).toBe(true);

        await clickAction(418, 560)(chart);
        expect(click).toHaveBeenCalledTimes(1);
    });

    it('wraps every community cartesian axis module', () => {
        const wrapped = new Map(AllCartesianAxesModule.map((module) => [module.name, module]));

        for (const community of AllCommunityCartesianAxesModule) {
            const module = wrapped.get(community.name);
            expect(module?.enterprise, community.name).toBe(true);
            expect(
                module?.dependencies?.map((dep) => dep.name),
                community.name
            ).toContain('axis-dom-proxy');
        }
    });
});
