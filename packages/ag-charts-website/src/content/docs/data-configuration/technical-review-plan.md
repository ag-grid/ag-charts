# Technical Review Plan: Data Configuration and Update

## Documentation Information

-   **Page Path**: `packages/ag-charts-website/src/content/docs/data-configuration/index.mdoc`
-   **Dev URL**: `https://localhost:4600/charts/javascript/data-configuration/`
-   **Review Date**: 2025-12-12

## Execution Mode

**ADAPTIVE MODE** - Checking available tools and performing review with available capabilities.

## 1. TypeScript Definitions to Verify

### Core Chart Options

-   **File**: `packages/ag-charts-types/src/chart/chartOptions.ts`
    -   `AgBaseChartOptions.data?: TDatum[]` (line 288)
    -   `AgBaseThemeableChartOptions.suppressFieldDotNotation?: boolean` (line 254)
    -   Documentation claims for data structure and binding

### Series Options

-   **File**: `packages/ag-charts-types/src/series/seriesOptions.ts`
    -   `AgBaseSeriesOptions.data?: TDatum[]` (line 99)
    -   Per-series data configuration
    -   Key properties (`xKey`, `yKey`, `colorKey`, `angleKey`)

### Data Transaction API

-   **File**: `packages/ag-charts-types/src/chart/dataTransaction.ts`
    -   `AgDataTransaction<T>` interface (lines 9-38)
    -   `add?: T[]` property
    -   `addIndex?: number` property
    -   `remove?: T[]` property
    -   `update?: T[]` property

### Chart Instance API

-   **File**: `packages/ag-charts-types/src/chartBuilderOptions.ts`
    -   `AgTypedChartInstance.update()` method (line 170)
    -   `AgTypedChartInstance.updateDelta()` method (line 183)
    -   `AgTypedChartInstance.applyTransaction()` method (line 190)

## 2. Implementation Files to Cross-Check

### Data Binding Implementation

-   `packages/ag-charts-community/src/chart/chart.ts` - Main chart class with data handling
-   `packages/ag-charts-community/src/chart/series/series.ts` - Base series class
-   `packages/ag-charts-community/src/series/cartesian/barSeries.ts` - Bar series implementation (used in example)

### Field Dot Notation Implementation

-   Search for `suppressFieldDotNotation` usage in community/enterprise packages
-   Verify dot notation parsing logic

### Transaction Implementation

-   Search for `applyTransaction` implementation in chart class
-   Verify transaction processing logic

## 3. Module Files to Check for Theme Defaults

### Bar Series Module

-   `packages/ag-charts-community/src/series/cartesian/barSeriesModule.ts`
    -   Check for any theme template defaults related to data properties

## 4. Examples to Test

### Example: basic-data

-   **Location**: `packages/ag-charts-website/src/content/docs/data-configuration/_examples/basic-data/`
-   **Files**:
    -   `main.ts` (verified exists)
    -   `index.html` (verified exists)
    -   No `data.ts` file
    -   No `styles.css` file

**Documentation Claims**:

-   Demonstrates binding data to series using `xKey` and `yKey`
-   Shows two bar series sharing the same root-level data
-   Data structure: `{ year: string, women: number, men: number }`
-   Both series use `xKey: 'year'` for category axis
-   Series 1 uses `yKey: 'women'`
-   Series 2 uses `yKey: 'men'`
-   Each series has a `yName` for legend display

**Expected Behaviors**:

-   Chart displays two grouped bar series
-   X-axis shows years (2021, 2022, 2023)
-   Y-axis shows numeric values
-   Legend shows "Women" and "Men" labels
-   Bars are grouped by year

**Key Configurations to Verify**:

-   Root-level `data` array matches documentation snippet
-   `series[0].type: 'bar'`
-   `series[0].xKey: 'year'`
-   `series[0].yKey: 'women'`
-   `series[0].yName: 'Women'`
-   `series[1].type: 'bar'`
-   `series[1].xKey: 'year'`
-   `series[1].yKey: 'men'`
-   `series[1].yName: 'Men'`
-   Title: "Annual Attendees by Gender"

## 5. Interactive Features to Test (Mode-Dependent)

**Full Mode Features**:

-   Hover over bars to verify tooltip displays
-   Legend items are clickable to toggle series visibility
-   Chart renders correctly with both series visible

**Degraded Mode**: Static analysis only, runtime behavior cannot be verified without browser automation.

## 6. Visual States to Capture (Full Mode Only)

If MCP Puppeteer available:

-   `reports/screenshots/basic-data-initial.png` - Initial chart rendering
-   `reports/screenshots/basic-data-tooltip.png` - Tooltip on hover
-   `reports/screenshots/basic-data-legend-toggle.png` - After toggling legend item

## 7. Technical Accuracy Validation Tasks

### Data Structure Section

-   [ ] Verify documentation claim: "expects data as an array of objects"
-   [ ] Verify TypeScript generics support exists and is documented correctly
-   [ ] Verify hierarchical series reference is accurate (Treemap, Sunburst using `children`)

### Binding Data to Series Section

-   [ ] Verify `_Key` properties exist in TypeScript definitions
-   [ ] Verify examples of key properties: `xKey`, `yKey`, `colorKey`, `angleKey`
-   [ ] Verify link to Series Options reference is valid
-   [ ] Verify example code matches actual example implementation

### Per-Series Data Section

-   [ ] Verify series-level `data` option exists in TypeScript definitions
-   [ ] Verify documentation claim: "overrides the root-level data option for that series only"
-   [ ] Verify performance recommendation: "recommended for best performance" (root-level data)

### Field Dot Notation Section

-   [ ] Verify `suppressFieldDotNotation` option exists and matches TypeScript definition
-   [ ] Verify default value is `false` (dot notation enabled by default)
-   [ ] Verify dot notation example is technically accurate
-   [ ] Check if implementation supports nested property access

### Updating Data Section

-   [ ] Verify `update()` method exists on `AgChartInstance`
-   [ ] Verify `updateDelta()` method exists on `AgChartInstance`
-   [ ] Verify method signatures match documentation
-   [ ] Verify link to Create/Update API Reference is valid

### High Frequency Updates Section

-   [ ] Verify `applyTransaction()` method exists on `AgChartInstance`
-   [ ] Verify `AgDataTransaction` interface structure matches documentation
-   [ ] Verify transaction properties: `add`, `remove`, `update`
-   [ ] Verify documentation claim about performance benefits
-   [ ] Verify link to High-Frequency Data page is valid

## 8. Content Quality Review Tasks

-   [ ] Check for missing configuration options related to data
-   [ ] Verify all code snippets are syntactically correct
-   [ ] Check for consistency between inline snippets and full examples
-   [ ] Verify all internal links are valid
-   [ ] Check for completeness of feature coverage
-   [ ] Identify any undocumented features discovered in TypeScript definitions

## 9. Known Exceptions

No `technical-review-exceptions.md` file found for this page.

## 10. Review Execution Order

1. **Phase 1**: Read all TypeScript definition files listed above
2. **Phase 2**: Verify technical accuracy of each documentation section against TypeScript definitions
3. **Phase 3**: Validate example consistency (static analysis or runtime testing based on available tools)
4. **Phase 4**: Visual and interaction testing (if MCP Puppeteer available)
5. **Phase 5**: Content quality assessment
6. **Phase 6**: Generate comprehensive report with findings

## Notes

-   This page is fundamental documentation covering core data concepts
-   Accuracy is critical as this affects all chart types and use cases
-   Example should work across all frameworks (React, Angular, Vue, vanilla JS)
-   Pay special attention to API signature accuracy for `update()`, `updateDelta()`, and `applyTransaction()`
-   Verify TypeScript generic support claims are accurate
