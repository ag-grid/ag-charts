import { expect, test } from './fixture';
import {
    SELECTORS,
    expectAnimationOccurred,
    getAnimationTime,
    gotoExample,
    setupIntrinsicAssertions,
    toExamplePageUrl,
    toExamplePageUrls,
    waitForAllChartUpdates,
    waitForChartUpdate,
} from './util';

// Timeout to wait for delayed tooltip/crosshair removal (100ms delay + 50ms buffer)
const DELAYED_REMOVAL_TIMEOUT = 150;

test.describe('synchronised', () => {
    // Some tests are flaky due to a race between page load and animations firing.
    test.describe.configure({ retries: 3 });

    setupIntrinsicAssertions(test);

    test.describe('for single-series charts', () => {
        const { url } = toExamplePageUrl('sync-test', 'single-series-sync', 'vanilla');

        test.describe('animation', () => {
            test('should animate on initial load', async ({ page }) => {
                await gotoExample(page, url); // Let animations complete

                const wrappers = page.locator(SELECTORS.wrapper);
                await expect(wrappers).toHaveCount(3);

                // Verify that animations occurred by checking cumulative animation time
                await expectAnimationOccurred(wrappers.nth(0));
                await expectAnimationOccurred(wrappers.nth(1));
                await expectAnimationOccurred(wrappers.nth(2));
            });
        });

        test.describe('tooltip', () => {
            test('should replicate tooltip', async ({ page }) => {
                await gotoExample(page, url);

                const tooltipLocator = page.locator(SELECTORS.tooltip);

                await page.keyboard.press('Tab');
                await waitForAllChartUpdates(page);
                await expect(tooltipLocator).toHaveCount(3);
                await expect(tooltipLocator.nth(0)).toBeVisible();
                await expect(tooltipLocator.nth(1)).toBeVisible();
                await expect(tooltipLocator.nth(2)).toBeVisible();
                expect(await tooltipLocator.allTextContents()).toMatchObject([
                    'b9.3.0 Time 29ms',
                    'b9.3.0 Heap 0.02KB',
                    'b9.3.0 Canvas 0.02KB',
                ]);

                await page.keyboard.press('ArrowRight');
                await waitForAllChartUpdates(page);
                await expect(tooltipLocator).toHaveCount(3);
                await expect(tooltipLocator.nth(0)).toBeVisible();
                await expect(tooltipLocator.nth(1)).toBeVisible();
                await expect(tooltipLocator.nth(2)).toBeVisible();
                expect(await tooltipLocator.allTextContents()).toMatchObject([
                    'b10.0.0 Time 37ms',
                    'b10.0.0 Heap 0.02KB',
                    'b10.0.0 Canvas 0.02KB',
                ]);

                await expect(page).toHaveScreenshot('single-tooltip-replicated.png');
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
                await waitForAllChartUpdates(page);
                await expect(tooltipLocator).toHaveCount(3);
                await expect(tooltipLocator.nth(0)).toBeVisible();
                await expect(tooltipLocator.nth(1)).not.toBeVisible();
                await expect(tooltipLocator.nth(2)).not.toBeVisible();
                expect(await tooltipLocator.nth(0).allTextContents()).toMatchObject(['b11.1.0 Time 33ms']);

                await expect(page).toHaveScreenshot('single-tooltip-missing-data.png');
            });
        });

        test.describe('crosshair', () => {
            test('should replicate crosshair', async ({ page }) => {
                await gotoExample(page, url);

                const crosshairLocator = page.locator(
                    `${SELECTORS.crosshairLabel}[data-key="yKey"] .ag-charts-crosshair-label-content`
                );

                await page.keyboard.press('Tab');
                await waitForAllChartUpdates(page);
                await expect(crosshairLocator).toHaveCount(3);

                await expect(crosshairLocator.nth(0)).toBeVisible();
                await expect(crosshairLocator.nth(1)).toBeVisible();
                await expect(crosshairLocator.nth(2)).toBeVisible();
                expect((await crosshairLocator.allTextContents()).map((t) => t.trim())).toMatchObject([
                    '29ms',
                    '0.02KB',
                    '0.02KB',
                ]);

                await page.keyboard.press('ArrowRight'); // 2nd datum.
                await waitForAllChartUpdates(page);
                await expect(crosshairLocator.nth(0)).toBeVisible();
                await expect(crosshairLocator.nth(1)).toBeVisible();
                await expect(crosshairLocator.nth(2)).toBeVisible();
                expect((await crosshairLocator.allTextContents()).map((t) => t.trim())).toMatchObject([
                    '37ms',
                    '0.02KB',
                    '0.02KB',
                ]);

                await expect(page).toHaveScreenshot('single-crosshair-replicated.png');
            });

            test('should not replicate crosshair for missing data', async ({ page }) => {
                await gotoExample(page, url);

                const crosshairLocator = page.locator(
                    `${SELECTORS.crosshairLabel}[data-key="yKey"] .ag-charts-crosshair-label-content`
                );

                await page.keyboard.press('Tab');
                await page.keyboard.press('ArrowRight');
                await page.keyboard.press('ArrowRight');
                await page.keyboard.press('ArrowRight');
                await page.keyboard.press('ArrowRight');
                await page.keyboard.press('ArrowRight');
                await page.keyboard.press('ArrowRight'); // 7th datum.
                await waitForAllChartUpdates(page);

                await expect(crosshairLocator).toHaveCount(3);
                await expect(crosshairLocator.nth(0)).toBeVisible();
                await expect(crosshairLocator.nth(1)).not.toBeVisible();
                await expect(crosshairLocator.nth(2)).not.toBeVisible();
                expect((await crosshairLocator.allTextContents()).map((t) => t.trim())).toMatchObject([
                    '33ms',
                    expect.anything(), // Skip invisible axis.
                    expect.anything(), // Skip invisible axis.
                ]);
                await expect(page).toHaveScreenshot('single-crosshair-missing-data-1.png');
            });
        });
    });

    for (const example of ['multi-series-sync', 'multi-series-horizontal-sync']) {
        test.describe(`for ${example.replace('-sync', '')} with secondary axes`, () => {
            for (const { framework, url } of toExamplePageUrls('sync-test', example)) {
                test.describe(`for ${framework}`, () => {
                    test.describe('animation', () => {
                        test('should animate on initial load', async ({ page }) => {
                            await gotoExample(page, url); // Let animations complete

                            const wrappers = page.locator(SELECTORS.wrapper);
                            await expect(wrappers).toHaveCount(2);

                            // Verify that animations occurred by checking cumulative animation time
                            await expectAnimationOccurred(wrappers.nth(0));
                            await expectAnimationOccurred(wrappers.nth(1));
                        });

                        test.skip('should animate on legend toggle', async ({ page }) => {
                            await gotoExample(page, url);
                            const wrapper1 = page.locator(`#myChart1 ${SELECTORS.wrapper}`);
                            const wrapper2 = page.locator(`#myChart2 ${SELECTORS.wrapper}`);
                            const legendItems1 = page.locator(`#myChart1 ${SELECTORS.legendItems}`);
                            const legendItems2 = page.locator(`#myChart2 ${SELECTORS.legendItems}`);

                            await expect(legendItems1).toHaveCount(3);
                            await expect(legendItems2).toHaveCount(3);

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

                            const legendItems = [...(await legendItems1.all()), ...(await legendItems2.all())];
                            for (let i = 0; i < legendItems.length; i++) {
                                // Record animation time before toggle
                                const animTime1Before = await getAnimationTime(wrapper1);
                                const animTime2Before = await getAnimationTime(wrapper2);

                                // Toggle the legend item to hide a series.
                                await legendItems[i].hover();
                                await legendItems[i].click();

                                await waitForChartUpdate(wrapper1);
                                await waitForChartUpdate(wrapper2);

                                // Check if animation occurred based on expectations
                                const animTime1After = await getAnimationTime(wrapper1);
                                const animTime2After = await getAnimationTime(wrapper2);

                                if (expectations[i].chart1Animated) {
                                    expect(animTime1After).toBeGreaterThan(animTime1Before);
                                } else {
                                    expect(animTime1After).toEqual(animTime1Before);
                                }

                                if (expectations[i].chart2Animated) {
                                    expect(animTime2After).toBeGreaterThan(animTime2Before);
                                } else {
                                    expect(animTime2After).toEqual(animTime2Before);
                                }

                                await expect(page).toHaveScreenshot(`${example}-legend-toggle-${i}.png`);

                                // Reset the legend state.
                                await legendItems[i].click();

                                await waitForChartUpdate(wrapper1);
                                await waitForChartUpdate(wrapper2);
                            }
                        });
                    });

                    test.describe('tooltip', () => {
                        test('should replicate tooltip', async ({ page }) => {
                            await gotoExample(page, url);

                            const tooltipLocator = page.locator(SELECTORS.tooltip);

                            await page.keyboard.press('Tab');
                            await waitForAllChartUpdates(page);
                            await expect(tooltipLocator).toHaveCount(2);
                            await expect(tooltipLocator.nth(0)).toBeVisible();
                            await expect(tooltipLocator.nth(1)).toBeVisible();
                            expect(await tooltipLocator.allTextContents()).toMatchObject([
                                'b9.3.0 Time 29ms',
                                'b9.3.0 Time 117ms',
                            ]);

                            await page.keyboard.press('ArrowDown');
                            await waitForAllChartUpdates(page);
                            await expect(tooltipLocator).toHaveCount(2);
                            await expect(tooltipLocator.nth(0)).toBeVisible();
                            await expect(tooltipLocator.nth(1)).toBeVisible();
                            expect(await tooltipLocator.allTextContents()).toMatchObject([
                                'b9.3.0 Heap 176.80MB',
                                'b9.3.0 Heap 178.17MB',
                            ]);

                            await page.keyboard.press('ArrowDown');
                            await waitForAllChartUpdates(page);
                            await expect(tooltipLocator).toHaveCount(2);
                            await expect(tooltipLocator.nth(0)).toBeVisible();
                            await expect(tooltipLocator.nth(1)).toBeVisible();
                            expect(await tooltipLocator.allTextContents()).toMatchObject([
                                'b9.3.0 Canvas 20.14MB',
                                'b9.3.0 Canvas 16.48MB',
                            ]);

                            await page.keyboard.press('ArrowRight');
                            await waitForAllChartUpdates(page);
                            await expect(tooltipLocator).toHaveCount(2);
                            await expect(tooltipLocator.nth(0)).toBeVisible();
                            await expect(tooltipLocator.nth(1)).toBeVisible();
                            expect(await tooltipLocator.allTextContents()).toMatchObject([
                                'b10.0.0 Canvas 20.14MB',
                                'b10.0.0 Canvas 18.31MB',
                            ]);

                            await expect(page).toHaveScreenshot(`${example}-tooltip-replicated.png`);
                        });

                        test('should not replicate tooltip for hidden series', async ({ page }) => {
                            await gotoExample(page, url);

                            const legendLocator = page.locator(SELECTORS.legendItems);
                            const tooltipLocator = page.locator(SELECTORS.tooltip);

                            await legendLocator.nth(3).click(); // Hide the 1st series on the 2nd chart.
                            await waitForAllChartUpdates(page);

                            await page.keyboard.press('Shift+Tab');
                            await page.keyboard.press('Shift+Tab');
                            await page.keyboard.press('Shift+Tab');
                            await waitForAllChartUpdates(page);
                            await expect(tooltipLocator).toHaveCount(2);
                            await expect(tooltipLocator.nth(0)).toBeVisible();
                            await expect(tooltipLocator.nth(1)).not.toBeVisible();
                            expect(await tooltipLocator.allTextContents()).toMatchObject([
                                'b9.3.0 Time 29ms',
                                expect.anything(), // Skip invisible tooltip.
                            ]);

                            await expect(page).toHaveScreenshot(`${example}-tooltip-hidden-series.png`);
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
                            await waitForAllChartUpdates(page);
                            await expect(tooltipLocator).toHaveCount(2);
                            await expect(tooltipLocator.nth(0)).toBeVisible();
                            await expect(tooltipLocator.nth(1)).not.toBeVisible();
                            expect(await tooltipLocator.nth(0).allTextContents()).toMatchObject(['b11.1.0 Time 33ms']);

                            await expect(page).toHaveScreenshot(`${example}-tooltip-missing-data.png`);
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
                            await waitForAllChartUpdates(page);
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
                            await waitForAllChartUpdates(page);
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
                            await waitForAllChartUpdates(page);
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
                            await waitForAllChartUpdates(page);
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

                            await expect(page).toHaveScreenshot(`${example}-crosshair-replicated.png`);
                        });

                        test('should not replicate crosshair for hidden series', async ({ page }) => {
                            await gotoExample(page, url);

                            const legendLocator = page.locator(SELECTORS.legendItems);
                            const crosshairLocator = page.locator(
                                `${SELECTORS.crosshairLabel}[data-key="yKey"] .ag-charts-crosshair-label-content`
                            );

                            await legendLocator.nth(3).click(); // Hide the 1st series on the 2nd chart.
                            await waitForAllChartUpdates(page);

                            await page.keyboard.press('Shift+Tab');
                            await page.keyboard.press('Shift+Tab');
                            await page.keyboard.press('Shift+Tab');
                            await page.keyboard.press('ArrowDown'); // Force 2nd set of y-axis crosshairs to render
                            await page.keyboard.press('ArrowUp'); // 1st series.
                            await waitForAllChartUpdates(page);

                            await expect(crosshairLocator).toHaveCount(3);
                            await expect(crosshairLocator.nth(0)).toBeVisible();
                            await expect(crosshairLocator.nth(1)).not.toBeVisible();
                            await expect(crosshairLocator.nth(2)).not.toBeVisible();
                            expect((await crosshairLocator.allTextContents()).map((t) => t.trim())).toMatchObject([
                                '29ms',
                                expect.anything(), // Skip invisible axis.
                                // No 3rd axis (left axis on 2nd chart) is disabled due to no active series.
                                expect.anything(), // Skip invisible axis.
                            ]);
                            await expect(page).toHaveScreenshot(`${example}-crosshair-hidden-data.png`);
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
                            await waitForAllChartUpdates(page);

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
                            await expect(page).toHaveScreenshot(`${example}-crosshair-missing-data-1.png`);

                            await page.keyboard.press('ArrowDown'); // 2nd series.
                            await waitForAllChartUpdates(page);
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
                            await expect(page).toHaveScreenshot(`${example}-crosshair-missing-data-2.png`);
                        });
                    });
                });
            }
        });
    }

    test.describe('for multi-series with matching keys', () => {
        const { url } = toExamplePageUrl('sync-test', 'multi-series-implicit-key-sync', 'vanilla');
        test.describe('animation', () => {
            test('should animate on initial load', async ({ page }) => {
                await gotoExample(page, url); // Let animations complete

                const wrappers = page.locator(SELECTORS.wrapper);
                await expect(wrappers).toHaveCount(3);

                // Verify that animations occurred by checking cumulative animation time
                await expectAnimationOccurred(wrappers.nth(0));
                await expectAnimationOccurred(wrappers.nth(1));
                await expectAnimationOccurred(wrappers.nth(2));
            });
        });

        test.describe('tooltip', () => {
            test('should replicate tooltip', async ({ page }) => {
                await gotoExample(page, url);

                const tooltipLocator = page.locator(SELECTORS.tooltip);

                await page.keyboard.press('Tab');
                await page.keyboard.press('ArrowDown'); // Activate tooltips on all charts so they are present.
                await page.keyboard.press('ArrowUp');
                await waitForAllChartUpdates(page);
                await page.waitForTimeout(DELAYED_REMOVAL_TIMEOUT);
                await expect(tooltipLocator).toHaveCount(3);
                await expect(tooltipLocator.nth(0)).toBeVisible();
                await expect(tooltipLocator.nth(1)).not.toBeVisible();
                await expect(tooltipLocator.nth(2)).toBeVisible();
                expect(await tooltipLocator.allTextContents()).toMatchObject([
                    'b9.3.0 Time 29.4',
                    expect.anything(), // Skip invisible tooltip.
                    'b9.3.0 Time 11.2',
                ]);

                await page.keyboard.press('ArrowDown');
                await waitForAllChartUpdates(page);
                await page.waitForTimeout(DELAYED_REMOVAL_TIMEOUT);
                await expect(tooltipLocator).toHaveCount(3);
                await expect(tooltipLocator.nth(0)).toBeVisible();
                await expect(tooltipLocator.nth(1)).toBeVisible();
                await expect(tooltipLocator.nth(2)).not.toBeVisible();
                expect(await tooltipLocator.allTextContents()).toMatchObject([
                    'b9.3.0 Heap 18',
                    'b9.3.0 Heap 18',
                    expect.anything(), // Skip invisible tooltip.
                ]);

                await page.keyboard.press('Tab');
                await page.waitForTimeout(DELAYED_REMOVAL_TIMEOUT);
                await page.keyboard.press('Tab');
                await waitForAllChartUpdates(page);
                await expect(tooltipLocator).toHaveCount(3);
                await expect(tooltipLocator.nth(0)).toBeVisible();
                await expect(tooltipLocator.nth(1)).toBeVisible();
                await expect(tooltipLocator.nth(2)).not.toBeVisible();
                expect(await tooltipLocator.allTextContents()).toMatchObject([
                    'b9.3.0 Heap 18',
                    'b9.3.0 Heap 18',
                    expect.anything(), // Skip invisible tooltip.
                ]);

                await page.keyboard.press('ArrowDown');
                await waitForAllChartUpdates(page);
                await expect(tooltipLocator).toHaveCount(3);
                await expect(tooltipLocator.nth(0)).not.toBeVisible();
                await expect(tooltipLocator.nth(1)).toBeVisible();
                await expect(tooltipLocator.nth(2)).toBeVisible();
                expect(await tooltipLocator.allTextContents()).toMatchObject([
                    expect.anything(), // Skip invisible tooltip.
                    'b9.3.0 Canvas 17',
                    'b9.3.0 Canvas 17',
                ]);

                await page.keyboard.press('Tab');
                await page.waitForTimeout(DELAYED_REMOVAL_TIMEOUT);
                await page.keyboard.press('Tab');
                await waitForAllChartUpdates(page);
                await expect(tooltipLocator).toHaveCount(3);
                await expect(tooltipLocator.nth(0)).toBeVisible();
                await expect(tooltipLocator.nth(1)).not.toBeVisible();
                await expect(tooltipLocator.nth(2)).toBeVisible();
                expect(await tooltipLocator.allTextContents()).toMatchObject([
                    'b9.3.0 Time 29.4',
                    expect.anything(), // Skip invisible tooltip.
                    'b9.3.0 Time 11.2',
                ]);

                await page.keyboard.press('ArrowDown');
                await waitForAllChartUpdates(page);
                await expect(tooltipLocator).toHaveCount(3);
                await expect(tooltipLocator.nth(0)).not.toBeVisible();
                await expect(tooltipLocator.nth(1)).toBeVisible();
                await expect(tooltipLocator.nth(2)).toBeVisible();
                expect(await tooltipLocator.allTextContents()).toMatchObject([
                    expect.anything(), // Skip invisible tooltip.
                    'b9.3.0 Canvas 17',
                    'b9.3.0 Canvas 17',
                ]);

                await expect(page).toHaveScreenshot('multi-key-tooltip-replicated.png');
            });

            test('should not replicate tooltip for hidden series', async ({ page }) => {
                await gotoExample(page, url);

                const tooltipLocator = page.locator(SELECTORS.tooltip);

                await page.keyboard.press('Tab');
                await page.keyboard.press('Tab');
                await page.keyboard.press('Tab');
                await page.keyboard.press('Tab');
                await page.keyboard.press('Space'); // Hide the 1st series on the 2nd chart.
                await waitForAllChartUpdates(page);

                await page.keyboard.press('Shift+Tab');
                await page.keyboard.press('Shift+Tab');
                await page.keyboard.press('Shift+Tab');
                await page.keyboard.press('ArrowDown');
                await waitForAllChartUpdates(page);
                await expect(tooltipLocator).toHaveCount(3);
                await expect(tooltipLocator.nth(0)).toBeVisible();
                await expect(tooltipLocator.nth(1)).not.toBeVisible();
                await expect(tooltipLocator.nth(2)).not.toBeVisible();
                expect(await tooltipLocator.allTextContents()).toMatchObject([
                    'b9.3.0 Heap 18',
                    expect.anything(), // Skip invisible tooltip.
                    expect.anything(), // Skip invisible tooltip.
                ]);

                await expect(page).toHaveScreenshot('multi-key-tooltip-hidden-series.png');
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
                await waitForAllChartUpdates(page);
                await expect(tooltipLocator).toHaveCount(3);
                await expect(tooltipLocator.nth(0)).toBeVisible();
                await expect(tooltipLocator.nth(1)).not.toBeVisible();
                await expect(tooltipLocator.nth(2)).not.toBeVisible();
                expect(await tooltipLocator.nth(0).allTextContents()).toMatchObject(['b11.1.0 Time 32.8']);

                await expect(page).toHaveScreenshot('multi-key-tooltip-missing-data.png');
            });
        });

        test.describe('crosshair', () => {
            test('should replicate crosshair', async ({ page }) => {
                await gotoExample(page, url);

                const crosshairLocator = page.locator(
                    `${SELECTORS.crosshairLabel}[data-key="yKey"] .ag-charts-crosshair-label-content`
                );

                await page.keyboard.press('Tab');
                await page.keyboard.press('ArrowDown'); // Force all crosshairs to render
                await page.keyboard.press('ArrowUp'); // 1st series.
                await waitForAllChartUpdates(page);
                await page.waitForTimeout(DELAYED_REMOVAL_TIMEOUT);
                await expect(crosshairLocator).toHaveCount(3);

                await expect(crosshairLocator.nth(0)).toBeVisible();
                await expect(crosshairLocator.nth(1)).not.toBeVisible();
                await expect(crosshairLocator.nth(2)).toBeVisible();
                expect((await crosshairLocator.allTextContents()).map((t) => t.trim())).toMatchObject([
                    '29.4',
                    expect.anything(), // Skip invisible axis.
                    '11.2',
                ]);

                await page.keyboard.press('ArrowDown'); // 2nd series.
                await waitForAllChartUpdates(page);
                await page.waitForTimeout(DELAYED_REMOVAL_TIMEOUT);
                await expect(crosshairLocator.nth(0)).toBeVisible();
                await expect(crosshairLocator.nth(1)).toBeVisible();
                await expect(crosshairLocator.nth(2)).not.toBeVisible();
                expect((await crosshairLocator.allTextContents()).map((t) => t.trim())).toMatchObject([
                    '18',
                    '18',
                    expect.anything(), // Skip invisible axis.
                ]);

                await expect(page).toHaveScreenshot('multi-key-crosshair-replicated.png');
            });

            test('should not replicate crosshair for hidden series', async ({ page }) => {
                await gotoExample(page, url);

                const crosshairLocator = page.locator(
                    `${SELECTORS.crosshairLabel}[data-key="yKey"] .ag-charts-crosshair-label-content`
                );

                await page.keyboard.press('Tab');
                await page.keyboard.press('Tab');
                await page.keyboard.press('Tab');
                await page.keyboard.press('Tab');
                await page.keyboard.press('Space'); // Hide the 1st series on the 2nd chart.
                await waitForAllChartUpdates(page);

                await page.keyboard.press('Shift+Tab');
                await page.keyboard.press('Shift+Tab');
                await page.keyboard.press('Shift+Tab');

                await page.keyboard.press('ArrowDown'); // 2nd series.
                await waitForAllChartUpdates(page);

                await expect(crosshairLocator).toHaveCount(3);
                await expect(crosshairLocator.nth(0)).toBeVisible();
                await expect(crosshairLocator.nth(1)).not.toBeVisible();
                await expect(crosshairLocator.nth(2)).not.toBeVisible();
                expect((await crosshairLocator.allTextContents()).map((t) => t.trim())).toMatchObject([
                    '18',
                    expect.anything(), // Skip invisible axis.
                    expect.anything(), // Skip invisible axis.
                ]);
                await expect(page).toHaveScreenshot('multi-key-crosshair-hidden-data.png');
            });

            test('should not replicate crosshair for missing data', async ({ page }) => {
                await gotoExample(page, url);

                const crosshairLocator = page.locator(
                    `${SELECTORS.crosshairLabel}[data-key="yKey"] .ag-charts-crosshair-label-content`
                );

                await page.keyboard.press('Tab');
                await page.keyboard.press('ArrowDown'); // Force all crosshairs to render
                await page.keyboard.press('ArrowUp'); // 1st series.
                await page.keyboard.press('ArrowRight');
                await page.keyboard.press('ArrowRight');
                await page.keyboard.press('ArrowRight');
                await page.keyboard.press('ArrowRight');
                await page.keyboard.press('ArrowRight');
                await page.keyboard.press('ArrowRight'); // 1st series, 7th datum.
                await waitForAllChartUpdates(page);

                await expect(crosshairLocator).toHaveCount(3);
                await expect(crosshairLocator.nth(0)).toBeVisible();
                await expect(crosshairLocator.nth(1)).not.toBeVisible();
                await expect(crosshairLocator.nth(2)).not.toBeVisible();
                expect((await crosshairLocator.allTextContents()).map((t) => t.trim())).toMatchObject([
                    '32.8',
                    expect.anything(), // Skip invisible axis.
                    expect.anything(), // Skip invisible axis.
                ]);
                await expect(page).toHaveScreenshot('multi-key-crosshair-missing-data-1.png');

                await page.keyboard.press('ArrowDown'); // 2nd series.
                await waitForAllChartUpdates(page);
                await expect(crosshairLocator).toHaveCount(3);
                await expect(crosshairLocator.nth(0)).toBeVisible();
                await expect(crosshairLocator.nth(1)).not.toBeVisible();
                await expect(crosshairLocator.nth(2)).not.toBeVisible();
                expect((await crosshairLocator.allTextContents()).map((t) => t.trim())).toMatchObject([
                    '15',
                    expect.anything(), // Skip invisible axis.
                    expect.anything(), // Skip invisible axis.
                ]);
                await expect(page).toHaveScreenshot('multi-key-crosshair-missing-data-2.png');
            });
        });
    });

    test.describe('for mixed-series with some matching keys', () => {
        const { url } = toExamplePageUrl('sync-test', 'mixed-series-sync', 'vanilla');
        test.describe('animation', () => {
            test('should animate on initial load', async ({ page }) => {
                await gotoExample(page, url); // Let animations complete

                const wrappers = page.locator(SELECTORS.wrapper);
                await expect(wrappers).toHaveCount(3);

                // Verify that animations occurred by checking cumulative animation time
                await expectAnimationOccurred(wrappers.nth(0));
                await expectAnimationOccurred(wrappers.nth(1));
                await expectAnimationOccurred(wrappers.nth(2));
            });
        });

        test.describe('tooltip', () => {
            test('should replicate tooltip', async ({ page }) => {
                await gotoExample(page, url);

                const tooltipLocator = page.locator(SELECTORS.tooltip);

                await page.keyboard.press('Tab');
                await page.keyboard.press('ArrowDown'); // Activate tooltips on all charts so they are present.
                await page.keyboard.press('ArrowUp');
                await waitForAllChartUpdates(page);
                await page.waitForTimeout(DELAYED_REMOVAL_TIMEOUT);
                await expect(tooltipLocator).toHaveCount(3);
                await expect(tooltipLocator.nth(0)).toBeVisible();
                await expect(tooltipLocator.nth(1)).not.toBeVisible();
                await expect(tooltipLocator.nth(2)).toBeVisible();
                expect(await tooltipLocator.allTextContents()).toMatchObject([
                    'b9.3.0 Time 29.4',
                    expect.anything(), // Skip invisible tooltip.
                    'b9.3.0 Time 11.2',
                ]);

                await page.keyboard.press('ArrowDown');
                await waitForAllChartUpdates(page);
                await page.waitForTimeout(DELAYED_REMOVAL_TIMEOUT);
                await expect(tooltipLocator).toHaveCount(3);
                await expect(tooltipLocator.nth(0)).toBeVisible();
                await expect(tooltipLocator.nth(1)).toBeVisible();
                await expect(tooltipLocator.nth(2)).not.toBeVisible();
                expect(await tooltipLocator.allTextContents()).toMatchObject([
                    'b9.3.0 Heap 18',
                    'b9.3.0 Heap 18',
                    expect.anything(), // Skip invisible tooltip.
                ]);

                await page.keyboard.press('Tab');
                await page.waitForTimeout(DELAYED_REMOVAL_TIMEOUT);
                await page.keyboard.press('Tab');
                await waitForAllChartUpdates(page);
                await expect(tooltipLocator).toHaveCount(3);
                await expect(tooltipLocator.nth(0)).toBeVisible();
                await expect(tooltipLocator.nth(1)).toBeVisible();
                await expect(tooltipLocator.nth(2)).not.toBeVisible();
                expect(await tooltipLocator.allTextContents()).toMatchObject([
                    'b9.3.0 Heap 18',
                    'b9.3.0 Heap 18',
                    expect.anything(), // Skip invisible tooltip.
                ]);

                await page.keyboard.press('ArrowDown');
                await waitForAllChartUpdates(page);
                await expect(tooltipLocator).toHaveCount(3);
                await expect(tooltipLocator.nth(0)).not.toBeVisible();
                await expect(tooltipLocator.nth(1)).toBeVisible();
                await expect(tooltipLocator.nth(2)).not.toBeVisible();
                expect(await tooltipLocator.allTextContents()).toMatchObject([
                    expect.anything(), // Skip invisible tooltip.
                    'b9.3.0 Canvas 17',
                    expect.anything(), // Skip invisible tooltip.
                ]);

                await page.keyboard.press('Tab');
                await page.waitForTimeout(DELAYED_REMOVAL_TIMEOUT);
                await page.keyboard.press('Tab');
                await waitForAllChartUpdates(page);
                await expect(tooltipLocator).toHaveCount(3);
                await expect(tooltipLocator.nth(0)).toBeVisible();
                await expect(tooltipLocator.nth(1)).not.toBeVisible();
                await expect(tooltipLocator.nth(2)).toBeVisible();
                expect(await tooltipLocator.allTextContents()).toMatchObject([
                    'b9.3.0 Time 29.4',
                    expect.anything(), // Skip invisible tooltip.
                    'b9.3.0 Time 11.2',
                ]);

                await expect(page).toHaveScreenshot('mixed-key-tooltip-replicated.png');
            });

            test('should not replicate tooltip for hidden series', async ({ page }) => {
                await gotoExample(page, url);

                const tooltipLocator = page.locator(SELECTORS.tooltip);

                await page.keyboard.press('Tab');
                await page.keyboard.press('Tab');
                await page.keyboard.press('Tab');
                await page.keyboard.press('Tab');
                await page.keyboard.press('Space'); // Hide the 1st series on the 2nd chart.
                await waitForAllChartUpdates(page);

                await page.keyboard.press('Shift+Tab');
                await page.keyboard.press('Shift+Tab');
                await page.keyboard.press('Shift+Tab');
                await page.keyboard.press('ArrowDown');
                await waitForAllChartUpdates(page);
                await expect(tooltipLocator).toHaveCount(3);
                await expect(tooltipLocator.nth(0)).toBeVisible();
                await expect(tooltipLocator.nth(1)).not.toBeVisible();
                await expect(tooltipLocator.nth(2)).not.toBeVisible();
                expect(await tooltipLocator.allTextContents()).toMatchObject([
                    'b9.3.0 Heap 18',
                    expect.anything(), // Skip invisible tooltip.
                    expect.anything(), // Skip invisible tooltip.
                ]);

                await expect(page).toHaveScreenshot('mixed-key-tooltip-hidden-series.png');
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
                await waitForAllChartUpdates(page);
                await expect(tooltipLocator).toHaveCount(3);
                await expect(tooltipLocator.nth(0)).toBeVisible();
                await expect(tooltipLocator.nth(1)).not.toBeVisible();
                await expect(tooltipLocator.nth(2)).not.toBeVisible();
                expect(await tooltipLocator.nth(0).allTextContents()).toMatchObject(['b11.1.0 Time 32.8']);

                await expect(page).toHaveScreenshot('mixed-key-tooltip-missing-data.png');
            });
        });

        test.describe('crosshair', () => {
            test('should replicate crosshair', async ({ page }) => {
                await gotoExample(page, url);

                const crosshairLocator = page.locator(
                    `${SELECTORS.crosshairLabel}[data-key="yKey"] .ag-charts-crosshair-label-content`
                );

                await page.keyboard.press('Tab');
                await page.keyboard.press('ArrowDown'); // Force all crosshairs to render
                await page.keyboard.press('ArrowUp'); // 1st series.
                await waitForAllChartUpdates(page);
                await page.waitForTimeout(DELAYED_REMOVAL_TIMEOUT);
                await expect(crosshairLocator).toHaveCount(3);

                await expect(crosshairLocator.nth(0)).toBeVisible();
                await expect(crosshairLocator.nth(1)).not.toBeVisible();
                await expect(crosshairLocator.nth(2)).toBeVisible();
                expect((await crosshairLocator.allTextContents()).map((t) => t.trim())).toMatchObject([
                    '29.4',
                    expect.anything(), // Skip invisible axis.
                    '11.2',
                ]);

                await page.keyboard.press('ArrowDown'); // 2nd series.
                await waitForAllChartUpdates(page);
                await page.waitForTimeout(DELAYED_REMOVAL_TIMEOUT);
                await expect(crosshairLocator.nth(0)).toBeVisible();
                await expect(crosshairLocator.nth(1)).toBeVisible();
                await expect(crosshairLocator.nth(2)).not.toBeVisible();
                expect((await crosshairLocator.allTextContents()).map((t) => t.trim())).toMatchObject([
                    '18',
                    '18',
                    expect.anything(), // Skip invisible axis.
                ]);

                await expect(page).toHaveScreenshot('mixed-key-crosshair-replicated.png');
            });

            test('should not replicate crosshair for hidden series', async ({ page }) => {
                await gotoExample(page, url);

                const crosshairLocator = page.locator(
                    `${SELECTORS.crosshairLabel}[data-key="yKey"] .ag-charts-crosshair-label-content`
                );

                await page.keyboard.press('Tab');
                await page.keyboard.press('Tab');
                await page.keyboard.press('Tab');
                await page.keyboard.press('Tab');
                await page.keyboard.press('Space'); // Hide the 1st series on the 2nd chart.
                await waitForAllChartUpdates(page);

                await page.keyboard.press('Shift+Tab');
                await page.keyboard.press('Shift+Tab');
                await page.keyboard.press('Shift+Tab');

                await page.keyboard.press('ArrowDown'); // 2nd series.
                await waitForAllChartUpdates(page);

                await expect(crosshairLocator).toHaveCount(3);
                await expect(crosshairLocator.nth(0)).toBeVisible();
                await expect(crosshairLocator.nth(1)).not.toBeVisible();
                await expect(crosshairLocator.nth(2)).not.toBeVisible();
                expect((await crosshairLocator.allTextContents()).map((t) => t.trim())).toMatchObject([
                    '18',
                    expect.anything(), // Skip invisible axis.
                    expect.anything(), // Skip invisible axis.
                ]);
                await expect(page).toHaveScreenshot('mixed-key-crosshair-hidden-data.png');
            });

            test('should not replicate crosshair for missing data', async ({ page }) => {
                await gotoExample(page, url);

                const crosshairLocator = page.locator(
                    `${SELECTORS.crosshairLabel}[data-key="yKey"] .ag-charts-crosshair-label-content`
                );

                await page.keyboard.press('Tab');
                await page.keyboard.press('ArrowDown'); // Force all crosshairs to render
                await page.keyboard.press('ArrowUp'); // 1st series.
                await page.keyboard.press('ArrowRight');
                await page.keyboard.press('ArrowRight');
                await page.keyboard.press('ArrowRight');
                await page.keyboard.press('ArrowRight');
                await page.keyboard.press('ArrowRight');
                await page.keyboard.press('ArrowRight'); // 1st series, 7th datum.
                await waitForAllChartUpdates(page);

                await expect(crosshairLocator).toHaveCount(3);
                await expect(crosshairLocator.nth(0)).toBeVisible();
                await expect(crosshairLocator.nth(1)).not.toBeVisible();
                await expect(crosshairLocator.nth(2)).not.toBeVisible();
                expect((await crosshairLocator.allTextContents()).map((t) => t.trim())).toMatchObject([
                    '32.8',
                    expect.anything(), // Skip invisible axis.
                    expect.anything(), // Skip invisible axis.
                ]);
                await expect(page).toHaveScreenshot('mixed-key-crosshair-missing-data-1.png');

                await page.keyboard.press('ArrowDown'); // 2nd series.
                await waitForAllChartUpdates(page);
                await expect(crosshairLocator).toHaveCount(3);
                await expect(crosshairLocator.nth(0)).toBeVisible();
                await expect(crosshairLocator.nth(1)).not.toBeVisible();
                await expect(crosshairLocator.nth(2)).not.toBeVisible();
                expect((await crosshairLocator.allTextContents()).map((t) => t.trim())).toMatchObject([
                    '15',
                    expect.anything(), // Skip invisible axis.
                    expect.anything(), // Skip invisible axis.
                ]);
                await expect(page).toHaveScreenshot('mixed-key-crosshair-missing-data-2.png');
            });
        });
    });

    test.describe('for financial charts', () => {
        const { url } = toExamplePageUrl('sync-test', 'financial-charts-sync', 'vanilla');
        test.describe('tooltip', () => {
            test('should not replicate tooltip', async ({ page }) => {
                await gotoExample(page, url);

                const tooltipLocator = page.locator(SELECTORS.tooltip);

                await page.keyboard.press('Tab');
                await page.keyboard.press('ArrowDown'); // Activate tooltips on all charts so they are present.
                await page.keyboard.press('ArrowUp');
                await waitForAllChartUpdates(page);
                await expect(tooltipLocator).toHaveCount(4);
                await expect(tooltipLocator.nth(0)).not.toBeVisible();
                await expect(tooltipLocator.nth(1)).not.toBeVisible();
                await expect(tooltipLocator.nth(2)).not.toBeVisible();
                await expect(tooltipLocator.nth(3)).not.toBeVisible();

                await expect(page).toHaveScreenshot('financial-charts-tooltip-not-replicated.png');
            });
        });

        test.describe('crosshair', () => {
            test('should replicate crosshair', async ({ page }) => {
                await gotoExample(page, url);

                const crosshairLocator = page.locator(`${SELECTORS.crosshairLabel} .ag-charts-crosshair-label-content`);

                await page.keyboard.press('Tab');
                await waitForAllChartUpdates(page);
                await expect(crosshairLocator).toHaveCount(4);

                await expect(crosshairLocator.nth(0)).toBeVisible();
                await expect(crosshairLocator.nth(1)).toBeVisible();
                await expect(crosshairLocator.nth(2)).toBeVisible();
                await expect(crosshairLocator.nth(3)).toBeVisible();
                expect((await crosshairLocator.allTextContents()).map((t) => t.trim())).toMatchObject([
                    'Jan 2022',
                    'Jan 2022',
                    'Jan 2022',
                    'Jan 2022',
                ]);

                await page.keyboard.press('ArrowRight');
                await page.keyboard.press('ArrowRight');
                await page.keyboard.press('ArrowRight');
                await page.keyboard.press('ArrowRight');
                await page.keyboard.press('ArrowRight');
                await page.keyboard.press('ArrowRight');
                await page.keyboard.press('ArrowRight');
                await page.keyboard.press('ArrowRight');
                await page.keyboard.press('ArrowRight');
                await page.keyboard.press('ArrowRight');
                await page.keyboard.press('ArrowRight');
                await page.keyboard.press('ArrowRight');
                await waitForAllChartUpdates(page);

                await expect(crosshairLocator.nth(0)).toBeVisible();
                await expect(crosshairLocator.nth(1)).toBeVisible();
                await expect(crosshairLocator.nth(2)).toBeVisible();
                await expect(crosshairLocator.nth(3)).toBeVisible();
                expect((await crosshairLocator.allTextContents()).map((t) => t.trim())).toMatchObject([
                    'Jan 2023',
                    'Jan 2023',
                    'Jan 2023',
                    'Jan 2023',
                ]);

                await expect(page).toHaveScreenshot('financial-charts-crosshair-replicated.png');

                await page.keyboard.press('ArrowDown');
                await waitForAllChartUpdates(page);

                await expect(page).toHaveScreenshot('financial-charts-crosshair-replicated-2.png');
            });
        });

        test.describe('zoom', () => {
            test('should replicate candlestick zoom', async ({ page }) => {
                await gotoExample(page, url);

                const focusIndicator = page.locator(SELECTORS.focusIndicator);

                await page.keyboard.press('Tab');
                for (let i = 0; i < 40; i++) {
                    await page.keyboard.press('+');
                    await waitForAllChartUpdates(page);
                }
                await page.keyboard.press('ArrowDown');

                const focusBox = focusIndicator.first();
                await expect(focusBox).toBeVisible();
                await expect(focusBox.boundingBox().then((b) => b?.height)).resolves.toBeLessThan(250);

                await expect(page).toHaveScreenshot('financial-charts-zoomed-in.png');
            });
        });
    });
});
