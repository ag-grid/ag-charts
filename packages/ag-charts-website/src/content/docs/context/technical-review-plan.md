# Technical Review Plan: Context API Documentation

## Page Analysis Summary

### Features Covered

-   Context Object configuration at root, series, and axis levels
-   Context Object inheritance/fallback mechanism
-   Context Object usage in callbacks (formatters, stylers, tooltip renderers, context menu actions)
-   Practical example demonstrating currency conversion using context

### Key APIs and Configuration Options Documented

-   `context` property at root level (AgBaseThemeableChartOptions)
-   `series[].context` property (AgBaseSeriesOptions)
-   `axes[].context` property (AgBaseAxisOptions)
-   Context parameter in callback functions:
    -   Label formatters
    -   Tooltip renderers
    -   Context menu actions
    -   Item stylers

### Examples Referenced

-   **currency-converter**: Demonstrates context usage for dynamic currency conversion
    -   Shows Y-axis label formatting with context
    -   Shows tooltip rendering with context
    -   Shows context menu actions with context
    -   Includes interactive dropdown to update context state

### Interactive Features Described

-   Dynamic context updates via dropdown selection
-   Context menu custom actions
-   Tooltip customization using context
-   Axis label formatting using context

## Validation Targets

### TypeScript Interfaces to Verify

1. **AgBaseThemeableChartOptions<TContext>**

    - Location: `packages/ag-charts-types/src/chart/chartOptions.ts`
    - Verify: `context?: TContext` property exists

2. **AgBaseSeriesOptions<TDatum, TContext>**

    - Location: `packages/ag-charts-types/src/series/seriesOptions.ts`
    - Verify: `context?: TContext` property exists

3. **AgBaseAxisOptions<LabelType, TContext>**

    - Location: `packages/ag-charts-types/src/chart/axisOptions.ts`
    - Verify: `context?: TContext` property exists

4. **Callback Parameter Interfaces**
    - AgAxisLabelFormatterParams: Verify `context?: TContext`
    - AgSeriesTooltipRendererParams: Verify `context?: TContext`
    - AgContextMenuActionParams: Verify `context?: TContext`

### Implementation Files to Check

1. **Context Property Implementation**

    - Check how context is passed through the chart hierarchy
    - Verify fallback mechanism (series/axis context falls back to root context)

2. **Callback Context Passing**
    - Verify context is properly passed to formatter callbacks
    - Verify context is properly passed to tooltip renderer callbacks
    - Verify context is properly passed to context menu action callbacks

### Examples to Test

#### currency-converter Example

**What documentation claims:**

-   Dropdown changes update the context object state
-   Y-axis labels convert USD values to preferred user currency
-   Tooltips render both USD and user currency values
-   Context menu actions log converted stock prices to console
-   Context object is accessed via `context` parameter in callbacks

**Expected behaviors to validate:**

1. Initial load shows EUR as default currency (line 9: `makeCurrencyConverter('EUR')`)
2. Y-axis labels display converted currency values
3. Tooltips show both USD and converted currency
4. Dropdown selection updates chart immediately
5. Context menu items log appropriate currency conversions
6. All callbacks receive the context object properly

**Specific features to demonstrate:**

-   Context inheritance (root context used by axis and series)
-   Dynamic context updates (via `chart.update(options)`)
-   Context usage in multiple callback types
-   Type safety with generic context type

### User Interactions to Validate

1. **Dropdown Currency Selection**

    - Test changing currency updates all formatted values
    - Verify smooth transition without errors

2. **Tooltip Hover**

    - Hover over candlestick data points
    - Verify dual currency display in tooltips

3. **Context Menu Actions**

    - Right-click on chart data
    - Test each currency log action
    - Verify console output shows correct conversions

4. **Visual States to Screenshot**
    - Default state with EUR selected
    - Tooltip showing dual currency
    - Context menu open showing custom actions
    - Different currency selections (USD, GBP, JPY, INR)

## Known Exceptions

No existing `technical-review-exceptions.md` file found for this page.

## Execution Plan

### Priority 1: API Contract Validation

1. Verify `context` property exists in all three locations (root, series, axis)
2. Verify callback parameter interfaces include context
3. Check TypeScript generics allow custom context types

### Priority 2: Example Testing (Delegate to example-tester)

1. **Test currency-converter example**
    - Provide expected behaviors list
    - Request validation of:
        - Chart renders without errors
        - Context object properly typed
        - All callbacks receive context
        - Currency conversion logic works
        - Interactive features function correctly

### Priority 3: Documentation Accuracy

1. Verify inheritance behavior matches documentation
2. Confirm all documented callback types support context
3. Check code snippets are syntactically correct

### Priority 4: Visual and Interaction Testing

1. Screenshot all interactive states
2. Test edge cases (rapid dropdown changes, etc.)
3. Verify responsive behavior
4. Test keyboard navigation if applicable

### Success Criteria

-   [ ] All TypeScript interfaces contain documented context properties
-   [ ] Example demonstrates all documented features
-   [ ] Context inheritance works as described
-   [ ] All callbacks receive context parameter
-   [ ] Interactive features update context properly
-   [ ] No console errors during interactions
-   [ ] Visual elements render correctly with context data

### Estimated Complexity

-   **Low complexity**: Well-focused feature with single example
-   **Time estimate**: 30-45 minutes for complete review
-   **Risk areas**: Context inheritance mechanism, type safety validation
