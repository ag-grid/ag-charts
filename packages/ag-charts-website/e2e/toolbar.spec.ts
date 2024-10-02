import { expect, test } from '@playwright/test';

import {
    SELECTORS,
    canvasToPageTransformer,
    gotoExample,
    locateCanvas,
    setupIntrinsicAssertions,
    toExamplePageUrl,
} from './util';

test.describe('toolbar', () => {
    setupIntrinsicAssertions();

    const { url } = toExamplePageUrl('financial-charts-test', 'e2e-toolbar', 'vanilla');

    test('line', async ({ page }) => {
        await gotoExample(page, url);

        const { bbox } = await locateCanvas(page);

        await page.locator('[data-toolbar-group="annotations"][data-toolbar-id="line-menu"]').click();
        await expect(page).toHaveScreenshot('line-1-popover.png', { animations: 'disabled' });

        await page.locator('[data-popover-id="line"]').click();
        await expect(page).toHaveScreenshot('line-2-button-active.png', { animations: 'disabled' });

        await page.hover(SELECTORS.canvas, { position: { x: 100, y: 100 } });
        await page.click(SELECTORS.canvas, { position: { x: 100, y: 100 } });
        await page.hover(SELECTORS.canvas, { position: { x: 200, y: 200 } });
        await expect(page).toHaveScreenshot('line-3-drawing.png', { animations: 'disabled' });

        await page.click(SELECTORS.canvas, { position: { x: 200, y: 200 } });
        await expect(page).toHaveScreenshot('line-4-complete.png', { animations: 'disabled' });

        // Click like a human, on the page, not a very specific DOM element.
        await page.mouse.click(bbox.x + 300, bbox.y + 300);

        await page.keyboard.press('ControlOrMeta+z');
        await expect(page).toHaveScreenshot('line-5-undo.png', { animations: 'disabled' });

        await page.keyboard.press('ControlOrMeta+y');
        await expect(page).toHaveScreenshot('line-6-redo.png', { animations: 'disabled' });

        // Click like a human, on the page, not a very specific DOM element.
        await page.mouse.click(bbox.x + 150, bbox.y + 150);

        await page.keyboard.press('ControlOrMeta+c');
        await expect(page).toHaveScreenshot('line-7-copy.png', { animations: 'disabled' });

        await page.keyboard.press('ControlOrMeta+v');
        await expect(page).toHaveScreenshot('line-8-paste.png', { animations: 'disabled' });
    });

    test('text', async ({ page }) => {
        await gotoExample(page, url);

        await page.locator('[data-toolbar-group="annotations"][data-toolbar-id="text-menu"]').click();
        await expect(page).toHaveScreenshot('text-1-popover.png', { animations: 'disabled' });

        await page.locator('[data-popover-id="text"]').hover();
        await expect(page).toHaveScreenshot('text-2-button-hover.png', { animations: 'disabled' });

        await page.locator('[data-popover-id="text"]').click();
        await expect(page).toHaveScreenshot('text-3-button-active.png', { animations: 'disabled' });

        await page.hover(SELECTORS.canvas, { position: { x: 200, y: 200 } });
        await page.click(SELECTORS.canvas, { position: { x: 200, y: 200 } });
        await expect(page).toHaveScreenshot('text-4-start.png', { animations: 'disabled' });

        await page.keyboard.type('@Hello, world!?');
        await page.keyboard.down('Backspace');
        await page.keyboard.down('Home');
        await page.keyboard.down('Delete');
        await expect(page).toHaveScreenshot('text-5-input.png', { animations: 'disabled' });

        await page.keyboard.down('Enter');
        await expect(page).toHaveScreenshot('text-6-save.png', { animations: 'disabled' });

        // Select text annotation
        await page.hover(SELECTORS.canvas, { position: { x: 210, y: 190 } });
        await page.click(SELECTORS.canvas, { position: { x: 210, y: 190 } });

        await page.click(SELECTORS.canvas, { position: { x: 210, y: 190 } });
        await page.keyboard.type(' Editing!');
        await expect(page).toHaveScreenshot('text-7-editing.png', { animations: 'disabled' });

        await page.keyboard.down('Enter');

        // Select text annotation
        await page.hover(SELECTORS.canvas, { position: { x: 210, y: 190 } });
        await page.click(SELECTORS.canvas, { position: { x: 210, y: 190 } });

        await page.locator('[data-toolbar-id="text-size"]').click();
        await expect(page).toHaveScreenshot('text-8-font-size-popover.png', { animations: 'disabled' });

        await page.locator('.ag-charts-menu__label', { hasText: '46' }).click();
        await expect(page).toHaveScreenshot('text-9-change-font-size.png', { animations: 'disabled' });

        await page.locator('[data-toolbar-id="delete"]').click();
        await expect(page).toHaveScreenshot('text-10-deleted.png', { animations: 'disabled' });
    });

    test('callout', async ({ page }) => {
        await gotoExample(page, url);

        await page.locator('[data-toolbar-group="annotations"][data-toolbar-id="text-menu"]').click();
        await page.locator('[data-popover-id="callout"]').click();

        await page.hover(SELECTORS.canvas, { position: { x: 200, y: 200 } });
        await page.click(SELECTORS.canvas, { position: { x: 200, y: 200 } });
        await expect(page).toHaveScreenshot('callout-1-start.png', { animations: 'disabled' });

        await page.hover(SELECTORS.canvas, { position: { x: 250, y: 150 } });
        await page.click(SELECTORS.canvas, { position: { x: 250, y: 150 } });
        await expect(page).toHaveScreenshot('callout-2-end.png', { animations: 'disabled' });

        await page.keyboard.type('Hello, world!');
        await expect(page).toHaveScreenshot('callout-3-input.png', { animations: 'disabled' });

        await page.keyboard.down('Enter');
        await expect(page).toHaveScreenshot('callout-4-save.png', { animations: 'disabled' });

        await page.hover(SELECTORS.canvas, { position: { x: 260, y: 140 } });
        await page.click(SELECTORS.canvas, { position: { x: 260, y: 140 } });
        await page.locator('[data-toolbar-id="fill-color"]').click();
        await expect(page).toHaveScreenshot('callout-5-fill-color-popover.png', { animations: 'disabled' });

        await page.locator('.ag-charts-color-picker__hue-input').click({
            position: {
                x: 30,
                y: 5,
            },
        });
        await page.hover(SELECTORS.canvas, { position: { x: 100, y: 100 } });
        await page.click(SELECTORS.canvas, { position: { x: 100, y: 100 } });
        await expect(page).toHaveScreenshot('callout-6-change-fill-color.png', { animations: 'disabled' });
    });

    test('AG-13008 delete annotation', async ({ page }) => {
        await gotoExample(page, url);
        const point = await canvasToPageTransformer(page);
        const hover = point(200, 200);
        const leave = point(300, 400);

        // Test 1. Check that the Delete & Backspace keys work:
        await page.locator(SELECTORS.textAnnotationMenu).click();
        await page.locator(SELECTORS.commentMenuItem).click();
        await page.mouse.click(hover.x, hover.y, { button: 'left' });
        await page.keyboard.type('this sentence is missing a word');
        await page.keyboard.press('Backspace');
        await page.keyboard.press('Backspace');
        await page.keyboard.press('Backspace');
        await page.keyboard.press('Backspace');
        await page.keyboard.press('Backspace');
        await page.keyboard.press('Home');
        await page.keyboard.press('Delete');
        await expect(page).toHaveScreenshot('delete-erased-text.png');

        // Test 2. Check that Backspace key deletes the annotation when in idle state:
        // (Click away from the annotation, then reclick it to go into idle state)
        await page.mouse.click(leave.x, leave.y, { button: 'left' });
        await page.mouse.click(hover.x, hover.y, { button: 'left' });
        await page.keyboard.press('Backspace');
        await expect(page).toHaveScreenshot('delete-annotation-removed.png');

        // Test 3. Check that the Delete button works in text-editing state:
        await page.locator(SELECTORS.textAnnotationMenu).click();
        await page.locator(SELECTORS.commentMenuItem).click();
        await page.mouse.click(hover.x, hover.y, { button: 'left' });
        await page.locator(SELECTORS.annotationOptionsDeleteButton).click();
        await expect(page).toHaveScreenshot('delete-annotation-removed.png');

        // Test 4. Check that the Delete button works in idle state:
        // (Click away from the annotation, then reclick it to go into idle state)
        await page.locator(SELECTORS.textAnnotationMenu).click();
        await page.locator(SELECTORS.commentMenuItem).click();
        await page.mouse.click(hover.x, hover.y, { button: 'left' });
        await page.keyboard.type('Delete this temporary annotation');
        await page.mouse.click(leave.x, leave.y, { button: 'left' });
        await page.mouse.click(hover.x, hover.y, { button: 'left' });
        await page.locator(SELECTORS.annotationOptionsDeleteButton).click();
        await expect(page).toHaveScreenshot('delete-annotation-removed.png');
    });
});
