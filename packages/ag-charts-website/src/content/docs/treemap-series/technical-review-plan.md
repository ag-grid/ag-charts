# Technical Review Plan: Treemap Series

## Page Analysis Summary

### Chart Types/Features Covered

-   **Treemap Series**: Enterprise-only visualization for hierarchical data structures
-   **Key Capabilities**:
    -   Hierarchical data visualization using nested rectangles
    -   Rectangle area representing numeric values
    -   Color scales for additional data dimensions
    -   Customizable labels for both group (non-leaf) and tile (leaf) nodes
    -   Auto-sizing labels with minimum font size constraints
    -   Secondary labels for tiles
    -   Layout customization (padding, gaps, corner radius)
    -   Multiple hierarchy levels support
    -   Gradient Legend integration for color scale reference

### Key APIs and Configuration Options Documented

#### 1. Core Series Configuration

-   `type: 'treemap'` - Series type identifier (enterprise only)
-   `labelKey` - Property name for primary labels (e.g., 'name', 'title')
-   `secondaryLabelKey` - Property for secondary tile labels
-   `childrenKey` - Property containing children array (defaults to 'children')
-   `sizeKey` - Property for numeric sizing values
-   `sizeName` - Human-readable description for size values in tooltips
-   `colorKey` - Property for color scale numeric values
-   `colorName` - Human-readable description for color values in tooltips
-   `colorRange` - Array of colors for gradient interpolation
-   `fills` and `strokes` - Arrays of colors indexed by root node

#### 2. Group Configuration (`group` property)

-   `label` - Label styling (fontSize, spacing)
-   `padding` - Space from edge to content
-   `gap` - Space between adjacent groups
-   `cornerRadius` - Rounded corners
-   `textAlign` - Horizontal alignment
-   `interactive` - Enable/disable hover highlighting

#### 3. Tile Configuration (`tile` property)

-   `label` - Primary label with auto-sizing support
    -   `fontSize` - Initial font size
    -   `minimumFontSize` - Minimum size when shrinking
    -   `spacing` - Space below label
-   `secondaryLabel` - Additional label with formatter support
-   `padding` - Space from edge to labels
-   `gap` - Space between adjacent tiles
-   `cornerRadius` - Rounded corners
-   `textAlign` and `verticalAlign` - Label positioning

#### 4. Gradient Legend Configuration

-   `gradientLegend.enabled` - Show/hide legend (default true when colorKey used)
-   `gradientLegend.position` - 'bottom', 'right', 'left', 'top'
-   `gradientLegend.reverseOrder` - Reverse value ordering
-   `gradient.thickness` - Width of gradient bar
-   `gradient.preferredLength` - Initial bar length
-   `scale.label` - Label styling (fontSize, fontStyle, fontWeight, fontFamily, color)
-   `scale.padding` - Distance from gradient to labels

### Examples Referenced and Their Purposes

1. **simple-treemap** - Basic hierarchical data visualization
2. **sizing** - Demonstrates `sizeKey` for variable rectangle sizing
3. **color-scale** - Shows `colorKey`, `colorRange`, and gradient legend
4. **other-colors** - Custom `fills` and `strokes` arrays
5. **labels** - Advanced label customization with auto-sizing
6. **layout** - Padding and gap adjustments
7. **nesting** - Multiple hierarchy levels
8. **gradient-legend** - Basic gradient legend usage
9. **gradient-legend-position** - Position variations
10. **gradient-legend-size** - Size customization
11. **gradient-legend-labels** - Label styling

### Interactive Features Described

-   Hover tooltips showing configured data values
-   Interactive highlighting for tiles and groups
-   Auto-shrinking labels to fit available space
-   Gradient legend as color reference
-   Visual hierarchy through nested rectangles

## Validation Targets

### Specific TypeScript Interfaces to Verify

1. **Primary Interface**: `AgTreemapSeriesOptions` in `/packages/ag-charts-types/src/series/standalone/treemapOptions.ts`
2. **Related Interfaces**:
    - `AgTreemapSeriesGroupOptions` - Group node configuration
    - `AgTreemapSeriesTileOptions` - Tile/leaf node configuration
    - `AgTreemapSeriesHighlightStyle` - Hover state styling
    - `AgTreemapSeriesTooltipRendererParams` - Tooltip customization params
    - `AgTreemapSeriesOptionsKeys` - Key property definitions
    - `AgTreemapSeriesOptionsNames` - Name property definitions
3. **Gradient Legend**: `AgGradientLegendOptions` in `/packages/ag-charts-types/src/chart/gradientLegendOptions.ts`

### Implementation Files to Check

1. **Series Implementation**: `/packages/ag-charts-enterprise/src/series/treemap/treemapSeries.ts`
2. **Properties**: `/packages/ag-charts-enterprise/src/series/treemap/treemapSeriesProperties.ts`
3. **Module**: `/packages/ag-charts-enterprise/src/series/treemap/treemapModule.ts`
4. **Default Values**: Check `@Property` decorators in properties file

### Examples to Test with Expected Behaviors

#### 1. simple-treemap

-   **Documentation Claims**: Basic treemap using `labelKey: 'title'`
-   **Expected Behaviors**:
    -   UK Government Budget data renders as nested rectangles
    -   Parent nodes show category names (e.g., "Pensions", "Health Care")
    -   Leaf nodes show subcategory titles
    -   Default coloring with no color scale
    -   Tooltips display title values on hover
    -   Title and subtitle present ("UK Government Budget", "2024")
-   **Data Validation**: Hierarchical structure with title and children properties

#### 2. sizing

-   **Documentation Claims**: `sizeKey` provides relative sizing, larger nodes appear top-left
-   **Expected Behaviors**:
    -   Rectangle areas proportional to 'size' values
    -   Larger values positioned towards top-left corner
    -   Tooltips show size values with "Size" label
    -   Node reordering based on size values
    -   Visual hierarchy reflects numeric proportions
-   **Key Feature**: Size-based layout algorithm

#### 3. color-scale

-   **Documentation Claims**: Color interpolation using `colorKey` and `colorRange`
-   **Expected Behaviors**:
    -   Tiles colored based on 'change' values
    -   Green (#43A047) to red (#FF5722) gradient
    -   Positive changes appear green, negative changes appear red
    -   Tooltips show "Change" values
    -   Gradient legend visible by default at bottom
    -   Legend shows color scale matching chart
-   **Validation**: Color interpolation accuracy

#### 4. other-colors

-   **Documentation Claims**: Custom fills/strokes indexed by root node
-   **Expected Behaviors**:
    -   10 distinct fill colors as specified
    -   Matching stroke colors for each fill
    -   Colors assigned by root node index
    -   No gradient legend (colorRange not used)
    -   Note states fills/strokes ignored when colorRange used
-   **Edge Case**: Verify colorRange overrides fills/strokes

#### 5. labels

-   **Documentation Claims**: Custom label styling with auto-sizing
-   **Expected Behaviors**:
    -   Group labels: 18px font size, 2px spacing
    -   Tile labels: 32px initial, shrink to minimum 18px
    -   Secondary labels show formatted size values
    -   Label spacing: 12px for tiles
    -   Text fits within available space
    -   Formatter function applies to secondary labels
-   **Key Feature**: Font size auto-adjustment

#### 6. layout

-   **Documentation Claims**: Custom padding and gap values
-   **Expected Behaviors**:
    -   Group padding: 12px from edges
    -   Group gap: 5px between groups
    -   Tile padding: 10px from edges
    -   Tile gap: 2px between tiles
    -   Visual spacing matches configuration
    -   Nested elements respect parent spacing
-   **Validation**: Layout calculations

#### 7. nesting

-   **Documentation Claims**: Multiple hierarchy levels support
-   **Expected Behaviors**:
    -   Deep nesting (3+ levels) renders correctly
    -   Each level maintains parent-child relationships
    -   Labels visible at all hierarchy levels
    -   Interactive features work at all depths
    -   Visual hierarchy clear through nesting
-   **Complexity**: Deep hierarchy rendering

#### 8. gradient-legend

-   **Documentation Claims**: Gradient legend enabled by default with colorKey
-   **Expected Behaviors**:
    -   Legend appears at bottom by default
    -   Color gradient matches chart colors
    -   Value labels on scale ends
    -   Legend reflects data value range
    -   Proper integration with treemap
-   **Default Behavior**: Automatic enablement

#### 9. gradient-legend-position

-   **Documentation Claims**: Position options, reverseOrder for vertical
-   **Expected Behaviors**:
    -   Legend positioned on right side
    -   Values in descending order (vertical default)
    -   reverseOrder option changes to ascending
    -   Legend adapts to container constraints
    -   Proper spacing from chart
-   **Variations**: All position options

#### 10. gradient-legend-size

-   **Documentation Claims**: thickness: 50px, preferredLength: 400px
-   **Expected Behaviors**:
    -   Gradient bar 50px thick
    -   Initial length 400px (constrained by container)
    -   Size adjustments visible
    -   Labels adjust to available space
    -   Responsive to container size
-   **Constraints**: Container edge behavior

#### 11. gradient-legend-labels

-   **Documentation Claims**: Custom label styling
-   **Expected Behaviors**:
    -   Font: 20px italic bold serif
    -   Color: red
    -   Padding: 20px from gradient
    -   All style properties applied
    -   Consistent across all labels
-   **Validation**: Complete style application

### User Interactions to Validate

1. **Hover Behaviors**:

    - Hover over tiles → tooltips with label, size, color values
    - Hover over groups → highlight if interactive enabled
    - Hover over empty space → no interaction
    - Rapid hover movement → smooth tooltip updates
    - Edge hover → proper tooltip positioning

2. **Visual Feedback**:

    - Tile highlight on hover
    - Group highlight when interactive: true
    - Clear visual hierarchy
    - Smooth transitions

3. **Edge Cases**:
    - Small tiles with long labels → auto-sizing
    - Missing data properties → graceful handling
    - Empty children arrays → proper rendering
    - Single-node trees → correct display
    - Very deep nesting → performance

### Visual States to Screenshot and Analyze

1. **Default States**: Each example initial render
2. **Hover States**: Active tooltips and highlights
3. **Label Scenarios**: Auto-sized vs. normal labels
4. **Color Variations**: Full color scale range
5. **Layout Configurations**: Different spacing settings
6. **Legend Positions**: All four positions
7. **Hierarchy Depths**: Shallow vs. deep nesting
8. **Responsive States**: Different viewport sizes

### Interactive Features Requiring Before/After Visual Comparison

1. **Tooltip Activation**: No tooltip → tooltip visible
2. **Tile Highlighting**: Normal → highlighted state
3. **Group Highlighting**: Normal → highlighted (when interactive)
4. **Label Shrinking**: Large space → constrained space
5. **Viewport Resize**: Desktop → mobile view

### Chart Elements That Should Be Interactive

Based on documentation:

-   **Tiles (Leaf Nodes)**: Always interactive with tooltips
-   **Groups (Parent Nodes)**: Interactive only if `group.interactive: true`
-   **Gradient Legend**: Non-interactive reference element
-   **Labels**: Non-interactive text elements

## Known Exceptions

-   No documented exceptions file found for this page

## Execution Plan

### Priority 1: API Contract Validation

1. Verify all properties in `AgTreemapSeriesOptions` match documentation
2. Check property types (string vs. number, optional vs. required)
3. Validate default values in implementation
4. Confirm enterprise-only restriction
5. Verify gradient legend integration

### Priority 2: Example Technical Validation (example-tester Agent)

Delegate testing of each example with specific expectations:

1. **simple-treemap**: Basic rendering and data structure
2. **sizing**: Size-based layout and reordering
3. **color-scale**: Color interpolation and legend
4. **other-colors**: Fill/stroke array behavior
5. **labels**: Auto-sizing and formatting
6. **layout**: Spacing calculations
7. **nesting**: Deep hierarchy support
8. **gradient-legend** variants: All configurations

For each example, provide agent with:

-   Expected visual appearance from documentation
-   Configuration properties to verify
-   Interactive behaviors to test
-   Specific validation criteria
-   Console error checking

### Priority 3: Visual and Interaction Testing

1. Screenshot all examples in default state
2. Capture hover states with tooltips
3. Test label auto-sizing scenarios
4. Verify color gradients
5. Test all legend positions
6. Validate responsive behavior
7. Document visual inconsistencies

### Priority 4: Content Completeness

1. Verify all major features documented
2. Check for missing common use cases
3. Validate example coverage
4. Review API reference completeness

### Success Criteria

-   All TypeScript properties match documentation
-   Examples demonstrate claimed features
-   Interactive behaviors work as described
-   Visual rendering matches descriptions
-   No console errors or warnings
-   Gradient legend properly integrated
-   Enterprise-only restriction enforced
-   Auto-sizing labels function correctly

### Estimated Complexity

-   **High**: Color scales, auto-sizing, deep hierarchies
-   **Medium**: Layout calculations, tooltips, legend integration
-   **Low**: Basic properties, static styling
-   **Time Estimate**: 2-3 hours comprehensive review
