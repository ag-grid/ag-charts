# Technical Review Plan: Zoom Documentation

## Page Analysis Summary

### Chart Types/Features Covered

-   **Zoom functionality** (Enterprise feature)
-   Mouse scrolling zoom with configurable anchor points and step sizes
-   Click-and-drag panning
-   Select-to-zoom (drag selection box)
-   Touch/multi-touch gestures (two-finger pinch/pan)
-   Axis-specific zoom controls (drag axis to zoom/pan)
-   Double-click/tap to reset
-   Keyboard zoom controls (+/- keys)
-   Auto-scaling y-axis based on visible data
-   Zoom buttons UI with customization
-   Asynchronous data loading during zoom
-   Integration with Navigator and Context Menu
-   State persistence via Chart State API

### Key APIs and Configuration Options Documented

-   `zoom.enabled` - Main enable flag
-   `zoom.enableScrolling` - Mouse wheel/trackpad zoom
-   `zoom.anchorPointX/Y` - Zoom anchor behavior ('start', 'middle', 'end', 'pointer')
-   `zoom.scrollingStep` - Zoom increment per scroll (default 0.1)
-   `zoom.axes` - Which axes to zoom ('x', 'y', 'xy')
-   `zoom.enablePanning` - Click-drag pan behavior
-   `zoom.panKey` - Modifier key for panning when selecting is enabled
-   `zoom.enableSelecting` - Drag-to-select zoom area
-   `zoom.enableTwoFingerZoom` - Touch gesture support
-   `zoom.enableAxisDragging` - Drag axis to zoom
-   `zoom.axisDraggingMode` - Axis drag behavior ('zoom', 'pan')
-   `zoom.enableAxisScrolling` - Scroll on axis to zoom
-   `zoom.enableDoubleClickToReset` - Double-click reset behavior
-   `zoom.minVisibleItems` - Zoom limit constraint
-   `zoom.autoScaling` - Y-axis auto-fit to visible data
-   `zoom.buttons` - Zoom button UI configuration
-   `dataSource.getData` - Async data loading callback

### Examples Referenced and Their Purposes

1. **zoom** - Basic zoom functionality demonstration
2. **zoom-anchor-point** - Demonstrates anchorPointX/Y with 'pointer' setting
3. **zoom-scrolling-step** - Shows custom scrollingStep (0.4)
4. **zoom-axes** - Enables zoom on both X and Y axes
5. **zoom-pan-key** - Demonstrates panKey configuration with 'shift'
6. **zoom-selecting** - Select-to-zoom with other methods disabled
7. **two-finger-disabled** - Disables two-finger touch gestures
8. **zoom-axis-controls** - Axis dragging modes and controls
9. **zoom-min-visible-items** - Minimum zoom constraint (10 items)
10. **auto-scaling** - Y-axis auto-scaling disabled example
11. **zoom-context-menu** - Context menu integration
12. **zoom-buttons** - Default zoom buttons UI
13. **zoom-custom-buttons** - Customized button configuration
14. **zoom-async** - Asynchronous data loading during zoom

### Interactive Features Described

-   Mouse wheel scrolling (zoom in/out)
-   Click and drag to pan
-   Click and drag to select zoom area
-   Axis dragging to zoom/pan specific axis
-   Double-click to reset (chart area or specific axis)
-   Two-finger pinch to zoom
-   Two-finger pan
-   Keyboard controls (+/- keys)
-   Hover to reveal zoom buttons
-   Context menu zoom actions
-   Touch gestures on mobile devices

## Validation Targets

### Specific TypeScript Interfaces to Verify

-   `AgZoomOptions` - Main zoom configuration interface
-   `AgDataSourceOptions` - Async data loading interface
-   Button configuration types (icon, tooltip, value, label, section properties)
-   Anchor point type values ('start', 'middle', 'end', 'pointer')
-   Pan key type values ('alt', 'ctrl', 'shift', 'meta')
-   Axes type values ('x', 'y', 'xy')
-   Axis dragging mode values ('zoom', 'pan')
-   Button visibility values ('always', 'zoomed', 'hover')

### Implementation Files to Check

-   Zoom module implementation in enterprise package
-   Zoom interaction handlers
-   Button UI implementation
-   Auto-scaling logic
-   Async data source handling
-   Touch gesture support
-   Keyboard event handlers
-   Context menu integration code
-   Navigator integration points

### Examples to Test with Expected Behaviors

#### 1. zoom (Basic Example)

**Documentation claims:**

-   Scroll to zoom in/out
-   Touch/multi-touch functionality
-   +/- keys for zoom
-   Click-drag to pan
-   Axis drag to zoom that axis
-   Double-click to reset
-   Updates axis ticks when tick.maxSpacing is set

**Expected behaviors for example-tester:**

-   Chart should render with zoom enabled
-   Mouse wheel should zoom the chart
-   Clicking and dragging should pan the chart
-   Dragging an axis should zoom that axis only
-   Double-clicking should reset zoom to original state
-   +/- keys should zoom when chart has focus

#### 2. zoom-anchor-point

**Documentation claims:**

-   Sets anchor to 'pointer' for both axes
-   Zoom keeps mouse pointer at same chart position

**Expected behaviors for example-tester:**

-   Zooming should keep the point under the mouse cursor stationary
-   Both X and Y axes should use pointer anchoring

#### 3. zoom-scrolling-step

**Documentation claims:**

-   Sets scrollingStep to 0.4 (40% per scroll)

**Expected behaviors for example-tester:**

-   Each scroll should zoom by 40% instead of default 10%
-   Larger zoom increments should be noticeable

#### 4. zoom-axes

**Documentation claims:**

-   Enables zoom on both X and Y axes
-   Default is X-axis only

**Expected behaviors for example-tester:**

-   Scrolling should zoom both axes simultaneously
-   Should demonstrate 'xy' axes configuration

#### 5. zoom-pan-key

**Documentation claims:**

-   Requires shift key for panning
-   Selecting is enabled

**Expected behaviors for example-tester:**

-   Normal click-drag should create selection box
-   Shift+click-drag should pan the chart
-   panKey should be set to 'shift'

#### 6. zoom-selecting

**Documentation claims:**

-   Only selection zoom enabled
-   All other zoom methods disabled
-   Double-click to reset still works

**Expected behaviors for example-tester:**

-   Click-drag should create selection box for zooming
-   No scrolling, panning, or axis dragging
-   Double-click should reset zoom

#### 7. two-finger-disabled

**Documentation claims:**

-   Two-finger gestures not consumed by chart
-   Page zooms/scrolls instead

**Expected behaviors for example-tester:**

-   enableTwoFingerZoom should be false
-   Touch gestures should not affect chart zoom

#### 8. zoom-axis-controls

**Documentation claims:**

-   axisDraggingMode: 'zoom' makes dragging y-axes zoom both
-   Can set to 'pan' mode
-   Can disable with enableAxisDragging: false
-   enableAxisScrolling enables axis scroll zoom

**Expected behaviors for example-tester:**

-   Should demonstrate different axis dragging modes
-   Y-axes should zoom together in 'zoom' mode

#### 9. zoom-min-visible-items

**Documentation claims:**

-   Limits zoom to minimum 10 visible items
-   Prevents excessive zoom

**Expected behaviors for example-tester:**

-   Should not be able to zoom beyond 10 data points
-   minVisibleItems should be set to 10

#### 10. auto-scaling

**Documentation claims:**

-   Disabled auto-scaling example
-   Y-axis doesn't adjust when panning

**Expected behaviors for example-tester:**

-   autoScaling.enabled should be false
-   Y-axis should remain fixed when panning X-axis

#### 11. zoom-context-menu

**Documentation claims:**

-   Shows zoom actions in context menu
-   Right-click integration

**Expected behaviors for example-tester:**

-   Context menu should contain zoom-related actions
-   Should have both zoom and context menu enabled

#### 12. zoom-buttons

**Documentation claims:**

-   Default buttons appear on hover
-   Zoom in/out, pan left/right, reset buttons

**Expected behaviors for example-tester:**

-   Buttons should appear when hovering near bottom
-   All 5 default buttons should be present
-   Each button should perform its described action

#### 13. zoom-custom-buttons

**Documentation claims:**

-   Always visible buttons
-   Custom tooltips and labels
-   Pan-to-start/end buttons added
-   Pan left/right removed
-   Order changed, reset has label only

**Expected behaviors for example-tester:**

-   buttons.visible should be 'always'
-   Custom button configuration should match code
-   Pan left/right buttons should not exist
-   New pan-to-start/end buttons should work

#### 14. zoom-async

**Documentation claims:**

-   Uses dataSource.getData callback
-   Loads finer data for visible window
-   Should include coarse data always

**Expected behaviors for example-tester:**

-   dataSource should be configured with getData function
-   Should make async calls when zooming
-   Data should update based on visible window

### User Interactions to Validate

1. Mouse wheel scrolling (various speeds and directions)
2. Click-drag panning (including edge cases at chart boundaries)
3. Selection box creation and zoom behavior
4. Axis dragging (both zoom and pan modes)
5. Double-click reset (on chart and on axes)
6. Keyboard controls (+/- with focus)
7. Touch gestures (pinch, two-finger pan)
8. Zoom button interactions (hover, click each button)
9. Context menu zoom actions
10. Modifier key combinations (alt, shift, ctrl, meta)
11. Rapid zoom in/out sequences
12. Zoom limits (min visible items)
13. Window resize during zoom
14. Concurrent zoom and pan operations

### Visual States to Screenshot and Analyze

1. Default unzoomed state
2. Zoomed-in state (various levels)
3. Selection box during drag
4. Zoom buttons (hidden, hover, always visible)
5. Context menu with zoom options
6. Axis hover states during drag
7. Touch gesture indicators (if any)
8. Auto-scaled vs fixed Y-axis comparison
9. Different anchor point behaviors
10. Minimum zoom limit reached state

### Interactive Features Requiring Before/After Visual Comparison

1. Zoom in/out transitions
2. Pan movements
3. Selection box zoom (before selection, during, after zoom)
4. Axis drag zoom (before, during, after)
5. Double-click reset animation
6. Auto-scaling Y-axis updates
7. Button state changes (hover effects)
8. Async data loading (before/after new data)

### Chart Elements That Should Be Interactive

1. Chart plot area (scroll, click-drag, double-click)
2. X and Y axes (drag to zoom/pan, double-click to reset)
3. Zoom buttons (click actions)
4. Context menu items (right-click menu)
5. Keyboard focus area (for +/- keys)

### Expected Tooltip Content and Highlighting Behaviors

1. Zoom buttons should show tooltips on hover
2. Custom button tooltips should match configuration
3. No specific chart data tooltips mentioned for zoom feature
4. Axis drag should show visual feedback during drag

## Known Exceptions

No existing `technical-review-exceptions.md` file found for this page.

## Execution Plan

### Priority 1: Core Zoom Functionality

1. **Test basic zoom example**

    - Validate all documented interaction methods
    - Screenshot default state and various zoom levels
    - Test keyboard controls
    - Success: All zoom methods work as described

2. **Verify TypeScript interfaces**

    - Check AgZoomOptions structure
    - Validate property types and values
    - Success: All documented properties exist with correct types

3. **Test zoom configuration options**
    - Anchor points (all 4 values)
    - Scrolling step variations
    - Axes configurations
    - Success: Each option produces expected behavior

### Priority 2: Advanced Features

4. **Test selection zoom**

    - Validate selection box creation
    - Test with/without pan key
    - Success: Selection zoom works correctly

5. **Test axis-specific controls**

    - Axis dragging modes
    - Axis scrolling
    - Independent axis zoom
    - Success: Axis controls work as documented

6. **Test touch/gesture support**
    - Two-finger zoom/pan
    - Disabled gesture handling
    - Success: Touch controls work on mobile viewports

### Priority 3: UI and Integration

7. **Test zoom buttons**

    - Default configuration
    - Custom button setup
    - Visibility modes
    - Success: Buttons appear and function correctly

8. **Test integrations**

    - Context menu zoom actions
    - Navigator compatibility
    - Success: Integrations work seamlessly

9. **Test constraints and limits**
    - Min visible items
    - Auto-scaling behavior
    - Success: Limits are enforced correctly

### Priority 4: Advanced Scenarios

10. **Test async data loading**

    -   DataSource callback execution
    -   Window parameter accuracy
    -   Success: Data loads dynamically during zoom

11. **Test edge cases**
    -   Rapid zoom/pan sequences
    -   Boundary conditions
    -   Window resize during zoom
    -   Success: No errors or visual glitches

### Estimated Complexity

-   High complexity due to numerous interaction methods
-   Extensive visual validation required
-   Multiple configuration combinations to test
-   Time estimate: 3-4 hours for thorough review

## Delegation Plan for example-tester Agent

For each example, provide the example-tester agent with:

1. **Example location and purpose**
2. **Expected zoom configuration from documentation**
3. **Specific interactions to test**
4. **Visual elements to verify**
5. **Console errors to watch for**
6. **API usage patterns to validate**

The agent should focus on:

-   Correct AG Charts zoom API usage
-   Chart rendering without errors
-   Interactive behavior matching documentation
-   Performance during zoom operations
-   TypeScript type safety
-   Best practices for zoom configuration
