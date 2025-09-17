import { Locator } from '@playwright/test';

import { expect, test } from './fixture';
import { SELECTORS, createConsoleLogs, gotoExample, setupIntrinsicAssertions, toExamplePageUrl } from './util';

test.describe('release', () => {
    const consoleLogs = createConsoleLogs();

    setupIntrinsicAssertions(test);

    test.describe('for Angular FW', () => {
        test.describe('callbacks should happen in Zone.js zones', () => {
            const { url } = toExamplePageUrl('release-test', 'angular-zonejs', 'angular');

            test('when clicking each interactable area', async ({ page }) => {
                const doubleClickElement = async (element: Locator) => {
                    const bbox = await element.boundingBox();
                    expect(bbox).toBeDefined();
                    await page.mouse.dblclick(bbox!.x + bbox!.width / 2, bbox!.y + bbox!.height / 2);
                };
                const doubleClickFocusedElement = async () => {
                    await doubleClickElement(page.locator('.ag-charts-focus-indicator > :first-child'));
                };

                await gotoExample(page, url); // Stability checks wait for animations to complete.

                await page.keyboard.press('Tab');
                await page.keyboard.press('Space');
                expect(consoleLogs.getLogs()).toEqual(
                    expect.arrayContaining([
                        'nodeClick called from Angular Zone',
                        'seriesNodeClick called from Angular Zone',
                    ])
                );
                consoleLogs.clear();

                await doubleClickFocusedElement();
                expect(consoleLogs.getLogs()).toEqual(
                    expect.arrayContaining([
                        'nodeDoubleClick called from Angular Zone',
                        'seriesNodeDoubleClick called from Angular Zone',
                    ])
                );
                consoleLogs.clear();

                await page.keyboard.press('Tab');
                await page.keyboard.press('Space');
                expect(consoleLogs.getLogs()).toEqual(
                    expect.arrayContaining(['legendItemClick called from Angular Zone'])
                );
                consoleLogs.clear();

                await doubleClickElement(page.locator(SELECTORS.legendItems).first());
                expect(consoleLogs.getLogs()).toEqual(
                    expect.arrayContaining(['legendItemDoubleClick called from Angular Zone'])
                );
                consoleLogs.clear();

                await doubleClickElement(page.locator(SELECTORS.canvas));
                expect(consoleLogs.getLogs()).toEqual(expect.arrayContaining(['doubleClick called from Angular Zone']));
                consoleLogs.clear();
            });
        });
    });
});
