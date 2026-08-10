import { type Page, expect, test } from '@playwright/test';

import {
    type ChartPopulation,
    expectChartPopulation,
    expectEveryChartHasData,
    waitForAllChartUpdates,
    watchConsole,
} from './chart-assertions';

// Depth coverage for the demos, on top of the generic smoke test in demos.spec.ts —
// which only asserts that *a* chart and *a* canvas exist, and so passes even if
// every chart but one silently failed to render.
//
// web-analytics is covered by its own spec, which layers tab switching on the same
// assertions; it is excluded here rather than duplicated.

interface DemoCase {
    id: string;
    population: ChartPopulation;
    /**
     * Put the demo into a deterministic state before asserting. Streaming demos must
     * stop ticking first, or `data-update-pending` flips back to true under the
     * settle check and the console window never closes.
     */
    settle?: (page: Page) => Promise<void>;
}

const DEMOS: DemoCase[] = [
    { id: 'starter', population: { structural: 1 } },
    { id: 'line', population: { structural: 1 } },
    { id: 'pie', population: { structural: 1 } },
    {
        id: 'financial',
        // Main financial chart, peer spread heatmap, peer performance chart, 3 gauges,
        // plus a sparkline cell per visible row across the three ticker grids. Those
        // grids virtualise, so the cell count tracks the viewport and only gets a floor.
        population: { structural: 6, minInGrid: 20 },
        settle: async (page) => {
            // Drive the stream through the app's own control rather than reaching into
            // its internals, so the test exercises the same path a user does.
            await page.getByRole('button', { name: /Pause/ }).click();
            await expect(page.getByRole('button', { name: /Live/ })).toBeVisible();
        },
    },
];

for (const { id, population, settle } of DEMOS) {
    test.describe(id, () => {
        test('renders every chart with data and no console noise', async ({ page }) => {
            const popConsoleIssues = watchConsole(page);

            await page.goto(`/#${id}`);
            await expect(page.locator(`[data-demo-id="${id}"]`)).toBeVisible();

            await settle?.(page);

            await expectChartPopulation(page, population, id);
            await waitForAllChartUpdates(page);
            await expectEveryChartHasData(page, id);

            expect(popConsoleIssues(), `${id}: console output while rendering`).toEqual([]);
        });
    });
}
