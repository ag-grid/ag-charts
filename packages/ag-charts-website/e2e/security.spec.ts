import { expect, test } from './fixture';
import { expectChartScreenshot } from './scene-capture';
import { SELECTORS, gotoExample, setupIntrinsicAssertions, toExamplePageUrl, waitForAllChartUpdates } from './util';

test.describe('security', () => {
    setupIntrinsicAssertions(test);

    test.describe('CSP', () => {
        test.describe('basic-csp example', () => {
            const { url } = toExamplePageUrl('security-e2e', 'basic-csp', 'vanilla');

            test('should load successfully', async ({ page }) => {
                await gotoExample(page, url);

                const tooltipLocator = page.locator(SELECTORS.tooltip);

                await page.keyboard.press('Tab');
                await waitForAllChartUpdates(page);
                await expect(tooltipLocator).toHaveCount(1);
                expect(await tooltipLocator.allTextContents()).toMatchObject(['Jan 162000']);

                await expectChartScreenshot(page, page, 'basic-csp.png');
            });
        });

        test.describe('complex-csp example', () => {
            const { url } = toExamplePageUrl('security-e2e', 'complex-csp', 'vanilla');

            test('should load successfully', async ({ page }) => {
                await gotoExample(page, url);

                const tooltipLocator = page.locator(SELECTORS.tooltip);

                await page.keyboard.press('Tab');
                await waitForAllChartUpdates(page);
                await expect(tooltipLocator).toHaveCount(1);
                expect(await tooltipLocator.allTextContents()).toMatchObject(['Jan 162000']);

                await expectChartScreenshot(page, page, 'complex-csp.png');
            });
        });

        test.describe('strict-csp-icons example', () => {
            const { url } = toExamplePageUrl('security-e2e', 'strict-csp-icons', 'vanilla');

            test('renders toolbar and context-menu icons under a strict CSP', async ({ page }) => {
                await gotoExample(page, url);
                await waitForAllChartUpdates(page);

                // zoom.buttons.visible: 'always' keeps the zoom toolbar and its icons mounted from load. The
                // strict `img-src 'self' data:` policy must permit every icon the toolbar and context menu
                // load; a blocked icon surfaces as a console error and fails the intrinsic assertions.
                await expect(page.locator('.ag-charts-toolbar__icon').first()).toBeVisible();
                await expectChartScreenshot(page, page, 'strict-csp-icons-toolbar.png', { animations: 'disabled' });

                await page.locator(SELECTORS.canvasCenter).click({ button: 'right' });
                await expect(page.locator('.ag-charts-context-menu')).toBeVisible();
                await expectChartScreenshot(page, page, 'strict-csp-icons-context-menu.png', {
                    animations: 'disabled',
                });
            });
        });

        test.describe('csp-css-variables example', () => {
            const { url } = toExamplePageUrl('security-e2e', 'csp-css-variables', 'vanilla');

            test('watches a CSS variable under a nonce-only style-src', async ({ page }) => {
                await gotoExample(page, url);
                await waitForAllChartUpdates(page);

                // The watcher injects an `@property` <style> element per variable. Under a nonce-only
                // `style-src` an un-nonced element is blocked, which surfaces as a console error and
                // fails the intrinsic assertions, and leaves the chart unable to see later changes.
                const watcher = page.locator('style[data-variable-name="--my-brand-colour"]');
                await expect(watcher).toHaveCount(1);
                // Read the IDL property, not the attribute: browsers empty the `nonce` content
                // attribute once the element is inserted, to stop it being exfiltrated via CSS.
                expect(await watcher.evaluate((el: HTMLStyleElement) => el.nonce)).toBe('9f3c21a8');

                await expectChartScreenshot(page, page.locator(SELECTORS.canvas), 'csp-css-variables-initial.png');

                await page.getByText('Change CSS Variable').click();
                await waitForAllChartUpdates(page);
                await expectChartScreenshot(page, page.locator(SELECTORS.canvas), 'csp-css-variables-changed.png');
            });
        });
    });
});
