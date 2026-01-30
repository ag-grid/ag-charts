import type { Page } from '@playwright/test';

import { expect, test } from './fixture';
import { gotoUrl, setupIntrinsicAssertions, toPageUrl } from './util';

const BASE_OPTIONS = {
    data: [
        { label: 'A', value: 3 },
        { label: 'B', value: 7 },
        { label: 'C', value: 5 },
    ],
    series: [{ type: 'bar', xKey: 'label', yKey: 'value' }],
};

async function waitForAgCharts(page: Page) {
    await page.waitForFunction(() => (window as any).agCharts?.AgCharts != null);
}

async function getChartScriptUrl(page: Page) {
    const scriptUrl = await page.evaluate(() => {
        const scripts = Array.from(document.scripts);
        const script =
            scripts.find((entry) => entry.src.includes('ag-charts-enterprise')) ??
            scripts.find((entry) => entry.src.includes('ag-charts-community'));
        return script?.src ?? null;
    });
    if (!scriptUrl) {
        throw new Error('AG Charts script tag not found on the page.');
    }
    return scriptUrl;
}

async function openPopupWithCharts(page: Page, scriptUrl: string) {
    const popupPromise = page.waitForEvent('popup');
    await page.evaluate(() => {
        (window as any).agE2EPopup = window.open('about:blank', 'ag-charts-e2e', 'width=500,height=400');
    });
    const popup = await popupPromise;
    await popup.waitForLoadState('domcontentloaded');
    await popup.addScriptTag({ url: scriptUrl });
    await popup.waitForFunction(() => (window as any).agCharts?.AgCharts != null);
    return popup;
}

test.describe('document switching', () => {
    setupIntrinsicAssertions(test);

    test('chart created without container, then added later', async ({ page }) => {
        await gotoUrl(page, toPageUrl(''));
        await waitForAgCharts(page);

        await page.evaluate((baseOptions) => {
            const { AgCharts } = (window as any).agCharts;
            const chart = AgCharts.create(baseOptions);
            (window as any).agE2EChart = chart;
            (window as any).agE2EOptions = baseOptions;
        }, BASE_OPTIONS);

        await page.evaluate(async () => {
            const container = document.createElement('div');
            container.id = 'ag-e2e-container-1';
            container.style.width = '400px';
            container.style.height = '300px';
            document.body.appendChild(container);

            const chart = (window as any).agE2EChart;
            const options = { ...(window as any).agE2EOptions, container };
            await chart.update(options);
            await chart.waitForUpdate(2000, true);
        });

        await expect(page.locator('#ag-e2e-container-1 .ag-charts-wrapper')).toHaveCount(1);
    });

    test('chart created in a sub-document (popup)', async ({ page }) => {
        await gotoUrl(page, toPageUrl(''));
        await waitForAgCharts(page);

        const scriptUrl = await getChartScriptUrl(page);
        const popup = await openPopupWithCharts(page, scriptUrl);

        await popup.evaluate((baseOptions) => {
            const container = document.createElement('div');
            container.id = 'ag-e2e-popup-container-2';
            container.style.width = '400px';
            container.style.height = '300px';
            document.body.appendChild(container);

            const { AgCharts } = (window as any).agCharts;
            const chart = AgCharts.create({ ...baseOptions, container });
            (window as any).agE2EChart = chart;
        }, BASE_OPTIONS);

        await popup.evaluate(async () => {
            await (window as any).agE2EChart.waitForUpdate(2000, true);
        });

        await expect(popup.locator('#ag-e2e-popup-container-2 .ag-charts-wrapper')).toHaveCount(1);
        await popup.close();
    });

    test('chart created in main document, then moved to a popup container', async ({ page }) => {
        await gotoUrl(page, toPageUrl(''));
        await waitForAgCharts(page);

        const scriptUrl = await getChartScriptUrl(page);
        const popup = await openPopupWithCharts(page, scriptUrl);

        await page.evaluate((baseOptions) => {
            const container = document.createElement('div');
            container.id = 'ag-e2e-container-3';
            container.style.width = '400px';
            container.style.height = '300px';
            document.body.appendChild(container);

            const { AgCharts } = (window as any).agCharts;
            const chart = AgCharts.create({ ...baseOptions, container });
            (window as any).agE2EChart = chart;
            (window as any).agE2EOptions = baseOptions;
        }, BASE_OPTIONS);

        await page.evaluate(async () => {
            await (window as any).agE2EChart.waitForUpdate(2000, true);
        });

        await popup.evaluate(() => {
            const container = document.createElement('div');
            container.id = 'ag-e2e-popup-container-3';
            container.style.width = '400px';
            container.style.height = '300px';
            document.body.appendChild(container);
        });

        await page.evaluate(async () => {
            const pagePopup = (window as any).agE2EPopup as Window | null;
            if (!pagePopup) {
                throw new Error('Popup window not available.');
            }
            const container = pagePopup.document.getElementById('ag-e2e-popup-container-3');
            if (!container) {
                throw new Error('Popup container not found.');
            }

            const chart = (window as any).agE2EChart;
            const options = { ...(window as any).agE2EOptions, container };
            await chart.update(options);
            await chart.waitForUpdate(2000, true);
        });

        await expect(popup.locator('#ag-e2e-popup-container-3 .ag-charts-wrapper')).toHaveCount(1);
        await expect(page.locator('#ag-e2e-container-3 .ag-charts-wrapper')).toHaveCount(0);
        await popup.close();
    });
});
