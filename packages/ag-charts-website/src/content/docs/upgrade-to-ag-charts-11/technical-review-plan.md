# Technical Review Plan: Upgrade to AG Charts 11

## Page Analysis Summary

This is a migration guide documenting breaking changes, behavior changes, and upgrade instructions for AG Charts version 11.0. The page covers:

### Key Features Documented

- License API migration (`AgCharts.setLicenseKey()` to `LicenseManager.setLicenseKey()`)
- Framework compatibility updates (React 18+, Angular 17+)
- Series API changes (bullet series removal, label placement changes)
- Axes API changes (crossline label positions, tick/label spacing)
- Tooltip API restructuring (new renderer format, CSS class changes)
- Financial charts API changes (chartType, preset properties)
- Miscellaneous API changes (legend events, navigator, zoom, toolbar)
- CSS class naming convention changes (ag-chart-_ to ag-charts-_)

### Interactive Features

- No interactive examples on this page
- Contains links to other documentation pages (e.g., Linear Gauge)
- Release blog post link
- Framework-specific conditional content

### Examples Referenced

- No code examples embedded in this page
- References external pages:
    - Linear Gauge documentation for bullet series replacement
    - Release blog post for feature highlights

## Validation Targets

### TypeScript Interfaces to Verify

1. **License Management**
    - Verify `LicenseManager` exists in enterprise package
    - Confirm `setLicenseKey()` method signature
    - Verify `AgCharts.setLicenseKey()` is actually removed

2. **Series Types**
    - Confirm `bullet` series type is removed from type definitions
    - Verify Linear Gauge exists as replacement
    - Check label placement enums for bar and waterfall series:
        - Bar: `inside-center`, `outside-end` exist
        - Waterfall: `inside-center`, `outside-start`, `outside-end` exist

3. **Axes Types**
    - Verify `AgCrossLineLabelPosition` uses kebab-case values
    - Check axes label `spacing` property exists (replacing `padding`)
    - Confirm `crosshair.label.className` is removed
    - Verify category axis `format` properties are removed

4. **Tooltip Types**
    - Check new tooltip renderer structure:
        - `heading`, `title`, `data` properties
        - Types: `heading: string`, `title: string`, `data: string[]`
    - Verify `color` param removed, `fill` and `stroke` added
    - Confirm `itemId` removal for most series types

5. **Financial Charts**
    - Verify `AgPriceVolumePreset` interface changes:
        - `rangeButtons` replaces `rangeToolbar`
        - `dateKey` replaces `xKey`
        - `toolbar` replaces `annotations`

6. **Other APIs**
    - Check `AgChartState` replaces `AgChartSerializableState`
    - Verify `initialState.zoom` structure for ratioX/ratioY
    - Confirm toolbar API restructuring

### Implementation Files to Check

1. **License Management**
    - `packages/ag-charts-enterprise/src/license/licenseManager.ts`
    - `packages/ag-charts-enterprise/src/setup.ts`
    - Verify AgCharts no longer exports setLicenseKey

2. **Series Implementation**
    - Check bullet series removal in community/enterprise packages
    - Verify bar series label placement implementation
    - Verify waterfall series label placement implementation

3. **Axes Implementation**
    - Check crossline label position implementation
    - Verify tick/label spacing behavior
    - Confirm category axis format removal

4. **Tooltip Implementation**
    - `packages/ag-charts-community/src/chart/tooltip/tooltip*.ts`
    - Verify new tooltip structure and params

5. **CSS Classes**
    - `packages/ag-charts-community/src/dom/theme.css`
    - Verify new CSS class naming convention

### CSS Classes to Validate

1. **Tooltip Classes**
    - Old: `ag-chart-tooltip`, `ag-chart-tooltip-title`, `ag-chart-tooltip-content`
    - New: `ag-charts-tooltip`, `ag-charts-tooltip-heading`, `ag-charts-tooltip-title`, `ag-charts-tooltip-label`, `ag-charts-tooltip-value`

2. **Crosshair Classes**
    - Old: `ag-crosshair-label*`
    - New: `ag-charts-crosshair-label*`

3. **Other Classes**
    - Context menu: `ag-chart-context-menu*` → `ag-charts-context-menu*`
    - Overlays: `ag-chart-*-overlay` → `ag-charts-*-overlay`

### Links to Verify

- Release blog post URL: https://www.ag-grid.com/blog/whats-new-in-ag-charts-11/
- Linear Gauge documentation link: `./linear-gauge/#bullet-series`

## Known Exceptions

No technical-review-exceptions.md file exists for this page.

## Execution Plan

### Priority 1: Critical API Changes

1. **License API Migration** (High Priority)
    - Verify `LicenseManager.setLicenseKey()` exists and works
    - Confirm `AgCharts.setLicenseKey()` is removed
    - Check migration path is correct

2. **Series Type Removal** (High Priority)
    - Confirm bullet series is completely removed
    - Verify Linear Gauge exists as documented replacement
    - Check bar/waterfall label placement enums

3. **Tooltip API Changes** (High Priority)
    - Verify new renderer structure and types
    - Check param changes (color → fill/stroke)
    - Validate CSS class changes

### Priority 2: Framework Compatibility

1. **React Version Check** (Medium Priority)
    - Verify React 18 minimum requirement
    - Check conditional content rendering

2. **Angular Version Check** (Medium Priority)
    - Verify Angular 17 minimum requirement
    - Check conditional content rendering

### Priority 3: CSS and Styling Changes

1. **CSS Class Migration** (Medium Priority)
    - Verify all ag-chart-_ → ag-charts-_ changes
    - Check theme.css for new classes
    - Validate overlay class changes

### Priority 4: Other API Changes

1. **Axes Changes** (Medium Priority)
    - Verify crossline label position kebab-case
    - Check tick/label spacing behavior
    - Confirm format removal for category axes

2. **Miscellaneous Changes** (Low Priority)
    - Check navigator API changes
    - Verify zoom API restructuring
    - Validate toolbar API changes

### Success Criteria

- All removed APIs are actually removed from codebase
- All replacement APIs exist and have correct signatures
- CSS classes follow new naming convention
- Links to other documentation pages are valid
- Framework-specific content renders correctly

### Estimated Complexity

- **High Complexity**: License API, Tooltip API, Series removal
- **Medium Complexity**: CSS changes, Axes changes, Framework compatibility
- **Low Complexity**: Link validation, Miscellaneous API changes

## Delegation Plan for example-tester Agent

Since this upgrade guide has no embedded examples, the example-tester agent will not be needed for this review. However, we should note that:

1. The Linear Gauge page (referenced for bullet series replacement) should be tested separately
2. Any examples demonstrating the new APIs mentioned here should be validated in their respective documentation pages
3. Migration examples, if they exist elsewhere, should demonstrate the before/after API usage

## Notes

This is a migration guide, so the focus is on:

1. Accuracy of breaking change documentation
2. Correctness of migration paths
3. Completeness of API change coverage
4. Valid links to replacement features
5. Framework-specific content accuracy

The review will need to cross-reference multiple parts of the codebase to verify that the documented changes accurately reflect the actual v11.0 implementation.
