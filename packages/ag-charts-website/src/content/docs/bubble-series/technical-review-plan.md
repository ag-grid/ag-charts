# Technical Review Plan: Bubble Series Documentation

## Page Analysis Summary

### Chart Types/Features Covered

-   Bubble Series (`type: 'bubble'`) - extends Scatter Series with size dimension
-   Marker size mapping using `sizeKey` for third variable representation
-   Marker customization (size, shape, fill, stroke)
-   Label placement with intelligent collision avoidance
-   Domain configuration for size mapping

### Key APIs and Configuration Options Documented

-   **Core Properties**: `xKey`, `yKey`, `sizeKey` (required), `labelKey` (optional)
-   **Display Names**: `xName`, `yName`, `sizeName`, `labelName`, `title`
-   **Size Configuration**: `size` (min), `maxSize` (max), `domain` (manual range)
-   **Marker Customization**: `shape`, `fill`, `stroke`
-   **Label Configuration**: `label.enabled` and related label options
-   **Axes Integration**: Default mapping to Number axes

### Examples Referenced

1. **simple-bubble**: Basic bubble chart with two series (Male/Female)
2. **bubble-customised-markers**: Demonstrates size domain, custom shapes, and styling
3. **bubble-chart-labels**: Shows label placement with collision avoidance

### Interactive Features Described

-   Tooltips showing x, y, and size values with custom names
-   Legend items using series title
-   Label placement with dynamic collision avoidance
-   Responsive label visibility based on chart size

## Validation Targets

### TypeScript Interface Verification

-   **Primary Interface**: `AgBubbleSeriesOptions` in `/packages/ag-charts-types/src/series/cartesian/bubbleOptions.ts`
-   **Related Interfaces**:
    -   `AgBubbleSeriesThemeableOptions`
    -   `AgBubbleSeriesOptionsKeys`
    -   `AgBubbleSeriesOptionsNames`
    -   `AgBubbleSeriesLabel`
-   **Inherited Properties**: Check `AgBaseSeriesOptions` and `AgBaseCartesianThemeableOptions`

### Implementation Files to Check

-   Bubble series implementation in community/enterprise packages
-   Default values for:
    -   `size` (documented as 7)
    -   `maxSize` (documented as 30)
    -   `domain` (documented as series data domain)
    -   Label placement default (documented as 'top')
-   Marker shape options and rendering
-   Size calculation algorithm (proportional between min/max)
-   Label collision detection implementation

### Examples to Test with Expected Behaviors

#### simple-bubble

**Documentation Claims**:

-   Shows basic bubble chart with two series (Male/Female)
-   Uses `xKey: 'height'`, `yKey: 'weight'`, `sizeKey: 'age'`
-   Includes display names for tooltips
-   Series titles appear in legend
-   Axes are Number type with formatters

**Expected Behaviors for example-tester**:

-   Two distinct series rendered with different colors
-   Bubble sizes vary based on age values
-   Tooltips show Height, Weight, and Age with proper names
-   Legend shows "Male" and "Female" entries
-   Axes labels formatted with units (cm, kg)
-   No console errors
-   Proper TypeScript typing with `AgChartOptions`

#### bubble-customised-markers

**Documentation Claims**:

-   Demonstrates custom marker sizes with `size: 10`, `maxSize: 20`
-   Shows domain configuration `[0, 100]`
-   Uses different shapes: 'circle' for females, 'square' for males
-   Custom colors: `fill: '#e36f6ab5'`, `stroke: '#9f4e4a'`

**Expected Behaviors for example-tester**:

-   Marker sizes constrained between 10 and 20 pixels
-   Size domain of 0-100 properly mapped
-   Female series uses circle markers
-   Male series uses square markers
-   Custom fill and stroke colors applied
-   Proportional sizing: value 50 → size 15
-   All markers visible and properly rendered

#### bubble-chart-labels

**Documentation Claims**:

-   Labels enabled with `label.enabled: true`
-   Labels don't overlap markers
-   Labels don't overlap other labels
-   Labels hidden if constraints not satisfied
-   More labels appear when chart resized larger
-   Computationally intensive for large datasets

**Expected Behaviors for example-tester**:

-   Labels visible for some bubbles
-   No label-marker overlaps
-   No label-label overlaps
-   Dynamic label visibility on resize
-   Uses `labelKey` for label content
-   Performance acceptable for displayed data
-   Label placement changes with marker size/font size changes

### User Interactions to Validate

1. **Tooltip Interactions**:

    - Hover over bubbles to see tooltips
    - Verify tooltip shows xName, yName, sizeName values
    - Check tooltip title matches series title
    - Test tooltip positioning near chart edges

2. **Legend Interactions**:

    - Click legend items to toggle series visibility
    - Hover legend items for series highlighting
    - Verify legend shows series titles

3. **Responsive Behavior**:

    - Resize window to test label repositioning
    - Check bubble rendering at different viewport sizes
    - Verify axes adjust appropriately

4. **Edge Cases**:
    - Hover at bubble edges for tooltip trigger zones
    - Test with overlapping bubbles
    - Rapid mouse movement across bubbles
    - Keyboard navigation through interactive elements

### Visual States to Screenshot

-   Default chart rendering for all examples
-   Tooltip display on bubble hover
-   Legend hover/click states
-   Label placement at different chart sizes
-   Custom marker shapes and colors
-   Size variation demonstration
-   Mobile viewport rendering

## Known Exceptions

No existing technical-review-exceptions.md file found for this page.

## Execution Plan

### Priority 1: Core API Validation

1. Verify `AgBubbleSeriesOptions` interface matches documentation
2. Check required properties: `type`, `xKey`, `yKey`, `sizeKey`
3. Validate optional properties and their types
4. Confirm default values for `size` (7), `maxSize` (30), `domain`
5. Cross-check inherited properties availability

### Priority 2: Example Testing via example-tester

1. Test simple-bubble example:
    - Basic rendering and data binding
    - Tooltip content verification
    - Legend functionality
    - Axes formatting
2. Test bubble-customised-markers:
    - Size constraints (10-20 pixels)
    - Domain mapping (0-100)
    - Shape differentiation
    - Custom styling application
3. Test bubble-chart-labels:
    - Label visibility and placement
    - Collision avoidance algorithm
    - Responsive label updates
    - Performance with current dataset

### Priority 3: Interactive Testing

1. Comprehensive tooltip testing across all examples
2. Legend interaction validation
3. Responsive behavior testing with screenshots
4. Edge case interaction testing
5. Keyboard accessibility verification

### Priority 4: Documentation Completeness

1. Verify all API options are documented
2. Check code snippets for accuracy
3. Validate links to related documentation
4. Ensure consistent terminology usage
5. Verify performance warning for labels is appropriate

### Success Criteria

-   All TypeScript interfaces match documented APIs
-   Examples render without console errors
-   Interactive features work as documented
-   Visual appearance matches descriptions
-   Performance is acceptable for label placement
-   No undocumented required properties
-   All documented features are demonstrable
