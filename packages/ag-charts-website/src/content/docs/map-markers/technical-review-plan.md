# Technical Review Plan: Map Markers

## Page Analysis Summary

### Chart Types/Features Covered

-   Map Marker Series (`map-marker` series type)
-   Geographic point visualization with varying marker sizes
-   Marker positioning via topology files or latitude/longitude data
-   Proportional marker sizing based on data values
-   Customization of marker appearance (fill, stroke, shape)
-   Label placement on markers

### Key APIs and Configuration Options Documented

-   `type: 'map-marker'` - Series type identifier
-   `idKey` - Property key in data to match against topology
-   `latitudeKey` / `longitudeKey` - Keys for geographic positioning from data
-   `sizeKey` - Key for determining marker size from data
-   `sizeName` - Display name for size values in tooltips
-   `size` - Base size for smallest data point
-   `maxSize` - Maximum size for largest data point
-   `fill`, `stroke`, `shape` - Marker styling options
-   Label configuration (mentioned but not detailed)

### Examples Referenced

1. **"markers"** - Simple Map Markers

    - Basic marker series with topology
    - Combined with map-shape-background series
    - Uses `idKey` for data-topology matching

2. **"marker-series"** - Map Marker Position from Data

    - Markers positioned using latitude/longitude from data
    - No topology file required
    - Direct geographic coordinates approach

3. **"marker-size"** - Proportional Marker Size
    - Variable marker sizes based on data values
    - Demonstrates `sizeKey`, `size`, and `maxSize` configuration
    - Shows count-based sizing with custom display name

### Interactive Features Described

-   Tooltips (referenced but not detailed)
-   Implicit hover/selection behavior for markers
-   Legend integration (via `legendItemName` in API)

## Validation Targets

### TypeScript Interfaces to Verify

1. `AgMapMarkerSeriesOptions` in `/packages/ag-charts-types/src/series/topology/mapMarkerOptions.ts`
    - Verify all documented properties exist
    - Check property types match documentation
    - Validate optional vs required properties
    - Compare documented defaults with interface

### Implementation Files to Check

1. Map marker series implementation in enterprise package:

    - Look for `mapMarkerSeries.ts` or similar in `/packages/ag-charts-enterprise/src/`
    - Verify default values for `size`, `maxSize`
    - Check topology vs lat/lon positioning logic
    - Validate marker sizing algorithm

2. Property decorators for default values:
    - Check `@Property` decorators for actual defaults
    - Verify size scaling implementation

### Examples to Test with Expected Behaviors

#### 1. "markers" Example

**Documentation claims:**

-   Shows simple map markers using topology
-   Combined with map-shape-background series
-   Uses `idKey` to match data with topology
-   Background series rendered behind markers due to array order

**Expected behaviors to validate:**

-   Markers should appear on map at locations defined by topology
-   Background map shape should be visible behind markers
-   Hover over markers should show tooltips with data
-   Markers should use default styling if not specified
-   Data-topology matching via `idKey` should work correctly

**Features to demonstrate:**

-   Basic marker rendering
-   Topology-based positioning
-   Series layering (background behind markers)
-   Default marker appearance

#### 2. "marker-series" Example

**Documentation claims:**

-   Uses latitude/longitude from data instead of topology
-   No topology required for map-marker series
-   Best suited for coordinate-based data (e.g., crime data)
-   Uses `latitudeKey` and `longitudeKey` fields

**Expected behaviors to validate:**

-   Markers positioned accurately at lat/lon coordinates
-   No topology file dependency for markers
-   Background map shape still rendered correctly
-   Tooltips show coordinate information
-   Markers cluster appropriately if coordinates overlap

**Features to demonstrate:**

-   Coordinate-based positioning
-   Data-driven geographic placement
-   Independence from topology files
-   Coordinate precision handling

#### 3. "marker-size" Example

**Documentation claims:**

-   Marker sizes vary based on data values
-   Uses `sizeKey` to determine size from data
-   `sizeName` configures display name in tooltips
-   `size` sets minimum marker size (3px)
-   `maxSize` sets maximum marker size (50px)
-   Size scales proportionally between min and max

**Expected behaviors to validate:**

-   Smallest data value → 3px marker
-   Largest data value → 50px marker
-   Intermediate values scale linearly
-   Tooltips display size value with custom name
-   Visual size differences clearly distinguishable
-   Size scaling maintains circular shape

**Features to demonstrate:**

-   Proportional size scaling
-   Size range configuration
-   Tooltip integration with size data
-   Visual data representation through size

### User Interactions to Validate

1. **Hover interactions:**

    - Hover over individual markers for tooltips
    - Hover over overlapping markers
    - Hover over background map areas
    - Verify tooltip positioning near viewport edges

2. **Selection/Click behavior:**

    - Click on markers
    - Click on background map
    - Multi-selection capabilities

3. **Legend interactions:**

    - Toggle series visibility via legend
    - Verify marker series appears in legend

4. **Pan/Zoom behavior:**
    - Test if map supports panning
    - Test zoom interactions
    - Verify marker sizes scale appropriately

### Visual States to Screenshot

1. Default rendering state for all three examples
2. Hover state showing tooltips
3. Different viewport sizes (desktop, tablet, mobile)
4. Markers at various sizes (for size example)
5. Overlapping markers behavior
6. Legend visibility states
7. Edge positioning (markers near map boundaries)

## Known Exceptions

No technical review exceptions file exists for this page.

## Execution Plan

### Priority 1: API Contract Validation

1. Cross-reference all documented properties with `AgMapMarkerSeriesOptions` interface
2. Verify property types and optionality
3. Check for undocumented required properties
4. Validate deprecated property handling

### Priority 2: Example Testing via example-tester Agent

1. **Test "markers" example:**

    - Delegate to example-tester with topology-based positioning expectations
    - Verify series layering and basic marker rendering
    - Check console for errors/warnings
    - Validate TypeScript usage

2. **Test "marker-series" example:**

    - Delegate to example-tester with lat/lon positioning expectations
    - Verify coordinate-based placement accuracy
    - Check data binding correctness
    - Validate no topology dependency

3. **Test "marker-size" example:**
    - Delegate to example-tester with size scaling expectations
    - Verify proportional sizing algorithm
    - Check tooltip content includes size information
    - Validate size range configuration

### Priority 3: Visual and Interactive Testing

1. **Screenshot capture for all examples:**

    - Default states
    - Hover states with tooltips
    - Multiple viewport sizes
    - Size variations (for size example)

2. **Interactive testing:**

    - Systematic hover over markers
    - Click interactions
    - Legend toggling
    - Pan/zoom if supported

3. **Edge case testing:**
    - Overlapping markers
    - Markers at map boundaries
    - Empty data scenarios
    - Invalid coordinates

### Priority 4: Implementation Verification

1. Locate map marker series implementation files
2. Verify default values match documentation
3. Check sizing algorithm implementation
4. Validate topology vs coordinate positioning logic

### Priority 5: Content Quality Assessment

1. Check completeness of customization options
2. Verify API reference completeness
3. Assess clarity of positioning options explanation
4. Review tooltip configuration coverage

## Success Criteria

-   All documented properties exist in TypeScript interface
-   Examples render without console errors
-   Marker positioning works as documented (topology and lat/lon)
-   Size scaling produces expected visual results
-   Interactive features (tooltips, hover) function correctly
-   Documentation accurately describes all features
-   No significant visual or functional issues

## Estimated Complexity

-   **High complexity** due to:
    -   Geographic data handling
    -   Multiple positioning methods
    -   Size scaling algorithm
    -   Enterprise-only feature
    -   Integration with map topology
    -   Visual testing requirements

## example-tester Agent Delegation Plan

### Example 1: "markers"

**Expectations to validate:**

-   Topology-based marker positioning works correctly
-   `idKey` properly matches data to topology features
-   Map-shape-background series renders behind markers
-   Default marker styling applied
-   No console errors or warnings
-   TypeScript types used correctly

### Example 2: "marker-series"

**Expectations to validate:**

-   Latitude/longitude positioning accurate
-   No topology file required or referenced
-   Coordinates properly mapped to screen positions
-   Background map still renders correctly
-   Data binding works for coordinate fields
-   Performance acceptable with many points

### Example 3: "marker-size"

**Expectations to validate:**

-   `sizeKey` data properly controls marker sizes
-   Size scales from 3px (min) to 50px (max)
-   `sizeName` appears in tooltips
-   Linear scaling between size extremes
-   Visual differentiation clear and meaningful
-   All size-related configurations work as documented
