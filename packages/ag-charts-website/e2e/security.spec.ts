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
    });
});
