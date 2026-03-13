import { expect, test } from './fixture';
import { gotoExample, setupIntrinsicAssertions, toExamplePageUrl, toExamplePageUrls } from './util';

test.describe('crosshair', () => {
    setupIntrinsicAssertions(test);
    test.describe.configure({ retries: 3 });
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

    test('click', async ({ page }) => {
        const { url } = toExamplePageUrl('financial-charts-configuration', 'default-configuration', 'vanilla');
        await gotoExample(page, url);

        await page.mouse.move(400, 300);
        await expect(page).toHaveScreenshot('crosshair-visible.png');

        await page.mouse.click(400, 300, { button: 'left' });
        await expect(page).toHaveScreenshot('crosshair-visible.png');
    });
});
