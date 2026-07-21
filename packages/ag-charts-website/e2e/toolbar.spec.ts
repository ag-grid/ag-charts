import { test } from './fixture';
import { expectChartScreenshot } from './scene-capture';
import {
    SELECTORS,
    canvasToPageTransformer,
    gotoExample,
    locateCanvas,
    repeat,
    setupIntrinsicAssertions,
    toExamplePageUrl,
} from './util';

test.describe('toolbar', () => {
    setupIntrinsicAssertions(test);

    const { url } = toExamplePageUrl('financial-charts-e2e', 'toolbar', 'vanilla');

    test('line', async ({ page }) => {
        await gotoExample(page, url);

        const { bbox } = await locateCanvas(page);

        await page.getByTitle('Trend Lines').click();
        await expectChartScreenshot(page, page, 'line-1-popover.png', { animations: 'disabled' });

        await page.getByText('Trend Line').click();
        await expectChartScreenshot(page, page, 'line-2-button-active.png', { animations: 'disabled' });

        await page.hover(SELECTORS.canvasProxy, { position: { x: 100, y: 100 } });
        await page.click(SELECTORS.canvasProxy, { position: { x: 100, y: 100 } });
        await page.hover(SELECTORS.canvasProxy, { position: { x: 200, y: 200 } });
        await expectChartScreenshot(page, page, 'line-3-drawing.png', { animations: 'disabled' });

        await page.click(SELECTORS.canvasProxy, { position: { x: 200, y: 200 } });
        await expectChartScreenshot(page, page, 'line-4-complete.png', { animations: 'disabled' });

        // Click like a human, on the page, not a very specific DOM element.
        await page.mouse.click(bbox.x + 300, bbox.y + 300);

        await page.keyboard.press('ControlOrMeta+z');
        await expectChartScreenshot(page, page, 'line-5-undo.png', { animations: 'disabled' });

        await page.keyboard.press('ControlOrMeta+y');
        await expectChartScreenshot(page, page, 'line-6-redo.png', { animations: 'disabled' });

        // Click like a human, on the page, not a very specific DOM element.
        await page.mouse.click(bbox.x + 150, bbox.y + 150);

        await page.keyboard.press('ControlOrMeta+c');
        await expectChartScreenshot(page, page, 'line-7-copy.png', { animations: 'disabled' });

        await page.keyboard.press('ControlOrMeta+v');
        await expectChartScreenshot(page, page, 'line-8-paste.png', { animations: 'disabled' });
    });

    test('text', async ({ page }) => {
        await gotoExample(page, url);

        await page.getByTitle('Text Annotations').click();
        await expectChartScreenshot(page, page, 'text-1-popover.png', { animations: 'disabled' });

        await page.getByText('Text').hover();
        await expectChartScreenshot(page, page, 'text-2-button-hover.png', { animations: 'disabled' });

        await page.getByText('Text').click();
        await expectChartScreenshot(page, page, 'text-3-button-active.png', { animations: 'disabled' });

        await page.hover(SELECTORS.canvasProxy, { position: { x: 200, y: 200 } });
        await page.click(SELECTORS.canvasProxy, { position: { x: 200, y: 200 } });
        await expectChartScreenshot(page, page, 'text-4-start.png', { animations: 'disabled' });

        await page.keyboard.type('@Hello, world!?');
        await page.keyboard.down('Backspace');
        await page.keyboard.down('Home');
        await page.keyboard.down('Delete');
        await expectChartScreenshot(page, page, 'text-5-input.png', { animations: 'disabled' });

        await page.keyboard.down('Enter');
        await expectChartScreenshot(page, page, 'text-6-save.png', { animations: 'disabled' });

        // Select text annotation
        await page.hover(SELECTORS.canvasProxy, { position: { x: 210, y: 190 } });
        await page.click(SELECTORS.canvasProxy, { position: { x: 210, y: 190 } });

        await page.click(SELECTORS.canvasProxy, { position: { x: 210, y: 190 } });
        await page.keyboard.type(' Editing!');
        await expectChartScreenshot(page, page, 'text-7-editing.png', { animations: 'disabled' });

        await page.keyboard.down('Enter');

        // Select text annotation
        await page.hover(SELECTORS.canvasProxy, { position: { x: 210, y: 190 } });
        await page.click(SELECTORS.canvasProxy, { position: { x: 210, y: 190 } });

        await page.getByTitle('Text Size').click();
        await expectChartScreenshot(page, page, 'text-8-font-size-popover.png', { animations: 'disabled' });

        await page.locator('.ag-charts-menu__label', { hasText: '46' }).click();
        await expectChartScreenshot(page, page, 'text-9-change-font-size.png', { animations: 'disabled' });

        await page.getByTitle('Delete').click();
        await expectChartScreenshot(page, page, 'text-10-deleted.png', { animations: 'disabled' });
    });

    test('callout', async ({ page }) => {
        await gotoExample(page, url);

        await page.getByTitle('Text Annotations').click();
        await page.getByText('Callout').click();

        await page.hover(SELECTORS.canvasProxy, { position: { x: 200, y: 200 } });
        await page.click(SELECTORS.canvasProxy, { position: { x: 200, y: 200 } });
        await expectChartScreenshot(page, page, 'callout-1-start.png', { animations: 'disabled' });

        await page.hover(SELECTORS.canvasProxy, { position: { x: 250, y: 150 } });
        await page.click(SELECTORS.canvasProxy, { position: { x: 250, y: 150 } });
        await expectChartScreenshot(page, page, 'callout-2-end.png', { animations: 'disabled' });

        await page.keyboard.type('Hello, world!');
        await expectChartScreenshot(page, page, 'callout-3-input.png', { animations: 'disabled' });

        await page.keyboard.down('Enter');
        await expectChartScreenshot(page, page, 'callout-4-save.png', { animations: 'disabled' });

        await page.hover(SELECTORS.canvasProxy, { position: { x: 270, y: 140 } });
        await page.click(SELECTORS.canvasProxy, { position: { x: 270, y: 140 } });
        await page.getByTitle('Fill Color').click();
        await expectChartScreenshot(page, page, 'callout-5-fill-color-popover.png', { animations: 'disabled' });

        await page.locator('.ag-charts-color-picker__hue-input').click({
            position: {
                x: 30,
                y: 5,
            },
        });
        await page.hover(SELECTORS.canvasProxy, { position: { x: 100, y: 100 } });
        await page.click(SELECTORS.canvasProxy, { position: { x: 100, y: 100 } });
        await expectChartScreenshot(page, page, 'callout-6-change-fill-color.png', { animations: 'disabled' });
    });

    test('AG-13008 delete annotation', async ({ page }) => {
        await gotoExample(page, url);
        const point = await canvasToPageTransformer(page);
        const hover = point(200, 200);
        const leave = point(300, 400);

        // Test 1. Check that the Delete & Backspace keys work:
        await page.getByTitle('Text Annotations').click();
        await page.getByText('Comment').click();
        await page.mouse.move(hover.x, hover.y);
        await page.mouse.click(hover.x, hover.y, { button: 'left' });
        await page.keyboard.type('this sentence is missing a word');
        await page.keyboard.press('Backspace');
        await page.keyboard.press('Backspace');
        await page.keyboard.press('Backspace');
        await page.keyboard.press('Backspace');
        await page.keyboard.press('Backspace');
        await page.keyboard.press('Home');
        await page.keyboard.press('Delete');
        await expectChartScreenshot(page, page, 'delete-erased-text.png', { animations: 'disabled' });

        // Test 2. Check that Backspace key deletes the annotation when in idle state:
        // (Click away from the annotation, then reclick it to go into idle state)
        await page.mouse.click(leave.x, leave.y, { button: 'left' });
        await page.mouse.click(hover.x, hover.y, { button: 'left' });
        await page.keyboard.press('Backspace');
        await expectChartScreenshot(page, page, 'delete-annotation-removed.png', { animations: 'disabled' });

        // Test 3. Check that the Delete button works in text-editing state:
        await page.getByTitle('Text Annotations').click();
        await page.getByText('Comment').click();
        await page.mouse.click(hover.x, hover.y, { button: 'left' });
        await page.getByTitle('Delete').click();
        await expectChartScreenshot(page, page, 'delete-annotation-removed-no-crosshair.png', {
            animations: 'disabled',
        });

        // Test 4. Check that the Delete button works in idle state:
        // (Click away from the annotation, then reclick it to go into idle state)
        await page.getByTitle('Text Annotations').click();
        await page.getByText('Comment').click();
        await page.mouse.click(hover.x, hover.y, { button: 'left' });
        await page.keyboard.type('Delete this temporary annotation');
        await page.mouse.click(leave.x, leave.y, { button: 'left' });
        await page.mouse.click(hover.x, hover.y, { button: 'left' });
        await page.getByTitle('Delete').click();
        await expectChartScreenshot(page, page, 'delete-annotation-removed-no-crosshair.png', {
            animations: 'disabled',
        });
    });

    test('AG-12695 annotationOptions ignore hovers when dragging annotation', async ({ page }) => {
        await gotoExample(page, url);

        const [initX, initY] = [400, 300];
        await page.getByTitle('Trend Lines').click();
        await page.getByText('Horizontal Line').click();
        await page.mouse.move(initX, initY);
        await page.mouse.click(initY, initY, { button: 'left' });

        // AG-13108 annotation dragging is broken unless the mouse moves after creating an annotation.
        await page.mouse.move(0, 0);
        await page.mouse.move(initX, initY);

        const bbox = await page.getByTitle('Settings').boundingBox();
        const [dragX, dragY] = [bbox.x + bbox.width / 2, bbox.y + bbox.height / 2];
        await page.mouse.down({ button: 'left' });
        await page.mouse.move(dragX, dragY, { steps: 10 });
        await expectChartScreenshot(page, page, 'settings-button-ignored-hover-event.png', { animations: 'disabled' });
    });

    test('AG-16815 chart responds to arrow keys after axis-button click and mouseleave', async ({ page }) => {
        await gotoExample(page, url);

        await page.mouse.click(714, 154, { button: 'left' });
        await expectChartScreenshot(page, page, 'AG-16815-new-horizontal-line-annotation.png', {
            animations: 'disabled',
        });

        await page.mouse.move(393, 128);
        await expectChartScreenshot(page, page, 'AG-16815-line-dash-button-hovered.png', { animations: 'disabled' });

        await repeat(12, async () => await page.keyboard.press('ArrowDown'));
        await expectChartScreenshot(page, page, 'AG-16815-horizontal-line-moved-down.png', { animations: 'disabled' });
    });
});
