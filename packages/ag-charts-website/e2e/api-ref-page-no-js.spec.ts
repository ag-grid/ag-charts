import { type Page, expect, test } from '@playwright/test';

import { toPageUrl } from './util';

// The shared fixture and `gotoUrl` evaluate script in the page, which never resolves with JavaScript
// disabled, so these tests use Playwright's own `test` and `page.goto`.
test.use({ javaScriptEnabled: false, viewport: { width: 1400, height: 900 } });

function getFallbackNav(page: Page, section: 'Options' | 'Themes' = 'Options') {
    return page.getByRole('navigation', { name: `${section} API reference` });
}

function getNavLink(page: Page, name: string, section?: 'Options' | 'Themes') {
    return getFallbackNav(page, section).getByRole('link', { name, exact: true });
}

test.describe('api-ref-page without JavaScript', () => {
    test('options root links to each reference page', async ({ page }) => {
        await page.goto(toPageUrl('options/'), { waitUntil: 'domcontentloaded' });

        await expect(getNavLink(page, 'options')).toHaveAttribute('aria-current', 'page');
        await expect(getNavLink(page, "series[type='bar']")).toHaveAttribute('href', /\/options\/series\/bar\/$/);
        await expect(getNavLink(page, "axes.key[type='number']")).toHaveAttribute('href', /\/options\/axes\/number\/$/);
        // Past the depth cut-off, but kept because it is a page of its own.
        await expect(getNavLink(page, "navigator.miniChart.series[type='line']")).toHaveAttribute(
            'href',
            /\/options\/navigator\/miniChart\/series\/line\/$/
        );
    });

    test('options root links to its own properties', async ({ page }) => {
        await page.goto(toPageUrl('options/'), { waitUntil: 'domcontentloaded' });

        const nav = getFallbackNav(page);
        await expect(nav.locator('a[href$="/options/#reference-AgChartOptions-data"]')).toHaveText('data');
        await expect(nav.locator('a[href$="/options/#reference-AgChartOptions-legend-item"]')).toHaveText('item');
        await expect(page.locator('#reference-AgChartOptions-data')).toBeAttached();
    });

    test('options root renders a target for each nested link', async ({ page }) => {
        await page.goto(toPageUrl('options/'), { waitUntil: 'domcontentloaded' });

        await expect(page.locator('#reference-AgChartOptions-legend-item')).toBeAttached();
        await expect(page.locator('#reference-AgChartOptions-navigator-miniChart-series')).toBeAttached();
    });

    test('reference page links to the rest of the section', async ({ page }) => {
        await page.goto(toPageUrl('options/series/bar/'), { waitUntil: 'domcontentloaded' });

        const nav = getFallbackNav(page);
        await expect(getNavLink(page, "series[type='bar']")).toHaveAttribute('aria-current', 'page');
        await expect(getNavLink(page, 'options')).toHaveAttribute('href', /\/options\/$/);
        await expect(nav.locator('a[href$="/options/series/bar/#reference-AgBarSeriesOptions-fill"]')).toHaveText(
            'fill'
        );

        await getNavLink(page, "series[type='line']").click();
        await expect(page).toHaveURL(/\/options\/series\/line\/$/);
        await expect(page.locator('h1')).toContainText('line');
    });

    test('themes root links to its own properties', async ({ page }) => {
        await page.goto(toPageUrl('themes-api/'), { waitUntil: 'domcontentloaded' });

        const nav = getFallbackNav(page, 'Themes');
        await expect(getNavLink(page, 'theme', 'Themes')).toHaveAttribute('aria-current', 'page');
        await expect(nav.locator('a[href$="/themes-api/#reference-AgChartTheme-palette-fills"]')).toHaveText('fills');
        await expect(nav.locator('a[href$="/themes-api/#reference-AgChartTheme-overrides-bar"]')).toHaveText('bar');
        await expect(page.locator('#reference-AgChartTheme-palette-fills')).toBeAttached();
    });
});
