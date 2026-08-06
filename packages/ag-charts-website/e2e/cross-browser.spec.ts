import type { Page } from '@playwright/test';
import { readFileSync } from 'node:fs';

import type { AgChartState } from 'ag-charts-types';

import { expect, test } from './fixture';
import { expectChartScreenshot } from './scene-capture';
import { SELECTORS, gotoExample, setupIntrinsicAssertions, toExamplePageUrl, waitForChartUpdate } from './util';

/**
 * Part B of the cross-browser e2e effort (AG-18059).
 *
 * Part A reuses existing Chromium specs on the `firefox`/`webkit` projects. This spec covers the
 * failure classes that have no Chromium-side spec at all — text measurement, offscreen-layer font
 * face, devicePixelRatio, focus-visible, PNG download and zoom `getState`.
 *
 * Two constraints shape every case here:
 *
 * - The spec is registered on `firefox` + `webkit` via `PART_B_SPECS` in
 *   `playwright.cross-browser.config.ts`, and is *also* picked up by the main sharded Chromium job
 *   (`playwright.config.ts` has `testDir: './e2e'` and no project-level `testMatch`). So every case
 *   must hold on all three engines: assert engine-independent invariants, never "this engine
 *   differs".
 * - Only hardcoded `vanilla` URLs are visited, which is how this spec satisfies the cross-browser
 *   config's vanilla pin without `pinNonChromiumToVanilla` (the same route `zoom.spec.ts` takes).
 */
test.describe('cross-browser', () => {
    setupIntrinsicAssertions(test);

    /**
     * CRT-1177: on Firefox, text measured in an OffscreenCanvas context resolves generic font
     * keywords differently from a document context, so text measures narrower than it draws and
     * labels/captions truncate wrongly. The fix is the `canRenderTextOffscreen()` probe in
     * `ag-charts-core/src/utils/canvas.ts`, which makes `createCanvasContext()` fall back to a
     * document canvas when the two disagree.
     *
     * That guard is not reachable from the page — `ag-charts-community` re-exports none of it — so a
     * `page.evaluate` `measureText` probe would test the browser, not AG Charts. The probe therefore
     * has to be behavioural: render a default-themed chart whose theme `fontFamily` ends in the
     * unquoted generic keywords (`chartTheme.ts`: `'"IBM Plex Sans", -apple-system, "system-ui", …'`)
     * and whose title, footnote and legend labels are truncation-sensitive, then pin its output. If
     * the guard regressed, the Firefox baseline moves.
     */
    test('AG-18059 behavioural text measurement is stable per engine', async ({ page }) => {
        const { url } = toExamplePageUrl('api-state-e2e', 'legend-zoom', 'vanilla');
        await gotoExample(page, url);

        await expectChartScreenshot(page, page.locator(SELECTORS.canvasCenter), 'text-measure.png');
    });

    /**
     * `scene/group.ts` gates `useOffscreenCanvas` on the same `canRenderTextOffscreen()` probe, so
     * the text-bearing offscreen layers — the chart titles/footnote layer and the legend marker
     * labels — are where a wrong font *face* (rather than a wrong measurement) shows up.
     *
     * Deliberately a different example and a different observable from the case above, because AC #2
     * enumerates `behavioural text-measure` and `offscreen-layer font face` as distinct coverage.
     * `text/google-fonts` is deliberately not used: it sets explicit font families and so never
     * exercises the generic-keyword path this case exists for.
     */
    test('AG-18059 offscreen-layer font face is stable per engine', async ({ page }) => {
        const { url } = toExamplePageUrl('accessibility', 'keyboard-navigation', 'vanilla');
        await gotoExample(page, url);

        await expectChartScreenshot(page, page.locator(SELECTORS.canvasCenter), 'offscreen-font-face.png');
    });

    /**
     * `hdpiCanvas.resize()` sets the canvas *attribute* size in device pixels
     * (`deviceDimension(pixelRatio, value)`, i.e. a rounded `value * pixelRatio`) and the *style*
     * size in CSS pixels, with `pixelRatio` sourced straight from `window.devicePixelRatio`
     * (`chartContext.ts`). That pairing is the contract `pixelRatioObserver.ts` documents as
     * diverging between engines.
     *
     * The divergence itself cannot be asserted here — the `webkit` project pins
     * `deviceScaleFactor: 1`, so a "Safari reports a different ratio" assertion would pass
     * vacuously. Assert the invariant instead; it is engine-meaningful and holds at any ratio.
     */
    test('AG-18059 canvas backing store matches devicePixelRatio', async ({ page }) => {
        const { url } = toExamplePageUrl('api-state-e2e', 'legend-zoom', 'vanilla');
        await gotoExample(page, url);

        const metrics = await page.evaluate(() => {
            const canvas = document.querySelector('canvas');
            if (!(canvas instanceof HTMLCanvasElement)) {
                throw new Error('No <canvas> element on the page');
            }
            return {
                devicePixelRatio: window.devicePixelRatio,
                attributeWidth: canvas.width,
                attributeHeight: canvas.height,
                styleWidth: parseFloat(canvas.style.width),
                styleHeight: parseFloat(canvas.style.height),
            };
        });

        expect(metrics.devicePixelRatio).toBeGreaterThan(0);
        expect(metrics.styleWidth).toBeGreaterThan(0);
        expect(metrics.styleHeight).toBeGreaterThan(0);

        // ±1 device pixel of slack for `deviceDimension`'s half-pixel rounding.
        const expectedWidth = Math.round(metrics.styleWidth * metrics.devicePixelRatio);
        const expectedHeight = Math.round(metrics.styleHeight * metrics.devicePixelRatio);
        expect(Math.abs(metrics.attributeWidth - expectedWidth)).toBeLessThanOrEqual(1);
        expect(Math.abs(metrics.attributeHeight - expectedHeight)).toBeLessThanOrEqual(1);
    });

    /**
     * The focus indicator's visibility is not a class toggle: `.ag-charts-swapchain:focus-visible`
     * sets an `opacity` that `FocusIndicator` reads (`dom/container.css`). So this case reads the
     * computed opacity of the indicator's parent rather than taking a screenshot — cheaper,
     * deterministic, and no extra per-engine baseline.
     *
     * `:focus-visible` heuristics are exactly the kind of thing that differs between engines, and the
     * canonical mouse-vs-keyboard screenshot case (AG-13166, `zoom.spec.ts`) already runs
     * cross-browser via `PART_A_SPECS` — this case earns its place by being the screenshot-free
     * opacity read on a different example. The keyboard half is the load-bearing assertion; the
     * mouse half asserts the transition back, which is the part where engines are most likely to
     * disagree on the `:focus-visible` heuristic rather than on anything AG Charts controls.
     */
    test('AG-18059 focus-visible drives the focus indicator opacity', async ({ page }) => {
        const { url } = toExamplePageUrl('accessibility', 'keyboard-navigation', 'vanilla');
        await gotoExample(page, url);

        const indicator = page.locator(SELECTORS.focusIndicator).first();
        await expect(indicator).toBeAttached();

        const parentOpacity = () =>
            indicator.evaluate((element) => {
                const parent = element.parentElement;
                if (parent == null) {
                    throw new Error('Focus indicator has no parent element');
                }
                return Number(window.getComputedStyle(parent).opacity);
            });

        expect(await parentOpacity()).toBe(0);

        // Focus the chart from the keyboard: `:focus-visible` matches, so the swapchain becomes
        // visible and the indicator renders.
        await page.locator('input').first().click();
        await page.keyboard.press('Tab');
        await expect.poll(parentOpacity).toBeGreaterThan(0);

        // A mouse interaction takes `:focus-visible` away again, hiding the indicator.
        await page.locator(SELECTORS.canvasCenter).click();
        await expect.poll(parentOpacity).toBe(0);
    });

    /**
     * CRT-1132: chart PNG download was blocked on Firefox. `chart.download()` renders to a canvas,
     * takes `canvas.toDataURL()` and clicks a hidden `<a download href="data:…">` — a path whose
     * behaviour is genuinely engine-specific, so assert the bytes that come out.
     *
     * The CSP `frame-src` half of CRT-1132 is deliberately not asserted here: the e2e example URL
     * renders an Astro partial with no iframe, so a `frame-src` regression is structurally
     * unreachable from this page. That rule is unit-tested in `src/utils/htaccess/cspRules.test.ts`.
     * `setupIntrinsicAssertions` still fails the case on any `Refused to …` security console error.
     *
     * The repo is mounted read-only under `playwright.sh` apart from `reports/` and this package, so
     * the download must be saved via `testInfo.outputPath`.
     *
     * The `download` event is given an explicit short timeout rather than the suite default: if an
     * engine declines to route a `download`-attributed `data:` anchor through its download machinery
     * at all, this case should fail in seconds rather than spend the cross-browser job's whole
     * budget waiting. Should that turn out to be a fixed engine limitation rather than a product
     * regression, skip the case for that `browserName` with the limitation cited — do not weaken the
     * assertion for the engines that do support it.
     */
    test('AG-18059 chart downloads a PNG', async ({ page }, testInfo) => {
        const { url } = toExamplePageUrl('api-download', 'download', 'vanilla');
        await gotoExample(page, url);

        const downloadPromise = page.waitForEvent('download', { timeout: 15_000 });
        await page.getByRole('button', { name: 'Download at 600x300' }).click();
        const download = await downloadPromise;

        const savedPath = testInfo.outputPath('chart.png');
        await download.saveAs(savedPath);

        const bytes = readFileSync(savedPath);
        expect(bytes.byteLength).toBeGreaterThan(0);
        expect([...bytes.subarray(0, 4)]).toEqual([0x89, 0x50, 0x4e, 0x47]);
    });

    /**
     * `getState()` / `setState()` are the restoration API, and the zoom originator is only registered
     * when `navigator.enabled || zoom.enabled` (`chartProxy.ts`). `active-e2e/zoom-and-active-restoration`
     * already has zoom enabled *and* already exposes `window.agE2E = { chart }`, so no example edit is
     * needed. The defensive accessor ladder below is the "getState hardening" AC #2 names; it is the
     * same ladder `state.spec.ts` uses, so a missing or malformed hook fails with a specific message
     * rather than an opaque `undefined` dereference on one engine only.
     */
    test('AG-18059 zoom getState round-trips', async ({ page }) => {
        const { url } = toExamplePageUrl('active-e2e', 'zoom-and-active-restoration', 'vanilla');
        await gotoExample(page, url);

        // Drive the zoom through the example's own control rather than the chart API.
        await page.getByRole('button', { name: 'setState' }).click();

        const state = await getChartState(page);
        expect(state.zoom).toBeDefined();

        for (const ratio of [state.zoom?.ratioX, state.zoom?.ratioY]) {
            if (ratio == null) continue;
            for (const value of [ratio.start, ratio.end]) {
                expect(typeof value).toBe('number');
                expect(value).toBeGreaterThanOrEqual(0);
                expect(value).toBeLessThanOrEqual(1);
            }
        }

        await setChartState(page, state);
        expect((await getChartState(page)).zoom).toEqual(state.zoom);
    });
});

async function getChartState(page: Page): Promise<AgChartState> {
    const state = await page.evaluate(() => {
        const chart: unknown = (window as any)?.agE2E?.chart;
        if (!chart) {
            throw new Error('window.agE2E.chart is not defined');
        } else if (typeof chart !== 'object') {
            throw new Error('window.agE2E.chart is not an object');
        } else if (!('getState' in chart)) {
            throw new Error('window.agE2E.chart does not have getState property');
        } else if (typeof chart.getState !== 'function') {
            throw new Error('window.agE2E.chart.getState is not a function');
        }
        return chart.getState();
    });

    expect(state).toBeDefined();
    expect(typeof state).toBe('object');
    return state;
}

async function setChartState(page: Page, state: AgChartState): Promise<void> {
    await page.evaluate(
        async ({ newState }) => {
            const chart: unknown = (window as any)?.agE2E?.chart;
            if (!chart) {
                throw new Error('window.agE2E.chart is not defined');
            } else if (typeof chart !== 'object') {
                throw new Error('window.agE2E.chart is not an object');
            } else if (!('setState' in chart)) {
                throw new Error('window.agE2E.chart does not have setState property');
            } else if (typeof chart.setState !== 'function') {
                throw new Error('window.agE2E.chart.setState is not a function');
            }

            const setStateReturn = chart.setState(newState);
            if (!(setStateReturn instanceof Promise)) {
                throw new Error('window.agE2E.chart.setState did not return a Promise');
            }
            await setStateReturn;
        },
        { newState: state }
    );
    await waitForChartUpdate(page.locator(SELECTORS.wrapper));
}
