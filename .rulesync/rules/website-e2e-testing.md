---
root: false
targets: ['*']
description: 'Playwright e2e patterns for ag-charts-website: asserting chart callback behaviour from specs'
globs: ['**/ag-charts-website/e2e/**/*.spec.ts']
---

# Website E2E Test Patterns (Playwright)

These patterns apply to the handwritten Playwright specs under `packages/ag-charts-website/e2e`. For JSDOM unit-test contracts (`*.test.ts`) see `test-harness-contracts.md`.

**Run specs via the repo wrapper**: `yarn nx test:e2e ag-charts-website --grep "<test name>"`. It manages the dev server, environment, and browser container for you — do not hand-roll `npx playwright test` against your own astro/dev server, and do not start docker/colima directly.

## Drive chart mutations through the example's own UI

E2E tests load standalone examples from `_examples/` directories. When a spec needs to trigger chart mutations (option updates, toggles, data changes):

-   **Add buttons to the example HTML** for every operation the test exercises, wired in `main.ts` via `chart.updateDelta()` / `chart.update()` — the example stays a self-contained reproducer a human can operate.
-   **Click the buttons from the spec** via `page.getByText('Button Label').click()` rather than calling chart APIs through `page.evaluate()`.
-   **Don't expose chart internals on `window`** for driving the chart — no `(window as any).chart = chart`. (Read-only observation hooks are the exception; see below.)
-   **Add `// @ag-skip-fws`** to the top of `main.ts` — direct DOM manipulation (`getElementById`, `addEventListener`) is incompatible with framework generation and fails CI without it. This is the deliberate exception to the "no `@ag-skip-fws`" rule that applies to public docs and gallery examples: e2e examples are internal fixtures, not published examples, and must be pinned to vanilla in `e2e/example-options.ts`.

## Observe callbacks through an `agE2E` hook, not console logs

To assert that a styler, `itemStyler`, formatter, or listener ran with the expected arguments, have the example record each invocation and expose a pull accessor on `window.agE2E` — then read it from the spec with `page.evaluate`. Do **not** scrape `console.log` output.

```typescript
// example main.ts (vanilla-only page, so mark the file @ag-skip-fws)
type StylerCall = { kind: 'styler' | 'itemStyler'; seriesId: string; highlightState: string };
const stylerCalls: StylerCall[] = [];
function recordStyler(kind: StylerCall['kind'], params: { seriesId?: string; highlightState: string }): void {
    stylerCalls.push({ kind, seriesId: params.seriesId ?? '', highlightState: params.highlightState });
}
(window as any).agE2E = { popStylerCalls: () => stylerCalls.splice(0) };
```

```typescript
// spec — pull on demand, the test decides when
const calls = await page.evaluate(() => (window as any).agE2E.popStylerCalls());
```

Precedents: `e2e/state.spec.ts` (`popChartEvents`) and `active-e2e/_examples/line-example/main.ts`. A pull accessor is deterministic — the test reads after it has waited for the chart to settle — whereas console scraping is at the mercy of log ordering and flush timing.

Constraints for the hook:

- The example must carry `// @ag-skip-fws` (a `window` assignment is incompatible with framework generation) and the page must be pinned to vanilla in `e2e/example-options.ts`.
- The hook is **read-only observation**. It is the counterpart to the "avoid exposing chart internals on `window`" rule, which is about *driving* the chart: drive mutations through the example's own UI controls (`page.getByText(...).click()`), and only expose recorded callback arguments for *reading*.

## Pop-and-assert per interaction phase

Clear the recorder between distinct interactions and assert each phase against only its own invocations. Accumulating every interaction into one `Set` and asserting the union at the end lets a later broken interaction pass on an earlier one's data (e.g. a no-op `highlightSeries()` slips through because `highlightItem()` already filled the set).

```typescript
await popStylerCalls(page); // discard the initial render
await highlightItem(page);
expectStatesForKind(await popStylerCalls(page), 'styler', ITEM_STATES, name);
await highlightSeries(page);
expectStatesForKind(await popStylerCalls(page), 'styler', SERIES_STATES, name);
```

## Tag shared channels with a discriminator

When several callbacks feed one recorder (a series `styler` and a marker `itemStyler` both fire on highlight), tag each record with a `kind`. Without it, asserting "every highlight state was seen" is satisfied if *either* surface covers them — the conflation hides an untested callback. Assert coverage per `kind`.

## Pointer/touch coordinates: measure them, never guess them

Keyboard navigation is deterministic and portable, so prefer it. Mouse/touch hover coordinates differ per chart type and cannot be inferred from the options — but they *can* be measured against the running example using the `agE2E` hook as an oracle, so don't invent values or leave the test permanently skipped.

Store each coordinate **relative to the canvas**, and let the helpers supply the geometry — never bake a viewport size or canvas offset into the spec, both of which drift when `playwright.config.ts` or the site layout changes:

- **Position** is handled by `canvasToPageTransformer(page)`, which reads the live `.ag-charts-canvas-proxy` bounding box and adds its origin. Store `pageCoordinate − proxyOrigin` (the inverse), so no inset literal ever appears and the spec reconstructs the page point at runtime.
- **Size** must match CI for a canvas-relative coordinate to land on the same datum. The canvas size is fixed by the Playwright `viewport` (in `playwright.config.ts`) minus the page's body padding — reproduce that viewport when measuring rather than copying the resulting pixel dimensions.

Measure against `nx dev` in a real browser:

1. **Reproduce the CI canvas geometry.** Open the example at the Playwright viewport. If the driven browser can't be pinned to it (zoom, window chrome, or DPR drift), constrain `document.body` until `locateCanvas(page)` reports the `width`/`height` CI produces — verify against the helper, don't assume a number.
2. **Probe with the styler oracle.** Move the pointer to a candidate page coordinate and call `agE2E.popStylerCalls()`. A hover over the target datum reports `highlighted-item`; iterate until it does. This is exact, not eyeballed.
3. **Record canvas-relative.** Subtract the live canvas-proxy origin (`locateCanvas(page).bbox`) from the page coordinate you settled on. The spec converts back via `canvasToPageTransformer(page)`.

```typescript
const EXAMPLES = [{ name: 'box-plot-styler-highlight-state', node1: { x: 110, y: 285 } }];
test('mousemove over node1', async ({ page }) => {
    const toPage = await canvasToPageTransformer(page);
    const { x, y } = toPage(node1.x, node1.y);
    await page.mouse.move(x, y);
    await waitForAllChartUpdates(page);
    await expect(page.locator(SELECTORS.canvasCenter)).toHaveScreenshot(`${name}-node1.png`);
});
```

**Gotcha — rAF stops in a background tab.** The chart resizes, re-renders, and applies highlights through `requestAnimationFrame`, which the browser throttles to a halt when the tab is not visible. If the measurement window is backgrounded the canvas never resizes to the target geometry and the oracle returns nothing, so keep the window foregrounded throughout.

If the example exposes no styler/`itemStyler` oracle there is no reliable probe — scaffold the test as skipped with a `{ x: NaN, y: NaN } /* PLACEHOLDER */` entry rather than inventing coordinates.

## Structure: table-driven, one describe per example

Use a single example table and a per-example `test.describe(name, () => { test.beforeEach(nav); ... })`, not repeated `for`-loops that each re-navigate. One navigation site, related assertions grouped under the example they exercise.

## Regenerating screenshot baselines — let CI do it

`toHaveScreenshot` baselines are platform-specific (`*-chromium-linux.png`) and cannot be produced reliably on macOS, so never run Playwright with `-u` / `--update-snapshots`. CI regenerates them for you: when a snapshot job detects image diffs it commits the changed PNGs to a branch named `gha/snapshots-<your-branch>`, then fails the run so it stays red until a human reviews them. A bot posts a PR comment linking a compare view ("Merge snapshot changes into this PR"). Review that diff, confirm the changes are intended, and merge the snapshot branch's commit into your PR branch.

This covers every Playwright `toHaveScreenshot` baseline, including the `ag-charts-*-package-tests` e2e suites — not just website specs. It does **not** cover vitest image snapshots (`toMatchImageSnapshot`), which are a separate harness with their own regeneration rule; see `testing.md`.
