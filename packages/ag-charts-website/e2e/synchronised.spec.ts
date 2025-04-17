import { expect, test } from './fixture';
import { SELECTORS, gotoExample, setupIntrinsicAssertions, toExamplePageUrls, waitForChartUpdate } from './util';

test.describe('synchronised', () => {
    setupIntrinsicAssertions();

    for (const { framework, url } of toExamplePageUrls('sync-test', 'multi-series-sync')) {
        test.describe(`for ${framework}`, () => {
            test.describe('animation', () => {
                test('should animate on initial load', async ({ page }) => {
                    await gotoExample(page, url, { skipStabilityChecks: true }); // Stability checks wait for animations to complete.

                    const wrappers = page.locator(SELECTORS.wrapper);
                    await expect(wrappers).toHaveCount(2);
                    await expect(wrappers.nth(0)).toHaveAttribute('data-animating', 'true');
                    await expect(wrappers.nth(1)).toHaveAttribute('data-animating', 'true');
                });

                test.skip('should animate on legend toggle', async ({ page }) => {
                    await gotoExample(page, url);
                    const wrappers = page.locator(SELECTORS.wrapper);
                    const legendLocator = page.locator(SELECTORS.legendItems);

                    await expect(legendLocator).toHaveCount(6);
                    // Dependent on data setup:
                    // 1st series has smaller domain in 1st chart vs 2nd chart, so toggling it in 2nd chart animates the 1st chart.
                    // 2nd & 3rd series have similar domains, so toggling them has in one chart has no effect on the other chart.
                    const expectations = [
                        // First chart legend toggles.
                        { chart1Animated: true, chart2Animated: false },
                        { chart1Animated: true, chart2Animated: false },
                        { chart1Animated: true, chart2Animated: false },
                        // Second chart legend toggles.
                        { chart1Animated: true, chart2Animated: true },
                        { chart1Animated: false, chart2Animated: true },
                        { chart1Animated: false, chart2Animated: true },
                    ];

                    const animationOptions = { timeout: 100 }; // Timeout quickly so the animation ending isn't treated as a success for `false` cases.
                    const legendItems = await legendLocator.all();
                    for (let i = 0; i < legendItems.length; i++) {
                        // Toggle the legend item to hide a series.
                        await legendItems[i].hover();
                        await legendItems[i].click();

                        // Check the animation state of the charts.
                        await expect(wrappers.nth(0)).toHaveAttribute(
                            'data-animating',
                            String(expectations[i].chart1Animated),
                            animationOptions
                        );
                        await expect(wrappers.nth(1)).toHaveAttribute(
                            'data-animating',
                            String(expectations[i].chart2Animated),
                            animationOptions
                        );

                        await waitForChartUpdate(wrappers.nth(0));
                        await waitForChartUpdate(wrappers.nth(1));

                        await expect(page).toHaveScreenshot(`legend-toggle-${i}.png`);

                        // Reset the legend state.
                        await legendItems[i].click();

                        // Check the animation state of the charts.
                        await expect(wrappers.nth(0)).toHaveAttribute(
                            'data-animating',
                            String(expectations[i].chart1Animated),
                            animationOptions
                        );
                        await expect(wrappers.nth(1)).toHaveAttribute(
                            'data-animating',
                            String(expectations[i].chart2Animated),
                            animationOptions
                        );

                        await waitForChartUpdate(wrappers.nth(0));
                        await waitForChartUpdate(wrappers.nth(1));
                    }
                });
            });

            test.describe('tooltip', () => {
                test('should replicate tooltip', async ({ page }) => {
                    await gotoExample(page, url);

                    const tooltipLocator = page.locator(SELECTORS.tooltip);

                    await page.keyboard.press('Tab');
                    await expect(tooltipLocator).toHaveCount(2);
                    await expect(tooltipLocator.nth(0)).toBeVisible();
                    await expect(tooltipLocator.nth(1)).toBeVisible();
                    expect(await tooltipLocator.allTextContents()).toMatchObject([
                        'b9.3.0 Time 29ms',
                        'b9.3.0 Time 117ms',
                    ]);

                    await page.keyboard.press('ArrowDown');
                    await expect(tooltipLocator).toHaveCount(2);
                    await expect(tooltipLocator.nth(0)).toBeVisible();
                    await expect(tooltipLocator.nth(1)).toBeVisible();
                    expect(await tooltipLocator.allTextContents()).toMatchObject([
                        'b9.3.0 Heap 176.80MB',
                        'b9.3.0 Heap 178.17MB',
                    ]);

                    await page.keyboard.press('ArrowDown');
                    await expect(tooltipLocator).toHaveCount(2);
                    await expect(tooltipLocator.nth(0)).toBeVisible();
                    await expect(tooltipLocator.nth(1)).toBeVisible();
                    expect(await tooltipLocator.allTextContents()).toMatchObject([
                        'b9.3.0 Canvas 20.14MB',
                        'b9.3.0 Canvas 16.48MB',
                    ]);

                    await page.keyboard.press('ArrowRight');
                    await expect(tooltipLocator).toHaveCount(2);
                    await expect(tooltipLocator.nth(0)).toBeVisible();
                    await expect(tooltipLocator.nth(1)).toBeVisible();
                    expect(await tooltipLocator.allTextContents()).toMatchObject([
                        'b10.0.0 Canvas 20.14MB',
                        'b10.0.0 Canvas 18.31MB',
                    ]);

                    await expect(page).toHaveScreenshot('tooltip-replicated.png');
                });

                test.skip('should not replicate tooltip for hidden series', async ({ page }) => {
                    await gotoExample(page, url);

                    const wrappers = page.locator(SELECTORS.wrapper);
                    const legendLocator = page.locator(SELECTORS.legendItems);
                    const tooltipLocator = page.locator(SELECTORS.tooltip);

                    await legendLocator.nth(3).click(); // Hide the 1st series on the 2nd chart.
                    await waitForChartUpdate(wrappers.nth(0));
                    await waitForChartUpdate(wrappers.nth(1));

                    await page.keyboard.press('Tab');
                    await expect(tooltipLocator).toHaveCount(2);
                    await expect(tooltipLocator.nth(0)).toBeVisible();
                    await expect(tooltipLocator.nth(1)).not.toBeVisible();
                    expect(await tooltipLocator.allTextContents()).toMatchObject(['b9.3.0 Time 29ms']);

                    await expect(page).toHaveScreenshot('tooltip-hidden-series.png');
                });

                test('should not replicate tooltip for missing data', async ({ page }) => {
                    await gotoExample(page, url);

                    const tooltipLocator = page.locator(SELECTORS.tooltip);

                    await page.keyboard.press('Tab');
                    await page.keyboard.press('ArrowRight');
                    await page.keyboard.press('ArrowRight');
                    await page.keyboard.press('ArrowRight');
                    await page.keyboard.press('ArrowRight');
                    await page.keyboard.press('ArrowRight');
                    await page.keyboard.press('ArrowRight');
                    await expect(tooltipLocator).toHaveCount(2);
                    await expect(tooltipLocator.nth(0)).toBeVisible();
                    await expect(tooltipLocator.nth(1)).not.toBeVisible();
                    expect(await tooltipLocator.nth(0).allTextContents()).toMatchObject(['b11.1.0 Time 33ms']);

                    await expect(page).toHaveScreenshot('tooltip-missing-data.png');
                });
            });

            test.describe('crosshair', () => {
                test('should replicate crosshair', async ({ page }) => {
                    await gotoExample(page, url);

                    const crosshairLocator = page.locator(
                        `${SELECTORS.crosshairLabel}[data-key="yKey"] .ag-charts-crosshair-label-content`
                    );

                    await page.keyboard.press('Tab');
                    await page.keyboard.press('ArrowDown'); // Force 2nd set of y-axis crosshairs to render
                    await page.keyboard.press('ArrowUp'); // 1st series.
                    await expect(crosshairLocator).toHaveCount(4);

                    await expect(crosshairLocator.nth(0)).toBeVisible();
                    await expect(crosshairLocator.nth(1)).not.toBeVisible();
                    await expect(crosshairLocator.nth(2)).toBeVisible();
                    await expect(crosshairLocator.nth(3)).not.toBeVisible();
                    expect((await crosshairLocator.allTextContents()).map((t) => t.trim())).toMatchObject([
                        '29ms',
                        expect.anything(), // Skip invisible axis.
                        '117ms',
                        expect.anything(), // Skip invisible axis.
                    ]);

                    await page.keyboard.press('ArrowDown'); // 2nd series, different y-axis.
                    await expect(crosshairLocator.nth(0)).not.toBeVisible();
                    await expect(crosshairLocator.nth(1)).toBeVisible();
                    await expect(crosshairLocator.nth(2)).not.toBeVisible();
                    await expect(crosshairLocator.nth(3)).toBeVisible();
                    expect((await crosshairLocator.allTextContents()).map((t) => t.trim())).toMatchObject([
                        expect.anything(), // Skip invisible axis.
                        '176.80MB',
                        expect.anything(), // Skip invisible axis.
                        '178.17MB',
                    ]);

                    await page.keyboard.press('ArrowDown'); // 3rd series.
                    await expect(crosshairLocator.nth(0)).not.toBeVisible();
                    await expect(crosshairLocator.nth(1)).toBeVisible();
                    await expect(crosshairLocator.nth(2)).not.toBeVisible();
                    await expect(crosshairLocator.nth(3)).toBeVisible();
                    expect((await crosshairLocator.allTextContents()).map((t) => t.trim())).toMatchObject([
                        expect.anything(), // Skip invisible axis.
                        '196.94MB',
                        expect.anything(), // Skip invisible axis.
                        '194.65MB',
                    ]);

                    await page.keyboard.press('ArrowRight'); // 3rd series, 2nd datum.
                    await expect(crosshairLocator.nth(0)).not.toBeVisible();
                    await expect(crosshairLocator.nth(1)).toBeVisible();
                    await expect(crosshairLocator.nth(2)).not.toBeVisible();
                    await expect(crosshairLocator.nth(3)).toBeVisible();
                    expect((await crosshairLocator.allTextContents()).map((t) => t.trim())).toMatchObject([
                        expect.anything(), // Skip invisible axis.
                        '205.42MB',
                        expect.anything(), // Skip invisible axis.
                        '204.92MB',
                    ]);

                    await expect(page).toHaveScreenshot('crosshair-replicated.png');
                });

                test.skip('should not replicate crosshair for hidden series', async ({ page }) => {
                    await gotoExample(page, url);

                    const wrappers = page.locator(SELECTORS.wrapper);
                    const legendLocator = page.locator(SELECTORS.legendItems);
                    const crosshairLocator = page.locator(
                        `${SELECTORS.crosshairLabel}[data-key="yKey"] .ag-charts-crosshair-label-content`
                    );

                    await legendLocator.nth(3).click(); // Hide the 1st series on the 2nd chart.
                    await waitForChartUpdate(wrappers.nth(0));
                    await waitForChartUpdate(wrappers.nth(1));

                    await page.keyboard.press('Tab');
                    await page.keyboard.press('ArrowDown'); // Force 2nd set of y-axis crosshairs to render
                    await page.keyboard.press('ArrowUp'); // 1st series.

                    await expect(crosshairLocator).toHaveCount(4);
                    await expect(crosshairLocator.nth(0)).toBeVisible();
                    await expect(crosshairLocator.nth(1)).not.toBeVisible();
                    await expect(crosshairLocator.nth(2)).not.toBeVisible();
                    await expect(crosshairLocator.nth(3)).not.toBeVisible();
                    expect((await crosshairLocator.allTextContents()).map((t) => t.trim())).toMatchObject([
                        '29ms',
                        expect.anything(), // Skip invisible axis.
                        expect.anything(), // Skip invisible axis.
                        expect.anything(), // Skip invisible axis.
                    ]);
                    await expect(page).toHaveScreenshot('crosshair-hidden-data.png');
                });

                test('should not replicate crosshair for missing data', async ({ page }) => {
                    await gotoExample(page, url);

                    const crosshairLocator = page.locator(
                        `${SELECTORS.crosshairLabel}[data-key="yKey"] .ag-charts-crosshair-label-content`
                    );

                    await page.keyboard.press('Tab');
                    await page.keyboard.press('ArrowDown'); // Force 2nd set of y-axis crosshairs to render
                    await page.keyboard.press('ArrowUp'); // 1st series.
                    await page.keyboard.press('ArrowRight');
                    await page.keyboard.press('ArrowRight');
                    await page.keyboard.press('ArrowRight');
                    await page.keyboard.press('ArrowRight');
                    await page.keyboard.press('ArrowRight');
                    await page.keyboard.press('ArrowRight'); // 1st series, 7th datum.

                    await expect(crosshairLocator).toHaveCount(4);
                    await expect(crosshairLocator.nth(0)).toBeVisible();
                    await expect(crosshairLocator.nth(1)).not.toBeVisible();
                    await expect(crosshairLocator.nth(2)).not.toBeVisible();
                    await expect(crosshairLocator.nth(3)).not.toBeVisible();
                    expect((await crosshairLocator.allTextContents()).map((t) => t.trim())).toMatchObject([
                        '33ms',
                        expect.anything(), // Skip invisible axis.
                        expect.anything(), // Skip invisible axis.
                        expect.anything(), // Skip invisible axis.
                    ]);
                    await expect(page).toHaveScreenshot('crosshair-missing-data-1.png');

                    await page.keyboard.press('ArrowDown'); // 2nd series.
                    await expect(crosshairLocator).toHaveCount(4);
                    await expect(crosshairLocator.nth(0)).not.toBeVisible();
                    await expect(crosshairLocator.nth(1)).toBeVisible();
                    await expect(crosshairLocator.nth(2)).not.toBeVisible();
                    await expect(crosshairLocator.nth(3)).not.toBeVisible();
                    expect((await crosshairLocator.allTextContents()).map((t) => t.trim())).toMatchObject([
                        expect.anything(), // Skip invisible axis.
                        '144.94MB',
                        expect.anything(), // Skip invisible axis.
                        expect.anything(), // Skip invisible axis.
                    ]);
                    await expect(page).toHaveScreenshot('crosshair-missing-data-2.png');
                });
            });
        });
    }
});
