# Technical Review Plan: Financial Charts - Toolbar

## Page Analysis Summary

### Features Covered

-   Financial chart toolbar functionality for analyzing and annotating charts
-   Chart type selection (7 types: Candlestick, Hollow Candlestick, OHLC, Line, Step Line, HLC, High Low)
-   Drawing tools for lines and channels (5 types)
-   Text annotations (4 types)
-   Arrow drawings (3 types)
-   Fibonacci tools (2 types)
-   Measuring tools (4 types + quick measure)
-   Keyboard shortcuts for toolbar actions
-   Save & restore functionality via Chart State API
-   Theme customization for annotations

### Key APIs and Configuration Options Documented

-   `toolbar?: boolean` property in `AgPriceVolumePreset` (default: `true`)
-   Theme overrides via `theme.overrides.common.annotations`
-   Annotation types defined in `AgAnnotation` union type
-   Individual annotation interfaces like `AgLineAnnotation`, `AgCalloutAnnotation`, etc.
-   Annotation toolbar configuration via `AgAnnotationsToolbar`
-   Chart State API integration for save/restore

### Examples Referenced

1. **line-drawings**: Demonstrates all 5 line drawing types
2. **text-annotations**: Shows all 4 text annotation types
3. **arrow-drawings**: Displays all 3 arrow types
4. **fibonacci-tools**: Shows both Fibonacci retracement types
5. **measuring-tools**: Demonstrates all measuring tools
6. **annotation-customisation**: Shows theme override configuration

### Interactive Features Described

-   Drawing tools with click-and-drag creation
-   Double-click to edit annotations
-   Settings button for detailed configuration
-   Keyboard shortcuts for undo/redo, copy/paste, delete, movement
-   Shift key snapping to 45° angles
-   Visual feedback during interactions (hover states, selection)
-   Toolbar button interactions

## Validation Targets

### TypeScript Interfaces to Verify

1. `AgPriceVolumePreset` - check `toolbar` property
2. `AgAnnotationsThemeableOptions` - verify all annotation type keys
3. Individual annotation interfaces:
    - Line annotations: `AgLineAnnotation`, `AgHorizontalLineAnnotation`, `AgVerticalLineAnnotation`
    - Channel annotations: `AgParallelChannelAnnotation`, `AgDisjointChannelAnnotation`
    - Fibonacci annotations: `AgFibonacciRetracementAnnotation`, `AgFibonacciRetracementTrendBasedAnnotation`
    - Text annotations: `AgTextAnnotation`, `AgCommentAnnotation`, `AgCalloutAnnotation`, `AgNoteAnnotation`
    - Arrow annotations: `AgArrowAnnotation`, `AgArrowUpAnnotation`, `AgArrowDownAnnotation`
    - Measurer annotations: `AgDateRangeAnnotation`, `AgPriceRangeAnnotation`, `AgDatePriceRangeAnnotation`
4. Theme structure: Verify `theme.overrides.common.annotations` path exists

### Implementation Files to Check

1. Financial chart toolbar implementation in enterprise package
2. Annotation rendering implementation
3. Keyboard shortcut handling
4. Theme override application for annotations
5. Chart State API integration for annotations

### Examples to Test with Expected Behaviors

#### line-drawings Example

**Documentation Claims:**

-   Shows Trend Line (single line between two points)
-   Shows Horizontal Line (across entire chart with optional axis label)
-   Shows Vertical Line (across entire chart with optional axis label)
-   Shows Parallel Channel (two parallel lines with fill and optional center line)
-   Shows Disjoint Channel (two non-parallel lines with fill)
-   Stroke/fill colors, stroke width, and line style are customizable
-   Lines can be extended to infinity
-   Labels can be added via settings or double-click

**Expected Behaviors for example-tester:**

-   All 5 line types should be visible and interactive
-   Clicking/dragging should create new lines
-   Double-clicking lines should open settings
-   Visual customization options should work
-   Extension options should make lines extend beyond their anchor points
-   Fill should appear between channel lines

#### text-annotations Example

**Documentation Claims:**

-   Shows Text (simple text string)
-   Shows Comment (text within comment box)
-   Shows Callout (text box with arrow anchored to chart position)
-   Shows Note (icon with hover text)
-   Shift+Enter creates new lines within annotations

**Expected Behaviors for example-tester:**

-   All 4 text annotation types should be visible
-   Text should be editable
-   Comment boxes should have visible borders
-   Callout arrows should point to specific chart positions
-   Note icons should show tooltip on hover
-   Multi-line text should work with Shift+Enter

#### arrow-drawings Example

**Documentation Claims:**

-   Shows Arrow (between two points)
-   Shows Arrow Up (fixed size up arrow)
-   Shows Arrow Down (fixed size down arrow)

**Expected Behaviors for example-tester:**

-   Regular arrow should connect two points
-   Up/Down arrows should be fixed size
-   All arrows should be selectable and movable
-   Arrow heads should render correctly

#### fibonacci-tools Example

**Documentation Claims:**

-   Shows Fibonacci Retracement (multiple bands based on two points)
-   Shows Fibonacci Trend Based (bands from three key points)
-   Users can choose number of bands to show

**Expected Behaviors for example-tester:**

-   Fibonacci bands should render at correct ratios
-   Band count should be configurable
-   Labels should show ratio values
-   Bands should update when endpoints are moved
-   Fill between bands should be visible if enabled

#### measuring-tools Example

**Documentation Claims:**

-   Shows Measure (quick tool for date and price range, removed on click)
-   Shows Date Range (time difference, bar count, volume sum if enabled)
-   Shows Price Range (absolute and percentage difference)
-   Shows Date and Price (combined measure)

**Expected Behaviors for example-tester:**

-   Quick measure should disappear when clicking elsewhere
-   Date range should show time and bar count
-   Price range should show both absolute and percentage
-   Combined tool should show all measurements
-   Volume sum should appear if volume is enabled

#### annotation-customisation Example

**Documentation Claims:**

-   Shows theme override usage for annotations
-   Demonstrates customizing line stroke, strokeWidth, lineDash
-   Shows parallel-channel customization with fill
-   Shows comment annotation styling
-   Middle line strokeOpacity can be set to 0

**Expected Behaviors for example-tester:**

-   Theme overrides should apply to annotations
-   Line annotations should have lime color, 3px width, [3,4] dash
-   Parallel channel should have red stroke/fill
-   Comment should have orange fill, blue text
-   Middle line of parallel channel should be invisible

### User Interactions to Validate

1. **Toolbar Navigation:**

    - Click toolbar buttons to activate tools
    - Hover over buttons for tooltips
    - Check dropdown menus for grouped tools

2. **Drawing Interactions:**

    - Click and drag to create annotations
    - Single click for point-based annotations
    - Shift+drag for 45° angle snapping
    - Double-click to edit properties
    - Settings button interaction

3. **Keyboard Shortcuts:**

    - Ctrl/Cmd+Z for undo
    - Ctrl/Cmd+Y for redo
    - Ctrl/Cmd+C/V for copy/paste
    - Delete/Backspace to remove
    - Arrow keys for 1px movement
    - Ctrl/Shift+Arrow for 10px movement

4. **Selection and Editing:**
    - Click to select annotations
    - Drag handles to resize/reposition
    - Visual feedback on hover/selection
    - Multi-line text editing with Shift+Enter

### Visual States to Screenshot and Analyze

1. Default toolbar state
2. Active tool selection state
3. Each annotation type in default state
4. Hover states for annotations
5. Selected annotation with handles
6. Settings/edit dialog states
7. Keyboard focus indicators
8. Multi-line text annotations
9. Extended lines/channels
10. Customized theme examples

### Interactive Features Requiring Before/After Visual Comparison

1. Creating annotations (before: empty chart, after: with annotation)
2. Selecting annotations (before: unselected, after: selected with handles)
3. Moving annotations with keyboard (before/after positions)
4. Extending lines (before: normal, after: extended)
5. Editing text (before: original, after: edited)
6. Applying theme customizations (before: default, after: themed)

### Chart Elements That Should Be Interactive

1. Toolbar buttons and dropdowns
2. All created annotations
3. Annotation handles for resizing
4. Text fields for editing
5. Settings buttons on annotations
6. Chart area for creating new annotations

### Expected Tooltip Content and Highlighting Behaviors

1. Toolbar button tooltips showing tool names
2. Note annotation hover tooltips
3. Measuring tool value displays
4. Fibonacci ratio labels
5. Axis labels for cross-line annotations
6. Selection highlighting for active annotations

## Known Exceptions

No existing technical-review-exceptions.md file found for this page.

## Execution Plan

### Priority 1: Core Toolbar Functionality

1. Verify toolbar property in AgPriceVolumePreset
2. Test toolbar visibility and basic interaction
3. Validate all toolbar buttons are present
4. Check dropdown menus work correctly

### Priority 2: Drawing Tools Validation (High Complexity)

1. Test each line drawing type creation and interaction
2. Validate channel fills and middle lines
3. Test line extension functionality
4. Verify label addition and positioning
5. Test visual customization options

### Priority 3: Annotation Tools Testing (High Complexity)

1. Validate all text annotation types
2. Test multi-line text with Shift+Enter
3. Verify callout arrow positioning
4. Test note icon hover behavior
5. Check arrow drawing variations

### Priority 4: Advanced Tools (Medium Complexity)

1. Test Fibonacci tool calculations and bands
2. Validate measuring tool displays
3. Check quick measure auto-removal
4. Verify volume sum in date range

### Priority 5: Keyboard Shortcuts (Medium Complexity)

1. Test all documented keyboard shortcuts
2. Verify undo/redo functionality
3. Test copy/paste behavior
4. Validate movement with arrow keys
5. Test 45° angle snapping with Shift

### Priority 6: Theme Customization (Low Complexity)

1. Verify theme override structure
2. Test annotation style application
3. Validate all customizable properties

### Priority 7: Save/Restore Integration

1. Test Chart State API integration
2. Verify annotations persist correctly

## Success Criteria

-   All toolbar buttons function correctly
-   All annotation types can be created and edited
-   Keyboard shortcuts work as documented
-   Theme customizations apply properly
-   Visual feedback is appropriate for all interactions
-   No console errors during normal usage
-   Examples demonstrate all documented features

## Estimated Complexity/Time

-   Total validation points: ~60
-   High complexity areas: Drawing tools, annotations, keyboard interactions
-   Medium complexity: Fibonacci/measuring tools, state management
-   Expected time: 3-4 hours for thorough testing
