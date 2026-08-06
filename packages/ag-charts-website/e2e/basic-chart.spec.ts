import { test } from './fixture';
import { expectChartScreenshot } from './scene-capture';
import { gotoExample, pinNonChromiumToVanilla, setupIntrinsicAssertions, toExamplePageUrls } from './util';

test.describe('basic charts', () => {
    setupIntrinsicAssertions(test);

    for (const { framework, url } of toExamplePageUrls('quick-start', 'basic-example')) {
        test.describe(`for ${framework}`, () => {
            pinNonChromiumToVanilla(test, framework);

            test('loads basic chart', async ({ page }) => {
                await gotoExample(page, url);
                await expectChartScreenshot(page, page, 'chart.png');
            });
        });
    }
});
