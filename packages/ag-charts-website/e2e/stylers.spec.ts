import type { Page } from '@playwright/test';

import { evalPageFunction } from './agE2E';
import { expect, test } from './fixture';
import { expectChartScreenshot } from './scene-capture';
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
// Each example exposes its invocations - tagged with the series id and the datum's category value - via
// `window.agE2E.popStylerCalls()`. We hover a datum and focus a legend item, then assert the highlight is
// attributed to exactly one node / one series, for both callback surfaces.
//
// `node1` is a canvas-relative coordinate over a datum that triggers the item styler, exercising the
// pointer-driven (mouse/touch) highlight path that keyboard navigation does not. Coordinates are
// chart-type-specific and were measured against each rendered example, then converted to page
// coordinates at runtime via `canvasToPageTransformer`. To re-measure: open the example at the e2e
// viewport, hover a datum until the styler reports `highlighted-item`, and record the page coordinate
// minus the canvas-proxy origin (see the website-e2e-testing rule for the full procedure).
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
type StylerCall = { kind: StylerKind; seriesId: string; highlightState: string; key: string };

const KINDS: StylerKind[] = ['styler', 'itemStyler'];

async function popStylerCalls(page: Page): Promise<StylerCall[]> {
    await waitForAllChartUpdates(page);
    return (await evalPageFunction(page, 'popStylerCalls')) as StylerCall[];
}

// Distinct datum categories recorded with `state` at any point during the pop. We test which element was
// *ever* highlighted, not its final frame: one highlight can be re-emitted as the chart settles (some
// series types overwrite the highlighted node with a trailing unhighlighted frame), so the last-seen
// state is unreliable while the set of highlighted elements is exact. Keyed by category, not by node:
// hovering one point on a radar chart highlights that category across every overlapping series at once.
function keysWithState(calls: StylerCall[], kind: StylerKind, state: string): Set<string> {
    const keys = new Set<string>();
    for (const call of calls) {
        if (call.kind === kind && call.highlightState === state) keys.add(call.key);
    }
    return keys;
}

function seriesWithState(calls: StylerCall[], kind: StylerKind, state: string): Set<string> {
    const series = new Set<string>();
    for (const call of calls) {
        if (call.kind === kind && call.highlightState === state) series.add(call.seriesId);
    }
    return series;
}

function expectNoEmptyState(calls: StylerCall[], label: string): void {
    for (const call of calls) {
        expect(call.highlightState, `${label}: ${call.kind} received an empty highlightState`).not.toBe('');
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
            await expectChartScreenshot(page, page.locator(SELECTORS.canvasCenter), `${example}.png`);
        });
    }

    for (const { name, node1 } of HIGHLIGHT_STATE_EXAMPLES) {
        test.describe(name, () => {
            test.beforeEach(async ({ page }) => {
                await gotoExample(page, toExamplePageUrl('stylers-e2e', name, 'vanilla').url);
            });

            test('legend focus highlights exactly one series', async ({ page }) => {
                // The initial render must invoke both surfaces, and only with `none`.
                const initPhase = await popStylerCalls(page);
                expectNoEmptyState(initPhase, name);
                for (const kind of KINDS) {
                    const states = new Set(initPhase.filter((call) => call.kind === kind).map((c) => c.highlightState));
                    expect([...states], `${name}: ${kind} initial render should be only 'none'`).toEqual(['none']);
                }

                // Focusing one legend item highlights exactly that series and no individual item.
                const legendItems = await page.locator(SELECTORS.legendItems).all();
                await legendItems[0].focus();
                const seriesPhase = await popStylerCalls(page);
                expectNoEmptyState(seriesPhase, name);
                for (const kind of KINDS) {
                    expect(
                        seriesWithState(seriesPhase, kind, 'highlighted-series').size,
                        `${name}: ${kind} should highlight exactly one series`
                    ).toBe(1);
                    expect(
                        keysWithState(seriesPhase, kind, 'highlighted-item').size,
                        `${name}: ${kind} series highlight should not highlight an item`
                    ).toBe(0);
                }
            });

            test('highlight visuals', async ({ page }) => {
                await highlightItem(page);
                await expectChartScreenshot(page, page.locator(SELECTORS.canvasCenter), `${name}-item.png`);

                await highlightSeries(page);
                await expectChartScreenshot(page, page.locator(SELECTORS.canvasCenter), `${name}-series.png`);
            });

            test('pointer over node1 highlights exactly one item', async ({ page }) => {
                await popStylerCalls(page); // discard the initial-render invocations
                const toPage = await canvasToPageTransformer(page);
                const { x, y } = toPage(node1.x, node1.y);
                await page.mouse.move(x, y);

                // The measured coordinate must land on a datum: the itemStyler highlights exactly one item
                // and no whole series.
                const hoverPhase = await popStylerCalls(page);
                expectNoEmptyState(hoverPhase, name);
                expect(
                    keysWithState(hoverPhase, 'itemStyler', 'highlighted-item').size,
                    `${name}: hovering node1 should highlight exactly one item`
                ).toBe(1);
                expect(
                    seriesWithState(hoverPhase, 'itemStyler', 'highlighted-series').size,
                    `${name}: hovering an item should not highlight a series`
                ).toBe(0);

                await expectChartScreenshot(page, page.locator(SELECTORS.canvasCenter), `${name}-node1.png`);
            });
        });
    }
});
