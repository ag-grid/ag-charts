import { expect, test } from './fixture';
import {
    SELECTORS,
    gotoExample,
    setupIntrinsicAssertions,
    toExamplePageUrl,
    toExamplePageUrls,
    waitForAllChartUpdates,
} from './util';

// Anchor the dialog itself (not the chart wrapper) so the whole card is captured rather than
// clipped to the plot area, and the pure-DOM panel keeps the baseline free of canvas anti-aliasing.
const PANEL = '.ag-charts-validation-overlay__panel';

test.describe('overlay textColor', () => {
    setupIntrinsicAssertions(test);

    for (const { framework, url } of toExamplePageUrls('overlays', 'no-data-themed-text')) {
        test(`overlay text inherits theme textColor (${framework})`, async ({ page }) => {
            await gotoExample(page, url);
            await waitForAllChartUpdates(page);

            const color = await page.locator('.ag-charts-no-data-overlay').evaluate((el) => getComputedStyle(el).color);
            expect(color).toBe('rgb(255, 0, 0)');
        });
    }
});

test.describe('overlay position', () => {
    setupIntrinsicAssertions(test);

    for (const { framework, url } of toExamplePageUrls('overlays', 'no-visible-series')) {
        test(`no visible series overlay stays put across a hide and re-show cycle (${framework})`, async ({ page }) => {
            await gotoExample(page, url);
            await waitForAllChartUpdates(page);

            const overlay = page.locator('.ag-charts-no-visible-series');
            const firstAppearance = await overlay.boundingBox();
            expect(firstAppearance).not.toBeNull();

            // Show a series to dismiss the overlay, then hide it again to bring the overlay back.
            const legendItem = page.locator(SELECTORS.legendItems).first();
            await legendItem.click();
            await waitForAllChartUpdates(page);
            await legendItem.click();
            await waitForAllChartUpdates(page);

            const secondAppearance = await overlay.boundingBox();
            expect(secondAppearance).not.toBeNull();
            expect(secondAppearance!.y).toBeCloseTo(firstAppearance!.y, 0);
        });
    }
});

test.describe('validation overlay', () => {
    // The examples deliberately misconfigure options to trigger the overlay; ignore the resulting
    // validation console warnings so they do not fail the console-clean assertion.
    setupIntrinsicAssertions(test, { ignoreConsolePatterns: ['fillOpacity', 'strokeWidth'] });

    test('renders for a misconfigured option, and Dismiss/Copy are clickable', async ({ page }) => {
        const { url } = toExamplePageUrl('overlays', 'validation-overlay', 'vanilla');
        await gotoExample(page, url);
        await waitForAllChartUpdates(page);

        const overlay = page.locator('.ag-charts-validation-overlay');
        await expect(overlay).toBeVisible();
        await expect(overlay.locator('.ag-charts-validation-overlay__summary')).toHaveText('AG Charts found 1 warning');

        await expect(overlay.locator(PANEL)).toHaveScreenshot('validation-overlay-warning.png');

        const copyButton = overlay.locator('.ag-charts-validation-overlay__copy');
        await expect(copyButton).toBeVisible();

        // The overlay wrapper is `pointer-events: none`; only the card and its buttons re-enable it,
        // so a real click here proves that CSS override reaches the button.
        const dismissButton = overlay.locator('.ag-charts-validation-overlay__dismiss');
        await expect(dismissButton).toBeVisible();
        await dismissButton.click();

        await expect(overlay).toBeHidden();
    });

    test('renders multiple warnings in a single card', async ({ page }) => {
        const { url } = toExamplePageUrl('overlays', 'validation-overlay-multi', 'vanilla');
        await gotoExample(page, url);
        await waitForAllChartUpdates(page);

        const overlay = page.locator('.ag-charts-validation-overlay');
        await expect(overlay).toBeVisible();
        await expect(overlay.locator('.ag-charts-validation-overlay__summary')).toHaveText(
            'AG Charts found 2 warnings'
        );

        await expect(overlay.locator(PANEL)).toHaveScreenshot('validation-overlay-multi.png');
    });

    test('renders with dark-theme styling', async ({ page }) => {
        const { url } = toExamplePageUrl('overlays', 'validation-overlay-dark', 'vanilla');
        await gotoExample(page, url);
        await waitForAllChartUpdates(page);

        const overlay = page.locator('.ag-charts-validation-overlay');
        await expect(overlay).toBeVisible();

        await expect(overlay.locator(PANEL)).toHaveScreenshot('validation-overlay-dark.png');
    });
});
