# Series Highlighting Technical Review Plan

## Page Analysis Summary

### Features Covered

-   Series and item highlighting on hover
-   Bring to front functionality for overlapping series
-   Customization of highlight styles for:
    -   Highlighted items within a series
    -   Unhighlighted items within the highlighted series
    -   The highlighted series itself
    -   Unhighlighted series when another series is highlighted

### Key APIs and Configuration Options Documented

-   `highlight` configuration object with properties:
    -   `bringToFront` - Boolean to render highlighted series above others
    -   `highlightedItem` - Style options for the actively hovered item
    -   `unhighlightedItem` - Style options for non-hovered items in the highlighted series
    -   `highlightedSeries` - Style options for the entire highlighted series
    -   `unhighlightedSeries` - Style options for non-highlighted series
-   Style properties include: `fill`, `stroke`, `strokeWidth`, `opacity`
-   Theme-based configuration using `theme.overrides` for applying highlight settings

### Examples Referenced and Their Purposes

1. **"lines" example** - Demonstrates series highlighting with multiple overlapping line series

    - Shows custom highlight configuration via theme overrides
    - Demonstrates series dimming with opacity
    - Shows strokeWidth changes on highlight

2. **"bring-to-front" example** - Shows the bringToFront feature with area series

    - Demonstrates how overlapping series can be brought forward on hover
    - Uses direct series configuration rather than theme

3. **"basic-column" example** - Demonstrates custom highlight styling
    - Shows all four highlight configuration options
    - Demonstrates item-level and series-level styling
    - Actually uses area series (not column series as title suggests)

### Interactive Features Described

-   Hovering over chart markers highlights the marker and its containing series
-   Hovering over legend items highlights the corresponding series
-   Other series are dimmed when one series is highlighted
-   Highlighted series can be brought to the front of other series

## Validation Targets

### TypeScript Interfaces to Verify

-   `AgHighlightOptions` and `AgMultiSeriesHighlightOptions` in `/packages/ag-charts-types/src/series/seriesOptions.ts`
-   `AgHighlightStyleOptions` and `AgBaseHighlightStyleOptions` for style properties
-   Series-specific highlight options in individual series option files (line, area, etc.)
-   Verify that `bringToFront` is a property of the highlight configuration

### Implementation Files to Check

-   `/packages/ag-charts-community/src/chart/interaction/highlightManager.ts` - Core highlight management
-   `/packages/ag-charts-community/src/chart/series/seriesProperties.ts` - Series highlight property definitions
-   Individual series implementations (lineSeries.ts, areaSeries.ts, etc.) for highlight behavior
-   Theme override implementation for highlight options

### Examples to Test with Expected Behaviors

#### "lines" Example Testing Requirements for example-tester

**Documentation claims:**

-   The hovered marker is highlighted
-   The series containing the hovered item is highlighted with strokeWidth: 4
-   All other series are dimmed with opacity: 0.2
-   Custom configuration is applied via theme overrides

**Expected behaviors to validate:**

-   Chart renders 16 line series with different colors
-   Hovering over any marker shows visual highlighting
-   The hovered series line becomes thicker (strokeWidth: 4)
-   Non-hovered series become semi-transparent (opacity: 0.2)
-   Theme override structure correctly applies highlight configuration
-   Legend hover also triggers series highlighting

**Visual validation:**

-   Capture screenshots showing hover states on different markers
-   Verify opacity changes are visible
-   Confirm strokeWidth changes are applied

#### "bring-to-front" Example Testing Requirements for example-tester

**Documentation claims:**

-   Hovering any series in chart or legend renders it above all other series
-   The `bringToFront` property is set to true in highlight options

**Expected behaviors to validate:**

-   Chart renders 3 overlapping area series
-   Hovering over a series brings it visually to the front
-   Legend hover also triggers bring-to-front behavior
-   Series z-order changes dynamically on hover
-   Configuration uses direct series highlight property (not theme)

**Visual validation:**

-   Screenshot overlapping areas before hover
-   Screenshot showing hovered series rendered on top
-   Test hovering different series to verify z-order changes

#### "basic-column" Example Testing Requirements for example-tester

**Documentation claims:**

-   Title says "Column Series" but code shows area series
-   Demonstrates all four highlight configuration options
-   Highlighted item: yellow fill, gold stroke, strokeWidth 2
-   Unhighlighted items in series: maroon fill, no stroke
-   Highlighted series: red fill, maroon stroke, strokeWidth 2
-   Unhighlighted series: opacity 0.2

**Expected behaviors to validate:**

-   Chart renders stacked area series (NOT column series)
-   Marker hover shows yellow fill with gold stroke
-   Other markers in same series show maroon fill with no stroke
-   The area fill and line show red/maroon colors when highlighted
-   Other series become semi-transparent
-   All custom styles are applied correctly

**Visual validation:**

-   Screenshot showing all custom highlight styles
-   Verify color changes match documentation
-   Confirm opacity and stroke changes

### User Interactions to Validate

1. **Marker hover interactions**

    - Hover over individual data point markers
    - Verify tooltip appears
    - Check highlight styles are applied
    - Test rapid hovering between markers

2. **Legend hover interactions**

    - Hover over legend items
    - Verify series highlighting matches marker hover
    - Check bring-to-front behavior

3. **Empty space interactions**

    - Hover over chart background
    - Verify highlights are cleared
    - Check series return to normal state

4. **Edge cases**
    - Window resize during hover
    - Rapid mouse movement across series
    - Keyboard navigation (if supported)

## Known Exceptions

No existing `technical-review-exceptions.md` file found for this page.

## Execution Plan

### Priority 1: Critical Accuracy Checks

1. **Verify highlight API structure** matches TypeScript definitions

    - Check if `highlight` property exists on series options
    - Verify all four sub-properties are available
    - Confirm `bringToFront` is part of highlight options

2. **Check default behavior claim**

    - Documentation states "By default, only item highlighting is activated"
    - Verify what the actual default configuration is
    - Test with minimal configuration to confirm defaults

3. **Validate example-documentation mismatch**
    - "basic-column" example title vs actual area series implementation
    - Determine if this is a naming error or wrong example

### Priority 2: Example Functionality Testing

1. **Delegate to example-tester for each example**

    - Provide detailed expectations from documentation
    - Include visual behavior requirements
    - Request console error checking

2. **Visual screenshot validation**

    - Default states for all examples
    - Hover states showing highlight effects
    - Before/after for bring-to-front feature
    - Mobile viewport testing

3. **Interactive behavior testing**
    - Systematic hover testing across chart elements
    - Legend interaction validation
    - Edge case scenarios

### Priority 3: Configuration Pattern Validation

1. **Theme override pattern**

    - Verify theme.overrides structure works correctly
    - Check if highlight config can be applied to specific series types

2. **Direct series configuration**

    - Confirm highlight can be configured per series
    - Test mixing theme and direct configuration

3. **Style property validation**
    - Test all documented style properties work
    - Check for undocumented properties in implementation

### Estimated Complexity

-   **High complexity** due to:
    -   Multiple configuration patterns (theme vs direct)
    -   Visual validation requirements
    -   Interactive behavior testing
    -   Cross-reference with implementation code

### Success Criteria

1. All documented APIs exist and work as described
2. Examples demonstrate the features they claim to show
3. Interactive behaviors match documentation
4. No console errors during normal usage
5. Visual highlighting is clearly visible and matches descriptions
6. Default behavior matches documentation claims
