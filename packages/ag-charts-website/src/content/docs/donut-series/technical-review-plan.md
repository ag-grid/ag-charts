# Technical Review Plan: Donut Series Documentation

## Page Analysis Summary

### Chart Features Covered

-   Basic donut chart creation using `type: 'donut'`
-   Inner labels for displaying text inside donut charts
-   Inner circle customization (color/fill)
-   Multiple donuts in a single chart (concentric donuts)
-   Shared legend across multiple donut series
-   Radius customization (`innerRadiusRatio`, `outerRadiusRatio`)

### Key APIs and Configuration Options Documented

-   **Series Type**: `type: 'donut'`
-   **Data Mapping**: `calloutLabelKey`, `angleKey`
-   **Radius Control**: `innerRadiusRatio`, `outerRadiusRatio`
-   **Inner Labels**: `innerLabels` array with text formatting options
-   **Inner Circle**: `innerCircle` with fill property
-   **Legend**: `legendItemKey`, `showInLegend`
-   **Title**: `title.text`, `title.showInLegend`

### Examples Referenced

1. **simple-donut**: Basic donut chart with default settings
2. **text-inside-donut**: Demonstrates inner labels and inner circle customization
3. **multi-donut**: Shows multiple concentric donut series with different radius ratios
4. **multi-donut-shared**: Illustrates shared legend functionality across multiple donuts

### Interactive Features Described

-   Legend item clicking to toggle data segments
-   Synchronized legend items across multiple series when using matching `legendItemKey`
-   Callout labels (implied by `calloutLabelKey`)
-   Tooltips (standard for all AG Charts series)

## Validation Targets

### TypeScript Interfaces to Verify

-   `AgDonutSeriesOptions` in `/packages/ag-charts-types/src/series/polar/donutOptions.ts`
-   Related options for `innerLabels`, `innerCircle`, `title`
-   Inherited options from pie series (since donut extends pie)

### Implementation Files to Check

-   `/packages/ag-charts-community/src/chart/series/polar/donutSeries.ts` - Main implementation
-   `/packages/ag-charts-community/src/chart/series/polar/donutSeriesOptionsDef.ts` - Options definition
-   `/packages/ag-charts-community/src/chart/series/polar/pieSeries.ts` - Base class implementation

### Examples to Test with Expected Behaviors

#### 1. simple-donut

**Documentation Claims:**

-   Creates a basic donut chart using `type: 'donut'`
-   Uses `calloutLabelKey` and `angleKey` for data mapping
-   Should display a donut with default `innerRadiusRatio` (if any)

**Expected Behaviors for example-tester:**

-   Donut chart renders with a hollow center
-   Callout labels display using the `asset` field from data
-   Segment sizes correspond to `amount` values
-   Default inner radius creates a reasonable donut shape
-   Hover states show tooltips
-   Legend displays asset names
-   Chart is interactive (hovering highlights segments)

#### 2. text-inside-donut

**Documentation Claims:**

-   Demonstrates `innerLabels` property with multiple text lines
-   Shows text formatting options (fontWeight, fontSize, color, spacing)
-   Uses `innerCircle` to change center area color to `#c9fdc9`

**Expected Behaviors for example-tester:**

-   Two lines of text display in donut center: "Total Investment" and "$100,000"
-   First line has bold font weight
-   Second line has 48px font size and green color
-   4px spacing between text lines
-   Inner circle background is light green (#c9fdc9)
-   Text remains centered and readable at different viewport sizes

#### 3. multi-donut

**Documentation Claims:**

-   Renders multiple donut series without overlapping
-   Outer series: `outerRadiusRatio: 1`, `innerRadiusRatio: 0.9`
-   Inner series: `outerRadiusRatio: 0.6`, `innerRadiusRatio: 0.2`
-   Gap of 0.3 between outer and inner series
-   Titles display above series if space permits
-   `showInLegend: true` shows titles in legend

**Expected Behaviors for example-tester:**

-   Two concentric donut rings render correctly
-   Outer ring is thin (0.1 thickness ratio)
-   Inner ring is thicker (0.4 thickness ratio)
-   Clear gap between the two rings
-   "Previous Year" and "Current Year" titles visible
-   Legend shows both series titles
-   Each ring can be interacted with independently

#### 4. multi-donut-shared

**Documentation Claims:**

-   Matching `legendItemKey` synchronizes legend items
-   Clicking legend item toggles all matching segments
-   `showInLegend: false` prevents duplicate legend items

**Expected Behaviors for example-tester:**

-   Two donut series with matching asset categories
-   Single set of legend items (no duplicates)
-   Clicking a legend item toggles segments in BOTH donuts
-   Second series has `showInLegend: false` but still responds to legend clicks
-   Visual feedback shows synchronized toggling

### User Interactions to Validate

1. **Hover interactions**:

    - Hover over donut segments for tooltips
    - Hover over legend items for series highlighting
    - Hover over inner labels (should not interfere with donut interaction)
    - Hover at segment boundaries

2. **Click interactions**:

    - Click legend items to toggle segments
    - Verify synchronized toggling in multi-donut-shared example
    - Click on donut segments (if clickable)
    - Click on inner circle area

3. **Keyboard navigation**:

    - Tab through interactive elements
    - Use arrow keys for navigation
    - Enter/Space for activation

4. **Responsive behavior**:
    - Resize window to test label positioning
    - Check inner label readability at small sizes
    - Verify multi-donut spacing at different viewport sizes

### Visual States to Screenshot and Analyze

1. **Default state** - Initial rendering of each example
2. **Hover states** - Tooltips, segment highlighting
3. **Legend interaction** - Before/after toggling segments
4. **Responsive views** - Desktop, tablet, mobile viewports
5. **Inner label rendering** - Text clarity and positioning
6. **Multi-donut spacing** - Gap visualization between rings
7. **Focus states** - Keyboard navigation indicators

## Known Exceptions

No documented exceptions found for this page.

## Execution Plan

### Priority 1: API Contract Validation

1. Verify `AgDonutSeriesOptions` interface matches documented properties
2. Check default values for `innerRadiusRatio` and `outerRadiusRatio`
3. Validate `innerLabels` and `innerCircle` type definitions
4. Confirm inheritance from pie series and shared properties

### Priority 2: Example Testing with example-tester

1. **simple-donut**: Validate basic donut rendering and data mapping
2. **text-inside-donut**: Test inner labels and circle customization
3. **multi-donut**: Verify radius calculations and non-overlapping rings
4. **multi-donut-shared**: Confirm synchronized legend behavior

### Priority 3: Visual and Interaction Testing

1. Screenshot all examples in default state
2. Capture hover tooltips and highlighting
3. Document legend toggle behavior (before/after)
4. Test responsive behavior at 1200px, 768px, 375px widths
5. Verify keyboard navigation and focus indicators

### Priority 4: Implementation Verification

1. Check donutSeries.ts for actual default values
2. Verify inner label rendering logic
3. Confirm radius calculation formulas match documentation
4. Validate legend synchronization implementation

### Priority 5: Content Quality Assessment

1. Verify all documented features have examples
2. Check for missing configuration options
3. Assess clarity of radius ratio explanations
4. Ensure consistent terminology throughout

## Success Criteria

-   All documented APIs exist in TypeScript definitions
-   Examples render without console errors
-   Interactive features work as described
-   Visual appearance matches documentation claims
-   Multi-donut examples show proper spacing and non-overlapping
-   Shared legend synchronization works correctly
-   Inner labels display with correct formatting
-   Documentation is complete and accurate for developer use

## Estimated Complexity

-   **High complexity areas**: Multi-donut radius calculations, shared legend synchronization
-   **Medium complexity**: Inner labels formatting, inner circle customization
-   **Low complexity**: Basic donut creation, standard interactions

## Delegation Plan for example-tester Agent

### Task 1: Validate simple-donut example

**Instructions for agent:**

-   Navigate to the simple-donut example
-   Verify it creates a basic donut chart with hollow center
-   Check that `calloutLabelKey: 'asset'` displays asset names as labels
-   Confirm `angleKey: 'amount'` creates proportional segments
-   Test hover interactions for tooltips
-   Verify legend displays and is interactive
-   Check for any console errors

### Task 2: Validate text-inside-donut example

**Instructions for agent:**

-   Navigate to the text-inside-donut example
-   Verify inner labels display "Total Investment" and "$100,000"
-   Check text formatting: bold for first line, 48px green text for second
-   Confirm 4px spacing between lines
-   Verify inner circle background is light green (#c9fdc9)
-   Test that inner text doesn't interfere with donut interactions
-   Check text remains centered at different viewport sizes

### Task 3: Validate multi-donut example

**Instructions for agent:**

-   Navigate to the multi-donut example
-   Verify two concentric donut rings render
-   Check outer ring thickness (should be thin - ratio 0.1)
-   Check inner ring thickness (should be thicker - ratio 0.4)
-   Confirm visible gap between rings
-   Verify titles "Previous Year" and "Current Year" appear
-   Check both series show in legend with titles
-   Test independent interaction with each ring

### Task 4: Validate multi-donut-shared example

**Instructions for agent:**

-   Navigate to the multi-donut-shared example
-   Verify two donut series render with same asset categories
-   Confirm only one set of legend items (no duplicates)
-   Test clicking legend items - should toggle segments in BOTH donuts
-   Verify second series respects `showInLegend: false`
-   Check synchronized toggling works correctly
-   Test all legend items for proper synchronization
