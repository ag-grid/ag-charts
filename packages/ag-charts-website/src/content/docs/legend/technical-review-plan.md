# Technical Review Plan: Legend Documentation

## Page Analysis Summary

### Chart Types/Features Covered

-   Legend positioning and layout (9 preset positions)
-   Floating legends with offset capabilities
-   Legend pagination for space-constrained scenarios
-   Legend item customization (markers, labels, lines)
-   Series visibility toggling through legend interaction
-   Legend events (click, double-click)
-   Legend spacing and padding options
-   Series stroke display options

### Key APIs and Configuration Options Documented

-   `AgChartLegendOptions` interface
-   `legend.enabled` - Controls legend visibility
-   `legend.position` - String or object with placement, floating, xOffset, yOffset
-   `legend.orientation` - horizontal/vertical layout
-   `legend.spacing` - Space between legend and series area
-   `legend.maxWidth` / `legend.maxHeight` - Size constraints
-   `legend.item` - Configuration for markers, labels, lines
-   `legend.toggleSeries` - Enable/disable series toggling
-   `legend.preventHidingAll` - Prevent hiding all series
-   `legend.pagination` - Pagination controls styling

### Examples Referenced and Their Purposes

1. **legend-position**: Demonstrates all 9 preset legend positions
2. **legend-floating**: Shows floating legends with offset positioning
3. **legend-spacing-offsets**: Illustrates spacing and offset properties
4. **legend-constraints**: Shows padding, maxWidth, and item constraints
5. **legend-seriesStroke**: Demonstrates series stroke display control
6. **legend-pagination**: Shows pagination when items exceed constraints
7. **legend-customisation**: Comprehensive customization of markers, labels, lines
8. **legend-click-series-toggle**: Interactive series visibility toggling

### Interactive Features Described

-   Single-click to toggle individual series visibility
-   Double-click to show only that series (isolate)
-   Double-click again to show all series
-   Legend item hover states
-   Pagination button interactions
-   Console logging via legendItemClick events
-   Note: Pie series sectors don't toggle on double-click

## Validation Targets

### Specific TypeScript Interfaces to Verify

1. `AgChartLegendOptions` in `packages/ag-charts-types/src/chart/legendOptions.ts`
2. `AgChartLegendPosition` type (string | object)
3. `AgChartLegendPlacement` type (12 position strings)
4. `AgChartLegendPositionOptions` interface
5. `AgChartLegendItemOptions` interface
6. `AgChartLegendMarkerOptions` interface
7. `AgChartLegendLabelOptions` interface
8. `AgChartLegendLineOptions` interface
9. `AgChartLegendPaginationOptions` interface

### Implementation Files to Check

1. `packages/ag-charts-community/src/chart/legend/legend.ts` - Core legend implementation
2. `packages/ag-charts-community/src/chart/legend/legendMarkerLabel.ts` - Marker/label rendering
3. `packages/ag-charts-community/src/chart/legend/legendManager.ts` - Legend management logic
4. `packages/ag-charts-community/src/chart/legend/legendUtil.ts` - Position expansion utilities
5. Property decorator defaults in Legend class and nested classes

### Examples to Test with Expected Behaviors

#### legend-position

**Documentation claims:**

-   Shows all 9 preset positions: top, bottom, left, right, top-left, top-right, bottom-left, bottom-right, and combinations
-   Legend orientation changes automatically (vertical for side positions, horizontal for top/bottom)
-   Series area adjusts to accommodate legend

**Expected behaviors to validate:**

-   Dropdown or controls to switch between all 9 positions
-   Legend renders correctly in each position
-   Orientation automatically switches between horizontal/vertical
-   Chart resizes to accommodate legend without overlap
-   No floating behavior (legend takes space from chart)

#### legend-floating

**Documentation claims:**

-   Legend can float above series area using `floating: true`
-   Position offsets work with xOffset and yOffset
-   Example shows right-top placement with -50px left offset and 75px down offset

**Expected behaviors to validate:**

-   Legend appears above chart data (floating)
-   Legend starts at right-top corner
-   Legend is offset 50px to the left and 75px down
-   Series area doesn't shrink to accommodate legend
-   Legend overlaps chart content appropriately

#### legend-spacing-offsets

**Documentation claims:**

-   `spacing` property controls gap between legend and series area
-   `xOffset` and `yOffset` move legend without affecting series area size
-   Spacing shrinks the series area
-   Spacing has no effect when floating is true

**Expected behaviors to validate:**

-   Controls for adjusting spacing, xOffset, and yOffset
-   Spacing increases gap and shrinks chart
-   Offsets move legend without resizing chart
-   Visual demonstration of spacing vs offset differences

#### legend-constraints

**Documentation claims:**

-   Shows padding configuration (paddingX, paddingY)
-   Demonstrates item.maxWidth constraint
-   Shows marker.padding configuration

**Expected behaviors to validate:**

-   Item maxWidth of 130px enforced (text truncation/wrapping)
-   PaddingX of 32px between legend items horizontally
-   PaddingY of 8px between legend items vertically
-   Marker padding of 8px between marker and label
-   Visual spacing matches documented values

#### legend-seriesStroke

**Documentation claims:**

-   Series stroke line shown by default in legend
-   Can be disabled with `showSeriesStroke: false`
-   Legend markers only shown if series has markers enabled

**Expected behaviors to validate:**

-   Toggle control for showSeriesStroke
-   When enabled: lines appear in legend items
-   When disabled: only markers shown (if series has markers)
-   Line styles match series stroke styles

#### legend-pagination

**Documentation claims:**

-   Pagination appears when items exceed maxWidth/maxHeight constraints
-   Pagination controls are customizable via legend.pagination

**Expected behaviors to validate:**

-   Legend constrained by maxWidth/maxHeight
-   Pagination controls appear when needed
-   Previous/next buttons functional
-   Page indicator shows current page
-   All legend items accessible via pagination

#### legend-customisation

**Documentation claims:**

-   Comprehensive customization example
-   Label formatting, colors, fonts
-   Marker size, shape, stroke customization
-   Line strokeWidth and length configuration

**Expected behaviors to validate:**

-   Custom marker shapes (diamond, circle, square, etc.)
-   Custom marker size (20px as shown)
-   Custom line strokeWidth (4px) and length (40px)
-   Label formatting applied correctly
-   All visual customizations render properly

#### legend-click-series-toggle

**Documentation claims:**

-   Click toggles series visibility
-   Double-click isolates single series
-   Double-click again shows all series
-   legendItemClick events logged to console
-   Pie series sectors don't toggle on double-click
-   Can disable with toggleSeries: false
-   preventHidingAll prevents hiding last series

**Expected behaviors to validate:**

-   Single click hides/shows individual series
-   Double-click hides all except clicked series
-   Second double-click restores all series
-   Console shows legendItemClick event logs
-   Visual feedback on hover/interaction
-   Test with pie chart if available to verify no sector toggle
-   Test toggleSeries: false disables interactions
-   Test preventHidingAll keeps at least one series visible

### User Interactions to Validate

1. **Legend item hover states** - Visual feedback on hover
2. **Click interactions** - Series toggle functionality
3. **Double-click interactions** - Isolate series functionality
4. **Keyboard navigation** - Tab through legend items
5. **Pagination controls** - Previous/next button clicks
6. **Responsive behavior** - Legend adapts to container resize
7. **Touch interactions** - Mobile gesture support

### Visual States to Screenshot and Analyze

1. Each of the 9 legend positions
2. Floating legend with offsets
3. Legend with pagination active
4. Legend item hover states
5. Series toggled off state
6. Isolated series state (after double-click)
7. Custom styled legend items
8. Legend with/without series strokes
9. Mobile responsive views

## Known Exceptions

No existing technical-review-exceptions.md file found for this page.

## Execution Plan

### Priority 1: API Contract Validation

1. Cross-reference all documented properties with TypeScript definitions
2. Verify property types match documentation
3. Check default values in implementation match docs
4. Validate deprecated properties are not used

### Priority 2: Example Testing (for example-tester agent)

For each example, provide the agent with:

1. Example name and path
2. Expected visual appearance from documentation
3. Interactive behaviors to test
4. Configuration options that should be demonstrated
5. Console output expectations

### Priority 3: Interactive Feature Testing

1. Test all click/double-click behaviors systematically
2. Verify keyboard navigation works
3. Test pagination controls thoroughly
4. Validate hover states and visual feedback
5. Test edge cases (empty legend, single item, many items)

### Priority 4: Visual Validation

1. Screenshot each example in default state
2. Capture interaction states (hover, click, pagination)
3. Test responsive behavior at different viewports
4. Verify visual styling matches documentation

### Priority 5: Content Quality Assessment

1. Check completeness of API coverage
2. Verify accuracy of behavioral descriptions
3. Assess clarity of explanations
4. Identify missing documentation

## Estimated Complexity

-   High complexity due to:
    -   Multiple interactive features
    -   Complex positioning system
    -   Pagination functionality
    -   Series visibility toggling
    -   8 different examples to validate
    -   Extensive customization options

## Success Criteria

1. All documented APIs exist and work as described
2. All examples demonstrate their stated features
3. Interactive behaviors match documentation
4. No console errors during interactions
5. Visual rendering matches descriptions
6. Responsive behavior works correctly
7. All customization options function properly
