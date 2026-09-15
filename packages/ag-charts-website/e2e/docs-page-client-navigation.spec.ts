import { expect, test } from './fixture';
import { gotoUrl, setupIntrinsicAssertions, toPageUrl } from './util';

// Docs pages render their API reference as a client-only island with a server-rendered fallback
// of the top-level properties. Both halves matter: the raw HTML has to carry the properties for
// crawlers, and the island has to replace them cleanly, including after a client-side navigation.
// Astro's ClientRouter swaps documents without a page load, so island module state (such as a
// query cache) survives; hydrating a server-rendered island against that state reports a mismatch.

test.use({ viewport: { width: 1400, height: 900 } });

const API_REFERENCE_SELECTOR = '[class*="apiReferenceOuter"]';
const FALLBACK_SELECTOR = '.api-reference-fallback';

test.describe('Docs page API reference', () => {
    // A series page renders gallery example cards, and the e2e environment deliberately skips
    // `generate-thumbnails` (see ci.yml), so those cards have no image to load.
    setupIntrinsicAssertions(test, { ignoreConsolePatterns: ['ag-charts-thumbnails'] });

    test('serves the top-level properties in the page HTML', async ({ request }) => {
        const response = await request.get(toPageUrl('javascript/box-plot-series/'));
        expect(response.ok()).toBe(true);
        const html = await response.text();

        const fallback = html.match(/<div class="api-reference-fallback">([\s\S]*?)<\/dl>/);
        expect(fallback, 'server-rendered reference fallback').not.toBeNull();
        expect(fallback![0]).toContain('AgBoxPlotSeriesOptions');
        expect(fallback![0]).toContain('id="reference-AgBoxPlotSeriesOptions-xKey"');
    });

    test('replaces the fallback with the island, also after client-side navigation', async ({ page }) => {
        await gotoUrl(page, toPageUrl('javascript/box-plot-series/'));
        await expect(page.locator(API_REFERENCE_SELECTOR).first()).toContainText('AgBoxPlotSeriesOptions');
        await expect(page.locator(FALLBACK_SELECTOR)).toHaveCount(0);

        const link = page.locator('a[href$="/javascript/candlestick-series/"]').first();
        await link.scrollIntoViewIfNeeded();
        await link.click();
        await page.waitForURL(/\/candlestick-series\//);

        await expect(page.locator(API_REFERENCE_SELECTOR).first()).toContainText('AgCandlestickSeriesOptions');
        await expect(page.locator(FALLBACK_SELECTOR)).toHaveCount(0);
    });
});
