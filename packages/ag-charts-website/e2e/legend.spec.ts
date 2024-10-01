import { expect, test } from '@playwright/test';

import { SELECTORS, gotoExample, setupIntrinsicAssertions, toExamplePageUrls } from './util';

type RenewablesScreenshotsFilename =
    | 'renewables-nothing-highlighted.png'
    | 'renewables-onshore-wind-highlighted.png'
    | 'renewables-offshore-wind-highlighted.png'
    | 'renewables-landfill-gas-highlighted.png';

test.describe('legend', () => {
    setupIntrinsicAssertions();

    for (const { framework, url } of toExamplePageUrls('accessibility-test', 'keyboard-navigation-with-highlight')) {
        test.describe(`for ${framework}`, () => {
            test('mouse hovering updates highlight', async ({ page }) => {
                await gotoExample(page, url);
                const canvasCenter = page.locator(SELECTORS.canvasCenter);

                page.locator(SELECTORS.legendItem0).hover();
                await expect(canvasCenter).toHaveScreenshot('renewables-onshore-wind-highlighted.png');

                page.locator(SELECTORS.legendItem1).hover();
                await expect(canvasCenter).toHaveScreenshot('renewables-offshore-wind-highlighted.png');

                page.locator(SELECTORS.legendItem2).hover();
                await expect(canvasCenter).toHaveScreenshot('renewables-landfill-gas-highlighted.png');
            });

            test('AG-13025 hovering ignored on hidden buttons', async ({ page }) => {
                await gotoExample(page, url);

                const expectedChanged: { dx: number; file: RenewablesScreenshotsFilename }[] = [
                    { dx: 0, file: 'renewables-nothing-highlighted.png' },
                    { dx: 5, file: 'renewables-onshore-wind-highlighted.png' },
                    { dx: 105, file: 'renewables-nothing-highlighted.png' },
                    { dx: 125, file: 'renewables-offshore-wind-highlighted.png' },
                    { dx: 225, file: 'renewables-nothing-highlighted.png' },
                    { dx: 240, file: 'renewables-landfill-gas-highlighted.png' },
                ];
                let i = 0;

                const bbox0 = await (await page.$(SELECTORS.legendItem0)).boundingBox();
                const startX = bbox0.x - 5;
                const y = bbox0.y + bbox0.height / 2;
                for (let dx = 0; dx < 300; dx += 5) {
                    const x = startX + dx;
                    page.mouse.move(x, y);

                    if (expectedChanged[i].dx > dx) i++;
                    const { file } = expectedChanged[i];
                    await expect(page.locator(SELECTORS.canvasCenter)).toHaveScreenshot(file);
                }
            });
        });
    }
});
