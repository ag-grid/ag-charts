import { expect, test } from './fixture';
import { SELECTORS, gotoExample, setupIntrinsicAssertions, toExamplePageUrls } from './util';

test.describe('Combination charts', () => {
    setupIntrinsicAssertions();

    for (const { framework, url } of toExamplePageUrls('combination-series', 'combination')) {
        test.describe(`for ${framework}`, () => {
            test('loads combination chart', async ({ page }) => {
                await gotoExample(page, url);
                await expect(page).toHaveScreenshot('combination.png');

                const controlButtons = await page.locator('.controls-row button').all();
                await controlButtons[0].click();
                await expect(page).toHaveScreenshot('combination-2.png');
                await controlButtons[1].click();
                await expect(page).toHaveScreenshot('combination.png');
                await controlButtons[0].click();
                await expect(page).toHaveScreenshot('combination-2.png');
                await controlButtons[1].click();
                await expect(page).toHaveScreenshot('combination.png');
            });
        });
    }
});
