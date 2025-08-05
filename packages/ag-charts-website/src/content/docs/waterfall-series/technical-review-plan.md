# Technical Review Plan: Waterfall Series

## Page Analysis Summary

### Chart Types/Features Covered

-   **Waterfall Series**: Enterprise-only feature for showing cumulative effects of sequential positive/negative values
-   **Total/Subtotal Values**: Automatically calculated aggregation points
-   **Horizontal Orientation**: Alternative display direction
-   **Customization Options**: Series items (positive/negative/total), connector lines

### Key APIs and Configuration Options Documented

1. **Basic Series Configuration**:

    - `type: 'waterfall'` - Series type identifier
    - `xKey` - Category axis data key
    - `yKey` - Numerical values key
    - Legend toggling disabled by design

2. **Totals Configuration**:

    - `totals` array with objects containing:
        - `totalType: 'total' | 'subtotal'`
        - `index` - Position in data
        - `axisLabel` - Custom category label

3. **Customization Properties**:
    - `item.positive` - Positive bar styling
    - `item.negative` - Negative bar styling
    - `item.total` - Total/subtotal bar styling (includes `name` property)
    - `line` - Connector line styling
    - `line.enabled` - Toggle connector lines
    - `direction: 'horizontal'` - Orientation option

### Examples Referenced

1. **simple-waterfall**: Basic waterfall chart implementation
2. **total-subtotal-values**: Demonstrates totals configuration
3. **customising-series-items**: Shows item customization (positive/negative/total)
4. **customising-connector-lines**: Line styling and removal
5. **horizontal-waterfall**: Horizontal orientation example

### Interactive Features Described

-   Tooltips (mentioned in context of total name property)
-   Legend display (with note about disabled toggling)
-   Visual cascading effect with rising/falling bars
-   Connector lines between bars

## Validation Targets

### TypeScript Interfaces to Verify

-   `AgWaterfallSeriesOptions` in `packages/ag-charts-types/src/series/cartesian/waterfallOptions.ts`
-   Related interfaces for item configurations, line options, totals

### Implementation Files to Check

-   Waterfall series implementation in enterprise package
-   Property decorators for default values
-   Total/subtotal calculation logic
-   Legend toggling disable mechanism

### Examples to Test with Expected Behaviors

#### 1. simple-waterfall

**Documentation Claims**:

-   Shows basic waterfall with cascading effect
-   Uses `financials` as xKey and `amount` as yKey
-   No totals or customization

**Expected Behaviors for example-tester**:

-   Chart renders with rising and falling bars
-   Positive values create upward bars
-   Negative values create downward bars
-   Connector lines visible between bars
-   Legend shows but toggling is disabled
-   Tooltips show on hover
-   No console errors

#### 2. total-subtotal-values

**Documentation Claims**:

-   Shows totals at specific indices
-   Total accumulates from zero
-   Subtotal accumulates from last total/subtotal
-   Custom axis labels for totals

**Expected Behaviors for example-tester**:

-   Total bars appear at specified indices
-   Total at index 4 labeled "Total Revenue"
-   Subtotal at index 9 labeled "Total Expenditure"
-   Total at index 9 labeled "Total Borrowing"
-   Calculations are cumulative as described
-   Total bars styled differently from regular bars

#### 3. customising-series-items

**Documentation Claims**:

-   Positive items: blue (#4A90E2)
-   Negative items: red (#FF6B6B)
-   Total items: dark gray (#404066)
-   Total name changed to "Total / Subtotal"

**Expected Behaviors for example-tester**:

-   Positive bars render in specified blue
-   Negative bars render in specified red
-   Total bars render in specified gray
-   Legend shows "Total / Subtotal" for totals
-   Tooltips display "Total / Subtotal" name

#### 4. customising-connector-lines

**Documentation Claims**:

-   Lines customizable with strokeWidth and stroke
-   Example shows 4px red lines
-   Lines can be disabled with `enabled: false`

**Expected Behaviors for example-tester**:

-   Connector lines render in red
-   Lines have 4px width
-   When disabled, no connector lines visible
-   Chart still functions without lines

#### 5. horizontal-waterfall

**Documentation Claims**:

-   Direction changes axis orientation
-   xKey defines y-axis categories
-   yKey represents x-axis values

**Expected Behaviors for example-tester**:

-   Chart renders horizontally
-   Categories on vertical axis
-   Numerical values on horizontal axis
-   Bars extend horizontally
-   Connector lines work horizontally

### User Interactions to Validate

1. **Hover Interactions**:

    - Hover over positive bars → tooltip with value
    - Hover over negative bars → tooltip with value
    - Hover over total/subtotal bars → tooltip with custom name
    - Hover over connector lines → no interaction expected
    - Hover over legend items → series highlighting (but no toggle)

2. **Click Interactions**:

    - Click on legend items → verify toggling is disabled
    - Click on bars → check for any selection behavior
    - Click on empty chart areas → no unexpected behavior

3. **Keyboard Navigation**:
    - Tab through interactive elements
    - Focus indicators on bars/legend
    - Keyboard tooltips activation

### Visual States to Screenshot

1. **Default rendering states** for each example
2. **Hover states** showing tooltips
3. **Legend interaction** attempts (to verify disabled toggling)
4. **Responsive behavior** at different viewport sizes
5. **Edge cases**: Empty data, single value, all positive/negative

## Known Exceptions

-   No existing technical-review-exceptions.md file found
-   No known exceptions to consider

## Execution Plan

### Priority 1: API Contract Validation

1. Verify `AgWaterfallSeriesOptions` interface matches documentation
2. Check for enterprise-only implementation
3. Validate totals configuration structure
4. Confirm legend toggling is actually disabled

### Priority 2: Basic Functionality Testing

1. Test simple-waterfall example:
    - Delegate to example-tester for rendering validation
    - Screenshot default state
    - Test hover interactions and tooltips
    - Verify connector lines present

### Priority 3: Advanced Features Testing

1. Test total-subtotal-values example:

    - Delegate to example-tester for calculation verification
    - Verify total/subtotal positioning at correct indices
    - Check axis labels match configuration
    - Screenshot showing all totals

2. Test customization examples:
    - Delegate validation of color/styling to example-tester
    - Screenshot customised appearance
    - Verify tooltip content changes

### Priority 4: Edge Cases and Interactions

1. Test horizontal-waterfall:

    - Verify axis orientation swap
    - Check responsive behavior
    - Screenshot horizontal layout

2. Interactive testing:
    - Systematic hover testing across all bar types
    - Legend click attempts (verify disabled)
    - Keyboard navigation
    - Responsive resize testing

### Success Criteria

-   All documented APIs exist in TypeScript definitions
-   Examples render without console errors
-   Visual appearance matches documentation descriptions
-   Interactive behaviors work as documented
-   Legend toggling confirmed as disabled
-   Total/subtotal calculations are accurate
-   Customization options apply correctly
-   No regression in basic waterfall functionality

### Estimated Complexity

-   **High complexity** due to:
    -   Enterprise-only feature requiring special handling
    -   Complex total/subtotal calculation logic
    -   Multiple customization layers
    -   Disabled legend behavior verification
    -   Horizontal orientation testing
