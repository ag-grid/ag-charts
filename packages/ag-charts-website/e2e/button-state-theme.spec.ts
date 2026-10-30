import type { Page } from '@playwright/test';

import { expect, test } from './fixture';
import { gotoExample, setupIntrinsicAssertions, toExamplePageUrl } from './util';

const BLACK = 'rgb(0, 0, 0)';
const ORANGE = 'rgb(255, 109, 0)';
const RED = 'rgb(255, 0, 0)';

// Longer than the toolbar's 0.25s border-colour transition, so a leaked colour has finished arriving.
const TRANSITION_SETTLE_MS = 400;

const zoomButtons = (page: Page) => page.locator('.ag-charts-zoom-buttons');

test.describe('button state theme params', () => {
    setupIntrinsicAssertions(test);

    test('hovering a zoom button does not recolour the first button of the next group', async ({ page }) => {
        const { url } = toExamplePageUrl('financial-charts-e2e', 'button-state-borders', 'vanilla');
        await gotoExample(page, url);

        // Zooming in enables the pan and reset buttons, which each start a new group.
        const zoomIn = page.getByTitle('Zoom in');
        await zoomIn.click();
        await zoomIn.click();

        const panLeft = page.getByTitle('Pan left');
        const reset = page.getByTitle('Reset the zoom');
        await expect(panLeft).toHaveAttribute('aria-disabled', 'false');
        await expect(reset).toHaveAttribute('aria-disabled', 'false');

        await zoomIn.hover();
        await expect(zoomIn).toHaveCSS('border-inline-start-color', ORANGE);
        await page.waitForTimeout(TRANSITION_SETTLE_MS);

        await expect(panLeft).toHaveCSS('border-inline-start-color', BLACK);
        await expect(zoomButtons(page)).toHaveScreenshot('button-state-hover-zoom-in.png', { animations: 'disabled' });
    });

    test('a disabled zoom button does not recolour the first button of the next group', async ({ page }) => {
        const { url } = toExamplePageUrl('financial-charts-e2e', 'button-state-borders', 'vanilla');
        await gotoExample(page, url);

        // Fully zoomed in on the latest data, "Pan right" is disabled and "Reset the zoom" starts the next group.
        const zoomIn = page.getByTitle('Zoom in');
        await zoomIn.click();
        await zoomIn.click();
        await page.mouse.move(0, 0);

        await expect(page.getByTitle('Pan right')).toHaveAttribute('aria-disabled', 'true');
        await expect(page.getByTitle('Reset the zoom')).toHaveAttribute('aria-disabled', 'false');
        await page.waitForTimeout(TRANSITION_SETTLE_MS);

        await expect(page.getByTitle('Reset the zoom')).toHaveCSS('border-inline-start-color', BLACK);
        await expect(zoomButtons(page)).toHaveScreenshot('button-state-disabled-zoom-buttons.png', {
            animations: 'disabled',
        });
    });

    test('disabled button background follows buttonBackgroundColor', async ({ page }) => {
        const { url } = toExamplePageUrl('financial-charts-e2e', 'button-disabled-background', 'vanilla');
        await gotoExample(page, url);
        await page.mouse.move(0, 0);

        // Not zoomed in, so "Zoom in" is enabled and "Zoom out" is disabled.
        const enabled = page.getByTitle('Zoom in');
        const disabled = page.getByTitle('Zoom out');
        await expect(disabled).toHaveAttribute('aria-disabled', 'true');
        await expect(enabled).toHaveCSS('background-color', RED);

        const background = await disabled.evaluate((el) => getComputedStyle(el).backgroundColor);
        const [r, g, b] = background.match(/\d+/g)!.map(Number);

        // A faded red, not the sky-blue chrome background.
        expect(background).not.toBe(RED);
        expect(r).toBeGreaterThan(200);
        expect(g).toBeLessThan(60);
        expect(b).toBeLessThan(60);
        await expect(zoomButtons(page)).toHaveScreenshot('button-disabled-background.png', {
            animations: 'disabled',
        });
    });
});

test.describe('shared toolbar button state', () => {
    setupIntrinsicAssertions(test);

    const ACTIVE_CLASS = /ag-charts-toolbar__button--active/;

    test.beforeEach(async ({ page }) => {
        const { url } = toExamplePageUrl('financial-charts-e2e', 'button-state-borders', 'vanilla');
        await gotoExample(page, url);
    });

    test('the button below an open menu keeps its button border colour', async ({ page }) => {
        await page.getByTitle('Chart Type').click();
        await page.mouse.move(0, 0);
        await page.waitForTimeout(TRANSITION_SETTLE_MS);
        await expect(page.getByTitle('Trend Lines')).toHaveCSS('border-inline-start-color', BLACK);

        await page.keyboard.press('Escape');
        await page.getByTitle('Trend Lines').click();
        await page.mouse.move(0, 0);
        await page.waitForTimeout(TRANSITION_SETTLE_MS);
        await expect(page.getByTitle('Fibonacci')).toHaveCSS('border-inline-start-color', BLACK);
    });

    test('the button below an open menu takes its hover border colour', async ({ page }) => {
        await page.getByTitle('Chart Type').click();
        const below = page.getByTitle('Trend Lines');
        await below.hover();
        await expect(below).toHaveCSS('border-inline-start-color', ORANGE);
    });

    test('an annotation menu button is no longer active once its menu is dismissed', async ({ page }) => {
        const fibonacci = page.getByTitle('Fibonacci');

        await fibonacci.click();
        await expect(fibonacci).toHaveClass(ACTIVE_CLASS);
        await page.mouse.click(0, 0);
        await expect(fibonacci).not.toHaveClass(ACTIVE_CLASS);

        await fibonacci.click();
        await expect(fibonacci).toHaveClass(ACTIVE_CLASS);
        await page.keyboard.press('Escape');
        await expect(fibonacci).not.toHaveClass(ACTIVE_CLASS);
    });

    test('switching between toolbar menus activates only the pressed button', async ({ page }) => {
        const chartType = page.getByTitle('Chart Type');
        const trendLines = page.getByTitle('Trend Lines');
        const fibonacci = page.getByTitle('Fibonacci');

        await chartType.click();
        await trendLines.click();
        await expect(trendLines).toHaveClass(ACTIVE_CLASS);
        await expect(chartType).not.toHaveClass(ACTIVE_CLASS);

        await fibonacci.click();
        await expect(fibonacci).toHaveClass(ACTIVE_CLASS);
        await expect(trendLines).not.toHaveClass(ACTIVE_CLASS);

        await chartType.click();
        await expect(chartType).toHaveClass(ACTIVE_CLASS);
        await expect(fibonacci).not.toHaveClass(ACTIVE_CLASS);
    });

    test('an annotation menu button stays active after picking a menu item', async ({ page }) => {
        const trendLines = page.getByTitle('Trend Lines');
        await trendLines.click();
        await page.locator('.ag-charts-menu__row').first().click();
        await expect(trendLines).toHaveClass(ACTIVE_CLASS);
    });
});
