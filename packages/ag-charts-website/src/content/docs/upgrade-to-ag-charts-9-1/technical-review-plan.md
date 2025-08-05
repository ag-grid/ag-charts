# Technical Review Plan: Upgrade to AG Charts 9.1

## Page Analysis Summary

### Documentation Type

This is a migration guide page for AG Charts version 9.1. It focuses on:

-   Breaking changes and deprecations
-   Migration paths for deprecated features
-   Reference to release blog post for new features
-   Reference to changelog for complete changes

### Key Content Areas

1. **Deprecations**: Lists deprecated properties and their replacements
2. **Migration Guidance**: Brief guidance on moving from deprecated features
3. **External Links**: Links to release blog and changelog

### Notable Characteristics

-   This is a brief upgrade guide with minimal technical detail
-   No code examples are provided on this page
-   Heavy reliance on external links for detailed information
-   Focuses primarily on breaking changes rather than new features

## Validation Targets

### TypeScript Interface Verification

1. **Pie Series Deprecations**:

    - Check `packages/ag-charts-types/src/series/polar/pieOptions.ts` for:
        - `innerRadiusOffset` property and deprecation markers
        - `innerRadiusRatio` property and deprecation markers
        - `innerCircle` property and deprecation markers
        - `innerLabels` property and deprecation markers
    - Verify these properties are marked as `@deprecated` with migration guidance

2. **Donut Series Migration**:

    - Check `packages/ag-charts-types/src/series/polar/donutOptions.ts` for:
        - Equivalent functionality to deprecated pie properties
        - Proper type definitions for donut series
    - Cross-reference with donut series documentation for migration path

3. **AgPolarAxesTheme Deprecation**:

    - Check `packages/ag-charts-types/src/chart/themeOptions.ts` for:
        - `AgPolarAxesTheme` interface definition
        - Deprecation of `type` field
        - Current state of the interface

4. **AgChartThemePalette Deprecation**:
    - Check `packages/ag-charts-types/src/chart/themeOptions.ts` for:
        - `AgChartThemePalette` interface and deprecation marker
        - `AgChartThemeOptionalPalette` interface as replacement
        - Migration guidance in deprecation notice

### Implementation Verification

1. **Pie Series Implementation**:

    - Check `packages/ag-charts-community/src/chart/series/polar/pieSeries.ts` for:
        - Deprecation warnings on the properties
        - Runtime behavior of deprecated properties
        - Console warnings when deprecated properties are used

2. **Donut Series Implementation**:

    - Check `packages/ag-charts-community/src/chart/series/polar/donutSeries.ts` for:
        - Implementation of equivalent functionality
        - Proper handling of migrated features

3. **Theme Implementation**:
    - Check theme-related implementation files for:
        - Handling of deprecated `type` field in `AgPolarAxesTheme`
        - Runtime behavior with/without the field

### External Link Validation

1. **Release Blog Post**:

    - Verify link to https://blog.ag-grid.com/whats-new-in-ag-charts-9-1/ is valid
    - Check if content aligns with deprecations mentioned

2. **Changelog Link**:
    - Verify link to /changelog/?fixVersion=9.1.0 is valid
    - Check if changelog contains all mentioned deprecations

### Cross-Reference Validation

1. **AG Grid Integration**:

    - Verify statement about AG Grid 31.1 integration alignment
    - Check if AG Grid 31.1 uses AG Charts 9.1

2. **Donut Series Documentation**:
    - Check `/docs/donut-series/` page exists and provides migration guidance
    - Verify donut series examples demonstrate migrated functionality

## Known Exceptions

No existing technical review exceptions file found for this page.

## Execution Plan

### Priority 1: Deprecation Accuracy (Critical)

1. **Verify TypeScript Deprecations**:

    - [ ] Check all four pie series properties are properly deprecated in type definitions
    - [ ] Verify deprecation messages include migration guidance to donut series
    - [ ] Check AgPolarAxesTheme type field deprecation
    - [ ] Verify AgChartThemePalette deprecation and replacement

2. **Verify Implementation Warnings**:
    - [ ] Check runtime deprecation warnings are implemented
    - [ ] Verify console warnings appear when using deprecated features
    - [ ] Test that deprecated features still work (backward compatibility)

### Priority 2: Migration Path Validation (High)

1. **Donut Series Migration**:

    - [ ] Verify donut series provides equivalent functionality
    - [ ] Check that migration is straightforward (property mapping)
    - [ ] Confirm donut series documentation exists and is helpful

2. **Theme Migration**:
    - [ ] Verify AgChartThemeOptionalPalette works as replacement
    - [ ] Check that removing 'type' field from AgPolarAxesTheme works

### Priority 3: External References (Medium)

1. **Link Validation**:
    - [ ] Check release blog post link works and contains relevant information
    - [ ] Verify changelog link works and lists all deprecations
    - [ ] Check for any broken or outdated links

### Priority 4: Documentation Completeness (Low)

1. **Content Coverage**:
    - [ ] Check if any other 9.1 deprecations are missing
    - [ ] Verify AG Grid 31.1 integration claim
    - [ ] Check for consistency with other upgrade guides

## example-tester Agent Delegation Plan

Since this upgrade guide contains no examples, the example-tester agent will not be needed for this review. All validation will be done through code inspection and link verification.

## Success Criteria

-   All deprecations mentioned are accurately reflected in code
-   Deprecation warnings are properly implemented
-   Migration paths are clear and functional
-   External links are valid and contain relevant information
-   No undocumented breaking changes in 9.1

## Estimated Complexity

-   **Low complexity**: This is a brief upgrade guide with no examples
-   **Estimated time**: 30-45 minutes
-   **Main effort**: Code inspection and link validation
