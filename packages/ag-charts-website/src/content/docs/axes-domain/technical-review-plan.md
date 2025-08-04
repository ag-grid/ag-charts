# Technical Review Plan: Axes Domain

## Page Analysis Summary

### Features Covered

-   Axis domain concept and automatic calculation
-   Nice domain feature for visually pleasing axis ranges
-   Manual domain configuration with min/max properties
-   Domain reversal functionality
-   Continuous vs category axis domain behavior

### Key APIs and Configuration Options Documented

1. **axis.nice** (boolean) - Controls whether axis domain extends to nice round numbers
2. **axis.min** (number/date) - Sets explicit minimum value for domain
3. **axis.max** (number/date) - Sets explicit maximum value for domain
4. **axis.reverse** (boolean) - Reverses the axis scale domain

### Examples Referenced

1. **axis-nice** - Demonstrates toggling nice property with specific data values (1.87 to 88.07)
2. **axis-min-max** - Shows manual domain configuration with interactive buttons
3. **cartesian-axis-reversed** - Illustrates visual impact of reversed domain on bar charts

### Interactive Features Described

-   Toggle buttons for nice property
-   Buttons to set specific min/max values
-   Reset button for automatic domain calculation
-   Toggle for reverse property

## Validation Targets

### TypeScript Interfaces to Verify

1. **AgContinuousAxisOptions** in `packages/ag-charts-types/src/chart/axisOptions.ts`
    - Verify `nice?: boolean` property exists
    - Verify extends `AgBaseContinuousAxisOptions` with `min` and `max`
2. **AgBaseAxisOptions** in `packages/ag-charts-types/src/chart/axisOptions.ts`

    - Verify `reverse?: boolean` property exists

3. **AgBaseContinuousAxisOptions** in `packages/ag-charts-types/src/chart/axisOptions.ts`
    - Verify `min?: TDatum` property exists (where TDatum extends Date | number)
    - Verify `max?: TDatum` property exists

### Implementation Files to Check

1. **Continuous axis implementations**:

    - `packages/ag-charts-community/src/chart/axis/numberAxis.ts`
    - `packages/ag-charts-community/src/chart/axis/timeAxis.ts`
    - Check for nice domain calculation logic
    - Verify min/max property handling
    - Check reverse property implementation

2. **Category axis implementation**:
    - `packages/ag-charts-community/src/chart/axis/categoryAxis.ts`
    - Verify domain consists of discrete values as documented

### Examples to Test with Expected Behaviors

#### axis-nice Example

**Documentation claims**:

-   When nice=false, axis ranges from exactly 1.87 to 88.07
-   When nice=true, axis extends to 0 to 100
-   Button toggles the nice property

**Expected behaviors for example-tester**:

-   Chart renders without console errors
-   Y-axis displays number values
-   Initial state should show nice domain (0-100)
-   Button click should toggle between exact data domain (1.87-88.07) and nice domain (0-100)
-   Axis labels should update to reflect domain changes
-   Data points should remain in same relative positions

#### axis-min-max Example

**Documentation claims**:

-   Buttons set specific domain minimum and maximum
-   Reset button applies automatically calculated domain
-   Shows how to use axis.min and axis.max configurations

**Expected behaviors for example-tester**:

-   Chart renders without console errors
-   Interactive buttons for setting min/max values
-   Reset button restores automatic domain
-   Y-axis updates when buttons are clicked
-   Data visualization adjusts to new domain ranges
-   Chart should handle edge cases (e.g., min > max gracefully)

#### cartesian-axis-reversed Example

**Documentation claims**:

-   Shows contrasting data representation in Bar series
-   Button toggles axis.reverse property
-   Visual impact varies by series type

**Expected behaviors for example-tester**:

-   Bar chart renders without console errors
-   Button toggles reverse property
-   When reversed, bars should flip orientation/direction
-   Axis labels should reverse order
-   Data values remain accurate despite visual reversal

### User Interactions to Validate

1. **Button interactions**:

    - Click nice toggle button multiple times
    - Click min/max setting buttons
    - Click reset button after setting custom min/max
    - Click reverse toggle button

2. **Visual state changes**:
    - Axis label updates when domain changes
    - Smooth transitions between states
    - Correct positioning of data points relative to new domains

### Visual States to Screenshot and Analyze

1. **axis-nice example**:

    - Default state (nice=true)
    - After toggling to nice=false
    - Axis labels at both states

2. **axis-min-max example**:

    - Default automatic domain
    - After setting custom min
    - After setting custom max
    - After reset to automatic

3. **cartesian-axis-reversed example**:
    - Normal orientation (reverse=false)
    - Reversed orientation (reverse=true)
    - Focus on bar direction changes

### Chart Elements That Should Be Interactive

-   Toggle/setting buttons in all examples
-   Chart should remain interactive during domain changes
-   Tooltips should continue working after domain modifications

### Expected Tooltip Content and Highlighting Behaviors

-   Tooltips should show correct data values regardless of domain settings
-   Values in tooltips should not change when nice/reverse toggles
-   Highlighting should work consistently across domain changes

## Known Exceptions

No documented exceptions found for this page.

## Execution Plan

### Priority 1: Core API Validation

1. Verify TypeScript interfaces contain all documented properties
2. Check implementation files for proper handling of nice, min, max, reverse
3. Validate default values match documentation claims

### Priority 2: Example Functionality Testing

1. Test axis-nice example:
    - Verify exact data values (1.87-88.07) mentioned in docs
    - Confirm nice domain extends to 0-100
    - Test toggle functionality
2. Test axis-min-max example:

    - Verify buttons work as described
    - Test reset functionality
    - Check edge cases

3. Test cartesian-axis-reversed example:
    - Verify visual reversal of bars
    - Confirm axis label reversal
    - Test toggle functionality

### Priority 3: Visual and Interaction Testing

1. Screenshot all examples in various states
2. Test rapid clicking of buttons
3. Verify transitions between states
4. Check tooltip behavior across state changes

### Priority 4: Edge Cases and Additional Validation

1. Test interaction between nice and min/max properties
2. Verify note about interval configurations taking priority
3. Test behavior with different data ranges
4. Validate continuous vs category axis differences

### Success Criteria

-   All documented properties exist in TypeScript definitions
-   Examples demonstrate exactly what documentation describes
-   No console errors during interactions
-   Visual states match documented behavior
-   Smooth user experience with all interactive features

### Estimated Complexity

-   **High complexity** areas: Nice domain calculation logic, interaction between nice and min/max
-   **Medium complexity** areas: Example validation, visual testing
-   **Low complexity** areas: Basic property existence checks

This page appears to be well-structured with clear examples. Main focus should be on verifying the exact behaviors claimed (like specific data ranges) and ensuring the interactive examples work smoothly.
