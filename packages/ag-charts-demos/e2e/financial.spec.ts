import { expect, test } from '@playwright/test';

import {
    expectIdLinkagesResolve,
    expectRadioGroupContract,
    expectSelectClosedTypeahead,
    expectSelectOpenTypeahead,
} from './a11y-assertions';

// demo-charts.spec.ts covers the financial demo's charts; this spec covers its title-bar controls,
// a Radix ToggleGroup for the time range and a Radix Select for the stream speed, whose
// accessibility contract every framework port reproduces by hand.

const DEMO_ID = 'financial';

const SPEED = { name: 'Stream speed', options: ['1×', '2×', '4×'], initial: '2×' };
const RANGE = { name: 'Time range', options: ['30m', '1H', '2H', '4H'], initial: '2H' };

test.describe(DEMO_ID, () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(`/#${DEMO_ID}`);
        await expect(page.locator(`[data-demo-id="${DEMO_ID}"]`)).toBeVisible();
    });

    test('every aria-labelledby, aria-controls and label for names an element', async ({ page }) => {
        // The container shows before the lazily loaded demo has rendered; wait for its controls.
        await expect(page.getByRole('combobox', { name: SPEED.name, exact: true })).toBeVisible();
        await expectIdLinkagesResolve(page);
    });

    test('typing on the closed speed select changes its value', async ({ page }) => {
        await expectSelectClosedTypeahead(page, SPEED);
    });

    test('typing in the open speed select moves focus to the match', async ({ page }) => {
        await expectSelectOpenTypeahead(page, SPEED);
    });

    test('the time-range group roves focus with the arrow keys', async ({ page }) => {
        await expectRadioGroupContract(page, RANGE);
    });
});
