# Technical Review Plan: Overlays Documentation

## Page Analysis Summary

### Features Covered

-   Chart overlays for different states (missing data, no visible series, loading, unsupported browser)
-   Customization of overlay text messages
-   Custom overlay renderers for full HTML control
-   Examples of custom loading spinners

### Key APIs and Configuration Options Documented

-   `overlays` configuration object with four sub-properties:
    -   `loading`: Configuration for loading state overlay
    -   `noData`: Configuration for missing data overlay
    -   `noVisibleSeries`: Configuration for no visible series overlay
    -   `unsupportedBrowser`: Configuration for unsupported browser overlay
-   Each overlay supports:
    -   `text`: Custom message text (string or TextSegment array)
    -   `renderer`: Custom function returning HTML string or HTMLElement
    -   `enabled`: Whether overlay is enabled (not explicitly documented but exists in TypeScript)

### Examples Referenced

1. **no-data-plain**: Basic overlay for missing data (default behavior)
2. **no-visible-series**: Overlay shown when all series are hidden
3. **loading**: Loading animation during asynchronous data loading
4. **no-data**: Custom overlay renderer for missing data
5. **loading-custom**: Custom loading spinner implementation

### Interactive Features Described

-   Overlays appear automatically based on chart state
-   Loading overlay specifically linked to asynchronous data loading feature
-   Custom renderers can return interactive HTML elements

## Validation Targets

### TypeScript Interfaces to Verify

1. `AgChartOverlaysOptions` in `packages/ag-charts-types/src/chart/chartOptions.ts`
    - Verify all four overlay properties exist (loading, noData, noVisibleSeries, unsupportedBrowser)
    - Check type is `AgChartOverlayOptions<TContext>`
2. `AgChartOverlayOptions` in `packages/ag-charts-types/src/chart/chartOptions.ts`
    - Verify properties: `enabled`, `text`, `renderer`
    - Check `text` type: `string | TextSegment[]`
    - Check `renderer` type: `Renderer<AgChartOverlayRendererParams<TContext>, HTMLElement>`
3. `AgChartOverlayRendererParams` in `packages/ag-charts-types/src/chart/chartOptions.ts`
    - Verify `context` property exists

### Implementation Files to Check

1. `packages/ag-charts-community/src/chart/overlay/chartOverlays.ts`
    - Verify default classes and message IDs for each overlay
    - Check `darkTheme` property handling
2. `packages/ag-charts-community/src/chart/overlay/overlay.ts`
    - Verify default `enabled` value (true)
    - Check renderer implementation and HTML element creation
    - Verify text segment handling for array inputs
3. `packages/ag-charts-community/src/chart/overlay/loadingSpinner.ts`
    - Verify default loading spinner implementation

### Examples to Test

#### 1. no-data-plain

**Documentation claims**: Basic overlay for missing data
**Expected behaviors**:

-   Chart should display default "No data to display" message when no data provided
-   Overlay should be centered in chart area
-   Should use default styling

**Delegation to example-tester**:

-   Verify chart renders without errors when data is empty
-   Check that overlay text matches expected default message
-   Validate no console errors
-   Confirm overlay DOM structure follows AG Charts patterns

#### 2. no-visible-series

**Documentation claims**: Message displayed when all series are hidden
**Expected behaviors**:

-   Chart should show overlay when series.visible is false for all series
-   Overlay should display default "No visible series" message
-   Overlay should disappear when a series is made visible

**Delegation to example-tester**:

-   Test with all series initially visible, then hide all
-   Verify overlay appears with correct message
-   Re-enable a series and verify overlay disappears
-   Check for smooth transitions

#### 3. loading

**Documentation claims**: Loading animation shown during asynchronous data loading
**Expected behaviors**:

-   Loading spinner should appear when using dataSource with async loading
-   Should show default loading animation with three animated bars
-   Should include loading text below spinner

**Delegation to example-tester**:

-   Verify loading overlay appears during async data fetch
-   Check animation is smooth and visible
-   Validate loading text is displayed
-   Confirm overlay disappears when data loads

#### 4. no-data

**Documentation claims**: Custom overlay renderer for missing data
**Expected behaviors**:

-   Custom renderer function should be called when no data
-   Should render HTML with emphasis and strong tags as shown
-   Renderer should return valid HTML string or element

**Delegation to example-tester**:

-   Verify custom renderer is invoked
-   Check rendered HTML matches expected structure
-   Validate custom styling is applied
-   Ensure no rendering errors

#### 5. loading-custom

**Documentation claims**: Custom loading spinner implementation
**Expected behaviors**:

-   Custom renderer should create DOM elements
-   Should include custom CSS animations via style element
-   Container and spinner elements should be properly structured

**Delegation to example-tester**:

-   Verify custom loading spinner renders correctly
-   Check CSS animations are applied
-   Validate DOM structure matches code
-   Test during actual async loading scenario

### User Interactions to Validate

1. Series visibility toggling to trigger no-visible-series overlay
2. Window resizing while overlays are displayed
3. Theme switching (light/dark) with overlays visible
4. Keyboard navigation/focus behavior with overlays present
5. Browser zoom levels with overlay content

### Visual States to Screenshot and Analyze

1. Default no-data overlay appearance
2. No-visible-series overlay when all series hidden
3. Loading overlay with animated spinner
4. Custom no-data overlay with HTML formatting
5. Custom loading spinner appearance
6. Dark theme overlay styling
7. Mobile viewport overlay scaling
8. Overlay positioning in different chart sizes

## Known Exceptions

No documented exceptions found in `technical-review-exceptions.md` for this page.

## Execution Plan

### Priority 1: API Contract Validation

1. **Verify TypeScript definitions** match documentation
    - Check all overlay properties in `AgChartOverlaysOptions`
    - Validate property types and optionality
    - Verify renderer function signature
2. **Check implementation defaults**
    - Confirm `enabled` defaults to true
    - Verify default message IDs and localization keys
    - Check dark theme class application

### Priority 2: Example Testing via example-tester

1. **Test each example in order**:

    - no-data-plain: Default behavior validation
    - no-visible-series: Series visibility interaction
    - loading: Async loading integration
    - no-data: Custom renderer functionality
    - loading-custom: Complex custom renderer

2. **For each example, provide to example-tester**:
    - Example path and expected behaviors
    - Specific DOM elements to validate
    - Animation/transition expectations
    - Console error checks

### Priority 3: Visual and Interactive Testing

1. **Screenshot capture plan**:

    - Capture each overlay type in default state
    - Test responsive behavior at different viewport sizes
    - Document dark theme variations
    - Capture animation frames for loading states

2. **Interactive testing**:
    - Toggle series visibility dynamically
    - Test overlay persistence during interactions
    - Verify overlay z-index and positioning
    - Check focus management with overlays

### Priority 4: Content Quality Assessment

1. **Documentation completeness**:

    - Check if `enabled` property should be documented
    - Verify all overlay types are covered
    - Ensure renderer params are fully explained

2. **Code example validation**:
    - Verify syntax in configuration examples
    - Check renderer function examples compile
    - Validate HTML string examples are valid

### Success Criteria

-   All TypeScript interfaces match documented API
-   All five examples render without errors
-   Overlays appear/disappear based on correct triggers
-   Custom renderers produce expected HTML output
-   No console errors during any interactions
-   Visual appearance matches documentation descriptions
-   Loading animations perform smoothly

### Estimated Complexity

-   API validation: Low complexity (straightforward interface checks)
-   Example testing: Medium complexity (requires async scenario setup)
-   Visual testing: Medium complexity (animation capture needed)
-   Interactive testing: Low complexity (basic state changes)

Total estimated time: 45-60 minutes for complete review
