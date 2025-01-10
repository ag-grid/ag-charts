import { expect, test } from './fixture';
import { SELECTORS, gotoExample, setupIntrinsicAssertions, toExamplePageUrl } from './util';

test.describe('interactive-tooltip', () => {
    setupIntrinsicAssertions();

    test('hover', async ({ page }) => {
        await gotoExample(page, toExamplePageUrl('tooltips', 'tooltip-interaction', 'vanilla').url);

        await expect(page).toHaveScreenshot('interactive-tooltip-hidden.png');

        await page.mouse.move(400, 150);
        await expect(page).toHaveScreenshot('interactive-tooltip-visible.png');
        await expect(page.locator(SELECTORS.wrapper)).toHaveAttribute('data-scene-renders');
        const expectedRenders: string = await page.locator(SELECTORS.wrapper).getAttribute('data-scene-renders');

        const bbox = await page.getByText('Click here').boundingBox();
        await page.mouse.move(bbox.x, bbox.y);
        await expect(page).toHaveScreenshot('interactive-tooltip-visible.png');
        const actualRenders: string = await page.locator(SELECTORS.wrapper).getAttribute('data-scene-renders');
        expect(actualRenders).toBe(expectedRenders);

        await page.mouse.move(400, 400);
        await expect(page).toHaveScreenshot('interactive-tooltip-moved-down.png');

        await page.mouse.move(20, 20);
        await expect(page).toHaveScreenshot('interactive-tooltip-hidden.png');
    });
});
