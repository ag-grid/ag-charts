import { test } from './fixture';
import { expectChartScreenshot } from './scene-capture';
import { gotoExample, setupIntrinsicAssertions, toExamplePageUrls, waitForAllChartUpdates } from './util';

test.describe('Combination charts', () => {
    setupIntrinsicAssertions(test);

    for (const { framework, url } of toExamplePageUrls('combination-series', 'combination')) {
        test.describe(`for ${framework}`, () => {
            test('loads combination chart', async ({ page }) => {
                await gotoExample(page, url);

                const controlButtons = await page.locator('.controls-row button').all();
                for (let i = 0; i < controlButtons.length; i++) {
                    await controlButtons[i].click();
                    await waitForAllChartUpdates(page);
                    await expectChartScreenshot(page, page, `combination-${i}.png`);
                }
                for (let i = 0; i < controlButtons.length; i++) {
                    await controlButtons[i].click();
                    await waitForAllChartUpdates(page);
                    await expectChartScreenshot(page, page, `combination-${i}.png`);
                }
            });
        });
    }
});
