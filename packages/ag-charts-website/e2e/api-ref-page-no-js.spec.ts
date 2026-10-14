import { type Page, expect, test } from '@playwright/test';

import { toPageUrl } from './util';

// The shared fixture and `gotoUrl` evaluate script in the page, which never resolves with JavaScript
// disabled, so these tests use Playwright's own `test` and `page.goto`.
test.use({ javaScriptEnabled: false, viewport: { width: 1400, height: 900 } });

function getFallbackNav(page: Page) {
    return page.getByRole('navigation', { name: 'Options API reference' });
}

function getNavLink(page: Page, name: string) {
    return getFallbackNav(page).getByRole('link', { name, exact: true });
}

test.describe('api-ref-page without JavaScript', () => {
    test('options root links to each reference page', async ({ page }) => {
        await page.goto(toPageUrl('options/'), { waitUntil: 'domcontentloaded' });

        await expect(getNavLink(page, 'options')).toHaveAttribute('aria-current', 'page');
        await expect(getNavLink(page, "series[type='bar']")).toHaveAttribute('href', /\/options\/series\/bar\/$/);
        await expect(getNavLink(page, "axes.key[type='number']")).toHaveAttribute('href', /\/options\/axes\/number\/$/);
    });

    test('reference page links to the rest of the section', async ({ page }) => {
        await page.goto(toPageUrl('options/series/bar/'), { waitUntil: 'domcontentloaded' });

        await expect(getNavLink(page, "series[type='bar']")).toHaveAttribute('aria-current', 'page');
        await expect(getNavLink(page, 'options')).toHaveAttribute('href', /\/options\/$/);

        await getNavLink(page, "series[type='line']").click();
        await expect(page).toHaveURL(/\/options\/series\/line\/$/);
        await expect(page.locator('h1')).toContainText('line');
    });
});
