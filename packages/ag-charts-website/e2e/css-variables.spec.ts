import { expect, test } from './fixture';
import { SELECTORS, gotoExample, setupIntrinsicAssertions, toExamplePageUrls } from './util';

test.describe('css variables', () => {
    setupIntrinsicAssertions(test);

    for (const { framework, url } of toExamplePageUrls('themes-e2e', 'css-variables').filter(
        (f) => f.framework === 'vanilla'
    )) {
        test.describe(`for ${framework}`, () => {
            test('change value', async ({ page }) => {
                await gotoExample(page, url);
                await expect(page.locator(SELECTORS.canvas)).toHaveScreenshot('initial-value.png');

                // Expect the colours to change
                await page.getByText('Change CSS Variable').click();
                await expect(page.locator(SELECTORS.canvas)).toHaveScreenshot('changed-value.png');

                // Expect the theme to change and keep the new colours
                await page.getByTitle('Change to Default Theme').click();
                await expect(page.locator(SELECTORS.canvas)).toHaveScreenshot('changed-theme.png');

                // Expect the theme to stay the same and the colours to change
                await page.getByTitle('Change to Default Theme').click();
                await page.getByText('Change CSS Variable').click();
                await expect(page.locator(SELECTORS.canvas)).toHaveScreenshot('change-value-same-theme.png');

                // Expect the theme to change and the colours to change
                await page.getByTitle('Change to Paper Theme').click();
                await page.getByText('Change CSS Variable').click();
                await expect(page.locator(SELECTORS.canvas)).toHaveScreenshot('change-value-and-theme.png');
            });
        });
    }
});
