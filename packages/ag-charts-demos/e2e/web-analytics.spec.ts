import { type Page, expect, test } from '@playwright/test';

import {
    expectChartPopulation,
    expectEveryChartHasData,
    waitForAllChartUpdates,
    watchConsole,
} from './chart-assertions';

// Radix unmounts inactive `Tabs.Content`, so the generic smoke test only ever mounts the Overview
// tab; this spec adds the tab dimension to reach the other 12 charts.

const DEMO_ID = 'web-analytics';

const TABS = [
    // Traffic chart + one sparkline per KPI tile.
    { name: 'Overview', charts: 7 },
    // Visitor/device donuts, browser/channel bars, geo map, activity-by-day, heatmap.
    { name: 'Audience', charts: 7 },
    // Sankey, funnel, duration histogram, page performance, page treemap.
    { name: 'Behavior', charts: 5 },
] as const;

/** Switch to a tab, then wait for its charts to mount and settle. */
async function openTab(page: Page, { name, charts }: { name: string; charts: number }) {
    await page.getByRole('tab', { name, exact: true }).click();
    await expect(page.getByRole('tab', { name, exact: true })).toHaveAttribute('aria-selected', 'true');
    await expectChartPopulation(page, { structural: charts }, name);
    await waitForAllChartUpdates(page);
}

test.describe(DEMO_ID, () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(`/#${DEMO_ID}`);
        await expect(page.locator(`[data-demo-id="${DEMO_ID}"]`)).toBeVisible();
    });

    test('every tab renders its full chart set with data', async ({ page }) => {
        const popConsoleIssues = watchConsole(page);

        // The landing tab mounts without a click, so assert it in place first.
        const [overview] = TABS;
        await expectChartPopulation(page, { structural: overview.charts }, overview.name);
        await waitForAllChartUpdates(page);
        await expectEveryChartHasData(page, overview.name);
        expect(popConsoleIssues(), `console output while rendering ${overview.name}`).toEqual([]);

        for (const tab of TABS.slice(1)) {
            await openTab(page, tab);
            await expectEveryChartHasData(page, tab.name);
            expect(popConsoleIssues(), `console output while rendering ${tab.name}`).toEqual([]);
        }
    });

    test('returning to a tab remounts its charts with data', async ({ page }) => {
        const popConsoleIssues = watchConsole(page);
        await waitForAllChartUpdates(page);
        popConsoleIssues();

        // Radix unmounts inactive tab content, so coming back is a full remount.
        for (const tab of [...TABS.slice(1), TABS[0]]) {
            await openTab(page, tab);
        }

        await expectEveryChartHasData(page, `${TABS[0].name} (remounted)`);
        expect(popConsoleIssues(), 'console output across a full tab cycle').toEqual([]);
    });

    test('the sessions grid starts empty and prompts for a chart selection', async ({ page }) => {
        await waitForAllChartUpdates(page);
        await expect(page.locator('.wa-card-sub')).toHaveText('No days selected.');
        await expect(page.locator('.ag-overlay-no-rows-center')).toHaveText(
            'Click or drag across chart above to display matching sessions.'
        );
    });

    test('arrow keys move between the KPI metric tabs', async ({ page }) => {
        const tabs = page.locator('.wa-kpi-tabs [role="tab"]');
        const [first, second] = [tabs.nth(0), tabs.nth(1)];

        await expect(first).toHaveAttribute('aria-selected', 'true');
        await first.focus();
        await page.keyboard.press('ArrowRight');

        await expect(second).toHaveAttribute('aria-selected', 'true');
        await expect(second).toBeFocused();
        await expect(first).toHaveAttribute('aria-selected', 'false');

        // Wrapping backwards off the first tab reaches the last.
        await page.keyboard.press('ArrowLeft');
        await page.keyboard.press('ArrowLeft');
        await expect(tabs.last()).toHaveAttribute('aria-selected', 'true');
        await expect(tabs.last()).toBeFocused();
    });

    test('selecting a day on the traffic chart populates the sessions grid', async ({ page }) => {
        await waitForAllChartUpdates(page);
        await expect(page.locator('.wa-card-sub')).toHaveText('No days selected.');

        await page.locator('.wa-chart-box-lg').getByRole('img', { name: 'interactive chart' }).focus();
        // Focus enters on the previous-period series, which is not selectable.
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('Space');

        await expect(page.locator('.wa-card-sub')).toContainText('1 selected day');
        await expect(page.locator('.ag-overlay-no-rows-center')).toBeHidden();
    });

    test('the add-event form opens from the toolbar and dismisses on an outside click', async ({ page }) => {
        await waitForAllChartUpdates(page);
        const trigger = page.getByRole('button', { name: 'Add event' });
        const eventName = page.getByLabel('Event name');

        await trigger.click();
        await expect(eventName).toBeVisible();
        // The form takes focus when it opens, so it can be filled without reaching for the mouse.
        await expect(eventName).toBeFocused();

        await page.locator('.wa-card-title').first().click();
        await expect(eventName).toBeHidden();

        // Escape closes it too, and returns focus to the button that opened it.
        await trigger.click();
        await expect(eventName).toBeVisible();
        await page.keyboard.press('Escape');
        await expect(eventName).toBeHidden();
        await expect(trigger).toBeFocused();
    });

    test('widening the date range keeps a selection the new range still covers', async ({ page }) => {
        await waitForAllChartUpdates(page);

        await page.locator('.wa-chart-box-lg').getByRole('img', { name: 'interactive chart' }).focus();
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('Space');
        const selected = await page.locator('.wa-card-sub').textContent();
        expect(selected).toContain('1 selected day');

        await page.getByRole('combobox', { name: 'Date range' }).click();
        await page.getByRole('option', { name: 'Last 90 days' }).click();
        await waitForAllChartUpdates(page);

        // The selected day is still inside the wider range, so it survives the rebuild.
        await expect(page.locator('.wa-card-sub')).toHaveText(selected!);
    });

    test.describe('on a phone-sized viewport', () => {
        test.use({ viewport: { width: 390, height: 844 } });

        test('the Overview fits the viewport and scrolls only the KPI strip', async ({ page }) => {
            await waitForAllChartUpdates(page);

            const doc = await page.evaluate(() => ({
                scrollWidth: document.documentElement.scrollWidth,
                clientWidth: document.documentElement.clientWidth,
            }));
            expect(doc.scrollWidth).toBe(doc.clientWidth);

            const strip = await page.locator('.wa-kpi-tabs').evaluate((el) => ({
                scrollWidth: el.scrollWidth,
                clientWidth: el.clientWidth,
            }));
            expect(strip.scrollWidth).toBeGreaterThan(strip.clientWidth);
        });
    });

    // A tooltip would not open here: Radix opens those on hover and keyboard focus, never on tap.
    test.describe('on a touch device', () => {
        test.use({ hasTouch: true });

        test('the demo notice is reachable by tapping', async ({ page }) => {
            const notice = page.getByText(/synthetic and randomly generated/);
            await expect(notice).toBeHidden();

            await page.getByRole('button', { name: 'About this demo' }).tap();
            await expect(notice).toBeVisible();
        });
    });
});
