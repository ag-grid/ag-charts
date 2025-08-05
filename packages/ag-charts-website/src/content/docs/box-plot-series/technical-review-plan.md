# Box Plot Series Documentation Technical Review Plan

## Page Analysis Summary

The Box Plot Series documentation covers:

-   **Chart Types**: Box Plot (Box-and-Whisker Plot) - Enterprise feature
-   **Key Features**:
    -   Simple vertical box plots
    -   Horizontal box plots
    -   Customization of whiskers and caps
    -   Integration with scatter series for outliers
-   **Configuration Options**:
    -   Data mapping keys (xKey, minKey, q1Key, medianKey, q3Key, maxKey)
    -   Orientation control (direction property)
    -   Visual customization (whisker and cap styling)
-   **Examples Referenced**:
    1. `simple-box-plot` - Basic vertical box plot
    2. `horizontal-box-plot` - Horizontal orientation
    3. `box-plot-customisations` - Whisker and cap styling
    4. `box-plot-outliers` - Combined with scatter series

## Validation Targets

### TypeScript Interface Verification

-   **Primary Interface**: `AgBoxPlotSeriesOptions` in `/packages/ag-charts-types/src/series/cartesian/boxPlotOptions.ts`
-   **Key Properties to Validate**:
    -   Required keys: `xKey`, `minKey`, `q1Key`, `medianKey`, `q3Key`, `maxKey`
    -   Optional names: `xName`, `yName`, `minName`, `q1Name`, `medianName`, `q3Name`, `maxName`
    -   Direction property: `'horizontal' | 'vertical'`
    -   Style properties: `fill`, `stroke`, `strokeWidth`, `cornerRadius`
    -   Nested objects: `whisker` (AgBoxPlotWhiskerOptions), `cap` (AgBoxPlotCapOptions)
    -   Enterprise-only feature flag

### Implementation Files to Check

-   **Properties**: `/packages/ag-charts-enterprise/src/series/box-plot/boxPlotSeriesProperties.ts`
    -   Default values:
        -   `lengthRatio: 0.5` for cap
        -   `fill: '#c16068'`
        -   `stroke: '#333'`
        -   `strokeWidth: 1`
        -   `cornerRadius: 0`
        -   Default vertical orientation
-   **Main Implementation**: `/packages/ag-charts-enterprise/src/series/box-plot/boxPlotSeries.ts`

### Examples to Test with Expected Behaviors

#### 1. Simple Box Plot (`simple-box-plot`)

**Documentation Claims**:

-   Uses `box-plot` series type
-   Requires data keys for min, q1, median, q3, max values
-   Default orientation is vertical
-   Shows tooltip with yName ("Salary Range")

**Expected Behaviors for example-tester**:

-   Box plot renders vertically with proper quartile boxes
-   Median line visible within each box
-   Whiskers extend from min to max
-   Caps at whisker ends (default 50% of box width)
-   Tooltip shows "Salary Range" as title
-   Categories on x-axis (roles)
-   Numeric values on y-axis

#### 2. Horizontal Box Plot (`horizontal-box-plot`)

**Documentation Claims**:

-   Setting `direction: 'horizontal'` creates horizontal box plots
-   xKey still specifies categories regardless of orientation

**Expected Behaviors for example-tester**:

-   Box plots render horizontally
-   Categories still defined by xKey (departments)
-   Numeric scale on x-axis, categories on y-axis
-   Same visual structure but rotated 90 degrees
-   Tooltips work correctly in horizontal mode

#### 3. Box Plot Customisations (`box-plot-customisations`)

**Documentation Claims**:

-   Whisker styles can be customized with stroke, strokeWidth, lineDash
-   Cap lengthRatio can be adjusted (example shows 0.8 = 80% of bar width)
-   Whiskers inherit series styles by default

**Expected Behaviors for example-tester**:

-   Whiskers have custom styling: '#098a89' color, 3px width, [2,1] dash pattern
-   Caps are 80% of box width (vs default 50%)
-   Rest of chart maintains standard appearance
-   Custom styles apply to all box plots in series

#### 4. Box Plot With Outliers (`box-plot-outliers`)

**Documentation Claims**:

-   Box plots can be combined with scatter series for outliers
-   Uses separate data arrays for box plot and outlier data
-   Creates comprehensive data visualization

**Expected Behaviors for example-tester**:

-   Two series render together: box-plot and scatter
-   Scatter points represent outliers outside box plot ranges
-   Both series align on same axes
-   Tooltips work for both series types
-   Visual layering is correct (outliers visible)

### User Interactions to Validate

1. **Hover Interactions**:

    - Hover over box bodies - expect tooltips with all quartile values
    - Hover over whiskers and caps - verify tooltip triggering
    - Hover over median lines - check tooltip content
    - Test tooltip positioning near chart edges

2. **Visual States**:

    - Default rendering state
    - Hover highlighting effects
    - Legend item toggling (if legend present)
    - Focus states for accessibility

3. **Responsive Behavior**:
    - Chart resizing with window
    - Mobile viewport rendering
    - Touch interactions on mobile

## Known Exceptions

No technical review exceptions file found for this page.

## Execution Plan

### Priority 1: API Contract Validation

1. Verify all documented properties exist in `AgBoxPlotSeriesOptions` interface
2. Check that `type: 'box-plot'` is required
3. Validate that all key properties (minKey, q1Key, etc.) are properly typed
4. Confirm enterprise-only status

### Priority 2: Default Values Verification

1. Verify default vertical orientation
2. Check default cap lengthRatio (0.5)
3. Validate default visual styling values
4. Confirm whisker style inheritance behavior

### Priority 3: Example Testing via example-tester Agent

1. **Simple Box Plot**:

    - Delegate validation to example-tester with expectations for vertical rendering, proper data binding, tooltip content
    - Request screenshot of default state and hover state

2. **Horizontal Box Plot**:

    - Delegate validation with focus on orientation change, axis swapping, maintained functionality
    - Request screenshots showing horizontal layout

3. **Box Plot Customisations**:

    - Delegate with specific checks for whisker styling (#098a89, 3px, dashed) and cap ratio (0.8)
    - Request close-up screenshots of whiskers and caps

4. **Box Plot With Outliers**:
    - Delegate with validation of multi-series rendering, proper layering, independent tooltips
    - Request screenshots showing outliers overlaid on box plots

### Priority 4: Interactive Testing

1. Systematic hover testing over all chart elements
2. Keyboard navigation verification
3. Touch gesture testing on mobile viewports
4. Edge case interactions (rapid hovering, window resizing during hover)

### Success Criteria

-   All documented APIs match TypeScript definitions
-   Default values in documentation match implementation
-   All examples render without console errors
-   Interactive features work as documented
-   Visual appearance matches description
-   No accessibility issues found
