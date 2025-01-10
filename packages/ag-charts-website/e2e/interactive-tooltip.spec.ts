import { expect, test } from './fixture';
import { gotoExample, setupIntrinsicAssertions, toExamplePageUrl } from './util';

test.describe('interactive-tooltip', () => {
    setupIntrinsicAssertions();

    test('hover', async ({ page }) => {
        await gotoExample(page, toExamplePageUrl('tooltips', 'tooltip-interaction', 'vanilla').url);

        await expect(page).toHaveScreenshot('interactive-tooltip-hidden.png');

        await page.mouse.move(400, 150);
        await expect(page).toHaveScreenshot('interactive-tooltip-visible.png');

        const bbox = await page.getByText('Click here').boundingBox();
        await page.mouse.move(bbox.x, bbox.y);
        await expect(page).toHaveScreenshot('interactive-tooltip-visible.png');

        await page.mouse.move(400, 400);
        await expect(page).toHaveScreenshot('interactive-tooltip-moved-down.png');

        await page.mouse.move(20, 20);
        await expect(page).toHaveScreenshot('interactive-tooltip-hidden.png');
    });
});
