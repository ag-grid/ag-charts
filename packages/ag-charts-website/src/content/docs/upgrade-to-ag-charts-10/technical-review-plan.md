# Technical Review Plan: Upgrade to AG Charts 10

## Page Analysis Summary

### Type of Documentation

This is a migration guide documenting breaking changes, behavior changes, and deprecations when upgrading from AG Charts v9 to v10.

### Key Content Areas

1. **Breaking Changes**: API renames, method relocations, and removed features
2. **Behavior Changes**: Theme defaults and other behavioral modifications
3. **Framework-Specific Changes**: React, Angular, Vue, and JavaScript variations
4. **Compatibility Requirements**: Minimum framework versions

### Examples Referenced

-   **No interactive examples**: This page contains no code examples to test
-   **External link**: Release blog post at https://blog.ag-grid.com/whats-new-in-ag-charts-10/

### Features Documented

-   API migration from v9 to v10
-   Namespace changes (AgChart → AgCharts)
-   Method relocations (static to instance methods)
-   Series API changes
-   Axes API changes
-   Theme and styling changes
-   Framework compatibility requirements

## Validation Targets

### TypeScript Interfaces to Verify

#### Core API Changes

-   `AgCharts` namespace (formerly `AgChart`)
-   `AgChartInstance` interface for relocated methods:
    -   `update()`
    -   `updateDelta()`
    -   `download()`
    -   `getImageDataURL()`

#### Event Type Changes

-   Verify removal of:
    -   `AgNodeDoubleClickEvent`
    -   `AgSeriesNodeClickEvent`
    -   `AgSeriesNodeDoubleClickEvent`
-   Verify replacement with `AgNodeClickEvent`

#### Series Type Renames

-   Formatter → ItemStyler pattern:
    -   `AgBarSeriesFormatterParams` → `AgBarSeriesItemStylerParams`
    -   `AgPieSeriesFormatterParams` → `AgPieSeriesItemStylerParams`
    -   `AgDonutSeriesFormatterParams` → `AgDonutSeriesItemStylerParams`
    -   (and all other series types listed)

#### Series Style Type Renames

-   `AgPieSeriesFormat` → `AgPieSeriesStyle`
-   `AgDonutSeriesFormat` → `AgDonutSeriesStyle`
-   (and all other format → style renames)

#### Generic Type Changes

-   Verify added generics for:
    -   `AgRadarSeriesItemStylerParams<TDatum>`
    -   `AgErrorBarOptions<TDatum>`
    -   Various tooltip renderer params

### Implementation Files to Check

#### Core Package Changes

-   `packages/ag-charts-community/src/api/AgCharts.ts` - verify namespace rename
-   `packages/ag-charts-community/src/chart/Chart.ts` - verify instance method relocations
-   Series implementations for:
    -   Pie/Donut separation
    -   Scatter/Bubble marker changes
    -   ItemStyler implementations

#### Framework Wrappers

-   React: `packages/ag-charts-react/src/AgCharts.tsx`
-   Angular: `packages/ag-charts-angular/src/AgCharts.ts`
-   Vue: `packages/ag-charts-vue3/src/AgCharts.ts`

### Configuration Changes to Validate

#### Removed Properties

-   `autosize` property removal
-   `containerStyle` → `style` rename (React)
-   Pie series properties moved to donut:
    -   `innerRadiusOffset`
    -   `innerRadiusRatio`
    -   `innerCircle`
    -   `innerLabels`

#### Axes Changes

-   `tick.color` → `tick.stroke`
-   `line.color` → `line.stroke`
-   `tick` properties moved to `interval`:
    -   `minSpacing`
    -   `maxSpacing`
    -   `values`
    -   `interval` → `step`

#### Legend Changes

-   `item.toggleSeriesVisible` → `toggleSeries`
-   `item.line.length` behavior change

### Behavior Changes to Verify

#### Default Value Changes

-   Pie/donut series `strokeWidth` defaults to `0`
-   Pie/donut series strokes default to palette colors
-   `legend.item.showSeriesStroke` defaults to `true`
-   Crosshairs `snap` defaults for range series
-   Gradient legend reverse order for left/right positions

#### Visual Changes

-   Chart centering in container (vs top-left)
-   Container height no longer 100% by default
-   Pie/donut strokes rendered inside sectors
-   New zoom icons and grouping
-   Time format improvements in tooltips

## Known Exceptions

No technical review exceptions file exists for this page.

## Execution Plan

### Priority 1: Critical API Verification

1. **Namespace and Export Changes**

    - Verify `AgChart` → `AgCharts` rename in all packages
    - Check framework-specific export renames
    - Validate template tag rename for Angular

2. **Method Relocation Verification**

    - Confirm static methods moved to instance methods
    - Verify methods exist on `AgChartInstance`
    - Check removal from static namespace

3. **Type Definition Changes**
    - Validate all listed type renames exist
    - Check generic additions are correct
    - Verify removed types are actually gone

### Priority 2: Series and Configuration Changes

1. **Pie/Donut Separation**

    - Verify pie series no longer accepts inner radius properties
    - Confirm donut series has all migrated properties
    - Check `innerLabels.margin` → `spacing` rename

2. **Scatter/Bubble Changes**

    - Verify marker properties moved to top level
    - Confirm `marker.enabled` removal

3. **Formatter → ItemStyler Pattern**
    - Check all series have `itemStyler` instead of `formatter`
    - Validate parameter type renames

### Priority 3: Framework Compatibility

1. **Angular Minimum Version**

    - Verify Angular 16 requirement

2. **Vue Version Support**
    - Confirm Vue 2 support removal
    - Check Vue 3 compatibility

### Priority 4: Behavior and Theme Changes

1. **Default Value Verification**

    - Check new default values are correct
    - Verify theme changes

2. **Visual Behavior Changes**
    - Document changes that can't be programmatically verified

### Success Criteria

-   All renamed APIs exist in v10
-   All removed APIs are gone in v10
-   All relocated methods work on instances
-   Type definitions match documentation
-   Framework requirements are accurate

### Estimated Complexity

-   **High complexity**: No interactive examples to test, purely API verification
-   **Time estimate**: 2-3 hours for thorough verification
-   **Risk areas**:
    -   Large number of type renames to verify
    -   Framework-specific variations
    -   Behavior changes difficult to verify without examples

## example-tester Agent Delegation Plan

Since this page has no interactive examples, the example-tester agent will not be used in this review. All validation will be done through code inspection and type definition verification.
