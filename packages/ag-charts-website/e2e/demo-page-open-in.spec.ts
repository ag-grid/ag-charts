import type { Locator, Page } from '@playwright/test';

import { expect, test } from './fixture';
import { gotoUrl, toPageUrl } from './util';

const BUTTONS = ['Open in StackBlitz', 'See on GitHub'] as const;

// Viewports that put the buttons near an edge: wide and short, the hero's own scrolling column,
// and the stacked layout at 200% zoom of a laptop screen (1280x720 becomes 640x360).
const VIEWPORTS = [
    { name: 'wide', width: 1600, height: 900 },
    { name: 'short', width: 1400, height: 420 },
    { name: 'short, sticky header', width: 1400, height: 380 },
    { name: 'shorter, sticky header', width: 1280, height: 360 },
    { name: 'mid-height, sticky header', width: 1280, height: 500 },
    { name: '200% zoom', width: 640, height: 360 },
    { name: 'narrow', width: 360, height: 640 },
] as const;

// The hero layouts where a list flipped above its button reaches up towards the sticky site header.
const HERO_VIEWPORTS = VIEWPORTS.filter((viewport) => viewport.name.endsWith('sticky header'));

const CLICK_VIEWPORTS = [...HERO_VIEWPORTS, ...VIEWPORTS.filter((viewport) => viewport.name === '200% zoom')];

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
// see topmostAtEveryLinkCentre for the check that the header does not cover it.
async function expectWithinViewport(page: Page, box: Box) {
    const viewport = await viewportOf(page);
    expect(box.left).toBeGreaterThanOrEqual(0);
    expect(box.top).toBeGreaterThanOrEqual(0);
    expect(box.right).toBeLessThanOrEqual(viewport.width);
    expect(box.bottom).toBeLessThanOrEqual(viewport.height);
}

// Nothing, the sticky header included, covers a link: the topmost element at its centre is the link itself.
const topmostAtEveryLinkCentre = (list: Locator) =>
    list.evaluate((element) =>
        Array.from(element.querySelectorAll('a')).map((link) => {
            const { left, top, width, height } = link.getBoundingClientRect();
            const hit = document.elementFromPoint(left + width / 2, top + height / 2);
            return hit != null && link.contains(hit);
        })
    );

test.describe('demo page open-in menus', () => {
    for (const viewport of VIEWPORTS) {
        for (const label of BUTTONS) {
            for (const scroll of SCROLLS) {
                test(`${label} list stays in the visible area at ${viewport.name} (${viewport.width}x${viewport.height}), button scrolled: ${scroll}`, async ({
                    page,
                }) => {
                    await page.setViewportSize({ width: viewport.width, height: viewport.height });
                    await gotoUrl(page, toPageUrl('examples/'));

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
                    const reachable = await topmostAtEveryLinkCentre(list);
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
        // Aligned to the button's left edge, as the list always was.
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
        test(`a list flipped above its button is not covered by the sticky header at ${viewport.name} (${viewport.width}x${viewport.height})`, async ({
            page,
        }) => {
            await page.setViewportSize({ width: viewport.width, height: viewport.height });
            await gotoUrl(page, toPageUrl('examples/'));

            const menu = openInMenu(page, BUTTONS[1]);
            const summary = menu.locator('summary');
            await seatButton(summary, 'bottom');
            await summary.click();

            const summaryBox = await boxOf(summary);
            const listBox = await boxOf(menu.locator('ul'));
            // The case only means something while the header is sticky over the hero.
            expect(await stickyHeaderBottomOf(page)).toBeGreaterThan(0);
            expect(listBox.bottom).toBeLessThanOrEqual(summaryBox.top);
            await expectWithinViewport(page, listBox);
            expect((await topmostAtEveryLinkCentre(menu.locator('ul'))).every(Boolean)).toBe(true);
        });
    }
});
