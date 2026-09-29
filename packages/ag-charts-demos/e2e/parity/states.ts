import { type Page, expect } from '@playwright/test';

import { waitForAllChartUpdates } from '../chart-assertions';

// The named states each demo is photographed in. Every state starts from a fresh load of the demo
// in deterministic mode; `run` drives the page there through the same controls a user has, so a
// port must reproduce the control as well as the pixels. The interactions are the ones the
// functional specs (procurement.spec.ts, web-analytics.spec.ts, demo-charts.spec.ts) exercise.

/**
 * How long a demo's shell may take to appear. Loaded in deterministic mode, the React app first
 * waits up to three seconds for its web fonts (src/fonts.ts), and a busy machine loading both sides at once has been seen to exceed the default
 * five seconds.
 */
const FIRST_LOAD_TIMEOUT = 15_000;

export interface DemoState {
    /** Stable name; it is the key in the JSON summary and the artefact folder. */
    name: string;
    /** Drive the page from its initial state to this one. Omitted for the initial state. */
    run?: (page: Page) => Promise<void>;
}

export interface DemoStates {
    /** Resolves once the demo shell and its first charts are on the page. */
    ready: (page: Page) => Promise<void>;
    /**
     * The demo's own scroll regions, as CSS selectors. Each demo is a viewport-filling shell
     * (`position: fixed; inset: 0`) whose content scrolls inside these, so the page itself never
     * scrolls and a screenshot shows only what fits the viewport. `growToContent` makes the viewport
     * tall enough that none of them scrolls, so everything below the fold is compared too.
     */
    scrollContainers: readonly string[];
    states: DemoState[];
}

/** Switch to a tab, then wait for its charts to mount and settle. */
async function openTab(page: Page, name: string) {
    const tab = page.getByRole('tab', { name, exact: true });
    await tab.click();
    await expect(tab).toHaveAttribute('aria-selected', 'true');
    await waitForAllChartUpdates(page);
}

/**
 * Wait for the page to stop changing: every chart settled and painted, and any chart that
 * mounted late (virtualised grid cells) settled as well.
 */
export async function settle(page: Page) {
    await expect(page.locator('.ag-overlay-loading-center')).toHaveCount(0);
    await waitForAllChartUpdates(page);
    await page.evaluate(() => document.fonts.ready);
    // Two frames: one for any queued render to run, one for its paint to land.
    await page.evaluate(
        () => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))
    );
    await waitForAllChartUpdates(page);
}

/**
 * Rounds of growing before giving up. The demos size their charts with `clamp(min, Nvh, max)`, so
 * each round's extra height grows the charts too and the overflow shrinks geometrically until
 * every clamp reaches its maximum; the slowest state measured needs eight rounds.
 */
const MAX_GROW_ROUNDS = 30;

/**
 * Make the viewport tall enough that no scroll region in `selectors` overflows, keeping its width,
 * and settle again at each step (the charts lay out afresh at the new size). Each round grows the
 * viewport by exactly the largest overflow, so it approaches the shortest height that fits from
 * below and never overshoots it; it repeats because the new height reflows what is inside
 * (viewport-relative chart heights, a grid rendering more rows). Returns the final viewport.
 */
export async function growToContent(page: Page, selectors: readonly string[]) {
    const viewport = page.viewportSize();
    if (!viewport) throw new Error('growToContent needs a page with a fixed viewport');
    for (let round = 0; round < MAX_GROW_ROUNDS; round++) {
        const overflow = await page.evaluate((regions) => {
            let most = 0;
            for (const selector of regions) {
                for (const element of document.querySelectorAll(selector)) {
                    most = Math.max(most, element.scrollHeight - element.clientHeight);
                }
            }
            return most;
        }, selectors);
        if (overflow <= 0) return viewport;
        viewport.height += overflow;
        await page.setViewportSize(viewport);
        await settle(page);
    }
    throw new Error(
        `the content of ${selectors.join(', ')} still overflows after growing the viewport to ${viewport.height}px`
    );
}

export const DEMO_STATES: Record<string, DemoStates> = {
    financial: {
        ready: async (page) => {
            await expect(page.locator('.fin-container')).toBeVisible({ timeout: FIRST_LOAD_TIMEOUT });
            // Deterministic mode starts paused; the seed history is what renders.
            await expect(page.getByRole('button', { name: /Live/ })).toBeVisible();
            await expect(page.locator('.fin-watchlist-grid .ag-row').first()).toBeVisible();
            await expect(page.locator('.ag-charts-wrapper').first()).toBeVisible();
        },
        scrollContainers: ['.fin-sidebar', '.fin-main'],
        states: [
            { name: 'initial' },
            {
                // Selecting an instrument swaps every detail chart to another feed.
                name: 'instrument-selected',
                run: async (page) => {
                    await page.locator('.fin-watchlist-grid .ag-row', { hasText: 'NOVA' }).first().click();
                    await expect(page.locator('.fin-quote-symbol')).toHaveText('Nova Semiconductors');
                    await waitForAllChartUpdates(page);
                },
            },
            {
                // The shared range drives the zoom and both peer charts' windows.
                name: 'range-1h',
                run: async (page) => {
                    const button = page.getByRole('radio', { name: '1H', exact: true });
                    await button.click();
                    await expect(button).toHaveAttribute('aria-checked', 'true');
                    await waitForAllChartUpdates(page);
                },
            },
        ],
    },
    'web-analytics': {
        ready: async (page) => {
            await expect(page.locator('.wa-app')).toBeVisible({ timeout: FIRST_LOAD_TIMEOUT });
            await expect(page.locator('.ag-charts-wrapper').first()).toBeVisible();
        },
        scrollContainers: ['.wa-body'],
        states: [
            { name: 'overview' },
            { name: 'audience', run: (page) => openTab(page, 'Audience') },
            { name: 'behavior', run: (page) => openTab(page, 'Behavior') },
            {
                // Keyboard selection of a day on the traffic chart populates the sessions grid.
                name: 'day-selected',
                run: async (page) => {
                    await page.locator('.wa-chart-box-lg').getByRole('img', { name: 'interactive chart' }).focus();
                    // Focus enters on the previous-period series, which is not selectable.
                    await page.keyboard.press('ArrowDown');
                    await page.keyboard.press('Space');
                    await expect(page.locator('.wa-card-sub')).toContainText('1 selected day');
                    await expect(page.locator('.ag-row').first()).toBeVisible();
                },
            },
            {
                name: 'add-event-open',
                run: async (page) => {
                    await page.getByRole('button', { name: 'Add event' }).click();
                    await expect(page.getByLabel('Event name')).toBeVisible();
                },
            },
        ],
    },
    procurement: {
        ready: async (page) => {
            await expect(page.locator('.pc-app')).toBeVisible({ timeout: FIRST_LOAD_TIMEOUT });
            await expect(page.locator('.ag-charts-wrapper').first()).toBeVisible();
        },
        scrollContainers: ['.pc-sidebar', '.pc-body'],
        states: [
            { name: 'my-orders' },
            { name: 'my-suppliers', run: (page) => openTab(page, 'My suppliers') },
            { name: 'my-spend', run: (page) => openTab(page, 'My spend') },
            {
                name: 'worklist-open',
                run: async (page) => {
                    await page.locator('.pc-alert-trigger').click();
                    await expect(page.locator('.pc-alert-panel')).toBeVisible();
                },
            },
            {
                // A supplier selection marks its row and rescopes the charts beside it.
                name: 'supplier-selected',
                run: async (page) => {
                    await openTab(page, 'My suppliers');
                    const button = page.locator('.ag-row .pc-supplier-main').first();
                    await button.click();
                    await expect(button).toHaveAttribute('aria-pressed', 'true');
                    await waitForAllChartUpdates(page);
                },
            },
        ],
    },
};
