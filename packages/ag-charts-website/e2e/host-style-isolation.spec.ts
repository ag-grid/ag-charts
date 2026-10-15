import type { Locator } from '@playwright/test';

import { expect, test } from './fixture';
import { SELECTORS, gotoExample, setupIntrinsicAssertions, toExamplePageUrl } from './util';

// The example page carries claude.ai's visualiser rules, which set a border and padding on every `button`.
async function readLegendItemStyle(chartContainer: Locator) {
    return chartContainer
        .locator(SELECTORS.legendItems)
        .first()
        .evaluate((el) => {
            const { borderTopStyle, paddingTop } = getComputedStyle(el);
            return { borderTopStyle, paddingTop };
        });
}

const isInShadowRoot = (chartContainer: Locator) =>
    chartContainer.evaluate((el) => el.querySelector('.ag-charts-wrapper') == null);

test.describe('host style isolation', () => {
    setupIntrinsicAssertions(test);

    test.beforeEach(async ({ page }) => {
        await gotoExample(page, toExamplePageUrl('layout-e2e', 'host-style-isolation', 'vanilla').url);
    });

    test('inside the claude.ai visualiser, the chart renders in a shadow root its button rules cannot reach', async ({
        page,
    }) => {
        const chartContainer = page.locator('#myChart');

        expect(await isInShadowRoot(chartContainer)).toBe(true);
        const style = await readLegendItemStyle(chartContainer);
        expect(style.borderTopStyle).toBe('none');
        expect(style.paddingTop).not.toBe('8px');
    });

    test('outside the visualiser container, the same rules still reach a chart in the light DOM', async ({ page }) => {
        const chartContainer = page.locator('#outsideChart');

        expect(await isInShadowRoot(chartContainer)).toBe(false);
        expect(await readLegendItemStyle(chartContainer)).toEqual({ borderTopStyle: 'solid', paddingTop: '8px' });
    });
});
