import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { type AgChartInstance, type AgChartOptions, AgCharts } from 'ag-charts-community';
import { setupMockCanvas, setupMockConsole, waitForChartStability } from 'ag-charts-community-test';
import { ModuleRegistry, enterpriseRegistry } from 'ag-charts-core';

import { Foreground } from '../features/foreground/foreground';
import { prepareEnterpriseTestOptions } from '../test/utils';

class ObservedForeground extends Foreground {
    get text() {
        return this.textNode.text;
    }
}

const WATERMARK = 'For Trial Use Only';

describe('download watermark', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: AgChartInstance | undefined;
    const originalLicenseManager = enterpriseRegistry.licenseManager;
    const originalCreateForeground = enterpriseRegistry.createForeground;
    const foregrounds: ObservedForeground[] = [];

    beforeEach(() => {
        enterpriseRegistry.licenseManager = () => ({
            validateLicense: () => {},
            hasLicenseKey: () => false,
            isDisplayWatermark: () => true,
            getWatermarkMessage: () => WATERMARK,
            getWatermarkForegroundConfig: () => ({ text: WATERMARK }),
            getWatermarkForegroundConfigForBrowser: () => ({ text: WATERMARK }),
            getLicenseDetails: () => ({}),
        });
        foregrounds.length = 0;
        enterpriseRegistry.createForeground = (ctx) => {
            const foreground = new ObservedForeground(ctx);
            foregrounds.push(foreground);
            return foreground;
        };
    });

    afterEach(() => {
        chart?.destroy();
        chart = undefined;
        enterpriseRegistry.licenseManager = originalLicenseManager;
        enterpriseRegistry.createForeground = originalCreateForeground;
        ModuleRegistry.setRegistryMode(ModuleRegistry.RegistryMode.Enterprise);
    });

    it('watermarks the image even when the registry mode has been cleared', async () => {
        const options: AgChartOptions = {
            data: [{ x: 'a', y: 1 }],
            series: [{ type: 'bar', xKey: 'x', yKey: 'y' }],
        };
        chart = AgCharts.create(prepareEnterpriseTestOptions(options));
        await waitForChartStability(chart);
        expect(foregrounds.map((f) => f.text)).toEqual([undefined]);

        ModuleRegistry.clearRegistryModes();
        await chart.getImageDataURL();

        expect(foregrounds.map((f) => f.text)).toEqual([undefined, WATERMARK]);
    });
});
