# Technical Review Plan: Combination Charts

## Page Analysis Summary

### Chart Types/Features Covered

-   Combination charts using multiple series types in a single chart
-   Supported series types: bar, line, area, scatter, and bubble
-   Secondary axis functionality for different scales
-   Series rendering order based on array position
-   Dynamic series switching between combinations

### Key APIs and Configuration Options Documented

-   Series `type` property (must be specified explicitly on each series)
-   Series array configuration with mixed types
-   Series keys: `xKey`, `yKey`, `yName`
-   Grouped bar configuration
-   Secondary axis configuration with `keys` property
-   Series update mechanism using `chart.update()`

### Examples Referenced

-   **combination**: Main example demonstrating:
    -   Bar & Line combination
    -   Area & Bar combination
    -   Secondary axis usage
    -   Dynamic switching between combinations
    -   Multiple data series (men, women, portions)

### Interactive Features Described

-   Button controls to switch between chart types
-   Secondary axis with different scale
-   Series rendering order importance

## Validation Targets

### TypeScript Interfaces to Verify

1. `AgCartesianSeriesOptions` - Base type for combination series
2. `AgBarSeriesOptions` - Bar series configuration
3. `AgLineSeriesOptions` - Line series configuration
4. `AgAreaSeriesOptions` - Area series configuration (implied in example)
5. `AgScatterSeriesOptions` - Scatter series configuration (mentioned but not demonstrated)
6. `AgBubbleSeriesOptions` - Bubble series configuration (mentioned but not demonstrated)
7. `AgCartesianAxisOptions` - Axis configuration with `keys` property
8. `AgCartesianChartOptions` - Overall chart configuration

### Implementation Files to Check

1. Bar series implementation in `packages/ag-charts-community/src/chart/series/cartesian/barSeries.ts`
2. Line series implementation in `packages/ag-charts-community/src/chart/series/cartesian/lineSeries.ts`
3. Area series implementation in `packages/ag-charts-community/src/chart/series/cartesian/areaSeries.ts`
4. Scatter series implementation in `packages/ag-charts-community/src/chart/series/cartesian/scatterSeries.ts`
5. Bubble series implementation in `packages/ag-charts-community/src/chart/series/cartesian/bubbleSeries.ts`
6. Axis keys implementation for secondary axis functionality
7. Series ordering/rendering logic

### Examples to Test with Expected Behaviors

#### combination example

**Documentation claims:**

-   Shows two combination types: Bar & Line, Area & Bar
-   Series are rendered according to order in the series array
-   Area and line series are plotted on a secondary axis with different scale
-   Can switch between combinations using buttons

**Expected behaviors to validate:**

1. **Initial state**: Should display Bar & Line combination

    - Two bar series (women and men) on primary Y axis
    - One line series (portions) on secondary Y axis
    - Primary Y axis on left with "Adults Who Eat 5 A Day (%)" title
    - Secondary Y axis on right with "Portions Consumed (Per Day)" title

2. **Bar & Line combination**:

    - Bar series should be grouped together
    - Line series should use secondary axis
    - Tooltips should show correct values for each series
    - Legend should show all three series

3. **Area & Bar combination**:

    - Area series should render first (behind bars)
    - Bar series should render on top
    - Area series should use secondary axis
    - Visual stacking order should be correct

4. **Interactive features**:

    - Clicking "Area & Bar" button should switch to area/bar combination
    - Clicking "Bar & Line" button should switch back
    - Chart should update smoothly without errors
    - Axes should maintain correct scales and associations

5. **Secondary axis behavior**:
    - Secondary axis should have different scale than primary
    - Series should correctly associate with their designated axis
    - Axis titles should be displayed correctly

### User Interactions to Validate

1. **Button interactions**:

    - Click "Area & Bar" button
    - Click "Bar & Line" button
    - Rapid switching between buttons
    - Multiple clicks on same button

2. **Chart element interactions**:

    - Hover over bar series elements - expect tooltips
    - Hover over line series points/line - expect tooltips
    - Hover over area series - expect tooltips
    - Hover over legend items - expect series highlighting
    - Click on legend items - expect series toggle

3. **Axis interactions**:

    - Hover over axis labels
    - Hover over axis titles
    - Verify no unexpected interactions

4. **Edge cases**:
    - Resize window during different combination states
    - Test mobile viewport behavior
    - Test keyboard navigation
    - Test rapid mouse movements across chart

### Visual States to Screenshot and Analyze

1. **Default state** - Bar & Line combination on load
2. **Area & Bar state** - After clicking button
3. **Hover states**:
    - Bar series tooltip
    - Line series tooltip
    - Area series tooltip
    - Legend hover highlighting
4. **Mobile viewport** - Responsive behavior
5. **Focus states** - Keyboard navigation indicators
6. **Transition states** - During combination switching

### Chart Elements That Should Be Interactive

Based on documentation and standard AG Charts behavior:

1. Bar series elements (hover for tooltips)
2. Line series points and line segments (hover for tooltips)
3. Area series filled region (hover for tooltips)
4. Legend items (hover for highlighting, click for toggle)
5. Control buttons (click for combination switching)

### Expected Tooltip Content and Highlighting Behaviors

1. Tooltips should show:
    - Series name (yName)
    - X value (year)
    - Y value (percentage or portions)
2. Highlighting should:
    - Emphasize hovered series
    - Dim other series when legend item is hovered
    - Show visual feedback on hover

## Known Exceptions

No technical review exceptions file exists for this page.

## Execution Plan

### Priority 1: Core Functionality Validation

1. **Verify supported series types** (High complexity)

    - Check TypeScript definitions for all mentioned series types
    - Verify bar, line, area, scatter, bubble are valid options
    - Check if `type` property is required on each series

2. **Test combination example core behavior** (High complexity)

    - Delegate to example-tester agent with detailed expectations
    - Verify both combinations render correctly
    - Check series rendering order
    - Validate secondary axis functionality

3. **Validate series configuration requirements** (Medium complexity)
    - Verify `type` must be explicit on each series
    - Check series array structure
    - Validate mixing different series types

### Priority 2: Interactive Features Testing

4. **Test dynamic combination switching** (Medium complexity)

    - Click buttons and verify transitions
    - Check for console errors during switches
    - Validate chart update mechanism

5. **Test chart element interactions** (High complexity)

    - Systematic hover testing over all elements
    - Screenshot tooltips and highlighting
    - Test legend interactions

6. **Validate secondary axis behavior** (High complexity)
    - Verify axis association with series
    - Check scale differences
    - Validate axis positioning and titles

### Priority 3: Documentation Accuracy

7. **Cross-reference API documentation** (Medium complexity)

    - Verify all properties shown in code snippets
    - Check for any missing required properties
    - Validate property types

8. **Check for missing series types in example** (Low complexity)
    - Note that scatter and bubble are mentioned but not demonstrated
    - Consider if example should include all types

### Priority 4: Edge Cases and Visual Testing

9. **Test responsive behavior** (Medium complexity)

    - Multiple viewport sizes
    - Window resizing during interactions
    - Mobile touch simulation

10. **Capture comprehensive screenshots** (Medium complexity)
    - All states and interactions
    - Before/after comparisons
    - Error states if any

### Success Criteria

-   All mentioned series types are valid and can be combined
-   Example demonstrates the documented features correctly
-   Secondary axis works as described
-   No console errors during normal usage
-   Interactive features work smoothly
-   Documentation accurately reflects implementation

### Estimated Time

-   Phase 2 execution: 45-60 minutes due to extensive interaction testing and multiple chart states
