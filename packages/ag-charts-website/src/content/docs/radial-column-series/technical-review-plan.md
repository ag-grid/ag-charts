# Technical Review Plan: Radial Column Series

## Page Analysis Summary

### Chart Types/Features Covered

-   **Radial Column Series** (also called Circular Column) - Enterprise feature
-   Simple radial column charts with multiple data series
-   Stacked radial column charts for cumulative totals
-   Customization options:
    -   Inner radius control (donut effect)
    -   Category padding (inter-group and intra-group spacing)
    -   Axis label orientation (fixed, parallel, perpendicular)
    -   Radius axis position and label rotation

### Key APIs and Configuration Options Documented

1. **Series Configuration**:

    - `type: 'radial-column'`
    - `angleKey`: Category key for angle axis
    - `radiusKey`: Numerical data key for radius axis
    - `radiusName`: Series label
    - `stacked`: Boolean for stacking behavior
    - `stackGroup`: ID for grouping stacked items (mentioned in type definition, not in docs)

2. **Axis Configuration**:
    - **Angle Category Axis**: `type: 'angle-category'`
        - `paddingInner`: Gap between column groups (0-1)
        - `groupPaddingInner`: Spacing within groups (0-1)
        - `label.orientation`: 'fixed' | 'parallel' | 'perpendicular'
    - **Radius Number Axis**: `type: 'radius-number'`
        - `innerRadiusRatio`: Inner radius proportion (0-1)
        - `positionAngle`: Axis line position
        - `label.rotation`: Label rotation angle

### Examples Referenced and Their Purpose

1. **simple-radial-column**: Basic multi-series radial column chart
2. **stacked-radial-column**: Demonstrates stacking functionality
3. **inner-radius**: Shows donut effect with innerRadiusRatio
4. **category-padding**: Demonstrates paddingInner and groupPaddingInner
5. **axis-label-orientation**: Shows different label orientations
6. **radius-axis-position**: Demonstrates axis positioning and label rotation

### Interactive Features Described

-   Hover interactions (implied by chart type, not explicitly documented)
-   Tooltips (standard chart feature, not explicitly mentioned)
-   Legend interactions (implied by multi-series examples)
-   Visual stacking of columns for cumulative analysis

## Validation Targets

### Specific TypeScript Interfaces to Verify

1. **AgRadialColumnSeriesOptions** (`packages/ag-charts-types/src/series/polar/radialColumnOptions.ts`)

    - Verify all documented properties exist
    - Check for undocumented properties like `columnWidthRatio`, `maxColumnWidthRatio`, `normalizedTo`, `grouped`
    - Confirm `stacked` and `stackGroup` behavior

2. **AgAngleCategoryAxisOptions** (`packages/ag-charts-types/src/chart/polarAxisOptions.ts`)

    - Verify `paddingInner` and `groupPaddingInner` properties
    - Confirm `label.orientation` enum values

3. **AgRadiusNumberAxisOptions** (`packages/ag-charts-types/src/chart/radiusAxisOptions.ts`)
    - Verify `innerRadiusRatio` property and range
    - Confirm `positionAngle` and `label.rotation` properties

### Implementation Files to Check

1. **Radial Column Series Implementation**:

    - `packages/ag-charts-enterprise/src/series/radial-column/radialColumnSeries.ts`
    - Check default values for properties
    - Verify stacking logic implementation
    - Confirm enterprise-only status

2. **Polar Axis Implementations**:
    - Angle category axis implementation
    - Radius number axis implementation
    - Default values for padding and positioning

### Examples to Test with Expected Behaviors

#### 1. simple-radial-column

**Documentation Claims**:

-   Creates multiple radial column series with shared angle categories
-   Uses 'quarter' as angleKey for category axis
-   Shows 'software', 'hardware', and 'services' data series
-   Each series has a radiusName for labeling

**Expected Behaviors for example-tester**:

-   Chart should render three distinct series in different colors
-   Columns should be arranged radially around the circle
-   Each quarter (Q1-Q4) should have three columns side by side
-   Legend should show three entries with correct labels
-   Hovering over columns should show tooltips with correct values
-   No console errors or warnings

#### 2. stacked-radial-column

**Documentation Claims**:

-   Columns are vertically stacked within each category
-   Represents cumulative totals
-   Uses `stacked: true` property

**Expected Behaviors for example-tester**:

-   Columns should stack on top of each other radially
-   Total height should represent sum of all series values
-   Individual segments should be distinguishable by color
-   Tooltips should show individual segment values
-   Legend should still show three series
-   Stacking should work correctly for all quarters

#### 3. inner-radius

**Documentation Claims**:

-   Creates a 'donut' effect using innerRadiusRatio
-   Uses `innerRadiusRatio: 0.2` on radius axis
-   Value between 0 and 1 sets inner radius as proportion

**Expected Behaviors for example-tester**:

-   Chart should have a hollow center (donut shape)
-   Inner radius should be approximately 20% of outer radius
-   Columns should start from inner radius, not center
-   All other functionality should remain intact
-   Visual appearance should match donut-style charts

#### 4. category-padding

**Documentation Claims**:

-   `paddingInner: 0.5` controls gap between column groups
-   `groupPaddingInner: 0.5` controls spacing within groups
-   Values range from 0 (no gap) to 1 (maximum spacing)

**Expected Behaviors for example-tester**:

-   Visible gaps between quarter groups (Q1, Q2, Q3, Q4)
-   Visible gaps between series within each quarter
-   Padding values of 0.5 should create moderate spacing
-   Chart should still be readable with applied padding
-   Hover areas should respect the padding

#### 5. axis-label-orientation

**Documentation Claims**:

-   Changes angle axis label orientation to 'parallel'
-   Options are 'fixed', 'parallel', 'perpendicular'
-   Default is 'fixed'

**Expected Behaviors for example-tester**:

-   Quarter labels (Q1-Q4) should align parallel to their radial position
-   Labels should be readable and properly oriented
-   Chart functionality should remain unchanged
-   Compare with default 'fixed' orientation

#### 6. radius-axis-position

**Documentation Claims**:

-   `positionAngle: 90` positions the radius axis line
-   `label.rotation: -90` rotates axis labels
-   Customizes visual appearance of radius axis

**Expected Behaviors for example-tester**:

-   Radius axis should be positioned at 90 degrees (top)
-   Axis labels should be rotated -90 degrees
-   Axis should remain functional and readable
-   Grid lines should still render correctly

### User Interactions to Validate

1. **Hover Interactions**:

    - Systematic hovering over all column segments
    - Tooltip content and positioning
    - Visual highlighting of hovered segments
    - Hover behavior in stacked vs non-stacked charts

2. **Legend Interactions**:

    - Clicking legend items to show/hide series
    - Visual feedback on legend hover
    - Series highlighting when hovering legend

3. **Responsive Behavior**:

    - Chart resizing with window
    - Label adjustments at different sizes
    - Mobile viewport rendering

4. **Keyboard Navigation**:
    - Tab navigation through interactive elements
    - Focus indicators on columns and legend
    - Keyboard-triggered tooltips

### Visual States to Screenshot and Analyze

1. **Default Rendering States**:

    - Each example in its default state
    - Focus on column arrangement and spacing
    - Axis label positioning and orientation

2. **Interactive States**:

    - Hover states showing tooltips
    - Legend interaction states
    - Focus states for accessibility

3. **Responsive States**:

    - Desktop view (default)
    - Tablet view
    - Mobile view

4. **Edge Cases**:
    - Maximum padding values
    - Minimum/maximum inner radius
    - Extreme data values

### Interactive Features Requiring Before/After Visual Comparison

1. **Series Toggle via Legend**:

    - Before: All series visible
    - After: One or more series hidden
    - Stacked chart behavior when series hidden

2. **Hover Effects**:

    - Before: No interaction
    - After: Column highlighted with tooltip

3. **Responsive Transitions**:
    - Before: Desktop size
    - After: Mobile size

### Chart Elements That Should Be Interactive

Based on documentation and chart type expectations:

1. **Column Segments**: Should respond to hover with tooltips and highlighting
2. **Legend Items**: Should be clickable to toggle series visibility
3. **Chart Background**: May support zoom/pan in some configurations
4. **Axis Labels**: May have hover states for additional information

### Expected Tooltip Content and Highlighting Behaviors

1. **Simple Charts**: Tooltips should show quarter, series name, and value
2. **Stacked Charts**: Tooltips should show segment value and possibly total
3. **Highlighting**: Hovered segments should be visually distinguished
4. **Cross-highlighting**: Related elements (legend, segments) may highlight together

## Known Exceptions

No existing `technical-review-exceptions.md` file found for this page.

## Execution Plan

### Priority 1: Critical API and Type Validation

1. **Verify TypeScript interfaces match documentation**

    - Check AgRadialColumnSeriesOptions properties
    - Validate axis configuration options
    - Identify any undocumented properties
    - Confirm enterprise-only status

2. **Validate basic example functionality**
    - Test simple-radial-column with example-tester
    - Verify all documented series properties work
    - Check console for errors or warnings

### Priority 2: Feature-Specific Validation

3. **Test stacking functionality**

    - Validate stacked-radial-column example
    - Verify cumulative behavior
    - Test with example-tester for correct rendering

4. **Validate customization options**
    - Test inner-radius donut effect
    - Verify category-padding behavior
    - Check axis customization options

### Priority 3: Comprehensive Interaction Testing

5. **Interactive behavior validation**

    - Systematic hover testing on all examples
    - Legend interaction testing
    - Keyboard navigation verification
    - Screenshot all interaction states

6. **Visual consistency checks**
    - Compare screenshots with documentation claims
    - Verify responsive behavior
    - Check edge cases and limits

### Success Criteria for Each Test

-   **API Validation**: All documented properties exist and work as described
-   **Example Testing**: No console errors, correct visual rendering, expected interactions
-   **Visual Testing**: Screenshots match documented behavior, consistent across viewports
-   **Interaction Testing**: All interactive elements respond correctly, accessibility compliance

### Estimated Complexity/Time

-   **Phase 1 (Planning)**: 30 minutes ✓
-   **Phase 2 (Execution)**: 2-3 hours
    -   API validation: 30 minutes
    -   Example testing with example-tester: 1 hour
    -   Interactive testing and screenshots: 1 hour
    -   Report compilation: 30 minutes

## Delegation Plan for example-tester Agent

### Overview

The example-tester agent will be invoked for each of the 6 examples to validate:

1. Code quality and AG Charts API usage
2. Chart rendering correctness
3. Console errors or warnings
4. TypeScript type safety
5. Best practices compliance

### Specific Instructions for Each Example

#### 1. simple-radial-column

**Instructions**: "Please test the simple-radial-column example. The documentation claims this creates a basic radial column chart with three data series (software, hardware, services) arranged by quarters. Verify that:

-   The chart renders three distinct series in different colors
-   Columns are arranged radially with quarters as categories
-   The angleKey 'quarter' and radiusKeys 'software', 'hardware', 'services' work correctly
-   Series names appear in the legend
-   No console errors occur
-   The code follows AG Charts best practices"

#### 2. stacked-radial-column

**Instructions**: "Please test the stacked-radial-column example. The documentation states this creates stacked columns for cumulative totals. Verify that:

-   Columns stack radially on top of each other
-   The `stacked: true` property works correctly
-   Individual segments are distinguishable
-   Cumulative heights represent total values
-   Stacking works for all quarters
-   The implementation is correct for radial stacking"

#### 3. inner-radius

**Instructions**: "Please test the inner-radius example. The documentation shows this creates a donut effect using `innerRadiusRatio: 0.2`. Verify that:

-   The chart has a hollow center (donut appearance)
-   The inner radius is approximately 20% of the outer radius
-   Columns start from the inner radius edge
-   The `innerRadiusRatio` property on the radius axis works correctly
-   The visual appearance matches expected donut-style charts"

#### 4. category-padding

**Instructions**: "Please test the category-padding example. The documentation demonstrates `paddingInner: 0.5` and `groupPaddingInner: 0.5`. Verify that:

-   Visible gaps exist between quarter groups
-   Visible gaps exist between series within each quarter
-   The padding values create appropriate spacing
-   Both padding properties work as documented
-   The chart remains readable with applied padding"

#### 5. axis-label-orientation

**Instructions**: "Please test the axis-label-orientation example. The documentation shows changing label orientation to 'parallel'. Verify that:

-   Angle axis labels are oriented parallel to their radial position
-   The `label.orientation: 'parallel'` configuration works
-   Labels are readable and properly positioned
-   The orientation differs from the default 'fixed' orientation
-   All label orientation options ('fixed', 'parallel', 'perpendicular') are valid"

#### 6. radius-axis-position

**Instructions**: "Please test the radius-axis-position example. The documentation shows `positionAngle: 90` and `label.rotation: -90`. Verify that:

-   The radius axis is positioned at 90 degrees (top of chart)
-   Axis labels are rotated -90 degrees
-   Both properties work as documented
-   The axis remains functional and readable
-   Grid lines render correctly with the repositioned axis"

### Expected Agent Output

For each example, the example-tester agent should provide:

-   Confirmation of successful rendering
-   Any console errors or warnings found
-   Validation of specific features tested
-   Code quality assessment
-   Deviations from documented behavior
-   Screenshots if applicable
