# Technical Review Plan: Axis Grid Lines & Band Shading

## Page Analysis Summary

### Chart Types/Features Covered

-   Grid lines configuration on all axis types (number, log, time, category)
-   Grid line styling with multiple style objects
-   Alternating band shading using fill properties
-   Default behaviors for different axis types

### Key APIs and Configuration Options Documented

-   `gridLine.enabled` - Enable/disable grid lines
-   `gridLine.style` - Array of style objects for grid lines
    -   `stroke` - Line color
    -   `strokeWidth` - Line width (overrides `gridLine.width`)
    -   `lineDash` - Dash pattern array
    -   `fill` - Fill color between grid lines
    -   `fillOpacity` - Fill opacity between grid lines

### Examples Referenced

1. **axis-grid-lines** - Demonstrates grid line styling with stroke and lineDash patterns
2. **axis-grid-fills** - Shows alternating band shading using fill properties

### Interactive Features Described

-   Visual rendering of grid lines and fills
-   Alternating styles across grid lines
-   Sequential application of style array with looping

## Validation Targets

### TypeScript Interfaces to Verify

-   `AgAxisGridLineOptions` in `packages/ag-charts-types/src/chart/axisOptions.ts`
    -   `enabled?: boolean`
    -   `width?: PixelSize`
    -   `style?: AgAxisGridStyle[]`
-   `AgAxisGridStyle` in `packages/ag-charts-types/src/chart/axisOptions.ts`
    -   `fill?: CssColor`
    -   `fillOpacity?: Ratio`
    -   `stroke?: CssColor`
    -   `strokeWidth?: PixelSize`
    -   `lineDash?: PixelSize[]`

### Implementation Files to Check

-   Grid line rendering implementation in axes modules
-   Default values for `gridLine.enabled` on different axis types:
    -   Should be enabled by default on `number`, `log`, and `time` axes
    -   Should be disabled by default on `category` axes
-   Style array sequential application logic
-   Fill rendering between grid lines

### Examples to Test with Expected Behaviors

#### axis-grid-lines Example

**Documentation Claims:**

-   Shows grid lines with custom stroke colors and dash patterns
-   Uses array of two style objects
-   First style: gray stroke with [10, 5] dash pattern
-   Second style: lightgray stroke with [5, 5] dash pattern
-   Styles should alternate across grid lines

**Expected Behaviors for example-tester:**

-   Grid lines should be visible
-   Grid lines should alternate between two styles
-   No console errors
-   Correct dash patterns visible
-   No fills between grid lines

**Visual Validation:**

-   Screenshot default state showing alternating grid line styles
-   Verify gray and lightgray colors alternate
-   Verify dash patterns are correctly applied
-   Check that styles loop if there are more grid lines than style objects

#### axis-grid-fills Example

**Documentation Claims:**

-   Shows alternating band shading
-   Uses fill and fillOpacity properties
-   First style: fill #999 with 0.1 opacity, strokeWidth 0
-   Second style: empty object for unshaded band
-   Creates alternating shaded/unshaded bands

**Expected Behaviors for example-tester:**

-   Alternating filled and unfilled bands should be visible
-   No grid lines should be visible (strokeWidth: 0)
-   Fill color should be #999 with 0.1 opacity
-   No console errors

**Visual Validation:**

-   Screenshot default state showing alternating bands
-   Verify shaded bands have correct color and opacity
-   Verify unshaded bands are transparent
-   Check that pattern continues across entire chart area

### User Interactions to Validate

-   Hover over grid lines and filled areas (should not have interactive behavior)
-   Resize browser window to verify grid lines and fills adjust correctly
-   Test with different viewport sizes (desktop, tablet, mobile)
-   Verify grid lines and fills render correctly at different zoom levels

### Visual States to Screenshot and Analyze

1. **Default rendering states:**
    - Grid lines with dash patterns (axis-grid-lines)
    - Alternating band shading (axis-grid-fills)
2. **Responsive states:**
    - Desktop viewport (1200px wide)
    - Tablet viewport (768px wide)
    - Mobile viewport (375px wide)
3. **Edge cases:**
    - Browser zoom at 50%, 100%, 200%
    - Very tall chart (stretched vertically)
    - Very wide chart (stretched horizontally)

### Interactive Features Requiring Visual Comparison

-   Grid lines and fills should not have hover states or tooltips
-   No interactive highlighting expected
-   Focus should be on static visual rendering accuracy

### Chart Elements Interactive Behavior

-   Grid lines: No interactive behavior expected
-   Filled bands: No interactive behavior expected
-   Chart data series: Should remain interactive (hover tooltips) independent of grid lines

### Expected Tooltip Content and Highlighting

-   Grid lines should not interfere with data series tooltips
-   Data points should still show tooltips when hovered
-   Grid lines should remain static during all interactions

## Known Exceptions

-   No documented exceptions found for this page

## Execution Plan

### Priority 1: API Contract Validation

1. Verify `AgAxisGridLineOptions` interface matches documentation
2. Verify `AgAxisGridStyle` interface properties
3. Check for any deprecated properties being used
4. Validate property types match documentation

### Priority 2: Default Behavior Verification

1. Test default `gridLine.enabled` values for different axis types
2. Create minimal examples to verify:
    - Number axes have grid lines enabled by default
    - Log axes have grid lines enabled by default
    - Time axes have grid lines enabled by default
    - Category axes have grid lines disabled by default

### Priority 3: Example Testing with example-tester

1. Test axis-grid-lines example:
    - Delegate to example-tester with expected alternating styles
    - Verify stroke colors and dash patterns
    - Check console for errors
    - Take screenshots of grid line rendering
2. Test axis-grid-fills example:
    - Delegate to example-tester with expected band shading
    - Verify fill colors and opacity
    - Confirm no stroke lines visible
    - Take screenshots of band shading

### Priority 4: Visual and Responsive Testing

1. Test both examples at multiple viewport sizes
2. Capture screenshots at different zoom levels
3. Verify grid lines and fills scale correctly
4. Test window resize behavior

### Priority 5: Style Array Behavior Testing

1. Test sequential application of styles
2. Verify looping behavior when more grid lines than styles
3. Test with single style object vs array
4. Test with empty style array

### Priority 6: Edge Cases

1. Test with very large/small charts
2. Test with many grid lines
3. Test with complex dash patterns
4. Test fill opacity edge values (0, 1)

## Success Criteria

-   All TypeScript interfaces match documentation
-   Default behaviors work as documented
-   Examples render correctly without errors
-   Visual appearance matches documentation descriptions
-   Responsive behavior maintains visual integrity
-   No console errors or warnings
-   example-tester validates all expected behaviors

## Estimated Complexity/Time

-   API validation: Low complexity (15 mins)
-   Default behavior testing: Medium complexity (20 mins)
-   Example testing: Medium complexity (25 mins)
-   Visual testing: High complexity (30 mins)
-   Edge case testing: Medium complexity (20 mins)
-   Total estimated time: ~110 minutes
