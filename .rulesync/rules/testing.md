---
root: false
targets: ['*']
description: 'Testing strategies, best practices, and philosophy for AG Charts development'
globs: ['**/*.test.ts', '**/*.spec.ts', '**/test/**', '**/__tests__/**']
---

# Testing Guide

This guide covers testing strategies, best practices, and philosophy for AG Charts development.

## Testing Strategy

-   **Unit tests**: Jest with jsdom environment and image snapshots
-   **E2E tests**: Playwright for website interaction testing
-   **Benchmarks**: Performance regression testing with memory profiling
-   **Visual regression**: Canvas rendering snapshot comparisons

## Testing Best Practices

-   **Test real implementations, not helpers**: Avoid creating test helper functions that duplicate production logic. Instead, test the actual implementation through its public API (e.g., using `DataSet` to test data operations rather than a helper function that reimplements the logic).
-   **Look for existing patterns first**: Before writing new tests, review similar existing tests to maintain consistency in:
    -   Verification patterns (e.g., if similar tests verify domains, yours should too)
    -   Test structure and organization
    -   Assertion styles and completeness
-   **Test completeness checklist**:
    -   Do similar tests verify more properties that this one should also verify?
    -   Are all important outputs verified (data, keys, columns, domains, metadata, etc.)?
    -   Does this test exercise the real code path users will hit?
-   **Naming clarity**: Variable and parameter names should clearly convey intent, especially for boolean flags (e.g., `columnNeedValueOf` is clearer than `columnValueTypes` for a boolean array).

## Test Philosophy

-   **Test behavior, not implementation**: Focus on what the code does, not how it does it
-   **Use parameterized tests**: Consolidate similar test cases with `test.each()`
-   **Avoid brittle assertions**: Don't assert exact array indices or internal state unless necessary
-   **Keep tests focused**: One behavior per test, clear test names
-   **Simplify test helpers**: Prefer simple operation counters over complex tracking mechanisms

### Prefer User-Facing Options Over Internal State Manipulation

When writing regression tests, prefer driving the chart through user-facing APIs rather than directly manipulating internal state. Follow this hierarchy:

1.  **User-facing chart options** — `chart.update(options)` with `visible`, `enabled`, `dropdown.visible`, etc. This is the strongest form of test.
2.  **Test harness interaction utilities** — `hoverAction`, `clickAction`, `computeLegendBBox`, `dragAction`. These simulate user input at the DOM level.
3.  **Internal state reads** (assertions only) — Reading `contextNodeData`, `isDropdown`, module state via `deproxy()` is acceptable for assertions.
4.  **Internal state writes** (avoid) — Directly setting instance properties, overriding methods, or monkey-patching. Use only as a last resort and document why no higher-level approach works.

If a test cannot be written at levels 1-2, consider whether E2E (Playwright) is a better fit than JSDOM.

## Canvas Hit-Testing in JSDOM

AG Charts renders to HTML Canvas. In JSDOM (the Jest test environment), canvas operations are stubbed:

-   **`isPointInPath` / `isPointInStroke`** — Always return `false`. This means `Shape.containsPoint()` and `Group.pickNodes()` cannot perform real hit-testing. Hover/click interactions that rely on picking canvas shapes will not reach the picking code path.
-   **Exception: `Rect` with unrounded corners** — `Rect.updatePath()` replaces the hit-tester with a BBox check (`bbox.containsPoint`), which works without canvas. However, the Rect must have had `updatePath()` called (happens during rendering).
-   **Image snapshots work** — `extractImageData(ctx)` and `toMatchImageSnapshot()` use the mock canvas to capture rendered output. Visual comparisons are valid.

### When to Escalate to E2E

If a regression test requires real canvas hit-testing (e.g., verifying that hovering a specific shape triggers or does not trigger an error), write a **Playwright E2E test** instead of a JSDOM unit test. Playwright uses a real browser where `isPointInPath` works correctly.

**Note:** Headless Chromium may behave differently from headed mode for canvas path operations. When writing E2E tests that depend on canvas picking, verify the test works in the CI configuration (typically headless).

## E2E Test Example Patterns

E2E tests load standalone examples from `_examples/` directories. When an E2E test needs to trigger chart mutations (option updates, enable/disable toggles, data changes):

-   **Add buttons to the example HTML** for every operation the test exercises. This makes the example a self-contained reproducer that human operators can use to manually verify the issue.
-   **Wire buttons in `main.ts`** using `chart.updateDelta()` or `chart.update()` to apply the change.
-   **Click the buttons from the test** via `page.getByText('Button Label').click()` rather than using `page.evaluate()` to call chart APIs directly.
-   **Avoid exposing chart internals on `window`** — no `(window as any).chart = chart`. The example should be operable entirely through its own UI controls.
-   **Add `// @ag-skip-fws`** to the top of `main.ts` — direct DOM manipulation (`getElementById`, `addEventListener`) is incompatible with framework generation and will fail CI without this directive.

Example structure:

```html
<!-- index.html -->
<div id="controls">
    <button id="disable">Disable Feature</button>
    <button id="enable">Enable Feature</button>
</div>
<div id="myChart"></div>
```

```typescript
// main.ts — wire buttons to chart updates
const chart = AgCharts.create(options);
document.getElementById('disable')!.addEventListener('click', () => {
    chart.updateDelta({ feature: { enabled: false } });
});
```

## Code Quality Tools

-   **ESLint**: Comprehensive setup with TypeScript rules, SonarJS, and custom AG Charts rules
-   **TypeScript**: Strict type checking with multiple tsconfig files for different build targets
-   **Nx**: Advanced caching and task orchestration for optimal build performance

## Essential Test Commands

-   `yarn nx test <package>` – execute Jest suites for the affected package
-   `yarn nx test <package> --testPathPattern="<file-name>"` - test specific test file
-   `yarn nx test <package> --testPathPattern="<file-name>" --testNamePattern="<test-name>"` - test specific test name in a specific test file
-   `yarn nx e2e <package>` – run Playwright flows when altering website behaviour
-   `yarn nx benchmark <package>` – assess performance regressions; filter via `-- -t "pattern"` when needed

## Baseline Verification

After meaningful chart changes, expect to run:

-   `yarn nx test ag-charts-community`
-   `yarn nx test ag-charts-enterprise`
-   `yarn nx test:e2e ag-charts-website`

## Test Verification Patterns

When writing or modifying tests, review similar tests to ensure consistent verification patterns. For example, if similar tests verify domains, your tests should too.
