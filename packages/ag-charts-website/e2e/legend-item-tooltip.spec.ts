import { expect, test } from './fixture';
import { SELECTORS, gotoExample, setupIntrinsicAssertions, toExamplePageUrl, waitForAllChartUpdates } from './util';

test.describe('legend item tooltip', () => {
    setupIntrinsicAssertions(test);

    const { url } = toExamplePageUrl('legend-test', 'legend-item-tooltip-e2e', 'vanilla');

    test.beforeEach(async ({ page }) => {
        await gotoExample(page, url);
    });

    test('auto mode — tooltip shown on truncated item hover', async ({ page }) => {
        const legendItems = await page.locator(SELECTORS.legendItems).all();

        // "Natural Gas" is truncated to ~5 chars, hover should show tooltip
        await legendItems[0].hover();

        const tooltip = page.locator(SELECTORS.tooltip);
        await expect(tooltip).toBeVisible();
        await expect(tooltip).toContainText('Natural Gas');
    });

    test('auto mode — tooltip hidden after leaving legend item', async ({ page }) => {
        const legendItems = await page.locator(SELECTORS.legendItems).all();

        await legendItems[0].hover();
        await expect(page.locator(SELECTORS.tooltip)).toBeVisible();

        // Move away from legend
        await page.mouse.move(0, 0);
        await expect(page.locator(SELECTORS.tooltip)).not.toBeVisible();
    });

    test('always mode — tooltip shown on every hover', async ({ page }) => {
        await page.getByText('Always').click();
        await waitForAllChartUpdates(page);

        const legendItems = await page.locator(SELECTORS.legendItems).all();

        // "Coal" is short and not truncated, but tooltip should still show in 'always' mode
        await legendItems[1].hover();

        const tooltip = page.locator(SELECTORS.tooltip);
        await expect(tooltip).toBeVisible();
        await expect(tooltip).toContainText('Coal');
    });

    test('never mode — tooltip never shown even on truncated items', async ({ page }) => {
        await page.getByText('Never').click();
        await waitForAllChartUpdates(page);

        const legendItems = await page.locator(SELECTORS.legendItems).all();

        // "Natural Gas" is truncated, but tooltip should not show in 'never' mode
        await legendItems[0].hover();

        const tooltip = page.locator(SELECTORS.tooltip);
        await expect(tooltip).not.toBeVisible();
    });

    test('custom text — static tooltip text shown', async ({ page }) => {
        await page.getByText('Custom Text').click();
        await waitForAllChartUpdates(page);

        const legendItems = await page.locator(SELECTORS.legendItems).all();
        await legendItems[0].hover();

        const tooltip = page.locator(SELECTORS.tooltip);
        await expect(tooltip).toBeVisible();
        await expect(tooltip).toContainText('Click to toggle');
    });

    test('renderer — HTML content rendered in tooltip', async ({ page }) => {
        await page.getByText('Renderer').click();
        await waitForAllChartUpdates(page);

        const legendItems = await page.locator(SELECTORS.legendItems).all();
        await legendItems[0].hover();

        const tooltip = page.locator(SELECTORS.tooltip);
        await expect(tooltip).toBeVisible();
        await expect(tooltip).toContainText('Natural Gas');
        await expect(tooltip).toContainText('Visible');

        // Verify HTML was rendered (bold tag should be present)
        await expect(tooltip.locator('b')).toContainText('Natural Gas');
    });
});
