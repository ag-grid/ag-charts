# Technical Review Plan: Nightingale Series

## Page Analysis Summary

### Chart Types/Features Covered

-   **Nightingale Series** (Enterprise feature): A radial/polar chart type also known as Rose or Wind charts
-   **Grouped Nightingale**: Side-by-side comparison of multiple data series within same categories
-   **Inner Radius Customization**: Creating donut-style effects
-   **Category Padding**: Control spacing between groups and within groups
-   **Axis Label Orientation**: Different label positioning options
-   **Radius Axis Position**: Custom positioning and rotation of radius axis

### Key APIs and Configuration Options Documented

1. **Series Configuration**:

    - `type: 'nightingale'` - Series type declaration
    - `angleKey` - Category key for angle axis
    - `radiusKey` - Numerical data key for radius axis
    - `radiusName` - Display name for series
    - `grouped` - Enable grouped sectors mode

2. **Axis Configuration**:

    - **Angle Category Axis** (`type: 'angle-category'`):
        - `paddingInner` - Gap between column groups (0-1)
        - `groupPaddingInner` - Spacing within groups (0-1)
        - `label.orientation` - Options: 'fixed', 'parallel', 'perpendicular'
    - **Radius Number Axis** (`type: 'radius-number'`):
        - `innerRadiusRatio` - Inner radius proportion (0-1)
        - `positionAngle` - Axis line position angle
        - `label.rotation` - Label rotation angle

### Examples Referenced and Their Purposes

1. **simple-nightingale**: Basic nightingale chart with multiple series
2. **group-nightingale**: Grouped sectors comparison
3. **inner-radius**: Donut effect demonstration
4. **category-padding**: Spacing customization
5. **axis-label-orientation**: Label positioning options
6. **radius-axis-position**: Axis positioning and rotation

### Interactive Features Described

-   Series highlighting on hover (implied by standard AG Charts behavior)
-   Tooltips for data points
-   Legend interaction for series toggling
-   Category and data point selection

## Validation Targets

### TypeScript Interfaces to Verify

1. `AgNightingaleSeriesOptions` - Main series configuration interface
2. `AgAngleCategoryAxisOptions` - Angle axis configuration
3. `AgRadiusNumberAxisOptions` - Radius axis configuration
4. `AgChartOptions` - Overall chart configuration for nightingale

### Implementation Files to Check

1. **Core Implementation**:

    - Look for nightingale series implementation in enterprise package
    - Verify property decorators for default values
    - Check axis implementations for angle-category and radius-number types

2. **Property Validation**:
    - Verify `grouped` property behavior
    - Check `innerRadiusRatio` implementation (0-1 range)
    - Validate padding properties (paddingInner, groupPaddingInner)
    - Confirm label orientation options

### Examples to Test with Expected Behaviors

#### 1. simple-nightingale

**Documentation Claims**:

-   Creates multiple nightingale series with shared angle categories
-   Uses 'quarter' as angleKey for category axis
-   Shows three data series: software, hardware, services
-   Each series should have distinct colors and appear in legend

**Expected Behaviors to Validate**:

-   Three radial segments per quarter
-   Hover shows tooltips with quarter and value data
-   Legend shows three series with correct names
-   Clicking legend items toggles series visibility
-   Radial segments scale based on data values

#### 2. group-nightingale

**Documentation Claims**:

-   Enables grouped sectors via `grouped: true`
-   Shows side-by-side comparison within same category
-   All three series should have grouped property enabled

**Expected Behaviors to Validate**:

-   Sectors appear side-by-side within each quarter
-   Grouping creates visual separation between series
-   Hover highlights individual sectors
-   Tooltip shows correct series and value
-   Visual difference from simple-nightingale is clear

#### 3. inner-radius

**Documentation Claims**:

-   Creates donut effect using `innerRadiusRatio: 0.2`
-   Applied to radius-number axis
-   Value between 0 and 1 sets proportion

**Expected Behaviors to Validate**:

-   Chart has visible inner radius (20% of total)
-   Donut hole is centered
-   Series still render correctly with inner radius
-   Hover and interaction work on donut segments

#### 4. category-padding

**Documentation Claims**:

-   `paddingInner: 0.3` creates gaps between groups
-   `groupPaddingInner: 0.2` creates spacing within groups
-   Applied to angle-category axis

**Expected Behaviors to Validate**:

-   Visible gaps between quarter categories
-   Spacing between series within each quarter
-   Padding values correctly applied (visual verification)
-   Interaction still works with padding

#### 5. axis-label-orientation

**Documentation Claims**:

-   Shows `label.orientation: 'parallel'` option
-   Labels align parallel to axis
-   Default is 'fixed' orientation

**Expected Behaviors to Validate**:

-   Angle axis labels are parallel to radial lines
-   Labels are readable and positioned correctly
-   Different from default fixed orientation
-   All quarter labels visible

#### 6. radius-axis-position

**Documentation Claims**:

-   `positionAngle: 90` moves axis to 90 degrees
-   `label.rotation: -90` rotates labels
-   Customizes radius axis appearance

**Expected Behaviors to Validate**:

-   Radius axis appears at 90-degree position (top)
-   Axis labels rotated -90 degrees
-   Axis line and ticks positioned correctly
-   Values on radius axis are readable

### User Interactions to Validate

1. **Hover Interactions**:

    - Hover over segments for tooltips
    - Hover over legend items for series highlighting
    - Hover over axis labels and ticks
    - Hover between segments to test boundaries

2. **Click Interactions**:

    - Click legend items to toggle series
    - Click on segments (if selection enabled)
    - Click on empty chart areas

3. **Keyboard Navigation**:
    - Tab through interactive elements
    - Arrow key navigation if supported
    - Enter/Space for selection

### Visual States to Screenshot and Analyze

1. Default rendering state for each example
2. Hover states showing tooltips and highlights
3. Legend interaction states
4. Mobile/responsive views
5. Series toggled off via legend
6. Focus states for keyboard navigation

## Known Exceptions

No documented exceptions found for this page.

## Execution Plan

### Priority 1: Core API Validation

1. **Verify TypeScript interfaces** exist and match documentation

    - Check AgNightingaleSeriesOptions for all documented properties
    - Verify axis interfaces for angle-category and radius-number
    - Confirm property types and optionality

2. **Check enterprise feature flag**
    - Verify nightingale series is enterprise-only
    - Check implementation location in enterprise package

### Priority 2: Example Testing with example-tester

1. **simple-nightingale**:

    - Validate basic rendering and data binding
    - Check series configuration matches docs
    - Test hover/tooltip functionality
    - Verify legend behavior

2. **group-nightingale**:

    - Confirm grouped: true creates side-by-side layout
    - Compare visual difference with simple example
    - Test interaction on grouped sectors

3. **inner-radius**:

    - Verify donut effect with 0.2 ratio
    - Check rendering correctness
    - Test interactions on donut chart

4. **category-padding**:

    - Validate padding values create correct spacing
    - Check both paddingInner and groupPaddingInner
    - Ensure interactions work with padding

5. **axis-label-orientation**:

    - Confirm parallel label orientation
    - Check label readability
    - Compare with default orientation

6. **radius-axis-position**:
    - Verify 90-degree position
    - Check label rotation (-90 degrees)
    - Validate axis rendering

### Priority 3: Interactive Testing

1. **Comprehensive hover testing**:

    - Test tooltips on all segments
    - Check highlight effects
    - Test hover boundaries

2. **Legend interaction**:

    - Toggle each series on/off
    - Check chart updates correctly
    - Test hover on legend items

3. **Keyboard accessibility**:
    - Tab navigation through elements
    - Focus indicators visibility
    - Keyboard activation of features

### Priority 4: Visual Documentation

1. **Screenshot all examples**:

    - Default states
    - Hover states with tooltips
    - Legend interactions
    - Mobile views

2. **Edge case testing**:
    - Window resize behavior
    - Small data values
    - Many categories
    - Performance with animations

### Success Criteria

-   All documented properties exist in TypeScript definitions
-   Examples render without console errors
-   Interactive features work as described
-   Visual appearance matches documentation claims
-   Enterprise-only restriction is enforced
-   Keyboard navigation is accessible
-   Mobile/responsive behavior is acceptable

### Estimated Complexity

-   **High complexity**: New chart type with specialized polar coordinate system
-   **Time estimate**: 45-60 minutes for thorough review
-   **Risk areas**: Polar coordinate interactions, grouping behavior, axis customizations
