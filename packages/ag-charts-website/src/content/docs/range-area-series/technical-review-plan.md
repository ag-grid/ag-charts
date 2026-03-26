# Technical Review Plan - Range Area Series

## Page Analysis Summary

### Chart Types/Features Covered

-   **Range Area Series**: Enterprise-only series type for displaying data ranges between high and low values
-   **Multiple Series**: Combining multiple range area series in a single chart
-   **Missing Data Handling**: Behavior with invalid data points and `connectMissingData` option
-   **Customization**: Markers and labels configuration

### Key APIs and Configuration Options Documented

-   **Required Keys**: `xKey`, `yLowKey`, `yHighKey`
-   **Optional Name Properties**: `xName`, `yName`, `yLowName`, `yHighName`
-   **Styling Options**: `marker`, `label`
-   **Data Handling**: `connectMissingData`
-   **Label Formatter**: Custom formatting function with `itemType` parameter

### Examples Referenced

1. **simple-range-area**: Basic range area chart with single series
2. **multiple-range-areas**: Two range area series showing different data ranges
3. **range-area-missing-data**: Demonstrates gap handling and `connectMissingData`
4. **range-area-labels**: Marker and label customization with formatter

### Interactive Features Described

-   Tooltips showing `xName`, `yLowName`, `yHighName` values
-   Legend display using `yName`
-   Hover states for range areas
-   Label display for both high and low values

## Validation Targets

### TypeScript Interfaces to Verify

-   `AgRangeAreaSeriesOptions` in `/packages/ag-charts-types/src/series/cartesian/rangeAreaOptions.ts`
-   `AgRangeAreaSeriesLabelOptions` and related types
-   `AgRangeAreaSeriesTooltipRendererParams` with `itemType` field

### Implementation Files to Check

-   `/packages/ag-charts-enterprise/src/series/range-area/rangeArea.ts` - Main series implementation
-   `/packages/ag-charts-enterprise/src/series/range-area/rangeAreaProperties.ts` - Default values and property definitions

### Examples to Test with Expected Behaviors

#### 1. simple-range-area

**Documentation Claims:**

-   Creates a range area using `type: 'range-area'`
-   Uses `yLowKey: 'flatsAndMaisonettes'` and `yHighKey: 'detachedHouses'`
-   Should display a shaded area between the two data values

**Expected Behaviors:**

-   Chart renders with a single filled area between low and high values
-   Area should be shaded with default fill color (#99CCFF based on implementation)
-   Hover over area should show tooltips with data values
-   No markers should be visible by default
-   Legend should show series (check if default name is used)

#### 2. multiple-range-areas

**Documentation Claims:**

-   Two range area series combined in one chart
-   `yName` controls legend text
-   `yLowName`, `yHighName`, `xName` control tooltip text
-   First series: flats to terraced houses
-   Second series: semi-detached to detached houses

**Expected Behaviors:**

-   Two distinct filled areas rendered with different colors
-   Legend shows "Flats & Terraced" and "Semi-detached & Detached"
-   Tooltips show custom names when hovering over areas
-   Areas should not overlap incorrectly
-   Both series should be independently hoverable

#### 3. range-area-missing-data

**Documentation Claims:**

-   Data with `Infinity`, `null`, `undefined`, or `NaN` creates gaps
-   `connectMissingData: true` draws connecting area across gaps
-   Invalid `xKey` values are ignored

**Expected Behaviors:**

-   Default behavior: visible gaps in the range area where data is missing
-   With `connectMissingData: true`: area connects across missing data points
-   Chart should handle all invalid value types gracefully
-   No console errors with missing data
-   Tooltips should not appear over gap areas

#### 4. range-area-labels

**Documentation Claims:**

-   Markers enabled with `size: 7`
-   Labels enabled with `padding: 17`
-   Label formatter uses `itemType` to distinguish 'low' vs 'high'
-   Formatter shows "L: value" or "H: value"

**Expected Behaviors:**

-   Visible markers at both high and low data points
-   Markers should be 7px in size
-   Labels appear near markers with 17px padding
-   Labels show "L:" prefix for low values and "H:" for high values
-   Both high and low values should have labels for each x position
-   Labels should not overlap excessively

### User Interactions to Validate

1. **Hover Interactions**:

    - Hover over filled area to trigger tooltips
    - Hover over edges/boundaries of range area
    - Hover between multiple series areas
    - Hover over gap areas (should not show tooltips)

2. **Legend Interactions**:

    - Click legend items to show/hide series
    - Hover legend items to highlight corresponding series

3. **Responsive Behavior**:
    - Resize window to test area rendering
    - Check if labels reposition appropriately

### Visual States to Screenshot

1. Default rendering state for each example
2. Hover states showing tooltips
3. Legend hover/selection states
4. Label positioning in range-area-labels example
5. Gap rendering in missing data example (both with and without connectMissingData)
6. Mobile viewport rendering

## Known Exceptions

No existing technical-review-exceptions.md file found for this page.

## Execution Plan

### Priority 1: API Contract Validation

1. Verify all documented properties exist in `AgRangeAreaSeriesOptions`
2. Check that `itemType` parameter exists in label formatter params and can be 'low' or 'high'
3. Validate that this is an enterprise-only feature
4. Cross-check default values from implementation

### Priority 2: Example Testing (Delegate to example-tester)

1. **simple-range-area**:
    - Verify basic range area rendering
    - Check default styling matches implementation
    - Test tooltip functionality
2. **multiple-range-areas**:
    - Validate legend text customization
    - Test tooltip name customization
    - Verify series can be toggled via legend
3. **range-area-missing-data**:
    - Test gap rendering with various invalid values
    - Compare behavior with/without connectMissingData
    - Verify no console errors
4. **range-area-labels**:
    - Validate marker and label rendering
    - Test label formatter with itemType
    - Check label positioning

### Priority 3: Interactive Testing

1. Systematic hover testing across all chart areas
2. Legend interaction testing
3. Keyboard navigation testing
4. Edge case testing (resize, zoom, rapid interactions)

### Priority 4: Visual Documentation

1. Capture screenshots of all examples in default state
2. Document hover and interaction states
3. Capture mobile responsive behavior
4. Screenshot any discovered issues

## Delegation Plan for example-tester Agent

### simple-range-area

-   **Task**: Validate basic range area series implementation
-   **Expected from docs**: Single series with area between yLowKey and yHighKey values
-   **Validate**: Proper API usage, chart renders without errors, tooltips work
-   **Check for**: Default colors, proper data binding, no console warnings

### multiple-range-areas

-   **Task**: Test multiple series with custom naming
-   **Expected from docs**: Two series with custom yName for legend, custom tooltip names
-   **Validate**: Both series render, legend shows correct names, tooltips use custom names
-   **Check for**: Series independence, no rendering conflicts, proper color assignment

### range-area-missing-data

-   **Task**: Verify missing data handling
-   **Expected from docs**: Gaps for invalid values, connectMissingData option works
-   **Validate**: Gaps render correctly, connecting line works when enabled
-   **Check for**: No errors with null/undefined/NaN/Infinity values

### range-area-labels

-   **Task**: Test marker and label customization
-   **Expected from docs**: Markers at size 7, labels with custom formatter using itemType
-   **Validate**: Markers visible, labels show L/H prefixes, proper positioning
-   **Check for**: Label formatter receives correct itemType values, no overlapping issues

## Success Criteria

1. All documented APIs exist and work as described
2. Examples demonstrate the features claimed in documentation
3. No console errors or warnings during normal usage
4. Interactive features work smoothly
5. Visual rendering matches documentation descriptions
6. Enterprise-only restriction is properly enforced
