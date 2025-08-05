# Technical Review Plan: Axis Intervals Documentation

## Page Analysis Summary

The `axes-intervals` documentation page covers the configuration of axis intervals which determine which axis labels, grid lines, and ticks are shown along chart axes. The page documents three main interval strategies:

### Key Features Covered:

1. **Step Intervals** - Fixed intervals with regular spacing

    - Number axes: numeric step values
    - Log axes: exponent increments
    - Time axes: AgTimeInterval or AgTimeIntervalUnit

2. **Values Intervals** - Irregular intervals at specific values

    - Support for number, Date, or String arrays

3. **Min/Max Spacing** - Responsive intervals based on pixel gaps

    - minSpacing: minimum pixel gap between items
    - maxSpacing: maximum pixel gap between items
    - Category axes don't support maxSpacing

4. **Placement Options** - Position of ticks/grid lines
    - 'on': positioned on each category (default)
    - 'between': positioned between categories
    - Applies to Category, Unit Time, and Ordinal Time axes

### Referenced Examples:

1. `axis-interval` - Demonstrates number axis interval with step configuration
2. `time-axis-label-format` - Shows time axis interval with AgTimeInterval/AgTimeIntervalUnit
3. `axis-values` - Demonstrates irregular intervals using values array
4. `axis-min-max-spacing` - Shows responsive intervals with min/max spacing, includes resize handle
5. `axis-placement` - Demonstrates placement options with alternating band shading

## Validation Targets

### TypeScript Interfaces to Verify:

1. `AgAxisBaseIntervalOptions` (packages/ag-charts-types/src/chart/axisOptions.ts)

    - `values?: any[]`
    - `minSpacing?: PixelSize`

2. `AgAxisContinuousIntervalOptions<T>` (packages/ag-charts-types/src/chart/axisOptions.ts)

    - `step?: T`
    - `maxSpacing?: PixelSize`

3. `AgAxisCategoryIntervalOptions` (packages/ag-charts-types/src/chart/cartesianOptions.ts)

    - `placement?: AgAxisIntervalPlacement` ('on' | 'between')

4. `AgAxisDiscreteTimeIntervalOptions` (packages/ag-charts-types/src/chart/cartesianOptions.ts)

    - `placement?: AgAxisIntervalPlacement`

5. `AgTimeInterval` and `AgTimeIntervalUnit` (packages/ag-charts-types/src/chart/axisOptions.ts)

### Implementation Files to Check:

1. Axis interval logic in core packages
2. Default interval behavior implementation
3. Placement logic for category/time axes
4. Min/max spacing calculation logic
5. Log axis step calculation (exponent increments)

### Examples to Test:

#### 1. axis-interval (Number Axis Interval)

**Documentation Claims:**

-   Shows number axis with `step: 5`
-   Should display values at 0, 5, 10, etc.
-   Tests default interval override behavior

**Expected Behaviors:**

-   Y-axis should show intervals at multiples of 5
-   Grid lines and ticks should align with these intervals
-   Labels should show at 0, 5, 10, 15, etc.

#### 2. time-axis-label-format (Time Axis Interval)

**Documentation Claims:**

-   Demonstrates time axis intervals using AgTimeInterval or AgTimeIntervalUnit
-   Should show proper time-based intervals

**Expected Behaviors:**

-   X-axis should show time-based intervals
-   Intervals should respect the configured time unit
-   Labels should format according to time intervals

#### 3. axis-values (Values)

**Documentation Claims:**

-   Shows irregular intervals using `values: [50, 88, 100]`
-   Should display only specified values on axis

**Expected Behaviors:**

-   Axis should show only the values 50, 88, and 100
-   No other tick marks or labels should appear
-   Grid lines should align with these specific values

#### 4. axis-min-max-spacing (Min/Max Spacing)

**Documentation Claims:**

-   Has button to apply min/max spacing
-   Has resize handle in bottom right
-   minSpacing: 15, maxSpacing: 25
-   Intervals should adjust with chart size
-   Notes about spacing constraints when values are close

**Expected Behaviors:**

-   Button should toggle between default and min/max spacing
-   Resize handle should allow chart resizing
-   Intervals should dynamically adjust when resizing
-   Spacing between intervals should stay within 15-25 pixels
-   Should demonstrate non-standard intervals when constraints are too tight

#### 5. axis-placement (Placement)

**Documentation Claims:**

-   Uses alternating band shading
-   Shows difference between 'on' and 'between' placement
-   'on': ticks/grid lines positioned above label on each category
-   'between': ticks/grid lines positioned between category labels

**Expected Behaviors:**

-   Should have alternating band shading visible
-   Toggle or buttons to switch between 'on' and 'between'
-   Visual difference in tick/grid line positioning
-   Labels should remain in same position, only ticks/grid lines move

### User Interactions to Validate:

1. **axis-min-max-spacing**:
    - Click button to apply min/max spacing
    - Drag resize handle to test responsive behavior
    - Verify interval counts change appropriately
2. **axis-placement**:
    - Interact with controls to toggle placement
    - Verify visual feedback for placement changes
3. **All examples**:
    - Hover over chart elements for tooltips
    - Check console for any errors
    - Verify responsive behavior on window resize

### Visual States to Screenshot:

1. Default state for each example
2. Hover states showing tooltips
3. Before/after states for interactive controls
4. Different viewport sizes (especially for min/max spacing)
5. Placement comparison (on vs between)

## Known Exceptions

No existing `technical-review-exceptions.md` file found for this page.

## Execution Plan

### Priority 1 - Critical Accuracy Checks:

1. Verify TypeScript interface definitions match documentation
2. Test step intervals on number axes (axis-interval example)
3. Test values array functionality (axis-values example)
4. Validate min/max spacing behavior with resizing (axis-min-max-spacing)

### Priority 2 - Interactive Feature Validation:

1. Test placement options with visual comparison (axis-placement)
2. Verify resize handle functionality in min/max spacing example
3. Test button interactions for applying spacing configurations
4. Validate time axis intervals (time-axis-label-format)

### Priority 3 - Edge Cases and Visual Quality:

1. Test log axis step behavior if documented
2. Verify category axis maxSpacing limitation
3. Check default interval override behavior
4. Test tooltip content and positioning
5. Validate responsive behavior across viewport sizes

### Delegation Plan for example-tester Agent:

For each example, provide the agent with:

1. **axis-interval**:

    - Verify `interval: { step: 5 }` configuration
    - Check Y-axis shows multiples of 5
    - Validate grid lines align with intervals

2. **time-axis-label-format**:

    - Verify time interval configuration
    - Check proper time unit handling
    - Validate label formatting

3. **axis-values**:

    - Verify `interval: { values: [50, 88, 100] }` configuration
    - Check only specified values appear
    - Validate no extra tick marks

4. **axis-min-max-spacing**:

    - Verify minSpacing: 15, maxSpacing: 25 configuration
    - Check resize functionality
    - Validate dynamic interval adjustment

5. **axis-placement**:
    - Verify placement configuration options
    - Check alternating band shading
    - Validate tick/grid line positioning changes

## Success Criteria

1. All documented API properties exist in TypeScript definitions
2. Examples demonstrate exactly what documentation describes
3. Interactive features work as documented
4. No console errors or warnings
5. Visual rendering matches documentation descriptions
6. Responsive behavior functions correctly
7. All user interactions produce expected results
