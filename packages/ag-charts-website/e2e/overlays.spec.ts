import { expect, test } from './fixture';
import {
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
    // The example deliberately misconfigures `fillOpacity` to trigger the overlay; ignore the
    // resulting validation console warning so it does not fail the console-clean assertion.
    setupIntrinsicAssertions(test, { ignoreConsolePatterns: ['fillOpacity'] });

    test('renders for a misconfigured option, and Dismiss/Copy are clickable', async ({ page }) => {
        const { url } = toExamplePageUrl('overlays', 'validation-overlay', 'vanilla');
        await gotoExample(page, url);

        const overlay = page.locator('.ag-charts-validation-overlay');
        await expect(overlay).toBeVisible();
        await expect(overlay.locator('.ag-charts-validation-overlay__summary')).toHaveText('AG Charts found 1 warning');

        const copyButton = overlay.locator('.ag-charts-validation-overlay__copy');
        await expect(copyButton).toBeVisible();

        // The overlay container is `pointer-events: none`; only the validation overlay's buttons
        // re-enable it, so a real click here proves that CSS override reaches the button.
        const dismissButton = overlay.locator('.ag-charts-validation-overlay__dismiss');
        await expect(dismissButton).toBeVisible();
        await dismissButton.click();

        await expect(overlay).toBeHidden();
    });
});
