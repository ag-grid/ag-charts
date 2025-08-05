# Technical Review Plan: Tooltips Documentation

## Page Analysis Summary

### Features Covered

-   Default tooltip behavior and content generation
-   Tooltip modes (single, shared, compact)
-   Tooltip positioning and anchoring options
-   Tooltip arrow display configuration
-   Tooltip pagination for overlapping datapoints
-   Tooltip customization via CSS and renderer functions
-   Tooltip range configuration
-   Tooltip interaction enablement

### Key APIs and Configuration Options Documented

-   `tooltip.mode` - Controls tooltip display mode
-   `tooltip.position.anchorTo` - Anchoring options (node, pointer, chart)
-   `tooltip.position.placement` - Positioning relative to anchor
-   `tooltip.position.xOffset/yOffset` - Manual positioning offsets
-   `tooltip.showArrow` - Arrow visibility control
-   `tooltip.pagination` - Enable cycling through overlapping points
-   `tooltip.renderer` - Custom content/HTML rendering
-   `tooltip.range` - Proximity threshold for display
-   `series[].tooltip.interaction.enabled` - Enable tooltip interaction

### Examples Referenced

1. **default-tooltip** - Basic tooltip with yName usage
2. **tooltip-mode** - Demonstrates single/shared/compact modes
3. **tooltip-position** - Shows anchoring and placement options with fallbacks
4. **default-tooltip-arrow** - Arrow visibility control
5. **tooltip-pagination** - Cycling through overlapping datapoints
6. **default-tooltip-styling** - CSS class customization
7. **tooltip-content-title** - Content modification via renderer
8. **tooltip-renderer** - Full custom HTML tooltip
9. **interaction-range** - Different range options
10. **tooltip-interaction** - Enabling text selection and links

### Interactive Features Described

-   Hovering over datapoints to show tooltips
-   Click-based pagination through overlapping points
-   Cursor changes (hand cursor for pagination)
-   Text selection and link clicking (when interaction enabled)
-   Fallback positioning when constrained by container
-   Range-based activation (nearest, exact, pixel distance)

## Validation Targets

### TypeScript Interfaces to Verify

-   `AgChartTooltipOptions` - Main tooltip configuration interface
-   `AgSeriesTooltip` - Series-specific tooltip options
-   Tooltip position interfaces (anchorTo, placement, offset properties)
-   Tooltip renderer parameter types for different series
-   Mode enumeration values ('single', 'shared', 'compact')
-   Range type definition (string literals and number)

### Implementation Files to Check

-   Core tooltip implementation in `packages/ag-charts-community/src/`
-   Tooltip positioning logic and fallback behavior
-   Pagination implementation for overlapping points
-   Default tooltip content generation logic
-   CSS class application in default tooltip
-   Renderer callback invocation and parameter passing
-   Range calculation implementation
-   Interaction enabling/disabling logic

### Examples to Test with Expected Behaviors

#### 1. default-tooltip

**Documentation claims:**

-   Shows how yName is used in tooltips
-   Default mode selection based on series count and yName presence
-   Stacked bar chart with custom yName values

**Expected behaviors for example-tester:**

-   Two stacked bar series with month on x-axis
-   Tooltips should show "Sweaters Made" and "Hats Made" instead of raw keys
-   Should use shared mode (≤3 series)
-   Legend should also use yName values

#### 2. tooltip-mode

**Documentation claims:**

-   Demonstrates switching between single, shared, and compact modes
-   Mode can be set at chart level

**Expected behaviors for example-tester:**

-   Interactive mode switching via dropdown
-   Single mode: Shows one series at a time
-   Shared mode: Shows all series for same x-value
-   Compact mode: Reduced padding and fields

#### 3. tooltip-position

**Documentation claims:**

-   Anchoring to node/pointer/chart
-   Placement options (top, left, right, etc.)
-   Fallback placement array support
-   Left+Right fallback example behavior

**Expected behaviors for example-tester:**

-   Dropdown controls for anchorTo and placement
-   Leftmost datapoint should show tooltip on right when "Left + Right fallback" selected
-   Different anchor behaviors (follow node vs pointer)
-   Placement changes should be visually obvious

#### 4. default-tooltip-arrow

**Documentation claims:**

-   Arrow removed when constrained or offset
-   showArrow: false removes arrow

**Expected behaviors for example-tester:**

-   Toggle control for showArrow
-   Arrow should appear/disappear based on setting
-   Arrow points to exact origin point

#### 5. tooltip-pagination

**Documentation claims:**

-   Click to cycle through overlapping points
-   Hand cursor when hovering overlapping data
-   Shows count of overlapping points
-   Only available with 2+ overlapping points

**Expected behaviors for example-tester:**

-   Bubble chart with overlapping bubbles
-   Cursor changes to hand over overlaps
-   Click cycles through tooltips
-   Counter shows (e.g., "1 of 3")
-   Each click highlights different bubble

#### 6. default-tooltip-styling

**Documentation claims:**

-   CSS classes for styling tooltip elements
-   Example shows papayawhip background, peachpuff border, maroon text
-   Bold heading style

**Expected behaviors for example-tester:**

-   Custom CSS visible in tooltip styling
-   All specified CSS classes present in DOM
-   Styles complement rather than override defaults

#### 7. tooltip-content-title

**Documentation claims:**

-   Renderer modifies default template content
-   Returns object with heading, title, data fields
-   Custom formatting (uppercase, fixed decimals)

**Expected behaviors for example-tester:**

-   "Clothing Production" as heading
-   Uppercase series names as titles
-   Values formatted to 1 decimal place
-   Still uses default tooltip template

#### 8. tooltip-renderer

**Documentation claims:**

-   Returns HTML string for complete custom tooltip
-   Uses params.fill for color styling
-   Custom class and inline styles
-   Arrow symbol (&#10172;) in content

**Expected behaviors for example-tester:**

-   Completely custom HTML structure
-   Color matches series fill
-   Custom "my-tooltip" class
-   Integer formatted values (no decimals)

#### 9. interaction-range

**Documentation claims:**

-   'nearest' - default for marker series
-   'exact' - default for shape series
-   Numeric pixel distance option

**Expected behaviors for example-tester:**

-   Range control changing tooltip activation
-   'nearest' always shows closest point
-   'exact' requires hovering directly on element
-   Pixel distance creates activation radius

#### 10. tooltip-interaction

**Documentation claims:**

-   Default: cannot hover or select text
-   interaction.enabled allows text selection and links
-   Set on series level

**Expected behaviors for example-tester:**

-   Toggle for enabling interaction
-   When enabled: can select tooltip text
-   When enabled: can click links in tooltip
-   When disabled: tooltip disappears on hover attempt

### User Interactions to Validate

-   Basic hover activation over chart elements
-   Pagination clicking on overlapping datapoints
-   Cursor changes (arrow to hand for pagination)
-   Text selection in interactive tooltips
-   Link clicking in interactive tooltips
-   Tooltip following mouse in pointer mode
-   Constraint behavior at chart edges
-   Fallback positioning when primary placement blocked

### Visual States to Screenshot and Analyze

-   Default tooltip appearance for each mode
-   Tooltip with and without arrow
-   Pagination states (showing counters)
-   Custom styled tooltips
-   Custom HTML tooltips
-   Tooltips at chart edges (constraint behavior)
-   Overlapping datapoint tooltips
-   Interactive tooltip with selectable text

### Interactive Features Requiring Before/After Comparison

-   Pagination click cycling (before: tooltip 1, after: tooltip 2)
-   Mode switching (before: single, after: shared)
-   Arrow toggle (before: with arrow, after: without)
-   Range changes (before: exact activation, after: nearest)
-   Interaction toggle (before: non-interactive, after: selectable)

### Chart Elements That Should Be Interactive

Based on documentation:

-   All data points (bars, markers, bubbles) should show tooltips on hover
-   Overlapping points should show hand cursor and allow clicking
-   Interactive tooltips should maintain visibility when hovering over them
-   Range setting should affect activation distance

### Expected Tooltip Content and Highlighting

-   Default format: heading (x-value), symbol, title, data rows
-   Shared mode: multiple series combined
-   Single mode: one series only
-   Compact mode: minimal padding/fields
-   Custom content via renderer modifications
-   Series highlighting should match tooltip focus

## Known Exceptions

No documented exceptions file exists for this page.

## Execution Plan

### Priority 1: Core Functionality Tests

1. **Default tooltip behavior** - Verify basic tooltip shows on hover with correct content
2. **Mode functionality** - Test all three modes work as documented
3. **TypeScript interface validation** - Check all documented properties exist
4. **Renderer functionality** - Both object and HTML string returns

### Priority 2: Interactive Features

1. **Pagination system** - Test overlapping point cycling
2. **Position and anchoring** - Verify all anchor/placement combinations
3. **Range behavior** - Test all range options
4. **Interaction enablement** - Text selection and link clicking

### Priority 3: Visual and Edge Cases

1. **CSS customization** - Verify all documented classes work
2. **Arrow behavior** - Test show/hide conditions
3. **Constraint handling** - Edge positioning and fallbacks
4. **Performance with many series** - Mode defaults with >3 series

### Delegation Plan for example-tester Agent

For each example, provide:

1. Example name and path
2. Specific documentation claims to verify
3. Expected visual elements and behaviors
4. Interactive features to test
5. Configuration patterns from docs that must be present
6. Any special validation needs (e.g., CSS classes, HTML structure)

The agent should validate:

-   Correct AG Charts API usage
-   No console errors or warnings
-   TypeScript type safety
-   Chart renders as described
-   Interactive behaviors work correctly
-   Performance is acceptable

### Success Criteria

-   All documented APIs exist and work as described
-   Examples demonstrate claimed features accurately
-   Interactive behaviors match documentation
-   No console errors during normal usage
-   Visual appearance matches descriptions
-   TypeScript types are accurate and complete
