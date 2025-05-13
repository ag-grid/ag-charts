import { expect, test } from './fixture';
import { gotoExample, setupIntrinsicAssertions, toExamplePageUrls } from './util';

test.describe('Combination charts', () => {
    setupIntrinsicAssertions();

    for (const { framework, url } of toExamplePageUrls('combination-series', 'combination')) {
        test.describe(`for ${framework}`, () => {
            test('loads combination chart', async ({ page }) => {
                await gotoExample(page, url);

                const controlButtons = await page.locator('.controls-row button').all();
                await expect(page).toHaveScreenshot(`combination-${controlButtons.length - 1}.png`);

                for (let i = 0; i < controlButtons.length; i++) {
                    await controlButtons[i].click();
                    await expect(page).toHaveScreenshot(`combination-${i}.png`);
                }
                for (let i = 0; i < controlButtons.length; i++) {
                    await controlButtons[i].click();
                    await expect(page).toHaveScreenshot(`combination-${i}.png`);
                }
            });
        });
    }
});
