import type { Locator } from '@playwright/test';

import { expect, test } from './fixture';
import { SELECTORS, gotoExample, repeat, setupIntrinsicAssertions, toExamplePageUrl, toExamplePageUrls } from './util';

test.describe('keyboard-nav', () => {
    setupIntrinsicAssertions(test);

    for (const { framework, url } of toExamplePageUrls('accessibility', 'keyboard-navigation')) {
        test.describe(`for ${framework}`, () => {
            test('basic keyboard navigation', async ({ page }) => {
                await gotoExample(page, url);

                await page.locator('input').first().click();

                // Tab into chart, 1st series + 1st datum should be highlighted.
                await page.keyboard.press('Tab');
                await expect(page.locator(SELECTORS.canvasCenter)).toHaveScreenshot('1st-datum-focus.png');

                // Move to 3rd datum, then 2nd series.
                await page.keyboard.press('ArrowRight');
                await page.keyboard.press('ArrowRight');
                await page.keyboard.press('ArrowDown');
                await expect(page.locator(SELECTORS.canvasCenter)).toHaveScreenshot('3rd-datum-2nd-series-focus.png');

                // Move to legend items.
                await page.keyboard.press('Tab');
                await expect(page.locator(SELECTORS.canvasCenter)).toHaveScreenshot('legend-focus.png');

                // Move to 2nd page of legend items.
                await page.keyboard.press('ArrowRight');
                await page.keyboard.press('ArrowRight');
                await page.keyboard.press('ArrowRight');
                await page.keyboard.press('ArrowRight');
                await expect(page.locator(SELECTORS.canvasCenter)).toHaveScreenshot('legend-2nd-page-focus.png');

                // Move to page back control.
                await page.keyboard.press('Tab');
                await expect(page.locator(SELECTORS.canvasCenter)).toHaveScreenshot('legend-page-control-focus.png');

                // Tab outside of chart.
                await page.keyboard.press('Tab');
                await page.keyboard.press('Tab');
                await expect(page.locator(SELECTORS.canvasCenter)).toHaveScreenshot('tabbed-out-of-chart.png');

                // Tab back into chart.
                await page.keyboard.press('Shift+Tab');
                await expect(page.locator(SELECTORS.canvasCenter)).toHaveScreenshot('tabbed-back-into-chart.png');
            });
        });
    }

    test('Home/End keys', async ({ page }) => {
        await gotoExample(page, toExamplePageUrl('accessibility', 'keyboard-navigation', 'vanilla').url);

        await page.locator('input').first().click();
        await page.keyboard.press('Tab');
        await expect(page.locator(SELECTORS.canvasCenter)).toHaveScreenshot('1st-datum-focus.png');

        await page.keyboard.press('End');
        await expect(page.locator(SELECTORS.canvasCenter)).toHaveScreenshot('last-datum-focus.png');

        await page.keyboard.press('Home');
        await expect(page.locator(SELECTORS.canvasCenter)).toHaveScreenshot('1st-datum-focus.png');
    });

    test('keyboard nav ignores highlight-disabled series', async ({ page }) => {
        await gotoExample(
            page,
            toExamplePageUrl('accessibility-test', 'keyboard-navigation-highlight-disabled-series', 'vanilla').url
        );

        const canvasCenter = page.locator(SELECTORS.canvasCenter);
        await page.locator('input').first().click();

        await page.keyboard.press('Tab');
        await expect(canvasCenter).toHaveScreenshot('highlight-disabled-series-focus.png');

        await page.keyboard.press('ArrowDown');
        await expect(canvasCenter).toHaveScreenshot('highlight-disabled-series-other-series-focus.png');
    });

    test('AG-13051 kbm hover combo', async ({ page }) => {
        await gotoExample(page, toExamplePageUrl('accessibility', 'keyboard-navigation', 'vanilla').url);

        await page.locator('input').first().click();

        await page.mouse.move(547, 310);
        await expect(page.locator(SELECTORS.canvasCenter)).toHaveScreenshot(
            '4th-datum-2nd-series-nofocus-highlight.png'
        );

        await page.mouse.click(547, 310, { button: 'left' });
        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('ArrowDown');
        await expect(page.locator(SELECTORS.canvasCenter)).toHaveScreenshot('3rd-datum-2nd-series-focus.png');

        await page.mouse.move(547, 310);
        await expect(page.locator(SELECTORS.canvasCenter)).toHaveScreenshot(
            '3rd-datum-2nd-series-focus-4th-datum-2nd-series-highlight.png'
        );

        await page.mouse.move(613, 217);
        await expect(page.locator(SELECTORS.canvasCenter)).toHaveScreenshot(
            '3rd-datum-2nd-series-focus-nohighlight.png'
        );

        await page.keyboard.press('ArrowDown');
        await expect(page.locator(SELECTORS.canvasCenter)).toHaveScreenshot('3rd-datum-3rd-series-focus-highlight.png');

        await page.mouse.move(547, 310);
        await page.mouse.click(547, 310, { button: 'left' });
        await expect(page.locator(SELECTORS.canvasCenter)).toHaveScreenshot(
            'nofocus-4th-datum-2nd-series-highlight.png'
        );

        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('ArrowLeft');
        await expect(page.locator(SELECTORS.canvasCenter)).toHaveScreenshot('3rd-datum-3rd-series-focus-highlight.png');

        await page.mouse.click(100, 100, { button: 'left' });
        await expect(page.locator(SELECTORS.canvasCenter)).toHaveScreenshot('nofocus-nohighlight.png');
    });

    test('AG-13643 legend toggling', async ({ page }) => {
        await gotoExample(page, toExamplePageUrl('line-series', 'simple-line', 'vanilla').url);

        await page.mouse.click(400, 300, { button: 'left' });

        await page.keyboard.press('Tab');
        await expect(page.locator(SELECTORS.canvasCenter)).toHaveScreenshot('AG-13643-legend-item-1-focused.png');

        await page.keyboard.press('Space');
        await expect(page.locator(SELECTORS.canvasCenter)).toHaveScreenshot('AG-13643-legend-item-1-pressed.png');

        await page.keyboard.press('Enter');
        await expect(page.locator(SELECTORS.canvasCenter)).toHaveScreenshot('AG-13643-legend-item-1-focused.png');

        await page.keyboard.press('NumpadEnter');
        await expect(page.locator(SELECTORS.canvasCenter)).toHaveScreenshot('AG-13643-legend-item-1-pressed.png');

        await page.keyboard.down('Shift');
        await page.keyboard.press('Tab');
        await page.keyboard.up('Shift');
        await expect(page.locator(SELECTORS.canvasCenter)).toHaveScreenshot('AG-13643-series-2-datum-1-focused.png');
    });

    test('AG-13668 panToBBox', async ({ page }) => {
        await gotoExample(page, toExamplePageUrl('accessibility-test', 'AG-13668-panToBBox', 'vanilla').url);
        await page.mouse.click(400, 300, { button: 'left' });

        await repeat(5, async () => await page.keyboard.press('+'));
        await page.keyboard.press('ArrowLeft');
        await expect(page.locator(SELECTORS.canvasCenter)).toHaveScreenshot('AG-13668-datum-0-focused.png');

        await repeat(4, async () => await page.keyboard.press('ArrowRight'));
        await expect(page.locator(SELECTORS.canvasCenter)).toHaveScreenshot('AG-13668-datum-4-focused.png');

        await page.keyboard.press('ArrowRight');
        await repeat(3, async () => await page.keyboard.press('ArrowLeft'));
        await expect(page.locator(SELECTORS.canvasCenter)).toHaveScreenshot('AG-13668-datum-1-focused.png');
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
        await expect(page).toHaveScreenshot('AG-13488-mouse-dragging-hides-focus-indicator.png');
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
        await expect(page.locator(SELECTORS.canvasCenter)).toHaveScreenshot('pie-1-highlight.png');
        await page.keyboard.press('ArrowRight');
        await expect(page.locator(SELECTORS.canvasCenter)).toHaveScreenshot('pie-2-highlight.png');
        await page.keyboard.press('ArrowRight');
        await expect(page.locator(SELECTORS.canvasCenter)).toHaveScreenshot('pie-3-highlight.png');
        await page.keyboard.press('ArrowRight');
        await expect(page.locator(SELECTORS.canvasCenter)).toHaveScreenshot('pie-4-highlight.png');
        await page.keyboard.press('ArrowRight');
        await expect(page.locator(SELECTORS.canvasCenter)).toHaveScreenshot('pie-5-highlight.png');
    });

    test('topology chart', async ({ page }) => {
        const { url } = toExamplePageUrl('map-shapes', 'multiple-series', 'vanilla');

        await gotoExample(page, url);

        await page.locator(SELECTORS.canvasCenter).first().click();

        await page.keyboard.press('ArrowLeft');
        await expect(page.locator(SELECTORS.canvasCenter)).toHaveScreenshot('map-shape-1-highlight.png');
        await page.keyboard.press('ArrowRight');
        await expect(page.locator(SELECTORS.canvasCenter)).toHaveScreenshot('map-shape-2-highlight.png');
        await page.keyboard.press('ArrowRight');
        await expect(page.locator(SELECTORS.canvasCenter)).toHaveScreenshot('map-shape-3-highlight.png');
        await page.keyboard.press('ArrowRight');
        await expect(page.locator(SELECTORS.canvasCenter)).toHaveScreenshot('map-shape-4-highlight.png');
        await page.keyboard.press('ArrowRight');
        await expect(page.locator(SELECTORS.canvasCenter)).toHaveScreenshot('map-shape-5-highlight.png');
    });

    test('pyramid chart', async ({ page }) => {
        const { url } = toExamplePageUrl('pyramid-series', 'horizontal-pyramid', 'vanilla');

        await gotoExample(page, url);

        await page.locator(SELECTORS.canvasCenter).first().click();

        await page.keyboard.press('ArrowLeft');
        await expect(page.locator(SELECTORS.canvasCenter)).toHaveScreenshot('pyramid-1-highlight.png');
        await page.keyboard.press('ArrowRight');
        await expect(page.locator(SELECTORS.canvasCenter)).toHaveScreenshot('pyramid-2-highlight.png');
        await page.keyboard.press('ArrowRight');
        await expect(page.locator(SELECTORS.canvasCenter)).toHaveScreenshot('pyramid-3-highlight.png');
        await page.keyboard.press('ArrowRight');
        await expect(page.locator(SELECTORS.canvasCenter)).toHaveScreenshot('pyramid-4-highlight.png');
    });

    test('hierarchy chart', async ({ page }) => {
        const { url } = toExamplePageUrl('treemap-series', 'simple-treemap', 'vanilla');

        await gotoExample(page, url);

        await page.locator(SELECTORS.canvasCenter).first().click();

        await page.keyboard.press('ArrowUp');
        await expect(page.locator(SELECTORS.canvasCenter)).toHaveScreenshot(`treemap-group-highlight.png`);

        await page.keyboard.press('ArrowDown');
        await expect(page.locator(SELECTORS.canvasCenter)).toHaveScreenshot(`treemap-tile-highlight.png`);
    });

    test('flow proportion chart', async ({ page }) => {
        const { url } = toExamplePageUrl('sankey-series', 'simple-sankey', 'vanilla');

        await gotoExample(page, url);

        await page.locator(SELECTORS.canvasCenter).first().click();

        await page.keyboard.press('ArrowLeft');
        await expect(page.locator(SELECTORS.canvasCenter)).toHaveScreenshot(`sankey-node-highlight.png`);

        for (let datum = 0; datum < 11; datum += 1) {
            await page.keyboard.press('ArrowRight');
        }
        await expect(page.locator(SELECTORS.canvasCenter)).toHaveScreenshot(`sankey-link-highlight.png`);
    });

    test('gauge chart', async ({ page }) => {
        const { url } = toExamplePageUrl('linear-gauge', 'custom-targets', 'vanilla');

        await gotoExample(page, url);

        await page.locator(SELECTORS.canvasCenter).first().click();

        await page.keyboard.press('ArrowUp'); // should make the focus indicator appear
        await page.keyboard.press('ArrowUp'); // should have no effect
        await expect(page.locator(SELECTORS.canvasCenter)).toHaveScreenshot(`linear-gauge-bar-highlight.png`);

        await page.keyboard.press('ArrowDown');
        await expect(page.locator(SELECTORS.canvasCenter)).toHaveScreenshot(`linear-gauge-target0-highlight.png`);

        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('ArrowRight');
        await expect(page.locator(SELECTORS.canvasCenter)).toHaveScreenshot(`linear-gauge-target2-highlight.png`);

        await page.keyboard.press('ArrowLeft');
        await page.keyboard.press('ArrowLeft');
        await page.keyboard.press('ArrowLeft'); // should have no effect
        await expect(page.locator(SELECTORS.canvasCenter)).toHaveScreenshot(`linear-gauge-target0-highlight.png`);

        await page.keyboard.press('ArrowDown'); // should have no effect
        await page.keyboard.press('ArrowUp');
        await expect(page.locator(SELECTORS.canvasCenter)).toHaveScreenshot(`linear-gauge-bar-highlight.png`);
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
            await expect(canvas).toHaveScreenshot(`radial-gauge-showNeedle-hideBar.png`);
        });

        test('hideNeedle hideBar', async ({ page }) => {
            await hideNeedle.click();
            await hideBar.click();
            await canvas.click();
            await page.keyboard.press('ArrowLeft');
            await expect(canvas).toHaveScreenshot(`radial-gauge-hideNeedle-hideBar.png`);
        });

        test('hideNeedle showBar', async ({ page }) => {
            await hideNeedle.click();
            await showBar.click();
            await canvas.click();
            await page.keyboard.press('ArrowLeft');
            await expect(canvas).toHaveScreenshot(`radial-gauge-hideNeedle-showBar.png`);
        });

        test('showNeedle hideBar', async ({ page }) => {
            await showNeedle.click();
            await hideBar.click();
            await canvas.click();
            await page.keyboard.press('ArrowLeft');
            await expect(canvas).toHaveScreenshot(`radial-gauge-showNeedle-hideBar.png`);
        });

        test('showNeedle showBar', async ({ page }) => {
            await showNeedle.click();
            await showBar.click();
            await canvas.click();
            await page.keyboard.press('ArrowLeft');
            await expect(canvas).toHaveScreenshot(`radial-gauge-showNeedle-showBar.png`);
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
                await expect(page).toHaveScreenshot('linear-gauge-corners-item.png');
            });
            test('container', async ({ page }) => {
                await disable.click();
                await container.click();
                await page.mouse.click(400, 300);
                await page.keyboard.press('ArrowLeft');
                await expect(page).toHaveScreenshot('linear-gauge-corners-container.png');
            });
            test('segmented item', async ({ page }) => {
                await enable.click();
                await item.click();
                await page.mouse.click(400, 300);
                await page.keyboard.press('ArrowLeft');
                await expect(page).toHaveScreenshot('linear-gauge-corners-segmented-item.png');
            });
            test('segmented container', async ({ page }) => {
                await enable.click();
                await container.click();
                await page.mouse.click(400, 300);
                await page.keyboard.press('ArrowLeft');
                await expect(page).toHaveScreenshot('linear-gauge-corners-segmented-container.png');
            });
        });

        test.describe('vertical linear', () => {
            let enable: Locator, disable: Locator, item: Locator, container: Locator;
            test.beforeEach(async ({ page }) => {
                await gotoExample(page, toExamplePageUrl('linear-gauge-test', 'corner-radius', 'vanilla').url);
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
                await expect(page).toHaveScreenshot('vertical-linear-gauge-corners-item.png');
            });
            test('container', async ({ page }) => {
                await disable.click();
                await container.click();
                await page.mouse.click(400, 300);
                await page.keyboard.press('ArrowLeft');
                await expect(page).toHaveScreenshot('vertical-linear-gauge-corners-container.png');
            });
            test('segmented item', async ({ page }) => {
                await enable.click();
                await item.click();
                await page.mouse.click(400, 300);
                await page.keyboard.press('ArrowLeft');
                await expect(page).toHaveScreenshot('vertical-linear-gauge-corners-segmented-item.png');
            });
            test('segmented container', async ({ page }) => {
                await enable.click();
                await container.click();
                await page.mouse.click(400, 300);
                await page.keyboard.press('ArrowLeft');
                await expect(page).toHaveScreenshot('vertical-linear-gauge-corners-segmented-container.png');
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
                await expect(page).toHaveScreenshot('radial-gauge-corners-item.png');
            });
            test('container', async ({ page }) => {
                await disable.click();
                await container.click();
                await page.mouse.click(400, 300);
                await page.keyboard.press('ArrowLeft');
                await expect(page).toHaveScreenshot('radial-gauge-corners-container.png');
            });
            test('segmented item', async ({ page }) => {
                await enable.click();
                await item.click();
                await page.mouse.click(400, 300);
                await page.keyboard.press('ArrowLeft');
                await expect(page).toHaveScreenshot('radial-gauge-corners-segmented-item.png');
            });
            test('segmented container', async ({ page }) => {
                await enable.click();
                await container.click();
                await page.mouse.click(400, 300);
                await page.keyboard.press('ArrowLeft');
                await expect(page).toHaveScreenshot('radial-gauge-corners-segmented-container.png');
            });
        });
    });

    test.describe('AG-15607 linear gauge bar thickness', () => {
        test('horizontal', async ({ page }) => {
            await gotoExample(page, toExamplePageUrl('linear-gauge-test', 'bar-thickness-horizontal', 'vanilla').url);
            await page.mouse.click(400, 300);
            await page.keyboard.press('ArrowLeft');
            await expect(page).toHaveScreenshot('AG-15607-bar-thickness-horizontal.png');
        });
        test('vertical', async ({ page }) => {
            await gotoExample(page, toExamplePageUrl('linear-gauge-test', 'bar-thickness-vertical', 'vanilla').url);
            await page.mouse.click(400, 300);
            await page.keyboard.press('ArrowLeft');
            await expect(page).toHaveScreenshot('AG-15607-bar-thickness-vertical.png');
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
         *
         * Related ticket: AG-13041
         */
        test.beforeEach(async ({ page }) => {
            const { url } = toExamplePageUrl('accessibility-test', 'activatesFocusIndicator-false', 'vanilla');
            await gotoExample(page, url);

            // Focus on chart series-area:
            // (focus-indicator MUST be show, because focus was triggered by keyboard)
            await page.keyboard.press('Tab');
            await expect(page).toHaveScreenshot('AG-16523-init-focus-visible.png');

            // Click chart:
            // (clear focus-indicator, because we entered "pointer-mode")
            await page.mouse.click(400, 300);
            await expect(page).toHaveScreenshot('AG-16523-init-focus-hidden.png');

            // Blur the chart:
            await page.keyboard.press('Tab');
            await expect(page).toHaveScreenshot('AG-16523-blurred.png');
        });

        test('zoom-in', async ({ page }) => {
            // Focus on chart series-area:
            // (focus-indicator MUST be show, because focus was triggered by keyboard)
            await page.keyboard.press('Shift+Tab');
            await expect(page).toHaveScreenshot('AG-16523-init-focus-visible.png');

            // Adjust zoom:
            // (focus-indicator MUST be shown, because we're still in "keyboard-mode")
            await page.keyboard.press('+');
            await expect(page).toHaveScreenshot('AG-16523-zoomed-focus-visible.png');
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
            await expect(page).toHaveScreenshot('AG-16523-deleted-focus-visible.png');

            // Undo zoom:
            // (focus-indicator MUST be shown, because we're still in "keyboard-mode")
            await page.keyboard.press('ControlOrMeta+z');
            await expect(page).toHaveScreenshot('AG-16523-init-focus-visible.png');
        });
    });

    test('CRT-1047 legend focus indicator updates when font family changes', async ({ page }) => {
        await gotoExample(
            page,
            toExamplePageUrl('accessibility-test', 'keyboard-navigation-change-font-family', 'vanilla').url
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

        await expect(page.locator(SELECTORS.canvasCenter)).toHaveScreenshot('CRT-1047-after-change-font.png');
    });
});
