import type { Page } from '@playwright/test';

import { expect, test } from './fixture';
import { gotoUrl, setupIntrinsicAssertions, toPageUrl } from './util';

// The "On this page" nav only renders at $docs-nav-large (1475px) and above.
test.use({ viewport: { width: 1600, height: 900 } });

/**
 * The scroll spy activates a heading once it passes the page's `scroll-padding-top` line, which is
 * where anchor links land it — so clicking an entry must leave that same entry highlighted.
 */
async function expectNavSelfHighlighting(page: Page, uri: string) {
    await gotoUrl(page, toPageUrl(uri));

    const links = page.locator('nav[class*="sideNav"] li a');
    await expect(links.first()).toBeVisible();

    const count = await links.count();
    expect(count).toBeGreaterThan(1);

    // Index 0 is the page title, rendered as the "On this page" label rather than a section.
    for (let index = 1; index < count; index++) {
        const link = links.nth(index);
        await link.click();
        await expect(link).toHaveClass(/active/);
    }
}

test.describe('docs-page-nav', () => {
    setupIntrinsicAssertions(test);

    // API pages stack a second sticky bar under the site header, so their scroll offset is larger
    // than the rest of the docs.
    test('highlights the clicked section on an API page', async ({ page }) => {
        await expectNavSelfHighlighting(page, 'javascript/events/');
    });

    test('highlights the clicked section on a standard docs page', async ({ page }) => {
        await expectNavSelfHighlighting(page, 'javascript/bar-series/');
    });
});
