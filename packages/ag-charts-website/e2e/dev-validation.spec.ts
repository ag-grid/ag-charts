import { expect, test } from './fixture';
import { gotoExample, setupIntrinsicAssertions, toExamplePageUrl, waitForAllChartUpdates } from './util';

// Anchor the dialog itself (not the chart wrapper) so the whole card is captured rather than
// clipped to the plot area, and the pure-DOM panel keeps the baseline free of canvas anti-aliasing.
const PANEL = '.ag-charts-validation-overlay__panel';

test.describe('validation overlay', () => {
    // The examples deliberately misconfigure options to trigger the overlay; ignore the resulting
    // validation console warnings so they do not fail the console-clean assertion.
    setupIntrinsicAssertions(test, { ignoreConsolePatterns: ['fillOpacity', 'strokeWidth'] });

    // The dev server serves examples over an insecure origin, where the browser withholds
    // navigator.clipboard — so the overlay's Copy button (rendered only when the clipboard is
    // writable) would be absent, unlike the secure-context production site where users see it.
    // Shim a writable clipboard so the overlay matches production; the render-vs-omit branch itself
    // is covered both ways in ag-charts-community's validationOverlay.test.ts.
    test.beforeEach(async ({ page }) => {
        await page.addInitScript(() => {
            if (navigator.clipboard == null) {
                Object.defineProperty(navigator, 'clipboard', {
                    configurable: true,
                    value: { writeText: () => Promise.resolve() },
                });
            }
        });
    });

    test('renders for a misconfigured option, and Dismiss/Copy are clickable', async ({ page }) => {
        const { url } = toExamplePageUrl('dev-validation', 'validation-overlay', 'vanilla');
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
        const { url } = toExamplePageUrl('dev-validation', 'validation-overlay-multi', 'vanilla');
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
        const { url } = toExamplePageUrl('dev-validation', 'validation-overlay-dark', 'vanilla');
        await gotoExample(page, url);
        await waitForAllChartUpdates(page);

        const overlay = page.locator('.ag-charts-validation-overlay');
        await expect(overlay).toBeVisible();

        await expect(overlay.locator(PANEL)).toHaveScreenshot('validation-overlay-dark.png');
    });
});
