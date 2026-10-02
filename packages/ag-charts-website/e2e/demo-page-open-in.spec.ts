import type { Locator, Page } from '@playwright/test';

import { expect, test } from './fixture';
import { gotoUrl, toPageUrl } from './util';

const BUTTONS = ['Open in StackBlitz', 'See on GitHub'] as const;

interface ViewportCase {
    name: string;
    width: number;
    height: number;
    // The hero layout, where a list flipped above its button reaches up towards the sticky site header.
    hero?: true;
    // Click the first link as well as measuring the list.
    click?: true;
    // Show the announcement banner, whatever the content's schedule says today.
    banner?: true;
}

// Viewports that put the buttons near an edge: wide and short, the hero's own scrolling column,
// and the stacked layout at 200% zoom of a laptop screen (1280x720 becomes 640x360).
const VIEWPORTS: ViewportCase[] = [
    { name: 'wide', width: 1600, height: 900 },
    { name: 'short', width: 1400, height: 420 },
    { name: 'short, sticky header', width: 1400, height: 380, hero: true, click: true },
    { name: 'shorter, sticky header', width: 1280, height: 360, hero: true, click: true },
    { name: 'mid-height, sticky header', width: 1280, height: 500, hero: true, click: true },
    { name: 'very short, sticky header, banner', width: 1400, height: 280, hero: true, click: true, banner: true },
    { name: '200% zoom', width: 640, height: 360, click: true },
    { name: 'narrow', width: 360, height: 640 },
];

const HERO_VIEWPORTS = VIEWPORTS.filter((viewport) => viewport.hero);

const CLICK_VIEWPORTS = VIEWPORTS.filter((viewport) => viewport.click);

// Either seat the button on the bottom edge of what is visible, the reported failure, or leave it
// wherever the page loads it, which is mid-hero on the taller viewports.
const SCROLLS = ['bottom', 'none'] as const;
type Scroll = (typeof SCROLLS)[number];

interface Box {
    left: number;
    top: number;
    right: number;
    bottom: number;
}

const boxOf = (locator: Locator): Promise<Box> =>
    locator.evaluate((element) => {
        const { left, top, right, bottom } = element.getBoundingClientRect();
        return { left, top, right, bottom };
    });

const viewportOf = (page: Page) => page.evaluate(() => ({ width: window.innerWidth, height: window.innerHeight }));

const openInMenu = (page: Page, label: string) =>
    page.locator('details[data-open-in-menu]').filter({ has: page.locator('summary', { hasText: label }) });

// The bottom edge of the site header while it is sticky over the page, else 0.
const stickyHeaderBottomOf = (page: Page) =>
    page.evaluate(() => {
        const header = document.querySelector('header.site-header');
        if (header == null || getComputedStyle(header).position !== 'sticky') return 0;
        return Math.max(0, header.getBoundingClientRect().bottom);
    });

async function seatButton(summary: Locator, scroll: Scroll) {
    if (scroll === 'bottom') {
        await summary.evaluate((element) => element.scrollIntoView({ block: 'end' }));
    }
}

// Inside the viewport. The list may be raised over the sticky header, so being on screen is not enough:
// see topmostAtEveryLinkPoint for the check that the header does not cover it.
async function expectWithinViewport(page: Page, box: Box) {
    const viewport = await viewportOf(page);
    expect(box.left).toBeGreaterThanOrEqual(0);
    expect(box.top).toBeGreaterThanOrEqual(0);
    expect(box.right).toBeLessThanOrEqual(viewport.width);
    expect(box.bottom).toBeLessThanOrEqual(viewport.height);
}

// Nothing, the sticky header and announcement banner included, covers a link: the topmost element
// at the centre of each link and just inside its top edge is the link itself. The top edge is where
// something stacked above the list's upper end shows first.
const topmostAtEveryLinkPoint = (list: Locator) =>
    list.evaluate((element) =>
        Array.from(element.querySelectorAll('a')).flatMap((link) => {
            const { left, top, width, height } = link.getBoundingClientRect();
            return [top + height / 2, top + 1].map((y) => {
                const hit = document.elementFromPoint(left + width / 2, y);
                return hit != null && link.contains(hit);
            });
        })
    );

// Shows the announcement banner where the viewport case asks for it, and returns its bottom edge.
async function showBanner(page: Page, viewport: ViewportCase) {
    if (viewport.banner !== true) return 0;
    const banner = page.locator('[data-announcement-banner]');
    test.skip((await banner.count()) === 0, 'The announcement banner is disabled in the site content');
    await page.evaluate(() => {
        document.documentElement.dataset.showAnnouncement = 'true';
    });
    await expect(banner).toBeVisible();
    return (await boxOf(banner)).bottom;
}

test.describe('demo page open-in menus', () => {
    for (const viewport of VIEWPORTS) {
        for (const label of BUTTONS) {
            for (const scroll of SCROLLS) {
                test(`${label} list stays in the visible area at ${viewport.name} (${viewport.width}x${viewport.height}), button scrolled: ${scroll}`, async ({
                    page,
                }) => {
                    await page.setViewportSize({ width: viewport.width, height: viewport.height });
                    await gotoUrl(page, toPageUrl('examples/'));
                    await showBanner(page, viewport);

                    const menu = openInMenu(page, label);
                    const summary = menu.locator('summary');
                    const list = menu.locator('ul');

                    await seatButton(summary, scroll);
                    await summary.click();
                    await expect(menu).toHaveJSProperty('open', true);
                    await expect(list.locator('a').first()).toBeVisible();

                    const listBox = await boxOf(list);
                    const summaryBox = await boxOf(summary);
                    await expectWithinViewport(page, listBox);

                    // Every link can be reached, none hidden under the header or anything else.
                    const reachable = await topmostAtEveryLinkPoint(list);
                    expect(reachable.length).toBeGreaterThan(0);
                    expect(reachable.every(Boolean)).toBe(true);

                    // Beside or beyond the button, never covering it.
                    const overlapsButton =
                        listBox.left < summaryBox.right &&
                        listBox.right > summaryBox.left &&
                        listBox.top < summaryBox.bottom &&
                        listBox.bottom > summaryBox.top;
                    expect(overlapsButton).toBe(false);
                });
            }
        }
    }

    test('opens below the button when there is room', async ({ page }) => {
        await page.setViewportSize({ width: 1600, height: 1400 });
        await gotoUrl(page, toPageUrl('examples/'));

        const menu = openInMenu(page, BUTTONS[0]);
        await menu.locator('summary').click();

        const summaryBox = await boxOf(menu.locator('summary'));
        const listBox = await boxOf(menu.locator('ul'));
        expect(listBox.top).toBeGreaterThanOrEqual(summaryBox.bottom);
        // Aligned to the button's left edge.
        expect(Math.abs(listBox.left - summaryBox.left)).toBeLessThanOrEqual(1);
    });

    test('flips above the button when the button is at the bottom of a short viewport', async ({ page }) => {
        await page.setViewportSize({ width: 1400, height: 420 });
        await gotoUrl(page, toPageUrl('examples/'));

        const menu = openInMenu(page, BUTTONS[1]);
        const summary = menu.locator('summary');
        await summary.evaluate((element) => element.scrollIntoView({ block: 'end' }));
        await summary.click();

        const summaryBox = await boxOf(summary);
        const listBox = await boxOf(menu.locator('ul'));
        expect(listBox.bottom).toBeLessThanOrEqual(summaryBox.top);
        await expectWithinViewport(page, listBox);
    });

    for (const viewport of CLICK_VIEWPORTS) {
        for (const scroll of SCROLLS) {
            test(`the first listed link can be clicked at ${viewport.name} (${viewport.width}x${viewport.height}), button scrolled: ${scroll}`, async ({
                page,
            }) => {
                await page.setViewportSize({ width: viewport.width, height: viewport.height });
                // The links leave the site; the test only needs the click to land.
                await page
                    .context()
                    .route(/^https:\/\/(stackblitz|github)\.com\//, (route) => route.fulfill({ body: '' }));
                await gotoUrl(page, toPageUrl('examples/'));
                await showBanner(page, viewport);

                const menu = openInMenu(page, BUTTONS[0]);
                const summary = menu.locator('summary');
                await seatButton(summary, scroll);
                await summary.click();

                // Opens in a new tab; a click that landed would have closed the menu.
                const popup = page.waitForEvent('popup');
                await menu.locator('ul a').first().click();
                await (await popup).close();
                await expect(menu).toHaveJSProperty('open', false);
            });
        }
    }

    for (const viewport of HERO_VIEWPORTS) {
        test(`a list flipped above its button is not covered by the sticky header or banner at ${viewport.name} (${viewport.width}x${viewport.height})`, async ({
            page,
        }) => {
            await page.setViewportSize({ width: viewport.width, height: viewport.height });
            await gotoUrl(page, toPageUrl('examples/'));
            const bannerBottom = await showBanner(page, viewport);

            const menu = openInMenu(page, BUTTONS[1]);
            const summary = menu.locator('summary');
            await seatButton(summary, 'bottom');
            await summary.click();

            const summaryBox = await boxOf(summary);
            const listBox = await boxOf(menu.locator('ul'));
            // The case only means something while the header is sticky over the hero.
            expect(await stickyHeaderBottomOf(page)).toBeGreaterThan(0);
            // And, where the banner is shown, while the list reaches up into the banner's band.
            if (viewport.banner === true) expect(listBox.top).toBeLessThan(bannerBottom);
            expect(listBox.bottom).toBeLessThanOrEqual(summaryBox.top);
            await expectWithinViewport(page, listBox);
            const reachable = await topmostAtEveryLinkPoint(menu.locator('ul'));
            expect(reachable.length).toBeGreaterThan(0);
            expect(reachable.every(Boolean)).toBe(true);
        });
    }
});
