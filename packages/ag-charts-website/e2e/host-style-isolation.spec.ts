import type { Locator } from '@playwright/test';

import { expect, test } from './fixture';
import { SELECTORS, gotoExample, setupIntrinsicAssertions, toExamplePageUrl } from './util';

// The example page carries claude.ai's visualiser rules, which set a border and padding on every `button`.
async function readLegendItemStyle(chartContainer: Locator) {
    return chartContainer
        .locator(SELECTORS.legendItems)
        .first()
        .evaluate((el) => {
            const { borderTopStyle, paddingTop } = getComputedStyle(el);
            return { borderTopStyle, paddingTop };
        });
}

const locateChartWrapper = (chartContainer: Locator) =>
    chartContainer.evaluate((el) => {
        if (el.firstElementChild?.shadowRoot?.querySelector('.ag-charts-wrapper') != null) return 'shadow-root';
        return el.querySelector('.ag-charts-wrapper') == null ? 'missing' : 'light-dom';
    });

test.describe('host style isolation', () => {
    setupIntrinsicAssertions(test);

    test.beforeEach(async ({ page }) => {
        await gotoExample(page, toExamplePageUrl('layout-e2e', 'host-style-isolation', 'vanilla').url);
    });

    test('inside the claude.ai visualiser, the chart renders in a shadow root its button rules cannot reach', async ({
        page,
    }) => {
        const chartContainer = page.locator('#myChart');

        expect(await locateChartWrapper(chartContainer)).toBe('shadow-root');
        const style = await readLegendItemStyle(chartContainer);
        expect(style.borderTopStyle).toBe('none');
        expect(style.paddingTop).not.toBe('8px');
    });

    test('inside the claude.ai visualiser, a click elsewhere on the chart closes its context menu', async ({
        page,
    }) => {
        const chartContainer = page.locator('#myChart');
        const contextMenu = chartContainer.locator('.ag-charts-context-menu');
        const canvas = await chartContainer.locator(SELECTORS.canvasProxy).boundingBox();
        expect(canvas).not.toBeNull();
        const { x, y, width, height } = canvas!;

        await page.mouse.click(x + width / 2, y + height / 2, { button: 'right' });
        await expect(contextMenu).toBeVisible();

        await page.mouse.click(x + 10, y + 10);
        await expect(contextMenu).toBeHidden();
    });

    test('outside the visualiser container, the same rules still reach a chart in the light DOM', async ({ page }) => {
        const chartContainer = page.locator('#outsideChart');

        expect(await locateChartWrapper(chartContainer)).toBe('light-dom');
        expect(await readLegendItemStyle(chartContainer)).toEqual({ borderTopStyle: 'solid', paddingTop: '8px' });
    });
});
