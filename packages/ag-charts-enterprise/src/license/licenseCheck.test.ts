import type { Mock } from 'vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
    type AgCartesianChartOptions,
    type AgChartInstance,
    AgCharts,
    CategoryAxisModule,
    LineSeriesModule,
    NumberAxisModule,
} from 'ag-charts-community';
import { prepareTestOptions, setupMockCanvas, setupMockConsole, waitForChartStability } from 'ag-charts-community-test';
import { type ModuleDefinition, ModuleRegistry, enterpriseRegistry } from 'ag-charts-core';

import { LicenseManager } from './licenseManager';

// The suite-wide mock stands in for this module everywhere else; these tests need the real one.
vi.unmock('./licenseManager');

const LINE_CHART: AgCartesianChartOptions = {
    data: [
        { x: 'A', y: 1 },
        { x: 'B', y: 2 },
    ],
    series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
};

// Reads and clears, so an asserted banner does not trip the mock console's clean-exit check.
function takeErrorMessages(): string[] {
    const mock = console.error as Mock;
    const messages = mock.mock.calls.map(([m]) => String(m));
    mock.mockClear();
    return messages;
}

describe('licence check for a community-only chart', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: AgChartInstance | undefined;
    let registeredModules: ModuleDefinition[];
    let hostDocument: Document;
    const originalLicenseManager = enterpriseRegistry.licenseManager;

    beforeEach(() => {
        registeredModules = [...ModuleRegistry.listModules()];
        ModuleRegistry.reset();
        ModuleRegistry.registerModules([LineSeriesModule, CategoryAxisModule, NumberAxisModule]);
        enterpriseRegistry.licenseManager = (document) => new LicenseManager(document);
        // Licence managers are cached per document, so a fresh document isolates each test from the others.
        hostDocument = document.implementation.createHTMLDocument();
    });

    afterEach(() => {
        chart?.destroy();
        chart = undefined;
        LicenseManager.clearLicenseKey();
        enterpriseRegistry.licenseManager = originalLicenseManager;
        ModuleRegistry.reset();
        ModuleRegistry.registerModules(registeredModules);
    });

    async function createChart() {
        chart = AgCharts.create(prepareTestOptions({ ...LINE_CHART }, hostDocument.body));
        await waitForChartStability(chart);
        return chart;
    }

    it.each(['', undefined, null])('reports the licence key %s as missing', async (key) => {
        LicenseManager.setLicenseKey(key);
        await createChart();

        const messages = takeErrorMessages();
        expect(messages.some((m) => m.includes('License Key Not Found'))).toBe(true);
        expect(hostDocument.querySelector('.ag-watermark')).toBeNull();
    });

    it('stays silent when no licence key was set', async () => {
        await createChart();

        expect(takeErrorMessages()).toEqual([]);
        expect(hostDocument.querySelector('.ag-watermark')).toBeNull();
    });
});
