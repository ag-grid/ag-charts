import { expect, test } from './fixture';
import { SELECTORS, gotoExample, toExamplePageUrl } from './util';

// List of highlight states to test
const highlightStates = [
    // Default state: nothing highlighted
    { name: 'none', trigger: async (_page) => {} },
    // Highlight the first chart item using keyboard navigation
    {
        name: 'item',
        trigger: async (page) => {
            await page.keyboard.press('Tab'); // Focus chart
        },
    },
    // Highlight the first series (legend or keyboard nav)
    {
        name: 'series',
        trigger: async (page) => {
            const legendItems = await page.locator(SELECTORS.legendItems).all();
            if (legendItems.length > 0) {
                await legendItems[0].focus();
            } else {
                await page.keyboard.press('Tab');
            }
        },
    },
    // Highlight the second series (legend or keyboard nav)
    {
        name: 'other-series',
        trigger: async (page) => {
            const legendItems = await page.locator(SELECTORS.legendItems).all();
            if (legendItems.length > 1) {
                await legendItems[1].focus();
            } else {
                await page.keyboard.press('Tab');
                await page.keyboard.press('ArrowRight'); // Move to next series/item
            }
        },
    },
    // Highlight the second item using keyboard navigation
    {
        name: 'other-item',
        trigger: async (page) => {
            await page.keyboard.press('Tab');
            await page.keyboard.press('ArrowDown');
            await page.keyboard.press('ArrowRight'); // Move to second item
        },
    },
    // Unhighlight: move mouse away from chart/legend
    {
        name: 'unhighlight',
        trigger: async (page) => {
            await page.mouse.move(0, 0);
        },
    },
];

// List of highlight-test examples
const highlightExamples = [
    'custom-highlight-multiple-series',
    'custom-highlight-multiple-series-markers',
    'custom-highlight-pie-series',
    'custom-highlight-single-series',
    'default-highlight-multiple-series',
    'default-highlight-multiple-series-markers',
    'default-highlight-multiple-series-markers-with-overlap',
    'default-highlight-pie-series',
    'default-highlight-single-series',
    'default-highlight-single-series-markers',
    'large-scale',
    'large-scale-multi-series',
    'default-highlight-single-series-pattern-fill',
    'custom-highlight-single-series-pattern-fill',
    'custom-highlight-single-series-item-styler',
];

test.describe('highlight states', () => {
    for (const example of highlightExamples) {
        // For single-series examples, skip series/other-series highlight states
        const isSingleSeries = example.includes('-single-series');
        const states = isSingleSeries
            ? highlightStates.filter((s) => s.name !== 'series' && s.name !== 'other-series')
            : highlightStates;
        const url = toExamplePageUrl('highlight-test', example, 'vanilla').url;
        test.describe(`${example}`, () => {
            for (const state of states) {
                test(`should render highlight state: ${state.name}`, async ({ page }) => {
                    await gotoExample(page, url);
                    await state.trigger(page);
                    const canvasCenter = page.locator(SELECTORS.canvasCenter);
                    await expect(canvasCenter).toHaveScreenshot(`${example}-${state.name}.png`);
                });
            }
        });
    }
});
