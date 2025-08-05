# Technical Review Plan: Themes Documentation

## Page Analysis Summary

### Chart Types/Features Covered

-   Stock theme system with 10 built-in themes (`ag-default`, `ag-default-dark`, `ag-sheets`, `ag-sheets-dark`, `ag-polychroma`, `ag-polychroma-dark`, `ag-vivid`, `ag-vivid-dark`, `ag-material`, `ag-material-dark`)
-   Custom theme creation with:
    -   Base theme inheritance
    -   Palette customization (fills and strokes)
    -   Theme parameters for global styling
    -   Series-specific overrides
-   Financial chart themes (`ag-financial`, `ag-financial-dark`)
-   Figma Design System integration

### Key APIs and Configuration Options Documented

1. **Theme Configuration**:

    - `theme` property accepting `AgChartThemeName` or custom theme object
    - `baseTheme` for inheritance
    - `palette` with `fills` and `strokes` arrays
    - `params` object for global styling
    - `overrides` object for chart-specific customization

2. **Theme Parameters**:

    - Typography: `fontFamily`, `fontSize`
    - Colors: `foregroundColor`, `backgroundColor`, `accentColor`
    - Chrome elements: `tooltipBackgroundColor`, `tooltipTextColor`, `chromeBackgroundColor`, `chromeTextColor`

3. **Override Structure**:
    - `overrides.common` for all chart types
    - Series-specific overrides (e.g., `overrides.bar`, `overrides.line`, `overrides.pie`)
    - Nested series configuration (e.g., `overrides.bar.series.label`)
    - Axes configuration by type (e.g., `overrides.common.axes.category`, `overrides.common.axes.number`)

### Examples Referenced

1. **stock-themes**: Demonstrates switching between all 10 stock themes
2. **palettes**: Shows custom palette configuration with fills and strokes
3. **theme-parameters**: Illustrates global styling via params (colors, fonts, tooltips)
4. **custom-theme**: Basic custom theme with palette and simple overrides
5. **advanced-theme**: Complex theme with params, common overrides, and series-specific customizations

### Interactive Features Described

-   Theme switching (buttons to change themes dynamically)
-   Tooltip styling customization
-   Visual theming effects across different chart types
-   Responsive padding and layout adjustments

## Validation Targets

### TypeScript Interfaces to Verify

1. **Primary Types** (from `packages/ag-charts-types/src/chart/themeOptions.ts`):

    - `AgChartThemeName` - Verify all 12 theme names listed
    - `AgChartTheme` interface with properties:
        - `baseTheme?: AgChartThemeName`
        - `palette?: AgChartThemePalette`
        - `params?: AgChartThemeParams`
        - `overrides?: AgThemeOverrides`
    - `AgChartThemePalette` with `fills`, `strokes`, `up`, `down`, `neutral`
    - `AgThemeOverrides` with all series type overrides

2. **Theme Parameters** (from `packages/ag-charts-types/src/chart/themeParamsOptions.ts`):
    - Verify all documented params exist in `AgChartThemeParams`
    - Check for additional undocumented params that should be mentioned

### Implementation Files to Check

1. **Theme Registry**:

    - Check theme registration and availability in `packages/ag-charts-community/src/chart/themes/`
    - Verify financial themes in enterprise package
    - Confirm default theme behavior

2. **Theme Application**:

    - Verify theme merging logic handles inheritance correctly
    - Check override application order (base → custom → chart options)
    - Validate params application to chart elements

3. **Series-Specific Implementations**:
    - Bar series label defaults with themes
    - Line series marker shape overrides
    - Pie series legend positioning and callout configuration

### Examples to Test

#### 1. stock-themes

**Documentation Claims**:

-   Shows all 10 stock themes
-   Buttons switch themes dynamically
-   Default theme is 'ag-default'

**Expected Behaviors for example-tester**:

-   All 10 theme buttons present and functional
-   Visual changes when switching themes (colors, fonts, backgrounds)
-   Chart renders correctly with each theme
-   No console errors during theme switching

#### 2. palettes

**Documentation Claims**:

-   Custom palette with 5 fills and 5 strokes
-   Colors repeat if more data than palette colors

**Expected Behaviors for example-tester**:

-   Custom colors applied to chart series
-   Stroke colors match the defined palette
-   Color cycling works for datasets larger than palette

#### 3. theme-parameters

**Documentation Claims**:

-   Google Font integration (`DM Serif Text`)
-   Custom colors for foreground, background, accent
-   Tooltip styling with custom colors
-   Font size of 14px applied globally

**Expected Behaviors for example-tester**:

-   Google Font loaded and applied
-   Background color `#fff1e5` visible
-   Tooltips styled with `#fff7ef` background and `#262a33` text
-   Consistent font sizing across chart elements

#### 4. custom-theme

**Documentation Claims**:

-   Custom palette with 6 fills, single black stroke
-   Title font size increased to 24px
-   Bar series labels enabled with black color
-   Bar series stroke width of 1

**Expected Behaviors for example-tester**:

-   Title visibly larger than default
-   Bar series shows data labels in black
-   Bar series has visible stroke outline
-   Custom palette colors applied

#### 5. advanced-theme

**Documentation Claims**:

-   Comprehensive theming example
-   Custom padding (left: 70, right: 70)
-   Different axis line widths (category: 4, number: 2)
-   Line series circular markers
-   Bar series white labels
-   Pie series with left legend, callout labels, red callout lines

**Expected Behaviors for example-tester**:

-   Increased chart padding visible
-   Axis lines with different widths
-   Line chart markers are circles
-   Bar chart labels in white color
-   Pie chart legend on left side
-   Pie chart callout labels visible with red lines

### User Interactions to Validate

1. **Theme Switching**:

    - Click each theme button in stock-themes example
    - Verify smooth transitions
    - Check theme persistence across interactions

2. **Tooltip Interactions**:

    - Hover over data points in themed charts
    - Verify tooltip styling matches theme params
    - Check tooltip positioning and visibility

3. **Legend Interactions**:

    - Click legend items in themed charts
    - Verify series toggle behavior
    - Check legend positioning in pie chart example

4. **Responsive Behavior**:
    - Resize browser window with themed charts
    - Verify padding and layout adjustments
    - Check font scaling behavior

### Visual States to Screenshot

1. **Per Example**:

    - Default state for each example
    - Each stock theme variant in stock-themes example
    - Tooltip visible state showing custom styling
    - Hover states on different chart elements

2. **Interactive States**:
    - Before/after theme switching
    - Legend item clicked/unclicked states
    - Different viewport sizes (desktop, tablet, mobile)

## Known Exceptions

No documented exceptions file exists for this page.

## Execution Plan

### Priority 1 - Critical API Validation

1. Verify `AgChartThemeName` type includes all 12 documented themes
2. Validate theme object structure matches documentation
3. Check financial theme availability and restrictions
4. Test default theme behavior without explicit configuration

### Priority 2 - Example Functionality Testing

1. **stock-themes**: Test all 10 theme switches with example-tester
2. **palettes**: Validate custom colors and cycling behavior
3. **theme-parameters**: Verify all params apply correctly
4. **custom-theme**: Check basic override functionality
5. **advanced-theme**: Validate complex override combinations

### Priority 3 - Visual and Interaction Testing

1. Screenshot all theme variants in stock-themes
2. Capture tooltip styling in theme-parameters
3. Test and screenshot responsive behaviors
4. Validate interactive elements (buttons, legends, tooltips)

### Priority 4 - Documentation Completeness

1. Cross-reference all theme params with TypeScript definitions
2. Identify any undocumented theme features
3. Verify Figma Design System claims and links
4. Check for consistency in terminology and examples

### Success Criteria

-   All TypeScript interfaces match documented properties
-   All examples render without console errors
-   Theme switching works smoothly
-   Custom themes properly override base themes
-   Visual styling matches documented descriptions
-   Interactive features work as described
-   No regression in theme application logic

### Estimated Complexity

-   **High Complexity**: Advanced theme example with multiple override types
-   **Medium Complexity**: Theme parameter validation, stock theme testing
-   **Low Complexity**: Basic palette customization, simple overrides

## Delegation Plan for example-tester Agent

### stock-themes Example

**Task**: Validate all 10 stock themes work correctly
**Expectations**:

-   10 theme buttons present: ag-default, ag-default-dark, ag-sheets, ag-sheets-dark, ag-polychroma, ag-polychroma-dark, ag-vivid, ag-vivid-dark, ag-material, ag-material-dark
-   Clicking each button changes the chart appearance
-   Each theme has distinct visual characteristics (colors, fonts, backgrounds)
-   No console errors during theme switching
-   Chart data remains consistent across theme changes

### palettes Example

**Task**: Verify custom palette application
**Expectations**:

-   Chart uses custom fill colors: #006f9b, #ff7faa, #00994d, #ff8833, #00a0dd
-   Chart uses custom stroke colors: #003f58, #934962, #004a25, #914d1d, #006288
-   If more than 5 data series, colors should cycle and repeat
-   Both fills and strokes from custom palette are visible

### theme-parameters Example

**Task**: Validate global theme parameters
**Expectations**:

-   Google Font "DM Serif Text" is loaded and applied to text
-   Background color is #fff1e5 (light beige)
-   Foreground text color is #262a33 (dark gray)
-   Accent color #0d7680 is used for interactive elements
-   Font size is consistently 14px (except titles)
-   Tooltips have #fff7ef background and #262a33 text color

### custom-theme Example

**Task**: Check basic theme overrides
**Expectations**:

-   Custom palette colors visible: #5C2983, #0076C5, #21B372, #FDDE02, #F76700, #D30018
-   All series use black strokes
-   Chart title font size is 24px (larger than default)
-   Bar series shows data labels in black color
-   Bar series has strokeWidth of 1 (visible outline)

### advanced-theme Example

**Task**: Validate comprehensive theme customization
**Expectations**:

-   Chart has 70px padding on left and right sides
-   Category axis line width is 4px (thicker)
-   Number axis line width is 2px (thinner than category)
-   Line series markers are circular shape
-   Bar series labels are white color and enabled
-   Pie chart legend positioned on left side
-   Pie chart has callout labels enabled
-   Pie chart callout lines are red color (#881008)
-   Font family is "Georgia, serif"
-   Overall styling uses the defined color scheme
