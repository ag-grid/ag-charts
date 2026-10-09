import { type Locator, type Page, expect, test } from '@playwright/test';

import {
    expectIdLinkagesResolve,
    expectRadioGroupContract,
    expectSelectClosedTypeahead,
    expectSelectOpenTypeahead,
    expectTabsContract,
} from './a11y-assertions';
import {
    expectChartPopulation,
    expectEveryChartHasData,
    waitForAllChartUpdates,
    watchConsole,
} from './chart-assertions';

// demo-charts.spec.ts covers the landing tab's charts; per-tab chart population is asserted here
// because Radix unmounts inactive tab content and the generic sweep only ever sees My orders.

const DEMO_ID = 'procurement';

/**
 * The tabs follow her working cadences, and each mounts its own charts. Counts are exact: that is
 * what catches a chart that silently stopped rendering.
 */
const TABS = [
    // Arrival schedule, the delivery map, the on-time gauge and the at-risk segmented bar.
    { name: 'My orders', charts: 4 },
    // Per-supplier charts, so this count moves if the roster does.
    { name: 'My suppliers', charts: 13 },
    // The spend-YTD gauge, budget burn-up, monthly spend trend, sunburst and supplier concentration.
    { name: 'My spend', charts: 6 },
] as const;

// The Radix controls of the workspace, whose accessibility contract every framework port reproduces by hand.
const VIEWS = {
    name: 'Workspace views',
    tabs: TABS.map((tab) => tab.name),
    initial: 'My orders',
    orientation: 'vertical',
} as const;
/** The period select of My suppliers. */
const PERIOD = {
    name: 'Trailing period my supplier performance is read over',
    options: ['Last 12 months', 'Last 6 months'],
    initial: 'Last 12 months',
};
/** The period select of My spend. */
const SPEND_PERIOD = {
    name: 'Calendar period my spend is read over',
    options: ['YTD', 'This quarter'],
    initial: 'YTD',
};
/** The supplier-trend metric toggle group of My suppliers. */
const METRIC = { name: 'Trend metric', options: ['Price', 'On time', 'Quality'], initial: 'Price' };

/** Rows of the supplier roster grid, matched by the row class the demo sets. */
const rosterRows = (page: Page) => page.locator('.ag-row.pc-supplier');

/** Chips in the purchase-orders header, which state what the grid is actually showing. */
const chips = (page: Page) => page.locator('.pc-chip');

/**
 * How many order lines the grid is showing, read from its own header.
 *
 * Not a count of rendered rows: the grid paginates at twelve, so two selections of very different
 * sizes both fill a page and a DOM-row count cannot tell them apart.
 */
async function orderLineCount(page: Page): Promise<number> {
    const text = await page.locator('.pc-card-sub', { hasText: 'order lines' }).innerText();
    const [count] = text.replace(/,/g, '').match(/\d+/) ?? [];
    if (count == null) throw new Error(`no order-line count in "${text}"`);
    return Number(count);
}

/**
 * Opens the worklist overlay from the alert in the page head.
 *
 * The worklist is behind the alert on every tab rather than on the landing view, so every
 * assertion about it starts here.
 */
async function openWorklist(page: Page) {
    await page.locator('.pc-alert-trigger').click();
    await expect(page.locator('.pc-alert-panel')).toBeVisible();
}

/** The arrival schedule's chart card. */
const scheduleCard = (page: Page) =>
    page.locator('.pc-card', { has: page.getByRole('heading', { name: 'Arrival schedule' }) });

/**
 * The shipment the schedule's keyboard focus is on, read from the chart's own announcement.
 *
 * Keyboard selection runs the same click handler as the pointer, Space for a click and Ctrl+Space
 * for a Ctrl-click, without needing a datum's on-screen position.
 */
async function focusedShipment(card: Locator): Promise<{ shipmentId: string; supplier: string }> {
    const label = await card
        .locator('.ag-charts-series-area [aria-hidden="false"][aria-labelledby]')
        .evaluate((el) => document.getElementById(el.getAttribute('aria-labelledby') ?? '')?.textContent ?? '');
    const shipmentId = /SHP-\d+/.exec(label)?.[0];
    const supplier = /Lane; ([^;]+?) →/.exec(label)?.[1];
    if (shipmentId == null || supplier == null) throw new Error(`no shipment in "${label}"`);
    return { shipmentId, supplier };
}

/** Moves the schedule's keyboard focus to the next shipment along. */
async function focusNextShipment(page: Page, card: Locator) {
    const { shipmentId } = await focusedShipment(card);
    await page.keyboard.press('ArrowRight');
    await expect.poll(async () => (await focusedShipment(card)).shipmentId).not.toBe(shipmentId);
}

/** Picks an option from one of the orders tab's filter selects. */
async function setOrdersFilter(page: Page, name: string, option: string) {
    await page.getByRole('combobox', { name }).click();
    await page.getByRole('option', { name: option, exact: true }).click();
    await waitForAllChartUpdates(page);
}

const SUPPLIER_FILTER = 'Supplier my orders are narrowed to';

/** Switch to a tab, then wait for its charts to mount and settle. */
async function openTab(page: Page, name: string) {
    await page.getByRole('tab', { name, exact: true }).click();
    await expect(page.getByRole('tab', { name, exact: true })).toHaveAttribute('aria-selected', 'true');
    await waitForAllChartUpdates(page);
}

test.describe(DEMO_ID, () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(`/#${DEMO_ID}`);
        await expect(page.locator('.pc-app')).toBeAttached();
        await waitForAllChartUpdates(page);
    });

    test('every tab renders its full chart set with data', async ({ page }) => {
        const popConsoleIssues = watchConsole(page);

        const [landing] = TABS;
        await expectChartPopulation(page, { structural: landing.charts }, landing.name);
        await expectEveryChartHasData(page, landing.name);
        expect(popConsoleIssues(), `console output while rendering ${landing.name}`).toEqual([]);

        for (const tab of TABS.slice(1)) {
            await openTab(page, tab.name);
            await expectChartPopulation(page, { structural: tab.charts }, tab.name);
            await expectEveryChartHasData(page, tab.name);
            expect(popConsoleIssues(), `console output while rendering ${tab.name}`).toEqual([]);
        }
    });

    /** The distinguishing property of a personal view: it opens already scoped to her. */
    test('opens on her own commodity, with no filtering required', async ({ page }) => {
        // The page title is the active view; whose workspace it is sits in the sidebar account.
        await expect(page.getByRole('heading', { level: 1 })).toHaveText('My orders');
        await expect(page.locator('.pc-account-name')).toHaveText('Priya Chen');
        await expect(page.locator('.pc-account-title')).toHaveText('Commodity Manager');
        // Nothing is selected or filtered: the workspace opens on her whole remit, and only hers.
        await expect(page.getByRole('combobox', { name: SUPPLIER_FILTER })).toContainText('All suppliers');
        await expect(chips(page)).toHaveCount(0);
        await expect(page.getByRole('button', { name: 'Clear selection' })).toBeDisabled();
        // The order grid waits for a shipment to be selected, and says how to select one.
        await expect(page.locator('.pc-card-sub', { hasText: 'No shipment selected.' })).toBeVisible();
        await expect(page.locator('.ag-overlay-no-rows-center')).toContainText('Select a shipment on the map');

        // Her roster is a fixed, known set — the suppliers she owns.
        await openTab(page, 'My suppliers');
        const roster = rosterRows(page);
        expect(await roster.count()).toBeGreaterThanOrEqual(4);
        expect(await roster.count()).toBeLessThanOrEqual(6);
        await expect(page.locator('.pc-supplier-name').first()).toHaveText(/\S/);
    });

    /** The landing section leads with decisions, and each one resolves in place. */
    test('a worklist item resolves in place and leaves the list', async ({ page }) => {
        await openWorklist(page);
        const items = page.locator('.pc-attention-item');
        const before = await items.count();
        expect(before).toBeGreaterThan(0);

        const first = items.first();
        const title = await first.locator('.pc-attention-title').textContent();
        // Scoped to the action group: the item's body is itself a button, and pressing it resolves nothing.
        await first.locator('.pc-attention-actions').getByRole('button').first().click();

        await expect(items).toHaveCount(before - 1);
        await expect(page.locator('.pc-attention-title', { hasText: title! })).toHaveCount(0);
    });

    /**
     * The panel is modal — its scrim takes every click meant for the page behind it — so the
     * keyboard has to be contained with it, and handed back on the way out.
     */
    test('the worklist panel keeps keyboard focus and hands it back', async ({ page }) => {
        await openWorklist(page);
        const panel = page.locator('.pc-alert-panel');
        await expect(panel).toHaveAttribute('aria-modal', 'true');

        const focusInPanel = () => page.evaluate(() => !!document.activeElement?.closest('.pc-alert-panel'));
        // Well past the number of controls the panel holds, in both directions.
        for (let press = 1; press <= 12; press++) {
            await page.keyboard.press('Tab');
            expect(await focusInPanel(), `focus left the panel after ${press} Tab presses`).toBe(true);
        }
        for (let press = 1; press <= 12; press++) {
            await page.keyboard.press('Shift+Tab');
            expect(await focusInPanel(), `focus left the panel after ${press} Shift+Tab presses`).toBe(true);
        }

        // Resolving unmounts the control that was pressed, which is the other way focus gets lost.
        await page.locator('.pc-attention-actions').first().getByRole('button').first().click();
        expect(await focusInPanel(), 'focus left the panel when an item resolved').toBe(true);

        await page.keyboard.press('Escape');
        await expect(panel).toHaveCount(0);
        await expect(page.locator('.pc-alert-trigger')).toBeFocused();
    });

    test('selecting a worklist item selects its shipment on the orders tab', async ({ page }) => {
        const popConsoleIssues = watchConsole(page);
        await expect(chips(page)).toHaveCount(0);

        await openWorklist(page);
        await page.locator('.pc-attention-body').first().click();
        // Following an item dismisses the overlay, so the context it jumped to is visible.
        await expect(page.locator('.pc-alert-panel')).toHaveCount(0);
        await waitForAllChartUpdates(page);

        expect(await chips(page).count()).toBeGreaterThan(0);
        expect(await orderLineCount(page)).toBeGreaterThan(0);

        await page.getByRole('button', { name: 'Clear selection' }).click();
        await expect(chips(page)).toHaveCount(0);

        expect(popConsoleIssues(), 'console output while following a worklist item').toEqual([]);
    });

    test('Ctrl-click adds to the schedule selection, and a plain click narrows it to one', async ({ page }) => {
        const popConsoleIssues = watchConsole(page);
        const card = scheduleCard(page);
        await card.locator('.ag-charts-series-area').focus();

        const first = await focusedShipment(card);
        await page.keyboard.press('Space');
        await expect(chips(page)).toHaveText([first.shipmentId]);

        await focusNextShipment(page, card);
        const second = await focusedShipment(card);
        await page.keyboard.press('Control+Space');
        await expect(chips(page)).toHaveText([first.shipmentId, second.shipmentId]);
        await expect(page.locator('.pc-card-sub', { hasText: 'on 2 shipments' })).toBeVisible();

        // A plain click on a shipment already selected keeps it and drops the rest.
        await page.keyboard.press('Space');
        await expect(chips(page)).toHaveText([second.shipmentId]);

        await page.keyboard.press('Control+Space');
        await expect(chips(page)).toHaveCount(0);

        expect(popConsoleIssues(), 'console output while selecting on the schedule').toEqual([]);
    });

    test('the supplier filter narrows the freight, and drops a selected shipment it hides', async ({ page }) => {
        const popConsoleIssues = watchConsole(page);
        const card = scheduleCard(page);
        await card.locator('.ag-charts-series-area').focus();
        const selected = await focusedShipment(card);
        await page.keyboard.press('Space');
        await expect(chips(page)).toHaveText([selected.shipmentId]);

        await page.getByRole('combobox', { name: SUPPLIER_FILTER }).click();
        const options = await page.getByRole('option').allInnerTexts();
        await page.keyboard.press('Escape');
        const other = options.find((name) => name !== 'All suppliers' && name !== selected.supplier);
        expect(other, `a second supplier among ${options.join(', ')}`).toBeDefined();
        await setOrdersFilter(page, SUPPLIER_FILTER, other!);

        await expect(chips(page)).toHaveCount(0);
        await expect(page.locator('.pc-card-sub', { hasText: 'No shipment selected.' })).toBeVisible();
        // Refocusing repeats the last announcement; a key press reads the filtered rows afresh.
        await card.locator('.ag-charts-series-area').focus();
        await page.keyboard.press('ArrowRight');
        await expect.poll(async () => (await focusedShipment(card)).supplier).toBe(other);

        await setOrdersFilter(page, SUPPLIER_FILTER, 'All suppliers');
        expect(popConsoleIssues(), 'console output while filtering the orders tab').toEqual([]);
    });

    test('a supplier row selects within the suppliers tab, and selecting it again clears', async ({ page }) => {
        await openTab(page, 'My suppliers');
        const button = rosterRows(page).first().locator('.pc-supplier-main');

        await button.click();
        await expect(button).toHaveAttribute('aria-pressed', 'true');
        // The selection marks the row for the charts beside it, and reaches the pinned column too.
        await expect(page.locator('.ag-row.is-selected').first()).toBeVisible();

        await button.click();
        await expect(button).toHaveAttribute('aria-pressed', 'false');
        await expect(page.locator('.ag-row.is-selected')).toHaveCount(0);
    });

    /**
     * The rule the tabs are built on. Each answers its own question over its own window, so a
     * selection made on one must not rescope a grid the reader is not looking at — the failure it
     * replaces let a stale shipment keep the order grid while the suppliers tab moved underneath.
     */
    test('a selection on one tab never reaches another', async ({ page }) => {
        const popConsoleIssues = watchConsole(page);
        const noShipment = page.locator('.pc-card-sub', { hasText: 'No shipment selected.' });
        await expect(noShipment).toBeVisible();

        // A supplier selected on the suppliers tab leaves the order grid exactly as it was.
        await openTab(page, 'My suppliers');
        await rosterRows(page).first().locator('.pc-supplier-main').click();
        await openTab(page, 'My orders');
        await expect(chips(page)).toHaveCount(0);
        await expect(noShipment).toBeVisible();

        // A shipment selected here narrows this tab's grid, and only this tab's.
        await openWorklist(page);
        await page.locator('.pc-attention-body').first().click();
        await waitForAllChartUpdates(page);
        const scoped = await orderLineCount(page);
        expect(await chips(page).count()).toBe(1);

        // Going to another tab and back leaves that shipment selection untouched, not widened.
        await openTab(page, 'My spend');
        await openTab(page, 'My orders');
        expect(await orderLineCount(page)).toBe(scoped);

        expect(popConsoleIssues(), 'console output while selecting across tabs').toEqual([]);
    });

    /** The grid's Action column ties back to the worklist, per the spec. */
    test('recording an action on a PO line resolves the worklist item that raised it', async ({ page }) => {
        await openWorklist(page);
        const items = page.locator('.pc-attention-item');
        const before = await items.count();

        // Land on a flagged shipment's PO lines, then act on one of them.
        await page.locator('.pc-attention-body').first().click();
        await waitForAllChartUpdates(page);

        const actionCell = page.locator('.ag-cell[col-id="action"]').first();
        await actionCell.getByRole('button', { name: 'Resolve' }).click();

        await expect(actionCell.locator('.pc-po-action-done')).toHaveText(/Resolved/);
        await openWorklist(page);
        await expect(items).toHaveCount(before - 1);
    });

    /**
     * The explicit empty state the spec calls for by name: a manager with nothing outstanding sees
     * an all-clear, not a blank panel. Reached by actually clearing the worklist, so it also proves
     * every item is resolvable.
     */
    test('clearing every worklist item shows an explicit all-clear', async ({ page }) => {
        const popConsoleIssues = watchConsole(page);
        await openWorklist(page);
        const items = page.locator('.pc-attention-item');
        expect(await items.count()).toBeGreaterThan(0);

        // Always resolve the first remaining item: the list re-renders as each one leaves.
        for (let remaining = await items.count(); remaining > 0; remaining--) {
            await items.first().locator('.pc-attention-actions').getByRole('button').first().click();
            await expect(items).toHaveCount(remaining - 1);
        }

        await expect(page.locator('.pc-attention-clear')).toContainText('Nothing needs your attention');
        expect(popConsoleIssues(), 'console output while clearing the worklist').toEqual([]);
    });

    /**
     * The dataset is static, so the workspace must stay still: nothing repaints on a timer. The
     * inverse of the assertion this replaced, and worth keeping — a stray interval is invisible
     * until it fights a user interaction or a screenshot.
     */
    test('nothing repaints on its own — the data is static', async ({ page }) => {
        const popConsoleIssues = watchConsole(page);
        const sceneRenders = () =>
            page.evaluate(() =>
                [...document.querySelectorAll('.ag-charts-wrapper')].map((w) => w.getAttribute('data-scene-renders'))
            );

        const before = await sceneRenders();
        await page.waitForTimeout(6_000);

        expect(await sceneRenders(), 'charts redrew without any interaction').toEqual(before);
        expect(popConsoleIssues(), 'console output while idle').toEqual([]);
    });

    test.describe('accessibility contract of the Radix controls', () => {
        test('every aria-labelledby, aria-controls and label for names an element, on every tab', async ({ page }) => {
            await expectIdLinkagesResolve(page);
            for (const tab of TABS.slice(1)) {
                await openTab(page, tab.name);
                await expectIdLinkagesResolve(page);
            }
        });

        test('the workspace tabs link to their panels and rove focus', async ({ page }) => {
            await expectTabsContract(page, VIEWS);
        });

        test('typing on the closed period selects changes their value', async ({ page }) => {
            await openTab(page, 'My suppliers');
            await expectSelectClosedTypeahead(page, PERIOD);
            await openTab(page, 'My spend');
            await expectSelectClosedTypeahead(page, SPEND_PERIOD);
        });

        test('typing in the open period selects moves focus to the match', async ({ page }) => {
            await openTab(page, 'My suppliers');
            await expectSelectOpenTypeahead(page, PERIOD);
            await openTab(page, 'My spend');
            await expectSelectOpenTypeahead(page, SPEND_PERIOD);
        });

        test('the trend-metric group roves focus with the arrow keys', async ({ page }) => {
            await openTab(page, 'My suppliers');
            await expectRadioGroupContract(page, METRIC);
        });
    });
});
