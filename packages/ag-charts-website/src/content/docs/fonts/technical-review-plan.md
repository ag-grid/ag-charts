# Technical Review Plan: Fonts Documentation

## Page Analysis Summary

### Chart Types/Features Covered

-   Font configuration options across all chart elements
-   Multi-style text elements using TextSegment arrays (title, subtitle, footnote)
-   Google Fonts integration with automatic loading
-   Extended font family syntax (string, GoogleFontFamily object, arrays)
-   Font theme parameters

### Key APIs and Configuration Options Documented

1. **Basic Font Options**:

    - `fontFamily` - CSS font family or extended syntax
    - `fontSize` - Numeric pixel size
    - `fontWeight` - 'normal', 'bold', 'bolder', 'lighter', or numeric
    - `fontStyle` - 'normal', 'italic', 'oblique'
    - `color` - CSS color for text

2. **TextSegment API**:

    - Used for multi-style text in title, subtitle, footnote
    - Array of objects with `text` property and font overrides
    - Inherits from FontOptions interface

3. **GoogleFontFamily Object**:

    - `{ googleFont: string }` syntax
    - Requires `loadGoogleFonts: true` or manual loading

4. **FontFamilyFull Type**:
    - Accepts string, GoogleFontFamily, or array of both

### Examples Referenced

1. **text-segments**: Demonstrates multi-style text using TextSegment arrays
2. **google-fonts**: Shows Google Fonts integration with loadGoogleFonts option

### Interactive Features Described

-   Font visual rendering across different elements
-   Google font loading behavior
-   Fallback font behavior
-   Text segment styling inheritance

## Validation Targets

### TypeScript Interfaces to Verify

1. **FontOptions** interface in `packages/ag-charts-types/src/series/cartesian/commonOptions.ts`

    - Verify all documented properties exist
    - Check property types match documentation

2. **TextSegment** interface in `packages/ag-charts-types/src/series/cartesian/commonOptions.ts`

    - Verify it extends FontOptions
    - Confirm text property is required

3. **Font-related type definitions** in `packages/ag-charts-types/src/chart/types.ts`:

    - FontStyle type values
    - FontWeight type values
    - FontFamily, FontFamilyFull types
    - GoogleFontFamily interface

4. **AgChartCaptionOptions** in `packages/ag-charts-types/src/chart/chartOptions.ts`

    - Verify text property accepts string | TextSegment[]
    - Check font properties availability

5. **loadGoogleFonts** option in `packages/ag-charts-types/src/chart/chartOptions.ts`
    - Verify type is boolean
    - Check default value documentation

### Implementation Files to Check

1. **Font rendering implementation**:

    - Check text rendering code for TextSegment support
    - Verify Google font loading mechanism
    - Confirm fallback behavior implementation

2. **Default values**:
    - Verify documented defaults match implementation
    - Check theme parameter defaults

### Examples to Test

#### text-segments Example

**Documentation Claims**:

-   Title, subtitle, and footnote support TextSegment arrays
-   Each segment can override font properties
-   Top-level font options apply to all segments unless overridden
-   Shows varied styling within single text elements

**Expected Behaviors for example-tester**:

-   Title should display "2025" in italic, " Financial Growth " at 26px, "Overview" in monospace with orange color
-   All title text inherits blue color (#1f77b4), 34px size, bold weight unless overridden
-   Subtitle shows two segments with different colors (green and red)
-   Footnote emphasizes "data is fictitious" with bold weight and larger size
-   Chart should render without console errors
-   Text rendering should be visually correct with proper spacing

**Configuration Patterns to Verify**:

-   TextSegment array structure
-   Property inheritance from parent caption options
-   Mixed font styles within single text element

#### google-fonts Example

**Documentation Claims**:

-   loadGoogleFonts: true enables automatic Google font loading
-   Title uses Pacifico Google font
-   Subtitle uses DM Serif Text with monospace fallback
-   Left axis uses local fonts (Helvetica, Arial, sans-serif)
-   Bottom axis uses Orbitron Google font

**Expected Behaviors for example-tester**:

-   Google fonts (Pacifico, DM Serif Text, Orbitron) should load and render
-   Local font fallback chain should work for left axis
-   Subtitle should fall back to monospace if DM Serif Text fails
-   No console errors about font loading
-   Visual verification that custom fonts are applied

**Configuration Patterns to Verify**:

-   GoogleFontFamily object syntax
-   Array syntax for font fallbacks
-   Mixed local and Google fonts
-   loadGoogleFonts option functionality

### User Interactions to Validate

1. **Visual Font Rendering**:

    - Screenshot default state showing all font variations
    - Verify font styles are visually distinct
    - Check text alignment and spacing

2. **Browser Font Fallbacks**:

    - Test behavior when Google fonts fail to load
    - Verify fallback chain works correctly

3. **Responsive Behavior**:
    - Test font rendering at different viewport sizes
    - Check text wrapping behavior with custom fonts

### Visual States to Screenshot

1. **text-segments example**:

    - Full chart showing multi-style title, subtitle, footnote
    - Close-up of title showing style variations
    - Verification of color inheritance

2. **google-fonts example**:
    - Full chart with all Google fonts loaded
    - Close-up of each text element with custom font
    - Axis labels showing different font families

## Known Exceptions

No technical-review-exceptions.md file exists for this page, so no known exceptions to consider.

## Execution Plan

### Priority 1: API Contract Validation

1. Verify FontOptions interface matches documentation
2. Confirm TextSegment interface structure and inheritance
3. Validate font-related type definitions (FontStyle, FontWeight, etc.)
4. Check AgChartCaptionOptions accepts TextSegment arrays
5. Verify loadGoogleFonts option type and documentation

### Priority 2: Example Testing via example-tester

1. **text-segments example**:

    - Delegate to example-tester with expectations for multi-style text rendering
    - Verify TextSegment array functionality
    - Check property inheritance behavior
    - Validate visual rendering of mixed styles

2. **google-fonts example**:
    - Delegate to example-tester with expectations for Google font loading
    - Verify loadGoogleFonts functionality
    - Check font fallback behavior
    - Validate mixed local/Google font usage

### Priority 3: Visual and Screenshot Analysis

1. Capture comprehensive screenshots of both examples
2. Verify fonts render as described in documentation
3. Check visual consistency of text styling
4. Test responsive behavior

### Priority 4: Implementation Verification

1. Check actual font loading mechanism for Google fonts
2. Verify TextSegment rendering implementation
3. Confirm default values in implementation code

### Priority 5: Documentation Completeness

1. Verify all font options are documented
2. Check for missing edge cases or limitations
3. Ensure examples cover main use cases

## Success Criteria

-   All TypeScript interfaces match documented APIs
-   Examples demonstrate all documented features correctly
-   Google fonts load and render properly with loadGoogleFonts option
-   TextSegment arrays work for title, subtitle, and footnote
-   Font fallback chains function as documented
-   No console errors in examples
-   Visual rendering matches documentation descriptions
