import { expect, test } from './fixture';
import { gotoUrl, setupIntrinsicAssertions, toPageUrl } from './util';

test.use({ viewport: { width: 1400, height: 900 } });

const PAGE_URL = 'javascript/axes-cross-lines/';

// The label type is what the per-axis split exists to show: Cartesian labels take position and
// rotation, radius labels take positionAngle, and angle labels take neither.
const TABS = [
    { id: 'AgCartesianLineCrossLineOptions', labelType: 'AgCartesianCrossLineLabelOptions' },
    { id: 'AgCartesianRangeCrossLineOptions', labelType: 'AgCartesianCrossLineLabelOptions' },
    { id: 'AgAngleLineCrossLineOptions', labelType: 'AgBaseCrossLineLabelOptions' },
    { id: 'AgAngleRangeCrossLineOptions', labelType: 'AgBaseCrossLineLabelOptions' },
    { id: 'AgRadiusLineCrossLineOptions', labelType: 'AgRadiusCrossLineLabelOptions' },
    { id: 'AgRadiusRangeCrossLineOptions', labelType: 'AgRadiusCrossLineLabelOptions' },
];

test.describe('Cross Lines API reference', () => {
    setupIntrinsicAssertions(test);

    // All six panels are in the DOM at once and the tab control only toggles their `display`, so
    // every panel's rows are assertable from a single page load. Assertions are scoped to
    // `[tab-id]` because a page-wide locator would match all six references, and they are on the
    // DOM rather than on visibility so that no tab has to be clicked: driving the tab nav pushes a
    // hash through Astro's router, which re-renders the reference mid-assertion.
    test('renders a property table for each per-axis variant', async ({ page }) => {
        await gotoUrl(page, toPageUrl(PAGE_URL));

        for (const { id, labelType } of TABS) {
            const panel = page.locator(`[tab-id="${id}"]`);
            await expect(panel).toHaveCount(1);
            await expect(panel.locator(`#reference-${id}-type`)).toHaveCount(1);

            const label = panel.locator(`#reference-${id}-label`);
            await expect(label).toHaveCount(1);
            await expect(label).toContainText(labelType);
        }
    });

    // The first tab is the one a reader lands on, so it is the one whose rows must actually render.
    test('shows the Cartesian Line table on load', async ({ page }) => {
        await gotoUrl(page, toPageUrl(PAGE_URL));

        const panel = page.locator('[tab-id="AgCartesianLineCrossLineOptions"]');
        await expect(panel).toBeVisible();
        await expect(panel.locator('#reference-AgCartesianLineCrossLineOptions-type')).toBeVisible();
        await expect(panel.locator('#reference-AgCartesianLineCrossLineOptions-label')).toBeVisible();
    });
});
