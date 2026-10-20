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

    test('inside the claude.ai visualiser, a click on another chart closes a toolbar menu', async ({ page }) => {
        const menu = page.locator('#financialChart .ag-charts-menu');
        const otherCanvas = await page.locator('#myChart').locator(SELECTORS.canvasProxy).boundingBox();
        expect(otherCanvas).not.toBeNull();

        await page.locator('#financialChart').getByTitle('Chart Type').click();
        await expect(menu).toBeVisible();

        await page.mouse.click(otherCanvas!.x + otherCanvas!.width / 2, otherCanvas!.y + otherCanvas!.height / 2);
        await expect(menu).toBeHidden();
    });

    test('inside the claude.ai visualiser, the colour picker keeps its own input styles and typed text', async ({
        page,
    }) => {
        const chartContainer = page.locator('#financialChart');
        const canvas = chartContainer.locator(SELECTORS.canvasProxy);

        await chartContainer.getByTitle('Fibonacci').click();
        await chartContainer.getByText('Fib Retracement').click();
        await canvas.hover({ position: { x: 100, y: 200 } });
        await canvas.click({ position: { x: 100, y: 200 } });
        await canvas.hover({ position: { x: 300, y: 80 } });
        await canvas.click({ position: { x: 300, y: 80 } });
        await chartContainer.getByTitle('Line Color').click();

        const colorInput = chartContainer.locator('.ag-charts-color-picker__color-input');
        const style = await colorInput.evaluate((el) => {
            const { borderTopStyle, paddingTop } = getComputedStyle(el);
            return { borderTopStyle, paddingTop };
        });
        expect(style).toEqual({ borderTopStyle: 'none', paddingTop: '7px' });

        await colorInput.fill('');
        await colorInput.pressSequentially('#00ff00');
        await expect(colorInput).toHaveValue('#00ff00');
    });

    test('outside the visualiser container, the same rules still reach a chart in the light DOM', async ({ page }) => {
        const chartContainer = page.locator('#outsideChart');

        expect(await locateChartWrapper(chartContainer)).toBe('light-dom');
        expect(await readLegendItemStyle(chartContainer)).toEqual({ borderTopStyle: 'solid', paddingTop: '8px' });
    });
});
