# Technical Review Plan: Secondary Axes

## Page Analysis Summary

### Chart Types/Features Covered

-   Secondary axes configuration for comparing datasets with different scales
-   Multiple y-axis support (primary left, secondary right)
-   Axis-to-series association using the `keys` property
-   Support for any number of additional axes

### Key APIs and Configuration Options Documented

-   `axes` array configuration
-   `keys` property for linking series to axes
-   `position` property for axis placement (`left`, `right`, `top`, `bottom`)
-   Axis types (`category`, `number`)
-   Axis formatting with label formatters
-   Axis titles with `enabled` property

### Examples Referenced

-   **multiple-axes**: Demonstrates secondary y-axis with:
    -   Bar series (male/female cattle) on primary axis
    -   Line series (beef exports) on secondary axis
    -   Different scales and formatters for each axis
    -   Legend configuration

### Interactive Features Described

-   Visual comparison of datasets with different scales
-   Automatic axis association based on `keys` matching

## Validation Targets

### TypeScript Interfaces to Verify

-   `AgBaseCartesianAxisOptions` in `/packages/ag-charts-types/src/chart/cartesianOptions.ts`
    -   Verify `keys?: string[]` property exists
    -   Check `position?: AgCartesianAxisPosition` property
-   `AgAxisCaptionOptions` for title configuration
-   `AgNumericAxisFormattableLabelOptions` for label formatting

### Implementation Files to Check

-   `/packages/ag-charts-community/src/chart/axis/axis.ts`
    -   Verify `@Property keys: string[] = []` implementation
-   `/packages/ag-charts-community/src/chart/chart.ts`
    -   Check axis-series matching logic using `keys`
-   `/packages/ag-charts-community/src/chart/cartesianChart.ts`
    -   Validate secondary axis positioning logic

### Examples to Test with Expected Behaviors

#### multiple-axes example

**Documentation claims:**

-   Shows cattle holdings (bar series) and beef exports (line series) on different scales
-   Primary axis (left) displays cattle numbers in millions with 'M' suffix
-   Secondary axis (right) displays exports in thousands with 'k' suffix
-   Title enabled explicitly on secondary axis with `enabled: true`

**Expected behaviors to validate:**

-   Two y-axes rendered on opposite sides of chart
-   Correct scale separation - cattle numbers on left, export tonnes on right
-   Label formatters apply correct suffixes ('M' for millions, 'k' for thousands)
-   Bar series renders against left axis scale
-   Line series renders against right axis scale
-   Both axis titles are visible
-   Legend shows all three series with square markers

**Interactive features to test:**

-   Hovering over bar series shows tooltips with cattle numbers
-   Hovering over line series shows tooltips with export values
-   Legend item clicks toggle series visibility
-   Chart maintains correct axis associations when series are toggled

### User Interactions to Validate

-   Tooltip display on hover for both primary and secondary axis series
-   Legend interaction (click to toggle series)
-   Responsive behavior when resizing
-   Keyboard navigation through chart elements

### Visual States to Screenshot and Analyze

-   Default chart rendering with all series visible
-   Hover states over bar series (primary axis)
-   Hover states over line series (secondary axis)
-   Chart with one series hidden via legend
-   Mobile viewport rendering
-   Focus states during keyboard navigation

## Known Exceptions

No documented exceptions file exists for this page.

## Execution Plan

### Priority 1: Technical Accuracy Checks

1. Verify `keys` property exists in TypeScript definitions
2. Confirm implementation of axis `keys` matching logic
3. Validate that series correctly associate with axes based on key matching
4. Check default behavior when `keys` array is empty

### Priority 2: Example Validation (Delegate to example-tester)

1. Test multiple-axes example with example-tester agent:
    - Verify chart renders without console errors
    - Confirm two y-axes render on opposite sides
    - Validate data binding for all three series
    - Check label formatting applies correctly
    - Test interactive behaviors (tooltips, legend clicks)

### Priority 3: Visual and Interaction Testing

1. Take comprehensive screenshots:
    - Default state showing full chart
    - Hover states for each series type
    - Legend interaction states
    - Mobile responsive view
2. Perform fuzz testing:
    - Rapid hovering across chart elements
    - Click testing on axes, labels, and empty areas
    - Keyboard navigation through focusable elements
    - Window resize during interactions

### Priority 4: Documentation Completeness

1. Verify all axis configuration options are covered
2. Check for missing documentation on:
    - Multiple axes beyond two
    - Top/bottom secondary axes
    - Axis key matching edge cases
3. Validate code snippets match actual implementation

## Success Criteria

-   All TypeScript interfaces contain documented properties
-   Example runs without errors and matches documented behavior
-   Visual rendering matches documentation descriptions
-   Interactive features work as described
-   No undocumented behaviors discovered during testing

## Estimated Complexity

-   **High complexity** due to:
    -   Critical feature for data visualization
    -   Complex axis-series association logic
    -   Multiple interactive elements
    -   Important for many use cases

## example-tester Delegation Plan

### Example: multiple-axes

**Task**: Validate the multiple-axes example for technical correctness and documentation alignment

**Expected behaviors from documentation:**

1. Chart displays cattle holdings data as bar series on primary (left) y-axis
2. Chart displays beef exports as line series on secondary (right) y-axis
3. Primary axis uses keys `['male', 'female']` to associate with bar series
4. Secondary axis uses keys `['exportedTonnes']` to associate with line series
5. Primary axis formats labels with 'M' suffix (millions)
6. Secondary axis formats labels with 'k' suffix (thousands)
7. Both axes have titles enabled and visible
8. Legend shows all series with square markers

**Specific validations needed:**

-   Verify AG Charts API usage follows best practices
-   Check for TypeScript type safety
-   Validate data binding correctness
-   Test console for errors or warnings
-   Confirm chart rendering matches expected visual output
-   Verify axis-series associations work correctly
