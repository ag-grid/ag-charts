# Technical Review Plan: Upgrade to AG Charts 12.0

## Page Analysis Summary

### Document Type

This is a migration guide documenting changes from AG Charts 11.x to 12.0. Unlike feature documentation pages, this focuses on API changes, breaking changes, and migration paths.

### Content Structure

-   Breaking changes (5 items across 4 categories)
-   Behavior changes (11 items across 5 categories)
-   Deprecations (4 items)
-   Removed deprecated properties (4 items)

### Key APIs and Configuration Options Documented

1. **Series Configuration**: `series[].type`, `series[].labelKey`, series listeners
2. **Axes Configuration**: time axis properties, `unit-time` axis, sorting behavior, thickness
3. **Theme Configuration**: `theme.params.*` color values, padding, shadows
4. **Zoom Configuration**: `autoScaling`, `minVisibleItems`
5. **Tooltip Configuration**: `position.type`, `position.anchorTo`, `position.placement`
6. **Context Menu**: `extraActions` properties, `items[]` array
7. **Time Intervals**: `AgTimeInterval`, `AgTimeIntervalUnit`

### Examples Referenced

**NONE** - This is a migration guide without interactive examples

### Interactive Features Described

-   Zoom functionality with new autoScaling default
-   Context menu with new "Reset Zoom" item
-   Navigator with new default height when Mini Chart enabled
-   Tooltip behavior changes with labelKey

## Validation Targets

### TypeScript Interfaces to Verify

#### Series-Related

-   `packages/ag-charts-types/src/chart/series/seriesOptions.ts` - Verify `type` is required
-   `packages/ag-charts-types/src/chart/series/cartesian/bubbleSeriesOptions.ts` - Check labelKey behavior
-   `packages/ag-charts-types/src/chart/seriesOptions.ts` - Verify listener property names

#### Axes-Related

-   `packages/ag-charts-types/src/chart/axis/timeAxisOptions.ts` - Confirm removed properties
-   `packages/ag-charts-types/src/chart/axis/unitTimeAxisOptions.ts` - Verify replacement axis type
-   `packages/ag-charts-types/src/chart/axis/axisOptions.ts` - Check thickness property

#### Theme-Related

-   `packages/ag-charts-types/src/chart/themeOptions.ts` - Verify theme.params structure
-   `packages/ag-charts-types/src/chart/chartOptions.ts` - Confirm chartPadding exists

#### Other Configuration

-   `packages/ag-charts-types/src/chart/zoomOptions.ts` - Check autoScaling, minVisibleItems
-   `packages/ag-charts-types/src/chart/tooltipOptions.ts` - Verify position properties
-   `packages/ag-charts-types/src/chart/contextMenuOptions.ts` - Check items[] vs extraActions
-   `packages/ag-charts-types/src/util/time.ts` - Verify AgTimeInterval types

### Implementation Files to Check

#### Series Implementation

-   `packages/ag-charts-community/src/chart/series/cartesian/bubbleSeries.ts` - labelKey fallback logic
-   `packages/ag-charts-community/src/chart/series/seriesProperties.ts` - type requirement
-   `packages/ag-charts-community/src/chart/interaction/tooltipManager.ts` - labelKey in tooltip

#### Axes Implementation

-   `packages/ag-charts-community/src/chart/axis/timeAxis.ts` - Removed properties
-   `packages/ag-charts-community/src/chart/axis/ordinalTimeAxis.ts` - Sorting behavior
-   `packages/ag-charts-community/src/chart/axis/axis.ts` - Thickness default calculation

#### Theme Implementation

-   `packages/ag-charts-community/src/chart/themes/themes.ts` - Default color values
-   `packages/ag-charts-community/src/chart/themes/darkTheme.ts` - Dark theme defaults
-   `packages/ag-charts-community/src/chart/themes/materialTheme.ts` - Material theme defaults

#### Other Implementation

-   `packages/ag-charts-community/src/chart/interaction/zoomManager.ts` - autoScaling default
-   `packages/ag-charts-community/src/chart/interaction/contextMenu.ts` - Reset Zoom item
-   `packages/ag-charts-enterprise/src/features/navigator/navigator.ts` - Default height

### User Interactions to Validate

Since this is a migration guide without examples, validation will focus on:

1. Creating test cases that demonstrate breaking changes actually break
2. Verifying behavior changes are observable
3. Confirming deprecation warnings are shown
4. Testing that suggested migration paths work

### Visual States to Screenshot

Not applicable - no examples to screenshot

## Known Exceptions

None found - no `technical-review-exceptions.md` file exists for this page

## Execution Plan

### Priority 1: Breaking Changes Validation (Critical)

#### 1.1 Series Type Requirement

-   [ ] Check `AgSeriesOptions` interface for `type` property optionality
-   [ ] Verify TypeScript compilation fails without `type`
-   [ ] Confirm error message is helpful for migration

#### 1.2 Time Axis Property Removal

-   [ ] Verify `unit`, `paddingInner`, `paddingOuter`, `groupPaddingInner` are removed from TimeAxisOptions
-   [ ] Confirm these properties exist in UnitTimeAxisOptions
-   [ ] Test that using removed properties causes TypeScript errors

#### 1.3 Theme Padding Migration

-   [ ] Verify `theme.params.padding` is removed
-   [ ] Confirm `chartPadding` exists as replacement
-   [ ] Check implementation for migration path

#### 1.4 Series Listener Renaming

-   [ ] Verify `nodeClick` and `nodeDoubleClick` are removed
-   [ ] Confirm `seriesNodeClick` and `seriesNodeDoubleClick` exist
-   [ ] Check all series types for consistency

#### 1.5 Vue Version Requirement

-   [ ] Check package.json for Vue peer dependency version
-   [ ] Verify minimum version is 3.5

### Priority 2: Behavior Changes Validation (High)

#### 2.1 Bubble Series Label Behavior

-   [ ] Check BubbleSeries implementation for labelKey fallback logic
-   [ ] Verify it falls back to sizeKey instead of yKey
-   [ ] Test tooltip includes label value when labelKey is set

#### 2.2 Axis Sorting and Formatting

-   [ ] Verify vertical time axes sort with earliest at top
-   [ ] Check default label format improvements
-   [ ] Confirm thickness calculation (30% max)

#### 2.3 Theme Default Colors

-   [ ] Verify each color value change is accurate:
    -   foregroundColor: #464646 → #181d1f
    -   axisColor: #c3c3c3 → #b4b6b6
    -   borderColor: #dddddd → rgba(24, 29, 31, 0.15)
    -   chromeBackgroundColor: #fafafa → #fafafb
    -   crosshairLabelBackgroundColor: #464646 → #181d1f
    -   gridLineColor: #e0eaf2 → #e8e8e9
    -   inputTextColor: #464646 → #181d1f
    -   subtleTextColor: #8c8c8c → #707374
    -   textColor: #464646 → #181d1f
-   [ ] Check new popupShadow and focusShadow properties

#### 2.4 Other Defaults

-   [ ] Verify strokeWidth default when stroke is provided
-   [ ] Check Navigator height (40px) with Mini Chart
-   [ ] Confirm zoom.autoScaling defaults to true
-   [ ] Verify "Reset Zoom" in default context menu

### Priority 3: Deprecations and Removals (Medium)

#### 3.1 Time Import Deprecation

-   [ ] Verify `time` import shows deprecation warning
-   [ ] Confirm AgTimeInterval and AgTimeIntervalUnit work as replacements
-   [ ] Check utc\* and week removal

#### 3.2 HighlightStyle Deprecation

-   [ ] Verify highlightStyle removed except for treemap/sunburst
-   [ ] Confirm highlight options work as replacement

#### 3.3 Removed Properties

-   [ ] Verify all removed properties are actually gone:
    -   zoom.minVisibleItemsX/Y
    -   tooltip.position.type
    -   contextMenu.extraActions[]
-   [ ] Confirm suggested replacements exist and work

### Success Criteria

1. **Breaking Changes**: All 5 breaking changes must cause TypeScript compilation errors when used
2. **Behavior Changes**: All 11 behavior changes must be observable at runtime
3. **Deprecations**: All 4 deprecations must show console warnings
4. **Removals**: All 4 removed properties must not exist in v12 types
5. **Migration Paths**: All suggested alternatives must work correctly

### Estimated Complexity

-   **High Complexity**: Theme default color verification (11 values to check across multiple themes)
-   **Medium Complexity**: Breaking change validation, behavior testing
-   **Low Complexity**: Simple property removal verification

### Delegation Plan for example-tester Agent

Since there are no examples to test, the example-tester agent will not be used in this review. Instead, validation will focus on:

1. TypeScript interface analysis
2. Implementation code review
3. Creating minimal test cases to verify changes
4. Checking compilation errors and runtime behavior

## Risk Assessment

### High Risk Areas

-   Theme color changes affecting visual appearance across all charts
-   Breaking changes that might not be caught by TypeScript (runtime only)
-   Zoom behavior changes affecting user experience

### Medium Risk Areas

-   Axis sorting changes potentially breaking existing layouts
-   Tooltip behavior modifications
-   Context menu changes

### Low Risk Areas

-   Simple property removals with clear migration paths
-   Deprecation warnings for future removal
-   Vue version requirement (framework-specific)

## Notes

This migration guide is unique in that it:

1. Has no interactive examples to test
2. Focuses on API changes rather than feature documentation
3. Requires validation through code analysis rather than visual testing
4. Needs verification that breaking changes actually break as documented

The review will emphasize accuracy of the migration information to ensure developers can successfully upgrade from v11 to v12.
