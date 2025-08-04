# Technical Review Plan: High Performance Charts

## Page Analysis Summary

The high-performance-charts documentation page is minimal but critical, showcasing performance-optimized features of AG Charts:

### Chart Types/Features Covered

-   **Ordered Data Example**: Demonstrates performance with time-series data

    -   Multiple series types: Line, Area, Bar, Range Area, Range Bar, Candlestick, OHLC
    -   Multiple axis types: Continuous Time, Ordinal Time, Ordinal Time with Parent Level, Unit Time
    -   Data scaling: 1k to 1m data points
    -   Zoom functionality with auto-scaling
    -   Navigator with mini-chart
    -   Scene stats debugging enabled

-   **Bubble/Scatter Example**: Demonstrates high-volume point rendering
    -   Bubble and Scatter series types
    -   `maxRenderedItems` performance optimization
    -   Multiple marker shapes
    -   Data scaling: 1k to 1m data points
    -   Zoom functionality (XY axes)
    -   Opacity optimizations for overlapping points

### Key APIs and Configuration Options Documented

-   None explicitly documented on this page - the page relies entirely on examples
-   Examples use undocumented features like `window.agChartsDebug = 'scene:stats'`
-   Examples demonstrate enterprise features (zoom, navigator)

### Interactive Features Expected

-   Data volume controls (1k, 10k, 100k, 1m points)
-   Series type switching
-   Axis type switching (ordered data example)
-   Shape selection (bubble/scatter example)
-   Max visible items slider (bubble/scatter example)
-   Zoom and pan interactions
-   Navigator interactions (ordered data example)

## Validation Targets

### TypeScript Interfaces to Verify

1. **Axis Types**:
    - `AgCartesianAxisOptions` - verify 'ordinal-time' and 'unit-time' axis types
    - Verify `parentLevel` property on ordinal-time axis
2. **Series Options**:

    - `AgBubbleSeriesOptions` - verify `maxRenderedItems` property
    - `AgScatterSeriesOptions` - verify `maxRenderedItems` property
    - Various series types used in ordered data example

3. **Performance Features**:
    - Zoom configuration with `autoScaling`
    - Navigator configuration with `miniChart`
    - Theme overrides for opacity optimization

### Implementation Files to Check

1. **Axis Implementations**:

    - `packages/ag-charts-community/src/chart/axis/ordinalTimeAxis.ts`
    - `packages/ag-charts-community/src/chart/axis/unitTimeAxis.ts`
    - Parent level implementation for ordinal-time axis

2. **Series Performance**:

    - Bubble series implementation for `maxRenderedItems`
    - Scatter series implementation for `maxRenderedItems`
    - Performance optimizations in rendering pipeline

3. **Debug Features**:
    - Scene stats implementation (undocumented `agChartsDebug`)

### Examples to Test with Expected Behaviors

#### Ordered Data Example (`ordered-data`)

**Documentation Claims**: None explicit - inferring from example code

**Expected Behaviors to Validate**:

1. **Performance with Large Datasets**:

    - Chart should handle 1k, 10k, 100k, 1m data points
    - Performance should remain acceptable at all data volumes
    - Scene stats should show render metrics

2. **Series Type Switching**:

    - Area, Bar, Line, Range Area, Range Bar, Candlestick, OHLC should all render correctly
    - Switching between types should maintain data and zoom state
    - Each series type should handle large datasets

3. **Axis Type Behaviors**:

    - Continuous Time: Standard time axis behavior
    - Ordinal Time: Should display discrete time points
    - Ordinal Time (Parent Level): Should show hierarchical time grouping
    - Unit Time: Should show uniform time intervals

4. **Zoom and Navigator**:
    - Zoom should work smoothly with large datasets
    - Auto-scaling should adjust zoom intelligently
    - Navigator mini-chart should provide overview
    - Pan and zoom interactions should be responsive

**example-tester Delegation**:

-   Verify no console errors with different data volumes
-   Check that scene stats are displayed
-   Validate series type switching maintains chart integrity
-   Test zoom/pan performance with large datasets
-   Verify navigator mini-chart updates correctly

#### Bubble/Scatter Example (`bubble-scatter`)

**Documentation Claims**: None explicit - inferring from example code

**Expected Behaviors to Validate**:

1. **maxRenderedItems Performance Feature**:

    - Should limit rendered points to specified value (default 2000)
    - Slider should dynamically update visible points (500-10000)
    - Performance should improve with lower limits
    - Points should be intelligently selected/culled

2. **Large Dataset Handling**:

    - Should handle up to 1m data points
    - Opacity settings (0.2) should help with overlapping points
    - Performance should remain acceptable

3. **Series Type and Shape Switching**:

    - Bubble vs Scatter series should render differently
    - All shapes should render correctly: circle, cross, diamond, heart, plus, square, star, triangle
    - Shape switching should maintain performance

4. **Zoom Functionality**:
    - XY zoom should work smoothly
    - Zoom performance should scale with maxRenderedItems

**example-tester Delegation**:

-   Verify maxRenderedItems actually limits rendered points
-   Test performance with different data volumes and render limits
-   Check that opacity theme overrides are applied
-   Validate all marker shapes render correctly
-   Test zoom/pan performance with various maxRenderedItems settings

### User Interactions to Validate

#### Ordered Data Example

1. **Data Volume Stress Testing**:

    - Click each data volume button (1k → 10k → 100k → 1m)
    - Monitor performance degradation
    - Check memory usage patterns

2. **Series Type Interactions**:

    - Switch between all 7 series types at different data volumes
    - Verify transitions are smooth
    - Check that zoom state is preserved

3. **Axis Type Testing**:

    - Switch between all 4 axis types
    - Verify parent level grouping appears for ordinal-time-parent
    - Check axis label rendering at different zoom levels

4. **Zoom/Pan Testing**:
    - Zoom in/out at different data volumes
    - Pan across large datasets
    - Test auto-scaling behavior
    - Interact with navigator

#### Bubble/Scatter Example

1. **maxRenderedItems Testing**:

    - Drag slider from 500 to 10000 in increments
    - Verify visual changes in point density
    - Check performance impact

2. **Data Volume with Render Limits**:

    - Test each data volume with different maxRenderedItems
    - Verify culling algorithm effectiveness

3. **Shape Performance Testing**:
    - Switch shapes at high data volumes
    - Check rendering performance for complex shapes

### Visual States to Screenshot

#### Ordered Data Example

1. Default state with 1k line chart
2. Each series type at 100k data points
3. Ordinal-time-parent axis showing parent levels
4. Zoomed-in state showing detail
5. Navigator interaction state
6. Scene stats overlay

#### Bubble/Scatter Example

1. Default bubble chart with 10k points
2. maxRenderedItems at minimum (500) and maximum (10000)
3. Scatter plot with 1m points
4. Each marker shape
5. Zoomed state showing point detail
6. Performance comparison states

## Known Exceptions

-   No exceptions file exists for this page

## Execution Plan

### Priority 1: Core Performance Features

1. Test maxRenderedItems functionality in bubble/scatter
2. Verify ordinal-time and unit-time axis types exist and work
3. Test performance with 1m data points
4. Validate zoom and navigator functionality

### Priority 2: Interactive Features

1. Test all series type switching combinations
2. Verify all marker shapes render correctly
3. Test axis type switching behaviors
4. Validate scene stats debugging

### Priority 3: Visual and UX Testing

1. Screenshot all major states
2. Test responsive behavior
3. Verify opacity optimizations
4. Check tooltip behavior at scale

### Success Criteria

-   Examples handle 1m data points without crashing
-   maxRenderedItems effectively limits rendering
-   All axis types render correctly
-   Zoom/pan remains responsive at scale
-   No console errors during interactions
-   Scene stats provide useful metrics

### Estimated Complexity

-   High complexity due to performance testing requirements
-   Need to carefully monitor browser performance
-   Multiple data volumes and configurations to test
-   Approximately 45-60 minutes for thorough testing
