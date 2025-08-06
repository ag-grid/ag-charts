# Technical Review Plan: OHLC Series

## Page Analysis Summary

### Chart Types/Features Covered

-   OHLC (Open-High-Low-Close) series - an enterprise chart type
-   Simple OHLC configuration with basic key mappings
-   Customization of rising/falling items through `item.up` and `item.down` configuration
-   Visual differentiation between rising (close > open) and falling (close < open) data points

### Key APIs and Configuration Options Documented

1. **Series Type**: `type: 'ohlc'`
2. **Required Keys**:
    - `xKey`: Sets the x-axis value
    - `lowKey`: Maps to low/minimum value
    - `openKey`: Maps to open value
    - `closeKey`: Maps to close value
    - `highKey`: Maps to high/maximum value
3. **Customization Options**:
    - `item.up`: Configuration for rising items (stroke, strokeWidth)
    - `item.down`: Configuration for falling items (stroke, strokeWidth)

### Examples Referenced

1. **simple-ohlc**: Demonstrates basic OHLC series setup with required key mappings
2. **ohlc-customisations**: Shows customization of up/down items with different colors and stroke widths

### Interactive Features Described

-   Visual differentiation between rising and falling data points
-   Implied tooltip functionality (standard for all chart series)
-   Implied hover states and highlighting (standard for all chart series)

## Validation Targets

### TypeScript Interfaces to Verify

1. **Primary Interface**: `AgOhlcSeriesOptions` in `packages/ag-charts-types/src/series/cartesian/ohlcOptions.ts`
2. **Base Options**: `AgOhlcSeriesBaseOptions` in `packages/ag-charts-types/src/series/cartesian/ohlcBaseOptions.ts`
3. **Item Configuration**: `AgOhlcSeriesItem`, `AgOhlcSeriesItemOptions`
4. **Tooltip Parameters**: `AgOhlcSeriesTooltipRendererParams`
5. **Styler Parameters**: `AgOhlcSeriesItemStylerParams`

### Implementation Files to Check

1. **Main Implementation**: `packages/ag-charts-enterprise/src/series/ohlc/ohlcSeries.ts`
2. **Properties**: `packages/ag-charts-enterprise/src/series/ohlc/ohlcSeriesProperties.ts`
3. **Base Class**: `packages/ag-charts-enterprise/src/series/ohlc/ohlcSeriesBase.ts`
4. **Node Implementation**: `packages/ag-charts-enterprise/src/series/ohlc/ohlcNode.ts`

### Examples to Test with Expected Behaviors

#### simple-ohlc Example

**Documentation Claims**:

-   Shows basic OHLC series with required key mappings
-   Should display vertical lines for high/low range
-   Should display horizontal ticks for open/close values
-   X-axis should use date values

**Expected Behaviors to Validate**:

1. Chart renders with OHLC data correctly showing:
    - Vertical lines connecting high and low values
    - Horizontal tick on left for open value
    - Horizontal tick on right for close value
2. Data binding works with specified keys (date, low, open, close, high)
3. Default styling applied (should check actual default colors/widths)
4. Tooltips show on hover with OHLC values
5. No console errors or warnings

**example-tester Agent Instructions**:

-   Verify OHLC visual structure (vertical line with horizontal ticks)
-   Check that all required keys are properly configured
-   Validate tooltip content shows all OHLC values
-   Ensure no TypeScript errors with data binding
-   Test hover interactions over different OHLC elements

#### ohlc-customisations Example

**Documentation Claims**:

-   Demonstrates customization via `item` configuration
-   Rising items (close > open) styled with green (#45ba45)
-   Falling items (close < open) styled with red (#ba4545)
-   Both use strokeWidth of 2

**Expected Behaviors to Validate**:

1. Rising data points display in green (#45ba45) with strokeWidth 2
2. Falling data points display in red (#ba4545) with strokeWidth 2
3. Correct identification of rising vs falling based on open/close comparison
4. Customization applies to all OHLC elements (vertical line and horizontal ticks)
5. Configuration structure matches documentation

**example-tester Agent Instructions**:

-   Verify color differentiation between rising and falling items
-   Check exact color values match documentation (#45ba45, #ba4545)
-   Validate strokeWidth is correctly applied (2px)
-   Ensure rising/falling logic works correctly (close > open = up)
-   Test that customization applies to entire OHLC shape

### User Interactions to Validate

1. **Hover Interactions**:

    - Hover over OHLC bars to trigger tooltips
    - Hover over different parts of OHLC (high, low, open, close areas)
    - Check tooltip positioning and content
    - Verify highlight states on hover

2. **Visual States to Screenshot**:

    - Default rendering state
    - Hover state with tooltip visible
    - Different viewport sizes (responsive behavior)
    - Rising vs falling items clearly visible

3. **Interactive Features**:
    - Tooltip trigger zones (entire OHLC shape should be interactive)
    - Highlight behavior on hover
    - Legend interaction (if applicable)
    - Keyboard navigation support

### Visual States to Screenshot and Analyze

1. **Default State Screenshots**:

    - Full chart view showing all OHLC items
    - Close-up of individual OHLC items showing structure
    - Comparison of rising vs falling items in customization example

2. **Interactive State Screenshots**:

    - Tooltip display on hover
    - Highlight state of hovered OHLC item
    - Multiple tooltips if supported

3. **Responsive Screenshots**:
    - Desktop view
    - Tablet view
    - Mobile view

### Known Exceptions

No existing technical review exceptions file found for this page.

## Execution Plan

### Priority 1: API Contract Validation

1. Verify all documented properties exist in `AgOhlcSeriesOptions` interface
2. Check that all five required keys (xKey, lowKey, openKey, closeKey, highKey) are properly typed
3. Validate `item.up` and `item.down` configuration structure matches `AgOhlcSeriesItem`
4. Confirm enterprise-only status is correctly enforced

### Priority 2: Implementation Verification

1. Check default values in `OhlcSeriesProperties`:
    - Default stroke color (documentation doesn't specify, code shows '#333')
    - Default strokeWidth (documentation doesn't specify, code shows 1)
2. Verify rising/falling logic implementation (close > open = up)
3. Check that OHLC series extends from proper base classes
4. Validate tooltip renderer receives all OHLC values

### Priority 3: Example Testing (Delegate to example-tester)

1. Test simple-ohlc example:
    - Proper OHLC rendering
    - Data binding with all keys
    - Default styling
    - Basic interactions
2. Test ohlc-customisations example:
    - Color customization working
    - StrokeWidth customization working
    - Rising/falling logic correct
    - Visual differentiation clear

### Priority 4: Visual and Interaction Testing

1. Capture comprehensive screenshots of both examples
2. Test hover interactions systematically:
    - Hover over different OHLC elements
    - Verify tooltip content and positioning
    - Check highlight states
3. Test responsive behavior at different viewports
4. Verify keyboard navigation if supported

### Priority 5: Content Quality Assessment

1. Check if documentation covers all available configuration options
2. Verify accuracy of rising/falling explanation
3. Look for missing information about:
    - Default values
    - Tooltip configuration
    - Legend behavior
    - Highlight configuration
    - Other styling options beyond stroke

## Success Criteria

1. All documented APIs exist and work as described
2. Examples demonstrate the features claimed in documentation
3. No console errors or TypeScript violations
4. Visual rendering matches OHLC chart expectations
5. Interactive features work smoothly
6. Documentation is complete and accurate

## Delegation Plan for example-tester Agent

### simple-ohlc Example

**Task**: Validate basic OHLC series functionality
**Expectations**:

-   Chart renders with proper OHLC visual structure (vertical lines with horizontal ticks)
-   Data binding works with keys: date, low, open, close, high
-   Default styling is applied consistently
-   Tooltips display all OHLC values on hover
-   No console errors or warnings
-   TypeScript types are properly used

### ohlc-customisations Example

**Task**: Validate OHLC customization features
**Expectations**:

-   Rising items (close > open) display in green (#45ba45)
-   Falling items (close < open) display in red (#ba4545)
-   Both item types use strokeWidth of 2
-   Customization applies to entire OHLC shape
-   Rising/falling logic correctly implemented
-   Configuration structure matches documented API
