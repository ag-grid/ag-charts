import { type Page, expect, test } from '@playwright/test';

import {
    expectChartPopulation,
    expectEveryChartHasData,
    waitForAllChartUpdates,
    watchConsole,
} from './chart-assertions';

// Depth coverage for the web-analytics demo. The shared per-chart assertions live in
// chart-assertions.ts alongside demo-charts.spec.ts; what this spec adds is the tab
// dimension. Radix unmounts inactive `Tabs.Content`, so the generic smoke test in
// demos.spec.ts only ever sees the Overview tab — 11 of the 13 charts, including
// every enterprise series, are never mounted by it.

const DEMO_ID = 'web-analytics';

const TABS = [
    // Traffic chart + one sparkline per KPI tile.
    { name: 'Overview', charts: 7 },
    // Visitor/device donuts, browser/channel bars, geo map, activity-by-day, heatmap.
    { name: 'Audience', charts: 7 },
    // Sankey, funnel, duration histogram, page performance.
    { name: 'Behavior', charts: 4 },
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
});
