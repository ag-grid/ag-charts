import path from 'path';

import { expect, test } from './fixture';
import { createConsoleLogs, getPagesWithAPIReferences, gotoUrl, setupIntrinsicAssertions } from './util';

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

        const urls: string[] = getPagesWithAPIReferences();
        console.log(urls);

        for (const url of urls) {
            const basename = path.basename(url);
            test(basename, async ({ page }) => {
                await gotoUrl(page, url);

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
