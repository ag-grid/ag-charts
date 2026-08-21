import type { Locator, Page } from '@playwright/test';

import type { AgInitialFocus } from 'ag-charts-types';

import { expect, test } from './fixture';
import { expectChartScreenshot } from './scene-capture';
import {
    SELECTORS,
    gotoExample,
    readSwapchainText,
    repeat,
    setupIntrinsicAssertions,
    toExamplePageUrl,
    toExamplePageUrls,
} from './util';

test.describe('keyboard-nav', () => {
    setupIntrinsicAssertions(test);

    for (const { framework, url } of toExamplePageUrls('accessibility', 'keyboard-navigation')) {
        test.describe(`for ${framework}`, () => {
            test('basic keyboard navigation', async ({ page }) => {
                await gotoExample(page, url);

                await page.locator('input').first().click();

                // Tab into chart, 1st series + 1st datum should be highlighted.
                await page.keyboard.press('Tab');
                await expectChartScreenshot(page, page.locator(SELECTORS.canvasCenter), '1st-datum-focus.png');

                // Move to 3rd datum, then 2nd series.
                await page.keyboard.press('ArrowRight');
                await page.keyboard.press('ArrowRight');
                await page.keyboard.press('ArrowDown');
                await expectChartScreenshot(
                    page,
                    page.locator(SELECTORS.canvasCenter),
                    '3rd-datum-2nd-series-focus.png'
                );

                // Move to legend items.
                await page.keyboard.press('Tab');
                await expectChartScreenshot(page, page.locator(SELECTORS.canvasCenter), 'legend-focus.png');

                // Move to 2nd page of legend items.
                await page.keyboard.press('ArrowRight');
                await page.keyboard.press('ArrowRight');
                await page.keyboard.press('ArrowRight');
                await page.keyboard.press('ArrowRight');
                await expectChartScreenshot(page, page.locator(SELECTORS.canvasCenter), 'legend-2nd-page-focus.png');

                // Move to page back control.
                await page.keyboard.press('Tab');
                await expectChartScreenshot(
                    page,
                    page.locator(SELECTORS.canvasCenter),
                    'legend-page-control-focus.png'
                );

                // Tab outside of chart.
                await page.keyboard.press('Tab');
                await page.keyboard.press('Tab');
                await expectChartScreenshot(page, page.locator(SELECTORS.canvasCenter), 'tabbed-out-of-chart.png');

                // Tab back into chart.
                await page.keyboard.press('Shift+Tab');
                await expectChartScreenshot(page, page.locator(SELECTORS.canvasCenter), 'tabbed-back-into-chart.png');
            });
        });
    }

    test("CRT-1155 Tab from a datum to that same series' legend item clears item dimming", async ({ page }) => {
        // Unlike 'basic keyboard navigation' above, this stays within the first series so the
        // datum-level -> series-level transition happens on one and the same series.
        await gotoExample(page, toExamplePageUrl('accessibility', 'keyboard-navigation', 'vanilla').url);

        await page.locator('input').first().click();

        // Tab into the chart and move along the first series only.
        await page.keyboard.press('Tab');
        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('ArrowRight');

        // Tab to the legend, whose first item is the series we were just navigating.
        await page.keyboard.press('Tab');
        await expect(page.locator(SELECTORS.legendItems).first()).toBeFocused();

        // Expected: 'Onshore Wind' at full opacity, the other five dimmed by `unhighlightedSeries` —
        // i.e. identical to the 'legend-focus.png' baseline.
        await expectChartScreenshot(
            page,
            page.locator(SELECTORS.canvasCenter),
            'CRT-1155-legend-focus-same-series.png'
        );
    });

    test('Home/End keys', async ({ page }) => {
        await gotoExample(page, toExamplePageUrl('accessibility', 'keyboard-navigation', 'vanilla').url);

        await page.locator('input').first().click();
        await page.keyboard.press('Tab');
        await expectChartScreenshot(page, page.locator(SELECTORS.canvasCenter), '1st-datum-focus.png');

        await page.keyboard.press('End');
        await expectChartScreenshot(page, page.locator(SELECTORS.canvasCenter), 'last-datum-focus.png');

        await page.keyboard.press('Home');
        await expectChartScreenshot(page, page.locator(SELECTORS.canvasCenter), '1st-datum-focus.png');
    });

    test('Home/End keys (with viewport support)', async ({ page }) => {
        await gotoExample(page, toExamplePageUrl('large-dataset-interactivity', 'ordered-data', 'vanilla').url);

        await page.mouse.click(400, 300);
        await page.keyboard.press('ArrowLeft');
        await repeat(20, async () => await page.keyboard.down('+'));

        await page.keyboard.press('End');
        await expectChartScreenshot(page, page.locator(SELECTORS.canvasCenter), 'large-dataset-end-focus.png');

        await page.keyboard.press('Home');
        await expectChartScreenshot(page, page.locator(SELECTORS.canvasCenter), 'large-dataset-home-focus.png');
    });

    test('keyboard nav ignores highlight-disabled series', async ({ page }) => {
        await gotoExample(
            page,
            toExamplePageUrl('accessibility-e2e', 'keyboard-navigation-highlight-disabled-series', 'vanilla').url
        );

        const canvasCenter = page.locator(SELECTORS.canvasCenter);
        await page.locator('input').first().click();

        await page.keyboard.press('Tab');
        await expectChartScreenshot(page, canvasCenter, 'highlight-disabled-series-focus.png');

        await page.keyboard.press('ArrowDown');
        await expectChartScreenshot(page, canvasCenter, 'highlight-disabled-series-other-series-focus.png');
    });

    test('AG-13051 kbm hover combo', async ({ page }) => {
        await gotoExample(page, toExamplePageUrl('accessibility', 'keyboard-navigation', 'vanilla').url);

        await page.locator('input').first().click();

        await page.mouse.move(547, 310);
        await expectChartScreenshot(
            page,
            page.locator(SELECTORS.canvasCenter),
            '4th-datum-2nd-series-nofocus-highlight.png'
        );

        await page.mouse.click(547, 310, { button: 'left' });
        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('ArrowDown');
        await expectChartScreenshot(page, page.locator(SELECTORS.canvasCenter), '3rd-datum-2nd-series-focus.png');

        await page.mouse.move(547, 310);
        await expectChartScreenshot(
            page,
            page.locator(SELECTORS.canvasCenter),
            '3rd-datum-2nd-series-focus-4th-datum-2nd-series-highlight.png'
        );

        await page.mouse.move(613, 217);
        await expectChartScreenshot(
            page,
            page.locator(SELECTORS.canvasCenter),
            '3rd-datum-2nd-series-focus-nohighlight.png'
        );

        await page.keyboard.press('ArrowDown');
        await expectChartScreenshot(
            page,
            page.locator(SELECTORS.canvasCenter),
            '3rd-datum-3rd-series-focus-highlight.png'
        );

        await page.mouse.move(547, 310);
        await page.mouse.click(547, 310, { button: 'left' });
        await expectChartScreenshot(
            page,
            page.locator(SELECTORS.canvasCenter),
            'nofocus-4th-datum-2nd-series-highlight.png'
        );

        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('ArrowLeft');
        await expectChartScreenshot(
            page,
            page.locator(SELECTORS.canvasCenter),
            '3rd-datum-3rd-series-focus-highlight.png'
        );

        await page.mouse.click(100, 100, { button: 'left' });
        await expectChartScreenshot(page, page.locator(SELECTORS.canvasCenter), 'nofocus-nohighlight.png');
    });

    test('AG-13643 legend toggling', async ({ page }) => {
        await gotoExample(page, toExamplePageUrl('line-series', 'simple-line', 'vanilla').url);

        await page.mouse.click(400, 300, { button: 'left' });

        await page.keyboard.press('Tab');
        await expectChartScreenshot(page, page.locator(SELECTORS.canvasCenter), 'AG-13643-legend-item-1-focused.png');

        await page.keyboard.press('Space');
        await expectChartScreenshot(page, page.locator(SELECTORS.canvasCenter), 'AG-13643-legend-item-1-pressed.png');

        await page.keyboard.press('Enter');
        await expectChartScreenshot(page, page.locator(SELECTORS.canvasCenter), 'AG-13643-legend-item-1-focused.png');

        await page.keyboard.press('NumpadEnter');
        await expectChartScreenshot(page, page.locator(SELECTORS.canvasCenter), 'AG-13643-legend-item-1-pressed.png');

        await page.keyboard.down('Shift');
        await page.keyboard.press('Tab');
        await page.keyboard.up('Shift');
        await expectChartScreenshot(
            page,
            page.locator(SELECTORS.canvasCenter),
            'AG-13643-series-2-datum-1-focused.png'
        );
    });

    test('AG-13668 panToBBox', async ({ page }) => {
        await gotoExample(page, toExamplePageUrl('accessibility-e2e', 'AG-13668-panToBBox', 'vanilla').url);
        await page.mouse.click(400, 300, { button: 'left' });

        await repeat(5, async () => await page.keyboard.press('+'));
        await page.keyboard.press('ArrowLeft');
        await expectChartScreenshot(page, page.locator(SELECTORS.canvasCenter), 'AG-13668-datum-0-focused.png');

        await repeat(4, async () => await page.keyboard.press('ArrowRight'));
        await expectChartScreenshot(page, page.locator(SELECTORS.canvasCenter), 'AG-13668-datum-4-focused.png');

        await page.keyboard.press('ArrowRight');
        await repeat(3, async () => await page.keyboard.press('ArrowLeft'));
        await expectChartScreenshot(page, page.locator(SELECTORS.canvasCenter), 'AG-13668-datum-1-focused.png');
    });

    test('AG-13488 mouse dragging hides focus indicator', async ({ page }) => {
        const { url } = toExamplePageUrl('financial-charts-configuration', 'default-configuration', 'vanilla');
        await gotoExample(page, url);

        await page.getByText('1M').click();
        await page.locator(SELECTORS.canvasCenter).click();
        await page.keyboard.press('ArrowRight');
        await page.mouse.move(400, 300);
        await page.mouse.down({ button: 'left' });
        await page.mouse.move(100, 300);
        await expectChartScreenshot(page, page, 'AG-13488-mouse-dragging-hides-focus-indicator.png');
    });

    test('AG-13086 series node click / numpad enter', async ({ page }) => {
        await gotoExample(page, toExamplePageUrl('accessibility', 'keyboard-navigation', 'vanilla').url);

        let lastMessage = '';
        page.on('console', (msg) => {
            lastMessage = msg.text();
        });

        await page.locator('input').first().click();
        await page.keyboard.press('Tab');
        await page.keyboard.press('Enter');
        expect(lastMessage).toEqual('seriesNodeClick BarSeries-1 2017 2470');

        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('Space');
        expect(lastMessage).toEqual('seriesNodeClick BarSeries-2 2018 2281');

        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('NumpadEnter');
        expect(lastMessage).toEqual('seriesNodeClick BarSeries-3 2019 866');
    });

    test('polar chart', async ({ page }) => {
        const { url } = toExamplePageUrl('pie-series', 'simple-pie', 'vanilla');

        await gotoExample(page, url);

        await page.locator(SELECTORS.canvasCenter).first().click();

        await page.keyboard.press('ArrowLeft');
        await expectChartScreenshot(page, page.locator(SELECTORS.canvasCenter), 'pie-1-highlight.png');
        await page.keyboard.press('ArrowRight');
        await expectChartScreenshot(page, page.locator(SELECTORS.canvasCenter), 'pie-2-highlight.png');
        await page.keyboard.press('ArrowRight');
        await expectChartScreenshot(page, page.locator(SELECTORS.canvasCenter), 'pie-3-highlight.png');
        await page.keyboard.press('ArrowRight');
        await expectChartScreenshot(page, page.locator(SELECTORS.canvasCenter), 'pie-4-highlight.png');
        await page.keyboard.press('ArrowRight');
        await expectChartScreenshot(page, page.locator(SELECTORS.canvasCenter), 'pie-5-highlight.png');
    });

    test('topology chart', async ({ page }) => {
        const { url } = toExamplePageUrl('map-shapes', 'multiple-series', 'vanilla');

        await gotoExample(page, url);

        await page.locator(SELECTORS.canvasCenter).first().click();

        await page.keyboard.press('ArrowLeft');
        await expectChartScreenshot(page, page.locator(SELECTORS.canvasCenter), 'map-shape-1-highlight.png');
        await page.keyboard.press('ArrowRight');
        await expectChartScreenshot(page, page.locator(SELECTORS.canvasCenter), 'map-shape-2-highlight.png');
        await page.keyboard.press('ArrowRight');
        await expectChartScreenshot(page, page.locator(SELECTORS.canvasCenter), 'map-shape-3-highlight.png');
        await page.keyboard.press('ArrowRight');
        await expectChartScreenshot(page, page.locator(SELECTORS.canvasCenter), 'map-shape-4-highlight.png');
        await page.keyboard.press('ArrowRight');
        await expectChartScreenshot(page, page.locator(SELECTORS.canvasCenter), 'map-shape-5-highlight.png');
    });

    test('pyramid chart', async ({ page }) => {
        const { url } = toExamplePageUrl('pyramid-series', 'horizontal-pyramid', 'vanilla');

        await gotoExample(page, url);

        await page.locator(SELECTORS.canvasCenter).first().click();

        await page.keyboard.press('ArrowLeft');
        await expectChartScreenshot(page, page.locator(SELECTORS.canvasCenter), 'pyramid-1-highlight.png');
        await page.keyboard.press('ArrowRight');
        await expectChartScreenshot(page, page.locator(SELECTORS.canvasCenter), 'pyramid-2-highlight.png');
        await page.keyboard.press('ArrowRight');
        await expectChartScreenshot(page, page.locator(SELECTORS.canvasCenter), 'pyramid-3-highlight.png');
        await page.keyboard.press('ArrowRight');
        await expectChartScreenshot(page, page.locator(SELECTORS.canvasCenter), 'pyramid-4-highlight.png');
    });

    test('hierarchy chart', async ({ page }) => {
        const { url } = toExamplePageUrl('treemap-series', 'simple-treemap', 'vanilla');

        await gotoExample(page, url);

        await page.locator(SELECTORS.canvasCenter).first().click();

        await page.keyboard.press('ArrowUp');
        await expectChartScreenshot(page, page.locator(SELECTORS.canvasCenter), `treemap-group-highlight.png`);

        await page.keyboard.press('ArrowDown');
        await expectChartScreenshot(page, page.locator(SELECTORS.canvasCenter), `treemap-tile-highlight.png`);
    });

    test('flow proportion chart', async ({ page }) => {
        const { url } = toExamplePageUrl('sankey-series', 'simple-sankey', 'vanilla');

        await gotoExample(page, url);

        await page.locator(SELECTORS.canvasCenter).first().click();

        await page.keyboard.press('ArrowLeft');
        await expectChartScreenshot(page, page.locator(SELECTORS.canvasCenter), `sankey-node-highlight.png`);

        for (let datum = 0; datum < 11; datum += 1) {
            await page.keyboard.press('ArrowRight');
        }
        await expectChartScreenshot(page, page.locator(SELECTORS.canvasCenter), `sankey-link-highlight.png`);
    });

    const flowProportionExamples = [
        { series: 'sankey', docsPage: 'sankey-series', example: 'simple-sankey', nodeCount: 11, linkCount: 10 },
        { series: 'chord', docsPage: 'chord-series', example: 'simple-chord', nodeCount: 5, linkCount: 18 },
    ];

    test.describe('AG-18074 flow-series sibling focus movement', () => {
        for (const { series, docsPage, example, nodeCount, linkCount } of flowProportionExamples) {
            test.describe(series, () => {
                test.beforeEach(async ({ page }) => {
                    const { url } = toExamplePageUrl(docsPage, example, 'vanilla');

                    await gotoExample(page, url);

                    await page.locator(SELECTORS.canvasCenter).first().click();
                    // Clamps focus onto the first node, so press counts below are relative to a known origin.
                    await page.keyboard.press('ArrowLeft');
                });

                test('sibling ArrowRight moves focus', async ({ page }) => {
                    const nodeAnnouncement = new RegExp(`^node \\d+ of ${nodeCount}`);
                    let previous: string | null = null;

                    // One short of the node count, so every press stays inside the node ring.
                    await repeat(nodeCount - 1, async () => {
                        await page.keyboard.press('ArrowRight');

                        const announcement = await readSwapchainText(page);
                        expect(announcement).toMatch(nodeAnnouncement);
                        // Announcements only fire on a change, so a repeat means focus did not move.
                        expect(announcement).not.toBe(previous);
                        previous = announcement;
                    });
                });

                test('depth keys are inert', async ({ page }) => {
                    await page.keyboard.press('ArrowRight');
                    const announcement = await readSwapchainText(page);

                    await page.keyboard.press('ArrowDown');
                    expect(await readSwapchainText(page)).toBe(announcement);

                    await page.keyboard.press('ArrowUp');
                    expect(await readSwapchainText(page)).toBe(announcement);
                });

                test('crossing the last node announces a link', async ({ page }) => {
                    await repeat(nodeCount, async () => await page.keyboard.press('ArrowRight'));

                    expect(await readSwapchainText(page)).toMatch(new RegExp(`^link \\d+ of ${linkCount}`));
                });
            });
        }
    });

    test('gauge chart', async ({ page }) => {
        const { url } = toExamplePageUrl('linear-gauge', 'custom-targets', 'vanilla');

        await gotoExample(page, url);

        await page.locator(SELECTORS.canvasCenter).first().click();

        await page.keyboard.press('ArrowUp'); // should make the focus indicator appear
        await page.keyboard.press('ArrowUp'); // should have no effect
        await expectChartScreenshot(page, page.locator(SELECTORS.canvasCenter), `linear-gauge-bar-highlight.png`);

        await page.keyboard.press('ArrowDown');
        await expectChartScreenshot(page, page.locator(SELECTORS.canvasCenter), `linear-gauge-target0-highlight.png`);

        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('ArrowRight');
        await expectChartScreenshot(page, page.locator(SELECTORS.canvasCenter), `linear-gauge-target2-highlight.png`);

        // ArrowUp from a non-first target must return to the main bar, whose single node has no
        // landing for the carried target index.
        await page.keyboard.press('ArrowUp');
        await expectChartScreenshot(page, page.locator(SELECTORS.canvasCenter), `linear-gauge-bar-highlight.png`);

        await page.keyboard.press('ArrowDown');
        await expectChartScreenshot(page, page.locator(SELECTORS.canvasCenter), `linear-gauge-target0-highlight.png`);

        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('ArrowRight');
        await expectChartScreenshot(page, page.locator(SELECTORS.canvasCenter), `linear-gauge-target2-highlight.png`);

        await page.keyboard.press('ArrowLeft');
        await page.keyboard.press('ArrowLeft');
        await page.keyboard.press('ArrowLeft'); // should have no effect
        await expectChartScreenshot(page, page.locator(SELECTORS.canvasCenter), `linear-gauge-target0-highlight.png`);

        await page.keyboard.press('ArrowDown'); // should have no effect
        await page.keyboard.press('ArrowUp');
        await expectChartScreenshot(page, page.locator(SELECTORS.canvasCenter), `linear-gauge-bar-highlight.png`);
    });

    test.describe('radial gauge chart with needle', () => {
        let canvas: Locator, hideNeedle: Locator, showNeedle: Locator, hideBar: Locator, showBar: Locator;
        test.beforeEach(async ({ page }) => {
            await gotoExample(page, toExamplePageUrl('radial-gauge', 'needle', 'vanilla').url);
            canvas = page.locator(SELECTORS.canvasCenter).first();
            hideNeedle = page.getByText('Hide Needle').first();
            showNeedle = page.getByText('Show Needle').first();
            hideBar = page.getByText('Hide Bar').first();
            showBar = page.getByText('Show Bar').first();
        });

        test('init', async ({ page }) => {
            await canvas.click();
            await page.keyboard.press('ArrowLeft');
            await expectChartScreenshot(page, canvas, `radial-gauge-showNeedle-hideBar.png`);
        });

        test('hideNeedle hideBar', async ({ page }) => {
            await hideNeedle.click();
            await hideBar.click();
            await canvas.click();
            await page.keyboard.press('ArrowLeft');
            await expectChartScreenshot(page, canvas, `radial-gauge-hideNeedle-hideBar.png`);
        });

        test('hideNeedle showBar', async ({ page }) => {
            await hideNeedle.click();
            await showBar.click();
            await canvas.click();
            await page.keyboard.press('ArrowLeft');
            await expectChartScreenshot(page, canvas, `radial-gauge-hideNeedle-showBar.png`);
        });

        test('showNeedle hideBar', async ({ page }) => {
            await showNeedle.click();
            await hideBar.click();
            await canvas.click();
            await page.keyboard.press('ArrowLeft');
            await expectChartScreenshot(page, canvas, `radial-gauge-showNeedle-hideBar.png`);
        });

        test('showNeedle showBar', async ({ page }) => {
            await showNeedle.click();
            await showBar.click();
            await canvas.click();
            await page.keyboard.press('ArrowLeft');
            await expectChartScreenshot(page, canvas, `radial-gauge-showNeedle-showBar.png`);
        });
    });

    test.describe('gauge corner radii', () => {
        test.describe('linear', () => {
            let enable: Locator, disable: Locator, item: Locator, container: Locator;
            test.beforeEach(async ({ page }) => {
                await gotoExample(page, toExamplePageUrl('linear-gauge', 'corner-radius', 'vanilla').url);
                enable = page.getByText('Enable');
                disable = page.getByText('Disable');
                item = page.getByText('Item');
                container = page.getByText('Container');
            });
            test('item', async ({ page }) => {
                await disable.click();
                await item.click();
                await page.mouse.click(400, 300);
                await page.keyboard.press('ArrowLeft');
                await expectChartScreenshot(page, page, 'linear-gauge-corners-item.png');
            });
            test('container', async ({ page }) => {
                await disable.click();
                await container.click();
                await page.mouse.click(400, 300);
                await page.keyboard.press('ArrowLeft');
                await expectChartScreenshot(page, page, 'linear-gauge-corners-container.png');
            });
            test('segmented item', async ({ page }) => {
                await enable.click();
                await item.click();
                await page.mouse.click(400, 300);
                await page.keyboard.press('ArrowLeft');
                await expectChartScreenshot(page, page, 'linear-gauge-corners-segmented-item.png');
            });
            test('segmented container', async ({ page }) => {
                await enable.click();
                await container.click();
                await page.mouse.click(400, 300);
                await page.keyboard.press('ArrowLeft');
                await expectChartScreenshot(page, page, 'linear-gauge-corners-segmented-container.png');
            });
        });

        test.describe('vertical linear', () => {
            let enable: Locator, disable: Locator, item: Locator, container: Locator;
            test.beforeEach(async ({ page }) => {
                await gotoExample(page, toExamplePageUrl('linear-gauge-e2e', 'corner-radius', 'vanilla').url);
                enable = page.getByText('Enable');
                disable = page.getByText('Disable');
                item = page.getByText('Item');
                container = page.getByText('Container');
            });
            test('item', async ({ page }) => {
                await disable.click();
                await item.click();
                await page.mouse.click(400, 300);
                await page.keyboard.press('ArrowLeft');
                await expectChartScreenshot(page, page, 'vertical-linear-gauge-corners-item.png');
            });
            test('container', async ({ page }) => {
                await disable.click();
                await container.click();
                await page.mouse.click(400, 300);
                await page.keyboard.press('ArrowLeft');
                await expectChartScreenshot(page, page, 'vertical-linear-gauge-corners-container.png');
            });
            test('segmented item', async ({ page }) => {
                await enable.click();
                await item.click();
                await page.mouse.click(400, 300);
                await page.keyboard.press('ArrowLeft');
                await expectChartScreenshot(page, page, 'vertical-linear-gauge-corners-segmented-item.png');
            });
            test('segmented container', async ({ page }) => {
                await enable.click();
                await container.click();
                await page.mouse.click(400, 300);
                await page.keyboard.press('ArrowLeft');
                await expectChartScreenshot(page, page, 'vertical-linear-gauge-corners-segmented-container.png');
            });
        });

        test.describe('radial', () => {
            let enable: Locator, disable: Locator, item: Locator, container: Locator;
            test.beforeEach(async ({ page }) => {
                await gotoExample(page, toExamplePageUrl('radial-gauge', 'corner-radius', 'vanilla').url);
                enable = page.getByText('Enable');
                disable = page.getByText('Disable');
                item = page.getByText('Item');
                container = page.getByText('Container');
            });
            test('item', async ({ page }) => {
                await disable.click();
                await item.click();
                await page.mouse.click(400, 300);
                await page.keyboard.press('ArrowLeft');
                await expectChartScreenshot(page, page, 'radial-gauge-corners-item.png');
            });
            test('container', async ({ page }) => {
                await disable.click();
                await container.click();
                await page.mouse.click(400, 300);
                await page.keyboard.press('ArrowLeft');
                await expectChartScreenshot(page, page, 'radial-gauge-corners-container.png');
            });
            test('segmented item', async ({ page }) => {
                await enable.click();
                await item.click();
                await page.mouse.click(400, 300);
                await page.keyboard.press('ArrowLeft');
                await expectChartScreenshot(page, page, 'radial-gauge-corners-segmented-item.png');
            });
            test('segmented container', async ({ page }) => {
                await enable.click();
                await container.click();
                await page.mouse.click(400, 300);
                await page.keyboard.press('ArrowLeft');
                await expectChartScreenshot(page, page, 'radial-gauge-corners-segmented-container.png');
            });
        });
    });

    test.describe('AG-15607 linear gauge bar thickness', () => {
        test('horizontal', async ({ page }) => {
            await gotoExample(page, toExamplePageUrl('linear-gauge-e2e', 'bar-thickness-horizontal', 'vanilla').url);
            await page.mouse.click(400, 300);
            await page.keyboard.press('ArrowLeft');
            await expectChartScreenshot(page, page, 'AG-15607-bar-thickness-horizontal.png');
        });
        test('vertical', async ({ page }) => {
            await gotoExample(page, toExamplePageUrl('linear-gauge-e2e', 'bar-thickness-vertical', 'vanilla').url);
            await page.mouse.click(400, 300);
            await page.keyboard.press('ArrowLeft');
            await expectChartScreenshot(page, page, 'AG-15607-bar-thickness-vertical.png');
        });
    });

    test('AG-13891 pagination buttons aria-disabled', async ({ page }) => {
        await gotoExample(page, toExamplePageUrl('accessibility', 'keyboard-navigation', 'vanilla').url);

        await expect(page.getByText('Previous Legend Page')).toHaveAttribute('aria-disabled', 'true');
        await expect(page.getByText('Next Legend Page')).toHaveAttribute('aria-disabled', 'false');
        await page.getByText('Next Legend Page').first().click();
        await expect(page.getByText('Previous Legend Page')).toHaveAttribute('aria-disabled', 'false');
        await expect(page.getByText('Next Legend Page')).toHaveAttribute('aria-disabled', 'true');
    });

    test('CRT-969 short aria labels', async ({ page }) => {
        await gotoExample(page, toExamplePageUrl('background-image', 'background-image', 'vanilla').url);

        const elems = page.locator('.ag-charts-series-area [id]');
        await expect(elems).toHaveCount(2);
        const label1 = elems.nth(0);
        const label2 = elems.nth(1);

        await page.mouse.click(400, 300);
        await expect(label1).toHaveText('56.9');

        await page.keyboard.press('ArrowRight');
        await expect(label2).toHaveText('22.5');

        await page.keyboard.press('ArrowRight');
        await expect(label1).toHaveText('6.8');

        await page.keyboard.press('ArrowRight');
        await expect(label2).toHaveText('8.5');

        await page.keyboard.press('ArrowRight');
        await expect(label1).toHaveText('2.6');

        await page.keyboard.press('ArrowRight');
        await expect(label2).toHaveText('1.9');
    });

    test.describe('AG-16523 activatesFocusIndicator:false should not remove focus indicator', () => {
        /**
         * activatesFocusIndicator:false means that...
         *
         * (1)  ...if the focus is currently hidden, then this keyboard-action will not summon the focus indicator.
         * (2)  It does not mean that is should hide a focus indicator that is already.
         *
         * We are testing (2), with the "Zoom-In" and "Undo" actions.
         */
        test.beforeEach(async ({ page }) => {
            const { url } = toExamplePageUrl('accessibility-e2e', 'activatesFocusIndicator-false', 'vanilla');
            await gotoExample(page, url);

            // Focus on chart series-area:
            // (focus-indicator MUST be show, because focus was triggered by keyboard)
            await page.keyboard.press('Tab');
            await expectChartScreenshot(page, page, 'AG-16523-init-focus-visible.png');

            // Click chart:
            // (clear focus-indicator, because we entered "pointer-mode")
            await page.mouse.click(400, 300);
            await expectChartScreenshot(page, page, 'AG-16523-init-focus-hidden.png');

            // Blur the chart:
            await page.keyboard.press('Tab');
            await expectChartScreenshot(page, page, 'AG-16523-blurred.png');
        });

        test('zoom-in', async ({ page }) => {
            // Focus on chart series-area:
            // (focus-indicator MUST be show, because focus was triggered by keyboard)
            await page.keyboard.press('Shift+Tab');
            await expectChartScreenshot(page, page, 'AG-16523-init-focus-visible.png');

            // Adjust zoom:
            // (focus-indicator MUST be shown, because we're still in "keyboard-mode")
            await page.keyboard.press('+');
            await expectChartScreenshot(page, page, 'AG-16523-zoomed-focus-visible.png');
        });

        test('undo', async ({ page }) => {
            // Delete the annotations:
            await page.keyboard.press('ArrowDown');
            await page.keyboard.press('ArrowDown');
            await page.keyboard.press('ArrowDown');
            await page.keyboard.press('Space');

            // Focus on chart series-area:
            // (focus-indicator MUST be show, because focus was triggered by keyboard)
            await page.keyboard.press('Shift+Tab');
            await expectChartScreenshot(page, page, 'AG-16523-deleted-focus-visible.png');

            // Undo zoom:
            // (focus-indicator MUST be shown, because we're still in "keyboard-mode")
            await page.keyboard.press('ControlOrMeta+z');
            await expectChartScreenshot(page, page, 'AG-16523-init-focus-visible.png');
        });
    });

    test('CRT-1047 legend focus indicator updates when font family changes', async ({ page }) => {
        await gotoExample(
            page,
            toExamplePageUrl('accessibility-e2e', 'keyboard-navigation-change-font-family', 'vanilla').url
        );

        // Tab through to the legend
        await page.keyboard.press('Tab');
        await page.keyboard.press('Tab');
        await page.keyboard.press('Tab');

        // Move to the 2nd legend item
        await page.keyboard.press('ArrowRight');

        // Change the font
        await page.getByTestId('changeFontFamily').click();

        // Tab through to the legend
        await page.keyboard.press('Tab');
        await page.keyboard.press('Tab');

        // Should already be on the 2nd legend item

        await expectChartScreenshot(page, page.locator(SELECTORS.canvasCenter), 'CRT-1047-after-change-font.png');
    });

    test.describe('initial-focus', () => {
        let canvas: Locator;

        async function selectOption(page: Page, initialFocus: AgInitialFocus): Promise<void> {
            await page.selectOption('#myInitialFocus', initialFocus);
            await page.locator('#above-chart').focus();
            await page.keyboard.press('Tab');
        }

        async function selectMode(page: Page, mode: 'create' | 'updateDelta'): Promise<void> {
            await page.selectOption('#myUpdateMode', mode);
        }

        test.beforeEach(async ({ page }) => {
            await gotoExample(page, toExamplePageUrl('accessibility-e2e', 'initial-focus', 'vanilla').url);
            canvas = page.locator(SELECTORS.canvasCenter).first();
        });

        test('data-start', async ({ page }) => {
            await selectOption(page, 'data-start');
            await expectChartScreenshot(page, canvas, 'initial-focus-data-start.png');
        });

        test('data-end', async ({ page }) => {
            await selectOption(page, 'data-end');
            await expectChartScreenshot(page, canvas, 'initial-focus-data-end.png');
        });

        test('viewport-start', async ({ page }) => {
            await selectOption(page, 'viewport-start');
            await expectChartScreenshot(page, canvas, 'initial-focus-viewport-start.png');
        });

        test('viewport-end', async ({ page }) => {
            await selectOption(page, 'viewport-end');
            await expectChartScreenshot(page, canvas, 'initial-focus-viewport-end.png');
        });

        test('only the first focus event reads the initialFocus value', async ({ page }) => {
            await selectMode(page, 'updateDelta');

            await selectOption(page, 'viewport-start');
            await expectChartScreenshot(page, canvas, 'initial-focus-viewport-start.png');

            await selectOption(page, 'viewport-end');
            await expectChartScreenshot(page, canvas, 'initial-focus-viewport-start.png');
        });
    });
});
