# Technical Review Plan: Formatters Documentation

## Page Analysis Summary

### Features Covered

-   **Global Formatter**: Chart-level callback for all textual elements
-   **Property Formatters**: Object-based formatters keyed by property (x, y, size, label, etc.)
-   **Format Strings**: Static time and number format specifications
-   **Inheritance and Precedence**: Formatter hierarchy and fallback behavior
-   **Parameter Types**: NumberFormatterParams, DateFormatterParams, CategoryFormatterParams

### Key APIs Documented

-   Chart-level `formatter` option (function or object)
-   Property-specific formatters: x, y, angle, radius, size, color, label, secondaryLabel, calloutLabel, sectorLabel
-   Format string directives:
    -   Time formats: strftime-style directives (e.g., `%Y-%m-%d`)
    -   Number formats: Python-style format specification (e.g., `#{0>6.2f}`)
-   Formatter parameters: type, value, source, property, context, seriesId, boundSeries, domain, datum
-   Date-specific parameters: unit, step, epoch

### Examples Referenced

1. **formatter**: Demonstrates property-based formatters for x, y, size, and label with conditional logic
2. **format-string**: Shows static format strings for time (`%b %Y`) and number (`$#{0>6.2f}`) formatting

### Interactive Features Described

-   Formatters apply to all chart elements: axes labels, tooltips, crosshairs, series labels
-   Conditional formatting based on `source` (e.g., different formats for axis vs tooltip)
-   Conditional formatting based on `unit` for date values
-   Inheritance from axis label formatters to tooltips/crosshairs when no chart formatter provided

## Validation Targets

### TypeScript Interfaces to Verify

1. **NumberFormatterParams** in `packages/ag-charts-types/src/chart/formatterOptions.ts`

    - Verify all documented properties exist
    - Check `type: 'number'` constraint
    - Validate value type and additional number-specific properties

2. **DateFormatterParams** in `packages/ag-charts-types/src/chart/formatterOptions.ts`

    - Verify date-specific properties: unit, step, epoch
    - Check `type: 'date'` constraint
    - Validate style options ('long' vs 'component')

3. **CategoryFormatterParams** in `packages/ag-charts-types/src/chart/formatterOptions.ts`

    - Verify `type: 'category'` constraint
    - Check value type variations (string | number | Date | string[])

4. **BaseFormatterParams** - Common properties inherited by all formatter types

    - Verify source, property, context, seriesId, boundSeries, domain, datum

5. **FormatterPropertyType** - Valid property keys for property-based formatters

### Implementation Files to Check

1. **Format Manager** (`packages/ag-charts-community/src/chart/format/formatManager.ts`)

    - Verify formatter inheritance and precedence logic
    - Check property formatter resolution
    - Validate fallback behavior when formatter returns undefined

2. **Number Format Parser** (`packages/ag-charts-community/src/util/numberFormat.ts`)

    - Verify Python-style format specification parsing
    - Validate all documented directives work correctly
    - Check #{} wrapping requirement for embedded formats

3. **Time Format Parser** (`packages/ag-charts-community/src/util/timeFormat.ts`)

    - Verify strftime-style directive implementation
    - Check padding modifiers (0, \_, -)
    - Validate locale-aware directives marked with asterisk

4. **Series Integration** - Check formatter usage in series implementations
    - Look for formatValue() usage in label classes
    - Verify property mapping to FormatterPropertyType

### Examples to Test (for example-tester agent)

#### 1. formatter Example

**Path**: `packages/ag-charts-website/src/content/docs/formatters/_examples/formatter/`

**Documentation Claims**:

-   x formatter uses conditional logic based on `unit` parameter (year vs full date)
-   y formatter adds " Mw" suffix to magnitude values
-   size formatter uses decimal formatting with no fractional digits
-   label formatter conditionally returns flag only for series labels (based on `source`)

**Expected Behaviors**:

-   X-axis labels should show years only
-   Tooltips should show full dates for x values
-   Y-axis and tooltip values should display with " Mw" suffix
-   Size values in tooltips should be whole numbers
-   Series labels should show flag values from data
-   Tooltip labels should show full information

**Specific Features to Test**:

-   Hover over data points to see tooltip formatting
-   Check axis label formatting matches expectations
-   Verify series labels display flag values
-   Confirm different formatting for same data based on context (axis vs tooltip)

#### 2. format-string Example

**Path**: `packages/ag-charts-website/src/content/docs/formatters/_examples/format-string/`

**Documentation Claims**:

-   x uses time format string `%b %Y` (abbreviated month + year)
-   y uses number format string `$#{0>6.2f}` (currency with zero-padding to 6 chars, 2 decimals)

**Expected Behaviors**:

-   X-axis should show dates as "Jan 2023", "Feb 2023", etc.
-   Y-axis values should show as "$000123.45" format (zero-padded to 6 characters)
-   Tooltips should inherit same formatting
-   No custom formatter functions, only static format strings

**Specific Features to Test**:

-   Verify time format rendering on x-axis
-   Check number format with zero-padding and currency symbol
-   Hover to verify tooltip formatting matches
-   Ensure no console errors from format string parsing

### User Interactions to Validate

1. **Tooltip Formatting**

    - Hover over various chart elements to verify formatter application
    - Check that all properties (x, y, size) are formatted in tooltips
    - Verify conditional formatting based on source works

2. **Axis Label Formatting**

    - Verify axis labels use appropriate formatters
    - Check that time axes respect unit-based formatting
    - Confirm number axes apply format strings correctly

3. **Series Label Formatting**

    - Verify series labels can use different formatting than tooltips
    - Check label property formatter is applied to series labels

4. **Crosshair Formatting**

    - Test crosshair label formatting matches axis formatting
    - Verify inheritance from axis formatter when no chart formatter

5. **Format String Edge Cases**
    - Test various number format combinations
    - Verify time format directives render correctly
    - Check that invalid format strings don't crash

### Visual States to Screenshot and Analyze

1. **Default Chart State**

    - Capture overall chart appearance
    - Document axis label formatting
    - Show series labels if visible

2. **Tooltip States**

    - Hover over different data points
    - Capture tooltip formatting for all properties
    - Show conditional formatting in action

3. **Different Formatter Contexts**

    - Axis labels vs tooltip values
    - Series labels vs tooltip labels
    - Demonstrate source-based conditional formatting

4. **Format String Results**
    - Time-formatted axes
    - Number-formatted axes with padding/currency
    - Tooltip inheritance of format strings

### Interactive Features Requiring Visual Comparison

1. **Conditional Formatting by Source**

    - Before: Axis label formatting
    - After: Tooltip formatting for same value
    - Demonstrate different formats for same data

2. **Unit-Based Date Formatting**

    - Year format on axis
    - Full date format in tooltip
    - Show how unit parameter affects output

3. **Property-Specific Formatters**
    - Each property (x, y, size, label) with its own format
    - Verify no cross-contamination between properties

### Chart Elements Expected to be Interactive

Based on documentation, these elements should respond to formatters:

-   **Axis labels**: Should use formatters for tick labels
-   **Tooltips**: Should format all displayed values
-   **Crosshairs**: Should inherit axis formatting
-   **Series labels**: Should use label property formatter
-   **Legend items**: May use formatters for value display

### Expected Tooltip Content and Behavior

1. **Multi-Property Formatting**

    - X value formatted according to x formatter
    - Y value formatted according to y formatter
    - Size value (if applicable) formatted with size formatter
    - Labels formatted with label formatter

2. **Inheritance Behavior**
    - If no chart formatter, tooltips inherit from axis formatters
    - Property formatters take precedence over general formatter
    - Undefined return values fall back to defaults

## Known Exceptions

No existing technical review exceptions file found for this page.

## Execution Plan

### Priority 1: API Contract Validation

1. **Verify TypeScript interfaces** match documentation

    - [ ] Check NumberFormatterParams properties
    - [ ] Check DateFormatterParams properties
    - [ ] Check CategoryFormatterParams properties
    - [ ] Verify FormatterPropertyType values
    - [ ] Confirm BaseFormatterParams common properties

2. **Validate implementation matches docs**
    - [ ] Check format string parsing (number and time)
    - [ ] Verify inheritance and precedence logic
    - [ ] Confirm property formatter resolution

### Priority 2: Example Testing (via example-tester agent)

1. **Test formatter example**

    - [ ] Delegate to example-tester with documentation expectations
    - [ ] Verify conditional formatting works
    - [ ] Check all property formatters apply correctly
    - [ ] Validate source-based logic

2. **Test format-string example**
    - [ ] Delegate to example-tester for format string validation
    - [ ] Verify time format directives work
    - [ ] Check number format with padding and currency
    - [ ] Ensure format strings are parsed correctly

### Priority 3: Interactive Testing and Screenshots

1. **Capture visual states**

    - [ ] Default chart appearance
    - [ ] Tooltip formatting examples
    - [ ] Axis label formatting
    - [ ] Series label formatting

2. **Test interactive behaviors**
    - [ ] Hover interactions for tooltips
    - [ ] Verify formatting in different contexts
    - [ ] Check inheritance behavior
    - [ ] Test edge cases and error handling

### Priority 4: Documentation Completeness

1. **Check coverage of features**

    - [ ] All formatter properties documented
    - [ ] Format string directives complete
    - [ ] Inheritance rules clear
    - [ ] Context parameters explained

2. **Verify accuracy of examples**
    - [ ] Code snippets syntactically correct
    - [ ] Configuration matches implementation
    - [ ] Expected behaviors achievable

## Success Criteria

-   All TypeScript interfaces match documented properties
-   Format string parsers support all documented directives
-   Examples demonstrate claimed functionality without errors
-   Formatters apply correctly to all chart elements
-   Inheritance and precedence work as documented
-   Visual formatting matches expected output
-   No console errors or warnings in examples
-   Interactive behaviors work smoothly

## Estimated Complexity

**Medium-High** - This page documents a core feature with multiple integration points, complex parameter types, and two different formatting systems (functions and format strings). The testing requires validating both API contracts and runtime behavior across various chart elements.
