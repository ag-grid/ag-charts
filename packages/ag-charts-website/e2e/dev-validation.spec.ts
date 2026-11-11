import { expect, test } from './fixture';
import { gotoExample, setupIntrinsicAssertions, toExamplePageUrl, waitForAllChartUpdates } from './util';

// Anchor the dialog itself (not the chart wrapper) so the whole card is captured rather than
// clipped to the plot area, and the pure-DOM panel keeps the baseline free of canvas anti-aliasing.
const PANEL = '.ag-charts-validation-overlay__panel';

test.describe('validation overlay', () => {
    // The examples deliberately misconfigure options to trigger the overlay.
    setupIntrinsicAssertions(test, { ignoreConsolePatterns: ['fillOpacity', 'strokeWidth'] });

    // The dev server's insecure origin withholds navigator.clipboard, so the overlay would omit its
    // Copy button; shim a writable clipboard so the baseline matches the production site.
    test.beforeEach(async ({ page }) => {
        await page.addInitScript(() => {
            if (typeof navigator.clipboard === 'undefined') {
                Object.defineProperty(navigator, 'clipboard', {
                    configurable: true,
                    value: { writeText: () => Promise.resolve() },
                });
            }
        });
    });

    test('renders multiple warnings in a single card, and Dismiss/Copy are clickable', async ({ page }) => {
        const { url } = toExamplePageUrl('dev-validation', 'validation-overlay-multi', 'vanilla');
        await gotoExample(page, url);
        await waitForAllChartUpdates(page);

        const overlay = page.locator('.ag-charts-validation-overlay');
        await expect(overlay).toBeVisible();
        await expect(overlay.locator('.ag-charts-validation-overlay__summary')).toHaveText(
            'AG Charts found 2 warnings'
        );

        await expect(overlay.locator(PANEL)).toHaveScreenshot('validation-overlay-multi.png');

        const copyButton = overlay.locator('.ag-charts-validation-overlay__copy');
        await expect(copyButton).toBeVisible();

        // The overlay wrapper is `pointer-events: none`; only the card and its buttons re-enable it,
        // so a real click here proves that CSS override reaches the button.
        const dismissButton = overlay.locator('.ag-charts-validation-overlay__dismiss');
        await expect(dismissButton).toBeVisible();
        await dismissButton.click();

        await expect(overlay).toBeHidden();
    });

    test('Dismiss is a named button that the keyboard can activate', async ({ page }) => {
        const { url } = toExamplePageUrl('dev-validation', 'validation-overlay-multi', 'vanilla');
        await gotoExample(page, url);
        await waitForAllChartUpdates(page);

        const overlay = page.locator('.ag-charts-validation-overlay');
        const dismissButton = overlay.getByRole('button', { name: 'Dismiss' });
        await expect(dismissButton).toHaveAttribute('title', 'Dismiss');

        await dismissButton.focus();
        await page.keyboard.press('Enter');

        await expect(overlay).toBeHidden();
    });

    test('Copy reports success once the diagnostics are written', async ({ page }) => {
        const { url } = toExamplePageUrl('dev-validation', 'validation-overlay-multi', 'vanilla');
        await gotoExample(page, url);
        await waitForAllChartUpdates(page);

        const copyButton = page.locator('.ag-charts-validation-overlay__copy');
        await expect(copyButton).toHaveAccessibleName('Copy');
        await copyButton.click();

        await expect(copyButton).toHaveText('Copied');
    });

    // The chart's context menu skips a right-click whose default was already prevented, so this is what keeps it
    // from opening over the dialog.
    test('a right-click on the panel is marked as handled', async ({ page }) => {
        const { url } = toExamplePageUrl('dev-validation', 'validation-overlay-multi', 'vanilla');
        await gotoExample(page, url);
        await waitForAllChartUpdates(page);

        await page.evaluate(() => {
            document.addEventListener('contextmenu', (event) => {
                document.body.dataset.contextmenuDefaultPrevented = String(event.defaultPrevented);
            });
        });
        await page.locator(PANEL).click({ button: 'right' });

        await expect(page.locator('body')).toHaveAttribute('data-contextmenu-default-prevented', 'true');
    });
});
