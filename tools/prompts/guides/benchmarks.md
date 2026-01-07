---
paths: '**/benchmarks/**/*'
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
