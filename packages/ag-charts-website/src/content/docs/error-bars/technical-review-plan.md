# Technical Review Plan: Error Bars Documentation

## Page Analysis Summary

### Chart Types/Features Covered

-   **Error Bars**: Enterprise feature for visualizing data variability/uncertainty
-   **Single Error Bars**: Y-axis error bars for Bar, Line, and Scatter series
-   **Double Error Bars**: Both X and Y-axis error bars (Line and Scatter only)
-   **Customization**: Whisker and cap styling, including stylers

### Key APIs and Configuration Options Documented

-   `errorBar` series option with properties:
    -   `yLowerKey` / `yUpperKey`: Y-axis bounds mapping
    -   `xLowerKey` / `xUpperKey`: X-axis bounds mapping (Double Error Bars)
    -   `stroke` / `strokeWidth`: Whisker styling
    -   `cap.stroke` / `cap.strokeWidth` / `cap.length` / `cap.lengthRatio`: Cap customization
    -   `itemStyler`: Dynamic styling via stylers

### Examples Referenced

1. **single-error-bars**: Bar series with y-axis error bars
2. **double-error-bars**: Line series with both x and y-axis error bars, custom tooltip
3. **customisation**: Various cap and whisker styling options

### Interactive Features Described

-   Error bar visualization on charts
-   Custom tooltips showing error bar bounds
-   Hover states and interactive feedback (implied)
-   Styler-based dynamic customization

## Validation Targets

### TypeScript Interfaces to Verify

1. `AgErrorBarOptions` interface in `packages/ag-charts-types/src/`
    - Verify all documented properties exist
    - Check property types and optionality
    - Confirm inheritance/structure

### Implementation Files to Check

1. Error bar implementation in enterprise package:

    - `packages/ag-charts-enterprise/src/` - error bar module/feature
    - Verify enterprise-only feature flag
    - Check default cap length calculations for different series types

2. Series integration:

    - Bar series error bar support
    - Line series error bar support
    - Scatter series error bar support
    - Verify other series types don't support error bars

3. Default behavior implementation:
    - Cap length defaults (marker size for Line/Scatter, 30% bar width for vertical bars, 50% bar height for horizontal bars)
    - Stroke/cap inheritance behavior

### Examples to Test

#### 1. single-error-bars

**Documentation Claims:**

-   Adds error bars to a Bar Series
-   Uses `yLowerKey` and `yUpperKey` for confidence intervals
-   Should display vertical error bars on bar chart

**Expected Behaviors for example-tester:**

-   Bar chart renders with error bars extending above/below each bar
-   Error bars use data from 'lowerCI' and 'upperCI' columns
-   Error bars should be interactive (hover states)
-   No console errors
-   Proper TypeScript usage of errorBar configuration

**Visual Validation:**

-   Screenshot default state showing error bars on all bars
-   Hover over bars to capture tooltip/highlight states
-   Verify error bar whiskers and caps are visible
-   Check responsive behavior at different viewport sizes

#### 2. double-error-bars

**Documentation Claims:**

-   Line series with both X and Y error bars
-   Uses all four bound keys (xLowerKey, xUpperKey, yLowerKey, yUpperKey)
-   Custom tooltip renderer shows bounds
-   Requires number axis for X (not category axis)

**Expected Behaviors for example-tester:**

-   Line chart with error bars in both directions
-   Custom tooltip displays X & Y bounds when hovering
-   Error bars use 'expiryLo/Hi' and 'priceLo/Hi' data
-   X-axis must be number type
-   Tooltip renderer has access to error bar data

**Visual Validation:**

-   Screenshot showing cross-shaped error bars at each data point
-   Capture custom tooltip content showing bounds
-   Hover over different points to verify tooltip updates
-   Check that error bars don't overlap confusingly
-   Test edge cases near chart boundaries

#### 3. customisation

**Documentation Claims:**

-   Shows whisker customization (stroke: 'pink', strokeWidth: 2)
-   Cap customization (stroke: 'red', strokeWidth: 4, length: 25)
-   Cap length can use `lengthRatio` for relative sizing
-   Stylers can be used via `errorBar.itemStyler`

**Expected Behaviors for example-tester:**

-   Multiple series with different error bar styles
-   Pink whiskers with red caps visible
-   Cap length of 25 pixels
-   If stylers are used, dynamic styling should work
-   All customization properties should apply correctly

**Visual Validation:**

-   Screenshot each series showing different cap/whisker styles
-   Verify pink whiskers and red caps are rendered
-   Measure cap lengths to verify 25px setting
-   Check stroke widths match configuration
-   Test hover states maintain custom styling

### User Interactions to Validate

1. **Hover Testing:**

    - Hover over bars/lines with error bars
    - Verify tooltips show correct data
    - Check highlight states for error bars
    - Test hover at error bar caps and whiskers

2. **Click Testing:**

    - Click on chart elements with error bars
    - Verify selection behavior (if any)
    - Test context menu interactions

3. **Keyboard Navigation:**

    - Tab through chart elements
    - Verify error bars don't interfere with navigation
    - Check focus indicators

4. **Edge Cases:**
    - Resize window with error bars visible
    - Test with extreme data values
    - Verify behavior when error bounds are null/undefined
    - Check overlapping error bars

### Visual States to Screenshot

1. Default rendering of each example
2. Hover states showing tooltips and highlights
3. Mobile/tablet viewports
4. Edge cases (overlapping bars, extreme values)
5. Focus states during keyboard navigation
6. Custom styled error bars in customisation example

## Known Exceptions

-   No existing exceptions file found

## Execution Plan

### Priority 1: API Contract Validation

1. Verify `AgErrorBarOptions` interface exists and matches documentation
2. Check enterprise-only feature implementation
3. Validate series type support (Bar, Line, Scatter only)
4. Confirm documented default behaviors in code

### Priority 2: Example Testing via example-tester

1. **single-error-bars**:

    - Delegate to example-tester with bar series validation
    - Verify y-axis error bars render correctly
    - Check data binding to lowerCI/upperCI

2. **double-error-bars**:

    - Delegate to example-tester with line series validation
    - Verify both x and y error bars work
    - Validate custom tooltip renderer
    - Confirm number axis requirement

3. **customisation**:
    - Delegate to example-tester for style validation
    - Verify all customization properties work
    - Check styler functionality if present

### Priority 3: Visual and Interaction Testing

1. Systematic screenshot capture of all examples
2. Interactive testing with hover, click, keyboard
3. Responsive testing at multiple viewports
4. Edge case validation

### Priority 4: Documentation Accuracy

1. Verify all code snippets are syntactically correct
2. Check that documented defaults match implementation
3. Validate series type limitations
4. Ensure tooltip renderer documentation is accurate

### Success Criteria

-   All documented APIs exist and work as described
-   Examples render without console errors
-   Error bars display correctly in all supported series types
-   Customization options apply as documented
-   Interactive features work properly
-   No visual rendering issues

### Estimated Complexity

-   **High complexity** due to:
    -   Enterprise feature requiring license validation
    -   Multiple series type integrations
    -   Complex rendering with caps and whiskers
    -   Custom tooltip integration
    -   Extensive customization options
    -   Cross-axis support for double error bars

Total estimated time: 45-60 minutes for thorough review
