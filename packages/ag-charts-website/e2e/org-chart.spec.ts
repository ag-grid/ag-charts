import { expect, test } from './fixture';
import { expectChartScreenshot } from './scene-capture';
import {
    canvasToPageTransformer,
    createConsoleLogs,
    delay,
    gotoExample,
    setupIntrinsicAssertions,
    toExamplePageUrl,
    toExamplePageUrls,
} from './util';

test.describe('collapse', () => {
    setupIntrinsicAssertions(test);

    const consoleLogs = createConsoleLogs();

    test.describe('organization-series', () => {
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
});
