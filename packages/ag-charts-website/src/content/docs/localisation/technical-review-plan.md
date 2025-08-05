# Technical Review Plan: Localisation Documentation

## Page Analysis Summary

### Features Covered

-   Internationalization/localization system for AG Charts
-   Built-in locale support with 32 provided translations
-   Custom text value overrides
-   External framework integration (FormatJS, I18Next, React Intl, React I18Next)
-   Parameter interpolation and formatting in translations

### Key APIs and Configuration Options

-   `locale.localeText` - Object of key/value pairs for translations
-   `locale.getLocaleText` - Callback function for dynamic translation
-   `AG_CHARTS_LOCALE_*` exports from `ag-charts-locale` package
-   Parameter syntax: `${value}` with optional formatters `[number]`, `[percent]`, `[date]`, `[time]`, `[datetime]`
-   Framework-specific integration patterns

### Examples Referenced

1. **installing-locale**: Demonstrates basic locale installation using French locale
    - Shows zoom toolbar button tooltips
    - Shows context menu translations
    - Shows "no visible series" overlay translation
2. **custom-text-values**: Shows customizing individual translation keys
    - Overrides zoom toolbar tooltips
    - Overrides context menu options
    - Demonstrates spreading existing locale with overrides

### Interactive Features Described

-   Hover tooltips on zoom toolbar buttons
-   Right-click context menu with translated options
-   Legend interaction showing "no visible series" overlay
-   Parameter interpolation with formatting

## Validation Targets

### TypeScript Interfaces to Verify

-   `AgLocaleOptions` interface structure
-   `LocaleTextCallback` type definition
-   `LocaleValue` type and parameter handling
-   All `AG_CHARTS_LOCALE_*` export types from `ag-charts-locale`

### Implementation Files to Check

-   Core locale implementation in `packages/ag-charts-community/src/locale/`
-   Default English locale values
-   Locale text formatter implementation
-   Context menu locale integration
-   Zoom toolbar locale integration
-   Legend overlay locale integration
-   All locale files in `packages/ag-charts-locale/src/locales/`

### Examples to Test

#### installing-locale Example

**Documentation Claims:**

-   Uses French locale (`AG_CHARTS_LOCALE_FR_FR`)
-   Zoom toolbar buttons show French tooltips on hover
-   Right-click context menu shows French options
-   Legend click shows French "no visible series" overlay
-   Falls back to English for missing values

**Expected Behaviors for example-tester:**

-   Chart renders with line series
-   Zoom toolbar is visible and enabled
-   Context menu is enabled
-   Legend is visible
-   All UI text should be in French
-   No console errors

**Specific Features to Validate:**

-   Hover each zoom button (zoom in, zoom out, pan left/right/start/end, reset)
-   Right-click on chart area to open context menu
-   Click legend item to hide series and see overlay
-   Verify French text appears in all cases

#### custom-text-values Example

**Documentation Claims:**

-   Customizes specific English translation keys
-   Uses spread operator to extend `AG_CHARTS_LOCALE_EN_US`
-   Overrides zoom toolbar and context menu translations
-   Shows custom English text instead of default

**Expected Behaviors for example-tester:**

-   Chart renders with same configuration as first example
-   Custom English text appears in tooltips and menus
-   Demonstrates proper override syntax

**Specific Features to Validate:**

-   Hover zoom buttons to see custom tooltips
-   Right-click to see custom context menu text
-   Verify exact custom text matches configuration

### User Interactions to Validate

1. **Zoom Toolbar Interactions:**

    - Hover over each button (7 buttons total)
    - Verify tooltip text matches locale
    - Test keyboard navigation to buttons
    - Verify tooltips position correctly

2. **Context Menu Interactions:**

    - Right-click on chart area
    - Right-click on different chart elements
    - Verify menu items are translated
    - Test keyboard navigation in menu
    - Test menu dismissal (Escape, click outside)

3. **Legend Interactions:**

    - Click legend items to toggle series
    - Verify "no visible series" overlay text
    - Test with multiple series if applicable

4. **Edge Cases:**
    - Rapid hover between buttons
    - Context menu at chart edges
    - Window resize with tooltips open
    - Multiple overlapping UI elements

### Visual States to Screenshot

1. Default chart state
2. Each zoom button tooltip (7 screenshots)
3. Context menu open
4. "No visible series" overlay
5. Mobile viewport behavior
6. Keyboard focus states

## Known Exceptions

No existing technical-review-exceptions.md file found for this page.

## Execution Plan

### Priority 1: API Contract Validation

1. Verify `AgLocaleOptions` interface matches documentation
2. Check all 32 locale exports exist in `ag-charts-locale`
3. Validate parameter interpolation syntax implementation
4. Verify formatter types and behavior

### Priority 2: Locale Implementation Testing

1. Test default English locale values
2. Verify French locale example with example-tester
3. Test custom overrides example with example-tester
4. Validate fallback behavior for missing keys

### Priority 3: Interactive Feature Validation

1. Test all zoom toolbar tooltips
2. Test context menu translations
3. Test legend overlay translations
4. Verify keyboard accessibility

### Priority 4: Framework Integration

1. Review FormatJS integration example
2. Review I18Next integration example
3. Review React-specific integration examples
4. Verify `getLocaleText` callback behavior

### Priority 5: Edge Cases and Error Handling

1. Test missing translation keys
2. Test invalid formatter syntax
3. Test parameter interpolation edge cases
4. Test concurrent locale changes

## example-tester Delegation Plan

### Example 1: installing-locale

**Task:** Validate French locale installation and all interactive translations

**Instructions for Agent:**

-   Navigate to the example
-   Verify chart renders with French locale
-   Test zoom toolbar tooltips (all 7 buttons)
-   Test right-click context menu
-   Test legend click for "no visible series" overlay
-   Check for console errors
-   Verify all text is in French
-   Test keyboard navigation

**Expected Results:**

-   All UI text in French
-   Proper tooltip positioning
-   Context menu functionality
-   Legend interaction works
-   No console errors

### Example 2: custom-text-values

**Task:** Validate custom text overrides for English locale

**Instructions for Agent:**

-   Navigate to the example
-   Verify custom English text in zoom tooltips
-   Verify custom context menu text
-   Compare actual text with configured overrides
-   Test all interactive elements
-   Check for console errors

**Expected Results:**

-   Custom English text appears exactly as configured
-   All overrides work properly
-   Base locale still functions for non-overridden keys
-   No console errors

## Success Criteria

1. All documented locale exports are available and correctly typed
2. Both examples render without errors
3. All interactive translations work as documented
4. Parameter interpolation and formatting work correctly
5. Framework integration examples are accurate
6. Fallback behavior works for missing keys
7. No undocumented limitations or issues
