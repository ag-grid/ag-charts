import { expect, test } from './fixture';
import { SELECTORS, gotoExample, setupIntrinsicAssertions, toExamplePageUrl, waitForAllChartUpdates } from './util';

test.describe('item-styler-test', () => {
    setupIntrinsicAssertions();

    const url = toExamplePageUrl('stylers-test', 'item-styler-test', 'vanilla').url;

    const chartTypes = [
        'Bar + Line + Area',
        'Scatter + Bubble',
        'Pie + Donut',
        'Treemap',
        'Range Series',
        'Radar Line',
        'Radar Area',
        'Radial Bar',
        'Radial Column',
        'Nightingale',
        // 'Histogram',
        'Box Plot',
        'Heatmap',
        'Waterfall',
        'Funnel',
        'Sankey',
        'OHLC',
        'Candlestick',
        'Pyramid',
        'Chord',
        'Sunburst',
        'Map',
    ];
    // Create individual test cases for each chart type to avoid timeout issues
    chartTypes.forEach((chartType) => {
        test(`status panel screenshot for ${chartType}`, async ({ page }) => {
            // Set a wider viewport to accommodate the matrix table
            await page.setViewportSize({ width: 1400, height: 900 });

            // Listen for console logs to capture item styler callback invocations
            const itemStylerLogs: any[] = [];
            page.on('console', (msg) => {
                const text = msg.text();
                if (text.includes('[') && text.includes('itemStyler]')) {
                    try {
                        // Extract the logged object from the console message
                        const logMatch = text.match(/\[.*itemStyler\] (.+)/);
                        if (logMatch) {
                            itemStylerLogs.push({
                                text: text,
                                styler: text.match(/\[(.*) itemStyler\]/)?.[1],
                                timestamp: Date.now(),
                            });
                        }
                    } catch {
                        // Ignore parsing errors
                    }
                }
            });

            await gotoExample(page, url);
            await page.waitForSelector('#myChart canvas');

            // Switch to chart type
            await page.click(`button:has-text("${chartType}")`);
            await waitForAllChartUpdates(page);

            // Clear logs for this chart type
            itemStylerLogs.length = 0;

            // Interaction to trigger status updates
            await page.click(SELECTORS.canvasCenter, { position: { x: 250, y: 200 } });
            await page.keyboard.press('ArrowRight');
            await page.keyboard.press('ArrowRight');
            await page.keyboard.press('ArrowRight');
            await page.keyboard.press('ArrowRight');
            await page.keyboard.press('ArrowRight');

            await page.keyboard.press('ArrowDown');
            await page.keyboard.press('ArrowLeft');
            await page.keyboard.press('ArrowLeft');

            await page.keyboard.press('ArrowDown');
            await page.keyboard.press('ArrowRight');
            await page.keyboard.press('ArrowRight');

            await page.keyboard.press('ArrowDown');
            await page.keyboard.press('ArrowLeft');
            await page.keyboard.press('ArrowLeft');

            // Take screenshot showing keyboard focus for this chart type
            const screenshotName = `keyboard-navigation-${chartType.toLowerCase().replace(/[^a-z0-9]/g, '-')}.png`;
            await expect(page.locator(SELECTORS.canvasCenter)).toHaveScreenshot(screenshotName);

            // Focus on one (or more) legend items to cover series highlight state
            await page.keyboard.press('Tab');
            await page.keyboard.press('ArrowRight');
            await page.keyboard.press('ArrowRight');
            await page.keyboard.press('ArrowRight');
            await page.keyboard.press('ArrowRight');
            await page.keyboard.press('ArrowRight');

            // Verify no undefined values for highlightState in styler params
            const undefinedHighlightStateLogs = itemStylerLogs.filter(
                (log) =>
                    log.text.includes('highlightState: undefined') ||
                    log.text.includes('highlightState:undefined') ||
                    log.text.includes('"highlightState":undefined') ||
                    log.text.includes('"highlightState": undefined')
            );

            expect(undefinedHighlightStateLogs).toHaveLength(0);

            // Also verify that we have some valid highlight states
            const validHighlightStates = itemStylerLogs.filter(
                (log) =>
                    log.text.includes('highlightState:') &&
                    !log.text.includes('highlightState: undefined') &&
                    !log.text.includes('highlightState:undefined')
            );

            expect(validHighlightStates.length).toBeGreaterThan(0);

            // Take status panel screenshots
            const simpleChartName = chartType.toLowerCase().replace(/[^a-z0-9]/g, '-');
            const matrixScreenshotName = `matrix-${simpleChartName}.png`;

            // Add CSS to make the matrix more compact and fit in viewport
            await page.addStyleTag({
                content: `
                    .status-matrix-table {
                        font-size: 9px !important;
                        table-layout: fixed !important;
                        max-width: 1300px !important;
                    }
                    .status-matrix-table th,
                    .status-matrix-table td {
                        padding: 2px 3px !important;
                        font-size: 8px !important;
                        overflow: hidden !important;
                        text-overflow: ellipsis !important;
                    }
                    .status-matrix-table .config-header {
                        font-size: 7px !important;
                        width: 60px !important;
                        max-width: 60px !important;
                        height: 25px !important;
                        text-align: center !important;
                    }
                    .status-matrix-table .state-name {
                        font-size: 8px !important;
                        width: 100px !important;
                        max-width: 100px !important;
                    }
                    .matrix-cell {
                        width: 60px !important;
                        height: 16px !important;
                        min-width: 60px !important;
                        max-width: 60px !important;
                        padding: 1px !important;
                    }
                `,
            });

            // Take screenshots of the entire matrix table
            const matrixTable = page.locator('.status-matrix-table');
            await expect(matrixTable).toHaveScreenshot(matrixScreenshotName);
        });
    });
});
