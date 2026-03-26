# Technical Review Plan: Range Bar Series

## Page Analysis Summary

### Chart Type and Features Covered

-   **Range Bar Series**: Enterprise feature for displaying data ranges using vertical or horizontal bars
-   **Key features documented**:
    -   Simple range bars with low/high values
    -   Multiple range bar series combinations
    -   Missing data handling
    -   Label customization with formatters
    -   Corner radius styling
    -   Horizontal orientation
    -   Tooltip and legend name customization

### Key APIs and Configuration Options

-   **Essential properties**:
    -   `type: 'range-bar'` (series type identifier)
    -   `xKey`: Category/time axis key
    -   `yLowKey`: Low value key for range
    -   `yHighKey`: High value key for range
    -   `direction`: 'vertical' (default) or 'horizontal'
-   **Customization properties**:
    -   `xName`, `yName`, `yLowName`, `yHighName`: Human-readable names for tooltips/legends
    -   `label`: Label configuration with placement, spacing, and formatter
    -   `cornerRadius`: Rounded corner styling
    -   `grouped`: Bar grouping behavior (mentioned in TypeScript but not in docs)

### Examples Referenced

1. **simple-range-bar**: Basic range bar implementation
2. **multiple-range-bars**: Multiple series with custom names
3. **range-bar-missing-data**: Missing/invalid data handling
4. **range-bar-labels**: Label formatting with itemType differentiation
5. **customising-corner-radius**: Corner radius styling
6. **horizontal-range-bar**: Horizontal orientation
7. **multiple-horizontal-range-bars**: (Found in examples but not referenced in docs)

### Interactive Features Described

-   Tooltips showing range values with custom names
-   Legend interaction for multi-series charts
-   Label display on bars with custom formatting
-   Missing data gap handling

## Validation Targets

### TypeScript Interface Verification

-   **Primary interface**: `AgRangeBarSeriesOptions` in `packages/ag-charts-types/src/series/cartesian/rangeBarOptions.ts`
-   **Key validations**:
    -   Verify all documented properties exist in interface
    -   Check property types match documentation
    -   Validate optional vs required properties
    -   Confirm enterprise-only status
    -   Check for undocumented properties (e.g., `grouped`, `shadow`, `itemStyler`, `highlight`)

### Implementation File Checks

-   **Main implementation**: `packages/ag-charts-enterprise/src/series/range-bar/rangeBarSeries.ts`
-   **Properties file**: `packages/ag-charts-enterprise/src/series/range-bar/rangeBarProperties.ts`
-   **Validations**:
    -   Default values for all properties
    -   Direction behavior implementation
    -   Label placement logic (inside/outside)
    -   Missing data handling implementation
    -   Corner radius rendering
    -   Grouped bar behavior

### Example Testing Requirements

#### 1. simple-range-bar

-   **Documentation claims**: Basic range bar with department categories and low/high values
-   **Expected behaviors**:
    -   Vertical bars showing range between low and high values
    -   Default tooltips showing values
    -   No labels by default
    -   Square corners (no radius)
-   **Validation tasks for example-tester**:
    -   Verify chart renders with correct data binding
    -   Check tooltip content shows low/high values
    -   Confirm no console errors
    -   Validate AG Charts API usage

#### 2. multiple-range-bars

-   **Documentation claims**:
    -   Multiple series with gain/loss visualization
    -   Custom names for legend (`yName`)
    -   Custom names for tooltips (`yLowName`, `yHighName`, `xName`)
-   **Expected behaviors**:
    -   Two range bar series rendered together
    -   Legend shows "Gained" and "Lost" entries
    -   Tooltips show custom names for values
    -   Series can be toggled via legend
-   **Validation tasks for example-tester**:
    -   Verify both series render correctly
    -   Check legend text matches yName values
    -   Validate tooltip content uses custom names
    -   Test legend click interaction

#### 3. range-bar-missing-data

-   **Documentation claims**:
    -   Handles missing/invalid data with gaps
    -   Invalid values: +/-Infinity, null, undefined, NaN
    -   Applies to continuous axes (number, time, log)
-   **Expected behaviors**:
    -   Gaps in series where data is invalid
    -   No rendering errors for missing data
    -   Valid data points still render correctly
-   **Validation tasks for example-tester**:
    -   Verify gaps appear for invalid data
    -   Check no console errors for missing data
    -   Confirm valid data renders properly
    -   Test different invalid value types

#### 4. range-bar-labels

-   **Documentation claims**:
    -   Labels show both yHighKey and yLowKey values
    -   Formatter receives itemType to distinguish low/high
    -   Padding configuration works
    -   Currency formatting with directional arrows
-   **Expected behaviors**:
    -   Labels appear on both ends of bars
    -   Formatter correctly identifies low vs high
    -   Padding spacing is applied
    -   Formatted text displays correctly
-   **Validation tasks for example-tester**:
    -   Verify labels appear on bars
    -   Check formatter logic with itemType
    -   Validate padding visual effect
    -   Confirm formatted strings render

#### 5. customising-corner-radius

-   **Documentation claims**: Corner radius can be set to 10
-   **Expected behaviors**:
    -   Bars have rounded corners
    -   Radius applies to all four corners
    -   Visual appearance is smooth
-   **Validation tasks for example-tester**:
    -   Verify rounded corners render
    -   Check radius value is applied
    -   Validate no rendering artifacts

#### 6. horizontal-range-bar

-   **Documentation claims**:
    -   Direction: 'horizontal' swaps axes
    -   xKey determines categories on y-axis
    -   yLowKey/yHighKey provide values on x-axis
-   **Expected behaviors**:
    -   Bars render horizontally
    -   Categories appear on vertical axis
    -   Values appear on horizontal axis
    -   Tooltips work correctly
-   **Validation tasks for example-tester**:
    -   Verify horizontal orientation
    -   Check axis assignments are correct
    -   Validate tooltip behavior
    -   Test data binding in horizontal mode

#### 7. multiple-horizontal-range-bars (undocumented example)

-   **Expected behaviors**:
    -   Multiple horizontal series work together
    -   Similar to multiple vertical bars but horizontal
-   **Validation tasks for example-tester**:
    -   Check if example exists and works
    -   Note as potential documentation gap

### User Interaction Tests

1. **Tooltip interactions**:

    - Hover over bar segments to trigger tooltips
    - Verify tooltip positioning at bar edges
    - Check tooltip content matches documentation
    - Test tooltip behavior with custom names

2. **Legend interactions** (for multiple series):

    - Click legend items to toggle series
    - Hover over legend for highlighting
    - Verify legend text matches yName

3. **Label interactions**:

    - Check labels don't interfere with tooltips
    - Verify label positioning (inside/outside)
    - Test label visibility on small bars

4. **Canvas-based interactions**:
    - Systematic hovering across bar areas
    - Click interactions on bars
    - Keyboard navigation support
    - Edge case behaviors (resize, zoom)

### Visual States to Capture

1. **Default rendering**:

    - Simple range bar appearance
    - Multiple series layout
    - Horizontal orientation

2. **Interactive states**:

    - Tooltip display on hover
    - Legend hover highlighting
    - Series toggle states

3. **Styled states**:

    - Corner radius appearance
    - Label positioning and formatting
    - Missing data gaps

4. **Responsive behavior**:
    - Different viewport sizes
    - Label overflow handling
    - Axis label rotation

## Known Exceptions

-   No technical-review-exceptions.md file exists for this page
-   No documented exceptions to consider

## Execution Plan

### Priority 1: API Contract Validation

1. **Cross-reference TypeScript interface** with documented properties
2. **Check for undocumented properties** in interface (grouped, shadow, etc.)
3. **Verify property types and optionality**
4. **Confirm enterprise-only designation**

### Priority 2: Core Example Testing

1. **Simple range bar example**:

    - Delegate to example-tester for basic functionality
    - Screenshot default state
    - Test tooltips and basic interactions

2. **Multiple range bars example**:

    - Validate legend and tooltip customization
    - Test series toggling
    - Screenshot multi-series layout

3. **Horizontal range bar example**:
    - Verify axis orientation swap
    - Test horizontal-specific behaviors
    - Compare with vertical equivalent

### Priority 3: Feature-Specific Examples

1. **Missing data handling**:

    - Validate gap rendering
    - Test all invalid data types
    - Screenshot gap visualization

2. **Label customization**:

    - Verify formatter with itemType
    - Test label positioning
    - Check padding effect

3. **Corner radius styling**:
    - Validate visual appearance
    - Check rendering quality
    - Screenshot styled bars

### Priority 4: Comprehensive Interaction Testing

1. **Fuzz testing all examples**:

    - Systematic hover patterns
    - Rapid interactions
    - Edge case behaviors
    - Keyboard navigation

2. **Visual regression capture**:
    - All examples in multiple states
    - Different viewport sizes
    - Error conditions

### Priority 5: Documentation Gaps

1. **Check for undocumented features** from TypeScript
2. **Verify all examples are documented**
3. **Look for missing configuration options**
4. **Assess completeness of API reference**

## Success Criteria

-   All documented APIs exist and work as described
-   Examples demonstrate claimed features accurately
-   No console errors in any example
-   Tooltips and legends show correct custom names
-   Missing data creates visible gaps
-   Labels format correctly with itemType
-   Corner radius renders smoothly
-   Horizontal orientation swaps axes properly
-   All interactive features work reliably
-   Documentation is complete and accurate

## Delegation Plan for example-tester Agent

### General Instructions

-   Focus on technical correctness and API usage
-   Verify chart rendering matches documentation claims
-   Check for console errors or warnings
-   Validate TypeScript usage and type safety
-   Report any deviations from documented behavior

### Per-Example Testing Matrix

| Example                        | Key Validation Points                      | Expected Behaviors                      |
| ------------------------------ | ------------------------------------------ | --------------------------------------- |
| simple-range-bar               | Basic API usage, data binding              | Vertical bars, tooltips work, no labels |
| multiple-range-bars            | Legend names, tooltip names, series toggle | Custom names in UI, series interaction  |
| range-bar-missing-data         | Gap handling, error resilience             | Visible gaps, no crashes                |
| range-bar-labels               | Formatter logic, itemType usage            | Labels on bars, correct formatting      |
| customising-corner-radius      | Visual styling                             | Rounded corners render                  |
| horizontal-range-bar           | Axis orientation                           | Horizontal bars, swapped axes           |
| multiple-horizontal-range-bars | Multi-series horizontal                    | Similar to vertical but horizontal      |

### Specific Testing Focus

1. **Data binding validation**: Ensure xKey, yLowKey, yHighKey work correctly
2. **Name property effects**: Verify xName, yName, yLowName, yHighName appear in UI
3. **Configuration accuracy**: Check all options work as documented
4. **Edge case handling**: Test with extreme values, empty data, etc.
5. **Best practices**: Validate examples follow AG Charts patterns
