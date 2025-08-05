# Technical Review Plan - Axes Types

## Page Analysis Summary

This documentation page covers different axis types available in AG Charts:

### Chart Types/Features Covered

-   **Category Axis**: Discrete categories or groups
-   **Grouped Category Axis**: Hierarchical/nested categories
-   **Number Axis**: Continuous numerical values
-   **Log Axis**: Logarithmic scale for wide value ranges
-   **Time Axis**: Three methods for time display (Unit, Ordinal, Continuous)

### Key APIs and Configuration Options Documented

-   Basic axis configuration: `type`, `position`
-   Category axis: Default x-axis behavior
-   Grouped category axis: `xKey` array handling, `depthOptions` for styling hierarchy levels
-   Number axis: Default y-axis behavior, automatic range determination
-   Log axis: `base` property, `tick.minSpacing`, domain restrictions
-   Links to full API references for each axis type

### Examples Referenced

1. **grouped-category**: Demonstrates hierarchical location data (Europe/UK/London structure)
2. **number-vs-log**: Compares linear vs logarithmic scales
3. **time-vs-unit-time-vs-ordinal-time**: Shows three different time axis approaches

### Interactive Features Described

-   Even spacing for category axes
-   Axis labels, grid lines, and ticks for each category/level
-   Automatic range rounding and interval segmentation for number axes
-   Log scale percentage-based spacing
-   Hierarchical visual representation for grouped categories

## Validation Targets

### Specific TypeScript Interfaces to Verify

-   `AgCategoryAxisOptions`
-   `AgGroupedCategoryAxisOptions`
-   `AgNumberAxisOptions`
-   `AgLogAxisOptions`
-   `AgUnitTimeAxisOptions`
-   `AgOrdinalTimeAxisOptions`
-   `AgTimeAxisOptions`

### Implementation Files to Check

-   Category axis implementations in `packages/ag-charts-community/src/chart/axis/`
-   Grouped category axis specific logic
-   Number and log axis scale calculations
-   Time axis variants (unit, ordinal, continuous)
-   Default axis type selection logic (category for x, number for y)

### Examples to Test with Expected Behaviors

#### grouped-category Example

**Documentation Claims:**

-   Shows Olympic medal counts by hierarchical location (Europe/UK/London structure)
-   Data must include arrays with regions, countries, and cities
-   Renders axis labels, grid lines, and ticks for each hierarchy level
-   `depthOptions` allows styling each level differently
-   Level 0 is nearest to axis, with ascending depth numbers

**Expected Behaviors for example-tester:**

-   Chart should display nested categories on x-axis
-   Visual hierarchy should be clear with proper alignment
-   Different styling should be visible for different depth levels if configured
-   Grid lines and ticks should align with hierarchical structure
-   Proper spacing between grouped categories

#### number-vs-log Example

**Documentation Claims:**

-   Demonstrates difference between linear and logarithmic scales
-   Log axis shows same percentage changes as same pixel distances
-   Default behavior: 5+ orders of magnitude = 5 ticks, otherwise 10 ticks per order
-   `minSpacing` configuration affects tick density
-   `base` property allows changing from base 10 to other bases
-   Log axis domain must be strictly positive or strictly negative

**Expected Behaviors for example-tester:**

-   Side-by-side comparison of number vs log axis
-   Log axis should show logarithmic spacing
-   Tick configuration should be adjustable
-   Base changes should affect scale calculation
-   Should handle domain clipping for non-conforming ranges

#### time-vs-unit-time-vs-ordinal-time Example

**Documentation Claims:**

-   Shows three different time axis types
-   Unit Time: Each unit has dedicated band
-   Ordinal Time: Only provided values shown, missing values omitted
-   Continuous Time: Data on continuous scale

**Expected Behaviors for example-tester:**

-   Three distinct time axis representations
-   Unit time should show regular intervals
-   Ordinal time should skip missing values
-   Continuous time should show proper time scale
-   Visual differences should be clear between approaches

### User Interactions to Validate

-   Hover over different axis labels and ticks
-   Hover over data points near axes
-   Check tooltip behavior near axis boundaries
-   Verify axis label readability at different zoom levels
-   Test responsive behavior when resizing

### Visual States to Screenshot and Analyze

-   Default rendering of each example
-   Hover states over axis elements
-   Different viewport sizes (desktop, tablet, mobile)
-   Zoomed states to check label/tick behavior
-   Edge cases (very small/large values for log axis)

### Interactive Features Requiring Visual Comparison

-   Axis label and tick alignment for grouped categories
-   Spacing consistency for different axis types
-   Grid line alignment with data points
-   Visual hierarchy in grouped category axis
-   Scale accuracy for log axis transformations

### Chart Elements That Should Be Interactive

-   Axis labels (potential tooltips for truncated text)
-   Data points/bars/columns near axes
-   Legend items if present
-   Chart canvas for pan/zoom if enabled

### Expected Tooltip Content and Highlighting

-   Data point values when hovering
-   Category names for grouped categories
-   Proper number formatting for different scales
-   Time formatting for time axes

## Known Exceptions

No documented exceptions file exists for this page.

## Execution Plan

### Priority 1: Core Axis Type Validation

1. **Verify TypeScript interfaces exist and match documentation**

    - Check all 7 axis type interfaces
    - Verify property types and optionality
    - Success: All interfaces exist with documented properties

2. **Test default axis behavior**
    - Verify category axis as default x-axis
    - Verify number axis as default y-axis
    - Success: Defaults work without explicit configuration

### Priority 2: Example Functionality Testing

1. **Delegate grouped-category example to example-tester**

    - Provide hierarchical data structure expectations
    - Verify visual hierarchy rendering
    - Check depthOptions styling
    - Success: Hierarchical categories render with proper styling

2. **Delegate number-vs-log example to example-tester**

    - Compare linear vs log scaling
    - Test configuration options
    - Verify domain handling
    - Success: Both axis types show correct scaling

3. **Delegate time axis comparison to example-tester**
    - Verify three distinct time representations
    - Check missing value handling
    - Success: Each time axis type behaves as documented

### Priority 3: Visual and Interaction Testing

1. **Screenshot all examples in multiple states**

    - Default rendering
    - Hover interactions
    - Different viewports
    - Success: Visual evidence of all features

2. **Test interactive behaviors**
    - Systematic hovering over axis elements
    - Tooltip positioning and content
    - Responsive behavior
    - Success: All interactions work smoothly

### Priority 4: Configuration Deep Dive

1. **Verify advanced configurations**

    - Log axis base changes
    - Grouped category depthOptions
    - Tick spacing adjustments
    - Success: All documented configs work

2. **Test edge cases**
    - Log axis with invalid domains
    - Very deep hierarchies for grouped categories
    - Extreme value ranges
    - Success: Graceful handling of edge cases

### Estimated Complexity

-   **High complexity**: Grouped category axis (hierarchical rendering)
-   **Medium complexity**: Log axis (mathematical transformations)
-   **Medium complexity**: Time axis variants (different behaviors)
-   **Low complexity**: Basic category and number axes

Total estimated time: 2-3 hours for thorough review
