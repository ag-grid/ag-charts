import { expect, test } from '@playwright/test';

test.describe(`Angular ${process.env.ANGULAR_VERSION}`, () => {
    test('loads as expected', async ({ page }) => {
        await page.goto('http://localhost:4200/');
        await expect(page).toHaveScreenshot(`angular-${process.env.ANGULAR_VERSION}.png`);
    });
});
