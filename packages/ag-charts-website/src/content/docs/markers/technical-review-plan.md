# Technical Review Plan: Series Markers

## Page Analysis Summary

### Chart Types/Features Covered

-   Series markers configuration for `line`, `area`, `scatter`, and `bubble` series
-   Standard marker attributes: `shape`, `size`, `fill`, and `stroke`
-   Custom marker shapes using callback functions
-   Marker shape API using path drawing commands

### Key APIs and Configuration Options Documented

1. **Standard Marker Properties**:
    - `shape`: Built-in shapes ('circle', 'square', etc.) or custom function
    - `size`: Marker size in pixels
    - `fill`: Fill color
    - `stroke`: Stroke color
2. **Location Differences**:

    - For `line` and `area` series: Properties within `marker` object
    - For `scatter` and `bubble` series: Properties directly on series level

3. **Custom Marker API**:
    - Callback function parameters: `x`, `y`, `size`, `path`
    - Path API methods: `clear()`, `arc()`, `lineTo()`, `closePath()`

### Examples Referenced

1. **marker-shape**: Demonstrates different marker shapes, sizes, and colors
2. **custom-marker**: Shows how to create a custom heart-shaped marker

### Interactive Features Described

-   Legend markers automatically match series marker shape and color
-   Tooltips should appear on hover over markers
-   Visual feedback when hovering over data points

## Validation Targets

### TypeScript Interfaces to Verify

1. `AgSeriesMarkerOptions` in `packages/ag-charts-types/src/series/markerOptions.ts`
    - Verify `enabled`, `shape`, `size`, `fill`, `stroke` properties
    - Check `itemStyler` callback signature
2. `AgMarkerShape` type in `packages/ag-charts-types/src/chart/types.ts`
    - Verify available built-in shapes match documentation
    - Check `AgMarkerShapeFn` interface for custom shapes
3. Series-specific marker implementations:
    - `AgLineSeriesOptions.marker`
    - `AgAreaSeriesOptions.marker`
    - `AgScatterSeriesThemeableOptions` (extends `AgSeriesMarkerStyle`)
    - `AgBubbleSeriesThemeableOptions` (extends `AgSeriesMarkerStyle`)

### Implementation Files to Check

1. Marker rendering implementation in core/community packages
2. Default marker shapes implementation
3. Path API implementation for custom markers
4. Series-specific marker handling for scatter/bubble vs line/area

### Examples to Test with Expected Behaviors

#### marker-shape Example

**Documentation claims**:

-   Shows different marker shapes, sizes, and colors
-   Legend markers match series markers in shape and color but not size
-   Multiple series with different marker configurations

**Expected behaviors for example-tester**:

1. Multiple series rendered with distinct marker configurations
2. Each series should have:
    - Different marker shapes (circle, square, triangle, etc.)
    - Different sizes (varying pixel sizes)
    - Different colors (fill and stroke)
3. Legend items should:
    - Display marker shapes matching the series
    - Show marker colors matching the series
    - Use standard legend marker size (not series marker size)
4. Tooltips should appear when hovering over markers
5. No console errors or warnings

#### custom-marker Example

**Documentation claims**:

-   Demonstrates custom heart-shaped marker using callback function
-   Uses `arc()`, `lineTo()`, and `closePath()` path methods
-   Custom shape appears in both chart and legend

**Expected behaviors for example-tester**:

1. Heart-shaped markers rendered correctly
2. Custom marker function executes without errors
3. Path API methods work as documented:
    - `path.clear()` clears the path
    - `path.arc()` draws partial circles
    - `path.lineTo()` draws straight lines
    - `path.closePath()` closes the path
4. Legend displays the custom heart shape
5. Tooltips work with custom markers
6. No console errors or warnings

### User Interactions to Validate

1. **Hover interactions**:
    - Hover over individual markers to trigger tooltips
    - Verify tooltip positioning near markers
    - Check highlight/hover effects on markers
2. **Legend interactions**:
    - Click legend items to show/hide series
    - Verify markers disappear/reappear correctly
3. **Responsive behavior**:
    - Resize window to test marker rendering at different sizes
    - Verify markers scale appropriately

### Visual States to Screenshot

1. Default chart rendering with all marker types visible
2. Tooltip display when hovering over markers
3. Legend showing marker shapes
4. Custom marker rendering (heart shape)
5. Mobile viewport to check responsive behavior

## Known Exceptions

No documented exceptions found for this page.

## Execution Plan

### Priority 1: API Contract Validation

1. Verify `AgSeriesMarkerOptions` interface matches documentation
2. Check available marker shapes in `AgMarkerShape` type
3. Validate series-specific marker property locations:
    - Line/Area: within `marker` object
    - Scatter/Bubble: directly on series options
4. Verify custom marker function signature

### Priority 2: Example Testing via example-tester

1. **marker-shape example**:
    - Delegate to example-tester with expectations:
        - Multiple series with different marker configurations
        - Legend marker shape/color matching
        - Tooltip functionality
        - Clean console output
2. **custom-marker example**:
    - Delegate to example-tester with expectations:
        - Heart shape rendering correctly
        - Path API methods working
        - Legend showing custom shape
        - Tooltip functionality
        - Clean console output

### Priority 3: Visual and Interactive Testing

1. Take screenshots of both examples in default state
2. Capture hover states with tooltips visible
3. Screenshot legend with custom markers
4. Test and capture mobile responsive view
5. Verify marker highlighting on hover

### Priority 4: Implementation Verification

1. Check default values for marker properties
2. Verify marker shape implementations
3. Validate path API for custom markers
4. Confirm series-specific marker handling differences

### Priority 5: Content Quality Assessment

1. Verify all documented marker properties are covered
2. Check for any undocumented marker features
3. Assess clarity of custom marker example
4. Validate API reference completeness

## Success Criteria

-   All documented marker properties exist in TypeScript definitions
-   Examples render without console errors
-   Custom marker shapes display correctly
-   Legend markers match series markers as documented
-   Tooltips work with all marker types
-   Documentation accurately reflects implementation
