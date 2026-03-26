import { Locator } from '@playwright/test';

import { expect, test } from './fixture';
import {
    SELECTORS,
    gotoExample,
    setupIntrinsicAssertions,
    toExamplePageUrls,
    waitForAllChartUpdates,
    waitForChartUpdate,
} from './util';

type RenewablesScreenshotsFilename =
    | 'renewables-nothing-highlighted.png'
    | 'renewables-onshore-wind-highlighted.png'
    | 'renewables-offshore-wind-highlighted.png'
    | 'renewables-landfill-gas-highlighted.png';

test.describe('legend', () => {
    setupIntrinsicAssertions(test);

    for (const { framework, url } of toExamplePageUrls('accessibility-test', 'keyboard-navigation-with-highlight')) {
        test.describe(`for ${framework}`, () => {
            test('AG-16449 focus replay does not reapply hover highlight', async ({ page }) => {
                await gotoExample(page, url);
                const canvasCenter = page.locator(SELECTORS.canvasCenter);
                const legendItem = page.locator(SELECTORS.legendItems).first();
                const focusTarget = page.locator('#above-chart');

                // Toggle the series off and back on again so the legend item keeps focus.
                await legendItem.click();
                await waitForAllChartUpdates(page);
                await legendItem.click();
                await waitForAllChartUpdates(page);

                // Ensure hover highlight is applied before moving away.
                await legendItem.hover();
                await expect(canvasCenter).toHaveScreenshot('renewables-onshore-wind-highlighted.png');

                // Move the pointer away to clear hover highlight.
                await focusTarget.hover();
                await expect(canvasCenter).toHaveScreenshot('renewables-nothing-highlighted.png');

                // Focus replay (e.g. tab switch) should not reapply hover highlight.
                await focusTarget.focus();
                await legendItem.focus();
                await expect(canvasCenter).toHaveScreenshot('renewables-nothing-highlighted.png');
            });

            test('mouse hovering updates highlight', async ({ page }) => {
                await gotoExample(page, url);
                const canvasCenter = page.locator(SELECTORS.canvasCenter);
                const legendItems = await page.locator(SELECTORS.legendItems).all();

                await legendItems[0].hover();
                await expect(canvasCenter).toHaveScreenshot('renewables-onshore-wind-highlighted.png');

                await legendItems[1].hover();
                await expect(canvasCenter).toHaveScreenshot('renewables-offshore-wind-highlighted.png');

                await legendItems[2].hover();
                await expect(canvasCenter).toHaveScreenshot('renewables-landfill-gas-highlighted.png');
            });

            test('AG-13025 hovering ignored on hidden buttons', async ({ page }) => {
                await gotoExample(page, url);
                const canvasCenter = page.locator(SELECTORS.canvasCenter);

                const expectedChanged: { dx: number; file: RenewablesScreenshotsFilename }[] = [
                    { dx: 0, file: 'renewables-nothing-highlighted.png' },
                    { dx: 5, file: 'renewables-onshore-wind-highlighted.png' },
                    { dx: 105, file: 'renewables-nothing-highlighted.png' },
                    { dx: 125, file: 'renewables-offshore-wind-highlighted.png' },
                    { dx: 225, file: 'renewables-nothing-highlighted.png' },
                    { dx: 240, file: 'renewables-landfill-gas-highlighted.png' },
                ];
                let i = 0;

                const legendItems = await page.locator(SELECTORS.legendItems).all();
                const bbox0 = await legendItems[0].boundingBox();
                expect(bbox0).not.toBeNull();
                const startX = bbox0!.x - 5;
                const startY = bbox0!.y + bbox0!.height / 2;
                for (let dx = 0; dx < 300; dx += 5) {
                    const nextDx = expectedChanged[i + 1]?.dx ?? Infinity;
                    if (dx >= nextDx) i++;

                    await page.mouse.move(startX + dx, startY);
                    await expect(canvasCenter).toHaveScreenshot(expectedChanged[i].file);
                }
            });
        });
    }

    for (const { framework, url } of toExamplePageUrls('legend-test', 'legend-item-name')) {
        test.describe(`for ${framework}`, () => {
            test('mouse hovering shared legend items updates highlight for all linked series', async ({ page }) => {
                await gotoExample(page, url);
                const canvasCenter = page.locator(SELECTORS.canvasCenter);
                const legendItems = await page.locator(SELECTORS.legendItems).all();

                await legendItems[0].hover();
                await expect(canvasCenter).toHaveScreenshot('shared-legend-items-Q1-highlighted.png');

                await legendItems[1].hover();
                await expect(canvasCenter).toHaveScreenshot('shared-legend-items-Q2-highlighted.png');

                await legendItems[2].hover();
                await expect(canvasCenter).toHaveScreenshot('shared-legend-items-Q3-highlighted.png');

                await legendItems[3].hover();
                await expect(canvasCenter).toHaveScreenshot('shared-legend-items-Q4-highlighted.png');
            });
        });
    }

    for (const { framework, url } of toExamplePageUrls('legend-test', 'legend-item-key')) {
        test.describe(`for ${framework}`, () => {
            test('mouse hovering shared legend items for single series updates highlight for all linked items', async ({
                page,
            }) => {
                await gotoExample(page, url);
                const canvasCenter = page.locator(SELECTORS.canvasCenter);
                const legendItems = await page.locator(SELECTORS.legendItems).all();

                await legendItems[0].hover();
                await expect(canvasCenter).toHaveScreenshot('shared-legend-items-android-highlighted.png');

                await legendItems[1].hover();
                await expect(canvasCenter).toHaveScreenshot('shared-legend-items-ios-highlighted.png');

                await legendItems[2].hover();
                await expect(canvasCenter).toHaveScreenshot('shared-legend-items-blackberry-highlighted.png');

                await legendItems[3].hover();
                await expect(canvasCenter).toHaveScreenshot('shared-legend-items-symbian-highlighted.png');

                await legendItems[4].hover();
                await expect(canvasCenter).toHaveScreenshot('shared-legend-items-bada-highlighted.png');

                await legendItems[5].hover();
                await expect(canvasCenter).toHaveScreenshot('shared-legend-items-windows-highlighted.png');
            });
        });
    }

    for (const { framework, url } of toExamplePageUrls('legend-test', 'legend-interactivity')) {
        test.describe(`for ${framework}`, () => {
            test('AG-16027 legend remains interactive across paginated pages when toggling is disabled', async ({
                page,
            }) => {
                await gotoExample(page, url);

                const canvasCenter = page.locator(SELECTORS.canvasCenter);
                const paginationButtons = page.locator('.ag-charts-proxy-legend-pagination button');
                const getInteractiveLegendItem = (index: number): Locator =>
                    page.locator(`${SELECTORS.legendItems}:not([aria-disabled="true"])`).nth(index);

                await expect(paginationButtons).toHaveCount(2);
                const paginationPreviousButton = paginationButtons.first();
                const paginationNextButton = paginationButtons.nth(1);

                const expectLegendItemInteractive = async (legendItem: Locator) => {
                    await legendItem.hover();
                    await expect.poll(() => legendItem.evaluate((el) => getComputedStyle(el).cursor)).toBe('pointer');

                    const dialogPromise = page.waitForEvent('dialog');
                    const clickPromise = legendItem.click();
                    const dialog = await dialogPromise;
                    expect(dialog.message()).toBe('legend clicked');
                    await dialog.accept();
                    await clickPromise;
                    await waitForAllChartUpdates(page);
                };

                const expectInteractivePageState = async (screenshot: string, itemIndex: number) => {
                    await expect(canvasCenter).toHaveScreenshot(screenshot);
                    await expectLegendItemInteractive(getInteractiveLegendItem(itemIndex));
                };

                await expectInteractivePageState('legend-interactivity-page1.png', 1);

                await paginationNextButton.click();
                await waitForAllChartUpdates(page);
                await expectInteractivePageState('legend-interactivity-page2.png', 0);

                await paginationPreviousButton.click();
                await waitForAllChartUpdates(page);
                await expectInteractivePageState('legend-interactivity-page1-return.png', 1);
            });
        });
    }

    for (const { framework, url } of toExamplePageUrls('legend-test', 'legend-pagination-resize')) {
        test.describe(`for ${framework}`, () => {
            test('AG-16038 Legend Pagination goes to wrong page after resize hides and shows legend', async ({
                page,
            }) => {
                await gotoExample(page, url);
                const chartWrapper = page.locator('.ag-charts-wrapper');
                const canvasCenter = page.locator(SELECTORS.canvasCenter);

                // Set initial size that should show legend with pagination
                await page.setViewportSize({ width: 400, height: 250 });
                await waitForChartUpdate(chartWrapper);

                // Initial state with legend showing page 1
                await expect(canvasCenter).toHaveScreenshot('ag-16038-initial-page-1.png');

                // Locate the pagination buttons
                const previousButton = page.locator('.ag-charts-proxy-legend-pagination button').first();
                const nextButton = page.locator('.ag-charts-proxy-legend-pagination button').last();

                // Verify pagination is working - advance to page 2
                await nextButton.click();
                await waitForChartUpdate(chartWrapper);
                await expect(canvasCenter).toHaveScreenshot('ag-16038-legend-page-2-after-click.png');

                // Verify pagination is working - go back to page 1
                await previousButton.click();
                await waitForChartUpdate(chartWrapper);
                await expect(canvasCenter).toHaveScreenshot('ag-16038-legend-back-to-page-1-after-click.png');

                // Resize to very small width to hide legend
                await page.setViewportSize({ width: 230, height: 250 });
                await waitForChartUpdate(chartWrapper);
                await expect(canvasCenter).toHaveScreenshot('ag-16038-small-size-hidden-legend.png');

                // Resize back to normal width - legend should reappear
                await page.setViewportSize({ width: 400, height: 250 });
                await waitForChartUpdate(chartWrapper);
                await expect(canvasCenter).toHaveScreenshot('ag-16038-legend-should-reset-to-page-1.png');

                // Verify pagination is working - advance to page 2
                const next = page.locator('.ag-charts-proxy-legend-pagination button').last();
                await next.click();
                await waitForChartUpdate(chartWrapper);
                await expect(canvasCenter).toHaveScreenshot(
                    'ag-16038-legend-page-2-after-resize-hide-unhide-click.png'
                );
            });
        });
    }
});
