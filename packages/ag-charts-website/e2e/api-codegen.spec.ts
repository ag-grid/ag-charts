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

                // Click all "See More" code snippet buttons
                const buttons = page.locator('button[class*="_seeMore"]');
                const buttonCount = await buttons.count();
                for (let i = 0; i < buttonCount; i++) {
                    const button = buttons.nth(i);
                    await button.click();
                    totalButtonCount++;
                }
                consoleLogs.expectNoErrors();
            });
        }
    });
});
