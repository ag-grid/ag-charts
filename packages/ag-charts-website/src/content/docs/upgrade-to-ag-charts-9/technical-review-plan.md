# Technical Review Plan: Upgrade to AG Charts 9

## Page Analysis Summary

This is a migration guide for upgrading to AG Charts version 9.0, documenting breaking changes, behavior changes, and deprecations. The page covers:

### Key Content Areas

1. **Breaking Changes**:

    - Series changes (scatter, treemap, column/bar)
    - Padding API changes
    - Axes configuration changes
    - Theme removals and restructuring
    - Miscellaneous API removals

2. **Behavior Changes**:

    - Theme default value changes
    - Pie series centering behavior
    - Axis tick inheritance changes

3. **Deprecations**:

    - `agCharts.AgChart` → `agCharts.AgCharts`

4. **Links to Minor Versions**:
    - References to 9.1, 9.2, and 9.3 upgrade guides

### No Examples

This page contains no interactive examples to test, only migration instructions.

## Validation Targets

### 1. Series Changes Validation

#### TypeScript Interfaces to Check:

-   `AgScatterSeriesOptions` - Verify `sizeKey` is removed
-   `AgBubbleSeriesOptions` - Verify this exists as replacement
-   `AgTreemapSeriesOptions` - Verify removal from community
-   `AgBarSeriesOptions` - Verify `direction` property exists
-   `AgColumnSeriesOptions` - Verify removal

#### Implementation Files:

-   `packages/ag-charts-community/src/chart/series/cartesian/scatterSeries.ts`
-   `packages/ag-charts-community/src/chart/series/cartesian/bubbleSeries.ts`
-   `packages/ag-charts-community/src/chart/series/cartesian/barSeries.ts`
-   `packages/ag-charts-enterprise/src/series/treemap/treemapSeries.ts`

### 2. Padding API Changes

#### TypeScript Interfaces:

-   `AgChartOptions` - Verify `seriesAreaPadding` is removed
-   `AgChartSeriesAreaOptions` - Verify `padding` property exists
-   `AgCartesianAxisOptions` - Verify `groupPaddingInner` and `groupPaddingOuter`

#### Implementation Files:

-   `packages/ag-charts-community/src/chart/chartOptions.ts`
-   `packages/ag-charts-community/src/chart/axis/cartesianAxis.ts`

### 3. Axes Configuration Changes

#### TypeScript Interfaces:

-   `AgCartesianAxisOptions` - Verify `gridStyle` removal and `gridLine.style`
-   `AgAxisTickOptions` - Verify `count` removal

#### Implementation Files:

-   `packages/ag-charts-community/src/chart/axis/axisOptions.ts`
-   `packages/ag-charts-community/src/chart/axis/cartesianAxis.ts`

### 4. Theme Changes

#### Verify Theme Removals:

-   Check that `ag-pastel`, `ag-pastel-dark`, `ag-solar`, `ag-solar-dark` themes don't exist
-   Verify root `type` field removal from theme structure
-   Verify `theme.overrides.{cartesian,polar,hierarchy}` removal

#### Files to Check:

-   `packages/ag-charts-community/src/chart/themes/` directory
-   `packages/ag-charts-types/src/chart/themes/` interfaces

### 5. Miscellaneous API Removals

#### TypeScript Interfaces:

-   `AgTooltipOptions` - Verify `tracking` removal
-   `AgPieSeriesLabelFormatterParams` - Verify removal of listed properties
-   `AgCartesianChartOptions` - Verify `type` removal
-   `AgHierarchyChartOptions` - Verify `type` removal
-   `AgPolarChartOptions` - Verify `type` removal

### 6. Behavior Changes Verification

#### Default Values to Check:

-   Number axis line default visibility
-   Axis tick default visibility
-   Theme default fills and strokes
-   Pie series centering behavior implementation
-   Grid line style inheritance from ticks

#### Files:

-   `packages/ag-charts-community/src/chart/axis/numberAxis.ts`
-   `packages/ag-charts-community/src/chart/themes/` default themes
-   `packages/ag-charts-community/src/chart/series/polar/pieSeries.ts`

### 7. Deprecation Validation

#### Check Export:

-   Verify `agCharts.AgChart` is marked deprecated
-   Verify `agCharts.AgCharts` exists as replacement

#### File:

-   `packages/ag-charts-community/src/main.ts` or relevant export file

## Known Exceptions

No technical-review-exceptions.md file exists for this page.

## Execution Plan

### Priority 1: Critical Breaking Changes

1. **Series API Changes** (High Priority)

    - Validate scatter series `sizeKey` removal
    - Confirm bubble series as replacement
    - Verify column series removal and bar series default direction
    - Check treemap series moved to enterprise

2. **Type Removals** (High Priority)
    - Verify chart type properties removed from options interfaces
    - Check theme root type field removal

### Priority 2: Configuration Structure Changes

3. **Padding and Axes Changes** (Medium Priority)

    - Validate seriesAreaPadding migration path
    - Verify axes gridStyle and tick.count removals
    - Check groupPaddingInner/Outer behavior

4. **Theme Changes** (Medium Priority)
    - Confirm removed themes don't exist
    - Verify theme override structure changes

### Priority 3: Behavior and Deprecation Changes

5. **Default Behavior Changes** (Low Priority)

    - Check new axis line and tick defaults
    - Verify theme default colors changed
    - Validate pie series centering behavior

6. **Deprecations** (Low Priority)
    - Confirm AgChart → AgCharts deprecation

### Success Criteria

-   All removed APIs are confirmed absent in v9
-   All replacement APIs exist and function as documented
-   Migration paths are valid and functional
-   No undocumented breaking changes discovered

### Estimated Complexity

-   **High complexity** due to extensive API surface area changes
-   Requires checking multiple packages (community, enterprise, types)
-   No examples to test, purely API validation
-   Estimated time: 2-3 hours for thorough validation

## Charts QA Tester Agent Delegation

Not applicable - this page contains no examples to test.

## Visual Testing Requirements

Not applicable - no examples or visual elements to validate.

## Notes for Phase 2 Execution

1. Start with TypeScript interface validation as it's the quickest way to verify API changes
2. Cross-reference with implementation files to confirm runtime behavior matches
3. Pay special attention to the bar/column series changes as they affect AG Grid integration
4. Check git history around v9.0.0 release for any undocumented breaking changes
5. Verify all linked minor version upgrade guides exist (9.1, 9.2, 9.3)
