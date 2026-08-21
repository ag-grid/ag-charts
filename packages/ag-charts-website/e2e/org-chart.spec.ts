import type { Page } from '@playwright/test';

import { expect, test } from './fixture';
import { expectChartScreenshot } from './scene-capture';
import {
    SELECTORS,
    canvasToPageTransformer,
    createConsoleLogs,
    delay,
    gotoExample,
    hoverCanvas,
    locateCanvas,
    setupIntrinsicAssertions,
    toExamplePageUrl,
    toExamplePageUrls,
} from './util';

test.describe('organization-series', () => {
    setupIntrinsicAssertions(test);

    test.describe('collapse', () => {
        const consoleLogs = createConsoleLogs();

        for (const { framework, url } of toExamplePageUrls('org-chart-e2e', 'e2e-org-chart-collapse')) {
            test.describe(`for ${framework}`, () => {
                test('collapse only on expander click', async ({ page }) => {
                    await gotoExample(page, url);

                    const point = await canvasToPageTransformer(page);

                    // Henry VII
                    const node = point(348 + 51, 94 + 24);
                    const expander = point(348 + 51, 94 + 36);

                    await expectChartScreenshot(page, page, 'org-chart-initial.png', { animations: 'disabled' });

                    // Should not collapse on click node
                    await page.mouse.click(node.x, node.y);
                    await expectChartScreenshot(page, page, 'org-chart-node-click.png', { animations: 'disabled' });

                    // Should collapse on click expander
                    await page.mouse.click(expander.x, expander.y);
                    await expectChartScreenshot(page, page, 'org-chart-expander-click.png', { animations: 'disabled' });
                });
            });
        }

        // Flaky: org-chart-prevent-default screenshot drifts intermittently. Skipped until a
        // proper fix lands (see https://github.com/ag-grid/ag-charts/pull/7448).
        test.skip('collapsedChange event', async ({ page }) => {
            const { url } = toExamplePageUrl('org-chart-e2e', 'e2e-org-chart-collapse', 'vanilla');
            await gotoExample(page, url);

            const point = await canvasToPageTransformer(page);

            const henry7 = point(348 + 51, 94 + 36);
            const henry7After = point(321 + 78, 257 + 72 - 22);
            const henry8 = point(87 + 245 - 8, 167 + 16 + 36);

            // Should allow default collapse behaviour
            await page.mouse.click(henry7.x, henry7.y);
            await delay(100); // Small delay to allow focus highlight to update
            await expectChartScreenshot(page, page, 'org-chart-allow-default.png', { animations: 'disabled' });

            // Should log the event.collapsed items
            expect(consoleLogs.getLogs()).toEqual(
                expect.arrayContaining([
                    JSON.stringify([
                        {
                            itemId: 'Henry VII',
                            datum: {
                                name: 'Henry VII',
                                years: '1457 - 1509',
                                reign: 'King 1485 - 1509',
                                parentId: null,
                            },
                        },
                    ]),
                ])
            );
            consoleLogs.clear();

            // Expand to reset to initial
            await page.mouse.click(henry7After.x, henry7After.y);
            await delay(100); // Small delay to allow focus highlight to update
            consoleLogs.clear();

            // Should prevent default collapse behaviour
            await page.mouse.click(henry8.x, henry8.y);
            await delay(100); // Small delay to allow focus highlight to update
            await expectChartScreenshot(page, page, 'org-chart-prevent-default.png', { animations: 'disabled' });

            // Should log the event.collapsed items
            expect(consoleLogs.getLogs()).toEqual(
                expect.arrayContaining([
                    JSON.stringify([
                        {
                            itemId: 'Henry VIII',
                            datum: {
                                name: 'Henry VIII',
                                years: '1491 - 1547',
                                reign: 'King 1509 - 1547',
                                parent: 'Henry VII',
                            },
                        },
                    ]),
                ])
            );
            consoleLogs.clear();
        });
    });

    test.describe('active-node', () => {
        const ACTIVE_ITEM_ID = 'Priya Nair';

        /**
         * Empty space *inside* the series area: the band above the topmost card once the view has
         * centred on the active item. A miss outside the series rect — the caption band, or the
         * padding at the canvas edges — produces no pick at all, so it would not exercise the
         * unhighlight.
         */
        const EMPTY_SERIES_AREA_Y = 90;

        /**
         * Both halves of the feature land in a page screenshot: the highlight stroke on the card in
         * the canvas, and the tooltip in the DOM beside it. The tooltip assertion is kept as the
         * synchronisation point, since it retries where a screenshot of a chart mid-update would
         * only be re-taken until it happened to settle.
         */
        async function expectActiveItemTooltip(page: Page, visible: boolean) {
            const tooltip = page.locator(SELECTORS.tooltip);
            if (!visible) {
                await expect(tooltip).toBeHidden();
                return;
            }
            await expect(tooltip).toBeVisible();
            await expect(tooltip).toContainText(ACTIVE_ITEM_ID);
        }

        test.beforeEach(async ({ page }) => {
            await gotoExample(page, toExamplePageUrl('org-chart-e2e', 'e2e-org-chart-active-node', 'vanilla').url);
        });

        test('setState highlights the active node and shows its tooltip', async ({ page }) => {
            await expectActiveItemTooltip(page, false);
            await expectChartScreenshot(page, page, 'org-chart-active-node-initial.png', { animations: 'disabled' });

            await page.locator('#mySetActive').click();

            await expectActiveItemTooltip(page, true);
            await expectChartScreenshot(page, page, 'org-chart-active-node-set.png', { animations: 'disabled' });
        });

        test('clearing the active item removes the highlight and tooltip', async ({ page }) => {
            await page.locator('#mySetActive').click();
            await expectActiveItemTooltip(page, true);

            await page.locator('#myClearActive').click();

            await expectActiveItemTooltip(page, false);
            await expectChartScreenshot(page, page, 'org-chart-active-node-cleared.png', { animations: 'disabled' });
        });

        test('hovering empty space drops the highlight and tooltip', async ({ page }) => {
            await page.locator('#mySetActive').click();
            await expectActiveItemTooltip(page, true);

            const { width } = await locateCanvas(page);
            await hoverCanvas(page, { x: width / 2, y: EMPTY_SERIES_AREA_Y });

            // A pointer that picks nothing unhighlights on `highlightManager.unhighlightDelay`, so
            // wait for the tooltip to go before capturing the repaint that same clear triggers.
            await expectActiveItemTooltip(page, false);
            await expectChartScreenshot(page, page, 'org-chart-active-node-hover-empty.png', {
                animations: 'disabled',
            });
        });
    });
});
