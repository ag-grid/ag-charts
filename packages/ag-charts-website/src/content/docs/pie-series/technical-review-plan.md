# Technical Review Plan: Pie Series Documentation

## Page Analysis Summary

### Chart Types/Features Covered

-   Basic Pie charts
-   Pie chart labels (callout labels and sector labels)
-   Variable sector radius (Rose charts)
-   Label customization including formatters
-   Legend integration

### Key APIs and Configuration Options Documented

-   `series[].type: 'pie'` - Series type configuration
-   `angleKey` - Required key for determining sector angles
-   `legendItemKey` - Optional key for legend item names
-   `calloutLabelKey` - Key for callout labels
-   `sectorLabelKey` - Key for sector labels
-   `radiusKey` - Key for variable radius (Rose charts)
-   `calloutLabel` configuration object with `minAngle` property
-   `sectorLabel` configuration object with styling (color, fontWeight)
-   Label formatters: `calloutLabel.formatter` and `sectorLabel.formatter`

### Examples Referenced

1. **simple-pie** - Basic pie chart demonstrating angleKey and legendItemKey
2. **pie-labels** - Pie chart with both callout and sector labels
3. **sector-radius** - Rose chart with variable radius sectors

### Interactive Features Described

-   Tooltips (mentioned in context of calloutLabelKey)
-   Legend interaction (implied through legendItemKey)
-   Label visibility based on sector value and angle

## Validation Targets

### TypeScript Interfaces to Verify

-   `AgPieSeriesOptions` in `/packages/ag-charts-types/src/series/polar/pieOptions.ts`
-   `AgPieSeriesLabelOptions` for callout label configuration
-   `AgPieSeriesSectorLabelOptions` for sector label configuration
-   `AgPieSeriesCalloutOptions` for callout line configuration

### Implementation Files to Check

-   `/packages/ag-charts-community/src/chart/series/polar/pieSeries.ts` - Main implementation
-   Check for default values, especially:
    -   Default behavior for `calloutLabel.minAngle`
    -   Default visibility of labels for sectors with value 0
    -   Label formatter implementation

### Examples to Test

#### 1. simple-pie

**Documentation claims:**

-   Uses `angleKey: 'amount'` to determine sector angles
-   Uses `legendItemKey: 'amount'` for legend names
-   Should display proportional slices based on amount values

**Expected behaviors:**

-   Chart renders with sectors proportional to data values
-   Legend shows values from the 'amount' field
-   Tooltips should work (as implied by framework features)
-   No labels should be visible (neither callout nor sector)

**Specific validations for example-tester:**

-   Verify pie chart renders correctly
-   Check that no console errors occur
-   Validate data binding works with angleKey
-   Confirm legend displays correct values
-   Test hover interactions for tooltips

#### 2. pie-labels

**Documentation claims:**

-   `calloutLabelKey: 'asset'` shows asset names as callout labels
-   `sectorLabelKey: 'amount'` shows amounts inside sectors
-   Sector labels styled with white color and bold font weight
-   Callout labels also used in legend (when no legendItemKey provided) and tooltips

**Expected behaviors:**

-   Callout labels visible outside sectors connected by lines
-   Sector labels visible inside sectors with white, bold text
-   Legend should use 'asset' values (from calloutLabelKey)
-   Tooltips should display asset information
-   Labels for sectors with value 0 should NOT be displayed by default

**Specific validations for example-tester:**

-   Verify both label types render correctly
-   Check label styling (white, bold for sector labels)
-   Validate callout lines connect to sectors
-   Test that legend uses calloutLabelKey values
-   Verify tooltip content includes asset information
-   Check zero-value sector behavior

#### 3. sector-radius

**Documentation claims:**

-   `radiusKey: 'yield'` varies sector radius based on yield values
-   This creates a "Rose Chart" visualization
-   Still uses `angleKey: 'amount'` for angles
-   Uses `calloutLabelKey: 'asset'` for labels

**Expected behaviors:**

-   Sectors should have different radii based on 'yield' values
-   Angles still determined by 'amount' values
-   Callout labels should show 'asset' names
-   Chart should visually appear as a rose chart (varying radii)

**Specific validations for example-tester:**

-   Verify variable radius rendering
-   Check that radiusKey data binding works
-   Validate visual appearance as rose chart
-   Confirm callout labels display correctly
-   Test hover interactions and tooltips

### User Interactions to Validate

1. **Hover interactions:**

    - Hover over pie sectors to trigger tooltips
    - Hover over legend items to highlight corresponding sectors
    - Hover over labels to check for any interactions

2. **Click interactions:**

    - Click on sectors to test selection behavior
    - Click on legend items for toggle behavior
    - Click on labels to verify no unexpected behavior

3. **Visual states to capture:**
    - Default rendering state
    - Hover state with tooltip visible
    - Legend item hover highlighting
    - Mobile/responsive views
    - Focus states for keyboard navigation

### Interactive Features Requiring Visual Comparison

-   Tooltip positioning and content
-   Sector highlighting on hover
-   Legend-sector synchronization
-   Label positioning and callout line rendering
-   Rose chart radius variations

### Chart Elements That Should Be Interactive

Based on documentation and AG Charts conventions:

-   Pie sectors (hover for tooltips, click for selection)
-   Legend items (hover for highlighting, click for toggle)
-   Chart container (for general interactions)

### Expected Tooltip Content and Highlighting

-   Tooltips should show data based on configured keys
-   Sector highlighting on hover (visual feedback)
-   Legend item highlighting synchronized with sectors

## Known Exceptions

No technical-review-exceptions.md file exists for this page, so no known exceptions to consider.

## Execution Plan

### Priority 1: Core API Validation

1. Verify TypeScript interface matches documentation
2. Check implementation for documented default behaviors
3. Validate required vs optional properties
4. Cross-reference property types and descriptions

### Priority 2: Example Testing with example-tester

1. Test simple-pie example:

    - Basic rendering and data binding
    - Legend functionality
    - Tooltip behavior
    - Console error checking

2. Test pie-labels example:

    - Both label types rendering
    - Label styling validation
    - Zero-value sector behavior
    - Legend using calloutLabelKey

3. Test sector-radius example:
    - Rose chart rendering
    - Variable radius functionality
    - Label and tooltip behavior

### Priority 3: Interactive Testing

1. Systematic hover testing over all chart elements
2. Click interaction validation
3. Keyboard navigation testing
4. Responsive behavior verification
5. Screenshot capture for all states

### Priority 4: Content Completeness

1. Verify all major configuration options are covered
2. Check for missing documentation on common use cases
3. Validate cross-references to related features
4. Ensure API reference section is complete

### Success Criteria

-   All documented APIs exist and work as described
-   Examples demonstrate claimed features without errors
-   Interactive behaviors match documentation
-   No console errors or warnings
-   Visual rendering matches descriptions
-   Labels behave according to documented rules
-   Rose chart functionality works correctly

### Estimated Complexity

-   **High complexity areas:**
    -   Label formatter validation (need to test custom functions)
    -   Zero-value sector behavior
    -   Rose chart radius calculations
-   **Medium complexity:**

    -   Basic configuration validation
    -   Interactive behavior testing
    -   Visual state verification

-   **Low complexity:**
    -   API presence verification
    -   Basic example rendering
    -   Screenshot capture

## Delegation Plan for example-tester Agent

### Example 1: simple-pie

**Instructions for agent:**

-   Navigate to the simple-pie example
-   Verify pie chart renders with proper sectors based on 'amount' values
-   Check that legend displays values from 'amount' field
-   Test hover interactions on sectors for tooltip display
-   Validate no console errors or warnings
-   Confirm basic AG Charts API usage follows best practices
-   Check TypeScript types if available

### Example 2: pie-labels

**Instructions for agent:**

-   Navigate to the pie-labels example
-   Verify both callout and sector labels render correctly
-   Validate sector labels have white color and bold font weight
-   Check that callout lines connect labels to sectors properly
-   Confirm legend uses 'asset' values (from calloutLabelKey)
-   Test that sectors with value 0 don't show labels
-   Validate tooltip content includes asset information
-   Check for console errors and API usage patterns

### Example 3: sector-radius

**Instructions for agent:**

-   Navigate to the sector-radius example
-   Verify rose chart renders with variable radius sectors
-   Check that radius varies based on 'yield' values
-   Confirm angles still based on 'amount' values
-   Validate callout labels show 'asset' names
-   Test interactive behaviors and tooltips
-   Ensure no rendering issues or console errors
-   Validate the visual appearance clearly shows radius variation
