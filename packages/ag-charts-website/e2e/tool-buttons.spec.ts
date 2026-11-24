import type { Page } from '@playwright/test';

import { getChartState } from './agE2E';
import { expect, test } from './fixture';
import { expectChartScreenshot } from './scene-capture';
import { SELECTORS, gotoExample, setupIntrinsicAssertions, toExamplePageUrl } from './util';

const PICKER = '.ag-charts-color-picker';
const DIALOG_ACTIONS = '.ag-charts-dialog__actions';

/** Draws a trend line, which leaves it selected with the options toolbar showing. */
async function drawTrendLine(page: Page, url: string) {
    await gotoExample(page, url);

    await page.getByTitle('Trend Lines').click();
    await page.getByText('Trend Line').click();
    await page.click(SELECTORS.canvasProxy, { position: { x: 100, y: 100 } });
    await page.click(SELECTORS.canvasProxy, { position: { x: 200, y: 200 } });
}

async function getLine(page: Page): Promise<Record<string, unknown>> {
    const annotations = ((await getChartState(page)).annotations ?? []) as Record<string, unknown>[];
    expect(annotations).toHaveLength(1);
    return annotations[0];
}

async function openColorPicker(page: Page, url: string) {
    await drawTrendLine(page, url);
    await page.getByTitle('Line Color').click();
}

async function openSettings(page: Page, url: string) {
    await drawTrendLine(page, url);
    await page.getByTitle('Settings').click();
}

async function typeColor(page: Page, color: string) {
    const colorInput = page.getByRole('textbox', { name: 'Color' });
    await colorInput.fill('');
    await colorInput.pressSequentially(color);
    // The field commits on Enter, which with the buttons shown also closes the picker, so commit with a blur instead.
    await colorInput.blur();
}

test.describe('annotation tool buttons (showToolButtons)', () => {
    setupIntrinsicAssertions(test);

    const { url } = toExamplePageUrl('annotations-e2e', 'tool-buttons', 'vanilla');

    test.describe('colour picker', () => {
        test('shows Cancel and Apply, with Apply disabled until the colour changes', async ({ page }) => {
            await openColorPicker(page, url);
            const apply = page.locator(PICKER).getByRole('button', { name: 'Apply' });
            const cancel = page.locator(PICKER).getByRole('button', { name: 'Cancel' });

            await expect(cancel).toBeEnabled();
            await expect(apply).toHaveAttribute('aria-disabled', 'true');
            await expectChartScreenshot(page, page, 'tool-buttons-picker-unchanged.png', { animations: 'disabled' });

            await typeColor(page, '#00ff00');
            await expect(apply).not.toHaveAttribute('aria-disabled', 'true');
            await expectChartScreenshot(page, page, 'tool-buttons-picker-changed.png', { animations: 'disabled' });
        });

        test('Apply keeps the colour and closes the picker', async ({ page }) => {
            await openColorPicker(page, url);

            await typeColor(page, '#00ff00');
            await page.locator(PICKER).getByRole('button', { name: 'Apply' }).click();

            await expect(page.locator(PICKER)).toBeHidden();
            expect((await getLine(page)).stroke).toMatch(/^#00ff00/i);
        });

        test('Cancel discards the colour and closes the picker', async ({ page }) => {
            await openColorPicker(page, url);
            const before = (await getLine(page)).stroke;

            await typeColor(page, '#00ff00');
            await expect.poll(async () => (await getLine(page)).stroke).toMatch(/^#00ff00/i);
            await page.locator(PICKER).getByRole('button', { name: 'Cancel' }).click();

            await expect(page.locator(PICKER)).toBeHidden();
            expect((await getLine(page)).stroke).toEqual(before);
            await expectChartScreenshot(page, page, 'tool-buttons-picker-cancelled.png', { animations: 'disabled' });
        });

        test('Escape cancels and Enter applies', async ({ page }) => {
            await openColorPicker(page, url);
            const before = (await getLine(page)).stroke;

            await typeColor(page, '#00ff00');
            await page.getByRole('slider', { name: 'Palette' }).focus();
            await page.keyboard.press('Escape');
            await expect(page.locator(PICKER)).toBeHidden();
            expect((await getLine(page)).stroke).toEqual(before);

            await page.getByTitle('Line Color').click();
            await typeColor(page, '#ff0000');
            await page.getByRole('slider', { name: 'Palette' }).focus();
            await page.keyboard.press('Enter');
            await expect(page.locator(PICKER)).toBeHidden();
            expect((await getLine(page)).stroke).toMatch(/^#ff0000/i);
        });
    });

    test.describe('settings dialog', () => {
        const dialog = (page: Page) => page.getByRole('dialog');

        test('shows Cancel and Apply, with Apply disabled until a setting changes', async ({ page }) => {
            await openSettings(page, url);
            const apply = dialog(page).getByRole('button', { name: 'Apply' });

            await expect(dialog(page).getByRole('button', { name: 'Cancel' })).toBeEnabled();
            await expect(apply).toHaveAttribute('aria-disabled', 'true');
            await expect(page.locator(`${DIALOG_ACTIONS} button`)).toHaveCount(2);
            await expectChartScreenshot(page, page, 'tool-buttons-dialog-unchanged.png', { animations: 'disabled' });

            await page.getByRole('radio', { name: 'Long-dashed' }).click();
            await expect(apply).not.toHaveAttribute('aria-disabled', 'true');
            await expectChartScreenshot(page, page, 'tool-buttons-dialog-changed.png', { animations: 'disabled' });
        });

        test('Apply keeps every change and closes the dialog', async ({ page }) => {
            await openSettings(page, url);
            const before = await getLine(page);

            await page.getByRole('radio', { name: 'Long-dashed' }).click();
            await dialog(page).getByRole('button', { name: 'Apply' }).click();

            await expect(dialog(page)).toBeHidden();
            expect((await getLine(page)).lineDash).not.toEqual(before.lineDash);
        });

        test('Cancel, Escape and the close button discard every change', async ({ page }) => {
            await openSettings(page, url);
            const before = await getLine(page);

            await page.getByRole('radio', { name: 'Long-dashed' }).click();
            await dialog(page).getByRole('button', { name: 'Cancel' }).click();
            await expect(dialog(page)).toBeHidden();
            expect(await getLine(page)).toEqual(before);

            await page.getByTitle('Settings').click();
            await page.getByRole('radio', { name: 'Long-dashed' }).click();
            await page.getByRole('radio', { name: 'Long-dashed' }).press('Escape');
            await expect(dialog(page)).toBeHidden();
            expect(await getLine(page)).toEqual(before);

            await page.getByTitle('Settings').click();
            await page.getByRole('radio', { name: 'Long-dashed' }).click();
            await dialog(page).getByRole('button', { name: 'Close' }).click();
            await expect(dialog(page)).toBeHidden();
            expect(await getLine(page)).toEqual(before);
        });

        test('a colour picked in its picker is applied or cancelled with the dialog', async ({ page }) => {
            await openSettings(page, url);
            const before = await getLine(page);

            await dialog(page)
                .getByRole('tabpanel', { name: 'Line' })
                .getByRole('button', { name: 'Line Color' })
                .click();
            await typeColor(page, '#00ff00');
            await page.locator(PICKER).getByRole('button', { name: 'Apply' }).click();
            await expect(page.locator(PICKER)).toBeHidden();
            await expect(dialog(page)).toBeVisible();
            await expectChartScreenshot(page, page, 'tool-buttons-dialog-colour-picked.png', {
                animations: 'disabled',
            });

            await dialog(page).getByRole('button', { name: 'Cancel' }).click();
            await expect(dialog(page)).toBeHidden();
            expect(await getLine(page)).toEqual(before);
        });
    });
});
