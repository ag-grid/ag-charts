# Technical Review Plan: Chord Series Documentation

## Page Analysis Summary

### Chart Types/Features Covered

-   Chord series - a visualization for showing movement or change between different items using nodes and links
-   Chord diagrams for visualizing flow between categories (e.g., global migrations between continents)

### Key APIs and Configuration Options Documented

-   **Core properties:**

    -   `type: 'chord'` - Series type identifier
    -   `fromKey` - Key for start node of each link
    -   `toKey` - Key for end node of each link
    -   `sizeKey` - Key for the size of each link
    -   `sizeName` - Human-readable description of size values

-   **Customization options:**
    -   `node` - Styling options for nodes (fill, stroke, strokeWidth)
    -   `link` - Styling options for links (fill, fillOpacity, stroke, strokeWidth, strokeOpacity)

### Examples Referenced

1. **simple-chord** - Basic chord diagram showing global migrations between continents
2. **node-style** - Demonstrates custom node styling with fill, stroke, and strokeWidth
3. **link-style** - Demonstrates custom link styling with fill, fillOpacity, stroke, strokeWidth, and strokeOpacity

### Interactive Features Described

-   Tooltips showing link/node information (implied by series type but not explicitly documented)
-   Visual movement/flow between nodes through curved links

## Validation Targets

### TypeScript Interfaces to Verify

-   `AgChordSeriesOptions` in `packages/ag-charts-types/src/series/standalone/chordOptions.ts`
-   `AgChordSeriesLinkOptions` and `AgChordSeriesLinkStyle`
-   `AgChordSeriesNodeOptions` and `AgChordSeriesNodeStyle`
-   `AgChordSeriesLabelOptions`
-   Tooltip configuration interfaces

### Implementation Files to Check

-   `packages/ag-charts-enterprise/src/series/chord/chordSeries.ts` - Main series implementation
-   `packages/ag-charts-enterprise/src/series/chord/chordSeriesProperties.ts` - Property definitions and defaults
-   Module registration in enterprise package

### Critical Documentation Errors to Check

1. **Series type mismatch** - Documentation shows `type: 'sankey'` in code snippets for node-style and link-style examples, but should be `type: 'chord'`
2. **Enterprise vs Community** - Verify chord series is enterprise-only (imported from 'ag-charts-enterprise')
3. **Missing documentation** - Check for undocumented features like labels, tooltips, fills/strokes arrays, itemStyler functions

### Examples to Test with Expected Behaviors

#### simple-chord example

**Documentation claims:**

-   Creates a basic chord diagram
-   Uses fromKey, toKey, and sizeKey to define links
-   Shows global migration data between continents

**Expected behaviors to validate:**

-   Chart renders with curved links between continent nodes
-   Link thickness represents migration size (size values)
-   Nodes arranged in circular layout
-   sizeName ('Migration (millions)') appears in tooltips
-   Default colors and styling applied
-   Hovering over links shows tooltip with from/to/size information
-   Hovering over nodes shows aggregated flow information

#### node-style example

**Documentation claims:**

-   Demonstrates customization of node appearance
-   Uses node.fill, node.stroke, and node.strokeWidth properties

**Expected behaviors to validate:**

-   Nodes rendered with custom fill color (#34495e)
-   Nodes have custom stroke color (#2c3e50)
-   Nodes have strokeWidth of 2
-   All other behaviors same as simple-chord example
-   Verify the code snippet shows correct series type ('chord' not 'sankey')

#### link-style example

**Documentation claims:**

-   Demonstrates customization of link appearance
-   Uses link properties: fill, fillOpacity, stroke, strokeWidth, strokeOpacity

**Expected behaviors to validate:**

-   Links rendered with custom fill color (#34495e)
-   Links have fillOpacity of 0.25
-   Links have custom stroke color (#2c3e50)
-   Links have strokeWidth of 1
-   Links have strokeOpacity of 0.25
-   All other behaviors same as simple-chord example
-   Verify the code snippet shows correct series type ('chord' not 'sankey')

### User Interactions to Validate

1. **Hover interactions:**

    - Hover over links to trigger tooltips
    - Hover over nodes to see aggregated information
    - Check highlight states for links and nodes
    - Verify smooth transitions during hover

2. **Canvas-based interactions:**

    - Click on links/nodes to test selection behavior
    - Test keyboard navigation (Tab, arrow keys)
    - Check focus indicators
    - Test touch gestures on mobile viewports

3. **Responsive behavior:**
    - Resize browser to test chart responsiveness
    - Check label truncation at small sizes
    - Verify tooltip positioning at viewport edges

### Visual States to Screenshot

1. Default rendering state for each example
2. Hover states showing tooltips and highlights
3. Mobile viewport rendering
4. Edge cases (very small/large data values)
5. Keyboard focus states

## Known Exceptions

No technical-review-exceptions.md file exists for this page.

## Execution Plan

### High Priority Tasks

1. **Fix documentation errors** - Update code snippets showing wrong series type
2. **Verify TypeScript interfaces** - Cross-reference all documented properties with type definitions
3. **Test core functionality** - Validate all three examples render correctly with claimed features
4. **Check enterprise requirement** - Confirm chord is enterprise-only feature

### Medium Priority Tasks

1. **Document missing features** - Add documentation for labels, tooltips, fills/strokes arrays
2. **Test all interactions** - Comprehensive hover, click, and keyboard testing
3. **Validate customization** - Ensure all styling options work as documented
4. **Screenshot key states** - Capture visual evidence of features

### Low Priority Tasks

1. **Check for additional properties** - Look for undocumented but useful configuration options
2. **Performance testing** - Validate with large datasets
3. **Edge case testing** - Test with minimal data, missing values, etc.

## Delegation Plan for example-tester Agent

### Task 1: Validate simple-chord example

**Instructions for agent:**

-   Navigate to the simple-chord example
-   Verify chart renders with circular node layout and curved links
-   Check that fromKey='from', toKey='to', sizeKey='size' are properly configured
-   Validate sizeName appears in tooltips as 'Migration (millions)'
-   Test hover interactions on links and nodes
-   Verify no console errors or warnings
-   Check TypeScript types are properly used
-   Validate data binding works correctly with the migration dataset

### Task 2: Validate node-style example

**Instructions for agent:**

-   Navigate to the node-style example
-   Verify nodes have custom styling: fill=#34495e, stroke=#2c3e50, strokeWidth=2
-   Check that the example code uses correct series type ('chord' not 'sankey')
-   Ensure all simple-chord features still work
-   Test that node styling is consistently applied to all nodes
-   Look for any rendering issues with custom styles

### Task 3: Validate link-style example

**Instructions for agent:**

-   Navigate to the link-style example
-   Verify links have custom styling: fill=#34495e, fillOpacity=0.25, stroke=#2c3e50, strokeWidth=1, strokeOpacity=0.25
-   Check that the example code uses correct series type ('chord' not 'sankey')
-   Ensure all simple-chord features still work
-   Test that link styling is consistently applied to all links
-   Verify opacity values render correctly

### Task 4: Check for undocumented features

**Instructions for agent:**

-   Look for label configuration in the rendered examples
-   Check if tooltips have additional customization options
-   Test if fills/strokes arrays work for color cycling
-   Look for any itemStyler usage or other advanced features
-   Document any AG Charts best practices violations
