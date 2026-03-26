import { expect, test } from './fixture';
import { SELECTORS, expectAnimationOccurred, gotoExample, setupIntrinsicAssertions, toExamplePageUrl } from './util';

test.describe('CRT-1065: initial animation with container padding', () => {
    test.describe.configure({ retries: 3 });

    setupIntrinsicAssertions(test);

    const { url } = toExamplePageUrl('bar-series-test', 'animation-with-padding', 'vanilla');

    test('should animate on initial load when container has padding', async ({ page }) => {
        await gotoExample(page, url);

        const wrapper = page.locator(SELECTORS.wrapper).first();
        await expect(wrapper).toBeVisible();

        await expectAnimationOccurred(wrapper);
    });
});
