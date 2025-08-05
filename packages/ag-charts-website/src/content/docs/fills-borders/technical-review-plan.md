# Technical Review Plan: Fills & Borders

## Page Analysis Summary

### Chart Features Covered

-   Fills and borders for chart elements (series labels, axis labels, legend, series area)
-   Padding configuration (single value and object with top/right/bottom/left)
-   Corner radius styling
-   Item styler callbacks for customizing individual labels
-   Gradient fills and patterns (referenced via links)

### Key APIs and Configuration Options

-   `seriesArea` - border, cornerRadius, padding properties
-   `legend` - position, fill, fillOpacity, border, padding properties
-   `label` - color, fill, fillOpacity, cornerRadius, padding, border, itemStyler properties
-   `AgChartLabelStylerParams` - type used for itemStyler callbacks
-   Gradient fill configuration with type, rotation, and colorStops

### Examples Referenced

-   **fills-borders**: Main example demonstrating all features on a bubble chart with:
    -   Series area border with corner radius
    -   Legend with border, fill, and padding
    -   Series labels with fills, borders, and padding
    -   Axis labels with fills and padding
    -   Item styler overriding labels for names starting with 'D' and 'E'

### Interactive Features Described

-   Visual styling features (static appearance)
-   Item styler dynamic styling based on data values
-   No explicit interactive behaviors mentioned (hover, click, etc.)

## Validation Targets

### TypeScript Interfaces to Verify

1. `AgSeriesAreaOptions` - Check border, cornerRadius, padding properties (exclude clip as per API reference)
2. `LabelBoxOptions` - Verify all label-related styling properties
3. `AgChartLegendOptions` - Check border, cornerRadius, padding, fill, fillOpacity properties
4. `AgGradientLegendOptions` - Check border, cornerRadius, padding, fill, fillOpacity properties
5. `AgChartLabelStylerParams` - Verify callback parameter structure

### Implementation Files to Check

1. Series area implementation:

    - `/packages/ag-charts-community/src/chart/seriesArea.ts`
    - Default values for border, cornerRadius, padding

2. Label styling implementation:

    - `/packages/ag-charts-community/src/chart/label.ts`
    - Label box styling properties and defaults

3. Legend implementation:

    - `/packages/ag-charts-community/src/chart/legend.ts`
    - Border, fill, padding properties and defaults

4. Gradient fill implementation:
    - `/packages/ag-charts-community/src/scene/fill.ts`
    - Gradient configuration structure

### Examples to Test with Expected Behaviors

#### fills-borders example

**Documentation claims:**

-   Border drawn around series area with corner radius and no padding
-   Legend has border, fill, corner radius, and padding (single number)
-   Series labels have border, fill, corner radius, and padding (object with top/right/bottom/left)
-   Axis labels have fill and padding
-   Item styler customizes labels for names starting with 'D' and 'E' with gradient fills

**Expected behaviors to validate:**

1. Series area should have visible border (#999, 3px width, 0.75 opacity) with 8px corner radius
2. Legend should be positioned top-right, floating, with:
    - Light gray fill (#999, 0.15 opacity)
    - Border (#999, 0.5 opacity)
    - 10px padding on all sides
3. Series labels should show:
    - Blue labels for male series (#badaff fill, #2c79d5 border)
    - Orange labels for female series (#fcc992 fill, #ea7e04 border)
    - Different padding values (top:4, right:6, bottom:0, left:6)
    - 4px corner radius
4. Axis labels should have:
    - Light gray fill (#999, 0.2 opacity)
    - 16px corner radius
    - Custom padding values
    - Formatted text (cm/kg suffixes)
5. Labels for names starting with 'D' should have:
    - Red border (#f00, 3px width)
    - Blue gradient fill (male) or orange gradient fill (female)
    - Bold white text
    - Larger padding
6. Labels for names starting with 'E' should have:
    - Black border (#000, 3px width)
    - Light gradient fills
    - Bold black text
    - Larger padding

**Visual states to screenshot:**

1. Default view showing all styling features
2. Close-up of series area border and corner radius
3. Close-up of legend styling
4. Close-up of styled labels (D and E names)
5. Close-up of axis labels with padding and corner radius

### User Interactions to Validate

1. Hover over data points to check if tooltips respect any fill/border styling
2. Hover over legend items to verify interaction doesn't break styling
3. Check responsive behavior when resizing window
4. Verify gradients render correctly at different zoom levels

### Code Snippets to Verify

1. Simple fill configuration:

    ```js
    label: {
        color: '#333',
        fill: '#badaff',
        fillOpacity: 0.8,
    }
    ```

2. Border configuration:

    ```js
    border: {
        enabled: true,
        stroke: '#2c79d5',
        strokeWidth: 1,
    }
    ```

3. Padding configurations (single value and object)
4. Item styler callback structure and return values

## Known Exceptions

No documented exceptions found for this page.

## Execution Plan

### Priority 1: API Contract Validation

1. Verify `AgSeriesAreaOptions` interface includes border, cornerRadius, padding
2. Check `LabelBoxOptions` for all label styling properties
3. Validate `AgChartLegendOptions` includes specified properties
4. Confirm `AgGradientLegendOptions` matches documented properties
5. Verify `AgChartLabelStylerParams` structure for itemStyler callbacks

### Priority 2: Example Visual Validation

1. Launch fills-borders example
2. Take comprehensive screenshots of all visual features
3. Verify series area border rendering
4. Check legend styling matches documentation
5. Validate label styling for both series
6. Confirm axis label styling
7. Verify item styler overrides for D and E names

### Priority 3: Implementation Verification

1. Check default values in implementation files
2. Verify gradient fill configuration structure
3. Confirm padding accepts both single value and object format
4. Validate border.enabled property behavior

### Priority 4: Interactive Testing

1. Test hover interactions don't break styling
2. Check responsive behavior
3. Verify zoom behavior with gradients
4. Test keyboard navigation (if applicable)

### Success Criteria

-   All TypeScript interfaces contain documented properties
-   Example renders all described visual features correctly
-   Code snippets are syntactically correct and functional
-   Item styler produces expected visual overrides
-   No console errors during example execution
-   Visual features remain stable during interactions

### Estimated Complexity

-   **High complexity** due to multiple styling systems (fills, borders, padding, gradients)
-   Multiple chart elements to validate (series area, legend, labels, axes)
-   Dynamic styling through itemStyler adds complexity
-   Gradient rendering validation required

## Delegation Plan for example-tester Agent

### Example: fills-borders

**Path:** `/packages/ag-charts-website/src/content/docs/fills-borders/_examples/fills-borders/`

**Documentation claims to validate:**

1. Series area has a border with:

    - Stroke color: #999
    - Stroke width: 3px
    - Stroke opacity: 0.75
    - Corner radius: 8px
    - No padding (padding: 0)

2. Legend configuration:

    - Positioned top-right with floating: true
    - Fill color: #999 with opacity 0.15
    - Border enabled with #999 stroke and 0.5 opacity
    - Padding: 10px (single value for all sides)

3. Series labels styling:

    - Male series: #badaff fill, #2c79d5 border
    - Female series: #fcc992 fill, #ea7e04 border
    - Corner radius: 4px
    - Padding object with different values per side

4. Item styler functionality:

    - Names starting with 'D': gradient fills, red border, bold white text
    - Names starting with 'E': gradient fills, black border, bold black text
    - Different gradients for male vs female series

5. Axis labels:
    - Fill: #999 with 0.2 opacity
    - Corner radius: 16px
    - Custom padding values
    - Formatters adding 'cm' and 'kg' suffixes

**Expected behaviors:**

-   Chart should render without console errors
-   All visual styling should be applied as documented
-   Gradients should render correctly
-   Item styler should only affect labels with names starting with 'D' or 'E'
-   TypeScript types should be properly used (AgChartLabelStylerParams)

**Specific features to test:**

-   Verify gradient configuration structure matches AG Charts API
-   Check that border.enabled: true is properly set
-   Validate padding object structure
-   Ensure itemStyler return values are valid
-   Confirm fill types (solid vs gradient) work correctly
