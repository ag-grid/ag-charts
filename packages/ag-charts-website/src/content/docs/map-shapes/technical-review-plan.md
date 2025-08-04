# Technical Review Plan: Map Shapes Documentation

## Page Analysis Summary

### Chart Types/Features Covered

-   **Map Shape Series** (`map-shape`): Geographic area visualization with color-based data representation
-   **Map Shape Background Series** (`map-shape-background`): Non-interactive topology display for context
-   **Color Scale**: Heatmap-style coloring based on numeric data values
-   **Labels**: Text labels displayed within geographic shapes
-   **Legend Integration**: Standard legend support for map series

### Key APIs and Configuration Options Documented

1. **Core Series Options**:

    - `type: 'map-shape'` or `type: 'map-shape-background'`
    - `topology`: GeoJSON data for geographic shapes
    - `data`: Array of data objects to visualize
    - `idKey`: Property key matching data to topology
    - `topologyIdKey`: Property in topology for matching (default: 'name')
    - `title`: Series name for legend/tooltips
    - `legendItemName`: Legend grouping name

2. **Visual Encoding Options**:

    - `colorKey`: Property for color scale values
    - `colorRange`: Color interpolation range
    - `labelKey`: Property for shape labels
    - `idName`, `colorName`, `labelName`: Human-readable descriptions

3. **Styling Options**:
    - Fill, stroke, and line dash properties
    - `padding`: Distance between shape edges and text
    - `label`: Label configuration object
    - `itemStyler`: Callback for per-shape styling
    - `highlight`: Hover state configuration

### Examples Referenced

1. **multiple-series**: Basic map with multiple series (timezone regions)
2. **heatmap**: Color scale visualization using GDP data
3. **labels**: Shape labeling with country codes
4. **backgrounds**: Background series with interactive overlays

### Interactive Features Described

-   Tooltip display on hover
-   Legend toggling for series visibility
-   Highlighting on hover (series and legend items)
-   Label auto-sizing within shapes

## Validation Targets

### TypeScript Interface Verification

1. **Primary Interfaces**:

    - `AgMapShapeSeriesOptions` in `packages/ag-charts-types/src/series/topology/mapShapeOptions.ts`
    - `AgMapShapeBackgroundOptions` in `packages/ag-charts-types/src/series/topology/mapShapeBackgroundOptions.ts`
    - Related types: `AgMapShapeSeriesStyle`, `AgMapShapeSeriesHighlightStyle`, `AgMapShapeSeriesLabelFormatterParams`

2. **Property Verification**:
    - Confirm all documented properties exist in interfaces
    - Verify property types match documentation
    - Check optional vs required properties
    - Validate default values mentioned in docs

### Implementation Files to Check

1. **Core Implementation**:

    - Map shape series implementation in `packages/ag-charts-enterprise/src/series/`
    - Look for files like `mapShapeSeries.ts`, `mapShapeSeriesProperties.ts`
    - Background series implementation files
    - Topology processing and GeoJSON handling

2. **Feature Implementation**:
    - Color scale/range implementation
    - Label positioning and auto-sizing logic
    - Tooltip rendering for map shapes
    - Legend integration specifics

### Examples to Test

#### 1. multiple-series

**Documentation Claims**:

-   Shows multiple map series with different datasets (timezone regions)
-   Each series has its own color and appears in legend
-   Series can be toggled via legend
-   Tooltips show series title and shape information

**Expected Behaviors**:

-   Four distinct series (Pacific, Mountain, Central, Eastern) visible
-   Legend shows all four series with correct titles
-   Clicking legend items toggles series visibility
-   Hovering over shapes shows tooltips with timezone information
-   Each timezone region has distinct coloring

**example-tester Validation**:

-   Verify topology and data binding works correctly
-   Check that `idKey: 'name'` properly matches data to shapes
-   Confirm legend integration functions as expected
-   Validate tooltip content includes series title

#### 2. heatmap

**Documentation Claims**:

-   Uses `colorKey: 'gdp'` to create color scale visualization
-   Shapes colored based on GDP magnitude
-   Should show gradient legend for color scale
-   References "Colour Range" and "Gradient Legend" documentation

**Expected Behaviors**:

-   Shapes display with gradient coloring based on GDP values
-   Gradient legend visible showing color scale
-   Tooltips include GDP value information
-   Higher GDP values show different colors than lower values

**example-tester Validation**:

-   Verify `colorKey` properly maps to numeric data
-   Check gradient legend displays and functions
-   Confirm color interpolation works across data range
-   Validate tooltip shows color value information

#### 3. labels

**Documentation Claims**:

-   `labelKey: 'code'` displays text within shapes
-   Labels auto-size to fit within shape boundaries
-   References label options for handling long labels

**Expected Behaviors**:

-   Country/region codes visible inside map shapes
-   Labels properly sized to fit shape constraints
-   No label overflow or clipping issues
-   Labels remain readable at different zoom levels

**example-tester Validation**:

-   Verify `labelKey` correctly maps to label data
-   Check label auto-sizing algorithm works
-   Test with various shape sizes and label lengths
-   Confirm label styling options function

#### 4. backgrounds

**Documentation Claims**:

-   Background series shows all topology shapes without data
-   No interactivity (tooltips, highlighting)
-   Doesn't appear in legend
-   Provides context for other map series types

**Expected Behaviors**:

-   All topology shapes rendered as background
-   No hover effects or tooltips on background shapes
-   Background series not listed in legend
-   Other interactive series overlay correctly

**example-tester Validation**:

-   Verify `map-shape-background` type renders correctly
-   Confirm no interactive behaviors on background
-   Check legend exclusion works properly
-   Test layering with interactive series on top

### User Interactions to Validate

1. **Hover Interactions**:

    - Hover over individual map shapes for tooltips
    - Hover over legend items for series highlighting
    - Test hover at shape boundaries and edges
    - Verify tooltip positioning near viewport edges

2. **Click Interactions**:

    - Click legend items to toggle series
    - Click on map shapes (should have no effect unless configured)
    - Test rapid clicking and state changes

3. **Visual States**:
    - Default rendering state
    - Highlighted state on hover
    - Disabled state when toggled off
    - Multi-series overlap scenarios

### Visual States to Screenshot

1. **Default States**:

    - Full chart with all series visible
    - Individual example default views
    - Legend in default state

2. **Interactive States**:

    - Tooltip display on shape hover
    - Series highlighting from legend hover
    - Series toggled off via legend
    - Multiple series with overlapping regions

3. **Edge Cases**:
    - Small shapes with labels
    - Viewport edge tooltip positioning
    - Mobile/responsive views
    - Zoom states if applicable

## Known Exceptions

No existing technical review exceptions file found for this page.

## Execution Plan

### Priority 1: API Contract Validation

1. Verify all documented properties in `AgMapShapeSeriesOptions` interface
2. Check `AgMapShapeBackgroundOptions` interface completeness
3. Validate property types and optional/required status
4. Cross-reference default values with implementation

### Priority 2: Core Functionality Testing

1. Test multiple-series example:
    - Delegate to example-tester for code validation
    - Screenshot default state with all timezones
    - Test legend toggling for each series
    - Capture tooltips for different regions
2. Test heatmap example:
    - Validate color scale implementation
    - Screenshot gradient legend
    - Test tooltips show GDP values
    - Verify color interpolation across range

### Priority 3: Advanced Features Testing

1. Test labels example:
    - Verify label rendering within shapes
    - Test auto-sizing behavior
    - Screenshot various label scenarios
2. Test backgrounds example:
    - Confirm non-interactive behavior
    - Verify legend exclusion
    - Test with overlay series if applicable

### Priority 4: Interaction and Edge Case Testing

1. Comprehensive hover testing across all examples
2. Keyboard navigation testing
3. Responsive behavior at different viewports
4. Performance with complex topologies

### Success Criteria

-   All documented APIs exist and function as described
-   Examples demonstrate claimed features correctly
-   No console errors during interactions
-   Visual rendering matches documentation descriptions
-   Interactive behaviors work consistently
-   example-tester validates code quality and best practices

### Estimated Complexity

-   **High complexity** due to:
    -   Geographic/topology data handling
    -   Multiple visual encoding options
    -   Complex interaction patterns
    -   Enterprise-only features
    -   Integration with other map series types

## Delegation Plan for example-tester Agent

### Task Structure

For each example, provide:

1. Example name and path
2. Key documentation claims to verify
3. Expected visual elements and behaviors
4. Specific configuration patterns to check
5. Interactive features to test

### Example: multiple-series Delegation

```
Please test the map-shapes multiple-series example:
- Path: packages/ag-charts-website/src/content/docs/map-shapes/_examples/multiple-series/
- Documentation claims:
  - Shows 4 timezone series (Pacific, Mountain, Central, Eastern)
  - Each series uses idKey: 'name' to match data to topology
  - Legend enabled with series titles
  - Series can be toggled via legend
- Expected behaviors:
  - All 4 series render with distinct colors
  - Hovering shows tooltips with timezone info
  - Legend clicking toggles series visibility
  - No console errors or warnings
- Validate proper use of AG Charts map-shape API
```

### Expected Agent Output

The example-tester should provide:

-   Code structure validation results
-   API usage correctness assessment
-   Console error/warning reports
-   Visual rendering verification
-   Interactive behavior test results
-   Performance observations
-   Best practices compliance check
