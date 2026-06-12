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

## Shared fixtures and helper extraction

-   **If the same test body, builder, or stub appears in two or more files, hoist it** into the suite's shared fixture module before merging: community-wide fixtures in `packages/ag-charts-community/src/chart/test/` (exported via `src/main-test.ts` so enterprise imports from `ag-charts-community-test`), enterprise-only helpers in `packages/ag-charts-enterprise/src/test/`.
-   Helpers shared by community AND enterprise tests must live in community-test space — enterprise can import community, not vice versa.
-   A copy-pasted explanatory comment travelling with a copy-pasted block is the strongest extraction signal: the comment belongs once, on the shared helper.
-   Stub factories for internal interfaces (e.g. the `DataModel` stub in `chart/test/aggregationStubs.ts`) must be defined once so interface drift is caught in one place instead of silently diverging across files.

## Caching and performance-path test checklist

Any memoised/cached derivation (e.g. parse-once columns, sort-order caches) needs tests for:

1.  **The invalidation path** — mutate the input, invalidate, and assert recomputation.
2.  **Heterogeneous input** — mixed-type columns (e.g. `Date` first, ISO strings later), not just uniform ones; first-element sampling bugs hide here.
3.  **Invalid values** — `NaN`/unparseable entries must not flip a fast-path eligibility flag (e.g. "sorted") to a wrong answer.
