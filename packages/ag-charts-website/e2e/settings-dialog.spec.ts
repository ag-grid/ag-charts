import type { Page } from '@playwright/test';

import { expect, test } from './fixture';
import { SELECTORS, gotoExample, setupIntrinsicAssertions, toExamplePageUrl } from './util';

/** Draws a trend line and opens its settings dialog with a pointer click on the toolbar's Settings button. */
async function openTrendLineSettings(page: Page, url: string) {
    await gotoExample(page, url);

    await page.getByTitle('Trend Lines').click();
    await page.getByText('Trend Line').click();
    await page.click(SELECTORS.canvasProxy, { position: { x: 100, y: 100 } });
    await page.click(SELECTORS.canvasProxy, { position: { x: 200, y: 200 } });
    await page.getByTitle('Settings').click();
}

test.describe('settings dialog', () => {
    setupIntrinsicAssertions(test);

    const { url } = toExamplePageUrl('financial-charts-e2e', 'toolbar', 'vanilla');

    test('exposes its controls by role and accessible name', async ({ page }) => {
        await openTrendLineSettings(page, url);

        await expect(page.getByRole('tablist', { name: 'Settings' })).toBeVisible();
        await expect(page.getByRole('tab', { name: 'Line' })).toHaveAttribute('aria-selected', 'true');
        await expect(page.getByRole('tab', { name: 'Text' })).toHaveAttribute('aria-selected', 'false');
        await expect(page.getByRole('tabpanel', { name: 'Line' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Close' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Text Color' })).toBeVisible();
        await expect(page.getByRole('combobox', { name: 'Line Weight' })).toBeVisible();
        await expect(page.getByRole('radiogroup', { name: 'Dash' })).toBeVisible();
        await expect(page.getByRole('radio', { name: 'Solid' })).toHaveAttribute('aria-checked', 'true');
        await expect(page.getByRole('radio', { name: 'Long-dashed' })).toHaveAttribute('aria-checked', 'false');
        await expect(page.getByRole('switch', { name: 'Extend line start' })).not.toBeChecked();
        await expect(page.getByRole('switch', { name: 'Extend line end' })).not.toBeChecked();
    });

    test('tabs: arrow keys move focus, Enter selects, and the tab order keeps the last focused tab', async ({
        page,
    }) => {
        await openTrendLineSettings(page, url);
        const lineTab = page.getByRole('tab', { name: 'Line' });
        const textTab = page.getByRole('tab', { name: 'Text' });

        await expect(lineTab).toBeFocused();

        await page.keyboard.press('ArrowRight');
        await expect(textTab).toBeFocused();
        await expect(lineTab).toHaveAttribute('aria-selected', 'true');

        await page.keyboard.press('ArrowRight');
        await expect(textTab).toBeFocused();

        await page.keyboard.press('Enter');
        await expect(textTab).toHaveAttribute('aria-selected', 'true');
        await expect(lineTab).toHaveAttribute('aria-selected', 'false');
        await expect(page.getByRole('tabpanel', { name: 'Text' })).toBeVisible();
        await expect(page.getByPlaceholder('Add Text')).toBeFocused();

        await page.keyboard.press('Shift+Tab');
        await expect(page.getByRole('button', { name: 'Close' })).toBeFocused();
        await page.keyboard.press('Shift+Tab');
        await expect(textTab).toBeFocused();

        await page.keyboard.press('ArrowLeft');
        await expect(lineTab).toBeFocused();
        await page.keyboard.press('ArrowLeft');
        await expect(lineTab).toBeFocused();
    });

    test('radio group: arrow keys move focus, Space checks, and the tab order keeps the last focused radio', async ({
        page,
    }) => {
        await openTrendLineSettings(page, url);
        const solid = page.getByRole('radio', { name: 'Solid' });
        const longDashed = page.getByRole('radio', { name: 'Long-dashed' });
        const shortDashed = page.getByRole('radio', { name: 'Short-dashed' });

        await solid.focus();
        await page.keyboard.press('ArrowRight');
        await expect(longDashed).toBeFocused();
        await expect(solid).toHaveAttribute('aria-checked', 'true');
        await expect(longDashed).toHaveAttribute('aria-checked', 'false');

        await page.keyboard.press('Space');
        await expect(longDashed).toHaveAttribute('aria-checked', 'true');
        await expect(solid).toHaveAttribute('aria-checked', 'false');

        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('ArrowRight');
        await expect(shortDashed).toBeFocused();

        await page.keyboard.press('Shift+Tab');
        await expect(shortDashed).not.toBeFocused();
        await page.keyboard.press('Tab');
        await expect(shortDashed).toBeFocused();
    });

    test('checkbox: Enter and Space toggle it', async ({ page }) => {
        await openTrendLineSettings(page, url);
        const extendStart = page.getByRole('switch', { name: 'Extend line start' });

        await extendStart.focus();
        await page.keyboard.press('Enter');
        await expect(extendStart).toBeChecked();
        await page.keyboard.press('Space');
        await expect(extendStart).not.toBeChecked();
    });

    test('Escape closes the dialog and returns focus to the Settings button', async ({ page }) => {
        await openTrendLineSettings(page, url);
        await expect(page.getByRole('tab', { name: 'Line' })).toBeFocused();

        await page.keyboard.press('Escape');
        await expect(page.getByRole('tablist', { name: 'Settings' })).toHaveCount(0);
        await expect(page.getByTitle('Settings')).toBeFocused();
    });

    test('the close button closes the dialog', async ({ page }) => {
        await openTrendLineSettings(page, url);

        await page.getByRole('button', { name: 'Close' }).click();
        await expect(page.getByRole('tablist', { name: 'Settings' })).toHaveCount(0);
    });

    test.describe('right-to-left', () => {
        const { url: rtlUrl } = toExamplePageUrl('rtl-e2e', 'rtl-financial-chart', 'vanilla');

        test('tabs: the arrow keys follow the reading direction', async ({ page }) => {
            await openTrendLineSettings(page, rtlUrl);
            const lineTab = page.getByRole('tab', { name: 'Line' });
            const textTab = page.getByRole('tab', { name: 'Text' });
            await expect(lineTab).toBeFocused();

            await page.keyboard.press('ArrowLeft');
            await expect(textTab).toBeFocused();
            await page.keyboard.press('ArrowRight');
            await expect(lineTab).toBeFocused();
            await page.keyboard.press('ArrowRight');
            await expect(lineTab).toBeFocused();
        });

        test('radio group: the arrow keys follow the reading direction', async ({ page }) => {
            await openTrendLineSettings(page, rtlUrl);
            const solid = page.getByRole('radio', { name: 'Solid' });
            const longDashed = page.getByRole('radio', { name: 'Long-dashed' });

            await solid.focus();
            await page.keyboard.press('ArrowLeft');
            await expect(longDashed).toBeFocused();
            await page.keyboard.press('ArrowRight');
            await expect(solid).toBeFocused();
        });
    });
});
