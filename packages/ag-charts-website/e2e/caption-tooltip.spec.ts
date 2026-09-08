import { expect, test } from './fixture';
import { SELECTORS, canvasToPageTransformer, gotoExample, setupIntrinsicAssertions, toExamplePageUrl } from './util';

test.describe('caption tooltip', () => {
    setupIntrinsicAssertions(test);

    test.beforeEach(async ({ page }) => {
        await gotoExample(page, toExamplePageUrl('layout-e2e', 'caption-tooltip', 'vanilla').url);
    });

    async function hoverTitle(page: import('@playwright/test').Page) {
        const toPage = await canvasToPageTransformer(page);
        // Title is rendered at the top centre of the chart
        const point = toPage(400, 22);
        await page.mouse.move(point.x, point.y);
    }

    async function hoverSubtitle(page: import('@playwright/test').Page) {
        // The subtitle proxy is a DOM element with the subtitle text content
        const proxyElements = page.locator('.ag-charts-proxy-elem');
        const count = await proxyElements.count();
        for (let i = 0; i < count; i++) {
            const text = await proxyElements.nth(i).textContent();
            if (text?.includes('Fiscal Year 2025')) {
                await proxyElements.nth(i).hover();
                return;
            }
        }
        throw new Error('Subtitle proxy element not found');
    }

    async function hoverAway(page: import('@playwright/test').Page) {
        const toPage = await canvasToPageTransformer(page);
        // Move to series area, away from captions
        const point = toPage(400, 300);
        await page.mouse.move(point.x, point.y);
    }

    test('no tooltip by default on non-truncated title', async ({ page }) => {
        await hoverTitle(page);
        const tooltip = page.locator(SELECTORS.tooltip);
        await expect(tooltip).not.toBeVisible();
    });

    test('visible: always shows tooltip on hover', async ({ page }) => {
        await page.locator('label[for="visible-always"]').click();
        await hoverTitle(page);
        const tooltip = page.locator(SELECTORS.tooltip);
        await expect(tooltip).toBeVisible();
        await expect(tooltip).toContainText('Quarterly Revenue');
    });

    test('visible: always shows subtitle tooltip on hover', async ({ page }) => {
        await page.locator('label[for="visible-always"]').click();
        await hoverSubtitle(page);
        const tooltip = page.locator(SELECTORS.tooltip);
        await expect(tooltip).toBeVisible();
        await expect(tooltip).toContainText('Fiscal Year 2025');
    });

    test('visible: never hides tooltip even when truncated', async ({ page }) => {
        await page.locator('#truncate').click();
        await page.locator('label[for="visible-never"]').click();
        await hoverTitle(page);
        const tooltip = page.locator(SELECTORS.tooltip);
        await expect(tooltip).not.toBeVisible();
    });

    test('custom text shows on hover', async ({ page }) => {
        await page.locator('label[for="custom-text"]').click();
        await hoverTitle(page);
        const tooltip = page.locator(SELECTORS.tooltip);
        await expect(tooltip).toBeVisible();
        await expect(tooltip).toContainText('Revenue in USD from internal CRM');
    });

    test('renderer shows HTML content', async ({ page }) => {
        await page.locator('label[for="renderer"]').click();
        await hoverTitle(page);
        const tooltip = page.locator(SELECTORS.tooltip);
        await expect(tooltip).toBeVisible();
        await expect(tooltip).toContainText('Source: Internal CRM');
    });

    test('empty renderer hides tooltip', async ({ page }) => {
        await page.locator('label[for="empty-renderer"]').click();
        await hoverTitle(page);
        const tooltip = page.locator(SELECTORS.tooltip);
        await expect(tooltip).not.toBeVisible();
    });

    test('renderer returning undefined falls back to caption text', async ({ page }) => {
        await page.locator('label[for="undefined-renderer"]').click();
        await hoverTitle(page);
        const tooltip = page.locator(SELECTORS.tooltip);
        await expect(tooltip).toBeVisible();
        await expect(tooltip).toContainText('Quarterly Revenue');
    });

    test('renderer returning undefined falls back to tooltip text when set', async ({ page }) => {
        await page.locator('label[for="undefined-renderer"]').click();
        await hoverSubtitle(page);
        const tooltip = page.locator(SELECTORS.tooltip);
        await expect(tooltip).toBeVisible();
        await expect(tooltip).toContainText('Subtitle fallback text');
    });

    test('auto mode shows tooltip when truncated', async ({ page }) => {
        await page.locator('#truncate').click();
        await hoverTitle(page);
        const tooltip = page.locator(SELECTORS.tooltip);
        await expect(tooltip).toBeVisible();
        await expect(tooltip).toContainText('Quarterly Revenue');
    });

    test('a visibility option clears the content selection', async ({ page }) => {
        await page.locator('label[for="custom-text"]').click();
        await expect(page.locator('#custom-text')).toBeChecked();

        // Never replaces the tooltip with a visibility-only object, so no content option applies.
        await page.locator('label[for="visible-never"]').click();
        await expect(page.locator('#custom-text')).not.toBeChecked();

        // Custom Text is re-selectable because the radio was cleared.
        await page.locator('label[for="custom-text"]').click();
        await expect(page.locator('#custom-text')).toBeChecked();
        await hoverTitle(page);
        const tooltip = page.locator(SELECTORS.tooltip);
        await expect(tooltip).toBeVisible();
        await expect(tooltip).toContainText('Revenue in USD from internal CRM');
    });

    test('the Always option still applies after a content option', async ({ page }) => {
        await page.locator('label[for="visible-never"]').click();
        await page.locator('label[for="custom-text"]').click();

        // Custom Text applies to the title only, so the captions no longer share a visibility option.
        await expect(page.locator('#visible-never')).not.toBeChecked();
        await expect(page.locator('#visible-always')).not.toBeChecked();

        await page.locator('label[for="visible-always"]').click();
        await expect(page.locator('#visible-always')).toBeChecked();
        await expect(page.locator('#custom-text')).not.toBeChecked();

        // Both captions are visible again, including the subtitle left on 'never'.
        await hoverSubtitle(page);
        const tooltip = page.locator(SELECTORS.tooltip);
        await expect(tooltip).toBeVisible();
        await expect(tooltip).toContainText('Fiscal Year 2025');
    });

    test('tooltip hides when mouse leaves caption', async ({ page }) => {
        await page.locator('label[for="visible-always"]').click();
        await hoverTitle(page);
        const tooltip = page.locator(SELECTORS.tooltip);
        await expect(tooltip).toBeVisible();
        await hoverAway(page);
        await expect(tooltip).not.toBeVisible();
    });
});
