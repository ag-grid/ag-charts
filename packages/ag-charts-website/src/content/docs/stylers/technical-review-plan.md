# Technical Review Plan: Stylers Documentation

## Page Information

-   **Documentation Page**: `/Users/bls/git/ag-charts.worktrees/review-docs-13/packages/ag-charts-website/src/content/docs/stylers/index.mdoc`
-   **Live URL**: `https://localhost:4600/charts/javascript/stylers/`
-   **Review Date**: 2025-12-12

## Execution Mode

**ADAPTIVE MODE** - MCP Puppeteer and Task tools not available. Will perform static code analysis only.

## API Surface Extracted from Documentation

### Item Stylers

-   `series[].marker.itemStyler` - for line series markers
-   `series[].label.itemStyler` - for series labels
-   `series[].itemStyler` - for series items (e.g., bars)
-   `axes.y.label.itemStyler` - for axis labels

### Series Stylers

-   `theme.overrides.bar.series.styler` - for bar series styling
-   `theme.overrides.line.series.styler` - for line series styling

### Properties Referenced in Documentation

#### Item Styler Properties

-   `fill` - fill color
-   `size` - marker size
-   `fontSize` - label font size
-   `border` - label border (with `stroke`)
-   `padding` - label padding
-   `color` - text color
-   `highlightState` - highlight state parameter
-   `stroke` - stroke color (for line series)

#### Series Styler Properties

-   `fill` - for bar series
-   `stroke` - for line series

#### Styler Parameters

-   `datum` - the datum object
-   `fill` - current fill color
-   `size` - current size
-   `highlightState` - highlight state value
-   `yKey` - y-axis key
-   `seriesId` - series identifier
-   `value` - axis label value

## TypeScript Definition Files to Verify

### Core Type Definitions

1. `/Users/bls/git/ag-charts.worktrees/review-docs-13/packages/ag-charts-types/src/series/cartesian/barOptions.ts`

    - Verify `AgBarSeriesThemeableOptions.styler` and `AgBarSeriesThemeableOptions.itemStyler`
    - Verify `AgBarSeriesStylerParams` and `AgBarSeriesItemStylerParams`
    - Verify `AgBarSeriesStyle` properties

2. `/Users/bls/git/ag-charts.worktrees/review-docs-13/packages/ag-charts-types/src/series/cartesian/lineOptions.ts`

    - Verify `AgLineSeriesThemeableOptions.styler`
    - Verify `AgLineSeriesStylerParams` and `AgLineSeriesStylerResult`
    - Verify marker itemStyler via `AgSeriesMarkerOptions`

3. `/Users/bls/git/ag-charts.worktrees/review-docs-13/packages/ag-charts-types/src/series/markerOptions.ts`

    - Verify `AgSeriesMarkerOptions.itemStyler`

4. `/Users/bls/git/ag-charts.worktrees/review-docs-13/packages/ag-charts-types/src/chart/labelOptions.ts`

    - Verify `AgChartLabelOptions.itemStyler`
    - Verify `AgChartLabelStylerParams` and `AgChartLabelStyleOptions`

5. `/Users/bls/git/ag-charts.worktrees/review-docs-13/packages/ag-charts-types/src/chart/axisOptions.ts`

    - Verify `AgBaseAxisLabelOptions.itemStyler`
    - Verify `AgAxisLabelStylerParams` and `AgBaseAxisLabelStyleOptions`

6. `/Users/bls/git/ag-charts.worktrees/review-docs-13/packages/ag-charts-types/src/chart/callbackOptions.ts`
    - Verify `Styler` type definition
    - Verify `HighlightState` type

### Theme Override Types

7. `/Users/bls/git/ag-charts.worktrees/review-docs-13/packages/ag-charts-types/src/chart/themes/chartTheme.ts`
    - Verify theme override structure for series stylers

## Implementation Files to Cross-Check

### Bar Series

1. `/Users/bls/git/ag-charts.worktrees/review-docs-13/packages/ag-charts-community/src/chart/series/cartesian/barSeries.ts`

    - Verify itemStyler implementation
    - Verify styler implementation

2. `/Users/bls/git/ag-charts.worktrees/review-docs-13/packages/ag-charts-community/src/chart/series/cartesian/barSeriesProperties.ts`

    - Verify property definitions for stylers

3. `/Users/bls/git/ag-charts.worktrees/review-docs-13/packages/ag-charts-community/src/chart/series/cartesian/barSeriesModule.ts`
    - Check theme template defaults

### Line Series

4. `/Users/bls/git/ag-charts.worktrees/review-docs-13/packages/ag-charts-community/src/chart/series/cartesian/lineSeries.ts`

    - Verify styler implementation
    - Verify marker itemStyler implementation

5. `/Users/bls/git/ag-charts.worktrees/review-docs-13/packages/ag-charts-community/src/chart/series/cartesian/lineSeriesProperties.ts`

    - Verify property definitions for stylers

6. `/Users/bls/git/ag-charts.worktrees/review-docs-13/packages/ag-charts-community/src/chart/series/cartesian/lineSeriesModule.ts`
    - Check theme template defaults

### Marker Implementation

7. `/Users/bls/git/ag-charts.worktrees/review-docs-13/packages/ag-charts-community/src/chart/marker/marker.ts`
    - Verify marker itemStyler implementation (if exists)

### Axis Implementation

8. `/Users/bls/git/ag-charts.worktrees/review-docs-13/packages/ag-charts-community/src/chart/axis/axis.ts`
    - Verify axis label itemStyler implementation

## Examples to Test (Static Analysis)

### Example 1: item-styler

-   **Path**: `/Users/bls/git/ag-charts.worktrees/review-docs-13/packages/ag-charts-website/src/content/docs/stylers/_examples/item-styler/`
-   **Files**: `main.ts`, `data.ts`
-   **Documentation Claims**:
    -   Coal line series markers and labels styled red when coal > nuclear
    -   Marker size changes to 15 when coal > nuclear
    -   Label fontSize changes to 12 with red border when coal > nuclear
    -   Imported bar for 'Jul' is red, with lime highlight
    -   Y-axis labels colored with gradient scale
-   **Key Configurations**:
    -   `marker.itemStyler` with `coal > nuclear` logic
    -   `label.itemStyler` for line series
    -   `itemStyler` for bar series with `highlightState` check
    -   `axes.y.label.itemStyler` with gradient coloring
-   **Expected Behaviors**:
    -   Dynamic marker styling based on data comparison
    -   Conditional label visibility (transparent for non-Jul months)
    -   Highlight state differentiation ('highlighted-item' = lime, default = red)

### Example 2: series-styler

-   **Path**: `/Users/bls/git/ag-charts.worktrees/review-docs-13/packages/ag-charts-website/src/content/docs/stylers/_examples/series-styler/`
-   **Files**: `main.ts`, `data.ts`
-   **Documentation Claims**:
    -   Series with 'benchmark' in key are gray
    -   Other series are blue (#5090DC)
    -   Legend items reflect this styling
-   **Key Configurations**:
    -   `theme.overrides.bar.series.styler` checking `yKey.includes('benchmark')`
    -   `theme.overrides.line.series.styler` checking `yKey.includes('benchmark')`
    -   Returns `fill` for bar, `stroke` for line
-   **Expected Behaviors**:
    -   Series-level styling based on key pattern matching
    -   Different properties for different series types (fill vs stroke)
    -   Legend inherits series styling

### Additional Examples (Not Referenced in Docs)

3. **item-styler-highlight-states** - may demonstrate highlight state usage
4. **marker-styler** - may demonstrate marker-specific itemStyler
5. **series-item-styler** - may demonstrate relationship between styler and itemStyler

## Interactive Features to Test (Static Analysis Notes)

Note: Browser automation unavailable. Will verify code patterns only.

### Highlight State Behavior

-   **Feature**: `highlightState` parameter in itemStyler
-   **Expected**: Different styles for 'highlighted-item', 'highlighted-series', etc.
-   **Verification**: Check if code correctly handles highlightState values

### Gradient Coloring Function

-   **Feature**: `lerpColor` function in item-styler example
-   **Expected**: Smooth gradient from green to red based on value
-   **Verification**: Validate color interpolation logic

## Visual States to Capture (Skipped - No Browser)

-   Initial render state
-   Hover over 'Jul' bar (highlight state)
-   Gradient coloring on y-axis labels
-   Coal vs Nuclear comparison styling

## Content Quality Assessment Areas

1. **API Completeness**:

    - Are all styler types documented (itemStyler vs styler)?
    - Are parameter objects fully described?
    - Are return value constraints clear?

2. **Usage Clarity**:

    - Is the relationship between styler and itemStyler explained?
    - Are the differences between series types clear?
    - Is theme override usage for series stylers clear?

3. **Example Coverage**:

    - Do examples demonstrate all documented features?
    - Are edge cases shown (e.g., conditional returns, undefined)?
    - Are different series types represented?

4. **Missing Documentation**:
    - Styler availability for other series types
    - Complete list of parameters for each styler type
    - Performance considerations
    - Interaction with other styling options (theme, series options)

## Validation Tasks

### Phase 2A: Technical Accuracy

-   [ ] Verify all TypeScript interfaces match documented APIs
-   [ ] Check parameter types and return types
-   [ ] Validate property names in style objects
-   [ ] Verify highlightState values and types
-   [ ] Check default values (if any documented)

### Phase 2B: Example Consistency (Static Analysis)

-   [ ] Verify example code matches documentation snippets
-   [ ] Check that all documented features appear in examples
-   [ ] Validate data structure matches type expectations
-   [ ] Verify function signatures match TypeScript definitions
-   [ ] Check for framework compatibility patterns

### Phase 2C: Content Quality

-   [ ] Assess completeness of feature coverage
-   [ ] Identify gaps in documentation
-   [ ] Verify cross-references to other pages
-   [ ] Check for clarity and consistency in terminology

## Known Exceptions

No `technical-review-exceptions.md` file found.

## Review Constraints

-   **Mode**: ADAPTIVE (Static analysis only)
-   **Browser Testing**: Unavailable
-   **Task Delegation**: Unavailable
-   **Focus**: TypeScript accuracy, configuration consistency, code pattern validation
