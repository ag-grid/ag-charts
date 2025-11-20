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
        let buttonCount: number = 0;
        test.afterAll(() => {
            // Check that our <button> selector is not completely broken:
            expect(buttonCount).toBeGreaterThan(0);
        });

        const pageNames: string[] = findPagesWithAPIReferences();
        for (const name of pageNames) {
            test(name, async ({ page }) => {
                await gotoUrl(page, toPageUrl(`javascript/${name}`));

                const buttons = page.locator('button[class*="_seeMore"]');
                const count = await buttons.count();
                for (let i = 0; i < count; i++) {
                    const button = buttons.nth(i);
                    await button.click();
                    buttonCount++;
                }
                consoleLogs.expectNoErrors();
            });
        }
    });
});
