import fs from 'fs';
import glob from 'glob';
import path from 'path';

import { expect, test } from './fixture';
import { createConsoleLogs, gotoUrl, setupIntrinsicAssertions, toPageUrl } from './util';

function findPagesWithAPIReferences(): string[] {
    // Regex that matches `{% apiReference ... /%}` even across multiple lines
    const apiRefRegex = /\{%\s*apiReference[\s\S]*?\/%\}/m;

    const pathsWithApiRef = glob.sync('./src/content/docs/**/index.mdoc').filter((filepath) => {
        const content = fs.readFileSync(filepath, 'utf8');
        return apiRefRegex.test(content);
    });

    // Extract the `**` part of the glob.
    return pathsWithApiRef.map((filepath) => {
        const dir = path.dirname(filepath);
        return path.relative('./src/content/docs', dir);
    });
}

test.use({ viewport: { width: 1400, height: 900 } });

test.describe('api-codegen', () => {
    const consoleLogs = createConsoleLogs();
    setupIntrinsicAssertions(test);

    /**
     * The API code snippet generator breaks if we use anonymous nested objects.
     *
     * Example:
     *    interface AgSomeParams {
     *        myThing?: { // ERROR! This myThing anonymous object should be declared in an `interface AgMyThing`
     *            myNumber?: number;
     *        };
     *    }
     *
     *    interface AgSomeRef {
     *        someCallback?: (params: AgSomeParams) => void;
     *    }
     *
     * When generating the docs for {% apiReference id="AgSomeRef" /%}, this faulty example will log an error in the
     * console when clicking the "See More" button of the `someCallback` option.
     *
     * These playwright-tests check that the console is clear from errors when clicking these buttons.
     */
    test.describe('expand see-more buttons', () => {
        let totalSpanCount: number = 0;
        let totalButtonCount: number = 0;
        test.afterAll(() => {
            // Check that our <span> & <button> selectors are not completely broken:
            expect(totalSpanCount).toBeGreaterThan(0);
            expect(totalButtonCount).toBeGreaterThan(0);
        });

        const pageNames: string[] = findPagesWithAPIReferences();
        for (const name of pageNames) {
            test(name, async ({ page }) => {
                await gotoUrl(page, toPageUrl(`javascript/${name}`));

                // Recursively expand all nest properties
                while (true) {
                    const spanCount = await page.evaluate(() => {
                        const selector =
                            `div[class*="_propertyRow"]:not([class*="_expandedChildProps"]) ` +
                            `> div > div > span[class*="_propNameExpander"]`;
                        const selection = document.querySelectorAll(selector);
                        selection.forEach((el) => (el as HTMLSpanElement).click());
                        return selection.length;
                    });
                    expect(spanCount).toBeGreaterThanOrEqual(0);
                    totalSpanCount += spanCount;
                    if (spanCount === 0) {
                        break;
                    }
                }
                consoleLogs.clear(); // ignore React errors fired by calling .click(); we don't care about that

                // Click all "See More" code snippet buttons
                const buttonCount = await page.evaluate(() => {
                    const buttons = document.querySelectorAll('button[class*="_seeMore"]');
                    buttons.forEach((el) => (el as HTMLButtonElement).click());
                    return buttons.length;
                });
                expect(buttonCount).toBeGreaterThanOrEqual(0);
                totalButtonCount += buttonCount;

                consoleLogs.expectNoErrors();
            });
        }
    });
});
