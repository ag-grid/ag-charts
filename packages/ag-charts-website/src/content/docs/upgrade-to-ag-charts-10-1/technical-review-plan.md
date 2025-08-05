# Technical Review Plan: Upgrade to AG Charts 10.1

## Page Analysis Summary

### Document Type

This is an upgrade guide for AG Charts version 10.1, focusing on deprecations and migration paths. Unlike feature documentation pages, this page documents breaking changes and deprecated APIs.

### Key Content Areas

1. **Release Information**

    - Links to release post for feature highlights
    - Reference to integrated charting on AG Grid 32.1

2. **Deprecations List**

    - Financial Charts `chartType` deprecation
    - `AgPriceVolumePreset` property deprecations
    - Toolbar icon naming changes

3. **Changelog Reference**
    - Link to full changelog for version 10.1.0

### Examples Referenced

**None** - This upgrade guide contains no examples to test.

### Interactive Features Described

**None** - No interactive features are documented on this page.

## Validation Targets

### TypeScript Interface Verification

1. **AgPriceVolumePreset Interface**

    - File: `packages/ag-charts-types/src/presets/financial/priceVolumeOptions.ts`
    - Verify deprecated properties are NOT present:
        - `rangeToolbar` (should not exist - replaced by `rangeButtons`)
        - `xKey` (should not exist - replaced by `dateKey`)
        - `annotations` (should not exist - replaced by `toolbar`)
    - Verify new properties exist:
        - `rangeButtons`
        - `dateKey`
        - `toolbar`

2. **AgPriceVolumeChartType Type**

    - File: `packages/ag-charts-types/src/presets/financial/priceVolumeOptions.ts`
    - Verify `range-area` is NOT included in the type union
    - Verify `hlc` exists as a valid chart type

3. **AgIconName Type**
    - File: `packages/ag-charts-types/src/chart/icons.ts`
    - Verify deprecated icon names do NOT exist:
        - `lock` (should not exist - replaced by `locked`)
        - `unlock` (should not exist - replaced by `unlocked`)
        - `trend-line` (should not exist - replaced by `trend-line-drawing`)
        - `parallel-channel` (should not exist - replaced by `parallel-channel-drawing`)
        - `disjoint-channel` (should not exist - replaced by `disjoint-channel-drawing`)
        - `horizontal-line` (should not exist - replaced by `horizontal-line-drawing`)
        - `vertical-line` (should not exist - replaced by `vertical-line-drawing`)
    - Verify new icon names exist:
        - `locked`
        - `unlocked`
        - `trend-line-drawing`
        - `parallel-channel-drawing`
        - `disjoint-channel-drawing`
        - `horizontal-line-drawing`
        - `vertical-line-drawing`

### Implementation Verification

1. **Financial Chart Types**

    - Check `packages/ag-charts-community/src/chart/factory/expectedEnterpriseModules.ts`
    - Verify if `range-area` is still referenced (should be deprecated/removed)
    - Verify `hlc` is a supported chart type

2. **Icon Legacy Suffix Handling**
    - Search for `-legacy` suffixed icons in the codebase
    - Verify documentation claim that "old icons are renamed with a `-legacy` suffix"

### Cross-Reference with Other Documentation

1. **Version 11 Upgrade Guide**

    - File: `packages/ag-charts-website/src/content/docs/upgrade-to-ag-charts-11/index.mdoc`
    - Verify that v10.1 deprecations are listed as removed in v11
    - Check consistency between deprecation (v10.1) and removal (v11) documentation

2. **Changelog Verification**
    - File: `packages/ag-charts-website/public/changelog/changelog.json`
    - Verify entries for version 10.1.0 match the documented deprecations
    - Cross-check deprecation notes in changelog with upgrade guide

### External Link Validation

1. **Release Post Link**

    - URL: `https://blog.ag-grid.com/whats-new-in-ag-charts-10-1/`
    - Verify link is accessible and contains relevant v10.1 information

2. **Changelog Link**
    - Path: `/changelog/?fixVersion=10.1.0`
    - Verify link structure and that it would filter to v10.1.0 changes

## Known Exceptions

No technical-review-exceptions.md file exists for this page.

## Execution Plan

### Priority 1: TypeScript Definition Validation

1. **AgPriceVolumePreset Interface** (Estimated: 5 minutes)

    - Read the interface definition
    - Verify deprecated properties are absent
    - Verify replacement properties exist
    - Document any discrepancies

2. **Chart Type Validation** (Estimated: 5 minutes)

    - Check AgPriceVolumeChartType for `range-area` absence
    - Verify `hlc` is a valid type
    - Cross-reference with implementation files

3. **Icon Name Validation** (Estimated: 10 minutes)
    - Read AgIconName type definition
    - Verify all deprecated icon names are absent
    - Verify all replacement icon names exist
    - Search for legacy suffix pattern

### Priority 2: Implementation Consistency

1. **Financial Charts Module Check** (Estimated: 5 minutes)

    - Check expectedEnterpriseModules.ts for `range-area` references
    - Verify deprecation is properly handled in implementation

2. **Legacy Icon Investigation** (Estimated: 10 minutes)
    - Search for `-legacy` suffix pattern in codebase
    - Verify documentation claim about legacy suffixes
    - Check if legacy icons exist in v10.1

### Priority 3: Documentation Consistency

1. **Version 11 Cross-Reference** (Estimated: 5 minutes)

    - Read v11 upgrade guide
    - Verify v10.1 deprecations are listed as removed
    - Check for consistency in migration guidance

2. **Changelog Verification** (Estimated: 10 minutes)
    - Search changelog.json for v10.1.0 entries
    - Verify all documented deprecations are in changelog
    - Check for additional deprecations not in upgrade guide

### Priority 4: External Links

1. **Link Accessibility** (Estimated: 5 minutes)
    - Test release post link
    - Verify changelog link structure

## Success Criteria

1. **API Accuracy**: All deprecated properties/types should NOT exist in TypeScript definitions, and their replacements should exist
2. **Implementation Alignment**: Deprecated features should be properly marked or removed in implementation files
3. **Documentation Consistency**: Deprecations in v10.1 should align with removals in v11
4. **Changelog Completeness**: All deprecations should be documented in the changelog
5. **Link Validity**: External links should be accessible and relevant

## Delegation Plan for example-tester Agent

**Not Applicable** - This upgrade guide contains no examples to test. The example-tester agent will not be needed for this review.

## Notes

This is a straightforward upgrade guide with no examples or interactive features. The review will focus entirely on verifying that the documented deprecations are accurate by cross-referencing with:

-   TypeScript type definitions
-   Implementation code
-   Related documentation (v11 upgrade guide, changelog)
-   External links

The most critical validation is ensuring that deprecated APIs are truly deprecated/removed and their replacements exist as documented.
