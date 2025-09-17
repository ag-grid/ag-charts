import { expect, test } from './fixture';
import { SELECTORS, gotoExample, setupIntrinsicAssertions, toExamplePageUrl, waitForAllChartUpdates } from './util';

test.describe('security', () => {
    setupIntrinsicAssertions(test);

    test.describe('CSP', () => {
        test.describe('basic-csp example', () => {
            const { url } = toExamplePageUrl('security-test', 'basic-csp', 'vanilla');

            test('should load successfully', async ({ page }) => {
                await gotoExample(page, url);

                const tooltipLocator = page.locator(SELECTORS.tooltip);

                await page.keyboard.press('Tab');
                await waitForAllChartUpdates(page);
                await expect(tooltipLocator).toHaveCount(1);
                expect(await tooltipLocator.allTextContents()).toMatchObject(['Jan 162000']);

                await expect(page).toHaveScreenshot('basic-csp.png');
            });
        });

        test.describe('complex-csp example', () => {
            const { url } = toExamplePageUrl('security-test', 'complex-csp', 'vanilla');

            test('should load successfully', async ({ page }) => {
                await gotoExample(page, url);

                const tooltipLocator = page.locator(SELECTORS.tooltip);

                await page.keyboard.press('Tab');
                await waitForAllChartUpdates(page);
                await expect(tooltipLocator).toHaveCount(1);
                expect(await tooltipLocator.allTextContents()).toMatchObject(['Jan 162000']);

                await expect(page).toHaveScreenshot('complex-csp.png');
            });
        });
    });
});
