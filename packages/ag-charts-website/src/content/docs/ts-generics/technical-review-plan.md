# Technical Review Plan: TypeScript Generics

## Page Analysis Summary

### Features Covered

-   TypeScript generic parameters for AG Charts configuration
-   `TData` generic parameter for type-safe data handling
-   `TContext` generic parameter for type-safe context objects
-   Type inference and compile-time validation benefits

### Key APIs and Configuration Options Documented

-   `AgChartOptions<TData, TContext>` generic interface
-   `AgCartesianChartOptions<TData, TContext>` for cartesian charts
-   Data array type safety with `TData`
-   Context object type safety with `TContext`
-   Key properties type validation (xKey, yKey, angleKey, legendItemKey)
-   Callback parameter type inference (itemStyler, formatter, renderer, action callbacks)

### Examples Referenced

1. **type-tdatum** - Demonstrates `TData` generic parameter

    - Shows pie chart with typed data (`MyDatumType`)
    - Demonstrates itemStyler callback with typed params.datum
    - Uses angleKey and legendItemKey with type safety
    - Example discrepancy: Documentation shows pie chart code but actual example uses bar chart

2. **type-tcontext** - Demonstrates `TContext` generic parameter
    - Shows candlestick chart with CurrencyConverter context
    - Demonstrates context usage in multiple callbacks:
        - Y-axis label formatter
        - Tooltip renderer
        - Context menu actions
    - Enterprise feature example

### Interactive Features Described

-   Type-safe callbacks with inferred parameter types
-   Context object passed to all callbacks
-   Compile-time validation of key properties
-   Auto-complete support in IDEs

## Validation Targets

### TypeScript Interfaces to Verify

1. `AgChartOptions<TDatum, TContext>` in `packages/ag-charts-types/src/chartBuilderOptions.ts`
2. `AgCartesianChartOptions<TDatum, TContext>` generic parameters
3. Default generic parameters: `TDatum = DatumDefault`, `TContext = ContextDefault`
4. Type definitions for `DatumDefault` and `ContextDefault`
5. Callback interfaces that receive typed parameters

### Implementation Files to Check

1. Chart creation methods that use generics:
    - `AgCharts.create<TDatum, TContext>()` implementation
2. Series property type validation for xKey, yKey, angleKey, legendItemKey
3. Callback parameter typing in:
    - itemStyler
    - formatter callbacks
    - tooltip renderer
    - context menu actions

### Examples to Test with Expected Behaviors

#### type-tdatum Example

**Documentation claims:**

-   Uses pie chart with angleKey and legendItemKey
-   itemStyler receives typed `params.datum` with region property
-   Compile-time type checking for data array elements
-   Type-safe switch statement on region values

**Expected behaviors to validate:**

-   Chart should render with typed data
-   itemStyler should apply colors based on region (AMER=red, APAC=blue, EMEA=green)
-   TypeScript should enforce correct data shape
-   No console errors or warnings
-   Auto-complete should work for datum properties in callbacks

**Actual implementation discrepancy:**

-   Example actually uses bar chart with xKey='country' and yKey='gdp', not pie chart
-   This mismatch needs to be flagged in the review

#### type-tcontext Example

**Documentation claims:**

-   Uses candlestick chart with CurrencyConverter context
-   Context passed to Y-axis label formatter
-   Context passed to tooltip renderer
-   Context passed to context menu actions
-   Shows conversion between USD and user-selected currency

**Expected behaviors to validate:**

-   Candlestick chart renders with stock data
-   Y-axis labels show converted currency values
-   Tooltips display both USD and converted currency
-   Context menu has 5 currency options (USD, EUR, GBP, JPY, INR)
-   Clicking context menu items logs converted values to console
-   Currency can be changed dynamically via chart.update()

### User Interactions to Validate

1. **type-tdatum example:**

    - Hover over bars to see tooltips
    - Check tooltip content shows correct data
    - Verify bar colors match documentation (red/blue/green by region)
    - Test keyboard navigation between bars

2. **type-tcontext example:**
    - Hover over candlesticks to see dual-currency tooltips
    - Right-click candlesticks to access context menu
    - Click each currency option and verify console output
    - Test dynamic currency switching
    - Verify Y-axis updates when currency changes

### Visual States to Screenshot and Analyze

1. **type-tdatum:**

    - Default chart rendering with colored bars
    - Tooltip showing on bar hover
    - Focus state during keyboard navigation
    - Mobile responsive view

2. **type-tcontext:**
    - Default candlestick chart view
    - Tooltip showing dual currencies
    - Context menu opened
    - Y-axis labels in different currencies
    - Chart after currency switch

### Interactive Features Requiring Before/After Visual Comparison

1. Currency switching in type-tcontext example
2. Tooltip appearance/disappearance on hover
3. Context menu opening/closing
4. Focus states during keyboard navigation

### Chart Elements That Should Be Interactive

1. **type-tdatum:**

    - Bars should respond to hover with tooltips
    - Bars should be keyboard navigable
    - Legend items (if present) should be interactive

2. **type-tcontext:**
    - Candlesticks should show tooltips on hover
    - Right-click should open context menu
    - Context menu items should be clickable
    - Chart should update when context changes

### Expected Tooltip Content and Highlighting Behaviors

1. **type-tdatum:**

    - Tooltips should show country name and GDP value
    - Hovered bar should be highlighted

2. **type-tcontext:**
    - Tooltips should show OHLC values in both currencies
    - Tooltips should use formatBothCurrencies from context
    - Hovered candlestick should be highlighted

## Known Exceptions

No existing technical-review-exceptions.md file found for this page.

## Execution Plan

### Priority 1: Critical Documentation Accuracy

1. Verify pie vs bar chart discrepancy in type-tdatum example
2. Validate TypeScript generic parameter syntax and defaults
3. Confirm generic type inference works as documented
4. Test compile-time type checking actually prevents errors

### Priority 2: Example Functionality

1. Delegate type-tdatum example testing to example-tester agent
    - Provide expected pie chart behavior from docs
    - Note actual bar chart implementation
    - Check for type safety in callbacks
2. Delegate type-tcontext example testing to example-tester agent
    - Verify candlestick rendering
    - Test context object propagation
    - Validate currency conversion functionality

### Priority 3: Interactive Features

1. Test all hover interactions with screenshots
2. Verify context menu functionality
3. Test keyboard navigation
4. Validate responsive behavior

### Priority 4: Visual Validation

1. Capture screenshots of all interactive states
2. Verify visual feedback matches documentation
3. Test edge cases and error states
4. Check mobile/tablet views

### Success Criteria

-   All TypeScript types exist and match documentation
-   Generic parameters provide actual type safety
-   Examples demonstrate the documented features
-   No console errors during interactions
-   Visual states match described behaviors
-   Context object works across all callbacks

### Estimated Complexity

-   High complexity due to TypeScript type system validation
-   Multiple callback types to verify
-   Enterprise features in second example
-   Significant discrepancy between documented and actual example code
