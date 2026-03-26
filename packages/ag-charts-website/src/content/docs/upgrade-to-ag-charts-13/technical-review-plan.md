# Technical Review Plan: upgrade-to-ag-charts-13

**Page Path**: `packages/ag-charts-website/src/content/docs/upgrade-to-ag-charts-13/index.mdoc`

**Review Date**: 2025-12-12

**Review Mode**: ADAPTIVE MODE (Degraded - Static Analysis Only)

-   Missing: MCP Puppeteer (browser automation)
-   Missing: Task tool (example testing delegation)
-   Available: Read, Write, Grep, Glob, Bash

## Overview

This is a migration guide page documenting breaking changes, behavior changes, and deprecations for AG Charts v13.0. The page contains NO examples (no `_examples/` directory exists), only code snippets showing migration patterns.

## Files Discovered for Review

### TypeScript Definition Files

1. **Axis Options**:

    - `/Users/bls/git/ag-charts.worktrees/review-docs-13/packages/ag-charts-types/src/chart/axisOptions.ts`
    - `/Users/bls/git/ag-charts.worktrees/review-docs-13/packages/ag-charts-types/src/chart/cartesianOptions.ts`

2. **Series Highlight Options**:

    - `/Users/bls/git/ag-charts.worktrees/review-docs-13/packages/ag-charts-types/src/series/seriesOptions.ts`
    - `/Users/bls/git/ag-charts.worktrees/review-docs-13/packages/ag-charts-types/src/chart/callbackOptions.ts`

3. **Zoom Options**:

    - `/Users/bls/git/ag-charts.worktrees/review-docs-13/packages/ag-charts-types/src/chart/zoomOptions.ts`

4. **Module Registry**:

    - `/Users/bls/git/ag-charts.worktrees/review-docs-13/packages/ag-charts-community/src/main.ts`
    - `/Users/bls/git/ag-charts.worktrees/review-docs-13/packages/ag-charts-enterprise/src/main.ts`
    - `/Users/bls/git/ag-charts.worktrees/review-docs-13/packages/ag-charts-community/src/module-bundles/all.ts`
    - `/Users/bls/git/ag-charts.worktrees/review-docs-13/packages/ag-charts-enterprise/src/module-bundles/all.ts`

5. **Treemap and Sunburst Series** (for highlightStyle removal):

    - `/Users/bls/git/ag-charts.worktrees/review-docs-13/packages/ag-charts-types/src/series/standalone/treemapOptions.ts`
    - `/Users/bls/git/ag-charts.worktrees/review-docs-13/packages/ag-charts-types/src/series/standalone/sunburstOptions.ts`

6. **Financial Chart Series** (for highlight defaults):

    - `/Users/bls/git/ag-charts.worktrees/review-docs-13/packages/ag-charts-types/src/series/cartesian/candlestickOptions.ts`
    - `/Users/bls/git/ag-charts.worktrees/review-docs-13/packages/ag-charts-types/src/series/cartesian/ohlcOptions.ts`
    - `/Users/bls/git/ag-charts.worktrees/review-docs-13/packages/ag-charts-types/src/series/cartesian/waterfallOptions.ts`
    - `/Users/bls/git/ag-charts.worktrees/review-docs-13/packages/ag-charts-types/src/series/cartesian/rangeBarOptions.ts`
    - `/Users/bls/git/ag-charts.worktrees/review-docs-13/packages/ag-charts-types/src/series/cartesian/rangeAreaOptions.ts`

7. **Sankey Series** (for edgePlacement):

    - `/Users/bls/git/ag-charts.worktrees/review-docs-13/packages/ag-charts-types/src/series/standalone/sankeyOptions.ts`

8. **Scatter/Bubble Series** (for maxRenderedItems):
    - `/Users/bls/git/ag-charts.worktrees/review-docs-13/packages/ag-charts-types/src/series/cartesian/scatterOptions.ts`
    - `/Users/bls/git/ag-charts.worktrees/review-docs-13/packages/ag-charts-types/src/series/cartesian/bubbleOptions.ts`

### Implementation Files to Check for Defaults

Will search for Module files to verify theme template defaults:

-   Axis modules (category, number, time axes)
-   Series modules (all series types mentioned)
-   Zoom module
-   Highlight feature implementations

### Examples to Test

**NO EXAMPLES**: This page is a migration guide with only code snippets. No interactive examples to test.

## Validation Tasks

### 1. Breaking Changes Validation

#### 1.1 Angular Compatibility

-   **Claim**: "The minimum version of Angular you can use with AG Charts is now Angular 18"
-   **Verify**: Check package.json peerDependencies in ag-charts-angular
-   **Files**: `/Users/bls/git/ag-charts.worktrees/review-docs-13/packages/ag-charts-angular/package.json`

#### 1.2 Module Registration

-   **Claim**: "Module Registration is now required, unless using the UMD bundle"
-   **Verify**:
    -   `AllCommunityModule` and `AllEnterpriseModule` exports exist
    -   `ModuleRegistry.registerModules()` API exists
    -   UMD bundle behavior (auto-registration)
-   **Files**: Community and Enterprise main.ts, UMD bundles

#### 1.3 Axes as Dictionary

-   **Claim**: "The `axes` option is now a dictionary instead of an array"
-   **Verify**:
    -   Type definition shows `Record<string, AgCartesianAxisOptions>` pattern
    -   Default keys are `'x'`, `'y'`, `'angle'`, `'radius'`
    -   Array syntax is no longer valid
-   **Files**: `cartesianOptions.ts`, `polarOptions.ts` (if exists)

#### 1.4 Axes Keys Property Removal

-   **Claim**: "The `axes.keys` option is removed. Use the series `_KeyAxes` properties"
-   **Verify**:
    -   `axes.keys` no longer exists in type definitions
    -   Series have `xKey`, `yKey`, or axis reference properties
-   **Files**: Axis and series type definitions

#### 1.5 Highlight Changes

-   **Claim**: "`highlightStyle` is removed from `treemap` and `sunburst` series"
-   **Verify**: Type definitions don't have `highlightStyle` property
-   **Files**: treemapOptions.ts, sunburstOptions.ts

-   **Claim**: "The `highlighted` boolean is removed from all callback params. Use `highlightState` instead"
-   **Verify**: Callback param interfaces use `highlightState` not `highlighted`
-   **Files**: callbackOptions.ts

#### 1.6 Callback Return Types

-   **Claim**: "All callbacks that used to return a `string` or `string | TextSegment[]` now also support returning a `number` or `Date` value"
-   **Verify**: Type definitions show `string | number | Date | TextSegment[]`
-   **Files**: Search for formatter callback types

#### 1.7 TextSegment Changes

-   **Claim**: "`TextSegment`s now also support `string | number | Date` in the `text` field"
-   **Verify**: TextSegment interface definition
-   **Files**: Search for TextSegment type definition

#### 1.8 ItemId Changes

-   **Claim**: "`itemId` used in series formatters/stylers is removed and replaced by `itemType`"
-   **Series**: waterfall, range-area, range-bar, candlestick, ohlc
-   **Verify**: Callback params have `itemType` not `itemId`
-   **Files**: Respective series options files

-   **Claim**: "`itemId` type in event parameters is updated from `string` to `string | number`"
-   **Verify**: Event parameter types
-   **Files**: eventOptions.ts

### 2. Behavior Changes Validation

#### 2.1 Axis Interval Placement

-   **Claim**: "`interval.placement` defaults to `'between'` instead of `'on'`"
-   **Verify**:
    -   Default value in type definition comments
    -   Theme template defaults in axis modules
-   **Files**: cartesianOptions.ts (line ~200), axis module implementations

#### 2.2 Min/Max vs PreferredMin/PreferredMax

-   **Claim**: "`min` and `max` are absolute values and not overridden by `nice`"
-   **Claim**: "Use `preferredMin` and `preferredMax` for more flexible options"
-   **Verify**:
    -   Type definitions show both properties
    -   Comments clarify the difference
-   **Files**: axisOptions.ts (lines ~75-83)

#### 2.3 Highlight Defaults

-   **Claim**: "Default highlighting now de-emphasises unhighlighted items and series"
-   **Verify**: Module theme templates for highlight configuration

-   **Claim**: "`highlight.bringToFront` defaults to `true` for all series"
-   **Verify**: Default in type definition or theme template
-   **Files**: seriesOptions.ts (line ~34), series module implementations

-   **Claim**: "`highlight.drawingMode` defaults to `'cutout'` instead of `'overlay'`"
-   **Verify**: Type definition default comment or theme
-   **Files**: Search for drawingMode in chart options

-   **Claim**: "Financial Charts have `highlight.enabled: false` on all series"
-   **Verify**: Financial series modules (candlestick, ohlc) theme templates
-   **Files**: Financial series module files

#### 2.4 Zoom Defaults

-   **Claim**: "`zoom.enableAxisScrolling` defaults to `true`"
-   **Verify**: Default in type definition comment (line 134)
-   **Files**: zoomOptions.ts

-   **Claim**: "`zoom.onDataChange.strategy` of `'preserveDomain'` is the default"
-   **Verify**: Default in type definition comment (line 67)
-   **Files**: zoomOptions.ts

-   **Claim**: "`zoom.onDataChange.stickToEnd` option defaults to `true` for Financial Charts"
-   **Verify**: Financial chart preset or theme defaults
-   **Files**: Financial chart presets or theme configurations

#### 2.5 Sankey Edge Placement

-   **Claim**: "Sankey series use the full width of the series area when `edgePlacement: undefined`"
-   **Verify**: Type definition and default behavior
-   **Files**: sankeyOptions.ts

#### 2.6 MaxRenderedItems

-   **Claim**: "`maxRenderedItems` for `scatter` and `bubble` series defaults to `2000` instead of `10000`"
-   **Verify**: Default in type definition comments or theme templates
-   **Files**: scatterOptions.ts, bubbleOptions.ts, series modules

### 3. Removed Deprecated APIs Validation

#### 3.1 HighlightStyle Removal

-   **Claim**: "`highlightStyle` is removed from all series"
-   **Verify**: No `highlightStyle` property in series options types
-   **Files**: All series option files

#### 3.2 AgSeriesAreaPaddingOptions Removal

-   **Claim**: "`AgSeriesAreaPaddingOptions` type is removed. Use `PaddingOptions` or `Padding` instead"
-   **Verify**:
    -   AgSeriesAreaPaddingOptions doesn't exist
    -   PaddingOptions and Padding types exist
-   **Files**: Search in types files

### 4. Code Snippet Validation

All code snippets in the documentation need to be validated for:

-   Correct TypeScript syntax
-   Valid property names and types
-   Accurate before/after migration examples
-   Consistency with type definitions

## Testing Strategy (Degraded Mode)

Since browser automation and example testing are unavailable:

1. **Static Type Analysis**: Read all discovered type definition files and verify documented claims
2. **Implementation Cross-Check**: Search for Module files and theme templates for default values
3. **Code Snippet Validation**: Parse inline code snippets and validate against type definitions
4. **Cross-Reference Links**: Verify internal documentation links point to valid pages
5. **Consistency Check**: Ensure claims in different sections don't contradict each other

## Limitations (Degraded Mode)

Cannot verify:

-   Runtime behavior of migration patterns
-   Visual rendering of any features
-   Interactive testing of new APIs
-   Browser console errors
-   Performance characteristics

Manual verification recommended for:

-   End-to-end migration workflow
-   Framework wrapper compatibility (Angular 18+)
-   UMD bundle auto-registration
-   Runtime default value behavior

## Review Outputs

1. **Review Plan**: This file
2. **Technical Review Report**: `reports/technical-review-report.md`
    - Executive Summary
    - Review Limitations section (degraded mode notice)
    - Known Exceptions (none expected)
    - Technical Accuracy Issues
    - Example Consistency Issues (N/A - no examples)
    - Visual and Interaction Testing Results (SKIPPED)
    - Content Quality Issues
    - Recommendations
    - Summary

## Next Steps

1. Execute static analysis of all discovered files
2. Validate each claim in the documentation
3. Check for missing or incomplete information
4. Generate detailed technical review report
5. Provide prioritized recommendations for fixes
