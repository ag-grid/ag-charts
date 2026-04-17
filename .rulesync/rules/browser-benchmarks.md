---
root: false
targets: ['*']
description: 'Browser-based benchmark harness for AG Charts performance testing'
globs: ['**/*-test/_examples/**/main.ts', '**/benchmarks/**/*']
---

# Browser Benchmarks Guide

This guide covers writing browser-based benchmarks using the shared benchmark harness. For Jest-based unit benchmarks, see [Benchmarks Guide](./benchmarks.md).

## Overview

The benchmark harness provides a declarative way to run performance tests in the browser. It automatically:

- Creates a UI with "Run Benchmark" button
- Executes warmup iterations before measurement
- Collects timing statistics (min, max, average)
- Displays results in a table with dynamic columns
- Supports JSON export
- Auto-runs via `?benchmark=true` URL parameter

## Quick Start

1. Create an example in a `-test` page (e.g., `high-frequency-data-test/_examples/my-benchmark/`)
2. Add `// @ag-skip-fws` at the top of `main.ts` (benchmarks don't need framework variants)
3. Define a `getBenchmarkConfig()` function that returns the benchmark configuration
4. The harness is automatically injected when `getBenchmarkConfig` is detected

## Configuration Structure

```typescript
interface BenchmarkVariant {
    params?: Record<string, string>; // Arbitrary parameters (0..N)
    available?: boolean;
    update: () => Promise<number>;
}

interface BenchmarkTestCase {
    id: string;
    label?: string;
    setup?: () => Promise<void>;
    variants: BenchmarkVariant[];
}

interface BenchmarkConfigSettings {
    updatesPerTest: number; // Target number of measurements per variant
    maxCollectionTimeMs: number; // Maximum time to spend on each variant
    warmupUpdates: number; // Iterations to run before measuring
}

interface BenchmarkConfig {
    testCases: BenchmarkTestCase[];
    config: BenchmarkConfigSettings;
    warnings?: string[];
    metadata?: Record<string, unknown>;
    onComplete?: () => Promise<void>;
}
```

## Example Implementation

### Basic Example (Single Parameter)

```typescript
// @ag-skip-fws
import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    // ... chart configuration
};

const chart = AgCharts.create(options);

/** inScope */
async function performUpdate(method: string): Promise<number> {
    const start = performance.now();

    if (method === 'full') {
        options.data = generateNewData();
        await chart.update(options);
    } else {
        await chart.updateDelta({ data: generateNewData() });
    }
    await chart.waitForUpdate();

    return performance.now() - start;
}

/** inScope */
function getBenchmarkConfig() {
    return {
        testCases: [
            {
                id: 'data-update',
                label: 'Data Update',
                variants: [
                    {
                        params: { Method: 'chart.update()' },
                        update: () => performUpdate('full'),
                    },
                    {
                        params: { Method: 'chart.updateDelta()' },
                        update: () => performUpdate('delta'),
                    },
                ],
            },
        ],
        config: {
            updatesPerTest: 100,
            maxCollectionTimeMs: 10000,
            warmupUpdates: 10,
        },
    };
}
```

### Multiple Parameters

Test combinations of multiple parameters:

```typescript
variants: [
    { params: { Method: 'update()', Batch: '100' }, update: () => runTest('update', 100) },
    { params: { Method: 'update()', Batch: '1000' }, update: () => runTest('update', 1000) },
    { params: { Method: 'updateDelta()', Batch: '100' }, update: () => runTest('delta', 100) },
    { params: { Method: 'updateDelta()', Batch: '1000' }, update: () => runTest('delta', 1000) },
];
```

Results table columns: `Test Case | Method | Batch | Avg Time | Min Time | Max Time | Samples`

### No Parameters (Test Cases Only)

When you only need to compare test cases without variants:

```typescript
testCases: SERIES_TYPES.map((seriesType) => ({
    id: seriesType,
    label: seriesType,
    variants: [{ update: () => performUpdate() }], // Single variant, no params
}));
```

Results table: `Test Case | Avg Time | Min Time | Max Time | Samples`

## Key Patterns

### Multiple Test Cases with Setup

Test different scenarios with per-test-case setup:

```typescript
testCases: [
    {
        id: 'small-data',
        label: '1K Points',
        setup: async () => {
            await setDataSize(1000);
        },
        variants: [
            /* ... */
        ],
    },
    {
        id: 'large-data',
        label: '100K Points',
        setup: async () => {
            await setDataSize(100000);
        },
        variants: [
            /* ... */
        ],
    },
];
```

### Conditional Availability

Use `available: false` to skip variants that aren't supported:

```typescript
{
    params: { 'Method': 'applyTransaction()' },
    available: isVersionAtOrAfter(12, 3, 0),
    update: () => performUpdate('applyTransaction'),
}
```

### State Restoration

Use `onComplete` to restore original state after benchmarking:

```typescript
{
    testCases: [/* ... */],
    config: {/* ... */},
    onComplete: async () => {
        // Restore original series type, data, etc.
        await setSeriesType(originalSeriesType);
    },
}
```

### Warnings

Display warnings about test conditions:

```typescript
{
    warnings: [
        ...(!SUPPORTS_FEATURE
            ? ['Feature X not available (requires >= 12.3.0)']
            : []),
    ],
}
```

## Dynamic Columns

The results table automatically generates columns based on the parameter keys found across all variants:

- Column order follows discovery order (first seen)
- Each unique parameter key becomes a column header
- Results show parameter values (or empty if not applicable to that variant)

Example with `{ Method: 'update()', Batch: '100' }`:

| Test Case | Method   | Batch | Avg Time (ms) | Min Time (ms) | Max Time (ms) | Samples |
| --------- | -------- | ----- | ------------- | ------------- | ------------- | ------- |
| line      | update() | 100   | 1.234         | 0.987         | 2.345         | 100     |

## Auto-Run Mode

Add `?benchmark=true` to the URL to automatically start the benchmark after page load. Useful for CI automation.

## Results

The harness displays:

- **Test Case**: The test case label/id
- **[Parameter columns]**: Dynamic columns for each parameter key
- **Avg/Min/Max Time**: Timing statistics in milliseconds
- **Samples**: Number of measurements collected

Results are also logged to console via `console.table()`.

### JSON Export

Click "Export JSON" to download results:

```json
{
    "version": "13.0.0",
    "parameterKeys": ["Update Method"],
    "metadata": { "dataPoints": 100000 },
    "results": [
        {
            "testCase": "line",
            "params": { "Update Method": "applyTransaction()" },
            "averageTime": 1.234,
            "minTime": 0.987,
            "maxTime": 2.345,
            "sampleCount": 100,
            "timings": [1.1, 1.2, 1.3]
        }
    ]
}
```

## File Structure

```
_examples/my-benchmark/
├── index.html          # Chart container + any controls
├── main.ts            # Chart setup + getBenchmarkConfig()
└── data.ts            # Optional data generation
```

## Important Notes

1. **Use `// @ag-skip-fws`**: Benchmarks shouldn't generate framework variants
2. **Mark functions with `/** inScope \*/`\*\*: Functions using chart/state that aren't DOM handlers need this comment
3. **Return elapsed time**: The `update` function must return `Promise<number>` with milliseconds elapsed
4. **Use `waitForUpdate()`**: Always await `chart.waitForUpdate()` to ensure rendering completes before measuring
5. **Stop regular updates**: If the example has auto-updating features, stop them in the benchmark update function

## Related Resources

- [Benchmarks Guide](./benchmarks.md) - Jest-based unit benchmarks
- [Examples Guide](./examples.md) - General example creation patterns
- [Testing Guide](./testing.md) - Testing strategies overview
