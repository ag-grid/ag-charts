import type { Mock } from 'vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { type ModuleDefinition, ModuleRegistry, ModuleType, enterpriseRegistry } from 'ag-charts-core';
import type { AgCartesianChartOptions, AgChartInstance } from 'ag-charts-types';

import { AgCharts } from '../api/agCharts';
import { LegendModule } from '../chart/legend/legendModule';
import { BarSeriesModule } from '../chart/series/cartesian/barSeriesModule';
import { LineSeriesModule } from '../chart/series/cartesian/lineSeriesModule';
import { prepareTestOptions, setupMockCanvas, setupMockConsole, waitForChartStability } from '../chart/test/utils';
import { CategoryAxisModule } from './axis-modules/categoryAxisModule';
import { NumberAxisModule } from './axis-modules/numberAxisModule';
import { ChartOptions } from './optionsModule';

const LINE_CHART: AgCartesianChartOptions = {
    data: [
        { quarter: 'Q1', revenue: 10 },
        { quarter: 'Q2', revenue: 14 },
        { quarter: 'Q3', revenue: 9 },
    ],
    series: [{ type: 'line', xKey: 'quarter', yKey: 'revenue' }],
    axes: { x: { type: 'category' }, y: { type: 'number' } },
};

const BAR_CHART: AgCartesianChartOptions = {
    ...LINE_CHART,
    series: [{ type: 'bar', xKey: 'quarter', yKey: 'revenue' }],
};

const LINE_MODULES = [LineSeriesModule, CategoryAxisModule, NumberAxisModule];

function processOptions(userOptions: AgCartesianChartOptions, modules?: ModuleDefinition[]) {
    return new ChartOptions<AgCartesianChartOptions>(
        undefined,
        userOptions,
        {},
        {},
        { modules },
        undefined,
        false,
        false
    );
}

// Reads and clears, so an asserted message does not trip the mock console's clean-exit check.
function takeConsoleMessages(method: 'error' | 'warn'): string[] {
    const mock = console[method] as Mock;
    const messages = mock.mock.calls.map(([m]) => String(m));
    mock.mockClear();
    return messages;
}

function axisCount(chartOptions: ChartOptions<AgCartesianChartOptions>): number {
    return Object.keys(chartOptions.processedOptions.axes ?? {}).length;
}

describe('instance modules', () => {
    setupMockConsole();

    let registeredModules: ModuleDefinition[];

    beforeEach(() => {
        registeredModules = [...ModuleRegistry.listModules()];
        ModuleRegistry.reset();
    });

    afterEach(() => {
        ModuleRegistry.reset();
        ModuleRegistry.registerModules(registeredModules);
    });

    describe('options processing', () => {
        it('processes a chart from instance modules alone', () => {
            const chartOptions = processOptions(LINE_CHART, LINE_MODULES);

            expect(chartOptions.processedOptions.series).toHaveLength(1);
            expect(axisCount(chartOptions)).toBe(2);
            expect(console.error).not.toHaveBeenCalled();
        });

        it('keeps instance modules invisible to other charts', () => {
            processOptions(LINE_CHART, LINE_MODULES);
            expect(console.error).not.toHaveBeenCalled();

            const other = processOptions(LINE_CHART, [BarSeriesModule, CategoryAxisModule, NumberAxisModule]);
            expect(other.processedOptions.series).toHaveLength(0);
            expect(takeConsoleMessages('error').some((m) => m.includes('LineSeriesModule'))).toBe(true);
        });

        it('adds instance modules over the global registry', () => {
            ModuleRegistry.registerModules([CategoryAxisModule, NumberAxisModule]);

            const chartOptions = processOptions(LINE_CHART, [LineSeriesModule]);

            expect(chartOptions.processedOptions.series).toHaveLength(1);
            expect(console.error).not.toHaveBeenCalled();
        });

        it('suggests the params form when a chart created with instance modules is missing one', () => {
            processOptions(BAR_CHART, LINE_MODULES);

            const [message] = takeConsoleMessages('error');
            expect(message).toContain('required modules are not registered');
            expect(message).toContain('AgCharts.create(options, {');
            expect(message).toContain('BarSeriesModule');
            expect(message).not.toContain('ModuleRegistry.registerModules');
        });

        it('keeps the global registry snippet for globally registered charts', () => {
            ModuleRegistry.registerModules(LINE_MODULES);

            processOptions(BAR_CHART);

            const [message] = takeConsoleMessages('error');
            expect(message).toContain('ModuleRegistry.registerModules([');
            expect(message).not.toContain('AgCharts.create(options, {');
        });

        it('reports an unknown series type unchanged', () => {
            processOptions({ ...LINE_CHART, series: [{ type: 'nonsense' } as any] }, LINE_MODULES);

            const [message] = takeConsoleMessages('warn');
            expect(message).toContain('Unknown type `nonsense` at `series[0].type`');
            expect(message).toContain("expecting 'bar'");
        });

        it('builds separate themes for different module sets', () => {
            const withLegend = processOptions(LINE_CHART, [...LINE_MODULES, LegendModule]);
            const withoutLegend = processOptions(LINE_CHART, LINE_MODULES);
            const withLegendAgain = processOptions(LINE_CHART, [LegendModule, ...LINE_MODULES]);

            expect(withLegend.activeTheme).not.toBe(withoutLegend.activeTheme);
            expect(withLegendAgain.activeTheme).toBe(withLegend.activeTheme);
            expect(withLegend.processedOptions.legend).toBeDefined();
            expect(withoutLegend.processedOptions.legend).toBeUndefined();
        });

        it('sees modules registered globally after the chart scope was created', () => {
            processOptions(LINE_CHART, [LineSeriesModule]);
            expect(takeConsoleMessages('error').some((m) => m.includes('CategoryAxisModule'))).toBe(true);

            ModuleRegistry.registerModules([CategoryAxisModule, NumberAxisModule]);

            const chartOptions = processOptions(LINE_CHART, [LineSeriesModule]);
            expect(axisCount(chartOptions)).toBe(2);
            expect(console.error).not.toHaveBeenCalled();
        });
    });

    describe('chart creation', () => {
        const ctx = setupMockCanvas();
        let chart: AgChartInstance | undefined;

        afterEach(() => {
            chart?.destroy();
            chart = undefined;
        });

        describe('licence check', () => {
            const enterprisePlugin: ModuleDefinition = {
                type: ModuleType.Plugin,
                name: 'enterprise-plugin',
                version: LineSeriesModule.version,
                enterprise: true,
                create: () => ({}),
            };
            const createLicenseManager = vi.fn(() => ({
                validateLicense: () => {},
                isDisplayWatermark: () => true,
                getWatermarkMessage: () => 'watermark',
                getWatermarkForegroundConfig: () => undefined,
                getWatermarkForegroundConfigForBrowser: () => undefined,
                getLicenseDetails: () => ({}),
            }));
            const injectWatermark = vi.fn();

            beforeEach(() => {
                enterpriseRegistry.licenseManager = createLicenseManager;
                enterpriseRegistry.injectWatermark = injectWatermark;
            });

            afterEach(() => {
                delete enterpriseRegistry.licenseManager;
                delete enterpriseRegistry.injectWatermark;
            });

            it('licenses a chart by the modules in its own scope', async () => {
                ModuleRegistry.registerModules(LINE_MODULES);

                const enterpriseChart = AgCharts.create(prepareTestOptions({ ...LINE_CHART }), {
                    modules: [enterprisePlugin],
                });
                await waitForChartStability(enterpriseChart);
                expect(createLicenseManager).toHaveBeenCalledTimes(1);
                expect(injectWatermark).toHaveBeenCalledTimes(1);
                enterpriseChart.destroy();

                chart = AgCharts.create(prepareTestOptions({ ...LINE_CHART }));
                await waitForChartStability(chart);
                expect(injectWatermark).toHaveBeenCalledTimes(1);
                expect(chart.isModuleRegistered('enterprise-plugin')).toBe(false);
            });
        });

        it('throws when neither the global registry nor the params hold any module', () => {
            expect(() => AgCharts.create(prepareTestOptions({ ...LINE_CHART }))).toThrow(
                /No modules have been registered/
            );
            expect(() => AgCharts.create(prepareTestOptions({ ...LINE_CHART }))).toThrow(
                /AgCharts\.create\(options, \{ modules: \[\.\.\.\] \}\)/
            );
        });

        it('renders identically whether modules are registered globally or per instance', async () => {
            ModuleRegistry.registerModules([...LINE_MODULES, LegendModule]);
            chart = AgCharts.create(prepareTestOptions({ ...LINE_CHART }));
            await waitForChartStability(chart);
            const globalSnapshot = ctx.snapshot();
            chart.destroy();
            ModuleRegistry.reset();

            chart = AgCharts.create(prepareTestOptions({ ...LINE_CHART }), {
                modules: [...LINE_MODULES, LegendModule],
            });
            await waitForChartStability(chart);

            expect(ctx.snapshot()).toMatchImage(globalSnapshot, { writeDiff: false });
            expect(console.error).not.toHaveBeenCalled();
        });

        it('keeps instance modules across updates without re-passing them', async () => {
            chart = AgCharts.create(prepareTestOptions({ ...LINE_CHART }), { modules: LINE_MODULES });
            await waitForChartStability(chart);

            await chart.update(prepareTestOptions({ ...LINE_CHART, title: { text: 'Updated' } }));
            await chart.updateDelta({ subtitle: { text: 'Delta' } });

            expect(chart.getOptions().title?.text).toBe('Updated');
            expect(chart.getOptions().series).toHaveLength(1);
            expect(console.error).not.toHaveBeenCalled();
        });

        it('answers isModuleRegistered() against the chart scope', async () => {
            ModuleRegistry.registerModules([CategoryAxisModule, NumberAxisModule]);
            chart = AgCharts.create(prepareTestOptions({ ...LINE_CHART }), { modules: [LineSeriesModule] });
            await waitForChartStability(chart);

            expect(chart.isModuleRegistered('LineSeriesModule')).toBe(true);
            expect(chart.isModuleRegistered('NumberAxisModule')).toBe(true);
            expect(chart.isModuleRegistered('BarSeriesModule')).toBe(false);
            expect(chart.isModuleRegistered('line')).toBe(true);
            expect(ModuleRegistry.hasModule('line')).toBe(false);
        });

        it('runs instance plugin modules through the chart context', async () => {
            const register = vi.fn();
            const plugin: ModuleDefinition = {
                type: ModuleType.Plugin,
                name: 'instance-plugin',
                version: LineSeriesModule.version,
                enterprise: false,
                register,
                create: () => ({}),
            };

            chart = AgCharts.create(prepareTestOptions({ ...LINE_CHART }), { modules: [...LINE_MODULES, plugin] });
            await waitForChartStability(chart);

            expect(register).toHaveBeenCalled();
            expect(chart.isModuleRegistered('instance-plugin')).toBe(true);
        });
    });
});
