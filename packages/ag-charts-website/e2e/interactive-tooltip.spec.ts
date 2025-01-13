import { Page } from '@playwright/test';

import { expect, test } from './fixture';
import { SELECTORS, gotoExample, setupIntrinsicAssertions, toExamplePageUrl } from './util';

async function getSceneRenders(page: Page): Promise<string> {
    await expect(page.locator(SELECTORS.wrapper)).toHaveAttribute('data-scene-renders');
    return await page.locator(SELECTORS.wrapper).getAttribute('data-scene-renders');
}

test.describe('interactive-tooltip', () => {
    setupIntrinsicAssertions();

    test('hover 1 step', async ({ page }) => {
        await gotoExample(page, toExamplePageUrl('tooltips', 'tooltip-interaction', 'vanilla').url);

        await expect(page).toHaveScreenshot('interactive-tooltip-hidden.png');

        await page.mouse.move(400, 150);
        await expect(page).toHaveScreenshot('interactive-tooltip-visible.png');
        const expectedRenders: string = await getSceneRenders(page);

        const bbox = await page.getByText('Click here').boundingBox();
        await page.mouse.move(bbox.x, bbox.y);
        await expect(page).toHaveScreenshot('interactive-tooltip-visible.png');
        const actualRenders: string = await getSceneRenders(page);
        expect(actualRenders).toBe(expectedRenders);

        await page.mouse.move(400, 400);
        await expect(page).toHaveScreenshot('interactive-tooltip-moved-down.png');

        await page.mouse.move(20, 20);
        await expect(page).toHaveScreenshot('interactive-tooltip-hidden.png');
    });

    test('hover 4 steps', async ({ page }) => {
        await gotoExample(page, toExamplePageUrl('tooltips', 'tooltip-interaction', 'vanilla').url);

        await expect(page).toHaveScreenshot('interactive-tooltip-hidden.png');

        await page.mouse.move(400, 150);
        await expect(page).toHaveScreenshot('interactive-tooltip-visible.png');
        const expectedRenders: string = await getSceneRenders(page);

        const bbox = await page.getByText('Click here').boundingBox();
        await page.mouse.move(bbox.x, bbox.y, { steps: 4 });
        await expect(page).toHaveScreenshot('interactive-tooltip-visible.png');
        const actualRenders: string = await getSceneRenders(page);
        expect(actualRenders).toBe(expectedRenders);

        await page.mouse.move(400, 400);
        await expect(page).toHaveScreenshot('interactive-tooltip-moved-down.png');

        await page.mouse.move(20, 20);
        await expect(page).toHaveScreenshot('interactive-tooltip-hidden.png');
    });
});
