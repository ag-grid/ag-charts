# Technical Review Plan: Funnel Series Documentation

## Page Analysis Summary

### Chart Types/Features Covered

-   Funnel Series (`type: 'funnel'`) - Enterprise feature
-   Vertical funnel charts (default)
-   Horizontal funnel charts
-   Segmented funnel charts (without drop-offs)
-   Customization of fills and styling

### Key APIs and Configuration Options Documented

-   `stageKey` - Required property for defining funnel stages
-   `valueKey` - Required property for numerical values determining bar width
-   `direction` - 'horizontal' or 'vertical' (default)
-   `dropOff.enabled` - Controls display of drop-offs between stages
-   `fills` - Array of colors for stage fills
-   API Reference link to `AgFunnelSeriesOptions`

### Examples Referenced

1. **simple-funnel**: Basic funnel chart demonstration
2. **horizontal-funnel**: Horizontal direction variant
3. **segmented**: Funnel without drop-offs
4. **funnel-fills**: Custom fill colors and reversed order

### Interactive Features Described

-   Drop-offs between stages showing value changes
-   Bar widths representing values at each stage
-   Customizable fills with opacity for drop-offs
-   Tooltips (implied but not explicitly documented)

## Validation Targets

### TypeScript Interfaces to Verify

-   `AgFunnelSeriesOptions` in `packages/ag-charts-types/src/series/cartesian/funnelOptions.ts`
-   `AgFunnelSeriesDropOff` interface
-   `AgFunnelSeriesLabelOptions` interface
-   `AgFunnelSeriesStageLabelOptions` interface
-   `AgFunnelSeriesStyle` interface

### Implementation Files to Check

-   `packages/ag-charts-enterprise/src/series/funnel/funnelSeries.ts` - Main implementation
-   `packages/ag-charts-enterprise/src/series/funnel/funnelProperties.ts` - Default values
-   `packages/ag-charts-enterprise/src/series/funnel/funnelModule.ts` - Module registration
-   Verify this is Enterprise-only feature (not in community package)

### Examples to Test with Expected Behaviors

#### 1. simple-funnel

**Documentation claims:**

-   Basic funnel series with `stageKey` and `valueKey` configuration
-   Shows value changes during a process
-   Bar widths represent values at each stage
-   Drop-offs denote changes between stages

**Expected behaviors to validate:**

-   Chart renders as vertical funnel by default
-   Bars have different widths based on data values
-   Drop-offs are visible between stages
-   Tooltips show on hover (verify content)
-   Stage labels are displayed
-   No console errors

#### 2. horizontal-funnel

**Documentation claims:**

-   Setting `direction: 'horizontal'` creates horizontal funnel
-   Same features as vertical but oriented horizontally

**Expected behaviors to validate:**

-   Chart renders horizontally
-   Drop-offs connect bars horizontally
-   Stage labels positioned appropriately for horizontal layout
-   Tooltips work correctly in horizontal orientation
-   Responsive behavior maintained

#### 3. segmented

**Documentation claims:**

-   Setting `dropOff: { enabled: false }` removes drop-offs
-   Creates segmented appearance without connections

**Expected behaviors to validate:**

-   No drop-off shapes between bars
-   Bars appear as separate segments
-   Spacing between segments is visible
-   All other features (tooltips, labels) still work
-   Verify `dropOff.enabled` default is `true` (from code: line 37)

#### 4. funnel-fills

**Documentation claims:**

-   `fills` array defines colors for each stage
-   Drop-offs use opacity of same fills
-   Data can be reversed to show funnel in reverse order

**Expected behaviors to validate:**

-   Custom colors applied to bars as specified
-   Drop-offs use semi-transparent versions of bar colors
-   Funnel appears reversed (wide to narrow vs narrow to wide)
-   Colors cycle if more stages than colors provided
-   Verify opacity can be customized via dropOff options

### User Interactions to Validate

-   Hover over funnel bars for tooltips
-   Hover over drop-off areas
-   Hover over stage labels
-   Click interactions on bars/drop-offs
-   Keyboard navigation (Tab, Arrow keys)
-   Touch/mobile interactions
-   Resize behavior for responsive charts

### Visual States to Screenshot

-   Default rendering of each example
-   Hover states showing tooltips
-   Focus states for keyboard navigation
-   Mobile viewport rendering
-   Different data scenarios (if examples vary data)

### Interactive Features Requiring Before/After Comparison

-   Tooltip appearance on hover
-   Visual feedback when hovering bars
-   Focus indicators during keyboard navigation
-   Responsive layout changes on resize

### Chart Elements That Should Be Interactive

-   Funnel bars (hover for tooltips, click handling)
-   Drop-off areas (possible hover effects)
-   Stage labels (potential interactions)
-   Legend items (if legend is shown)

### Expected Tooltip Content and Behaviors

-   Stage name from `stageKey`
-   Value from `valueKey`
-   Possibly percentage or change information
-   Proper positioning relative to hovered element
-   Consistent styling with theme

## Known Exceptions

-   No `technical-review-exceptions.md` file exists for this page

## Execution Plan

### Priority 1: Core Functionality Validation

1. Verify funnel series is Enterprise-only feature
2. Check TypeScript interface matches documentation
3. Validate default values in implementation
4. Test simple-funnel example for basic functionality
5. Verify required properties (`stageKey`, `valueKey`)

### Priority 2: Configuration Options Testing

1. Test horizontal-funnel direction change
2. Validate segmented funnel (dropOff.enabled = false)
3. Test custom fills and color cycling
4. Verify drop-off styling inherits from bar fills
5. Check all documented properties exist in API

### Priority 3: Interactive Features Validation

1. Test hover interactions on all chart elements
2. Validate tooltip content and positioning
3. Test keyboard navigation patterns
4. Verify touch/mobile interactions
5. Test edge cases (empty data, single stage, many stages)

### Priority 4: Visual and Responsive Testing

1. Screenshot all examples in default state
2. Capture hover and interaction states
3. Test responsive behavior at different viewports
4. Verify visual consistency across examples
5. Check for rendering artifacts or glitches

### Priority 5: Documentation Completeness

1. Verify all properties in type definition are documented
2. Check for missing configuration examples
3. Validate code snippets syntax
4. Ensure enterprise feature indication is clear
5. Review related documentation links

## Delegation Plan for example-tester Agent

### Testing Instructions for Each Example

#### simple-funnel

-   Verify basic funnel series setup with minimal configuration
-   Check that `stageKey` and `valueKey` are properly used from data
-   Validate drop-offs are enabled by default
-   Test tooltip content shows stage and value information
-   Ensure no TypeScript errors with basic configuration

#### horizontal-funnel

-   Confirm `direction: 'horizontal'` produces horizontal layout
-   Verify all visual elements adapt to horizontal orientation
-   Check stage label placement is appropriate
-   Test interactions work correctly in horizontal mode
-   Validate no console warnings about orientation

#### segmented

-   Verify `dropOff: { enabled: false }` removes drop-off shapes
-   Confirm bars appear as separate segments
-   Check spacing between segments is consistent
-   Validate other features remain functional
-   Test that enabling drop-offs again works correctly

#### funnel-fills

-   Verify custom colors from `fills` array are applied
-   Check color cycling if stages exceed array length
-   Validate drop-offs use appropriate opacity
-   Confirm data reversal creates inverted funnel shape
-   Test fill opacity and stroke properties if configured

### Expected Quality Checks

-   No console errors or warnings
-   Proper TypeScript typing throughout
-   AG Charts API used correctly
-   Chart renders without visual artifacts
-   Performance is acceptable with typical data sizes
-   Examples follow AG Charts best practices

## Success Criteria

1. All documented features work as described
2. TypeScript definitions match documentation
3. Examples demonstrate claimed functionality
4. No undocumented breaking changes
5. Interactive features work reliably
6. Documentation is complete and accurate
7. Enterprise-only status is clear
8. Visual rendering matches expectations
