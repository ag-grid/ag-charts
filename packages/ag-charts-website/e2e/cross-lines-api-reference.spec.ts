import type { Locator, Page } from '@playwright/test';

import { expect, test } from './fixture';
import { gotoUrl, setupIntrinsicAssertions, toPageUrl } from './util';

test.use({ viewport: { width: 1400, height: 900 } });

const PAGE_URL = 'javascript/axes-cross-lines/';

const TABS = [
    { id: 'AgCartesianLineCrossLineOptions', label: 'Cartesian Line' },
    { id: 'AgCartesianRangeCrossLineOptions', label: 'Cartesian Range' },
    { id: 'AgAngleLineCrossLineOptions', label: 'Angle Line' },
    { id: 'AgAngleRangeCrossLineOptions', label: 'Angle Range' },
    { id: 'AgRadiusLineCrossLineOptions', label: 'Radius Line' },
    { id: 'AgRadiusRangeCrossLineOptions', label: 'Radius Range' },
];

// Every panel is in the DOM at once and only the selected one is displayed, so each assertion is
// scoped to its panel: a page-wide locator would match all six references.
async function openTab(page: Page, { id, label }: { id: string; label: string }): Promise<Locator> {
    await page.getByRole('tab', { name: label, exact: true }).click();
    const panel = page.locator(`[tab-id="${id}"]`);
    await expect(panel).toBeVisible();
    return panel;
}

async function expandLabel(panel: Locator) {
    await panel.getByRole('button', { name: 'See child properties of label', exact: true }).click();
}

test.describe('Cross Lines API reference', () => {
    setupIntrinsicAssertions(test);

    test('renders a property table for each per-axis variant', async ({ page }) => {
        await gotoUrl(page, toPageUrl(PAGE_URL));

        for (const tab of TABS) {
            const panel = await openTab(page, tab);
            await expect(panel.locator(`#reference-${tab.id}-type`)).toBeVisible();
            await expect(panel.locator(`#reference-${tab.id}-label`)).toBeVisible();
        }
    });

    test('documents position and rotation on a Cartesian cross-line label', async ({ page }) => {
        await gotoUrl(page, toPageUrl(PAGE_URL));

        const id = 'AgCartesianLineCrossLineOptions';
        const panel = await openTab(page, { id, label: 'Cartesian Line' });
        await expandLabel(panel);

        await expect(panel.locator(`#reference-${id}-label-position`)).toBeVisible();
        await expect(panel.locator(`#reference-${id}-label-rotation`)).toBeVisible();
        await expect(panel.locator(`#reference-${id}-label-positionAngle`)).toHaveCount(0);
    });

    test('documents positionAngle, and not position or rotation, on a radius cross-line label', async ({ page }) => {
        await gotoUrl(page, toPageUrl(PAGE_URL));

        const id = 'AgRadiusLineCrossLineOptions';
        const panel = await openTab(page, { id, label: 'Radius Line' });
        await expandLabel(panel);

        await expect(panel.locator(`#reference-${id}-label-positionAngle`)).toBeVisible();
        await expect(panel.locator(`#reference-${id}-label-position`)).toHaveCount(0);
        await expect(panel.locator(`#reference-${id}-label-rotation`)).toHaveCount(0);
    });

    test('documents only the common label options on an angle cross-line label', async ({ page }) => {
        await gotoUrl(page, toPageUrl(PAGE_URL));

        const id = 'AgAngleLineCrossLineOptions';
        const panel = await openTab(page, { id, label: 'Angle Line' });
        await expandLabel(panel);

        await expect(panel.locator(`#reference-${id}-label-text`)).toBeVisible();
        await expect(panel.locator(`#reference-${id}-label-position`)).toHaveCount(0);
        await expect(panel.locator(`#reference-${id}-label-rotation`)).toHaveCount(0);
        await expect(panel.locator(`#reference-${id}-label-positionAngle`)).toHaveCount(0);
    });
});
