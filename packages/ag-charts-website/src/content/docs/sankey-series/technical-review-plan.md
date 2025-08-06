# Technical Review Plan: Sankey Series Documentation

## Page Analysis Summary

### Chart Types/Features Covered

-   Sankey diagram visualization for showing movement/change between items
-   Node and link based visualization
-   Circular loop prevention mechanism
-   Node alignment options (left, right, center, justify)
-   Node styling customization
-   Link styling customization

### Key APIs and Configuration Options Documented

1. **Core Series Properties**:

    - `type: 'sankey'` - Series type identifier
    - `fromKey` - Defines start node of each link
    - `toKey` - Defines end node of each link
    - `sizeKey` - Defines size of each link

2. **Node Configuration**:

    - `node.alignment` - Horizontal placement with 4 options (left, right, center, justify)
    - `node.fill` - Node fill color
    - `node.stroke` - Node stroke color
    - `node.strokeWidth` - Node stroke width

3. **Link Configuration**:
    - `link.fill` - Link fill color
    - `link.fillOpacity` - Link fill transparency
    - `link.stroke` - Link stroke color
    - `link.strokeWidth` - Link stroke width
    - `link.strokeOpacity` - Link stroke transparency

### Examples Referenced and Their Purposes

1. **simple-sankey**: Demonstrates basic sankey series setup with minimal configuration
2. **alignment**: Shows the four different node alignment options in action
3. **node-style**: Demonstrates customizing node appearance (fill, stroke, strokeWidth)
4. **link-style**: Shows link styling options (fill, fillOpacity, stroke, strokeWidth, strokeOpacity)

### Interactive Features Described

-   Visual flow representation between nodes
-   Implied hover interactions (typical for AG Charts)
-   Tooltips (expected but not explicitly documented)

## Validation Targets

### Specific TypeScript Interfaces to Verify

-   `AgSankeySeriesOptions` in `/packages/ag-charts-types/src/series/standalone/sankeyOptions.ts`
-   Related node and link configuration interfaces
-   Verify all documented properties exist with correct types
-   Check for additional properties not documented

### Implementation Files to Check

-   Main sankey series implementation in community/enterprise packages
-   Node rendering and alignment logic
-   Link rendering logic
-   Circular loop detection and removal implementation
-   Default values for all configurable properties

### Examples to Test with Expected Behaviors

#### 1. simple-sankey Example

**Documentation Claims**:

-   Creates basic sankey diagram with fromKey, toKey, and sizeKey
-   Shows flow between nodes based on size values

**Expected Behaviors to Validate**:

-   Chart renders with nodes and links
-   Links connect from source to target nodes correctly
-   Link widths correspond to size values
-   Default styling is applied
-   No circular loops present
-   Tooltips show on hover (if implemented)
-   Console is error-free

#### 2. alignment Example

**Documentation Claims**:

-   Demonstrates all 4 alignment options: left, right, center, justify
-   justify pushes last nodes to the right while others go left

**Expected Behaviors to Validate**:

-   Visual demonstration of each alignment type
-   Left alignment: nodes positioned far left
-   Right alignment: nodes positioned far right
-   Center alignment: nodes centered
-   Justify alignment: initial nodes left, final nodes right
-   Interactive switching between alignments (if implemented)
-   Proper node positioning for complex multi-level flows

#### 3. node-style Example

**Documentation Claims**:

-   Customizes node appearance with fill (#34495e), stroke (#2c3e50), strokeWidth (2)

**Expected Behaviors to Validate**:

-   Nodes render with specified fill color
-   Nodes have visible stroke with correct color
-   Stroke width is visibly 2px
-   Styling applies to all nodes uniformly
-   Hover states maintain custom styling (if applicable)

#### 4. link-style Example

**Documentation Claims**:

-   Customizes link appearance with:
    -   fill (#34495e)
    -   fillOpacity (0.25)
    -   stroke (#2c3e50)
    -   strokeWidth (1)
    -   strokeOpacity (0.25)

**Expected Behaviors to Validate**:

-   Links render with specified fill color at 25% opacity
-   Links have visible stroke with correct color at 25% opacity
-   Stroke width is visibly 1px
-   Transparency values are correctly applied
-   All links receive consistent styling

### User Interactions to Validate

1. **Hover Interactions**:

    - Hover over nodes - expect highlighting and tooltips
    - Hover over links - expect highlighting and flow information
    - Hover over empty chart areas - no unexpected behavior

2. **Keyboard Navigation**:

    - Tab navigation through interactive elements
    - Focus indicators on nodes/links
    - Keyboard accessibility for tooltips

3. **Edge Cases**:
    - Chart behavior with very large datasets
    - Handling of zero/negative size values
    - Behavior with missing data (null/undefined values)
    - Window resize responsiveness
    - Mobile touch interactions

### Visual States to Screenshot and Analyze

1. **Default States**:

    - Each example in default rendering state
    - Full chart view showing all nodes and links

2. **Interactive States**:

    - Hover states on nodes
    - Hover states on links
    - Tooltip appearance and positioning
    - Focus states for keyboard navigation

3. **Alignment Variations**:

    - Screenshot each alignment option clearly
    - Complex flow patterns with each alignment

4. **Responsive States**:
    - Desktop view
    - Tablet view
    - Mobile view
    - Charts after window resize

### Interactive Features Requiring Before/After Visual Comparison

1. Node hover effects (before hover vs during hover)
2. Link hover effects (before hover vs during hover)
3. Tooltip appearance (no tooltip vs tooltip shown)
4. Focus state transitions for keyboard navigation
5. Any animation effects during interactions

### Chart Elements That Should Be Interactive

Based on typical AG Charts behavior and sankey diagram conventions:

1. **Nodes**: Should be hoverable with tooltips showing node information
2. **Links**: Should be hoverable with tooltips showing flow details (from, to, size)
3. **Legend**: If present, should allow series toggling
4. **Chart canvas**: Should respond to standard AG Charts interactions

### Expected Tooltip Content and Highlighting Behaviors

1. **Node Tooltips**: Should display node name/label and aggregated flow values
2. **Link Tooltips**: Should show source, target, and flow size/value
3. **Highlighting**: Related nodes and links should highlight on hover
4. **Visual Feedback**: Clear hover states with color/opacity changes

## Known Exceptions

-   No documented exceptions found in `technical-review-exceptions.md`
-   Any discovered exceptions during review should be documented

## Execution Plan

### Priority 1: Core API Validation

1. Verify `AgSankeySeriesOptions` interface matches documentation
2. Check all documented properties exist with correct types
3. Validate default values in implementation
4. Confirm circular loop detection works as documented

### Priority 2: Example Functionality Testing

1. Test simple-sankey example:
    - Delegate to example-tester with basic sankey expectations
    - Screenshot default state
    - Test hover interactions and tooltips
2. Test alignment example:
    - Delegate to example-tester with alignment validation focus
    - Screenshot each alignment option
    - Verify justify behavior specifically
3. Test node-style example:
    - Delegate to example-tester with styling validation
    - Screenshot custom node styling
    - Verify colors and stroke width
4. Test link-style example:
    - Delegate to example-tester with link styling focus
    - Screenshot semi-transparent links
    - Verify opacity values render correctly

### Priority 3: Interactive Feature Validation

1. Comprehensive hover testing across all examples
2. Keyboard navigation testing
3. Responsive behavior validation
4. Edge case testing with data variations

### Priority 4: Documentation Completeness

1. Check for missing configuration options
2. Verify all features have examples
3. Assess clarity of explanations
4. Identify gaps in coverage

### Success Criteria

-   All documented APIs exist and work as described
-   Examples demonstrate claimed features correctly
-   Interactive behaviors match AG Charts standards
-   No console errors or warnings
-   Visual rendering matches documentation
-   Charts are accessible and responsive

### Estimated Complexity

-   High complexity due to:
    -   Complex graph visualization logic
    -   Multiple customization options
    -   Interactive flow visualization
    -   Alignment algorithm verification
    -   Visual validation of semi-transparent elements
