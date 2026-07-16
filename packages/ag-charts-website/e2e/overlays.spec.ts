import { expect, test } from './fixture';
import {
    SELECTORS,
    gotoExample,
    setupIntrinsicAssertions,
    toExamplePageUrl,
    toExamplePageUrls,
    waitForAllChartUpdates,
} from './util';

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

        // Anchor the rendered card so styling regressions surface in review.
        await expect(page.locator(SELECTORS.wrapper)).toHaveScreenshot('validation-overlay-warning.png');

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

        await expect(page.locator(SELECTORS.wrapper)).toHaveScreenshot('validation-overlay-multi.png');
    });

    test('renders with dark-theme styling', async ({ page }) => {
        const { url } = toExamplePageUrl('overlays', 'validation-overlay-dark', 'vanilla');
        await gotoExample(page, url);
        await waitForAllChartUpdates(page);

        const overlay = page.locator('.ag-charts-validation-overlay');
        await expect(overlay).toBeVisible();

        await expect(page.locator(SELECTORS.wrapper)).toHaveScreenshot('validation-overlay-dark.png');
    });
});
