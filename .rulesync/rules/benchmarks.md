---
root: false
targets: ['*']
description: 'Running and creating performance benchmarks for AG Charts'
globs: ['**/benchmarks/**', '**/*.benchmark.ts']
---

# Benchmarks Guide

This guide covers running and creating performance benchmarks for AG Charts.

## Performance Considerations

-   Use `yarn nx benchmark` to check performance impact on hotspots.
-   Focus on canvas rendering efficiency and memory churn.
-   Enable `AG_BENCHMARK_DEBUG=1` locally for detailed memory output.

## Benchmarks Overview

-   Benchmark suites live in `packages/ag-charts-{community,enterprise}/benchmarks/`.
-   Visual snapshots run by default; set `BENCHMARK_SOFT_FAIL=1` in CI to skip them.
-   Enterprise benchmarks re-export community utilities via `packages/ag-charts-enterprise/benchmarks/benchmark.ts`.

## Running Benchmarks

-   `yarn nx benchmark ag-charts-community -- -t "initial load"` runs all "initial load" cases for community.
-   `yarn nx benchmark ag-charts-enterprise -- -t "initial load"` does the same for enterprise.
-   Filtering is by test name pattern (xargs prevents targeting individual files).

## Creating New Benchmarks

1. Create benchmark test file in `packages/ag-charts-{community,enterprise}/benchmarks/${name}.test.ts` using `setupBenchmark()` and `benchmark()` utilities.
2. Create or copy the example to `packages/ag-charts-website/src/content/docs/benchmarks/_examples/${exampleName}/`.
3. Add `/* @ag-options-extract */` and `/* @ag-options-end */` comments around the options object in the example's `main.ts`.
4. Add example dependency to `benchmark.dependsOn` array in the package's `project.json`: `ag-charts-website-benchmarks_${exampleName}_main.ts:generate-example`.
5. Run `yarn nx benchmark ag-charts-{community,enterprise} -- -t "test pattern"` to verify.

## Browser Benchmarks

Browser benchmarks run the docs-page benchmark examples in headless Chromium via Playwright, producing real canvas rendering measurements (unlike Jest/jsdom benchmarks which skip canvas).

-   **Run**: `yarn nx browser-benchmark ag-charts-website` (requires `yarn nx dev` running separately), or `tools/benchmark/run-browser-benchmarks.sh` (manages dev server lifecycle for CI).
-   **Script**: `tools/benchmark/browser-benchmark.ts` — discovers examples from `_examples/`, launches Playwright, collects results.
-   **Output**: `reports/browser-benchmarks/results.json` (combined JSON report).
-   **Auto-run**: Examples use `?benchmark=true` query param to trigger automatic benchmark execution.
-   **`#e2e=true` gotcha**: Do NOT add `#e2e=true` to benchmark URLs — each example guards `initBenchmark()` with `if (!window.location.hash.includes('e2e=true'))`, so the hash suppresses benchmark initialisation.
-   **Excluded examples**: `summary` (static comparison dashboard, no `getBenchmarkConfig()`) and `high-freq-high-volume` (streaming demo using animation-loop pattern, no `initBenchmark()`).
