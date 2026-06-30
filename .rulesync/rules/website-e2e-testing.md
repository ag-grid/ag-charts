---
root: false
targets: ['*']
description: 'Playwright e2e patterns for ag-charts-website: asserting chart callback behaviour from specs'
globs: ['**/ag-charts-website/e2e/**/*.spec.ts']
---

# Website E2E Test Patterns (Playwright)

These patterns apply to the handwritten Playwright specs under `packages/ag-charts-website/e2e`. For JSDOM unit-test contracts (`*.test.ts`) see `test-harness-contracts.md`; for driving chart mutations from an example see the general testing guidance. This rule covers **asserting that chart callbacks fired as expected** from an e2e spec.

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

## Pointer/touch coordinates are not AI-guessable

Keyboard navigation is deterministic and portable, so prefer it. Mouse/touch hover coordinates differ per chart type and cannot be inferred reliably — they must be measured by a human against the rendered example. Scaffold the test as skipped with an explicit placeholder rather than inventing coordinates:

```typescript
const EXAMPLES = [{ name: 'box-plot-styler', node1: { x: NaN, y: NaN } /* PLACEHOLDER */ }];
test.skip('mousemove over node1', async ({ page }) => {
    await page.mouse.move(node1.x, node1.y);
    await expect(page.locator(SELECTORS.canvasCenter)).toHaveScreenshot(`${name}-node1.png`);
});
```

## Structure: table-driven, one describe per example

Use a single example table and a per-example `test.describe(name, () => { test.beforeEach(nav); ... })`, not repeated `for`-loops that each re-navigate. One navigation site, related assertions grouped under the example they exercise.
