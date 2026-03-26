import type { Page } from '@playwright/test';

import { expect, test } from './fixture';
import {
    SELECTORS,
    canvasToPageTransformer,
    gotoExample,
    readSwapchainText,
    setupIntrinsicAssertions,
    toExamplePageUrl,
} from './util';

async function getScatterCanvasPoint(page: Page, datumIndex = 0): Promise<{ x: number; y: number }> {
    return await page.evaluate((index) => {
        const chartProxy: any = (window as any)?.agE2E?.chart;
        if (!chartProxy) {
            throw new Error('window.agE2E.chart is not defined');
        }
        const chart = chartProxy.chart ?? chartProxy;
        const scatter = chart?.series?.find((series: any) => series.type === 'scatter');
        if (!scatter) {
            throw new Error('Scatter series not found');
        }
        const datum = scatter.contextNodeData?.nodeData?.[index];
        if (!datum) {
            throw new Error(`Scatter datum ${index} not found`);
        }
        if (typeof scatter.toCanvasFromMidPoint !== 'function') {
            throw new Error('scatter.toCanvasFromMidPoint is not a function');
        }
        const point = scatter.toCanvasFromMidPoint(datum);
        if (!point || typeof point.x !== 'number' || typeof point.y !== 'number') {
            throw new Error('Invalid scatter point');
        }
        return point;
    }, datumIndex);
}

test.describe('tooltip', () => {
    setupIntrinsicAssertions(test);

    test.beforeEach(async ({ page }) => {
        await gotoExample(page, toExamplePageUrl('tooltips-test', 'e2e-tooltip-modes', 'vanilla').url);
    });

    test.describe('mode', () => {
        test('single', async ({ page }) => {
            await page.getByText('Single').click();
            await page.mouse.move(400, 150);
            await expect(page).toHaveScreenshot('tooltip-mode-single.png');
        });

        test('shared', async ({ page }) => {
            await page.getByText('Shared').click();
            await page.mouse.move(400, 150);
            await expect(page).toHaveScreenshot('tooltip-mode-shared.png');
        });

        test('compact', async ({ page }) => {
            await page.getByText('Compact').click();
            await page.mouse.move(400, 150);
            await expect(page).toHaveScreenshot('tooltip-mode-compact.png');
        });
    });

    test.skip('nearest tooltip ignores disabled series', async ({ page }) => {
        await gotoExample(page, toExamplePageUrl('tooltips-test', 'e2e-tooltip-nearest', 'vanilla').url);

        const point = await getScatterCanvasPoint(page);
        const toPage = await canvasToPageTransformer(page);
        const hoverPoint = toPage(point.x + 25, point.y);

        await page.mouse.move(Math.round(hoverPoint.x), Math.round(hoverPoint.y));

        const tooltip = page.locator(SELECTORS.tooltip);
        await expect(tooltip).toBeVisible();
        await expect(tooltip).toContainText('Scatter B');
    });

    test.describe('renderer', () => {
        test.beforeEach(async ({ page }) => {
            await gotoExample(page, toExamplePageUrl('tooltips-test', 'e2e-tooltip-renderer', 'vanilla').url);
        });

        test.describe('initial focus', () => {
            test.beforeEach(async ({ page }) => {
                await page.keyboard.press('Tab');
            });
            test('screenshot', async ({ page }) => {
                await expect(page).toHaveScreenshot('tooltip-renderer-initial-focus.png');
            });
            test('aria-label', async ({ page }) => {
                expect(await readSwapchainText(page)).toBe('Jan: 50 units sold; Jan; Purchases; 60');
            });
        });

        test.describe('basic keynav', () => {
            test.beforeEach(async ({ page }) => {
                await page.keyboard.press('Tab');
                await page.keyboard.press('ArrowDown');
                await page.keyboard.press('ArrowRight');
            });
            test('screenshot', async ({ page }) => {
                await expect(page).toHaveScreenshot('tooltip-renderer-basic-keynav.png');
            });
            test('aria-label', async ({ page }) => {
                expect(await readSwapchainText(page)).toBe('Feb: 75 units sold; Feb; Purchases; 70');
            });
        });

        test.describe('partial missing datum', () => {
            test.beforeEach(async ({ page }) => {
                await page.keyboard.press('Tab');
                await page.keyboard.press('ArrowDown');
                await page.keyboard.press('ArrowRight');
                await page.keyboard.press('ArrowRight');
            });
            test('screenshot', async ({ page }) => {
                await expect(page).toHaveScreenshot('tooltip-renderer-partial-missing-datum.png');
            });
            test('aria-label', async ({ page }) => {
                expect(await readSwapchainText(page)).toBe('Mar; Purchases; 90');
            });
        });

        test.describe('completely missing datum', () => {
            test.beforeEach(async ({ page }) => {
                await page.keyboard.press('Tab');
                await page.keyboard.press('ArrowDown');
                await page.keyboard.press('ArrowRight');
                await page.keyboard.press('ArrowRight');
                await page.keyboard.press('ArrowRight');
            });
            test('screenshot', async ({ page }) => {
                await expect(page).toHaveScreenshot('tooltip-renderer-completely-missing-datum.png');
            });
            test('aria-label', async ({ page }) => {
                expect(await readSwapchainText(page)).toBe('May: 45 units sold; May; Purchases; 100');
            });
        });
    });
});
