---
root: false
targets: ['*']
description: 'Mock canvas/console contracts and shared-fixture discipline for AG Charts JSDOM tests'
globs: ['**/*.test.ts', '**/test/**']
---

# Test Harness Contracts

These contracts are coupled to `libraries/ag-charts-test` and the shared fixtures in `packages/ag-charts-community/src/chart/test/`. They are easy to violate silently — tests keep passing while asserting nothing.

## `setupMockCanvas().snapshot()` only sees the FIRST chart created per test

The mock canvas hands its snapshot-backed node canvas to the first `document.createElement('canvas')` call in each test; every later chart draws onto a fresh, unsnapshotted canvas.

-   **Never compare two separately-created charts via `snapshot()`.** A create → snapshot → destroy → create → snapshot sequence snapshots the same (first) canvas twice, so the comparison passes vacuously.
-   **Multi-variant pixel comparisons must reuse ONE chart**, applying the second variant via `chart.update(optionsB)` (or `chart.publicApi.update(...)` on a deproxied chart) between snapshots. Use the shared helpers `expectPixelIdenticalAcrossUpdate` / `expectPixelIdenticalAcrossMagnitude` (`chart/test/bigintExamples.ts`) rather than hand-rolling this.
-   **Pixel-identity helpers need an anti-vacuous guard**: assert the baseline snapshot is non-uniform (non-blank) before comparing, so a chart that failed to render cannot produce a green test.

## `setupMockConsole()` already fails tests on console output

Its `afterEach` asserts `console.warn`/`console.error` were not called. In suites that call `setupMockConsole()`:

-   Do NOT add `vi.spyOn(console, 'error')` + `expect(spy).not.toHaveBeenCalled()` — it is dead weight, and layering a spy over the harness's mock then calling `mockRestore()` can desynchronise it.
-   To assert *specific expected* warnings, use `expectWarningsCalls()` inline snapshots from the same harness.

## Chart factories: `createChart` and `createEnterpriseChart`

-   **Use the shared factories to create a chart in a test**: `createChart` (`packages/ag-charts-community/src/chart/test/utils.ts`, also exported from `ag-charts-community-test`) for community charts and `createEnterpriseChart` (`packages/ag-charts-enterprise/src/test/utils.ts`) for enterprise charts. Do not write a local `createChart` copy or a one-off `create*Chart` helper.
-   **What they do**: copy the options, apply the test preparation (`prepareTestOptions` / `prepareEnterpriseTestOptions`: canvas size, container, test theme, and animations off for enterprise), call `AgCharts.create`, and await `waitForChartStability`.
-   **What they return**: the public `AgChartInstance`, not the internal `Chart`. A test that needs internals (`series`, `axes`, `ctx`, `seriesRect`, managers) opts in at the call site so the internal access is visible: `const chart = deproxy(await createChart(options));`. A test that only uses the public API keeps the public instance.
-   **A local helper that only builds options is an options builder**: `const barOptions = (extra) => ({ ... })`, with its result passed to the shared factory (`chart = await createChart(barOptions({ ... }))`). A helper that calls the shared factory itself stays only when it does test setup beyond building options and assigning the result: installing spies or recorders, or reading derived values from the chart after creation. One that builds options and then calls, deproxies or assigns the factory result becomes an options builder.
-   **Keep a bespoke factory only when the shared ones cannot do the job**: a custom container, a size set after preparation, no preparation at all, a `params` argument to `AgCharts.create`, a stub installed between create and first render, or a different readiness condition. Say why in a comment on the helper.
-   **A bare `AgCharts.create` in a test is allowed only for those bespoke cases**, or where the test asserts or acts before the first render or stability (warnings or errors thrown on create, a frame spy that must see the first frame, timing tests). Mark it with a `// Bespoke: <reason>` comment, once per suite or helper rather than on every line. Everything else goes through the shared factories, and `AgCharts.create(prepareTestOptions(options))` is not a substitute for them.
-   **Do not wrap the factory result in `deproxy()` just to take an image snapshot**: `compareImageSnapshot` takes the public instance, so only a test that reads internals needs `deproxy()`.
-   **Wrap the factory call in `deproxy()` when the variable is read for internals.** An `any`-typed chart variable will not flag a missing `deproxy()`, so type the variable as `AgChartInstance` (public API) or `Chart` (internals).

## Shared fixtures and helper extraction

-   **Search before writing a helper.** Look in `packages/ag-charts-community/src/chart/test/` and `packages/ag-charts-enterprise/src/test/` for an existing helper (axis option mixins such as `applyAxesFlip` and `mixinDerivedCases` live in `chart/test/axisTestCases.ts`) before adding a local one; if one almost fits, extend it instead of copying it. Give a genuinely different variant its own name in the shared module rather than a second local copy under the same name.
-   **If the same test body, builder, or stub appears in two or more files, hoist it** into the suite's shared fixture module before merging: community-wide fixtures in `packages/ag-charts-community/src/chart/test/` (exported via `src/main-test.ts` so enterprise imports from `ag-charts-community-test`), enterprise-only helpers in `packages/ag-charts-enterprise/src/test/`.
-   Helpers shared by community AND enterprise tests must live in community-test space — enterprise can import community, not vice versa. Enterprise `src/test` must not import from `vitest` (the dependency-cruiser `not-to-dev-dep` rule), so a helper there that calls `expect` uses the vitest globals instead (e.g. `aggregationSharedTests.ts`).
-   A copy-pasted explanatory comment travelling with a copy-pasted block is the strongest extraction signal: the comment belongs once, on the shared helper.
-   Stub factories for internal interfaces (e.g. the `DataModel` stub in `chart/test/aggregationStubs.ts`) must be defined once so interface drift is caught in one place instead of silently diverging across files.

## Caching and performance-path test checklist

Any memoised/cached derivation (e.g. parse-once columns, sort-order caches) needs tests for:

1.  **The invalidation path** — mutate the input, invalidate, and assert recomputation.
2.  **Heterogeneous input** — mixed-type columns (e.g. `Date` first, ISO strings later), not just uniform ones; first-element sampling bugs hide here.
3.  **Invalid values** — `NaN`/unparseable entries must not flip a fast-path eligibility flag (e.g. "sorted") to a wrong answer.
