import AxeBuilder from '@axe-core/playwright';

import { expect, test } from './fixture';
import { SELECTORS, gotoExample, setupIntrinsicAssertions, toExamplePageUrl, waitForAllChartUpdates } from './util';

const RULES = ['landmark-unique', 'aria-prohibited-attr'];

test.describe('axis proxy elements', () => {
    setupIntrinsicAssertions(test);

    const examples = [
        { name: 'one chart', page: 'annotations-test', example: 'multiple-axes', minAxes: 3 },
        { name: 'several charts', page: 'accessibility-e2e', example: 'opening-context-menu-second-chart', minAxes: 4 },
    ];

    for (const { name, page: docsPage, example, minAxes } of examples) {
        test(`are not landmarks and axe reports no violations - ${name}`, async ({ page }) => {
            const { url } = toExamplePageUrl(docsPage, example, 'vanilla');
            await gotoExample(page, url);
            await waitForAllChartUpdates(page);

            const axes = page.locator(SELECTORS.axisProxy);
            await expect(axes.first()).toBeAttached();
            expect(await axes.count()).toBeGreaterThanOrEqual(minAxes);

            const attributes = await axes.evaluateAll((els) =>
                els.map((el) => ({ role: el.getAttribute('role'), ariaLabel: el.getAttribute('aria-label') }))
            );
            for (const attrs of attributes) {
                expect(attrs).toEqual({ role: null, ariaLabel: null });
            }

            const results = await new AxeBuilder({ page }).withRules(RULES).analyze();
            expect(results.violations).toEqual([]);
        });
    }
});
