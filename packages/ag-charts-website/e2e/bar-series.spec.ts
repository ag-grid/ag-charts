import { expect, test } from './fixture';
import { expectChartScreenshot } from './scene-capture';
import { SELECTORS, gotoExample, setupIntrinsicAssertions, toExamplePageUrl, waitForAllChartUpdates } from './util';

test.describe('bar-series', () => {
    setupIntrinsicAssertions(test);

    // Each series carries its own `data` array covering a different set of products, so the category axis
    // renders the union (Air, Pro, Pro 15", Pro 16") and must keep it when a series is toggled off.
    test.describe('data-per-series', () => {
        test.beforeEach(async ({ page }) => {
            await gotoExample(page, toExamplePageUrl('bar-series-e2e', 'data-per-series', 'vanilla').url);
        });

        test('renders the union of per-series categories', async ({ page }) => {
            await expectChartScreenshot(page, page.locator(SELECTORS.canvasCenter), 'data-per-series-initial.png');
        });

        test('keyboard focus shows a tooltip for the focused series datum', async ({ page }) => {
            await page.keyboard.press('Tab');
            await waitForAllChartUpdates(page);

            await expect(page.locator(SELECTORS.tooltip)).toHaveCount(1);
            await expectChartScreenshot(page, page.locator(SELECTORS.canvasCenter), 'data-per-series-tooltip.png');
        });

        test('legend toggling preserves the category union', async ({ page }) => {
            const legendItems = await page.locator(SELECTORS.legendItems).all();
            await legendItems[0].click();
            await waitForAllChartUpdates(page);

            await expectChartScreenshot(
                page,
                page.locator(SELECTORS.canvasCenter),
                'data-per-series-legend-toggled.png'
            );
        });

        // Hovering a legend item highlights that series' stack and dims the rest. Item index 2 is
        // "MacBook - Retail" (green); the iPad series should fade.
        test('legend hover highlights the series and dims the others', async ({ page }) => {
            const legendItems = await page.locator(SELECTORS.legendItems).all();
            await legendItems[2].hover();
            await waitForAllChartUpdates(page);

            await expectChartScreenshot(page, page.locator(SELECTORS.canvasCenter), 'data-per-series-legend-hover.png');
        });

        // Two ArrowRights lands on "MacBook - Retail", the third of four legend items.
        test('keyboard legend focus highlights the series and dims the others', async ({ page }) => {
            await page.keyboard.press('Tab');
            await page.keyboard.press('Tab');
            await page.keyboard.press('ArrowRight');
            await page.keyboard.press('ArrowRight');
            await waitForAllChartUpdates(page);

            await expectChartScreenshot(page, page.locator(SELECTORS.canvasCenter), 'data-per-series-legend-focus.png');
        });
    });
});
