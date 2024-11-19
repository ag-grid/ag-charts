import { expect, test } from './fixture';
import { gotoExample, setupIntrinsicAssertions, toExamplePageUrls } from './util';

test.describe('basic charts', () => {
    setupIntrinsicAssertions();

    for (const { framework, url } of toExamplePageUrls('quick-start', 'basic-example')) {
        test.describe(`for ${framework}`, () => {
            test('loads basic chart', async ({ page }) => {
                await gotoExample(page, url);
                await expect(page).toHaveScreenshot('chart.png');
            });
        });
    }
});
