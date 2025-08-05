# Technical Review Plan: Area Series Documentation

## Page Analysis Summary

### Documentation Overview

The area-series documentation covers:

-   **Chart Types/Features**: Simple overlaid areas, stacked areas, normalized areas, customization, interpolation, missing data handling
-   **Key APIs**: AgAreaSeriesOptions interface with properties like `type: 'area'`, `stacked`, `normalizedTo`, `interpolation`, `connectMissingData`
-   **Configuration Options**: xKey/yKey data mapping, yName display names, styling (fill, stroke, lineDash), markers, labels
-   **Customization Features**: Color fills, stroke styling, line dashing, markers, labels, shadows, tooltips, interpolation styles
-   **Interactive Features**: Hover tooltips, legend integration, area highlighting, overlaid visibility

### Examples Referenced

1. **simple-area**: Basic overlaid area series demonstrating default fillOpacity 0.8 behavior
2. **stacked-area**: Stacked areas using `stacked: true`
3. **normalized-area**: Normalized stacks with `normalizedTo: 1000`
4. **customised-area**: Custom styling with stroke, fill, lineDash, markers, and labels
5. **line-style**: Interpolation options with `interpolation: { style: 'smooth' }`
6. **missing-data-area**: Gap handling and `connectMissingData` behavior

## Validation Targets

### TypeScript Interface Verification

**Primary Interface**: `AgAreaSeriesOptions` in `/packages/ag-charts-types/src/series/cartesian/areaOptions.ts`

**Properties to Cross-Reference**:

-   Core properties: `type: 'area'`, `xKey`, `yKey`, `xName`, `yName`
-   Stacking properties: `stacked`, `stackGroup`, `normalizedTo`
-   Styling properties: `fill`, `fillOpacity`, `stroke`, `strokeWidth`, `strokeOpacity`, `lineDash`, `lineDashOffset`
-   Advanced properties: `marker`, `label`, `interpolation`, `connectMissingData`, `shadow`, `tooltip`, `highlight`

**Property Defaults to Verify** (from implementation):

-   `fillOpacity: 0.8` (from areaSeriesModule.ts - documented as default for visibility)
-   `fill: '#c16068'`, `stroke: '#874349'` (from AreaSeriesProperties:37,43)
-   `strokeWidth: 2`, `strokeOpacity: 1` (from AreaSeriesProperties:46,49)
-   `lineDash: [0]`, `lineDashOffset: 0` (from AreaSeriesProperties:52,55)
-   `connectMissingData: false` (from AreaSeriesProperties:73)

### Implementation Files to Check

-   `/packages/ag-charts-community/src/chart/series/cartesian/areaSeriesProperties.ts` - Property defaults and styling
-   `/packages/ag-charts-community/src/chart/series/cartesian/areaSeries.ts` - Main implementation logic
-   `/packages/ag-charts-community/src/chart/series/cartesian/areaSeriesModule.ts` - Module configuration with fillOpacity: 0.8

### Example Testing Expectations for example-tester Agent

#### simple-area

**Documentation Claims**: "Multiple Area Series are overlaid in provided order", "default `fillOpacity` of 0.8 to allow all series to be visible"
**Expected Behaviors**:

-   Multiple area series displayed overlaid (not stacked)
-   Semi-transparent areas with fillOpacity allowing visibility of overlapped areas
-   Legend shows all series names
-   Tooltips on hover show series name and value
-   Data keys: xKey='month', yKey for each series (subscriptions, services, products)

#### stacked-area

**Documentation Claims**: "Setting `stacked: true` will enable the series stacking behaviour"
**Expected Behaviors**:

-   Areas stacked vertically instead of overlaid
-   Total height represents cumulative sum of all series values
-   Each area segment represents individual series contribution
-   All series configured with `stacked: true`
-   Tooltips show individual series values

#### normalized-area

**Documentation Claims**: "normalize to any non-zero value", "normalizedTo: 1000" example
**Expected Behaviors**:

-   All area stacks have same total height (normalized to 1000)
-   Individual segments show proportional contribution
-   All series configured with both `stacked: true` and `normalizedTo: 1000`
-   Visual proportions match relative data values

#### customised-area

**Documentation Claims**: Custom stroke, fill, lineDash for subscriptions; markers enabled for services; labels enabled for products
**Expected Behaviors**:

-   Custom stroke and fill colors applied to all series
-   Subscriptions series shows custom lineDash pattern
-   Services series displays markers on data points
-   Products series shows data labels
-   All styling customizations visible and correctly applied

#### line-style

**Documentation Claims**: "interpolation option to change line style", `interpolation: { style: 'smooth' }`
**Expected Behaviors**:

-   Area boundaries use smooth curved lines instead of straight lines
-   Interpolation property correctly configured in series
-   Smooth curves visible in area shapes
-   Data points connected with smooth interpolation

#### missing-data-area

**Documentation Claims**: "`Infinity`, `null`, `undefined` or `NaN` rendered as gaps", "Set `connectMissingData: true` to draw connection between points"
**Expected Behaviors**:

-   Missing data points create visible gaps in area series
-   connectMissingData property controls gap behavior
-   Areas handle missing data gracefully without errors
-   Gap rendering matches documented behavior

## Known Exceptions

**No existing exceptions file found at**: `/packages/ag-charts-website/src/content/docs/area-series/technical-review-exceptions.md`

## Execution Plan

### Priority 1: Critical API Accuracy (High Priority)

1. **Verify core configuration properties** against AgAreaSeriesOptions interface

    - Success criteria: All documented properties exist in TypeScript interface with correct types
    - Check: `type`, `xKey`, `yKey`, `stacked`, `normalizedTo`, `interpolation`, `connectMissingData`

2. **Validate documented default behaviors** against implementation

    - Success criteria: Documented defaults match actual implementation defaults
    - **Critical Check**: fillOpacity 0.8 default (documented claim vs. areaSeriesModule.ts)
    - Check: Default fill colors, stroke properties, connectMissingData default

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

    - **Hover testing**: Systematically hover over areas, legends, axes
        - Expected: Tooltips appear with correct content, area highlighting works
    - **Click testing**: Click on areas, legend items, empty spaces
        - Expected: Legend toggling works, no unexpected behaviors
    - **Keyboard navigation**: Tab through interactive elements
        - Expected: Focus indicators, accessible interactions

3. **Edge case interaction testing**:
    - Rapid hover movements across overlapped areas
    - Window resize during interactions
    - Multiple series show/hide via legend
    - Overlapping area hover behavior (especially in overlaid scenarios)
    - Test missing data gap interactions

### Priority 4: Technical Implementation Verification (Medium Priority)

1. **Verify fillOpacity behavior claims**

    - Success criteria: Default 0.8 fillOpacity enables visibility of overlapped areas
    - Check: Visual transparency and overlaid visibility

2. **Validate stacking and normalization logic**

    - Success criteria: Stacking and normalization work as documented
    - Check: stackGroup behavior, normalization calculations

3. **Test interpolation functionality**

    - Success criteria: Interpolation styles work as documented
    - Check: smooth vs. straight line rendering

4. **Validate missing data handling**
    - Success criteria: connectMissingData behavior matches documentation
    - Check: Gap rendering, connection behavior

### Priority 5: Content Quality Assessment (Medium Priority)

1. **Completeness check**

    - Verify all major AgAreaSeriesOptions properties are documented
    - Check coverage of common use cases and patterns
    - Validate API reference section completeness

2. **Consistency with related documentation**
    - Cross-check axes documentation references
    - Verify tooltip and legend documentation alignment

## Expected Timeline

-   **Phase 2 Execution**: 2-3 iterations due to comprehensive testing requirements
-   **Most Complex Testing**: Visual interaction testing with overlaid areas and interpolation behavior
-   **Agent Delegation**: All 6 examples will be tested by example-tester agent
-   **Screenshot Collection**: ~25-30 screenshots across all examples and states

## Success Criteria

-   ✅ All documented properties exist in TypeScript interface
-   ✅ All code examples are syntactically correct and functional
-   ✅ All 6 examples render correctly and demonstrate claimed features
-   ✅ Interactive behaviors (hover, click, keyboard) work as expected
-   ✅ Visual consistency between examples and documentation claims
-   ✅ No console errors or TypeScript issues in examples
-   ✅ Responsive behavior works across viewport sizes
-   ✅ fillOpacity 0.8 default verified and overlaid visibility confirmed
-   ✅ Stacking, normalization, and interpolation behaviors validated
-   ✅ Missing data handling works as documented
-   ✅ example-tester agent validates all technical implementations successfully
