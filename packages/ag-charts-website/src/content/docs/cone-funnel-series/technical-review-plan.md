# Technical Review Plan: Cone Funnel Series

## Page Analysis Summary

### Chart Type Coverage

-   **Primary Chart Type**: Cone Funnel Series (`type: 'cone-funnel'`)
-   **Description**: Shows the change of a value over a set of processes, with lines representing values at each stage and filled areas denoting changes

### Key APIs and Configuration Options Documented

1. **Core Properties**:

    - `stageKey`: Defines stages for the lines of the cone funnel
    - `valueKey`: Provides numerical values determining line width
    - `direction`: Controls orientation ('horizontal' or 'vertical')
    - `fills`: Array for customizing drop-off area colors

2. **API Reference**:
    - Points to `AgConeFunnelSeriesOptions` interface

### Examples Referenced

1. **simple-cone-funnel**: Basic cone funnel chart showing conversion drop off
2. **horizontal-cone-funnel**: Demonstrates horizontal orientation
3. **cone-funnel-fills**: Shows customization of fills and reversed data order

### Interactive Features Described

-   Implied standard chart interactions (tooltips, hover states)
-   No specific interactive features explicitly documented

## Validation Targets

### TypeScript Interface Verification

1. **Primary Interface**: `AgConeFunnelSeriesOptions` in `/packages/ag-charts-types/src/series/cartesian/coneFunnelOptions.ts`

    - Verify `stageKey` and `valueKey` properties exist and are required
    - Confirm `direction` property with 'horizontal' | 'vertical' options
    - Check `fills` property type (should be `AgColorType[]`)
    - Verify `type: 'cone-funnel'` is correctly defined

2. **Related Interfaces**:
    - `AgConeFunnelSeriesLabelOptions`: Label configuration
    - `AgConeFunnelSeriesStageLabelOptions`: Stage label configuration
    - `AgConeFunnelSeriesThemeableOptions`: Theming options including fills, strokes, opacity

### Implementation Files to Check

1. Core implementation in community/enterprise packages:
    - Search for cone funnel series implementation files
    - Verify default values and behaviors
    - Check if this is an enterprise-only feature (imported from 'ag-charts-enterprise')

### Examples Testing Matrix

#### 1. simple-cone-funnel

**Documentation Claims**:

-   Shows a basic cone funnel chart
-   Uses `stageKey: 'group'` and `valueKey: 'value'`
-   Title: "Conversion Drop Off"

**Expected Behaviors for example-tester**:

-   Chart renders with cone/funnel shape
-   Lines represent stages from data
-   Filled areas between lines show drop-off
-   Tooltips show stage and value information
-   No console errors or warnings
-   Proper TypeScript typing with `AgChartOptions`

#### 2. horizontal-cone-funnel

**Documentation Claims**:

-   Creates horizontal cone funnel by setting `direction: 'horizontal'`

**Expected Behaviors for example-tester**:

-   Chart renders horizontally (left-to-right or right-to-left)
-   Same funnel behavior but rotated 90 degrees
-   All interactions work in horizontal orientation
-   Proper axis and label positioning for horizontal layout

#### 3. cone-funnel-fills

**Documentation Claims**:

-   Customizes fills using `fills: ["#5090DC", "#FFA03A", "#459D55"]`
-   Series is reversed by providing data items in reverse order

**Expected Behaviors for example-tester**:

-   Drop-off areas use the specified colors in order
-   Data reversal is visually apparent (widest at bottom/right)
-   Colors cycle through the fills array as specified
-   All three colors should be visible if there are enough drop-offs

### User Interaction Tests

#### Visual States to Capture

1. **Default rendering**:

    - Full chart view showing all stages and drop-offs
    - Verify cone/funnel shape is clear and correct

2. **Hover interactions**:

    - Hover over drop-off areas (filled regions)
    - Hover over stage lines/boundaries
    - Capture tooltip content and positioning
    - Check for highlighting or visual feedback

3. **Responsive behavior**:

    - Desktop, tablet, and mobile viewport sizes
    - Verify labels and stages adjust appropriately

4. **Edge cases**:
    - Very small or very large values
    - Single stage (edge case)
    - Many stages (10+)

### Known Exceptions

-   No technical-review-exceptions.md file exists for this page

## Execution Plan

### Priority 1: Core Functionality Validation

1. **TypeScript Interface Validation** (15 min)

    - Verify all documented properties in `AgConeFunnelSeriesOptions`
    - Check property types and requirements
    - Confirm enterprise vs community availability

2. **Basic Example Testing** (20 min)
    - Deploy example-tester agent for simple-cone-funnel
    - Verify chart renders as cone/funnel shape
    - Check data binding with stageKey/valueKey
    - Capture default state screenshot

### Priority 2: Feature-Specific Testing

3. **Direction Property Testing** (15 min)

    - Deploy example-tester agent for horizontal-cone-funnel
    - Verify horizontal orientation works correctly
    - Compare visual layout with vertical version
    - Check label and axis positioning

4. **Customization Testing** (15 min)
    - Deploy example-tester agent for cone-funnel-fills
    - Verify fills array customization
    - Confirm data reversal visualization
    - Check color cycling behavior

### Priority 3: Interactive and Visual Testing

5. **Comprehensive Interaction Testing** (25 min)

    - Systematic hover testing over all chart elements
    - Tooltip content validation
    - Keyboard navigation testing
    - Edge case interaction scenarios

6. **Visual Documentation Accuracy** (15 min)
    - Screenshot all examples in multiple states
    - Verify visual appearance matches documentation
    - Check responsive behavior across viewports

### Priority 4: Documentation Completeness

7. **API Coverage Check** (10 min)

    - Compare documented properties with full TypeScript interface
    - Identify any undocumented but important options
    - Check for missing configuration examples

8. **Implementation Details Verification** (10 min)
    - Verify default values for all properties
    - Check for any behavior nuances not documented
    - Confirm enterprise/community feature split

## Success Criteria

### Must Pass

-   All three examples render without console errors
-   TypeScript interfaces match documented properties
-   Core functionality (stageKey, valueKey) works as described
-   Direction property correctly changes orientation
-   Fills customization applies colors as documented

### Should Pass

-   Tooltips display appropriate information
-   Hover states provide visual feedback
-   Examples demonstrate all documented features
-   Responsive behavior is acceptable

### Nice to Have

-   Documentation covers all available options
-   Examples show diverse use cases
-   Interactive features are well-documented

## Delegation Plan for example-tester Agent

### Example 1: simple-cone-funnel

**Instructions**: "Test the simple cone funnel example. The documentation states this creates a basic cone funnel chart with stageKey='group' and valueKey='value'. Verify the chart renders with a cone/funnel shape showing conversion drop-off. Check that tooltips work and show stage/value information. Ensure no console errors occur."

### Example 2: horizontal-cone-funnel

**Instructions**: "Test the horizontal cone funnel example. The documentation claims setting direction='horizontal' creates a horizontal cone funnel. Verify the chart renders horizontally instead of vertically. Check that all features work correctly in horizontal orientation including tooltips and interactions."

### Example 3: cone-funnel-fills

**Instructions**: "Test the cone funnel fills example. The documentation states this customizes fills with specific colors ["#5090DC", "#FFA03A", "#459D55"] and reverses the series by providing data in reverse order. Verify the drop-off areas use these exact colors and that the funnel appears reversed (widest at the end). Check that colors are applied correctly to each drop-off area."

## Estimated Complexity

-   **Total Time**: ~2 hours
-   **Complexity**: Medium
-   **Risk Areas**:
    -   Enterprise-only feature verification
    -   Limited documentation of interactive features
    -   Potential undocumented configuration options
