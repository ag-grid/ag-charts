import { expect, test } from './fixture';
import { SELECTORS, gotoExample, setupIntrinsicAssertions, toExamplePageUrls } from './util';

test.describe('css variables', () => {
    setupIntrinsicAssertions(test);

    for (const { framework, url } of toExamplePageUrls('themes-test', 'css-variables')) {
        test.describe(`for ${framework}`, () => {
            test('initial value', async ({ page }) => {
                await gotoExample(page, url);
                await expect(page.locator(SELECTORS.canvas)).toHaveScreenshot('initial-value.png');
            });
        });
    }
});
