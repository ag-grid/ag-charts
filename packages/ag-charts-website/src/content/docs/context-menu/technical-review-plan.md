# Technical Review Plan: Context Menu

## Page Analysis Summary

### Features Covered

-   Context Menu enterprise feature for context-aware chart interactions
-   Right-click functionality on different chart elements
-   Built-in menu items configuration
-   Custom actions with context-aware behavior
-   Sub-menu support
-   Default enablement and configuration

### Key APIs and Configuration Options Documented

-   `contextMenu.enabled` - Enable/disable the context menu (default: true)
-   `contextMenu.items` - Array of menu items including:
    -   Built-in string literals: 'defaults', 'separator', 'toggle-series-visibility', 'toggle-other-series', 'zoom-to-cursor', 'pan-to-cursor', 'reset-zoom', 'download'
    -   Custom action objects with properties:
        -   `showOn`: 'always' | 'series-area' | 'series-node' | 'legend-item'
        -   `label`: Menu item label
        -   `action`: Function to execute
        -   `items`: Sub-menu items (recursive)
        -   `type`: 'action' | 'separator' (implied)

### Examples Referenced

1. **context-menu** - Basic context menu demonstration

    - Shows default download option
    - Shows legend-specific options for toggling series visibility

2. **context-menu-builtins** - Built-in items configuration

    - Demonstrates reordering default items
    - Shows separator usage
    - Includes "Custom Order" and "Default Order" buttons

3. **context-menu-actions** - Custom actions demonstration

    - Four different `showOn` contexts
    - Console logging with context-aware data
    - Access to datum, yKey, xKey, itemId parameters

4. **context-menu-submenus** - Sub-menu functionality

    - Zoom controls grouped in sub-menu
    - Legend controls grouped in sub-menu
    - Debug console sub-menu with all context types

5. **context-menu-icons** - Not referenced in docs (needs investigation)

### Interactive Features Described

-   Right-click on chart elements to show context menu
-   Different menu items based on clicked element (chart area, series nodes, legend items)
-   Context-aware action parameters
-   Sub-menu navigation
-   Built-in actions for download, zoom, and series visibility

## Validation Targets

### TypeScript Interfaces to Verify

-   `AgContextMenuOptions` in `packages/ag-charts-types/src/chart/contextMenuOptions.ts`
-   `AgContextMenuItem` and its variants:
    -   `AgContextMenuItemAlways`
    -   `AgContextMenuItemSeriesArea`
    -   `AgContextMenuItemSeriesNode`
    -   `AgContextMenuItemLegendItem`
-   `AgContextMenuItemLiteral` for built-in string values
-   `AgContextMenuItemShowOn` enum values
-   `AgContextMenuItemType` enum values

### Implementation Files to Check

-   Context menu implementation in enterprise package
-   Default enabled state verification
-   Built-in menu item implementations
-   Action callback parameter structures
-   Sub-menu rendering logic

### Examples to Test with Expected Behaviors

#### 1. context-menu

**Documentation claims:**

-   Right-clicking anywhere shows download option
-   Right-clicking legend items shows additional series visibility options
-   Context menu is enabled by default

**Expected behaviors to validate:**

-   Right-click on chart background → menu with download option
-   Right-click on legend item → menu with download + series visibility options
-   No console errors
-   Menu renders correctly with proper styling

#### 2. context-menu-builtins

**Documentation claims:**

-   "Custom Order" button reorders menu items and adds separators
-   "Default Order" button resets to ['defaults']
-   Shows all built-in menu items

**Expected behaviors to validate:**

-   Click "Custom Order" → menu items reordered with separators
-   Click "Default Order" → menu reset to default state
-   All listed built-in items appear in menu when configured
-   Separators render as non-interactive horizontal lines

#### 3. context-menu-actions

**Documentation claims:**

-   Custom actions show based on `showOn` property
-   Actions receive context-specific parameters:
    -   'always': no special params
    -   'series-area': no special params mentioned
    -   'series-node': datum, yKey, xKey
    -   'legend-item': itemId
-   Console logging demonstrates context awareness

**Expected behaviors to validate:**

-   Right-click different areas → appropriate custom actions appear
-   Click actions → console shows correct context data
-   Series node action shows datum values
-   Legend item action shows correct itemId

#### 4. context-menu-submenus

**Documentation claims:**

-   Zoom controls grouped in sub-menu (series-area context)
-   Legend controls grouped in sub-menu (legend-item context)
-   Debug console sub-menu with all contexts
-   Recursive `items` property creates sub-menus

**Expected behaviors to validate:**

-   Right-click series area → "Zoom Controls" sub-menu appears
-   Right-click legend → "Legend Controls" sub-menu appears
-   Sub-menus expand on hover/click
-   Debug console actions log correct context data
-   Nested menu structure renders properly

#### 5. context-menu-icons (undocumented)

**Needs investigation:**

-   Purpose and functionality
-   Whether it should be documented
-   Icon support in context menu items

### User Interactions to Validate

1. **Right-click interactions on different chart elements:**

    - Chart background/empty area
    - Series nodes (data points, bars, etc.)
    - Series area (between nodes)
    - Legend items
    - Axes (if applicable)
    - Chart title (if applicable)

2. **Context menu behavior:**

    - Menu positioning near cursor
    - Menu stays within viewport bounds
    - Click outside dismisses menu
    - Escape key dismisses menu
    - Sub-menu navigation (hover/click to expand)

3. **Action execution:**
    - Click actions execute correctly
    - Correct parameters passed to callbacks
    - Built-in actions work (download, zoom, series toggle)

### Visual States to Screenshot and Analyze

1. **Default context menu states:**

    - Menu on chart background
    - Menu on legend item
    - Menu on series node
    - Menu on series area

2. **Built-in items example:**

    - Default order menu
    - Custom order menu with separators

3. **Custom actions example:**

    - Menu showing context-specific actions
    - Different menus for different click targets

4. **Sub-menus example:**

    - Closed sub-menu state
    - Expanded sub-menu state
    - Multi-level menu navigation

5. **Edge cases:**
    - Menu at viewport edges
    - Menu with many items (scrolling?)
    - Long label text handling

### Interactive Features Requiring Before/After Comparison

1. Button clicks in context-menu-builtins example
2. Sub-menu expansion in context-menu-submenus
3. Series visibility toggling via context menu
4. Zoom actions if available

### Chart Elements That Should Be Interactive

Based on documentation:

-   Entire chart area (right-click for context menu)
-   Legend items (right-click for legend-specific options)
-   Series nodes/data points (right-click for node-specific actions)
-   Series areas (right-click for series-area actions)

### Expected Tooltip Content and Highlighting

-   Context menu is separate from tooltips
-   No specific tooltip behavior mentioned for context menu
-   Focus should be on menu appearance and functionality

## Known Exceptions

No existing technical-review-exceptions.md file found for this page.

## Execution Plan

### Priority 1: Core Functionality Validation

1. **Verify TypeScript interfaces match documentation**

    - Check all `AgContextMenu*` types
    - Verify `showOn` values
    - Confirm built-in item literals

2. **Test basic context menu example**

    - Screenshot default behavior
    - Verify right-click on different elements
    - Confirm default enabled state

3. **Validate enterprise-only feature**
    - Confirm context menu requires enterprise license
    - Check feature availability flags

### Priority 2: Built-in Items and Configuration

1. **Test context-menu-builtins example**

    - Verify all built-in items work
    - Test custom ordering
    - Screenshot separator rendering
    - Validate default reset

2. **Check implementation of built-in actions**
    - Download functionality
    - Series visibility toggles
    - Zoom controls (if applicable)

### Priority 3: Custom Actions and Context

1. **Test context-menu-actions example**

    - Verify showOn contexts work correctly
    - Check action parameters
    - Screenshot different context menus
    - Validate console output

2. **Verify action callback signatures**
    - Confirm documented parameters are passed
    - Check TypeScript types for callbacks

### Priority 4: Advanced Features

1. **Test context-menu-submenus example**

    - Verify recursive menu structure
    - Test sub-menu navigation
    - Screenshot expanded states
    - Check all context combinations

2. **Investigate context-menu-icons example**
    - Determine if documentation is missing
    - Check icon support implementation

### Priority 5: Edge Cases and UX

1. **Test menu positioning edge cases**

    - Near viewport edges
    - Small viewport sizes
    - Mobile/touch behavior

2. **Keyboard and accessibility**
    - Escape key dismissal
    - Focus management
    - Screen reader support (if any)

### Success Criteria

-   All documented APIs exist and work as described
-   Examples demonstrate claimed functionality
-   No console errors in any example
-   Context-aware behavior works correctly
-   Sub-menus render and navigate properly
-   Visual appearance is professional and consistent

### Estimated Complexity

-   High complexity due to:
    -   Multiple interaction contexts
    -   Dynamic menu content
    -   Sub-menu navigation
    -   Enterprise feature verification
    -   Extensive interactive testing required

### Delegation Plan for example-tester Agent

For each example, provide the following to the example-tester agent:

#### context-menu

-   **Expected**: Basic context menu with download option everywhere, additional series toggle options on legend items
-   **Validate**: Right-click functionality, menu rendering, default enabled state
-   **Check**: No console errors, proper enterprise feature usage

#### context-menu-builtins

-   **Expected**: Buttons to change menu item order, all built-in items functional
-   **Validate**: Button click handlers, menu reordering, separator rendering
-   **Check**: Proper configuration structure, all built-in items work

#### context-menu-actions

-   **Expected**: Custom actions appear based on showOn context, console logging with context data
-   **Validate**: All four showOn contexts, action callbacks receive correct parameters
-   **Check**: Proper TypeScript usage, context-aware parameter passing

#### context-menu-submenus

-   **Expected**: Nested menu structure, context-specific sub-menus, debug console functionality
-   **Validate**: Sub-menu expansion, all contexts work, recursive items property
-   **Check**: Proper nesting, no rendering issues, console output

#### context-menu-icons (if exists)

-   **Expected**: Unknown - needs investigation
-   **Validate**: Determine purpose and functionality
-   **Check**: Whether it should be documented
