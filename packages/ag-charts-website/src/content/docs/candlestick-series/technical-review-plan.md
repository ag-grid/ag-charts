# Technical Review Plan: Candlestick Series

## Page Analysis Summary

### Chart Types/Features Covered

-   Candlestick series (enterprise feature)
-   OHLC (Open, High, Low, Close) data visualization
-   Up/down item differentiation based on open/close values
-   Wick and bar customization

### Key APIs and Configuration Options Documented

-   Series type: `'candlestick'`
-   Data mapping keys: `xKey`, `lowKey`, `openKey`, `closeKey`, `highKey`
-   Item customization: `item.up` and `item.down` configurations
-   Wick customization: `item.up.wick` and `item.down.wick`
-   Styling properties: `fill`, `stroke`, `strokeWidth`

### Examples Referenced and Their Purposes

1. **simple-candlestick**: Demonstrates basic candlestick chart setup with minimal configuration
2. **candlestick-customisations**: Shows advanced styling with transparent up bars, custom colors, and wick width customization

### Interactive Features Described

-   The documentation doesn't explicitly describe interactive features, but candlestick charts typically support:
    -   Tooltips showing OHLC values
    -   Hover highlighting
    -   Legend interaction (if legend is shown)
    -   Crosshair support (shown in customisations example)

## Validation Targets

### Specific TypeScript Interfaces to Verify

-   `AgCandlestickSeriesOptions` in `packages/ag-charts-types/src/series/cartesian/candlestickOptions.ts`
-   `AgCandlestickSeriesItem` and related interfaces
-   `AgCandlestickSeriesItemOptions` with `wick` property
-   `AgOhlcSeriesBaseOptions` for inherited properties
-   Verify that `type: 'candlestick'` is properly typed

### Implementation Files to Check

-   `packages/ag-charts-enterprise/src/series/candlestick/candlestickSeries.ts`
-   `packages/ag-charts-enterprise/src/series/candlestick/candlestickSeriesProperties.ts`
-   Verify enterprise-only feature flag implementation
-   Check default values for styling properties
-   Validate up/down determination logic (close > open = up, close < open = down)

### Examples to Test with Expected Behaviors

#### simple-candlestick

**Documentation claims:**

-   Shows basic candlestick chart with S&P 500 data
-   Uses minimal configuration with just data keys
-   Should display bars for open/close and wicks for high/low

**Expected behaviors to validate:**

-   Chart renders with candlestick bars and wicks
-   Default styling applied (need to verify default colors)
-   Tooltips show all OHLC values when hovering over candlesticks
-   X-axis shows dates, Y-axis shows price values
-   Title "S&P 500 Index" and subtitle "Daily High and Low Prices" displayed
-   Footnote "1 Aug 2023 - 1 Nov 2023" shown

**example-tester validation points:**

-   Verify `type: 'candlestick'` is correctly set
-   Check all required keys are mapped: `xKey`, `lowKey`, `openKey`, `closeKey`, `highKey`
-   Confirm enterprise import is used
-   No console errors or warnings
-   Data binding works correctly

#### candlestick-customisations

**Documentation claims:**

-   Demonstrates custom styling for up/down items
-   Up items: transparent fill, custom stroke color (#2b5c95 in code, #5090dc in docs - discrepancy!)
-   Down items: filled with custom color
-   Wick strokeWidth set to 2 for both up and down

**Expected behaviors to validate:**

-   Up candlesticks have transparent body (hollow bars)
-   Down candlesticks have filled body
-   Wicks have increased strokeWidth (2px)
-   Custom colors applied correctly
-   Ordinal-time axis with time formatting ('%H:%M')
-   Right-positioned number axis with locale formatting
-   Crosshair with formatted labels
-   Title "Dow Jones Industrial Average" and subtitle "Candlestick Patterns"

**example-tester validation points:**

-   Verify `item.up` and `item.down` configuration structure
-   Check `wick` property within up/down objects
-   Validate axes configuration (not mentioned in docs but present in example)
-   Confirm styling is applied correctly
-   Check for any TypeScript type issues

### User Interactions to Validate

1. **Hover interactions:**

    - Hover over individual candlesticks to trigger tooltips
    - Verify tooltip shows open, close, high, low values
    - Check highlight effect on hovered candlestick
    - Test hover on both up and down candlesticks

2. **Crosshair behavior (in customisations example):**

    - Verify crosshair follows mouse movement
    - Check crosshair label formatting

3. **Edge cases:**
    - Hover at candlestick boundaries (edges of bars and wicks)
    - Test with candlesticks where open equals close (doji pattern)
    - Rapid mouse movement across multiple candlesticks
    - Window resize behavior

### Visual States to Screenshot and Analyze

1. **Default state screenshots:**

    - Full chart view for both examples
    - Close-up of individual candlesticks showing up/down styling

2. **Interactive state screenshots:**

    - Tooltip display when hovering over candlestick
    - Highlight effect on hovered item
    - Crosshair display (customisations example)

3. **Responsive screenshots:**
    - Desktop view (default)
    - Mobile view to check responsiveness
    - Chart behavior at different viewport sizes

### Interactive Features Requiring Before/After Visual Comparison

-   Before/after hover to show highlight effect
-   Tooltip appearance/disappearance
-   Crosshair movement across chart

### Chart Elements That Should Be Interactive

Based on typical candlestick chart behavior:

-   Individual candlestick bars and wicks (hover for tooltips)
-   Chart background (for crosshair in customisations example)
-   Legend items (if legend is shown - need to verify)

### Expected Tooltip Content and Highlighting Behaviors

-   Tooltip should display:
    -   Date/time (x value)
    -   Open value
    -   Close value
    -   High value
    -   Low value
    -   Proper formatting based on data types
-   Highlighting should emphasize the hovered candlestick (need to verify exact visual effect)

## Known Exceptions

No technical review exceptions file found for this page.

## Execution Plan

### Priority 1: Critical Accuracy Checks

1. **TypeScript API validation**

    - Verify `AgCandlestickSeriesOptions` interface matches documentation
    - Check that all documented properties exist and have correct types
    - Validate `item.up`, `item.down`, and `wick` property structures
    - Confirm `type: 'candlestick'` is properly typed

2. **Enterprise feature verification**

    - Confirm candlestick is enterprise-only
    - Verify examples use correct import from 'ag-charts-enterprise'

3. **Code snippet accuracy**
    - Validate the configuration snippet in documentation matches actual API
    - Check for any property name discrepancies (e.g., stroke color mismatch between docs and example)

### Priority 2: Example Validation (Delegate to example-tester)

1. **Simple candlestick example**

    - Provide agent with expected minimal configuration behavior
    - Verify default styling and rendering
    - Check tooltip functionality

2. **Customisations example**
    - Provide agent with detailed styling expectations
    - Verify up/down item differentiation
    - Validate wick customization
    - Check additional features (axes, crosshair) not mentioned in docs

### Priority 3: Visual and Interactive Testing

1. **Screenshot capture**

    - Default states of both examples
    - Interactive states (tooltips, hover effects)
    - Responsive behavior

2. **Interaction testing**
    - Systematic hover testing across candlesticks
    - Edge case interactions
    - Keyboard navigation (if supported)

### Priority 4: Content Completeness

1. **Missing documentation**

    - Axes configuration (present in example but not documented)
    - Default styling values
    - Tooltip configuration options
    - Legend behavior
    - Accessibility features

2. **API reference completeness**
    - Verify all properties shown in examples are documented
    - Check for undocumented but useful properties

### Success Criteria

-   All documented APIs exist and work as described
-   Examples demonstrate exactly what documentation claims
-   No console errors or warnings
-   Interactive features work smoothly
-   Visual rendering matches descriptions
-   Enterprise-only nature is clear

### Estimated Complexity/Time

-   High complexity due to:
    -   OHLC data visualization specifics
    -   Up/down logic verification
    -   Enterprise feature validation
    -   Multiple customization options
-   Estimated time: 45-60 minutes for thorough review
