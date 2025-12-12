# Sunburst Series Documentation - Technical Review Plan

## Documentation Page

**Path**: `/Users/bls/git/ag-charts.worktrees/review-docs-13/packages/ag-charts-website/src/content/docs/sunburst-series/index.mdoc`

## TypeScript Definition Files to Verify

1. `/Users/bls/git/ag-charts.worktrees/review-docs-13/packages/ag-charts-types/src/series/standalone/sunburstOptions.ts`

    - Primary interface: `AgSunburstSeriesOptions`
    - Includes: `AgSunburstSeriesThemeableOptions`, `AgSunburstSeriesOptionsKeys`, `AgSunburstSeriesOptionsNames`
    - Highlight options: `AgSunburstSeriesHighlightOptions`, `AgSunburstSeriesHighlightStyle`
    - Tooltip and formatter interfaces

2. `/Users/bls/git/ag-charts.worktrees/review-docs-13/packages/ag-charts-types/src/chart/gradientLegendOptions.ts`
    - Primary interface: `AgGradientLegendOptions`
    - Includes: `AgGradientLegendBarOptions`, `AgGradientLegendScaleOptions`, `AgGradientLegendLabelOptions`

## Implementation Files to Cross-Check

1. `/Users/bls/git/ag-charts.worktrees/review-docs-13/packages/ag-charts-enterprise/src/series/sunburst/sunburstSeries.ts`

    - Main series implementation

2. `/Users/bls/git/ag-charts.worktrees/review-docs-13/packages/ag-charts-enterprise/src/series/sunburst/sunburstSeriesProperties.ts`
    - Property decorators and default values:
        - `fillOpacity: number = 1` (line 55)
        - `strokeWidth: number = 0` (line 58)
        - `strokeOpacity: number = 1` (line 61)
        - `cornerRadius: number = 0` (line 64)

## Module Files for Theme Template Defaults

1. `/Users/bls/git/ag-charts.worktrees/review-docs-13/packages/ag-charts-enterprise/src/series/sunburst/sunburstModule.ts`
    - Theme template with runtime defaults:
        - `fills`: Uses palette cycle
        - `strokes`: Uses palette cycle
        - `colorRange`: Uses divergingColors palette
        - `strokeWidth`: Conditional based on user options (line 31)
        - `label.enabled: true` (line 34)
        - `label.fontSize`: LARGE ratio (line 36)
        - `label.minimumFontSize: 9/BASE_FONT_SIZE` (line 37)
        - `label.color`: chartBackgroundColor reference (line 39)
        - `label.spacing: 2` (line 42)
        - `secondaryLabel.enabled: true` (line 46)
        - `secondaryLabel.fontSize`: SMALLEST ratio (line 48)
        - `secondaryLabel.minimumFontSize: 7/BASE_FONT_SIZE` (line 49)
        - `sectorSpacing: 2` (line 55)
        - `padding: 3` (line 56)
        - `highlight.unhighlightedItem.fillOpacity: 0.6` (line 59)
        - `highlight.unhighlightedItem.strokeOpacity: 0.6` (line 60)
        - `highlight.unhighlightedBranch.fillOpacity: 0.2` (line 63)
        - `highlight.unhighlightedBranch.strokeOpacity: 0.2` (line 64)
        - `gradientLegend.enabled`: Conditional based on colorKey (line 69)

## Examples to Test

### 1. org-chart

-   **Path**: `/Users/bls/git/ag-charts.worktrees/review-docs-13/packages/ag-charts-website/src/content/docs/sunburst-series/_examples/org-chart/`
-   **Purpose**: Simple Sunburst - demonstrates basic organizational chart
-   **Key Configs**: `type: 'sunburst'`, `labelKey: 'name'`
-   **Expected**: Hierarchical data display with sectors

### 2. sizing

-   **Path**: `/Users/bls/git/ag-charts.worktrees/review-docs-13/packages/ag-charts-website/src/content/docs/sunburst-series/_examples/sizing/`
-   **Purpose**: Custom Sizing - demonstrates sizeKey and sizeName
-   **Key Configs**: `labelKey`, `sizeKey: 'gdp'`, `sizeName: 'GDP'`
-   **Expected**: Sectors sized proportionally by GDP values

### 3. color-scale

-   **Path**: `/Users/bls/git/ag-charts.worktrees/review-docs-13/packages/ag-charts-website/src/content/docs/sunburst-series/_examples/color-scale/`
-   **Purpose**: Colour Scale - demonstrates colorKey and colorRange
-   **Key Configs**: `colorKey: 'gdpChange'`, `colorName: 'Change'`, `colorRange: ['#FF9800', '#8BC34A']`
-   **Expected**: Sectors colored by gdpChange using scale

### 4. other-colors

-   **Path**: `/Users/bls/git/ag-charts.worktrees/review-docs-13/packages/ag-charts-website/src/content/docs/sunburst-series/_examples/other-colors/`
-   **Purpose**: Other Colours - demonstrates fills and strokes arrays
-   **Key Configs**: `fills: ['#D32F2F', '#FF5722', '#283593']`
-   **Expected**: Sectors colored by root node index

### 5. labels

-   **Path**: `/Users/bls/git/ag-charts.worktrees/review-docs-13/packages/ag-charts-website/src/content/docs/sunburst-series/_examples/labels/`
-   **Purpose**: Labels - demonstrates label configuration and secondary labels
-   **Key Configs**: `labelKey`, `secondaryLabelKey`, `label.fontSize: 14`, `label.minimumFontSize: 9`, `label.spacing: 2`, `padding: 3`
-   **Expected**: Dual labels with auto-sizing

### 6. gradient-legend

-   **Path**: `/Users/bls/git/ag-charts.worktrees/review-docs-13/packages/ag-charts-website/src/content/docs/sunburst-series/_examples/gradient-legend/`
-   **Purpose**: Gradient Legend - demonstrates default gradient legend
-   **Key Configs**: `colorKey: 'gdpChange'`, `gradientLegend.enabled: true`
-   **Expected**: Gradient legend displayed with color scale

### 7. gradient-legend-position

-   **Path**: `/Users/bls/git/ag-charts.worktrees/review-docs-13/packages/ag-charts-website/src/content/docs/sunburst-series/_examples/gradient-legend-position/`
-   **Purpose**: Gradient Legend Position - demonstrates position and reverseOrder
-   **Key Configs**: `gradientLegend.position: 'right'`, `reverseOrder`
-   **Expected**: Legend positioned on right side

### 8. gradient-legend-size

-   **Path**: `/Users/bls/git/ag-charts.worktrees/review-docs-13/packages/ag-charts-website/src/content/docs/sunburst-series/_examples/gradient-legend-size/`
-   **Purpose**: Gradient Legend Size - demonstrates thickness and preferredLength
-   **Key Configs**: `gradientLegend.gradient.thickness: 50`, `gradientLegend.gradient.preferredLength: 400`
-   **Expected**: Customized gradient bar dimensions

### 9. gradient-legend-labels

-   **Path**: `/Users/bls/git/ag-charts.worktrees/review-docs-13/packages/ag-charts-website/src/content/docs/sunburst-series/_examples/gradient-legend-labels/`
-   **Purpose**: Gradient Legend Labels - demonstrates scale label customization
-   **Key Configs**: `gradientLegend.scale.label` (fontSize, fontStyle, fontWeight, fontFamily, color), `gradientLegend.scale.padding: 20`
-   **Expected**: Styled scale labels

### 10. highlight

-   **Path**: `/Users/bls/git/ag-charts.worktrees/review-docs-13/packages/ag-charts-website/src/content/docs/sunburst-series/_examples/highlight/`
-   **Purpose**: Highlighting - demonstrates highlight states
-   **Key Configs**: `highlight.highlightedItem.stroke: 'green'`, `highlight.highlightedBranch.strokeWidth: 2`, `highlight.unhighlightedItem.opacity: 0.5`, `highlight.unhighlightedBranch.opacity: 0.1`
-   **Expected**: Different visual states on hover

## Interactive Features to Test

1. **Sector hover interaction**: Verify highlighting behavior matches documentation
2. **Tooltip display**: Check tooltip content for labelKey, sizeKey, colorKey values
3. **Gradient legend interaction**: Verify legend displays correctly with colorKey
4. **Label auto-sizing**: Verify labels shrink to minimumFontSize when needed
5. **Branch highlighting**: Verify all segments in branch get highlighted styles

## Visual States to Capture

1. **Default state**: Simple sunburst with basic configuration
2. **With sizing**: Sectors with different sizes based on sizeKey
3. **With color scale**: Gradient coloring based on colorKey and colorRange
4. **With fills array**: Custom color palette
5. **With labels**: Primary and secondary labels
6. **Gradient legend positions**: Bottom (default), right
7. **Hover state**: All highlight states (highlightedItem, highlightedBranch, unhighlightedItem, unhighlightedBranch)

## Key Properties to Validate

### Sunburst Series Properties

-   `type: 'sunburst'` (required)
-   `labelKey` (optional string)
-   `secondaryLabelKey` (optional string)
-   `childrenKey` (optional string, defaults to 'children')
-   `sizeKey` (optional string)
-   `colorKey` (optional string)
-   `sizeName` (optional string)
-   `colorName` (optional string)
-   `fills` (optional array)
-   `strokes` (optional array)
-   `fillOpacity` (optional number)
-   `strokeWidth` (optional number)
-   `strokeOpacity` (optional number)
-   `colorRange` (optional array)
-   `cornerRadius` (optional number)
-   `sectorSpacing` (optional number)
-   `padding` (optional number)
-   `label` (optional object with fontSize, minimumFontSize, spacing, formatter)
-   `secondaryLabel` (optional object)
-   `highlight` (optional object with highlightedItem, highlightedBranch, unhighlightedItem, unhighlightedBranch)

### Gradient Legend Properties

-   `enabled` (optional boolean)
-   `position` (optional: 'top' | 'right' | 'bottom' | 'left')
-   `reverseOrder` (optional boolean)
-   `gradient.thickness` (optional number)
-   `gradient.preferredLength` (optional number)
-   `scale.label` (optional object with font properties)
-   `scale.padding` (optional number)

## Default Values to Verify

Priority: Check theme template first, then @Property decorators

### From sunburstModule.ts (Theme Template - Runtime Defaults):

-   `label.enabled: true`
-   `label.spacing: 2`
-   `secondaryLabel.enabled: true`
-   `sectorSpacing: 2`
-   `padding: 3`
-   `highlight.unhighlightedItem.fillOpacity: 0.6`
-   `highlight.unhighlightedItem.strokeOpacity: 0.6`
-   `highlight.unhighlightedBranch.fillOpacity: 0.2`
-   `highlight.unhighlightedBranch.strokeOpacity: 0.2`
-   `gradientLegend.enabled`: Conditional (true if colorKey exists)

### From sunburstSeriesProperties.ts (@Property Decorators - Fallback Defaults):

-   `fillOpacity: 1`
-   `strokeWidth: 0`
-   `strokeOpacity: 1`
-   `cornerRadius: 0`

### From gradientLegendOptions.ts (TypeScript Comments):

-   `position: 'bottom'` (line 40)
-   `spacing: 20` (line 49)

## Common Pitfalls to Check

1. **Default values**: Verify against theme template first (sunburstModule.ts), not just @Property decorators
2. **Gradient legend enablement**: Should be enabled by default when colorKey is present
3. **Label auto-sizing**: minimumFontSize should allow shrinking below fontSize
4. **Highlight states**: Four distinct states should work independently
5. **Color precedence**: colorRange should override fills/strokes arrays
6. **Object configuration enablement**: Setting label properties implies enabled: true

## Known Exceptions

No exceptions file found at `/Users/bls/git/ag-charts.worktrees/review-docs-13/packages/ag-charts-website/src/content/docs/sunburst-series/technical-review-exceptions.md`
