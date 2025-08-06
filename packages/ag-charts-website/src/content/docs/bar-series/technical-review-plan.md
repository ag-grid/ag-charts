# Technical Review Plan: Bar Series Documentation

## Page Analysis Summary

### Documentation Overview

The bar-series documentation covers:

-   **Chart Types/Features**: Standard vertical bars, horizontal bars, stacked bars, normalized bars, grouped stacks with shared legends, grouped category axes
-   **Key APIs**: AgBarSeriesOptions interface with properties like `type`, `direction`, `stacked`, `stackGroup`, `normalizedTo`, `cornerRadius`, etc.
-   **Configuration Options**: xKey/yKey data mapping, yName/xName display names, legendItemName for legend grouping
-   **Customization Features**: Corner radius, styling, labels, tooltips, shadows, item stylers, error bars
-   **Interactive Features**: Hover tooltips, legend item toggling, grouped legend synchronization

### Examples Referenced

1. **simple-bar**: Basic grouped bars demonstrating default behavior
2. **horizontal-bar**: Horizontal orientation with `direction: 'horizontal'`
3. **stacked-bars**: Stack bars using `stacked: true`
4. **normalised-bar**: Normalized stacks with `normalizedTo: 100`
5. **grouped-stack**: Multiple stack groups using `stackGroup` property
6. **grouped-stack-shared-legend**: Shared legend items with `legendItemName`
7. **grouped-category-bar**: Hierarchical category grouping
8. **customising-corner-radius**: Rounded corners with `cornerRadius` property

## Validation Targets

### TypeScript Interface Verification

**Primary Interface**: `AgBarSeriesOptions` in `/packages/ag-charts-types/src/series/cartesian/barOptions.ts`

**Properties to Cross-Reference**:

-   Core properties: `type: 'bar'`, `xKey`, `yKey`, `xName`, `yName`, `legendItemName`
-   Layout properties: `direction` ('horizontal' | 'vertical'), `grouped`, `stacked`, `stackGroup`, `normalizedTo`
-   Style properties: `cornerRadius`, `fill`, `stroke`, `strokeWidth`, `fillOpacity`, `strokeOpacity`, `lineDash`, `crisp`
-   Advanced properties: `label`, `tooltip`, `itemStyler`, `shadow`, `errorBar`, `highlight`

**Property Defaults to Verify** (from implementation):

-   `direction: 'vertical'` (from AbstractBarSeriesProperties:28)
-   `cornerRadius: 0` (from BarSeriesProperties:71)
-   `fill: '#c16068'`, `stroke: '#874349'` (from BarSeriesProperties:50,56)
-   `strokeWidth: 1`, `fillOpacity: 1`, `strokeOpacity: 1` (from BarSeriesProperties:59,53,62)
-   `label.placement: 'inside-center'`, `label.spacing: 0` (from BarSeriesProperties:21,24)

### Implementation Files to Check

-   `/packages/ag-charts-community/src/chart/series/cartesian/barSeriesProperties.ts` - Property defaults and styling
-   `/packages/ag-charts-community/src/chart/series/cartesian/abstractBarSeries.ts` - Direction and base behavior
-   `/packages/ag-charts-community/src/chart/series/cartesian/barSeries.ts` - Main implementation logic

### Example Testing Expectations for example-tester Agent

#### simple-bar

**Documentation Claims**: "By default, bars are grouped, enabling side-by-side comparison", shows 5 series with quarterly data
**Expected Behaviors**:

-   Multiple bar series displayed side-by-side (grouped)
-   Vertical orientation (default)
-   Legend shows all series names
-   Tooltips on hover show series name and value
-   Data keys: xKey='quarter', yKey for each series (iphone, mac, ipad, wearables, services)

#### horizontal-bar

**Documentation Claims**: "`direction: 'horizontal'` shows horizontal bars", "xKey defines categories on y-axis, yKey represents numerical values along x-axis"
**Expected Behaviors**:

-   Bars displayed horizontally instead of vertically
-   Categories (quarters) on y-axis, values on x-axis
-   Same data structure but rotated layout
-   Tooltips and interactions work correctly in horizontal layout

#### stacked-bars

**Documentation Claims**: "Stacked bars for cumulative visualization", uses `stacked: true`
**Expected Behaviors**:

-   Bars stacked vertically instead of grouped
-   Total height represents sum of all series values
-   Each segment represents individual series contribution
-   Tooltips show individual series values, not cumulative

#### normalised-bar

**Documentation Claims**: "`normalizedTo` normalizes bar totals to any non-zero value", example uses `normalizedTo: 100`
**Expected Behaviors**:

-   All bar stacks have same total height (100%)
-   Individual segments show proportional contribution
-   Tooltips may show normalized values or percentages
-   Visual proportions match relative data values

#### grouped-stack

**Documentation Claims**: "`stackGroup` allows stacking bars in distinct sets", shows separate device and other groups
**Expected Behaviors**:

-   Two separate stack groups side-by-side
-   Each group has its own stacked bars
-   Legend shows all series
-   Different stackGroup values create separate stacks

#### grouped-stack-shared-legend

**Documentation Claims**: "`legendItemName` enables synchronised legend items", "clicking legend toggles all matching items"
**Expected Behaviors**:

-   Shared legend items for related series across groups
-   Clicking legend item toggles multiple bar series simultaneously
-   Visual grouping in legend matches stackGroup behavior

#### grouped-category-bar

**Documentation Claims**: "Hierarchical grouped categories using Grouped Category Axis"
**Expected Behaviors**:

-   Multi-level category axis (main categories with sub-categories)
-   Bars grouped within sub-categories
-   Proper axis labeling for hierarchical structure

#### customising-corner-radius

**Documentation Claims**: "`cornerRadius` customizes corner rounding", "should be provided for all series in stack", "applied at end of stack"
**Expected Behaviors**:

-   Rounded corners on bar tops (for stacked bars)
-   Consistent corner radius across all series in stack
-   Corner radius only visible at stack endpoints, not internal segments

## Known Exceptions

**No existing exceptions file found at**: `/packages/ag-charts-website/src/content/docs/bar-series/technical-review-exceptions.md`

## Execution Plan

### Priority 1: Critical API Accuracy (High Priority)

1. **Verify core configuration properties** against AgBarSeriesOptions interface

    - Success criteria: All documented properties exist in TypeScript interface with correct types
    - Check: `type`, `xKey`, `yKey`, `direction`, `stacked`, `stackGroup`, `normalizedTo`, `cornerRadius`

2. **Validate documented default behaviors** against implementation

    - Success criteria: Documented defaults match actual implementation defaults
    - Check: Default direction (vertical), default stacking (grouped), default corner radius (0)

3. **Cross-check code examples** for syntax and API correctness
    - Success criteria: All code snippets use valid property names and values
    - Check: Property names match interface, values match expected types

### Priority 2: Example Consistency and Functionality (High Priority)

1. **Delegate comprehensive example testing to example-tester agent**

    - Provide detailed expectations from documentation analysis above
    - Validate each example demonstrates claimed features correctly
    - Check for TypeScript errors, console warnings, rendering issues
    - Verify data binding and chart visualization accuracy

2. **Test example-to-documentation alignment**
    - Success criteria: Examples demonstrate exactly what documentation claims
    - Check: Configuration matches docs, visual output matches descriptions

### Priority 3: Visual and Interactive Testing (High Priority)

1. **Screenshot capture for all examples** in multiple states:

    - Default rendering state
    - Hover states showing tooltips and highlighting
    - Legend interaction states (clicked/toggled)
    - Mobile/tablet responsive views
    - Keyboard focus states

2. **Canvas-based interaction testing**:

    - **Hover testing**: Systematically hover over bars, legends, axes
        - Expected: Tooltips appear with correct content, bar highlighting works
    - **Click testing**: Click on bars, legend items, empty spaces
        - Expected: Legend toggling works, no unexpected behaviors
    - **Keyboard navigation**: Tab through interactive elements
        - Expected: Focus indicators, accessible interactions

3. **Edge case interaction testing**:
    - Rapid hover movements across chart elements
    - Window resize during interactions
    - Multiple series show/hide via legend
    - Overlapping element hover behavior (especially in grouped/stacked scenarios)

### Priority 4: Technical Implementation Verification (Medium Priority)

1. **Verify axis behavior claims**

    - Success criteria: Horizontal vs vertical axis mapping works as documented
    - Check: xKey/yKey behavior in both orientations

2. **Validate stacking and grouping logic**

    - Success criteria: stackGroup behavior matches documentation
    - Check: Multiple stack groups, shared legends, normalization

3. **Test corner radius behavior specifics**
    - Success criteria: Corner radius applied "at end of stack" as documented
    - Check: Visual rendering matches documented behavior

### Priority 5: Content Quality Assessment (Medium Priority)

1. **Completeness check**

    - Verify all major AgBarSeriesOptions properties are documented
    - Check coverage of common use cases and patterns
    - Validate API reference section completeness

2. **Consistency with related documentation**
    - Cross-check axis documentation references
    - Verify tooltip and legend documentation alignment

## Expected Timeline

-   **Phase 2 Execution**: 2-3 iterations due to comprehensive testing requirements
-   **Most Complex Testing**: Visual interaction testing and canvas hover behavior
-   **Agent Delegation**: All 8 examples will be tested by example-tester agent
-   **Screenshot Collection**: ~30-40 screenshots across all examples and states

## Success Criteria

-   ✅ All documented properties exist in TypeScript interface
-   ✅ All code examples are syntactically correct and functional
-   ✅ All 8 examples render correctly and demonstrate claimed features
-   ✅ Interactive behaviors (hover, click, keyboard) work as expected
-   ✅ Visual consistency between examples and documentation claims
-   ✅ No console errors or TypeScript issues in examples
-   ✅ Responsive behavior works across viewport sizes
-   ✅ example-tester agent validates all technical implementations successfully
