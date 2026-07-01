import { expect, test } from './fixture';
import { SELECTORS, gotoExample, setupIntrinsicAssertions, toExamplePageUrl } from './util';

// Each consolidated axes example renders a deterministic layout (grouped-category axes, bigint / ISO
// datetime domains, label rotation); the screenshot is the visual-regression baseline for a render path
// that previously had no handwritten coverage. The interactive controls a few examples carry (data-mode
// switch, rotation sliders) are smoke-tested by the generated example spec; their live re-layout is not
// asserted here.
const AXES_EXAMPLES = [
    'bigint-iso-datetime',
    'grouped-category',
    'grouped-category-2',
    'grouped-category-3',
    'grouped-category-4',
    'grouped-category-5',
    'grouped-category-6',
    'grouped-category-7',
    'grouped-category-8',
    'axis-label-rotation',
];

test.describe('axes', () => {
    setupIntrinsicAssertions(test);

    for (const example of AXES_EXAMPLES) {
        test(`renders ${example}`, async ({ page }) => {
            const { url } = toExamplePageUrl('axes-e2e', example, 'vanilla');
            await gotoExample(page, url);
            await expect(page.locator(SELECTORS.canvasCenter)).toHaveScreenshot(`${example}.png`);
        });
    }
});
