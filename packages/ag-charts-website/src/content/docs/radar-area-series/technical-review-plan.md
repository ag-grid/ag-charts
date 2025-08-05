# Technical Review Plan: Radar Area Series

## Page Analysis Summary

### Chart Types/Features Covered

-   Radar Area Series (also called Spider Area) - Enterprise feature
-   Shows magnitude of various datasets within shared categories
-   Area-based trend visualization in polar coordinate system

### Key APIs and Configuration Options Documented

1. **Series Configuration**:

    - `type: 'radar-area'` - Series type identifier
    - `angleKey` - Property for shared categories on Angle Axis
    - `radiusKey` - Property for numerical datasets on Radius Axis
    - `radiusName` - Label for each series

2. **Axis Customization**:
    - **Axis Shape**: `polygon` (default) vs `circle` shape options
    - **Angle Axis Label Orientation**: `fixed` (default), `parallel`, `perpendicular`
    - **Radius Axis Position**: `positionAngle` and `label.rotation` properties

### Examples Referenced and Their Purposes

1. **simple-radar-area**: Basic radar area chart with two series (Quality and Efficiency)
2. **axis-shape**: Demonstrates switching from polygon to circle shape
3. **axis-label-orientation**: Shows parallel label orientation
4. **radius-axis-position**: Customizes radius axis position and label rotation

### Interactive Features Described

-   Visual comparison of area-based trends across categories
-   Multiple datasets visualization within shared categories
-   Customizable axis shapes and label orientations

## Validation Targets

### TypeScript Interfaces to Verify

1. `AgRadarAreaSeriesOptions` - packages/ag-charts-types/src/series/polar/radarAreaOptions.ts
2. `AgAngleCategoryAxisOptions` - packages/ag-charts-types/src/chart/polarAxisOptions.ts
3. `AgRadiusNumberAxisOptions` - packages/ag-charts-types/src/chart/polarAxisOptions.ts
4. `AgPolarChartOptions` - Used in axis-shape example

### Implementation Files to Check

1. Radar area series implementation in enterprise package
2. Polar axes implementation (angle-category and radius-number)
3. Shape rendering logic for polygon vs circle
4. Label orientation implementation for angle axis

### Examples to Test with Expected Behaviors

#### 1. simple-radar-area

**Documentation Claims**:

-   Creates radar area chart with two series
-   Uses 'department' as angleKey (shared category)
-   Uses 'quality' and 'efficiency' as radiusKey values
-   Labels series as "Quality" and "Efficiency"

**Expected Behaviors for example-tester**:

-   Chart renders with radar/spider web layout
-   Two overlapping area series visible
-   Department categories distributed around angle axis
-   Quality and Efficiency values plotted on radius axis
-   Legend shows "Quality" and "Efficiency" labels
-   Areas filled with different colors for distinction
-   Tooltips show department, series name, and value on hover

#### 2. axis-shape

**Documentation Claims**:

-   Demonstrates circle shape option (vs default polygon)
-   Both axes configured with `shape: 'circle'`
-   Results in concentric circles instead of polygon grid

**Expected Behaviors for example-tester**:

-   Grid lines form concentric circles
-   Category axis forms a circle
-   Same data visualization but with circular grid
-   Areas still render correctly within circular grid
-   Tooltips and interactions work identically

#### 3. axis-label-orientation

**Documentation Claims**:

-   Changes angle axis label orientation to 'parallel'
-   Labels align parallel to the axis (vs fixed orientation)

**Expected Behaviors for example-tester**:

-   Department labels rotate to align with their axis position
-   Labels follow angle of their position on circle
-   Text remains readable at all positions
-   No label overlap issues

#### 4. radius-axis-position

**Documentation Claims**:

-   Positions radius axis at 72 degrees using `positionAngle`
-   Rotates radius axis labels by -72 degrees using `label.rotation`

**Expected Behaviors for example-tester**:

-   Radius axis line positioned at 72-degree angle
-   Radius labels rotated -72 degrees (compensating for axis rotation)
-   Labels remain horizontal/readable
-   Grid lines and values align correctly

### User Interactions to Validate

1. **Hover interactions**:

    - Hover over area segments for tooltips
    - Hover over different series areas
    - Hover near area boundaries
    - Hover over axis labels and grid lines

2. **Legend interactions**:

    - Click legend items to show/hide series
    - Hover over legend items for highlighting

3. **Responsive behavior**:
    - Window resize handling
    - Mobile viewport testing
    - Touch gesture support

### Visual States to Screenshot and Analyze

1. **Default states**:

    - Each example in default rendering
    - Desktop, tablet, and mobile viewports

2. **Interactive states**:

    - Tooltip display on area hover
    - Series highlighting on legend hover
    - Hidden series state (legend click)
    - Area boundary hover behavior

3. **Shape variations**:
    - Polygon vs circle grid comparison
    - Label orientation variations
    - Rotated radius axis positioning

### Interactive Features Requiring Before/After Visual Comparison

1. Legend click to hide/show series
2. Hover highlighting of individual series
3. Tooltip positioning at different chart positions
4. Responsive layout changes on resize

### Chart Elements That Should Be Interactive

1. Area segments (hover for tooltips)
2. Legend items (click to toggle, hover to highlight)
3. Possibly axis labels (check for any interactions)

### Expected Tooltip Content and Highlighting Behaviors

1. **Tooltip content**:

    - Department name (angleKey value)
    - Series name (Quality/Efficiency)
    - Numerical value (radiusKey value)

2. **Highlighting**:
    - Series area highlighted on hover
    - Other series dimmed/faded
    - Legend item highlighted when series hovered

## Known Exceptions

-   No technical-review-exceptions.md file exists for this page

## Execution Plan

### Priority 1: Core Functionality Validation

1. Verify `radar-area` series type is enterprise-only
2. Test simple-radar-area example renders correctly
3. Validate angleKey/radiusKey/radiusName configuration works
4. Check tooltip content matches expected format
5. Verify legend functionality and labeling

### Priority 2: Axis Customization Features

1. Test axis shape switching (polygon vs circle)
2. Verify all three label orientation options work
3. Validate radius axis positioning and rotation
4. Check visual rendering matches documentation descriptions

### Priority 3: TypeScript and API Validation

1. Cross-reference all interfaces in ag-charts-types
2. Verify all documented properties exist
3. Check for any undocumented required properties
4. Validate property types match documentation

### Priority 4: Interactive and Visual Testing

1. Comprehensive hover testing across all examples
2. Legend interaction testing
3. Responsive behavior validation
4. Screenshot capture of all states
5. Edge case testing (rapid interactions, boundary hovers)

### Priority 5: Implementation Deep Dive

1. Locate radar area series implementation
2. Verify default values match documentation
3. Check enterprise feature gating
4. Validate shape rendering logic

### Success Criteria

-   All examples render without console errors
-   Documented features work as described
-   TypeScript interfaces match documentation
-   Interactive behaviors function correctly
-   Visual rendering matches descriptions
-   No undocumented required configurations

### Estimated Complexity/Time

-   High complexity due to enterprise feature and polar coordinate system
-   Multiple customization options to validate
-   Extensive visual and interaction testing required
-   Estimated 60-90 minutes for thorough review

## Delegation Plan for example-tester Agent

### Task 1: Basic Radar Area Validation

**Example**: simple-radar-area
**Instructions**: Validate basic radar area chart renders with two series. Verify:

-   Chart uses polar/radar layout with web-like grid
-   Two area series (Quality and Efficiency) are visible and distinguishable
-   Department categories are distributed around the angle axis
-   Areas are filled and overlap appropriately
-   Legend shows correct series names
-   Tooltips display department, series name, and value
-   No console errors or warnings

### Task 2: Circle Shape Validation

**Example**: axis-shape
**Instructions**: Verify circle shape configuration works correctly:

-   Grid forms concentric circles instead of polygon web
-   Both angle and radius axes use circular shape
-   Area series render correctly within circular grid
-   All interactive features work identically to polygon shape
-   Visual appearance matches a "radar chart with circular grid"

### Task 3: Label Orientation Testing

**Example**: axis-label-orientation
**Instructions**: Validate parallel label orientation:

-   Angle axis labels (departments) rotate to align with their radial position
-   Labels follow the angle of their position around the circle
-   Text remains readable at all positions (no upside-down text)
-   No label overlap or rendering issues
-   Compare with default fixed orientation for contrast

### Task 4: Radius Axis Positioning

**Example**: radius-axis-position
**Instructions**: Test custom radius axis positioning:

-   Radius axis line positioned at 72-degree angle (not default 0/90)
-   Radius axis labels rotated -72 degrees
-   Labels remain horizontal and readable despite axis rotation
-   Grid lines and values align correctly with rotated axis
-   Interaction and rendering quality maintained

### General Testing Requirements for All Examples

-   Verify enterprise import is used: `ag-charts-enterprise`
-   Check for TypeScript type safety
-   Test hover interactions on various chart elements
-   Validate responsive behavior at different viewport sizes
-   Ensure consistent visual quality and performance
