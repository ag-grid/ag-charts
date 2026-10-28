import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
    type AgChartInstance,
    BarSeriesModule,
    CategoryAxisModule,
    LegendModule,
    NumberAxisModule,
} from 'ag-charts-community';
import { getTabStopGroups, setupMockCanvas, setupMockConsole } from 'ag-charts-community-test';
import { type ModuleDefinition, ModuleRegistry } from 'ag-charts-core';

import { AnnotationsModule, ZoomModule } from './main';
import { createEnterpriseChart } from './test/utils';

describe('keyboard tab order', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: AgChartInstance | undefined;

    afterEach(() => {
        chart?.destroy();
        chart = undefined;
    });

    it('visits the cross lines after the series area and before the legend, navigator and scrollbars', async () => {
        chart = await createEnterpriseChart({
            data: [
                { x: 1, y: 2 },
                { x: 4, y: 8 },
            ],
            series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
            legend: { enabled: true },
            zoom: { enabled: true },
            navigator: { enabled: true },
            scrollbar: { enabled: true },
            listeners: { crossLineClick: () => {} },
            axes: {
                x: { type: 'number', crossLines: [{ type: 'line', value: 2 }] },
                y: { type: 'number', crossLines: [{ type: 'line', value: 3 }] },
            },
        });

        expect(getTabStopGroups()).toEqual([
            'ag-charts-series-area',
            'ag-charts-proxy-cross-lines',
            'ag-charts-proxy-legend-toolbar',
            'ag-charts-proxy-navigator-toolbar',
            'ag-charts-proxy-scrollbar',
            'ag-charts-proxy-scrollbar',
        ]);
    });

    it('visits polar cross lines after the series area and before the legend', async () => {
        chart = await createEnterpriseChart({
            data: [
                { quarter: 'Q1', revenue: 2 },
                { quarter: 'Q2', revenue: 8 },
                { quarter: 'Q3', revenue: 5 },
            ],
            series: [{ type: 'radar-line', angleKey: 'quarter', radiusKey: 'revenue' }],
            legend: { enabled: true },
            listeners: { crossLineClick: () => {} },
            axes: {
                angle: { type: 'angle-category', crossLines: [{ type: 'line', value: 'Q2' }] },
                radius: { type: 'radius-number', crossLines: [{ type: 'line', value: 4 }] },
            },
        });

        expect(getTabStopGroups()).toEqual([
            'ag-charts-series-area',
            'ag-charts-proxy-cross-lines',
            'ag-charts-proxy-legend-toolbar',
        ]);
    });
});

describe('registration order', () => {
    setupMockConsole();
    setupMockCanvas();

    const MODULES: ModuleDefinition[] = [
        AnnotationsModule,
        BarSeriesModule,
        CategoryAxisModule,
        LegendModule,
        NumberAxisModule,
        ZoomModule,
    ];

    let chart: AgChartInstance | undefined;
    let registeredModules: ModuleDefinition[];

    beforeEach(() => {
        registeredModules = [...ModuleRegistry.listModules()];
    });

    afterEach(() => {
        chart?.destroy();
        chart = undefined;
        ModuleRegistry.reset();
        ModuleRegistry.registerModules(registeredModules);
    });

    async function overlayAndTabOrder(modules: ModuleDefinition[]) {
        ModuleRegistry.reset();
        ModuleRegistry.registerModules(modules);
        chart = await createEnterpriseChart({
            data: [
                { month: 'Jan', revenue: 2 },
                { month: 'Feb', revenue: 8 },
            ],
            series: [{ type: 'bar', xKey: 'month', yKey: 'revenue' }],
            annotations: { enabled: true },
            zoom: { enabled: true },
        });
        const overlay = Array.from(document.querySelectorAll('.ag-charts-canvas-overlay > *'), (el) => el.className);
        const tabStops = Array.from(document.querySelectorAll<HTMLElement>('.ag-charts-wrapper *'))
            .filter((el) => el.tabIndex >= 0)
            .map(
                (el) =>
                    el.closest('.ag-charts-canvas-overlay > *, .ag-charts-proxy-container, .ag-charts-series-area')
                        ?.className
            );
        const result = { overlay, tabStops };
        chart.destroy();
        chart = undefined;
        return result;
    }

    it('does not depend on the order modules were registered in', async () => {
        const forwards = await overlayAndTabOrder(MODULES);
        const backwards = await overlayAndTabOrder(MODULES.toReversed());

        expect(forwards.overlay.length).toBeGreaterThan(1);
        expect(backwards).toEqual(forwards);
    });
});
