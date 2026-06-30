import type { Page } from '@playwright/test';

import { expect, test } from './fixture';
import {
    SELECTORS,
    canvasToPageTransformer,
    gotoExample,
    setupIntrinsicAssertions,
    toExamplePageUrl,
    waitForAllChartUpdates,
} from './util';

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

type Vec2 = { x: number; y: number };

// The highlight-state examples branch both the series `styler` and an `itemStyler` on `highlightState`.
// Each example exposes its invocations via `window.agE2E.popStylerCalls()`, so we drive an item highlight
// then a series highlight and assert per phase that both callback surfaces ran for every branch.
//
// `node1` is a canvas-relative coordinate over a datum that triggers the item styler, exercising the
// pointer-driven (mouse/touch) highlight path that keyboard navigation does not. Coordinates are
// chart-type-specific and were measured against each rendered example, then converted to page
// coordinates at runtime via `canvasToPageTransformer`. To re-measure: open the example at the e2e
// viewport, hover a datum until the styler reports `highlighted-item`, and record `pageCoordinate - 16`
// (the canvas inset).
interface HighlightStateExample {
    name: string;
    node1: Vec2;
}
const HIGHLIGHT_STATE_EXAMPLES: HighlightStateExample[] = [
    { name: 'box-plot-styler-highlight-state', node1: { x: 110, y: 285 } },
    { name: 'nightingale-styler-highlight-state', node1: { x: 454, y: 354 } },
    { name: 'radar-area-styler-highlight-state', node1: { x: 247, y: 356 } },
    { name: 'radar-line-styler-highlight-state', node1: { x: 247, y: 356 } },
    { name: 'radial-bar-styler-highlight-state', node1: { x: 511, y: 151 } },
    { name: 'radial-column-styler-highlight-state', node1: { x: 372, y: 109 } },
    { name: 'range-area-styler-highlight-state', node1: { x: 284, y: 384 } },
    { name: 'range-bar-styler-highlight-state', node1: { x: 131, y: 266 } },
];

type StylerKind = 'styler' | 'itemStyler';
type StylerCall = { kind: StylerKind; seriesId: string; highlightState: string };

const ITEM_STATES = ['highlighted-item', 'unhighlighted-item'];
const SERIES_STATES = ['highlighted-series', 'unhighlighted-series'];

async function popStylerCalls(page: Page): Promise<StylerCall[]> {
    await waitForAllChartUpdates(page);
    return page.evaluate(() => {
        const hook = (window as { agE2E?: { popStylerCalls?: () => StylerCall[] } }).agE2E;
        if (!hook || typeof hook.popStylerCalls !== 'function') {
            throw new Error('window.agE2E.popStylerCalls is not defined');
        }
        return hook.popStylerCalls();
    });
}

function expectStatesForKind(calls: StylerCall[], kind: StylerKind, requiredStates: string[], example: string): void {
    const seen = new Set(calls.filter((call) => call.kind === kind).map((call) => call.highlightState));
    for (const state of requiredStates) {
        expect(seen.has(state), `${example}: ${kind} should be invoked with highlightState '${state}'`).toBe(true);
    }
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

    for (const { name, node1 } of HIGHLIGHT_STATE_EXAMPLES) {
        test.describe(name, () => {
            test.beforeEach(async ({ page }) => {
                await gotoExample(page, toExamplePageUrl('stylers-e2e', name, 'vanilla').url);
            });

            test('exercises every highlightState branch', async ({ page }) => {
                // The initial render invokes both surfaces with `none`; assert that, then clear so each
                // interaction phase is asserted against only its own invocations (a broken later phase
                // cannot be masked by an earlier one).
                const initPhase = await popStylerCalls(page);
                expectStatesForKind(initPhase, 'styler', ['none'], name);
                expectStatesForKind(initPhase, 'itemStyler', ['none'], name);

                await highlightItem(page);
                const itemPhase = await popStylerCalls(page);
                expectStatesForKind(itemPhase, 'styler', ITEM_STATES, name);
                expectStatesForKind(itemPhase, 'itemStyler', ITEM_STATES, name);

                await highlightSeries(page);
                const seriesPhase = await popStylerCalls(page);
                expectStatesForKind(seriesPhase, 'styler', SERIES_STATES, name);
                expectStatesForKind(seriesPhase, 'itemStyler', SERIES_STATES, name);

                for (const call of [...initPhase, ...itemPhase, ...seriesPhase]) {
                    expect(
                        call.highlightState,
                        `${name}: ${call.kind} should never receive an empty highlightState`
                    ).not.toBe('');
                }
            });

            test('highlight visuals', async ({ page }) => {
                await highlightItem(page);
                await expect(page.locator(SELECTORS.canvasCenter)).toHaveScreenshot(`${name}-item.png`);

                await highlightSeries(page);
                await expect(page.locator(SELECTORS.canvasCenter)).toHaveScreenshot(`${name}-series.png`);
            });

            test('mousemove over node1', async ({ page }) => {
                const toPage = await canvasToPageTransformer(page);
                const { x, y } = toPage(node1.x, node1.y);
                await page.mouse.move(x, y);
                await waitForAllChartUpdates(page);
                await expect(page.locator(SELECTORS.canvasCenter)).toHaveScreenshot(`${name}-node1.png`);
            });
        });
    }
});
