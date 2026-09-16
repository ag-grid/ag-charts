import { expect, test } from './fixture';
import { gotoUrl, setupIntrinsicAssertions, toPageUrl } from './util';

// Below $breakpoint-gallery-small the sidebar collapses into a horizontal strip; the sidebar
// proper is the layout this nav is built for.
test.use({ viewport: { width: 1600, height: 900 } });

test.describe('gallery-page-nav', () => {
    // The gallery cards point at thumbnails that the e2e environment deliberately skips
    // generating (see ci.yml), so those 404s say nothing about the nav behaviour under test.
    setupIntrinsicAssertions(test, { ignoreConsolePatterns: ['ag-charts-thumbnails'] });

    // The nav scrolls with an offset rather than jumping, which means preventing the default and
    // writing the hash back by hand - so the address bar has to be asserted, not assumed.
    test('writes the clicked chart family to the URL hash', async ({ page }) => {
        await gotoUrl(page, toPageUrl('gallery/'));

        const links = page.locator('.menu a[href^="#"]');
        await expect(links.first()).toBeVisible();

        const count = await links.count();
        expect(count).toBeGreaterThan(1);

        for (let index = 0; index < count; index++) {
            const link = links.nth(index);
            const hash = await link.getAttribute('href');

            await link.click();

            await expect.poll(() => new URL(page.url()).hash).toBe(hash);
        }
    });
});
