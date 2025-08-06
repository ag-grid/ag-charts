# Technical Review Plan: Events Documentation

## Page Analysis Summary

### Chart Types/Features Covered

-   **Event Categories**: Chart events, Series events, Legend events
-   **Event Types**: click, doubleClick, seriesNodeClick, seriesNodeDoubleClick, seriesVisibilityChange, annotations, zoom, legendItemClick, legendItemDoubleClick
-   **Interaction Features**: nodeClickRange configuration for click detection precision
-   **Event Prevention**: preventDefault() mechanism for controlling default behaviors

### Key APIs and Configuration Options Documented

-   **Event Listeners**: Configured via `listeners` property on chart, series, and legend objects
-   **nodeClickRange**: Controls interaction sensitivity ('exact', 'nearest', or pixel distance)
-   **Event Objects**: Specific interfaces for each event type containing contextual data
-   **preventDefault**: Function to stop default behaviors (e.g., series visibility toggling)

### Examples Referenced and Their Purposes

1. **chart-click-event**: Demonstrates chart-level click/doubleClick on empty areas
2. **series-node-click-event**: Shows node clicks with temperature data and series identification
3. **series-visibility-change**: Legend toggling with preventDefault and counter mechanism
4. **annotations-event**: Annotation change events with financial chart toolbar
5. **zoom-event**: Zoom/pan events with ratio and range data
6. **node-click-event**: Bar clicks showing sales breakdown by brand
7. **node-click-select**: Toggle node selection state with marker styling
8. **legend-item-click-event**: Legend item click/doubleClick events
9. **interaction-ranges**: Different nodeClickRange configurations

### Interactive Features Described

-   Click detection on chart background, series nodes, and legend items
-   Double-click handling with proper event sequencing
-   Hover states and tooltips (implicit in node interactions)
-   Legend-driven series visibility toggling
-   Zoom and pan interactions
-   Annotation manipulation
-   Selection state toggling with visual feedback

## Validation Targets

### Specific TypeScript Interfaces to Verify

1. **AgSeriesVisibilityChange** (packages/ag-charts-types/src/chart/eventOptions.ts)
    - Properties: seriesId, visible, itemId?, legendItemName?
2. **AgChartLegendClickEvent** (packages/ag-charts-types/src/chart/legendOptions.ts)

    - Properties: seriesId, itemId, enabled, preventDefault()

3. **AgSeriesListeners** (packages/ag-charts-types/src/series/seriesOptions.ts)
    - Methods: seriesNodeClick?, seriesNodeDoubleClick?
4. **AgChartLegendListeners** (packages/ag-charts-types/src/chart/legendOptions.ts)
    - Methods: legendItemClick?, legendItemDoubleClick?
5. **AgBaseChartListeners** (packages/ag-charts-types/src/chart/chartOptions.ts)
    - Methods: click?, doubleClick?, seriesNodeClick?, seriesNodeDoubleClick?, seriesVisibilityChange?, annotations?, zoom?
6. **AgBaseSeriesOptions** (packages/ag-charts-types/src/series/seriesOptions.ts)
    - Property: nodeClickRange? ('exact' | 'nearest' | number)

### Implementation Files to Check

1. **Event Handling Core**:
    - packages/ag-charts-community/src/chart/interaction/interactionManager.ts
    - packages/ag-charts-community/src/chart/interaction/clickManager.ts
2. **Series Event Implementation**:
    - packages/ag-charts-community/src/chart/series/series.ts
    - packages/ag-charts-community/src/chart/series/cartesian/barSeries.ts (for bar click examples)
    - packages/ag-charts-community/src/chart/series/cartesian/lineSeries.ts (for line marker clicks)
3. **Legend Event Implementation**:
    - packages/ag-charts-community/src/chart/legend/legend.ts
    - packages/ag-charts-community/src/chart/legend/legendMarker.ts
4. **Zoom Event Implementation**:
    - packages/ag-charts-community/src/chart/interaction/zoomManager.ts
    - packages/ag-charts-community/src/chart/navigator/navigator.ts

### Examples to Test with Expected Behaviors

#### For example-tester agent delegation:

1. **chart-click-event**

    - **Documentation claims**: Click on empty chart areas logs to console, double-click shows different message
    - **Expected behaviors**:
        - Single click on blank area → console log "Chart clicked"
        - Double click on blank area → console logs for both click and doubleClick
        - Clicks on series nodes should NOT trigger chart click events
    - **Code patterns to verify**: `listeners: { click: ..., doubleClick: ... }` at chart level

2. **series-node-click-event**

    - **Documentation claims**: Column/line marker clicks show node info with temperature data
    - **Expected behaviors**:
        - Click on column → console shows datum info with temperature
        - Click on line marker → console shows datum info
        - Double-click → shows temperatures in Fahrenheit
        - Series ID is logged for each interaction
    - **Specific features**: Temperature conversion on double-click, series identification

3. **series-visibility-change**

    - **Documentation claims**: Legend clicks decrement counter, visibility changes when counter reaches zero
    - **Expected behaviors**:
        - First 4 legend clicks → counter decreases, no visibility change
        - 5th legend click → series toggles visibility
        - Console logs seriesId and visible state
    - **Code patterns**: preventDefault() usage in legendItemClick

4. **annotations-event**

    - **Documentation claims**: Annotation changes trigger events with annotation array
    - **Expected behaviors**:
        - Adding/removing/modifying annotations → event fired
        - Event contains full annotations array
    - **Interactive features**: Financial toolbar integration

5. **zoom-event**

    - **Documentation claims**: Zoom/pan triggers events with ratios and ranges
    - **Expected behaviors**:
        - Zoom in/out → event with ratioX/ratioY (0-1 values)
        - Pan → event with updated start/end ratios
        - Non-category axes include rangeX/rangeY with axis-specific values
    - **Data validation**: Ratio values between 0 and 1, range values match axis type

6. **node-click-event**

    - **Documentation claims**: Bar clicks show sales breakdown by brand
    - **Expected behaviors**:
        - Click on bar → console shows bar value and brand breakdown
        - Event contains datum with additional properties
    - **Data extraction**: Access to full datum object beyond displayed values

7. **node-click-select**

    - **Documentation claims**: Click toggles node selection state with visual feedback
    - **Expected behaviors**:
        - Click on marker → visual change (selection state)
        - Click again → toggles back
        - Selection state persists across other interactions
    - **Visual validation**: Marker appearance changes on selection

8. **legend-item-click-event**

    - **Documentation claims**: Legend clicks log seriesId and itemId
    - **Expected behaviors**:
        - Single click → legendItemClick event with seriesId, itemId
        - Double click → both click and doubleClick events
    - **Event properties**: Verify seriesId and itemId values

9. **interaction-ranges**
    - **Documentation claims**: nodeClickRange controls click detection precision
    - **Expected behaviors**:
        - 'exact' → only direct node clicks trigger events
        - 'nearest' → clicks anywhere trigger event for nearest node
        - Number (e.g., 20) → clicks within 20px of node trigger event
    - **Precision testing**: Click at various distances from nodes

### User Interactions to Validate

1. **Click precision**: Test clicks at various distances from nodes with different nodeClickRange settings
2. **Double-click timing**: Verify proper event sequencing for double-clicks
3. **Event bubbling**: Confirm series node clicks don't trigger chart background clicks
4. **Legend interaction**: Test legend click prevention and visibility toggling
5. **Zoom/pan gestures**: Validate mouse-based zoom and pan interactions
6. **Annotation manipulation**: Test annotation toolbar interactions
7. **Multi-series scenarios**: Verify correct series identification in events
8. **Edge cases**: Rapid clicking, clicking during animations, viewport boundaries

### Visual States to Screenshot and Analyze

1. **Default chart states** for all examples
2. **Hover states** over nodes, legend items, and interactive elements
3. **Selection states** in node-click-select example
4. **Tooltip appearances** during node interactions
5. **Legend states** (enabled/disabled series)
6. **Zoom states** (zoomed in, panned positions)
7. **Annotation overlays** in financial chart example
8. **Click feedback** visual indicators

### Interactive Features Requiring Before/After Visual Comparison

1. **Series visibility toggle**: Before/after legend click
2. **Node selection**: Before/after click in node-click-select
3. **Zoom operations**: Before/after zoom in/out
4. **Pan operations**: Before/after dragging
5. **Annotation changes**: Before/after adding/modifying annotations

### Chart Elements That Should Be Interactive

Based on documentation claims:

1. **Empty chart areas**: Should respond to click/doubleClick
2. **Series nodes**: Bars, line markers, area markers should be clickable
3. **Legend items**: Should be clickable with visibility toggle
4. **Chart canvas**: Should support zoom/pan gestures
5. **Annotations**: Should be modifiable (if toolbar present)

### Expected Tooltip Content and Highlighting Behaviors

1. **Node hover**: Tooltips showing data values
2. **Legend hover**: Visual feedback on legend items
3. **Series highlighting**: Related series elements highlight on legend hover
4. **Annotation hover**: Edit handles or selection indicators

## Known Exceptions

No technical-review-exceptions.md file exists for this page.

## Execution Plan

### Prioritized Testing Checklist

#### High Priority

1. **Event Object Validation** (Critical for API contract)
    - Verify all documented event properties exist at runtime
    - Confirm property types match TypeScript definitions
    - Test preventDefault() functionality
2. **Click Event Propagation** (Core functionality)
    - Test event bubbling/stopping between series and chart
    - Verify double-click event sequencing
    - Validate nodeClickRange behaviors
3. **Series Visibility Toggle** (Common use case)
    - Test legend click → visibility change flow
    - Verify preventDefault() stops default behavior
    - Confirm seriesVisibilityChange event firing

#### Medium Priority

4. **Interactive Range Testing** (Feature completeness)
    - Test all three nodeClickRange options
    - Verify pixel-distance calculations
    - Test 'nearest' node detection algorithm
5. **Multi-Series Event Attribution** (Data integrity)
    - Verify correct seriesId in events
    - Test overlapping series scenarios
    - Validate datum access in events
6. **Zoom/Pan Event Data** (Advanced features)
    - Verify ratio calculations (0-1 range)
    - Test range values for different axis types
    - Validate event firing frequency

#### Low Priority

7. **Annotation Events** (Enterprise feature)
    - Test annotation lifecycle events
    - Verify event data completeness
8. **Visual Feedback Validation** (UX polish)
    - Screenshot all hover states
    - Capture selection visual changes
    - Document tooltip appearances
9. **Edge Case Scenarios** (Robustness)
    - Rapid event firing
    - Events during animations
    - Boundary condition testing

### Success Criteria for Each Test

1. **Event objects contain all documented properties**
2. **Property types match TypeScript definitions exactly**
3. **preventDefault() successfully stops default behaviors**
4. **Event propagation follows documented rules**
5. **nodeClickRange behaves precisely as documented**
6. **Visual feedback matches user interactions**
7. **No console errors during any interaction**
8. **Performance remains stable under rapid interactions**

### Estimated Complexity/Time

-   **Phase 1 (Plan)**: ✓ Completed
-   **Phase 2 (Execution)**: ~2-3 hours
    -   TypeScript validation: 30 min
    -   Example testing with example-tester: 60 min
    -   Interactive testing and screenshots: 60 min
    -   Report compilation: 30 min
-   **Total scope**: High - 9 examples with complex interaction patterns

## Delegation Plan for example-tester Agent

### Testing Instructions for example-tester

For each example, validate:

1. **Code Structure**:

    - Correct event listener syntax
    - Proper TypeScript types if used
    - AG Charts API usage patterns

2. **Runtime Behavior**:

    - Open example in browser
    - Check console for errors
    - Perform documented interactions
    - Verify console output matches documentation claims

3. **Specific Validations by Example**:

    **chart-click-event**:

    - Click empty chart area → verify console log
    - Click on data points → verify NO chart click event
    - Double-click empty area → verify both events fire

    **series-node-click-event**:

    - Click columns and line markers
    - Verify temperature data in console
    - Check series ID is logged
    - Double-click for Fahrenheit conversion

    **series-visibility-change**:

    - Click legend items 5 times
    - Verify counter behavior
    - Confirm visibility change on 5th click
    - Check preventDefault() implementation

    **interaction-ranges**:

    - Test each dropdown option
    - Click at various distances from nodes
    - Verify 'exact' requires direct hit
    - Verify 'nearest' always finds a node
    - Verify pixel distance accuracy

4. **Report Format**:
    - List any console errors
    - Confirm expected behaviors work
    - Note any deviations from documentation
    - Flag performance issues
    - Identify missing TypeScript types
