# Technical Review Plan: Scatter Series Documentation

## Page Analysis Summary

### Chart Types/Features Covered

-   **Scatter Series**: Correlation visualization between two numerical categories
-   **Key Features**:
    -   Basic scatter plot visualization
    -   Custom marker shapes (circle, square)
    -   Custom marker styling (fill, stroke)
    -   Label placement with overlap avoidance
    -   Tooltip configuration
    -   Legend integration

### Key APIs and Configuration Options Documented

1. **Series Configuration**:

    - `type: 'scatter'` - Series type identifier
    - `xKey` - Data key for x-axis values
    - `yKey` - Data key for y-axis values
    - `xName` - Display name for x values (tooltips)
    - `yName` - Display name for y values (tooltips)
    - `title` - Series title (legend/tooltips)

2. **Marker Configuration**:

    - `shape` - Marker shape ('circle', 'square')
    - `fill` - Marker fill color
    - `stroke` - Marker stroke color

3. **Label Configuration**:
    - `label.enabled` - Enable/disable labels
    - Label placement constraints and optimization

### Examples Referenced

1. **simple-scatter**: Basic scatter chart with two series (male/female data)
2. **scatter-customised-markers**: Demonstrates custom marker shapes and styling
3. **scatter-chart-labels**: Shows label placement with overlap avoidance

### Interactive Features Described

-   Tooltips showing data point values
-   Legend interaction for series visibility
-   Label placement constraints with automatic adjustment
-   Responsive behavior when resizing chart

## Validation Targets

### TypeScript Interfaces to Verify

-   `AgScatterSeriesOptions` in `packages/ag-charts-types/src/`
-   Related marker configuration interfaces
-   Label configuration interfaces
-   Tooltip and legend related types

### Implementation Files to Check

-   Core scatter series implementation in `packages/ag-charts-community/src/`
-   Marker rendering logic
-   Label placement algorithm
-   Default values for properties
-   Tooltip generation logic

### Examples to Test with Expected Behaviors

#### 1. simple-scatter

**Documentation Claims**:

-   Creates basic scatter plot with two series
-   Uses 'height' as xKey and 'weight' as yKey
-   Shows male and female data series
-   Default number axes for both x and y
-   Tooltips show xName and yName values
-   Legend shows series titles

**Expected Behaviors to Validate**:

-   Chart renders with two distinct series
-   Data points plotted correctly on x/y axes
-   Tooltips display Height and Weight values on hover
-   Legend shows "Male" and "Female" entries
-   Clicking legend toggles series visibility
-   Axes labeled with "Height" and "Weight"
-   Axis labels formatted with units (cm/kg)

#### 2. scatter-customised-markers

**Documentation Claims**:

-   Female series uses 'circle' markers
-   Male series uses 'square' markers
-   Custom fill color with transparency (#e36f6ab5)
-   Custom stroke color (#9f4e4a)

**Expected Behaviors to Validate**:

-   Different marker shapes for each series
-   Custom colors applied correctly
-   Fill transparency renders properly
-   Stroke width and color visible
-   Hover states maintain custom styling
-   Legend reflects marker shapes and colors

#### 3. scatter-chart-labels

**Documentation Claims**:

-   Labels enabled with label.enabled: true
-   Labels don't overlap markers
-   Labels don't overlap other labels
-   Labels adapt to chart size
-   Performance warning for large datasets

**Expected Behaviors to Validate**:

-   Labels visible for data points
-   No label-marker overlaps
-   No label-label overlaps
-   Resizing window shows/hides labels dynamically
-   Labels use appropriate data key
-   Font size affects label placement
-   Marker size affects label placement

### User Interactions to Validate

1. **Hover Interactions**:

    - Hover over data points for tooltips
    - Hover over legend items
    - Hover over axes labels
    - Hover between closely spaced points

2. **Click Interactions**:

    - Click legend items to toggle series
    - Click on data points (if applicable)
    - Click on empty chart areas

3. **Resize Behavior**:

    - Window resize affects label visibility
    - Chart maintains proportions
    - Axes adjust appropriately

4. **Keyboard Navigation**:
    - Tab through interactive elements
    - Legend keyboard interaction
    - Focus states visible

### Visual States to Screenshot

1. **Default States**:

    - Full chart view for each example
    - Close-up of marker shapes
    - Legend appearance

2. **Interactive States**:

    - Tooltip on hover
    - Series toggled via legend
    - Label placement at different sizes

3. **Responsive States**:
    - Desktop view
    - Tablet view
    - Mobile view
    - Label visibility changes

## Known Exceptions

-   No documented exceptions file found for this page

## Execution Plan

### Priority 1: API Contract Validation

1. Verify `AgScatterSeriesOptions` interface matches documentation
2. Check default values for all properties
3. Validate marker shape options ('circle', 'square')
4. Confirm axes default to 'number' type

### Priority 2: Core Example Testing

1. **Simple Scatter Example**:

    - Delegate to example-tester with documentation expectations
    - Screenshot default state
    - Test tooltips on multiple data points
    - Verify legend functionality
    - Check axis formatting

2. **Customized Markers Example**:

    - Delegate to example-tester for marker validation
    - Screenshot to verify shapes and colors
    - Test transparency rendering
    - Verify stroke styling

3. **Labels Example**:
    - Delegate to example-tester for label placement
    - Screenshot at multiple window sizes
    - Test label overlap avoidance
    - Verify performance with data size

### Priority 3: Interactive Testing

1. **Hover States**:

    - Systematic hovering over all chart elements
    - Screenshot tooltips at edges
    - Test rapid hover transitions

2. **Keyboard Navigation**:

    - Tab order verification
    - Focus state screenshots
    - Enter/Space interaction on legend

3. **Edge Cases**:
    - Overlapping data points
    - Extreme zoom levels
    - Very small/large marker sizes
    - Label placement with extreme values

### Priority 4: Documentation Completeness

1. Verify all code snippets are accurate
2. Check links to related pages (axes, tooltips, legend, markers)
3. Validate performance warning appropriateness
4. Confirm API reference completeness

## example-tester Agent Delegation Plan

### Test 1: Simple Scatter Validation

**Provide to Agent**:

-   Example: simple-scatter
-   Expected: Two series (Male/Female) with height/weight data
-   Validate: Correct axis mapping, tooltip content, legend functionality
-   Check: Console for errors, TypeScript compliance

### Test 2: Marker Customization Validation

**Provide to Agent**:

-   Example: scatter-customised-markers
-   Expected: Circle markers for female, square for male
-   Validate: Custom colors (#e36f6ab5, #9f4e4a), transparency
-   Check: Rendering accuracy, hover state preservation

### Test 3: Label Placement Validation

**Provide to Agent**:

-   Example: scatter-chart-labels
-   Expected: Labels visible without overlaps
-   Validate: Dynamic label adjustment on resize
-   Check: Performance, overlap algorithms

## Success Criteria

-   All TypeScript interfaces match documentation
-   Examples render without console errors
-   Interactive features work as documented
-   Visual appearance matches descriptions
-   Performance is acceptable for typical use cases
-   No misleading or incorrect information found
