import { type Locator, type Page } from '@playwright/test';

import { expect, test } from './fixture';
import { gotoExample, setupIntrinsicAssertions, toExamplePageUrl } from './util';

const SPARKLINE_COUNT = 30;
const ANY_STYLE = 'style[data-ag-charts]';
const COMMUNITY_STYLE = 'style[data-ag-charts="ag-charts-community"]';

test.describe('sparkline detached styles', () => {
    test.skip(({ browserName }) => browserName !== 'chromium', 'Chromium only');

    setupIntrinsicAssertions(test);

    test.beforeEach(async ({ page }) => {
        await gotoExample(page, toExamplePageUrl('sparklines-e2e', 'sparkline-detached-styles', 'vanilla').url);
    });

    const copiesAdded = (page: Page) => page.evaluate(() => (window as any).__styleCopiesAdded as number);
    const cellStyles = (page: Page) => page.locator(`#cells ${ANY_STYLE}`).count();
    const headStyles = (page: Page) => page.locator(`head ${COMMUNITY_STYLE}`).count();

    // A sparkline turns visible in the same size callback that places its styles.
    const visibleSparklines = (host: Locator) =>
        host.evaluate(
            (el) =>
                Array.from((el.shadowRoot ?? el).querySelectorAll('canvas')).filter(
                    (canvas) => getComputedStyle(canvas).visibility === 'visible'
                ).length
        );

    async function click(page: Page, name: string, host = page.locator('#cells')) {
        await page.getByText(name).click();
        await expect.poll(() => visibleSparklines(host)).toBe(SPARKLINE_COUNT);
    }

    test('new sparklines in detached cells write no stylesheet copies', async ({ page }) => {
        await click(page, 'Create Detached');

        expect(await copiesAdded(page)).toBe(0);
        expect(await cellStyles(page)).toBe(0);
        expect(await headStyles(page)).toBe(1);
    });

    test('pooled sparklines moved to detached cells keep no stylesheet copies', async ({ page }) => {
        await click(page, 'Create Detached');
        const before = await copiesAdded(page);

        await click(page, 'Re-render Pooled');

        expect(await copiesAdded(page)).toBe(before);
        expect(await cellStyles(page)).toBe(0);
        expect(await headStyles(page)).toBe(1);
    });

    // Each chart in a shadow root holds its own copy, as the head is outside the shadow root.
    test('sparklines attached into a shadow root are styled inside it', async ({ page }) => {
        await click(page, 'Create Detached');
        const headBefore = await page.locator(`head ${ANY_STYLE}`).count();

        const shadow = page.locator('#shadowHost');
        await click(page, 'Create In Shadow Root', shadow);

        expect(
            await shadow.evaluate((host, sel) => host.shadowRoot!.querySelectorAll(sel).length, COMMUNITY_STYLE)
        ).toBe(SPARKLINE_COUNT);
        expect(await page.locator(`head ${ANY_STYLE}`).count()).toBe(headBefore);
    });
});
