import AxeBuilder from '@axe-core/playwright';

import { expect, test } from './fixture';
import { SELECTORS, gotoExample, setupIntrinsicAssertions, toExamplePageUrl, waitForAllChartUpdates } from './util';

test.describe('axis region aria-labels', () => {
    setupIntrinsicAssertions(test);

    test('each axis region has a unique, non-empty aria-label', async ({ page }) => {
        const { url } = toExamplePageUrl('annotations-test', 'multiple-axes', 'vanilla');
        await gotoExample(page, url);
        await waitForAllChartUpdates(page);

        const regions = page.locator(SELECTORS.axisProxy);
        await expect(regions.first()).toBeAttached();

        const labels = await regions.evaluateAll((els) => els.map((el) => el.getAttribute('aria-label')));
        expect(labels.length).toBeGreaterThanOrEqual(3);
        for (const label of labels) {
            expect(label?.trim()).toBeTruthy();
        }

        const normalised = labels.map((label) => label!.trim().toLowerCase());
        expect(new Set(normalised).size).toBe(normalised.length);

        expect(labels).toEqual(expect.arrayContaining(['Number of cattle', 'Exports (tonnes)']));
    });

    test('axe landmark-unique reports no violations', async ({ page }) => {
        const { url } = toExamplePageUrl('annotations-test', 'multiple-axes', 'vanilla');
        await gotoExample(page, url);
        await waitForAllChartUpdates(page);

        await expect(page.locator(SELECTORS.axisProxy).first()).toBeAttached();

        const results = await new AxeBuilder({ page }).include('#myChart').withRules(['landmark-unique']).analyze();
        expect(results.violations).toEqual([]);
    });
});
