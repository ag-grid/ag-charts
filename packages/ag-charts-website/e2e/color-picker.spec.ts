import type { Page } from '@playwright/test';

import { expect, test } from './fixture';
import { SELECTORS, gotoExample, setupIntrinsicAssertions, toExamplePageUrl } from './util';

/** Draws a Fibonacci retracement, whose line colour starts as multi-colour, and opens its colour picker. */
async function openFibonacciLineColorPicker(page: Page, url: string) {
    await gotoExample(page, url);

    await page.getByTitle('Fibonacci').click();
    await page.getByText('Fib Retracement').click();
    await page.hover(SELECTORS.canvasProxy, { position: { x: 100, y: 250 } });
    await page.click(SELECTORS.canvasProxy, { position: { x: 100, y: 250 } });
    await page.hover(SELECTORS.canvasProxy, { position: { x: 350, y: 100 } });
    await page.click(SELECTORS.canvasProxy, { position: { x: 350, y: 100 } });
    await page.getByTitle('Line Color').click();
}

test.describe('colour picker', () => {
    setupIntrinsicAssertions(test);

    const { url } = toExamplePageUrl('financial-charts-e2e', 'toolbar', 'vanilla');

    test('exposes its controls by role and accessible name, and focuses the palette', async ({ page }) => {
        await openFibonacciLineColorPicker(page, url);

        const palette = page.getByRole('slider', { name: 'Palette' });
        await expect(palette).toBeFocused();
        await expect(palette).toHaveAttribute('aria-roledescription', '2D slider');
        await expect(palette).toHaveAttribute('aria-valuetext', /^s \d+(\.\d+)?%, v \d+(\.\d+)?%$/);
        await expect(page.getByRole('slider', { name: 'Hue' })).toBeVisible();
        await expect(page.getByRole('slider', { name: 'Transparency' })).toHaveValue('1');
        await expect(page.getByRole('switch', { name: 'Multi Color' })).toHaveAttribute('aria-checked', 'true');
        await expect(page.getByRole('textbox', { name: 'Color' })).toHaveValue('Multi Color');
    });

    test('palette: arrow keys change saturation and value, announcing the changed one first', async ({ page }) => {
        await openFibonacciLineColorPicker(page, url);
        const palette = page.getByRole('slider', { name: 'Palette' });
        const initialValueText = await palette.getAttribute('aria-valuetext');
        expect(initialValueText).not.toBeNull();

        await page.keyboard.press('ArrowLeft');
        await expect(palette).toHaveAttribute('aria-valuetext', /^s /);
        await expect(palette).not.toHaveAttribute('aria-valuetext', initialValueText ?? '');

        await page.keyboard.press('ArrowDown');
        await expect(palette).toHaveAttribute('aria-valuetext', /^v /);

        await page.keyboard.press('ArrowRight');
        await expect(palette).toHaveAttribute('aria-valuetext', /^s /);

        await page.keyboard.press('ArrowUp');
        await expect(palette).toHaveAttribute('aria-valuetext', /^v /);
        await expect(palette).toBeFocused();
        await expect(page.getByRole('switch', { name: 'Multi Color' })).toHaveAttribute('aria-checked', 'true');
    });

    test('palette: dragging picks the colour under the pointer, clamped to the palette', async ({ page }) => {
        await openFibonacciLineColorPicker(page, url);
        const palette = page.getByRole('slider', { name: 'Palette' });
        const colorInput = page.getByRole('textbox', { name: 'Color' });
        const box = await palette.boundingBox();
        expect(box).not.toBeNull();
        const { x, y, width, height } = box ?? { x: 0, y: 0, width: 0, height: 0 };

        await page.getByRole('slider', { name: 'Hue' }).focus();
        await page.mouse.move(x + width / 2, y + height / 2);
        await page.mouse.down();
        await expect(palette).toBeFocused();
        await expect(palette).toHaveAttribute('aria-valuetext', 's 50%, v 50%');

        await page.mouse.move(x - 20, y - 20);
        await expect(colorInput).toHaveValue('#FFFFFF');
        await expect(palette).toHaveAttribute('aria-valuetext', 's 0%, v 100%');

        await page.mouse.move(x + width + 20, y + height + 20);
        await expect(colorInput).toHaveValue('#000000');
        await expect(palette).toHaveAttribute('aria-valuetext', 's 100%, v 0%');

        await page.mouse.up();
        await page.mouse.move(x + width / 2, y + height / 2);
        await expect(colorInput).toHaveValue('#000000');
    });

    test('palette: right and middle mouse presses do not pick a colour', async ({ page }) => {
        await openFibonacciLineColorPicker(page, url);
        const palette = page.getByRole('slider', { name: 'Palette' });
        const colorInput = page.getByRole('textbox', { name: 'Color' });
        const box = await palette.boundingBox();
        expect(box).not.toBeNull();
        const { x, y, width, height } = box ?? { x: 0, y: 0, width: 0, height: 0 };

        await page.mouse.move(x + width / 2, y + height / 2);
        await page.mouse.down({ button: 'right' });
        await page.mouse.move(x - 20, y - 20);
        await page.mouse.up({ button: 'right' });
        await page.mouse.move(x + width / 2, y + height / 2);
        await page.mouse.down({ button: 'middle' });
        await page.mouse.move(x - 20, y - 20);
        await page.mouse.up({ button: 'middle' });

        await expect(colorInput).toHaveValue('Multi Color');
        await expect(page.getByRole('switch', { name: 'Multi Color' })).toHaveAttribute('aria-checked', 'true');
    });

    test('hue and transparency sliders keep their arrow keys', async ({ page }) => {
        await openFibonacciLineColorPicker(page, url);
        const hue = page.getByRole('slider', { name: 'Hue' });
        const alpha = page.getByRole('slider', { name: 'Transparency' });
        const colorInput = page.getByRole('textbox', { name: 'Color' });

        await alpha.focus();
        await page.keyboard.press('ArrowLeft');
        await expect(alpha).toHaveValue('0.99');
        await expect(colorInput).toHaveValue(/^#[0-9A-F]{6}FC$/);

        await hue.focus();
        await page.keyboard.press('Home');
        await expect(hue).toHaveValue('0');
        await page.keyboard.press('ArrowRight');
        await expect(hue).toHaveValue('1');
    });

    test('multi-colour switch: Space toggles it, and the colour field shows "Multi Color"', async ({ page }) => {
        await openFibonacciLineColorPicker(page, url);
        const multiColor = page.getByRole('switch', { name: 'Multi Color' });
        const colorInput = page.getByRole('textbox', { name: 'Color' });

        await multiColor.focus();
        await page.keyboard.press('Space');
        await expect(multiColor).toHaveAttribute('aria-checked', 'false');
        await expect(colorInput).toHaveValue(/^#[0-9A-F]{6}$/);

        await page.keyboard.press('Space');
        await expect(multiColor).toHaveAttribute('aria-checked', 'true');
        await expect(colorInput).toHaveValue('Multi Color');

        await multiColor.click();
        await expect(multiColor).toHaveAttribute('aria-checked', 'false');
    });

    test('multi-colour switch: Enter closes the picker without toggling it', async ({ page }) => {
        await openFibonacciLineColorPicker(page, url);
        const multiColor = page.getByRole('switch', { name: 'Multi Color' });

        await multiColor.focus();
        await page.keyboard.press('Enter');
        await expect(multiColor).toBeHidden();

        await page.getByTitle('Line Color').click();
        await expect(multiColor).toHaveAttribute('aria-checked', 'true');
    });

    test('Escape closes the picker', async ({ page }) => {
        await openFibonacciLineColorPicker(page, url);
        const palette = page.getByRole('slider', { name: 'Palette' });

        await page.keyboard.press('Escape');
        await expect(palette).toBeHidden();
    });

    test('colour field: Enter applies the typed colour and closes the picker', async ({ page }) => {
        await openFibonacciLineColorPicker(page, url);
        const colorInput = page.getByRole('textbox', { name: 'Color' });

        await colorInput.fill('');
        await colorInput.pressSequentially('#00ff00');
        await page.keyboard.press('Enter');
        await expect(colorInput).toBeHidden();

        await page.getByTitle('Line Color').click();
        await expect(colorInput).toHaveValue('#00FF00');
    });
});
