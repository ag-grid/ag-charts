# Technical Review Plan: data-configuration

**Document**: `/workspaces/ag-charts/packages/ag-charts-website/src/content/docs/data-configuration/index.mdoc`

**Mode**: ADAPTIVE MODE (Static Analysis Only - MCP Puppeteer unavailable)

## Phase 1: Analysis Summary

### 1. API Surface Extraction

The documentation covers:

-   **Chart Options**: `data` array property, `suppressFieldDotNotation`
-   **Series Options**: Per-series `data` override, `xKey`, `yKey`, `yName`
-   **Data Source**: Asynchronous `dataSource` with `getData` callback
-   **Data Transaction**: `applyTransaction()` method with `add`, `remove`, `update` operations
-   **Framework Updates**: `AgChartInstance.update()`, `AgChartInstance.updateDelta()`

### 2. TypeScript Definition Files to Review

| API/Interface                             | File Path                                                 | Purpose                  |
| ----------------------------------------- | --------------------------------------------------------- | ------------------------ |
| `AgChartOptions.data`                     | `packages/ag-charts-types/src/chart/chartOptions.ts`      | Root-level chart data    |
| `AgChartOptions.suppressFieldDotNotation` | `packages/ag-charts-types/src/chart/chartOptions.ts`      | Dot notation control     |
| `AgChartOptions.dataSource`               | `packages/ag-charts-types/src/chart/chartOptions.ts`      | Async data loading       |
| `AgDataSourceOptions`                     | `packages/ag-charts-types/src/chart/dataSourceOptions.ts` | DataSource interface     |
| `AgDataTransaction`                       | `packages/ag-charts-types/src/chart/dataTransaction.ts`   | Transaction interface    |
| Series `data`                             | `packages/ag-charts-types/src/series/seriesOptions.ts`    | Per-series data override |
| Series `xKey`, `yKey`                     | `packages/ag-charts-types/src/series/cartesian/*.ts`      | Cartesian key properties |

### 3. Implementation Files to Cross-Check

| Feature              | Path Pattern                                             |
| -------------------- | -------------------------------------------------------- |
| Series data binding  | `packages/ag-charts-community/src/series/**/*.ts`        |
| Chart update methods | `packages/ag-charts-community/src/chart/*.ts`            |
| Transaction handling | `packages/ag-charts-community/src/chart/*.ts`            |
| Dot notation support | `packages/ag-charts-core/src/**/*.ts` (field resolution) |

### 4. Example Files to Validate

| Example         | Path                                | Documentation Claims                    | Key Config                                 |
| --------------- | ----------------------------------- | --------------------------------------- | ------------------------------------------ |
| basic-data      | `_examples/basic-data/main.ts`      | Basic data structure and series binding | Multiple series with shared root data      |
| per-series-data | `_examples/per-series-data/main.ts` | Series-specific data override           | Column and line series with different data |
| hierarchy-data  | `_examples/hierarchy-data/main.ts`  | Hierarchical data structure             | Treemap with nested children               |
| **MISSING**     | `_examples/using-data-basic/`       | Referenced in chartExampleRunner        | **CRITICAL: Does not exist**               |

### 5. Interactive Features Claimed in Documentation

-   Dot notation field access (`user.name`, `user.age`)
-   Per-series data override behavior
-   Update method calls (`chart.update()`, `chart.updateDelta()`)
-   Transaction operations (`applyTransaction()`)
-   Asynchronous data loading (`dataSource.getData()`)
-   High-frequency updates with transactions

### 6. Known Exceptions

**No exceptions file found** at `packages/ag-charts-website/src/content/docs/data-configuration/technical-review-exceptions.md`

## Review Task Summary

### Technical Accuracy Checks (Static Analysis)

1. Verify `data` property documentation against `chartOptions.ts`
2. Verify `suppressFieldDotNotation` default behavior (should be `false`)
3. Verify `dataSource` interface matches documentation
4. Verify transaction operations (`add`, `remove`, `update`) documented correctly
5. Verify series `xKey`, `yKey` variations by chart type
6. Verify dot notation feature description accuracy

### Example Consistency Checks (Static Analysis)

1. **basic-data**: Verify configuration matches documentation patterns
2. **per-series-data**: Verify per-series data structure and series-specific configs
3. **hierarchy-data**: Verify hierarchical data structure with `children` array
4. **using-data-basic**: **CRITICAL** - Example referenced but files do not exist

### Content Quality Assessment

-   Check for missing property documentation
-   Verify feature coverage completeness
-   Identify unclear explanations or gaps

### Visual & Interaction Testing

**[SKIPPED] - MCP Puppeteer unavailable**

Cannot verify:

-   Screenshot capture and rendering validation
-   Interactive feature testing
-   Framework-specific update behavior
-   Responsive layout verification

Manual verification recommended for:

-   `chart.update()` behavior across frameworks (vanilla/React/Angular/Vue)
-   `applyTransaction()` performance characteristics
-   Dot notation field resolution with nested objects

## Files to Be Generated

-   `technical-review-report.md` - Detailed findings and recommendations
-   `reports/` - Directory for any supporting evidence
