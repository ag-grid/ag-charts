import { expect, test } from './fixture';
import { gotoExample, setupIntrinsicAssertions, toExamplePageUrls } from './util';

test.describe('crosshair', () => {
    setupIntrinsicAssertions();
    const x = 666;
    const y = 400;

    for (const { framework, url } of toExamplePageUrls('axes-crosshairs', 'enabling-crosshairs')) {
        test.describe(`for ${framework}`, () => {
            test('keynav with snapping', async ({ page }) => {
                await gotoExample(page, url);

                await page.mouse.click(x, y, { button: 'left' });
                await expect(page).toHaveScreenshot('snap-enabled-mouse.png');

                await page.keyboard.press('ArrowRight');
                await page.keyboard.press('ArrowRight');
                await expect(page).toHaveScreenshot('snap-enabled-keyboard.png');
            });
        });
    }

    for (const { framework, url } of toExamplePageUrls('axes-crosshairs', 'crosshair-snap')) {
        test.describe(`for ${framework}`, () => {
            test('keynav without snapping', async ({ page }) => {
                await gotoExample(page, url);

                await page.mouse.click(x, y, { button: 'left' });
                await expect(page).toHaveScreenshot('snap-disabled-mouse.png');

                await page.keyboard.press('ArrowRight');
                await page.keyboard.press('ArrowRight');
                await expect(page).toHaveScreenshot('snap-disabled-keyboard.png');
            });
        });
    }
});
