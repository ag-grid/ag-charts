# Technical Review Plan - Maps Overview Page

## Page Analysis Summary

### Overview

The maps overview page introduces the Map Series feature (enterprise only) and provides links to three main map visualization types:

1. Geographic Areas (map-shape series)
2. Routes and Connections (map-line series)
3. Markers and Points of Interest (map-marker series)

### Key Features Documented

-   Three example showcases demonstrating different map visualization capabilities
-   Links to detailed documentation for each map series type
-   Enterprise-only feature designation

### Examples Referenced

1. **world-colour-map**: Demonstrates geographic areas with color scale visualization
2. **lines**: Shows routes, connections, and background layers
3. **bubble-map**: Illustrates proportional-sized markers for population data

## Validation Targets

### TypeScript Interfaces to Verify

1. **Map Shape Series**:
    - `AgMapShapeSeriesOptions` in `packages/ag-charts-types/src/series/topology/mapShapeOptions.ts`
    - `AgMapShapeBackgroundSeriesOptions` for background layers
2. **Map Line Series**:
    - `AgMapLineSeriesOptions` in `packages/ag-charts-types/src/series/topology/mapLineOptions.ts`
3. **Map Marker Series**:
    - `AgMapMarkerSeriesOptions` in `packages/ag-charts-types/src/series/topology/mapMarkerOptions.ts`

### Implementation Files to Check

1. Map series implementations in `packages/ag-charts-enterprise/src/series/topology/`:
    - `mapShape.ts` and related files
    - `mapLine.ts` and related files
    - `mapMarker.ts` and related files
    - `mapShapeBackground.ts` for background series

### Examples to Test with Expected Behaviors

#### 1. world-colour-map Example

**Documentation Claims**:

-   Shows "World Map with Colour Scale"
-   Demonstrates geographic areas visualization

**Expected Behaviors for example-tester Agent**:

-   Should render a world map with countries colored based on data values
-   Uses `map-shape-background` series for background layer
-   Uses `map-shape` series for colored regions
-   Should have a gradient legend showing the color scale
-   Gradient legend positioned on the right
-   Legend should show "% of population" with percentage formatting
-   Title should be "Access to Clean Fuels"
-   Countries should be identified by 'name' field
-   Color intensity should represent 'value' field
-   Should support hover interactions showing country details
-   Tooltips should display country name and percentage value

**Visual States to Capture**:

-   Default map rendering with color gradient
-   Hover state over different countries
-   Legend interaction states
-   Different viewport sizes (responsive behavior)

#### 2. lines Example

**Documentation Claims**:

-   Shows "Lines, Markers, Background"
-   Demonstrates routes and connections

**Expected Behaviors for example-tester Agent**:

-   Should render multiple map layers:
    -   Two background shape layers (different fills/opacity)
    -   Map lines showing routes (blue color, 2px width)
    -   Map markers showing stations (blue dots, 5px size)
-   Markers should have labels showing station names
-   Lines should connect routes based on topology data
-   Should use separate topologies for each layer
-   Station labels should be 8px font size, dark gray color
-   Background layers should be green (#badc58) with different opacities
-   All series types should work together in a single chart

**Visual States to Capture**:

-   Full map with all layers visible
-   Hover states over lines and markers
-   Label readability at different zoom levels
-   Layer ordering and transparency effects

#### 3. bubble-map Example

**Documentation Claims**:

-   Shows "Proportional Sized Markers"
-   Demonstrates markers and points of interest

**Expected Behaviors for example-tester Agent**:

-   Should render a world map background
-   Markers sized proportionally to population data
-   Uses data from multiple continents (europe, asia, africa, north america, south america, oceania)
-   Marker sizes range from 5px (min) to 60px (max)
-   Should display country labels on markers
-   Title should be "Population"
-   Should match topology ID using 'topologyIdKey: NAME_ENGL'
-   Markers should not appear in legend (showInLegend: false)
-   No padding on chart container
-   Should handle large datasets efficiently

**Visual States to Capture**:

-   Full map with all bubble markers
-   Size variation across different population values
-   Hover states showing population details
-   Label overlap handling for dense regions
-   Performance with many markers

### User Interactions to Validate

1. **Hover Interactions**:

    - Tooltips on geographic regions (world-colour-map)
    - Tooltips on route lines (lines)
    - Tooltips on markers (all examples)
    - Visual highlighting on hover

2. **Pan and Zoom**:

    - Map navigation capabilities
    - Zoom level constraints
    - Performance during navigation

3. **Legend Interactions**:

    - Gradient legend hover/click (world-colour-map)
    - Legend visibility controls

4. **Responsive Behavior**:
    - Map scaling at different viewport sizes
    - Label visibility adjustments
    - Mobile touch interactions

### Visual States to Screenshot and Analyze

1. **Default Rendering**:

    - Each example in its initial state
    - Legend positioning and formatting
    - Label visibility and readability

2. **Interactive States**:

    - Hover tooltips with content verification
    - Selection/highlight states
    - Pan/zoom states

3. **Edge Cases**:
    - Small viewport sizes
    - High zoom levels
    - Dense data regions

## Known Exceptions

No documented exceptions file exists for this page.

## Execution Plan

### Priority 1: Core Functionality Validation

1. **Verify enterprise-only designation**:

    - Confirm map series are properly gated as enterprise features
    - Check import statements use 'ag-charts-enterprise'

2. **Test world-colour-map example**:

    - Delegate to example-tester agent with expected behaviors
    - Capture screenshots of default state, hover interactions, legend
    - Verify gradient legend functionality
    - Test responsive behavior

3. **Test lines example**:

    - Delegate to example-tester agent with layer validation
    - Verify multiple series types work together
    - Screenshot layer ordering and transparency
    - Test line and marker interactions

4. **Test bubble-map example**:
    - Delegate to example-tester agent with size scaling validation
    - Verify proportional sizing algorithm
    - Test performance with large dataset
    - Screenshot dense regions for label overlap

### Priority 2: TypeScript and API Validation

1. **Cross-reference TypeScript interfaces**:

    - Verify all properties used in examples exist in type definitions
    - Check for required vs optional properties
    - Validate property types match usage

2. **Implementation verification**:
    - Confirm series types are registered in enterprise package
    - Check default values in implementation match behavior
    - Verify topology data structure requirements

### Priority 3: Documentation Consistency

1. **Verify example titles match functionality**
2. **Check links to detailed documentation pages**
3. **Validate that examples demonstrate claimed features**

### Success Criteria

-   All examples render without console errors
-   TypeScript interfaces match implementation
-   Interactive features work as expected
-   Visual output matches documentation descriptions
-   Performance is acceptable with real-world data volumes
-   Charts are accessible via keyboard navigation

### Estimated Complexity

-   **High complexity**: Multiple map series types with different data structures
-   **Time estimate**: 45-60 minutes for thorough validation
-   **Key challenges**:
    -   Validating geographic data rendering
    -   Testing performance with large datasets
    -   Verifying layer interactions

## Delegation Plan for example-tester Agent

### World Colour Map Example

**Task**: Validate geographic area visualization with gradient legend
**Key Points**:

-   Verify map-shape and map-shape-background series implementation
-   Check gradient legend configuration and formatting
-   Validate tooltip content for countries
-   Test color scale mapping to data values
-   Verify responsive legend behavior

### Lines Example

**Task**: Validate multi-layer map with routes and markers
**Key Points**:

-   Test layer ordering (background, lines, markers)
-   Verify separate topology data handling
-   Check marker label rendering and positioning
-   Validate line stroke properties
-   Test interaction between different series types

### Bubble Map Example

**Task**: Validate proportional marker sizing
**Key Points**:

-   Test size scaling algorithm (min: 5, max: 60)
-   Verify population data mapping
-   Check label visibility on markers
-   Test performance with combined continent data
-   Validate topology ID matching mechanism
