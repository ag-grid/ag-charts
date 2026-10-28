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
    test('moving a chart out of and back into a shadow root keeps a single CSS-variable watcher', async ({ page }) => {
        // Each watcher adds a `transitionend` listener, so counting calls counts refreshes.
        await page.addInitScript(() => {
            const win = window as unknown as { transitionEndCalls: number };
            win.transitionEndCalls = 0;
            const add: EventTarget['addEventListener'] = Reflect.get(EventTarget.prototype, 'addEventListener');
            EventTarget.prototype.addEventListener = function (type, listener, options) {
                if (type !== 'transitionend' || typeof listener !== 'function') {
                    return add.call(this, type, listener, options);
                }
                return add.call(
                    this,
                    type,
                    (event) => {
                        win.transitionEndCalls++;
                        return listener.call(this, event);
                    },
                    options
                );
            };
        });

        const { url } = toExamplePageUrl('themes-e2e', 'css-variables-shadow-root', 'vanilla');
        await gotoExample(page, url);

        const countWatchers = () =>
            page.evaluate(
                () => document.getElementById('shadowHost')!.shadowRoot!.querySelectorAll('[data-variable-name]').length
            );
        const countRefreshesPerChange = async () => {
            const before = await page.evaluate(() => (window as any).transitionEndCalls as number);
            await page.getByText('Change CSS variable').click();
            await expect
                .poll(() => page.evaluate(() => (window as any).transitionEndCalls as number))
                .toBeGreaterThan(before);
            // Let any further transition of the same change land before reading the total.
            await page.evaluate(
                () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
            );
            return (await page.evaluate(() => (window as any).transitionEndCalls as number)) - before;
        };

        // The chart starts in the light DOM, where its watchers do not sit in the shadow root.
        expect(await countWatchers()).toBe(0);

        await page.getByText('Move to shadow root').click();
        await expect(page.locator('#shadowHost canvas')).toBeVisible();
        await waitForAllChartUpdates(page);
        expect(await countWatchers()).toBe(1);
        expect(await countRefreshesPerChange()).toBe(1);

        await page.getByText('Move to light DOM').click();
        await expect(page.locator('#myChart canvas')).toBeVisible();
        expect(await countWatchers()).toBe(0);

        await page.getByText('Move to shadow root').click();
        await expect(page.locator('#shadowHost canvas')).toBeVisible();
        await waitForAllChartUpdates(page);
        expect(await countWatchers()).toBe(1);
        expect(await countRefreshesPerChange()).toBe(1);
    });
});
