# Technical Review Plan: Heatmap Series

## Page Analysis Summary

### Chart Types/Features Covered

-   Heatmap series (enterprise feature)
-   Matrix data visualization using color gradients
-   Color range customization
-   Cell labels with formatting
-   Gradient legend with customization options

### Key APIs and Configuration Options Documented

1. **Series Configuration**:
    - `type: 'heatmap'`
    - `xKey`: Category for X Axis
    - `yKey`: Category for Y Axis
    - `colorKey`: Numerical values for color scale
    - `colorRange`: Array of colors for interpolation
    - `label`: Object with `enabled` and `formatter` properties
2. **Gradient Legend Configuration**:
    - `enabled`: Boolean to show/hide legend
    - `position`: 'top', 'right', 'bottom', 'left'
    - `reverseOrder`: For vertical legends
    - `gradient.thickness`: Width/height of gradient bar
    - `gradient.preferredLength`: Initial length of gradient bar
    - `scale.label`: Font customization options
    - `scale.padding`: Distance between gradient and labels

### Examples Referenced

1. **simple-heatmap**: Basic heatmap with temperature data
2. **color-range-with-many-values**: Custom color range demonstration
3. **customising-labels**: Label formatting with temperature display
4. **gradient-legend**: Basic gradient legend usage
5. **gradient-legend-position**: Position and reverseOrder options
6. **gradient-legend-size**: Thickness and preferredLength configuration
7. **gradient-legend-labels**: Scale label customization

### Interactive Features Described

-   Color interpolation based on data values
-   Gradient legend for value reference
-   Cell labels showing formatted values
-   Tooltips (implied through series tooltip configuration)

## Validation Targets

### TypeScript Interfaces to Verify

1. **AgHeatmapSeriesOptions** (`packages/ag-charts-types/src/series/cartesian/heatmapOptions.ts`):

    - Verify all documented properties exist
    - Check `colorRange` is optional string array
    - Confirm label configuration structure
    - Validate enterprise-only feature flag

2. **AgGradientLegendOptions** (`packages/ag-charts-types/src/chart/gradientLegendOptions.ts`):
    - Verify position options match documentation
    - Check gradient bar options structure
    - Validate scale configuration properties
    - Confirm reverseOrder property exists

### Implementation Files to Check

1. **Heatmap Series Implementation**:

    - Look for heatmap series in enterprise package
    - Verify color interpolation logic
    - Check label rendering implementation
    - Validate default behaviors

2. **Gradient Legend Implementation**:
    - Find gradient legend component
    - Verify position handling logic
    - Check thickness/preferredLength behavior
    - Validate scale label formatting

### Examples to Test with Expected Behaviors

#### simple-heatmap

**Documentation claims**: Basic heatmap showing temperature data in a matrix
**Expected behaviors**:

-   Chart renders as a grid/matrix of colored cells
-   X axis shows months, Y axis shows years
-   Colors represent temperature values
-   Gradient legend appears at bottom by default
-   No cell labels visible (not enabled)

#### color-range-with-many-values

**Documentation claims**: Custom color range with 3 colors
**Expected behaviors**:

-   Heatmap uses custom blue-green color palette
-   Colors interpolate smoothly between the 3 values
-   Gradient legend reflects the custom colors
-   Color interpolation follows the specified array

#### customising-labels

**Documentation claims**: Labels show temperature with °C formatting
**Expected behaviors**:

-   Each cell displays a label
-   Labels show temperature values with °C suffix
-   Label formatting uses the provided formatter function
-   Labels are centered in cells by default

#### gradient-legend

**Documentation claims**: Basic gradient legend enabled
**Expected behaviors**:

-   Gradient legend visible at bottom
-   Shows color scale matching heatmap colors
-   Scale values correspond to data range
-   Legend enabled by default (as stated)

#### gradient-legend-position

**Documentation claims**: Position set to 'right' with reverseOrder option
**Expected behaviors**:

-   Gradient legend appears on right side
-   Vertical orientation with values
-   Values can be reversed when reverseOrder is used
-   Legend adapts to vertical layout

#### gradient-legend-size

**Documentation claims**: Thickness 50px, preferredLength 400px
**Expected behaviors**:

-   Gradient bar is 50px thick
-   Initial length attempts to be 400px
-   Length constrained by container edges
-   Size changes are visually apparent

#### gradient-legend-labels

**Documentation claims**: Custom font styling for scale labels
**Expected behaviors**:

-   Labels use 20px font size
-   Italic font style applied
-   Bold font weight visible
-   Serif font family used
-   Red color for label text
-   20px padding between gradient and labels

### User Interactions to Validate

1. **Hover interactions**:

    - Hovering over heatmap cells should show tooltips
    - Tooltips should display x, y, and color values
    - Cell highlighting on hover

2. **Gradient legend interactions**:

    - Legend should be non-interactive (reference only)
    - No hover effects on gradient bar

3. **Responsive behavior**:
    - Heatmap cells should resize with container
    - Gradient legend should adapt to available space
    - Labels should remain readable

### Visual States to Screenshot

1. Default rendering of each example
2. Hover states showing tooltips
3. Different viewport sizes (desktop, tablet, mobile)
4. Gradient legend in all 4 positions
5. Label rendering and formatting
6. Color interpolation patterns

## Known Exceptions

No technical review exceptions file exists for this page.

## Execution Plan

### Priority 1: API Contract Validation

1. Cross-reference AgHeatmapSeriesOptions with documentation
2. Verify AgGradientLegendOptions matches documented properties
3. Check for undocumented required properties
4. Validate property types and optionality

### Priority 2: Example Testing via example-tester Agent

1. Test simple-heatmap for basic functionality
2. Validate color-range-with-many-values interpolation
3. Verify customising-labels formatter behavior
4. Test all gradient legend examples for correct rendering
5. Check for console errors and warnings
6. Validate TypeScript usage and best practices

### Priority 3: Visual and Interactive Testing

1. Screenshot all examples in default state
2. Test hover interactions and capture tooltips
3. Verify responsive behavior at different sizes
4. Validate gradient legend positioning
5. Check label rendering and alignment
6. Test edge cases (empty data, single values)

### Priority 4: Implementation Verification

1. Locate heatmap series in enterprise package
2. Verify default values match documentation
3. Check color interpolation algorithm
4. Validate gradient legend implementation

### Priority 5: Content Quality Assessment

1. Check for missing configuration options
2. Verify example coverage of features
3. Assess clarity of explanations
4. Identify gaps in documentation

## Success Criteria

-   All documented APIs exist in type definitions
-   Examples render without console errors
-   Visual output matches documentation descriptions
-   Interactive features work as described
-   Gradient legend behaves according to documentation
-   No undocumented required properties
-   Enterprise-only feature properly indicated

## Estimated Complexity

**High** - This is an enterprise feature with complex visualization involving color interpolation, gradient legends, and matrix data representation. Requires thorough testing of visual rendering and configuration options.

## Delegation Plan for example-tester Agent

### Task 1: Basic Heatmap Validation

**Example**: simple-heatmap
**Instructions**: Validate that this basic heatmap example correctly implements the AG Charts heatmap series API. The documentation states this creates a simple temperature heatmap with month on X axis, year on Y axis, and temperature for colors.
**Expected validations**:

-   Series type is 'heatmap'
-   xKey, yKey, and colorKey are properly configured
-   Chart renders a matrix/grid visualization
-   No console errors or warnings
-   Gradient legend appears by default

### Task 2: Color Range Testing

**Example**: color-range-with-many-values
**Instructions**: Test the custom color range feature. Documentation shows colorRange: ['#43a2ca', '#a8ddb5', '#f0f9e8'] with 3 colors for interpolation.
**Expected validations**:

-   colorRange array is properly configured
-   Colors interpolate between the 3 specified values
-   Gradient legend reflects custom colors
-   Smooth color transitions in cells

### Task 3: Label Formatting Validation

**Example**: customising-labels
**Instructions**: Verify label configuration and formatting. Documentation shows labels enabled with a formatter that adds °C suffix to temperature values.
**Expected validations**:

-   label.enabled is set to true
-   Formatter function properly implemented
-   Labels display in cells with correct formatting
-   Temperature values show with °C suffix

### Task 4: Gradient Legend Configuration Suite

**Examples**: gradient-legend, gradient-legend-position, gradient-legend-size, gradient-legend-labels
**Instructions**: Validate all gradient legend configuration options across these examples. Check position changes, size adjustments, and label styling.
**Expected validations**:

-   Legend positioning (right vs default bottom)
-   Thickness and preferredLength settings work
-   Label styling (fontSize: 20, fontStyle: 'italic', fontWeight: 'bold', fontFamily: 'serif', color: 'red')
-   Padding configuration affects spacing
-   No rendering issues with different configurations
