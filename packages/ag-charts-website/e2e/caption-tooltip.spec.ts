import { expect, test } from './fixture';
import { SELECTORS, canvasToPageTransformer, gotoExample, setupIntrinsicAssertions, toExamplePageUrl } from './util';

test.describe('caption tooltip', () => {
    setupIntrinsicAssertions(test);

    test.beforeEach(async ({ page }) => {
        await gotoExample(page, toExamplePageUrl('layout-test', 'e2e-caption-tooltip', 'vanilla').url);
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
        await page.locator('#visible-always').click();
        await hoverTitle(page);
        const tooltip = page.locator(SELECTORS.tooltip);
        await expect(tooltip).toBeVisible();
        await expect(tooltip).toContainText('Quarterly Revenue');
    });

    test('visible: always shows subtitle tooltip on hover', async ({ page }) => {
        await page.locator('#visible-always').click();
        await hoverSubtitle(page);
        const tooltip = page.locator(SELECTORS.tooltip);
        await expect(tooltip).toBeVisible();
        await expect(tooltip).toContainText('Fiscal Year 2025');
    });

    test('visible: never hides tooltip even when truncated', async ({ page }) => {
        await page.locator('#truncate').click();
        await page.locator('#visible-never').click();
        await hoverTitle(page);
        const tooltip = page.locator(SELECTORS.tooltip);
        await expect(tooltip).not.toBeVisible();
    });

    test('custom text shows on hover', async ({ page }) => {
        await page.locator('#custom-text').click();
        await hoverTitle(page);
        const tooltip = page.locator(SELECTORS.tooltip);
        await expect(tooltip).toBeVisible();
        await expect(tooltip).toContainText('Revenue in USD from internal CRM');
    });

    test('renderer shows HTML content', async ({ page }) => {
        await page.locator('#renderer').click();
        await hoverTitle(page);
        const tooltip = page.locator(SELECTORS.tooltip);
        await expect(tooltip).toBeVisible();
        await expect(tooltip).toContainText('Source: Internal CRM');
    });

    test('empty renderer hides tooltip', async ({ page }) => {
        await page.locator('#empty-renderer').click();
        await hoverTitle(page);
        const tooltip = page.locator(SELECTORS.tooltip);
        await expect(tooltip).not.toBeVisible();
    });

    test('auto mode shows tooltip when truncated', async ({ page }) => {
        await page.locator('#truncate').click();
        await hoverTitle(page);
        const tooltip = page.locator(SELECTORS.tooltip);
        await expect(tooltip).toBeVisible();
        await expect(tooltip).toContainText('Quarterly Revenue');
    });

    test('tooltip hides when mouse leaves caption', async ({ page }) => {
        await page.locator('#visible-always').click();
        await hoverTitle(page);
        const tooltip = page.locator(SELECTORS.tooltip);
        await expect(tooltip).toBeVisible();
        await hoverAway(page);
        await expect(tooltip).not.toBeVisible();
    });
});
