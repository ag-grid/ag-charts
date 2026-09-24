import { expect, test } from './fixture';
import { gotoUrl, setupIntrinsicAssertions, toPageUrl } from './util';

test.use({ viewport: { width: 1400, height: 900 } });

const PAGE_URL = 'javascript/axes-cross-lines/';

const CARTESIAN = {
    labelType: 'AgCartesianCrossLineLabelOptions',
    present: ['position', 'rotation'],
    absent: ['positionAngle'],
};
const ANGLE = {
    labelType: 'AgBaseCrossLineLabelOptions',
    present: ['text'],
    absent: ['position', 'rotation', 'positionAngle'],
};
const RADIUS = {
    labelType: 'AgRadiusCrossLineLabelOptions',
    present: ['positionAngle'],
    absent: ['position', 'rotation'],
};

const TABS = [
    { id: 'AgCartesianLineCrossLineOptions', ...CARTESIAN },
    { id: 'AgCartesianRangeCrossLineOptions', ...CARTESIAN },
    { id: 'AgAngleLineCrossLineOptions', ...ANGLE },
    { id: 'AgAngleRangeCrossLineOptions', ...ANGLE },
    { id: 'AgRadiusLineCrossLineOptions', ...RADIUS },
    { id: 'AgRadiusRangeCrossLineOptions', ...RADIUS },
];

test.describe('Cross Lines API reference', () => {
    setupIntrinsicAssertions(test);

    for (const { id, labelType, present, absent } of TABS) {
        test.describe(id, () => {
            // Landing on a deep hash selects the tab and expands `label`, so no tab nav click is needed.
            test.beforeEach(({ page }) => gotoUrl(page, toPageUrl(`${PAGE_URL}#reference-${id}-label-text`)));

            test('documents the per-axis label properties', async ({ page }) => {
                const panel = page.locator(`[tab-id="${id}"]`);
                await expect(panel).toBeVisible();
                await expect(panel.locator(`#reference-${id}-type`)).toBeVisible();
                await expect(panel.locator(`#reference-${id}-label`)).toContainText(labelType);

                for (const name of present) {
                    await expect(panel.locator(`#reference-${id}-label-${name}`)).toBeVisible();
                }
                for (const name of absent) {
                    await expect(panel.locator(`#reference-${id}-label-${name}`)).toHaveCount(0);
                }
            });
        });
    }
});
