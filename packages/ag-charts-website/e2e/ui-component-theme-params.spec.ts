import type { Locator, Page } from '@playwright/test';

import { expect, test } from './fixture';
import { SELECTORS, canvasToPageTransformer, gotoExample, setupIntrinsicAssertions, toExamplePageUrl } from './util';

function computed(locator: Locator, property: string, pseudo?: string) {
    return locator.evaluate((el, [prop, pseudoElt]) => getComputedStyle(el, pseudoElt).getPropertyValue(prop).trim(), [
        property,
        pseudo ?? null,
    ] as const);
}

function closestPopover(locator: Locator) {
    return locator.locator('xpath=ancestor-or-self::*[contains(@class, "ag-charts-popover")][1]');
}

async function addAndSelectTextAnnotation(page: Page) {
    await page.getByTitle('Text Annotations').click();
    await page.getByText('Text', { exact: true }).click();
    await page.hover(SELECTORS.canvasProxy, { position: { x: 200, y: 200 } });
    await page.click(SELECTORS.canvasProxy, { position: { x: 200, y: 200 } });

    const textarea = page.locator('.ag-charts-text-input__textarea');
    await expect(textarea).toBeVisible();
    const placeholderColor = await computed(textarea, 'color', '::before');

    await page.keyboard.type('Hello');
    await page.keyboard.press('Enter');

    await page.hover(SELECTORS.canvasProxy, { position: { x: 210, y: 190 } });
    await page.click(SELECTORS.canvasProxy, { position: { x: 210, y: 190 } });
    await expect(page.locator('.ag-charts-floating-toolbar__drag-handle')).toBeVisible();

    return { placeholderColor };
}

async function openColorPicker(page: Page) {
    await page.getByTitle('Text Color').click();
    const picker = page.locator('.ag-charts-color-picker');
    await expect(picker).toBeVisible();
    return picker;
}

test.describe('UI component theme params', () => {
    setupIntrinsicAssertions(test);

    test('params are applied to dropdowns, text input, floating toolbar and colour picker', async ({ page }) => {
        const { url } = toExamplePageUrl('themes-e2e', 'ui-component-params', 'vanilla');
        await gotoExample(page, url);

        // cardShadow styles the anchored toolbar dropdown, independently of popupShadow.
        await page.getByTitle('Text Annotations').click();
        const dropdown = page.locator('.ag-charts-popover--anchored');
        await expect(dropdown).toBeVisible();
        expect(await computed(dropdown, 'box-shadow')).toBe('rgb(255, 0, 255) 0px 0px 0px 4px');
        await page.getByTitle('Text Annotations').click();

        // inputPlaceholderTextColor styles the text annotation placeholder.
        const { placeholderColor } = await addAndSelectTextAnnotation(page);
        expect(placeholderColor).toBe('rgb(0, 255, 0)');

        // dragHandleColor styles the floating toolbar drag handle.
        const toolbarHandle = page.locator('.ag-charts-floating-toolbar__drag-handle');
        expect(await computed(toolbarHandle, 'color')).toBe('rgb(255, 0, 0)');

        // The colour picker params restyle the picker; its popover takes cardShadow.
        const picker = await openColorPicker(page);
        expect(await computed(picker, '--thumb-size')).toBe('24px');
        expect(await computed(picker, '--track-height')).toBe('20px');
        expect(await computed(picker, '--thumb-border-width')).toBe('5px');
        const track = picker.locator('.ag-charts-color-picker__multi-color-button');
        expect(await computed(track, 'border-top-left-radius')).toBe('3px');
        const swatch = picker.locator('.ag-charts-color-picker__color-label');
        expect(await computed(swatch, 'border-top-left-radius')).toBe('8px');
        expect(await computed(closestPopover(picker), 'box-shadow')).toBe('rgb(255, 0, 255) 0px 0px 0px 4px');
    });

    test('dialogs take dragHandleColor and keep popupShadow', async ({ page }) => {
        const { url } = toExamplePageUrl('themes-e2e', 'ui-component-params', 'vanilla');
        await gotoExample(page, url);
        await addAndSelectTextAnnotation(page);

        // dragHandleColor styles the dialog drag handle; the dialog keeps popupShadow.
        await page.getByTitle('Settings').click();
        const dialogHandle = page.locator('.ag-charts-dialog__drag-handle');
        await expect(dialogHandle).toBeVisible();
        expect(await computed(dialogHandle, 'color')).toBe('rgb(255, 0, 0)');
        expect(await computed(closestPopover(dialogHandle), 'box-shadow')).toBe('rgb(0, 255, 255) 0px 0px 0px 4px');
    });

    test('menuSeparatorColor is applied to context menu dividers', async ({ page }) => {
        const { url } = toExamplePageUrl('themes-e2e', 'ui-component-params-context-menu', 'vanilla');
        await gotoExample(page, url);

        const point = await canvasToPageTransformer(page);
        const { x, y } = point(200, 200);
        await page.mouse.click(x, y, { button: 'right' });

        const divider = page.locator('.ag-charts-context-menu__divider').first();
        await expect(divider).toBeAttached();
        expect(await computed(divider, 'border-top-color', '::after')).toBe('rgb(0, 0, 255)');
    });

    test('defaults match the previous hard-coded styles', async ({ page }) => {
        const { url } = toExamplePageUrl('financial-charts-e2e', 'toolbar', 'vanilla');
        await gotoExample(page, url);

        await page.getByTitle('Text Annotations').click();
        const dropdown = page.locator('.ag-charts-popover--anchored');
        await expect(dropdown).toBeVisible();
        expect(await computed(dropdown, 'box-shadow')).toBe('rgba(0, 0, 0, 0.15) 0px 0px 16px 0px');
        await page.getByTitle('Text Annotations').click();

        await addAndSelectTextAnnotation(page);

        const picker = await openColorPicker(page);
        expect(await computed(picker, '--thumb-size')).toBe('18px');
        expect(await computed(picker, '--track-height')).toBe('12px');
        expect(await computed(picker, '--thumb-border-width')).toBe('3px');
        const track = picker.locator('.ag-charts-color-picker__multi-color-button');
        expect(await computed(track, 'border-top-left-radius')).toBe('396px');
        const swatch = picker.locator('.ag-charts-color-picker__color-label');
        expect(await computed(swatch, 'border-top-left-radius')).toBe('2px');
    });
});
