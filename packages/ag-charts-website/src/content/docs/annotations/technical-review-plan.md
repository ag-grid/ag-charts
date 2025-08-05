# Technical Review Plan: Annotations

## Page Analysis Summary

### Chart Types/Features Covered

-   **Enterprise Feature**: Annotations are marked as enterprise-only functionality
-   **Supported Chart Types**: Available on all Cartesian charts (line, bar, area, scatter, etc.)
-   **Annotation Categories**:
    -   Text Annotations: `text`, `comment`, `callout`, `note`
    -   Lines: `line`, `horizontal-line`, `vertical-line`, `parallel-channel`, `disjoint-channel`
    -   Arrows: `arrow`, `arrow-up`, `arrow-down`

### Key APIs and Configuration Options Documented

-   `annotations` root configuration object
-   `toolbar` configuration with `enabled` and `buttons` options
-   Theme override options via `theme.overrides.common.annotations`
-   Keyboard shortcuts for annotation manipulation
-   Chart State API integration for save/restore functionality

### Examples Referenced

1. **simple-annotations**: Main interactive demo showing annotation functionality
2. **annotations-toolbar**: Demonstrates toolbar customization
3. **annotations-customisation**: Shows theme override customization

### Interactive Features Described

-   Click-to-add annotations via toolbar selection
-   Floating options toolbar for editing annotations
-   Drag handles for repositioning
-   Keyboard shortcuts for undo/redo, copy/paste, delete, and movement
-   Snap-to-45° angle when holding Shift
-   Settings button for additional options

## Validation Targets

### TypeScript Interfaces to Verify

-   `AgAnnotationsOptions` (packages/ag-charts-types/src/chart/annotationsOptions.ts)
-   `AgAnnotationsToolbar` and related toolbar types
-   `AgAnnotationsThemeableOptions` for theme overrides
-   Individual annotation type interfaces:
    -   Text: `AgTextAnnotation`, `AgCommentAnnotation`, `AgCalloutAnnotation`, `AgNoteAnnotation`
    -   Lines: `AgLineAnnotation`, `AgHorizontalLineAnnotation`, `AgVerticalLineAnnotation`
    -   Channels: `AgParallelChannelAnnotation`, `AgDisjointChannelAnnotation`
    -   Arrows: `AgArrowAnnotation`, `AgArrowUpAnnotation`, `AgArrowDownAnnotation`

### Implementation Files to Check

-   Annotations module implementation in enterprise package
-   Toolbar implementation for annotations functionality
-   Theme override handling for annotations
-   Keyboard shortcut handlers
-   State management for save/restore

### Examples to Test with Expected Behaviors

#### simple-annotations

**Documentation claims**:

-   Toolbar allows selecting annotation types
-   Click on series area to add annotations
-   Floating options toolbar appears for selected annotations
-   Settings button provides additional options
-   Delete via main toolbar (all) or floating toolbar (individual)

**Expected behaviors for example-tester**:

-   Toolbar is visible and contains annotation type buttons
-   Clicking toolbar buttons activates annotation mode
-   Clicking on chart adds annotations at click location
-   Selected annotations show floating toolbar with position/color/style options
-   Settings button reveals extended options (labels, line extensions)
-   Delete functionality works as described
-   All annotation types (text, lines, arrows) are functional

#### annotations-toolbar

**Documentation claims**:

-   Toolbar can be customized via `toolbar.buttons` configuration
-   Example shows only Text Annotations and Delete buttons
-   Button order can be customized

**Expected behaviors for example-tester**:

-   Toolbar only shows configured buttons (text-menu and delete)
-   Button order matches configuration array order
-   Other annotation types are not available in toolbar
-   Configuration matches code example provided

#### annotations-customisation

**Documentation claims**:

-   Theme overrides customize initial appearance of annotations
-   Example shows customization for line, parallel-channel, and comment types
-   Properties include stroke, strokeWidth, lineDash, fill, color, background

**Expected behaviors for example-tester**:

-   New annotations use customized styles from theme overrides
-   Line annotations appear with lime color, 3px width, and [3,4] dash pattern
-   Parallel channels show red stroke/fill with hidden middle line
-   Comments have orange fill, blue text/stroke
-   Theme override structure follows documented pattern

### User Interactions to Validate

1. **Toolbar interactions**:

    - Click each annotation type button
    - Verify cursor changes to indicate annotation mode
    - Test toolbar button states (active/inactive)

2. **Annotation creation**:

    - Click to place text annotations
    - Click and drag to create line annotations
    - Test creation on different chart areas

3. **Annotation editing**:

    - Select annotations to show floating toolbar
    - Test position adjustment via drag handles
    - Test color/style changes via floating toolbar
    - Test settings panel options

4. **Keyboard shortcuts**:
    - Ctrl/Cmd+Z for undo
    - Ctrl/Cmd+Y for redo
    - Ctrl/Cmd+C/V for copy/paste
    - Delete/Backspace for deletion
    - Arrow keys for 1px movement
    - Ctrl/Shift+Arrow for 10px movement
    - Shift+drag for 45° angle snapping

### Visual States to Screenshot and Analyze

1. **Default state**: Chart with annotations toolbar visible
2. **Annotation mode**: Active annotation type selected in toolbar
3. **Annotation placement**: Various annotation types added to chart
4. **Selection state**: Annotation selected with floating toolbar visible
5. **Settings panel**: Extended options panel open
6. **Customized styles**: Annotations with theme overrides applied
7. **Multiple annotations**: Chart with various annotation types
8. **Hover states**: Tooltips and hover feedback on annotations

### Chart Elements Expected to be Interactive

-   Series area for annotation placement
-   Annotation handles for dragging/resizing
-   Toolbar buttons for mode selection
-   Floating toolbar controls
-   Annotations themselves (selection, editing)

### Expected Tooltip Content and Highlighting

-   Hover feedback on toolbar buttons
-   Tooltip hints for annotation controls
-   Visual feedback during annotation creation/editing
-   Selection highlighting for active annotations

## Known Exceptions

No existing technical-review-exceptions.md file found for this documentation page.

## Execution Plan

### Priority 1: Critical Functionality

1. **Verify enterprise-only status**:

    - Confirm annotations require enterprise license
    - Check feature availability messaging

2. **Test core annotation creation**:

    - Validate all annotation types can be created
    - Verify click/drag interactions work correctly
    - Test annotation placement accuracy

3. **Validate toolbar functionality**:
    - Check default toolbar configuration
    - Test toolbar customization via API
    - Verify button states and interactions

### Priority 2: API Accuracy

1. **TypeScript interface validation**:

    - Cross-reference documented options with type definitions
    - Verify all annotation types have correct interfaces
    - Check toolbar configuration types

2. **Theme override validation**:

    - Verify theme override structure matches documentation
    - Test style properties apply correctly
    - Check enabled property convention

3. **Configuration testing**:
    - Test toolbar.enabled toggle
    - Validate toolbar.buttons array customization
    - Check annotation-specific options

### Priority 3: Interactive Features

1. **Keyboard shortcut testing**:

    - Systematically test all documented shortcuts
    - Verify modifier key combinations
    - Test cross-platform compatibility

2. **Floating toolbar testing**:

    - Test all editing controls
    - Verify settings panel functionality
    - Check visual feedback

3. **Edge case testing**:
    - Test annotation limits
    - Verify behavior with multiple selections
    - Test save/restore functionality

### Success Criteria

-   All annotation types can be created and edited
-   Toolbar customization works as documented
-   Theme overrides apply correctly
-   Keyboard shortcuts function properly
-   No console errors during interactions
-   Visual appearance matches documentation
-   example-tester validates all examples

### Estimated Complexity

-   **High complexity** due to:
    -   Multiple annotation types to test
    -   Complex interactive behaviors
    -   Extensive keyboard shortcut support
    -   Theme customization options
    -   Enterprise feature validation

## Delegation Plan for example-tester Agent

### simple-annotations Example

**Task**: Validate the main annotations demo functionality
**Expected behaviors to validate**:

1. Toolbar is present with annotation type buttons
2. Each annotation type (text, line, arrow) can be selected and added
3. Floating options toolbar appears when annotations are selected
4. Settings button reveals additional configuration options
5. Delete functionality works via both main and floating toolbars
6. No console errors during annotation operations
7. Chart renders correctly with annotations

### annotations-toolbar Example

**Task**: Verify toolbar customization functionality
**Expected behaviors to validate**:

1. Toolbar only shows Text Annotations and Delete buttons
2. Button order matches the configuration (Delete first, then Text)
3. Excluded annotation types are not available
4. Configuration code matches actual behavior
5. Customized toolbar remains functional

### annotations-customisation Example

**Task**: Validate theme override customization
**Expected behaviors to validate**:

1. Line annotations use lime color with 3px width and [3,4] dash
2. Parallel channels show red stroke/fill with transparent middle line
3. Comments have orange fill with blue text and stroke
4. New annotations inherit customized styles
5. Theme override structure is correct
6. All specified style properties are applied
