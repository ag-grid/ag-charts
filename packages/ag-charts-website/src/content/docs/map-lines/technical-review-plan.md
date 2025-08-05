# Technical Review Plan: Map Lines Documentation

## Page Analysis Summary

### Chart Types/Features Covered

-   **Map Line Series** (`map-line`): Geographic line visualization for routes, roads, and connections
-   **Map Line Background Series** (`map-line-background`): Context layer showing all topology lines without data
-   **Colour Scale**: Heatmap-style coloring based on data magnitude using `colorKey`
-   **Proportional Line Width**: Variable stroke width based on data values using `sizeKey`
-   **Enterprise Feature**: This is an enterprise-only feature

### Key APIs and Configuration Options Documented

-   Series type: `"map-line"` and `"map-line-background"`
-   Data binding: `idKey` (connects data to topology features)
-   Color mapping: `colorKey`, `colorName`
-   Size mapping: `sizeKey`, `sizeName`, `strokeWidth`, `maxStrokeWidth`
-   Data and topology configuration at chart or series level
-   Integration with Map Shape Background Series

### Examples Referenced

1. **lines**: Simple map lines showing UK motorways
2. **heatmap**: Lines colored by data magnitude (daily vehicles)
3. **stroke-width**: Variable line width based on data values
4. **backgrounds**: Map line background series for context
5. **map-shapes-lines**: (Not referenced in docs, needs investigation)

### Interactive Features Described

-   Tooltips showing data values (referenced via links)
-   Color range customization (via heatmap series link)
-   Gradient legend for color scale (via heatmap series link)
-   Background series noted as non-interactive

## Validation Targets

### TypeScript Interfaces to Verify

1. `AgMapLineSeriesOptions` - Main configuration interface
2. `AgMapLineBackgroundOptions` - Background series configuration
3. Related interfaces for:
    - `idKey`, `colorKey`, `colorName`, `sizeKey`, `sizeName`
    - `strokeWidth`, `maxStrokeWidth` properties
    - Topology and data configuration inheritance

### Implementation Files to Check

1. `packages/ag-charts-enterprise/src/features/map-line/` - Core map line implementation
2. Map line series properties and defaults
3. Color scale integration (likely shared with heatmap)
4. Size scale implementation for variable stroke width
5. Background series implementation and limitations

### Examples to Test with Expected Behaviors

#### 1. lines (Simple Map Lines)

**Documentation Claims:**

-   Shows UK motorways as simple lines
-   Combines map-line with map-shape-background
-   Data and topology provided at chart level
-   Background rendered behind lines due to series order

**Expected Behaviors for example-tester:**

-   Chart displays UK map background with motorway lines overlaid
-   Lines render with consistent default styling
-   No color variation or width variation
-   Title shows "UK Motorways"
-   Series order affects rendering (background behind lines)

#### 2. heatmap (Colour Scale)

**Documentation Claims:**

-   Lines colored based on `dailyVehicles` data
-   Uses `colorKey: 'dailyVehicles'`
-   Optional `colorName: 'Daily Vehicles'` for tooltips
-   Color range and gradient legend customizable

**Expected Behaviors for example-tester:**

-   Lines show color gradient based on traffic data
-   Higher values show different colors than lower values
-   Gradient legend visible showing color scale
-   Tooltips display "Daily Vehicles" label
-   Color interpolation smooth across data range

#### 3. stroke-width (Proportional Line Width)

**Documentation Claims:**

-   Width varies based on `dailyVehicles` data
-   Uses `sizeKey: 'dailyVehicles'`
-   `strokeWidth: 1` for smallest values
-   `maxStrokeWidth: 3` for largest values
-   `sizeName: 'Daily Vehicles'` for tooltips

**Expected Behaviors for example-tester:**

-   Lines show variable width (1px to 3px range)
-   Busier routes appear thicker
-   Width interpolation proportional to data
-   Tooltips show "Daily Vehicles" label
-   Consistent width along each line segment

#### 4. backgrounds (Background Lines)

**Documentation Claims:**

-   Shows all topology lines without data
-   Type: `'map-line-background'`
-   No interactivity (no tooltips, no legend)
-   Provides context for other series

**Expected Behaviors for example-tester:**

-   All lines from topology visible
-   No hover interactions or tooltips
-   Not appearing in legend
-   Rendered as background layer
-   Consistent styling across all lines

#### 5. map-shapes-lines (Undocumented)

**Investigation Needed:**

-   Not referenced in documentation
-   May show combined map shapes and lines
-   Check if this should be documented

### User Interactions to Validate

1. **Hover Interactions:**

    - Hover over data-bound lines for tooltips
    - Verify tooltip content matches configured names
    - Check tooltip positioning near lines
    - Confirm background lines have no hover response

2. **Legend Interactions:**

    - Click legend items to show/hide series
    - Verify gradient legend for color scale
    - Confirm background series not in legend

3. **Visual States to Screenshot:**
    - Default rendering of each example
    - Hover states showing tooltips
    - Color gradient variations (heatmap)
    - Width variations (stroke-width)
    - Mobile responsive behavior

### Known Exceptions

-   No documented exceptions file exists for this page

## Execution Plan

### Priority 1: API Contract Validation

1. Verify `AgMapLineSeriesOptions` interface includes all documented properties
2. Check `AgMapLineBackgroundOptions` interface and its limitations
3. Validate property types match documentation (strings, numbers)
4. Confirm enterprise-only feature flagging

### Priority 2: Core Example Testing (example-tester delegation)

1. **Test "lines" example:**

    - Verify basic map line rendering
    - Check series layering order
    - Validate data-topology connection

2. **Test "heatmap" example:**

    - Verify color scale functionality
    - Check gradient legend rendering
    - Validate tooltip content with colorName

3. **Test "stroke-width" example:**
    - Verify variable width rendering
    - Check size scale interpolation
    - Validate min/max width constraints

### Priority 3: Interactive Behavior Testing

1. **Tooltip Testing:**

    - Hover over lines in each example
    - Verify tooltip data display
    - Check custom name labels (colorName, sizeName)
    - Screenshot tooltip states

2. **Background Series Testing:**
    - Verify no interactivity on background lines
    - Confirm absence from legend
    - Test rendering order

### Priority 4: Edge Cases and Visual Validation

1. **Responsive Testing:**

    - Test examples at mobile viewport
    - Check line rendering at different zoom levels
    - Verify legend positioning

2. **Data Edge Cases:**

    - Missing data values
    - Extreme value ranges
    - Empty datasets

3. **Visual Screenshots:**
    - Capture each example default state
    - Document color/width variations
    - Mobile layout screenshots

### Priority 5: Documentation Completeness

1. Investigate undocumented "map-shapes-lines" example
2. Verify links to related documentation (tooltips, heatmap)
3. Check code snippet accuracy against examples
4. Validate enterprise feature messaging

## Success Criteria

-   All TypeScript interfaces match documented properties
-   Examples render without console errors
-   Interactive features work as documented
-   Visual appearance matches documentation descriptions
-   Background series behaves as non-interactive context layer
-   Color and size scales interpolate data correctly
-   Enterprise-only access properly enforced
