import { expect, test } from './fixture';
import { expectChartScreenshot } from './scene-capture';
import {
    SELECTORS,
    gotoExample,
    setupIntrinsicAssertions,
    toExamplePageUrl,
    toExamplePageUrls,
    waitForAllChartUpdates,
} from './util';

test.describe('css variables', () => {
    setupIntrinsicAssertions(test);

    for (const { framework, url } of toExamplePageUrls('themes-e2e', 'css-variables').filter(
        (f) => f.framework === 'vanilla'
    )) {
        test.describe(`for ${framework}`, () => {
            test('change value', async ({ page }) => {
                await gotoExample(page, url);
                await expectChartScreenshot(page, page.locator(SELECTORS.canvas), 'initial-value.png');

                await page.getByText('Change CSS Variable').click();
                await expectChartScreenshot(page, page.locator(SELECTORS.canvas), 'changed-value.png');

                await page.getByTitle('Change to Default Theme').click();
                await expectChartScreenshot(page, page.locator(SELECTORS.canvas), 'changed-theme.png');

                await page.getByTitle('Change to Default Theme').click();
                await page.getByText('Change CSS Variable').click();
                await expectChartScreenshot(page, page.locator(SELECTORS.canvas), 'change-value-same-theme.png');

                await page.getByTitle('Change to Paper Theme').click();
                await page.getByText('Change CSS Variable').click();
                await expectChartScreenshot(page, page.locator(SELECTORS.canvas), 'change-value-and-theme.png');
            });
        });
    }

    // The dark-mode example rebinds `--chart-*` CSS variables by toggling a `body` class; the charts
    // must re-resolve the theme and repaint without an explicit `chart.update()` call.
    test('dark mode toggles chart colours via CSS variables without chart.update()', async ({ page }) => {
        const { url } = toExamplePageUrl('themes-e2e', 'css-variables-dark-mode', 'vanilla');
        await gotoExample(page, url);

        const charts = page.locator('#charts');
        await expect(page.locator('#status')).toContainText('Mode: Light');
        await expectChartScreenshot(page, charts, 'css-variables-dark-mode-light.png');

        await page.getByText('Toggle Dark Mode').click();
        await waitForAllChartUpdates(page);
        await expect(page.locator('#status')).toContainText('Mode: Dark');
        await expectChartScreenshot(page, charts, 'css-variables-dark-mode-dark.png');

        // Toggling back must re-resolve the CSS variables and repaint to the original light appearance,
        // still without an explicit chart.update().
        await page.getByText('Toggle Dark Mode').click();
        await waitForAllChartUpdates(page);
        await expect(page.locator('#status')).toContainText('Mode: Light');
        await expectChartScreenshot(page, charts, 'css-variables-dark-mode-light-restored.png');
    });

    // A theme param blends `accentColor` onto a `var(--onto-color)` via `ontoColor`. Changing the CSS
    // variable must re-resolve and repaint the bars without an explicit `chart.update()` call.
    test('ontoColor blends onto a CSS variable and reacts to its changes', async ({ page }) => {
        const { url } = toExamplePageUrl('themes-e2e', 'css-variables-onto-color', 'vanilla');
        await gotoExample(page, url);
        await expectChartScreenshot(page, page.locator(SELECTORS.canvas), 'onto-color-initial.png');

        await page.getByText('Change CSS Variable').click();
        await waitForAllChartUpdates(page);
        await expectChartScreenshot(page, page.locator(SELECTORS.canvas), 'onto-color-changed.png');
    });
});
