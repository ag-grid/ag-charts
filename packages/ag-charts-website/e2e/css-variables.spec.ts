import type { Locator, Page } from '@playwright/test';

import { expect, test } from './fixture';
import { expectChartScreenshot } from './scene-capture';
import {
    SELECTORS,
    canvasToPageTransformer,
    gotoExample,
    setupIntrinsicAssertions,
    toExamplePageUrl,
    toExamplePageUrls,
    waitForAllChartUpdates,
} from './util';

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

test.describe('css variables', () => {
    setupIntrinsicAssertions(test);

    for (const { framework, url } of toExamplePageUrls('themes-e2e', 'css-variables').filter(
        (f) => f.framework === 'vanilla'
    )) {
        test.describe(`for ${framework}`, () => {
            test('change value', async ({ page }) => {
                await gotoExample(page, url);
                await expectChartScreenshot(page, page.locator(SELECTORS.canvas), 'initial-value.png');

                await page.getByText('Change CSS Variable').click();
                await expectChartScreenshot(page, page.locator(SELECTORS.canvas), 'changed-value.png');

                await page.getByTitle('Change to Default Theme').click();
                await expectChartScreenshot(page, page.locator(SELECTORS.canvas), 'changed-theme.png');

                await page.getByTitle('Change to Default Theme').click();
                await page.getByText('Change CSS Variable').click();
                await expectChartScreenshot(page, page.locator(SELECTORS.canvas), 'change-value-same-theme.png');

                await page.getByTitle('Change to Paper Theme').click();
                await page.getByText('Change CSS Variable').click();
                await expectChartScreenshot(page, page.locator(SELECTORS.canvas), 'change-value-and-theme.png');
            });
        });
    }

    // The dark-mode example rebinds `--chart-*` CSS variables by toggling a `body` class; the charts
    // must re-resolve the theme and repaint without an explicit `chart.update()` call.
    test('dark mode toggles chart colours via CSS variables without chart.update()', async ({ page }) => {
        const { url } = toExamplePageUrl('themes-e2e', 'css-variables-dark-mode', 'vanilla');
        await gotoExample(page, url);

        const charts = page.locator('#charts');
        await expect(page.locator('#status')).toContainText('Mode: Light');
        await expectChartScreenshot(page, charts, 'css-variables-dark-mode-light.png');

        await page.getByText('Toggle Dark Mode').click();
        await waitForAllChartUpdates(page);
        await expect(page.locator('#status')).toContainText('Mode: Dark');
        await expectChartScreenshot(page, charts, 'css-variables-dark-mode-dark.png');

        // Toggling back must re-resolve the CSS variables and repaint to the original light appearance,
        // still without an explicit chart.update().
        await page.getByText('Toggle Dark Mode').click();
        await waitForAllChartUpdates(page);
        await expect(page.locator('#status')).toContainText('Mode: Light');
        await expectChartScreenshot(page, charts, 'css-variables-dark-mode-light-restored.png');
    });

    // A theme param blends `accentColor` onto a `var(--onto-color)` via `ontoColor`. Changing the CSS
    // variable must re-resolve and repaint the bars without an explicit `chart.update()` call.
    test('ontoColor blends onto a CSS variable and reacts to its changes', async ({ page }) => {
        const { url } = toExamplePageUrl('themes-e2e', 'css-variables-onto-color', 'vanilla');
        await gotoExample(page, url);
        await expectChartScreenshot(page, page.locator(SELECTORS.canvas), 'onto-color-initial.png');

        await page.getByText('Change CSS Variable').click();
        await waitForAllChartUpdates(page);
        await expectChartScreenshot(page, page.locator(SELECTORS.canvas), 'onto-color-changed.png');
    });

    // Each UI-component theme param reaches the CSS of the component it styles.
    test.describe('UI component theme params', () => {
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

            await page.getByTitle('Trend Lines').click();
            await page.getByText('Trend Line', { exact: true }).click();
            for (const position of [
                { x: 100, y: 100 },
                { x: 200, y: 200 },
            ]) {
                await page.hover(SELECTORS.canvasProxy, { position });
                await page.click(SELECTORS.canvasProxy, { position });
            }
            await page.hover(SELECTORS.canvasProxy, { position: { x: 150, y: 150 } });
            await page.click(SELECTORS.canvasProxy, { position: { x: 150, y: 150 } });

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
});
