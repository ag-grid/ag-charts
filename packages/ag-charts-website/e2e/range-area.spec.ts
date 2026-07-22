import { test } from './fixture';
import { expectChartScreenshot } from './scene-capture';
import { SELECTORS, gotoExample, setupIntrinsicAssertions, toExamplePageUrl } from './util';

test.describe('range-area', () => {
    setupIntrinsicAssertions(test);

    test.describe('AG-9002 share-low-high-match', () => {
        test.beforeEach(async ({ page }) => {
            const { url } = toExamplePageUrl('range-area-series-e2e', 'shared-low-high-match', 'vanilla');
            await gotoExample(page, url);
        });

        // Check that the initialisation of the two charts match
        test.describe('init', () => {
            test('shared', async ({ page }) => {
                await page.getByText('Shared').click();
            });
            test('lowhigh', async ({ page }) => {
                await page.getByText('Low/High').click();
            });
            test.afterEach(async ({ page }) => {
                const canvas = page.locator(SELECTORS.canvasCenter);
                await expectChartScreenshot(page, canvas, 'AG-9002-share-low-high-match-init.png');
            });
        });
    });
});
