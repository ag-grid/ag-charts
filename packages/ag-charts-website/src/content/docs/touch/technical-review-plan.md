# Technical Review Plan: Touch Documentation

## Page Analysis Summary

### Chart Types/Features Covered

-   Touch and multi-touch support for AG Charts
-   Single finger touch dragging behaviors
-   Two finger zoom and pan gestures
-   Long tap functionality for context menu
-   Touch options configuration

### Key APIs and Configuration Options Documented

-   `touch.dragAction`: Controls single finger drag behavior ('none' | 'drag' | 'hover')
-   `zoom.enableTwoFingerZoom`: Controls two finger zoom/pan gestures (boolean)
-   Touch interactions with various chart features (tooltips, crosshairs, legend, zoom, annotations)

### Examples Referenced and Their Purposes

1. **single-finger-touch-dragging**: Demonstrates different `dragAction` behaviors

    - Shows how 'none', 'drag', and 'hover' options affect touch interactions
    - Enterprise feature example

2. **two-finger-zoompan**: Demonstrates two finger zoom/pan control

    - Shows `enableTwoFingerZoom` option
    - Enterprise feature example

3. **long-tap**: Demonstrates long tap to open context menu
    - Shows touch interaction with context menu feature
    - Enterprise feature example

### Interactive Features Described

-   Tap for tooltips and crosshairs
-   Tap/double-tap for legend toggling and zoom reset
-   Long tap for context menu
-   Single finger drag for panning or hovering
-   Two finger pinch for zooming
-   Two finger drag for panning while zoomed
-   Touch events trigger corresponding click/double-click events

## Validation Targets

### Specific TypeScript Interfaces to Verify

-   `AgTouchOptions` in `packages/ag-charts-types/src/chart/chartOptions.ts`
    -   Verify `dragAction` property type and documentation
-   `AgZoomOptions` in `packages/ag-charts-types/src/chart/zoomOptions.ts`
    -   Verify `enableTwoFingerZoom` property type and documentation

### Implementation Files to Check

-   `packages/ag-charts-community/src/chart/touch.ts`
    -   Verify default value for `dragAction` (documented as 'drag')
-   `packages/ag-charts-enterprise/src/features/zoom/zoom.ts`
    -   Verify default value for `enableTwoFingerZoom` (documented as true)
-   Touch event handling implementation in chart interaction layer

### Examples to Test with Expected Behaviors

#### 1. single-finger-touch-dragging

**Documentation claims:**

-   `dragAction: 'none'` disables chart's single finger input handling, allowing page scroll
-   `dragAction: 'drag'` emulates mouse dragging, panning the viewport if possible
-   `dragAction: 'hover'` emulates mouse movements, updating tooltip and highlighted node

**Expected behaviors to validate:**

-   Example should show three different configurations with buttons/controls to switch between them
-   When 'none' is selected: Single finger drag should not interact with chart (page would scroll if embedded)
-   When 'drag' is selected: Single finger drag should pan the chart if zoomed
-   When 'hover' is selected: Single finger drag should show tooltips following finger movement
-   All three modes should be enterprise features

**Specific features to demonstrate:**

-   Interactive controls to switch between dragAction modes
-   Visual feedback showing current mode
-   Chart should have zoomable content to test drag/pan behavior
-   Data points for tooltip testing

#### 2. two-finger-zoompan

**Documentation claims:**

-   Two finger pinch gestures zoom in/out
-   Two finger drag pans a zoomed chart
-   `enableTwoFingerZoom: false` passes gesture to underlying page

**Expected behaviors to validate:**

-   Example should demonstrate two finger zoom capability
-   Should have toggle control for `enableTwoFingerZoom`
-   When enabled: Two finger gestures should zoom/pan the chart
-   When disabled: Two finger gestures should not affect the chart
-   Enterprise feature requiring zoom module

**Specific features to demonstrate:**

-   Toggle control for enableTwoFingerZoom
-   Visual indication of zoom state
-   Chart with sufficient data to make zooming meaningful
-   Clear indication when zoom is active

#### 3. long-tap

**Documentation claims:**

-   Long tapping opens the context menu if available

**Expected behaviors to validate:**

-   Example should have context menu enabled
-   Long tap gesture should trigger context menu display
-   Context menu should appear at touch location
-   Enterprise feature requiring context menu module

**Specific features to demonstrate:**

-   Context menu with relevant options
-   Visual feedback during long press
-   Proper positioning of menu at touch point

### User Interactions to Validate

1. Single tap interactions (tooltips, crosshairs)
2. Double tap interactions (legend toggle, zoom reset)
3. Single finger drag in all three modes
4. Two finger pinch zoom (in and out)
5. Two finger pan while zoomed
6. Long tap for context menu
7. Touch event to click/double-click event mapping

### Visual States to Screenshot and Analyze

1. Default chart state
2. Tooltip display on tap
3. Single finger drag in 'hover' mode showing tooltip
4. Chart in zoomed state (after two finger pinch)
5. Context menu displayed after long tap
6. Legend item toggled state after tap
7. Different dragAction mode states

### Interactive Features Requiring Before/After Visual Comparison

1. Before/after two finger zoom
2. Before/after legend toggle tap
3. Before/after long tap showing context menu
4. Chart state changes when switching dragAction modes

### Chart Elements That Should Be Interactive

-   Data points/series (tap for tooltips)
-   Legend items (tap to toggle)
-   Chart area (drag behaviors based on dragAction)
-   Zoom-enabled areas (two finger gestures)
-   Any area for context menu (long tap)

### Expected Tooltip Content and Highlighting Behaviors

-   Tap on data points should show tooltips with data values
-   Single finger drag in 'hover' mode should update tooltips dynamically
-   Crosshairs should appear when applicable
-   Series/data point highlighting on interaction

## Known Exceptions

No existing technical-review-exceptions.md file found for this page.

## Execution Plan

### Priority 1: API Contract Validation

1. Verify `AgTouchOptions` interface matches documentation
2. Verify `AgZoomOptions.enableTwoFingerZoom` property exists
3. Check default values in implementation files
4. Confirm enterprise vs community feature availability

### Priority 2: Example Testing via example-tester Agent

1. Test single-finger-touch-dragging example

    - Validate all three dragAction modes
    - Verify configuration switching works
    - Check for console errors
    - Validate TypeScript usage

2. Test two-finger-zoompan example

    - Validate zoom toggle functionality
    - Verify zoom configuration
    - Check enterprise feature integration

3. Test long-tap example
    - Validate context menu integration
    - Verify touch event handling

### Priority 3: Visual and Interaction Testing

1. Screenshot all examples in default state
2. Test touch interactions manually:
    - Single tap for tooltips
    - Drag behaviors in different modes
    - Zoom gestures (if testable in browser)
    - Long tap for context menu
3. Capture interaction states visually
4. Verify responsive behavior

### Priority 4: Documentation Completeness

1. Verify all touch gestures are documented
2. Check if touch event mapping is complete
3. Validate enterprise feature indicators
4. Review API reference completeness

### Success Criteria

-   All documented APIs exist and match implementation
-   Examples demonstrate all documented features
-   Touch interactions work as described
-   Default values are accurate
-   Enterprise features are properly marked
-   No console errors in examples
-   Visual feedback matches documentation

### Estimated Complexity

-   **High complexity** due to:
    -   Touch gesture testing requirements
    -   Multiple interaction modes
    -   Enterprise feature validation
    -   Visual state capture needs
    -   Browser limitations for touch testing

### Delegation Plan for example-tester Agent

For each example, provide the agent with:

1. **single-finger-touch-dragging**:

    - Validate three dragAction configurations exist
    - Check for proper AG Charts touch API usage
    - Verify enterprise zoom module is used
    - Confirm no console errors
    - Check TypeScript types are correct

2. **two-finger-zoompan**:

    - Validate enableTwoFingerZoom configuration
    - Check zoom module integration
    - Verify toggle control implementation
    - Confirm enterprise features work

3. **long-tap**:
    - Validate context menu configuration
    - Check touch event handling setup
    - Verify enterprise context menu module
    - Confirm proper event listeners
