# Technical Review Plan: Sunburst Series

## Page Analysis Summary

### Chart Types/Features Covered

-   Sunburst series - hierarchical/tree data visualization
-   Radial segment-based representation of hierarchical data
-   Nested data structures with parent-child relationships
-   Size-based segment angles (relative sizing via `sizeKey`)
-   Color scale visualization for additional data dimension
-   Primary and secondary labels with auto-sizing
-   Gradient legend for color scale interpretation

### Key APIs and Configuration Options Documented

-   `type: 'sunburst'` - Series type declaration
-   `labelKey` - Defines segment titles
-   `sizeKey` / `sizeName` - Controls relative segment sizing
-   `colorKey` / `colorName` / `colorRange` - Color scale configuration
-   `fills` / `strokes` - Alternative coloring (non-scale based)
-   `secondaryLabelKey` - Secondary label data
-   Label configuration (`fontSize`, `minimumFontSize`, `spacing`)
-   `padding` - Sector content spacing
-   Gradient legend configuration (position, size, labels)

### Examples Referenced and Their Purposes

1. **org-chart** - Simple sunburst demonstrating basic hierarchical structure
2. **sizing** - Custom sizing using GDP data with `sizeKey`
3. **color-scale** - Color gradient based on numeric values
4. **other-colors** - Alternative coloring using `fills` array
5. **labels** - Label formatting and secondary labels
6. **gradient-legend** - Basic gradient legend display
7. **gradient-legend-position** - Legend positioning options
8. **gradient-legend-size** - Legend size customization
9. **gradient-legend-labels** - Legend label styling

### Interactive Features Described

-   Tooltips showing node information
-   Hover highlighting of segments
-   Label auto-sizing to fit available space
-   Interactive gradient legend

## Validation Targets

### Specific TypeScript Interfaces to Verify

-   `AgSunburstSeriesOptions` in `/packages/ag-charts-types/src/series/standalone/sunburstOptions.ts`
-   `AgGradientLegendOptions` in `/packages/ag-charts-types/src/chart/gradientLegendOptions.ts`
-   Label interfaces: `AgChartAutoSizedLabelOptions`, `AgChartAutoSizedSecondaryLabelOptions`
-   Tooltip interface: `AgSunburstSeriesTooltipRendererParams`

### Implementation Files to Check

-   Main implementation: Look for sunburst series implementation in community/enterprise packages
-   Property decorators for default values
-   Gradient legend implementation
-   Label auto-sizing logic
-   Color scale interpolation logic

### Examples to Test with Expected Behaviors

#### org-chart Example

**Documentation claims:**

-   Simple hierarchical organizational chart
-   Uses `labelKey: 'name'` to display names in segments
-   Default sizing (equal angles for leaf nodes)

**Expected behaviors to validate:**

-   Hierarchical data properly rendered as nested radial segments
-   Names displayed as labels in each segment
-   Equal-sized leaf segments when no `sizeKey` specified
-   Tooltips show node names
-   Proper parent-child nesting visually represented

#### sizing Example

**Documentation claims:**

-   Uses `sizeKey: 'gdp'` for relative sizing
-   `sizeName: 'GDP'` appears in tooltips
-   Segments sized proportionally to GDP values

**Expected behaviors to validate:**

-   Segments have different sizes based on GDP data
-   Tooltip shows "GDP" label with values
-   Relative sizing correctly calculated
-   Parent segments sum child segment sizes

#### color-scale Example

**Documentation claims:**

-   `colorKey: 'gdpChange'` provides numeric values for color scale
-   `colorName: 'Change'` appears in tooltips
-   `colorRange: ['#FF9800', '#8BC34A']` defines gradient colors

**Expected behaviors to validate:**

-   Segments colored based on gdpChange values
-   Color interpolation between orange and green
-   Tooltip shows "Change" with color-coded values
-   Gradient legend appears showing color scale

#### other-colors Example

**Documentation claims:**

-   `fills: ['#D32F2F', '#FF5722', '#283593']` cycles through colors
-   Colors indexed by root node index
-   `fills` ignored when `colorRange` is used

**Expected behaviors to validate:**

-   Three distinct colors applied to root nodes and their children
-   No gradient legend (since no colorKey)
-   Colors cycle through the fills array
-   All children of a root share the same color

#### labels Example

**Documentation claims:**

-   `secondaryLabelKey: 'gdpChange'` shows secondary labels
-   `fontSize: 14` with `minimumFontSize: 9` for auto-sizing
-   `spacing: 2` between labels
-   `padding: 3` from sector edges
-   Secondary label formatter shows percentage

**Expected behaviors to validate:**

-   Primary and secondary labels visible
-   Font size shrinks to fit small segments (down to 9px)
-   Proper spacing between primary and secondary labels
-   3px padding from segment edges
-   Secondary labels formatted as percentages

#### gradient-legend Examples

**Documentation claims:**

-   Gradient legend enabled by default with colorKey
-   Position options: bottom (default), left, right
-   Size customization via thickness and preferredLength
-   Label styling options (font, color, padding)

**Expected behaviors to validate:**

-   Gradient legend appears when colorKey is used
-   Position changes work correctly
-   Size adjustments respected
-   Label styling applied
-   Legend constrained by container edges
-   Vertical legends show descending order

### User Interactions to Validate

-   Hover over segments for tooltips
-   Hover highlighting of individual segments
-   Click interactions (if any)
-   Keyboard navigation support
-   Legend hover/interaction behavior

### Visual States to Screenshot and Analyze

-   Default rendering state for each example
-   Hover states showing tooltips and highlighting
-   Different viewport sizes (responsive behavior)
-   Label auto-sizing in action (small segments)
-   Gradient legend in different positions
-   Parent vs leaf segment visual distinction

### Interactive Features Requiring Before/After Visual Comparison

-   Segment hover highlighting
-   Tooltip appearance on hover
-   Label resizing based on available space
-   Any click-based interactions

### Chart Elements That Should Be Interactive

-   All visible segments (hover for tooltips)
-   Gradient legend (if interactive)
-   Any clickable elements mentioned in docs

### Expected Tooltip Content and Highlighting Behaviors

-   Tooltip shows labelKey value
-   Size values with sizeName when sizeKey is used
-   Color values with colorName when colorKey is used
-   Segment highlight on hover
-   Clear visual feedback for interactive elements

## Known Exceptions

No existing technical-review-exceptions.md file found for this page.

## Execution Plan

### Prioritized Testing Checklist

1. **High Priority - Core Functionality**

    - Verify sunburst series type configuration works
    - Test hierarchical data rendering accuracy
    - Validate labelKey functionality
    - Check tooltip content matches documentation
    - Test hover highlighting behavior

2. **High Priority - Sizing Feature**

    - Verify sizeKey implementation
    - Test relative sizing calculations
    - Validate sizeName in tooltips
    - Check parent segment size aggregation

3. **High Priority - Color Scale Feature**

    - Test colorKey/colorRange implementation
    - Verify gradient interpolation
    - Check gradient legend appears by default
    - Validate colorName in tooltips

4. **Medium Priority - Alternative Coloring**

    - Test fills array cycling
    - Verify fills ignored with colorRange
    - Check root node color inheritance

5. **Medium Priority - Labels**

    - Test label auto-sizing functionality
    - Verify secondary labels
    - Check label formatting
    - Test padding and spacing

6. **Medium Priority - Gradient Legend**

    - Test all position options
    - Verify size customization
    - Check label styling
    - Test responsive constraints

7. **Low Priority - Visual Polish**
    - Screenshot all examples
    - Check responsive behavior
    - Verify visual consistency

### Success Criteria for Each Test

-   API properties match TypeScript definitions
-   Examples render without console errors
-   Interactive features work as documented
-   Visual appearance matches descriptions
-   Tooltips show expected content
-   Performance is acceptable

### Estimated Complexity/Time for Each Task

-   Core functionality: High complexity (30 min)
-   Sizing feature: Medium complexity (20 min)
-   Color scale: Medium complexity (20 min)
-   Alternative coloring: Low complexity (10 min)
-   Labels: Medium complexity (15 min)
-   Gradient legend: Medium complexity (20 min)
-   Visual validation: Low complexity (15 min)

## Delegation Plan for example-tester Agent

### org-chart Example

-   **Test focus**: Basic hierarchical rendering
-   **Expected**: Clean tree structure with equal leaf sizes, name labels visible
-   **Validate**: Proper nesting, tooltip content, no console errors

### sizing Example

-   **Test focus**: GDP-based sizing implementation
-   **Expected**: Variable segment sizes based on GDP data
-   **Validate**: Size calculations, tooltip shows GDP values with "GDP" label

### color-scale Example

-   **Test focus**: Color gradient implementation
-   **Expected**: Orange to green gradient based on gdpChange values
-   **Validate**: Color interpolation, gradient legend presence, tooltip shows "Change" values

### other-colors Example

-   **Test focus**: Fills array implementation
-   **Expected**: Three distinct colors for root nodes
-   **Validate**: No gradient legend, color cycling, children inherit parent colors

### labels Example

-   **Test focus**: Label configuration and formatting
-   **Expected**: Primary and secondary labels, auto-sizing, percentage formatting
-   **Validate**: Font sizing behavior, spacing, padding, formatter function

### gradient-legend Examples

-   **Test focus**: Legend configuration options
-   **Expected**: Various positions, sizes, and styles
-   **Validate**: Position changes, size adjustments, label styling, responsive behavior
