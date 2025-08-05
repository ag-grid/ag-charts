# Technical Review Plan: Stylers Documentation

## Page Analysis Summary

### Features Covered

-   Item Stylers for customizing visual appearance of individual series items
-   Styler callbacks on series level and nested property objects (e.g., marker)
-   Conditional styling based on data values and other parameters
-   Integration with highlighting states

### Key APIs and Configuration Options Documented

-   `itemStyler` callback function on series objects
-   `itemStyler` callback within nested properties like `marker`
-   Callback parameters including `datum`, current styles, and context
-   Return object containing style properties to apply
-   Specific styling properties: `fill`, `size`, `highlighted` state

### Examples Referenced and Their Purposes

1. **item-styler**: Main example demonstrating item stylers on line series markers and bar series

    - Shows conditional marker styling based on data comparison
    - Shows conditional bar fill based on specific month value
    - Demonstrates highlight state handling

2. **item-styler-highlight-states**: (Commented out in documentation) Would demonstrate granular highlight state control
3. **marker-styler**: (Not referenced in docs but exists) Likely demonstrates marker-specific styling
4. **series-item-styler**: (Not referenced in docs but exists) Likely demonstrates series-level item styling

### Interactive Features Described

-   Hover interactions showing highlight states
-   Different styling when items are highlighted vs unhighlighted
-   Conditional styling that responds to user interactions

## Validation Targets

### TypeScript Interfaces to Verify

-   `Styler` type definition from `chart/callbackOptions`
-   `AgBarSeriesItemStylerParams` interface for bar series
-   `AgSeriesMarkerStylerParams` interface for marker styling
-   `AgBarSeriesStyle` interface for available bar style properties
-   `AgSeriesMarkerStyle` interface for available marker style properties
-   `DatumCallbackParams` and `ContextCallbackParams` base interfaces

### Implementation Files to Check

-   Bar series implementation for itemStyler behavior
-   Line series implementation for marker.itemStyler behavior
-   Marker rendering logic to verify style application
-   Highlight state management in series base classes
-   Style merging logic (how returned styles override defaults)

### Examples to Test with Expected Behaviors

#### item-styler Example

**Documentation Claims:**

-   Markers in 'Coal' series will be larger (size: 15) and red when coal > nuclear
-   Markers retain default styling when coal <= nuclear
-   'Imported' bar for 'Jul' will be red normally, lime when highlighted
-   Other bars retain default fill color

**Expected Behaviors to Validate:**

-   Chart renders with line and bar series
-   Hovering over line markers shows tooltips
-   Markers visually change size and color based on data comparison
-   Bar for July is visually distinct (red)
-   Hovering over July bar changes it to lime color
-   Other bars maintain standard highlight behavior
-   No console errors during rendering or interactions

**example-tester Agent Delegation:**

-   Verify the example uses correct AG Charts API patterns
-   Check that itemStyler callbacks are properly structured
-   Validate TypeScript types if present
-   Ensure data binding works correctly
-   Test chart rendering without errors
-   Verify interactive behaviors match documentation

#### marker-styler Example (if relevant to docs)

**Expected Behaviors:**

-   Demonstrates marker-specific styling capabilities
-   Shows how marker.itemStyler differs from series.itemStyler
-   Proper parameter usage and return values

#### series-item-styler Example (if relevant to docs)

**Expected Behaviors:**

-   Shows series-level item styling
-   Demonstrates different use cases from marker styling
-   Proper integration with series rendering

### User Interactions to Validate

1. **Hover States**

    - Hover over individual line markers
    - Hover over bar segments
    - Verify highlight visual feedback matches styled values
    - Check tooltip content and positioning

2. **Data-Driven Styling**

    - Verify conditional styling based on data values
    - Check that all conditions work as documented
    - Validate style inheritance and overrides

3. **Edge Cases**
    - Rapid hovering between elements
    - Window resizing during hover
    - Interaction with legend items
    - Keyboard navigation if supported

### Visual States to Screenshot and Analyze

1. **Default State**

    - Full chart view showing all styled elements
    - Close-up of styled markers showing size/color differences
    - Close-up of July bar showing red fill

2. **Interactive States**

    - Hover tooltip on styled marker
    - Hover state on July bar (lime highlight)
    - Hover on regular bar for comparison
    - Multiple highlight scenarios

3. **Responsive Views**
    - Desktop view
    - Tablet view
    - Mobile view
    - Verify styling persists across viewports

### Interactive Features Requiring Before/After Visual Comparison

-   July bar: before hover (red) vs during hover (lime)
-   Regular bars: default vs highlighted state
-   Markers: styled vs unstyled comparison
-   Tooltip appearance and positioning during hover

### Chart Elements That Should Be Interactive

Based on documentation claims:

-   All line series markers (hover for tooltips)
-   All bar segments (hover for highlight effect)
-   Legend items (if present, for series highlighting)
-   Chart canvas area for general interactions

### Expected Tooltip Content and Highlighting Behaviors

-   Tooltips should show series name, x/y values
-   Custom styled elements should maintain their styling with tooltips
-   Highlight effects should layer on top of custom styling
-   July bar should show lime highlight instead of default

## Known Exceptions

No technical-review-exceptions.md file exists for this page, so no known exceptions to consider.

## Execution Plan

### Priority 1: Core Functionality Validation

1. **TypeScript Interface Verification**

    - Verify `itemStyler` property exists on series and marker options
    - Check parameter types match documentation
    - Validate return type allows documented style properties

2. **Main Example Testing (item-styler)**
    - Delegate to example-tester agent with detailed expectations
    - Take comprehensive screenshots of all states
    - Verify data-driven styling logic
    - Test all interactive behaviors

### Priority 2: Implementation Verification

3. **Code Implementation Review**

    - Check how itemStyler callbacks are invoked
    - Verify style merging logic
    - Validate highlight state integration
    - Check for any undocumented features or limitations

4. **Additional Examples Testing**
    - Test marker-styler example if it adds value
    - Test series-item-styler example if it demonstrates unique features
    - Document any undocumented examples

### Priority 3: Edge Cases and Completeness

5. **Edge Case Testing**

    - Rapid interactions and state changes
    - Responsive behavior
    - Error conditions (null data, invalid styles)
    - Performance with many styled items

6. **Documentation Completeness**
    - Check if all styler capabilities are documented
    - Verify accuracy of API references
    - Look for missing examples or use cases

### Success Criteria

-   All documented behaviors work as described
-   Examples demonstrate the features claimed in documentation
-   No console errors during normal usage
-   Visual styling matches documentation descriptions
-   Interactive behaviors work consistently
-   TypeScript types align with documentation
-   example-tester agent confirms code quality and correctness

### Estimated Complexity

-   **High complexity** for interactive testing due to canvas-based rendering
-   **Medium complexity** for API validation
-   **Medium complexity** for visual validation of conditional styling
