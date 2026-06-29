import type { Page } from '@playwright/test';

import { expect, test } from './fixture';
import { SELECTORS, gotoExample, setupIntrinsicAssertions, toExamplePageUrl, waitForAllChartUpdates } from './util';

// Every consolidated styler example renders a deterministic styled chart; the screenshot is the
// visual-regression baseline for the series-level `styler` colour-override path.
const STYLER_EXAMPLES = [
    'box-plot-styler',
    'box-plot-styler-highlight-state',
    'nightingale-styler',
    'nightingale-styler-and-itemstyler',
    'nightingale-styler-highlight-state',
    'radar-area-styler',
    'radar-area-styler-and-itemstyler',
    'radar-area-styler-highlight-state',
    'radar-line-styler',
    'radar-line-styler-and-itemstyler',
    'radar-line-styler-highlight-state',
    'radial-bar-styler',
    'radial-bar-styler-and-itemstyler',
    'radial-bar-styler-highlight-state',
    'radial-column-styler',
    'radial-column-styler-and-itemstyler',
    'radial-column-styler-highlight-state',
    'range-area-styler',
    'range-area-styler-and-itemstyler',
    'range-area-styler-highlight-state',
    'range-bar-styler',
    'range-bar-styler-and-itemstyler',
    'range-bar-styler-highlight-state',
];

// The highlight-state examples branch the styler on `highlightState`. Driving an item highlight and a
// series highlight forces every branch to run; the stylers log their input so coverage is asserted.
const HIGHLIGHT_STATE_EXAMPLES = STYLER_EXAMPLES.filter((name) => name.endsWith('-styler-highlight-state'));

const REQUIRED_HIGHLIGHT_STATES = [
    'none',
    'highlighted-item',
    'unhighlighted-item',
    'highlighted-series',
    'unhighlighted-series',
];

function collectStylerStates(page: Page): Set<string> {
    const states = new Set<string>();
    page.on('console', (msg) => {
        const text = msg.text();
        const marker = '[styler]';
        const index = text.indexOf(marker);
        if (index !== -1) {
            const state = text.slice(index + marker.length).trim();
            if (state.length > 0) states.add(state);
        }
    });
    return states;
}

async function highlightItem(page: Page): Promise<void> {
    // Focus the series area and step the keyboard cursor across datums within and between series.
    await page.locator(SELECTORS.canvasCenter).click();
    for (let i = 0; i < 5; i++) await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowDown');
    for (let i = 0; i < 2; i++) await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowRight');
    await waitForAllChartUpdates(page);
}

async function highlightSeries(page: Page): Promise<void> {
    // Tab from the series area to the legend and focus its items to highlight whole series.
    await page.keyboard.press('Tab');
    for (let i = 0; i < 3; i++) await page.keyboard.press('ArrowRight');
    await waitForAllChartUpdates(page);
}

test.describe('stylers', () => {
    setupIntrinsicAssertions(test, { viewportSize: { width: 800, height: 600 } });

    for (const example of STYLER_EXAMPLES) {
        test(`renders ${example}`, async ({ page }) => {
            const { url } = toExamplePageUrl('stylers-e2e', example, 'vanilla');
            await gotoExample(page, url);
            await expect(page.locator(SELECTORS.canvasCenter)).toHaveScreenshot(`${example}.png`);
        });
    }

    for (const example of HIGHLIGHT_STATE_EXAMPLES) {
        test(`exercises every highlightState branch for ${example}`, async ({ page }) => {
            const states = collectStylerStates(page);
            const { url } = toExamplePageUrl('stylers-e2e', example, 'vanilla');
            await gotoExample(page, url);
            await highlightItem(page);
            await highlightSeries(page);

            for (const state of REQUIRED_HIGHLIGHT_STATES) {
                expect(states.has(state), `${example}: styler should be invoked with highlightState '${state}'`).toBe(
                    true
                );
            }
            expect(states.has('undefined'), `${example}: styler should never receive an undefined highlightState`).toBe(
                false
            );
        });

        test(`highlight visuals for ${example}`, async ({ page }) => {
            const { url } = toExamplePageUrl('stylers-e2e', example, 'vanilla');
            await gotoExample(page, url);

            await highlightItem(page);
            await expect(page.locator(SELECTORS.canvasCenter)).toHaveScreenshot(`${example}-item.png`);

            await highlightSeries(page);
            await expect(page.locator(SELECTORS.canvasCenter)).toHaveScreenshot(`${example}-series.png`);
        });
    }
});
