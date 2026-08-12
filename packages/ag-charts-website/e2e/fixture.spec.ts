import type { Page } from '@playwright/test';

import { expect, test } from './fixture';

// Covers the navigation-safety contract of the stability waits this fixture wraps around every
// locator action. Both pages are served from route handlers, so nothing here depends on the dev
// server or on a real chart.

const linkPage = ({ navigates }: { navigates: boolean }) => `<html><body>
<a href="/next" id="link">Next</a>
<div class="ag-charts-wrapper" data-update-pending="false" data-animating="false"></div>
<script>
  const link = document.getElementById('link');
  // The chart starts an update as the click lands, so the post-click stability wait is still
  // polling the wrapper when the click's own consequences play out.
  link.addEventListener('mousedown', () => {
    document.querySelector('.ag-charts-wrapper').setAttribute('data-update-pending', 'true');
  });
  link.addEventListener('click', (e) => {
    e.preventDefault();
    ${navigates ? "setTimeout(() => { location.href = '/next'; }, 300);" : ''}
  });
</script>
</body></html>`;

const NEXT_PAGE = `<html><body><h1>A page with no charts</h1></body></html>`;

async function gotoLinkPage(page: Page, { navigates }: { navigates: boolean }) {
    await page.route('**/link', (route) => route.fulfill({ contentType: 'text/html', body: linkPage({ navigates }) }));
    await page.route('**/next', (route) => route.fulfill({ contentType: 'text/html', body: NEXT_PAGE }));
    await page.goto('http://charts-fixture.test/link');
}

test('a chart detached by navigation does not fail the wait', async ({ page }) => {
    await gotoLinkPage(page, { navigates: true });

    // The wrapper is counted on this document and gone from the next one. Waiting for a chart
    // that no longer exists to settle is not a failure — there is nothing left to settle.
    await page.getByRole('link', { name: 'Next' }).click();

    await expect(page).toHaveURL(/\/next/);
});

test('a chart that never settles still fails the wait', async ({ page }) => {
    await gotoLinkPage(page, { navigates: false });

    // The counterpart: the page stays put, so the unsettled wrapper is a real timeout and must
    // not be swallowed by the tolerance for charts detached by a navigation.
    await expect(page.getByRole('link', { name: 'Next' }).click()).rejects.toThrow(/toHaveAttribute/);
});
