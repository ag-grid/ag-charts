# Spruce Up Gallery Example

You are tasked with improving the visual appeal of an AG Charts gallery example to better showcase our feature set while maintaining readability and visual consistency.

**Context**: AG Charts offers extensive styling, interaction, and data presentation capabilities across both Community (MIT) and Enterprise (commercial) versions. The goal is to demonstrate these capabilities through polished, production-ready gallery examples that users would be proud to implement.

**Target Audience**: Our primary audience consists of enterprise and finance customers who value professional, business-oriented visualizations that convey trust, reliability, and sophistication.

**Usage**: Specify the example path relative to the repository root (e.g., `packages/ag-charts-website/src/content/gallery/_examples/simple-bar`). The command will analyze the current example and propose specific enhancements based on the chart type and data context.

## 🚨 MANDATORY DARK MODE RULES - ENFORCE WITHOUT EXCEPTION

1. **REMOVE ALL COLOR PROPERTIES** - Delete every `color:`, `fill:`, `stroke:`, `backgroundColor:`
2. **NO HEX CODES** - Never use `#ffffff`, `#333333`, etc.
3. **NO RGB/RGBA** - Never use `rgb()`, `rgba()`, `hsl()`, etc.
4. **NO COLOR NAMES** - Never use `'white'`, `'black'`, `'blue'`, etc. in color properties
5. **THEME PALETTES ONLY** - Colors must come from the theme's built-in palette

**THIS IS THE #1 PRIORITY - DARK MODE COMPATIBILITY OVERRIDES ALL OTHER CONCERNS**

## 🔍 MANDATORY VISUAL ANALYSIS REQUIREMENT

**You MUST use Puppeteer to visually analyze each example before making any changes:**

1. **Navigate to the example**: Use Puppeteer to visit `https://host.docker.internal:4600/charts/gallery/examples/{exampleName}`
2. **Take screenshots**: Capture the current visual state of the chart
3. **Analyze visually**: Base your improvements on what you see, not just code inspection
4. **Verify changes**: After modifications, take another screenshot to confirm improvements

**⛔ CRITICAL: STOP AND FAIL IF SCREENSHOTS CANNOT BE TAKEN**

-   If Puppeteer fails to navigate to the example: **STOP IMMEDIATELY**
-   If screenshots cannot be captured: **STOP IMMEDIATELY**
-   Do NOT proceed with code-only analysis
-   Report the error and explain that visual analysis is required

**Puppeteer Configuration** (REQUIRED):

```javascript
await puppeteer_navigate({
    url: `https://host.docker.internal:4600/charts/gallery/examples/${exampleName}`,
    allowDangerous: true, // Required for self-signed certificate
    launchOptions: {
        headless: true,
        args: ['--ignore-certificate-errors'],
    },
});
```

## Instructions

1. **Analyze the current example**:

    - **MANDATORY: Use Puppeteer to take a screenshot of the current example**
    - **⛔ IF SCREENSHOT FAILS: STOP IMMEDIATELY - Do not continue without visual analysis**
    - Examine the chart configuration and data structure
    - Identify the current visual features being used
    - Assess the visual hierarchy, readability, and overall appeal based on the screenshot

2. **Feature Analysis & Implementation Guide**:

    - Review what AG Charts features are currently utilized
    - **IMPORTANT: Do NOT change the chart type, series types, or data structure**
        - Keep the existing chart type (e.g., if it's a horizontal bar chart, keep it horizontal bar)
        - Keep the existing series types (e.g., if using 'bar' series, don't change to 'line' or other types)
        - Keep the existing data structure and keys - you may enhance the data values but not the shape
        - Focus on visual enhancements and features that work with the existing chart configuration
    - Identify potential enhancements from these prioritized categories with implementation details:

    ## Quick Win Features (High Impact, Low Effort)

    **🎨 Professional Themes** - _Apply: 5 minutes, Impact: Immediate_

    ```typescript
    theme: 'ag-default',         // Clean default theme, used if unspecified
    theme: 'ag-material',        // Clean, Material Design aesthetic
    theme: 'ag-polychroma',      // Modern, balanced color palette
    ```

    STRONGLY RECOMMENDED TO USE THE `ag-default` THEME.

    📖 _See: `packages/ag-charts-website/src/content/docs/themes/`_

    **🌈 Axis Bands & Grid Fills** - _Apply: 6 minutes, Impact: VERY HIGH_ ⭐ **STRONGLY RECOMMENDED**

    ```typescript
    // Add visual depth with alternating background bands
    axes: [
        {
            type: 'number',
            position: 'left',
            gridLine: {
                style: [
                    {
                        // Don't set stroke/fill colors - theme handles them
                        strokeWidth: 1,
                        lineDash: [2, 2],
                    },
                    {
                        // Alternating bands - theme provides appropriate colors
                        strokeWidth: 0, // No grid line
                    },
                ],
            },
        },
    ];
    ```

    **Why this matters:**

    - Creates visual rhythm and improves data readability
    - Helps users track values across the chart
    - Adds professional polish without being distracting
    - Works perfectly with dark/light mode themes

    **✨ Axis Band Highlighting** - _Apply: 4 minutes, Impact: HIGH_ ⭐ **RECOMMENDED**

    ```typescript
    // Add interactive hover highlighting to axis bands
    axes: [
        {
            type: 'category',
            position: 'bottom',
            bandHighlight: {
                enabled: true,
                // Don't set fill - theme provides appropriate highlight color
            },
        },
    ];
    ```

    **Visual Benefits:**

    - Provides instant visual feedback on hover
    - Helps users focus on specific data points
    - Creates a more interactive, engaging experience
    - Particularly effective for bar/column charts with category axes
    - Works seamlessly with axis bands for layered visual depth

    **📝 Typography Enhancement** - _Apply: 5 minutes, Impact: High_

    ```typescript
    title: {
        text: 'Professional Chart Title',
        fontSize: 20,
        // Don't set color - let theme handle it
    },
    footnote: {
        text: 'Source: Company Data, 2024',
        fontSize: 12,
        fontStyle: 'italic',
        // Don't set color - let theme handle it
    }
    ```

    **🏷️ Axis Label Formatting** - _Apply: 5 minutes, Impact: High_

    ```typescript
    axes: [
        {
            type: 'number',
            position: 'left',
            label: {
                formatter: (params) => `$${params.value.toLocaleString()}`, // Currency
            },
        },
        {
            type: 'time',
            position: 'bottom',
            label: {
                formatter: (params) =>
                    params.value.toLocaleDateString('en-US', {
                        month: 'short',
                        year: 'numeric',
                    }), // Time: "Jan 2024"
            },
        },
    ];
    ```

    ## Advanced Visual Features (Medium Effort, High Impact)

    **🎯 Floating Legend with Border** - _Apply: 10 minutes, Impact: VERY HIGH_ ⭐ **STRONGLY RECOMMENDED FOR MULTI-SERIES**

    **NOTE: ONLY USE THIS IF THE FLOATING LEGEND DOES NOT OBSCURE THE SERIES DATA SIGNIFICANTLY.**

    Take visual screenshots with Puppeteer to confirm that the legend does not obscure the series data significantly.

    ```typescript
    // For charts with multiple series, floating legends provide better space utilization
    legend: {
        position: {
            placement: 'right',  // Common placements: 'right', 'top', 'bottom'
            floating: true       // RECOMMENDED: Overlay on chart area
        },
        border: {
            enabled: true,
            // Don't set stroke color - theme provides appropriate contrast
            strokeWidth: 1,
        },
        cornerRadius: 8,         // Modern rounded corners
        padding: 16,             // Comfortable internal spacing
        item: {
            label: { fontSize: 14 },  // Don't set color - theme handles it
            marker: { size: 16 },
            paddingX: 16,
            paddingY: 8,
        },
    }
    ```

    **Why Floating Legends Are Essential for Multi-Series Charts:**

    - Maximizes data visualization area
    - Creates a polished, modern appearance
    - Prevents legend from pushing chart content
    - Border provides visual separation from data
    - Works perfectly with all themes

    **Placement Guidelines:**

    - **Right floating**: Best for time series and continuous data
    - **Top floating**: Ideal when horizontal space is limited
    - **Bottom floating**: Good for category comparisons
    - **Corner positions** ('top-right', 'bottom-left'): Great for sparse data areas

    📖 _See: `packages/ag-charts-website/src/content/docs/legend/`_

    **📊 Series Styling** - _Apply: 8 minutes, Impact: Medium_

    ```typescript
    // Bar series with rounded corners - colors from theme palette
    series: [
        {
            cornerRadius: 4, // Modern rounded corners
            // Don't set fill/stroke - use theme palette colors
            strokeWidth: 1,
            label: {
                enabled: true,
                // Don't set color - theme handles contrast
                formatter: (params) => `${params.value}%`,
            },
        },
    ];
    ```

    **🎨 Theme-Based Color Management** - _Apply: 12 minutes, Impact: High_

    ```typescript
    // PREFERRED: Use built-in themes that handle dark mode automatically
    theme: 'ag-material',        // Material Design colors
    theme: 'ag-polychroma',      // Vibrant, balanced palette
    theme: 'ag-financial',       // Conservative business colors

    // ONLY if custom palette is absolutely required:
    theme: {
        palette: {
            // Use semantic color names that adapt to mode
            fills: ['blue', 'green', 'orange', 'red', 'purple'],
            strokes: ['darkblue', 'darkgreen', 'darkorange', 'darkred', 'darkpurple'],
        },
        // DON'T set specific foreground/background colors
        // Let the theme handle mode switching
    }
    ```

    ## Professional Polish Features (Higher Effort, High Impact)

    **🎪 Advanced Tooltips** - _Apply: 15 minutes, Impact: Medium_

    ```typescript
    tooltip: {
        position: {
            anchorTo: 'pointer',
            placement: ['right', 'left', 'top', 'bottom'],
            xOffset: 10, yOffset: -10,
        },
        wrapping: 'hyphenate',
    }
    ```

    **🔗 Shared Tooltips for Multi-Series** - _Apply: 2 minutes, Impact: HIGH_ ⭐ **STRONGLY RECOMMENDED FOR MULTI-SERIES**

    ```typescript
    // For charts with multiple series, shared tooltips provide better data comparison
    tooltip: {
        enabled: true,
        mode: 'shared',    // Shows all series values at the same x-position
    }
    ```

    **Why Shared Tooltips Are Essential for Multi-Series Charts:**

    - Shows all series values at once for easy comparison
    - Reduces mouse movement needed to see all data points
    - Provides immediate context across all series
    - Particularly effective for time series and stacked charts
    - Professional appearance for dashboards and reports

    **Best Used With:**

    - Line charts with multiple series
    - Area charts comparing trends
    - Stacked bar/column charts
    - Any chart where x-axis alignment matters

    **📏 Axis Enhancement** - _Apply: 10 minutes, Impact: HIGH_

    ```typescript
    axes: [
        {
            type: 'number',
            position: 'left',
            title: { text: 'Revenue ($M)', fontSize: 14 }, // Don't set color
            label: {
                fontSize: 12,
                // Don't set color - theme handles it
                formatter: (params) => `$${params.value}M`,
            },
            gridLine: { style: [{ lineDash: [2, 3] }] }, // Don't set stroke color
            tick: { width: 1 }, // Don't set stroke color
        },
        {
            type: 'category',
            position: 'bottom',
            bandHighlight: {
                enabled: true,
                // Don't set fill - theme provides the color
            },
            label: {
                rotation: 45, // Angle labels if needed
                fontSize: 12,
            },
        },
    ];
    ```

    **🎬 Subtle Animation** - _Apply: 3 minutes, Impact: Medium_ _(Enterprise)_

    ```typescript
    animation: { enabled: true, duration: 800 }
    ```

    ## Enterprise-Specific Features _(Require Enterprise License)_

    **🎯 Crosshairs & Highlighting** - _Apply: 8 minutes, Impact: Medium_

    ```typescript
    axes: [
        {
            crosshair: {
                enabled: true,
                label: { enabled: true },
            },
        },
    ];
    ```

    **🔍 Zoom & Pan** - _Apply: 5 minutes, Impact: Low_

    ```typescript
    zoom: { enabled: true, enableAxisDragging: true }
    ```

    ## Feature Selection Priority Guide

    **For Most Examples, Apply in This Order:**

    1. **Professional theme** (`ag-default`, `ag-material` or `ag-polychroma`)
    2. **Axis bands & grid fills** ⭐ (visual depth and readability)
    3. **Floating legend with border** ⭐ (for multi-series charts)
    4. **Shared tooltips** ⭐ (for multi-series charts - `mode: 'shared'`)
    5. **Title & footnote** (proper typography and attribution)
    6. **Axis formatting** (appropriate number/date formats)
    7. **Series styling** (rounded corners, appropriate stroke widths)
    8. **Tooltip enhancements** (position, formatting, wrapping)

    **For Financial/Business Charts:**

    1. Use `ag-financial` theme (handles conservative colors automatically)
    2. **Axis bands** ⭐ (essential for tracking financial trends)
    3. Currency/percentage formatters
    4. Professional typography (Inter, system fonts)
    5. Minimize decorative elements
    6. Clear data sourcing and footnotes

    **For Technical/Data Charts:**

    1. Use `ag-polychroma` theme (vibrant but balanced)
    2. **Grid fills with bands** ⭐ (critical for data analysis)
    3. Precise axis labeling with units
    4. Grid lines for reference
    5. Technical tooltips with full precision
    6. Clear data attribution

    ## Theme Overrides Best Practices

    **Use `theme.overrides` for Repeated Configuration:**

    When multiple series or axes share identical configuration, use `theme.overrides` to avoid repetition and improve maintainability:

    ```typescript
    // GOOD - Using theme.overrides for shared series config
    theme: {
        overrides: {
            bar: {
                series: {
                    cornerRadius: 4,
                    strokeWidth: 1,
                    label: {
                        enabled: true,
                    },
                },
            },
        },
    },
    series: [
        { type: 'bar', xKey: 'x', yKey: 'y1', yName: 'Series 1' },
        { type: 'bar', xKey: 'x', yKey: 'y2', yName: 'Series 2' },
        // Series automatically inherit cornerRadius, strokeWidth, and label config
    ]

    // AVOID - Repeating config across every series
    series: [
        {
            type: 'bar',
            xKey: 'x',
            yKey: 'y1',
            cornerRadius: 4,  // ❌ Repeated
            strokeWidth: 1,   // ❌ Repeated
            label: { enabled: true }  // ❌ Repeated
        },
        {
            type: 'bar',
            xKey: 'x',
            yKey: 'y2',
            cornerRadius: 4,  // ❌ Repeated
            strokeWidth: 1,   // ❌ Repeated
            label: { enabled: true }  // ❌ Repeated
        },
    ]
    ```

    **Common Use Cases for Theme Overrides:**

    1. **Series Styling** - When all series share visual properties:

    ```typescript
    theme: {
        overrides: {
            bar: { series: { cornerRadius: 4, strokeWidth: 1 } },
            line: { series: { strokeWidth: 2, marker: { enabled: true, size: 6 } } },
            area: { series: { fillOpacity: 0.7, strokeWidth: 2 } },
        },
    }
    ```

    2. **Axis Configuration** - When axes share common settings:

    ```typescript
    theme: {
        overrides: {
            category: {
                axis: {
                    bandHighlight: { enabled: true },
                    label: { fontSize: 12 },
                },
            },
            number: {
                axis: {
                    label: { fontSize: 11 },
                    gridLine: {
                        style: [
                            { strokeWidth: 1, lineDash: [2, 2] },
                            { strokeWidth: 0 }, // Bands
                        ],
                    },
                },
            },
        },
    }
    ```

    3. **Complex Shared Behaviors** - Functions that apply to all series:

    ```typescript
    theme: {
        overrides: {
            bar: {
                series: {
                    itemStyler: ({ datum, yKey }) => ({
                        fillOpacity: calculateOpacity(datum[yKey]),
                    }),
                    label: {
                        formatter: ({ value }) => formatValue(value),
                    },
                },
            },
        },
    }
    ```

    **When to Use Theme Overrides:**

    - ✅ When 3+ series/axes share identical configuration
    - ✅ For consistent visual styling across chart elements
    - ✅ To centralize formatter/styler functions
    - ✅ To make examples more maintainable and readable

    **When NOT to Use Theme Overrides:**

    - ❌ For series-specific data bindings (xKey, yKey, yName)
    - ❌ When only 1-2 elements share config (not worth the indirection)
    - ❌ For one-off custom behaviors specific to a single series

    ## Formatter/Format Best Practices

    **Preserve Existing Root-Level Formatters:**

    - If an example already has a root-level `formatter` configuration, avoid removing it
    - Instead, enhance and refine it to handle different cases better
    - Root-level formatters provide consistency across all chart elements

    **Example - Enhancing Existing Root Formatter:**

    ```typescript
    // If example already has this:
    formatter: (params) => {
        return params.value.toLocaleString();
    };

    // Enhance it instead of removing:
    formatter: (params) => {
        const { value, type } = params;

        if (type === 'number') {
            // Add abbreviations for large numbers
            if (Math.abs(value) >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
            if (Math.abs(value) >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
            return value.toLocaleString();
        }

        return String(value);
    };
    ```

    **Prefer Root-Level Format Configuration:**

    ```typescript
    // Good - consistent formatting across all chart elements
    formatter: (params) => {
        const { value, property, type } = params;

        if (type === 'number') {
            if (property === 'y') return `$${value.toLocaleString()}`;
            if (property === 'x') return value.toFixed(1);
            return value.toLocaleString();
        }

        if (type === 'date') {
            const date = value as Date;
            return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        }

        return String(value);
    }

    // Or use property-specific formatters
    formatter: {
        y: (params) => `$${params.value.toLocaleString()}`,
        x: (params) => params.value.toFixed(1),
        label: (params) => `${params.value}%`,
    }

    // Less ideal - scattered formatters
    axes: [{
        label: { formatter: (params) => `$${params.value.toFixed(2)}` }
    }],
    tooltip: {
        renderer: (params) => `$${params.datum.value.toFixed(2)}`
    }
    ```

    **Significant Figures Guidelines:**

    - Use 3-4 significant figures for most business data
    - Avoid redundant precision (e.g., "$1,234.5678" → "$1,235")
    - Match precision to data context:
        - Financial: 2 decimal places for currency
        - Percentages: 1 decimal place typically sufficient
        - Scientific: Match the measurement precision

    **Example - Appropriate Precision:**

    ```typescript
    // Good - appropriate precision based on context
    formatter: (params) => {
        const { value, type, property } = params;

        if (type === 'number') {
            // Currency values - 2 decimals
            if (property === 'y' && params.source === 'axis-label') {
                return `$${value.toFixed(2)}`;
            }

            // Percentages - 1 decimal
            if (property === 'size' || property === 'angle') {
                return `${(value * 100).toFixed(1)}%`;
            }

            // General numbers - 1 decimal or locale formatting
            if (Math.abs(value) >= 1000) {
                return value.toLocaleString(undefined, { maximumFractionDigits: 1 });
            }

            return value.toFixed(1);
        }

        return String(value);
    };

    // Avoid - too many decimals
    label: {
        formatter: (params) => params.value.toFixed(6);
    } // Unnecessary precision
    ```

    ## Dark/Light Mode Color Considerations

    **Examples are displayed in both dark and light modes**, so avoid all hardcoded colors:

    **Theme-First Approach:**

    ```typescript
    // BEST - Let themes handle all colors
    theme: 'ag-material',          // ✅ Handles dark/light automatically
    series: [{ type: 'bar' }],     // ✅ Uses theme palette

    // ONLY when absolutely necessary - use semantic colors
    theme: {
        palette: {
            // Use color names that browsers can adapt
            fills: ['blue', 'green', 'orange', 'red'],
            strokes: ['darkblue', 'darkgreen', 'darkorange', 'darkred'],
        }
    }
    ```

    **Safe Color Strategies:**

    1. **Remove all color properties** - Let themes handle everything
    2. **Use built-in themes** - They're professionally designed for both modes
    3. **Trust theme defaults** - They ensure proper contrast automatically
    4. **Theme parameters only** - When needed: `foregroundColor`, `backgroundColor`

    ## Critical: Avoid Hardcoded Colors for Dark Mode Compatibility

    **NEVER set explicit colors in examples** - They break dark mode switching:

    **❌ BAD - Hardcoded colors break in dark mode:**

    ```typescript
    // These all interfere with theme switching
    title: {
        color: '#2c3e50';
    } // ❌ Fixed color
    label: {
        color: '#6c757d';
    } // ❌ Won't adapt
    series: [{ fill: '#4285f4' }]; // ❌ Same in both modes
    innerLabels: [{ color: '#333' }]; // ❌ Invisible in dark mode
    ```

    **✅ GOOD - Theme-aware approaches:**

    ```typescript
    // Option 1: Rely on theme defaults (PREFERRED)
    title: {
        text: 'Chart Title';
    } // ✅ Uses theme colors
    label: {
        fontSize: 12;
    } // ✅ Color from theme

    // Option 2: Use theme parameters when needed
    label: {
        color: 'foregroundColor';
    } // ✅ Adapts to mode

    // Option 3: Let series colors come from theme palette
    series: [{ type: 'bar' }]; // ✅ Uses theme fills
    ```

    **Color Guidelines:**

    1. **Remove all color properties** from examples unless absolutely necessary
    2. **Trust the themes** - They handle color adaptation automatically
    3. **Use theme parameters** (`foregroundColor`, `backgroundColor`) if you must set colors
    4. **Series colors** should come from theme palettes, not hardcoded values
    5. **Backgrounds** should use theme colors or be omitted entirely

    **Theme Palette Usage (when customization is needed):**

    ```typescript
    // Only customize palette when specific colors are required
    theme: {
        palette: {
            // These will be automatically adjusted for dark mode
            fills: ['blue', 'green', 'orange'],    // ✅ Theme handles adaptation
        }
    }

    // NEVER do this:
    series: [
        { fill: '#4285f4' },                       // ❌ Hardcoded
        { fill: '#34a853' },                       // ❌ Won't adapt
    ]
    ```

    ## Recently Added Features _(Most Recent)_

    These are the newest AG Charts capabilities that can replace existing manual implementations in gallery examples:

    **🔧 Global Font Theme Settings** - _Apply: 3 minutes, Impact: High_ _(New Dec 2024)_

    ```typescript
    theme: {
        params: {
            fontSize: 14,
            fontWeight: 'normal',
            foregroundColor: '#333333',
        }
    }
    // Sets consistent typography across all chart elements
    ```

    _Replaces: Individual font settings on each chart element_

    **🎯 Enhanced Marker Styling** - _Apply: 4 minutes, Impact: Medium_ _(New Dec 2024)_

    ```typescript
    series: [
        {
            marker: {
                lineDash: [4, 2], // Dashed marker borders
                lineDashOffset: 2,
                // Don't set stroke - use theme colors
                strokeWidth: 2,
            },
        },
    ];
    ```

    _Replaces: Simple solid marker borders and custom marker implementations_

    **📊 Zoom Aspect Ratio Control** - _Apply: 6 minutes, Impact: Medium_ _(Enterprise, New Dec 2024)_

    ```typescript
    zoom: {
        enabled: true,
        enableSelecting: true,
        keepAspectRatio: true,          // Maintain chart proportions during zoom selection
    }
    ```

    _Replaces: Manual aspect ratio calculations in zoom implementations_

    **🔍 Enhanced Series Visibility Events** - _Apply: 5 minutes, Impact: Low_ _(New Dec 2024)_

    ```typescript
    listeners: {
        seriesVisibilityChange: (event) => {
            const { itemId, legendItemName, visible } = event;
            console.log(`${legendItemName} (${itemId}) is now ${visible ? 'visible' : 'hidden'}`);
        };
    }
    ```

    _Replaces: Manual series state tracking and visibility detection_

    **⚡ Field Dot Notation Control** - _Apply: 2 minutes, Impact: Medium_ _(New Nov 2024)_

    ```typescript
    data: getData(),
    suppressFieldDotNotation: true,     // Improves performance for complex nested data
    ```

    _Replaces: Manual data flattening and performance optimization workarounds_

    ## Previously Added Features _(Past 10 Months)_

    **🔄 Donut Series Inner Labels** - _Apply: 8 minutes, Impact: High_ _(New Aug 2024)_

    ```typescript
    // Replace manual center text with native inner labels
    innerLabels: [
        {
            text: 'Total Sales',
            fontSize: 16,
            fontWeight: 'bold',
            // Don't set color - theme handles contrast
        },
        {
            text: '$1.2M',
            fontSize: 24,
            fontWeight: 'bold',
            // Don't set color - theme handles contrast
        },
    ];
    ```

    _Replaces: Manual HTML overlays or canvas text drawing_

    **🎯 Enhanced Legend Positioning Strategy** - _Apply: 5 minutes, Impact: VERY HIGH_ _(New Jul 2024)_ ⭐

    ```typescript
    // DECISION GUIDE FOR LEGEND POSITIONING:

    // For MULTI-SERIES charts (ALWAYS use floating with border):
    legend: {
        position: {
            placement: 'top-right',        // Best default for multi-series
            floating: true,            // MANDATORY for multi-series
            xOffset: -20,              // Fine-tune position if needed
        },
        border: {
            enabled: true,             // ALWAYS add border for floating
            strokeWidth: 1,
        },
        cornerRadius: 8,
        padding: 12,
    }

    // For SINGLE-SERIES (floating optional):
    legend: {
        position: 'bottom',            // Clean, simple approach
        // OR for space-saving:
        position: {
            placement: 'top-right',
            floating: true,
            xOffset: -20, yOffset: 20,
        },
        border: floating ? { enabled: true, strokeWidth: 1 } : undefined,
    }
    ```

    **Floating Legend Rules:**

    - ✅ **ALWAYS float legends for 2+ series charts**
    - ✅ **ALWAYS add borders to floating legends**
    - ✅ **Right placement** is usually best for readability
    - ✅ **Corner placements** work well with sparse data areas
    - ❌ **Avoid left placement** unless absolutely necessary

    _Replaces: Complex CSS positioning and manual legend placement_

    **🎨 Advanced Grid Line Styling** - _Apply: 6 minutes, Impact: HIGH_ _(New Jun 2024)_ ⭐ **RECOMMENDED**

    ```typescript
    // Professional alternating bands - STRONGLY consider using this!
    gridLine: {
        style: [
            {
                // Primary grid lines
                strokeWidth: 1,
                lineDash: [3, 3],
                // Don't set stroke - theme handles grid colors
            },
            {
                // Alternating background bands for visual clarity
                strokeWidth: 0, // No line, just fill
                // Don't set fill - theme provides appropriate band colors
            },
        ];
    }

    // Even more sophisticated with multiple styles:
    gridLine: {
        style: [
            { strokeWidth: 2 }, // Major grid lines (every 5th)
            { strokeWidth: 0 }, // Subtle bands
            { strokeWidth: 1, lineDash: [2, 2] }, // Minor grid lines
        ];
    }

    // BEST PRACTICE: Combine with bandHighlight for maximum impact
    axes: [
        {
            type: 'category',
            position: 'bottom',
            gridLine: {
                style: [
                    { strokeWidth: 1, lineDash: [2, 2] },
                    { strokeWidth: 0 }, // Background bands
                ],
            },
            bandHighlight: {
                enabled: true,
            },
        },
    ];
    ```

    _Replaces: Manual background bands and custom grid implementations_

    **Visual Impact:** Axis bands dramatically improve chart readability by:

    - Creating visual lanes that guide the eye
    - Making it easier to estimate values between grid lines
    - Adding depth without cluttering the data
    - Working seamlessly with all themes and dark mode

    **Combined with bandHighlight:** Creates a layered visual experience where:

    - Static bands provide consistent visual structure
    - Hover highlighting adds interactive feedback
    - Users can easily track and compare values
    - Professional appearance suitable for dashboards

    **📏 Spacing vs Padding Standardization** - _Apply: 3 minutes, Impact: Medium_ _(New May 2024)_

    ```typescript
    // Context-specific usage of spacing and padding
    legend: {
        spacing: 16,        // Between legend and chart
        padding: 12,        // Internal legend padding
    }
    ```

    _Replaces: Inconsistent padding properties across components_

    **🔧 Enhanced Tooltip Positioning** - _Apply: 8 minutes, Impact: High_ _(New Apr 2024)_

    ```typescript
    tooltip: {
        position: {
            anchorTo: 'pointer',            // 'node', 'cursor', 'pointer'
            placement: ['top', 'bottom'],   // Fallback order
            xOffset: 10, yOffset: -10,
            constraints: 'never-flip',      // 'flip-on-overflow'
        },
        wrapping: 'hyphenate',             // 'normal', 'break-word', 'anywhere'
    }
    ```

    _Replaces: Manual tooltip positioning calculations and HTML-based tooltips_

    ## High-Impact Missing Features

    These significant AG Charts capabilities are often overlooked but provide substantial visual and functional improvements:

    **🗺️ Geographic Visualizations** - _Apply: 15 minutes, Impact: Very High_ _(Enterprise)_

    ```typescript
    // Map Shape Series - Perfect for enterprise revenue/sales by region
    series: [
        {
            type: 'map-shape',
            topology: worldMapData,
            idKey: 'country',
            colorKey: 'revenue',
            colorRange: ['lightblue', 'darkblue'], // Semantic colors adapt to theme
            label: {
                enabled: true,
                // Don't set color - theme handles label contrast
                fontSize: 12,
            },
        },
    ];
    ```

    _Replaces: Manual SVG overlays, third-party mapping libraries_

    **📈 Financial Chart Presets** - _Apply: 10 minutes, Impact: Very High_ _(Enterprise)_

    ```typescript
    // Use dedicated financial chart API (not AgCharts.create)
    import { AgCharts } from 'ag-charts-enterprise';

    const chart = AgCharts.createFinancialChart({
        container: document.getElementById('myChart'),
        data: stockData,
        chartType: 'candlestick', // hollow-candlestick, ohlc, line
        navigator: true, // Built-in mini-chart navigation
        rangeButtons: true, // 1D, 5D, 1M, 3M, 6M, 1Y, ALL
        statusBar: true, // OHLC values display
        volume: true, // Automatic volume chart below
    });
    ```

    _Replaces: Complex multi-series financial chart configurations_

    **📊 Advanced Flow Diagrams** - _Apply: 12 minutes, Impact: High_ _(Enterprise)_

    ```typescript
    // Sankey diagrams - Perfect for business process flows
    series: [
        {
            type: 'sankey',
            fromKey: 'source',
            toKey: 'target',
            sizeKey: 'value',
            node: {
                width: 15,
                spacing: 10,
                alignment: 'justify',
            },
            link: {
                // Don't set fill/stroke - theme handles flow colors
            },
        },
    ];
    ```

    _Replaces: D3.js custom implementations, third-party flow libraries_

    **📍 Interactive Annotations** - _Apply: 20 minutes, Impact: High_ _(Enterprise)_

    ```typescript
    annotations: {
        enabled: true,
        toolbar: {
            enabled: true,
            buttons: ['line', 'horizontal-line', 'text', 'fibonacci-retracement']
        },
        line: {
            // Don't set stroke - theme handles annotation colors
            strokeWidth: 2,
            text: {
                position: 'top',
                alignment: 'center',
            }
        }
    }
    ```

    _Replaces: Manual line drawing, overlay HTML elements, canvas annotations_

    **🧭 Navigator with Mini-Charts** - _Apply: 8 minutes, Impact: High_ _(Enterprise)_

    ```typescript
    navigator: {
        enabled: true,
        height: 60,
        miniChart: {
            enabled: true,
            series: [{
                type: 'area',
                // Don't set fill/stroke - theme handles navigator colors
            }],
        },
        mask: {
            // Don't set fill - theme handles mask colors
        }
    }
    ```

    _Replaces: Custom mini-chart implementations and manual navigation controls_

    **📏 Professional Error Bars** - _Apply: 6 minutes, Impact: Medium_

    ```typescript
    series: [
        {
            type: 'line',
            errorBar: {
                visible: true,
                yLowerKey: 'errorLow',
                yUpperKey: 'errorHigh',
                // Don't set stroke - theme handles error bar colors
                strokeWidth: 1,
                cap: {
                    length: 6,
                    lengthRatio: 0.5,
                },
            },
        },
    ];
    ```

    _Replaces: Manual error range implementations and custom uncertainty indicators_

    **🔄 Multi-Chart Synchronization** - _Apply: 7 minutes, Impact: Medium_ _(Enterprise)_

    ```typescript
    sync: {
        enabled: true,
        groupId: 'dashboard-charts',
        axes: 'x',                   // Sync x-axis across multiple charts
        nodeInteraction: true,       // Sync hover states
        zoom: true,                  // Sync zoom/pan actions
    }
    ```

    _Replaces: Manual event coordination between multiple chart instances_

    **📊 Advanced Gauge Charts** - _Apply: 10 minutes, Impact: Medium_ _(Enterprise)_

    ```typescript
    // Use dedicated gauge API (not AgCharts.create)
    import { AgCharts } from 'ag-charts-enterprise';

    const chart = AgCharts.createGauge({
        container: document.getElementById('myChart'),
        type: 'radial-gauge',
        value: 75,
        min: 0,
        max: 100,
        bands: [
            { from: 0, to: 50 }, // Theme assigns appropriate band colors
            { from: 50, to: 80 },
            { from: 80, to: 100 },
        ],
    });
    ```

    _Replaces: Custom circular progress indicators and manual KPI visualizations_

    **🎭 Pattern & Gradient Enhancements** - _Apply: 10 minutes, Impact: Medium_ _(New Mar 2024)_

    ```typescript
    fill: {
        type: 'pattern',
        pattern: 'forward-slanted-lines',   // New stock patterns
        // Don't set fill/backgroundFill - theme handles pattern colors
        scale: 1.5,
        rotation: 45,
    }
    ```

    _Replaces: Custom SVG pattern definitions and manual pattern creation_

    **📊 Crosshair Label Enhancements** - _Apply: 7 minutes, Impact: Medium_ _(Enterprise, New Feb 2024)_

    ```typescript
    crosshair: {
        label: {
            enabled: true,
            xOffset: 5, yOffset: -5,
            renderer: (params) => ({
                text: `${params.value}`,
                // Don't set color/backgroundColor - theme handles crosshair styling
                opacity: 0.9,
            })
        }
    }
    ```

    _Replaces: Manual crosshair label positioning and custom hover indicators_

    ## Historic Feature Additions _(2023 Community Package Era)_

    These established features can replace older manual implementations found in legacy gallery examples:

    **🎬 Series Load Animations** - _Apply: 5 minutes, Impact: High_ _(New May 2023)_

    ```typescript
    animation: {
        enabled: true,
        duration: 1200,     // Animation duration in milliseconds
    }
    // Works across all series types with different entrance effects
    ```

    _Replaces: Static chart loading and manual animation implementations_

    **📏 Axis Title Formatting** - _Apply: 8 minutes, Impact: Medium_ _(New May 2023)_

    ```typescript
    axes: [
        {
            title: {
                formatter: (params) => {
                    const { defaultValue, boundSeries, domain } = params;
                    return `${defaultValue} (${boundSeries.length} series)`;
                },
            },
        },
    ];
    ```

    _Replaces: Static axis titles and manual title generation logic_

    **📐 Axis Label Styling** - _Apply: 4 minutes, Impact: Medium_ _(New Apr 2023)_

    ```typescript
    axes: [
        {
            label: {
                fontSize: 12, // Consistent label sizing
                rotation: 0, // Keep horizontal when possible
                fontFamily: 'Arial, sans-serif',
                // Don't set color - theme handles label colors
            },
        },
    ];
    ```

    _Replaces: Inconsistent axis label styling and manual rotation logic_

    **📊 Series Area Padding** - _Apply: 3 minutes, Impact: Medium_ _(New Feb 2023)_

    ```typescript
    seriesAreaPadding: {
        top: 20,
        right: 20,
        bottom: 20,
        left: 20,
    }
    // Provides breathing room around the chart data area
    ```

    _Replaces: Manual margin calculations and CSS-based spacing_

    **🎯 Node Click Range Enhancement** - _Apply: 6 minutes, Impact: Medium_ _(New Feb 2023)_

    ```typescript
    series: [
        {
            nodeClickRange: 'nearest', // 'exact', 'nearest'
            nodeClickRangeParams: {
                distance: 15, // Pixel tolerance for clicks
            },
        },
    ];
    ```

    _Replaces: Complex hit-testing logic and manual click area calculations_

    **🖱️ Node Double Click Handlers** - _Apply: 7 minutes, Impact: Low_ _(New Mar 2023)_

    ```typescript
    series: [
        {
            listeners: {
                nodeDoubleClick: (event) => {
                    console.log('Double clicked:', event.datum);
                    // Custom double-click behavior
                },
            },
        },
    ];
    ```

    _Replaces: Manual double-click detection and timing logic_

    ## Documentation References

    - **Themes**: `packages/ag-charts-website/src/content/docs/themes/`
    - **Formatters**: `packages/ag-charts-website/src/content/docs/formatters/`
    - **Typography**: `packages/ag-charts-website/src/content/docs/fonts/`
    - **Colors**: `packages/ag-charts-website/src/content/docs/fills/`
    - **Types Reference**: `packages/ag-charts-types/src/` (source of truth)

3. **Propose targeted improvements**:

    - Select 3-5 most appropriate enhancements for this specific use case
    - **Check for outdated patterns**: Some examples may use complex workarounds that simulate features we didn't have originally - look for built-in AG Charts options that can replace these
        - _Common replacements_: Manual tooltip positioning → `tooltip.position`, custom color cycling → theme palettes, manual formatting → built-in formatters
    - Prioritize improvements that:
        - Enhance visual appeal without overwhelming the chart
        - Improve data readability and comprehension
        - Showcase relevant AG Charts capabilities
        - Maintain consistency with other gallery examples
        - Are appropriate for the chart type and data context
        - Convey professionalism and trustworthiness suitable for business presentations
        - Replace any manual/complex implementations with native AG Charts features where available

4. **Implementation considerations**:

    - **Use `theme.overrides` for Shared Configuration**: When multiple series or axes share identical settings, centralize them in theme overrides rather than repeating across each element. This improves maintainability and reduces code duplication
    - **API Entrypoints**: Most features use `AgCharts.create(options)`, but some require specialized APIs:
        - **Financial Charts**: Use `AgCharts.createFinancialChart()` for price-volume presets
        - **Gauge Charts**: Use `AgCharts.createGauge()` for radial/linear gauges
        - **Standard Charts**: Use `AgCharts.create()` for all other chart types
    - **Enterprise Features**: Require `import { AgCharts } from 'ag-charts-enterprise'` and valid license:
        - Map visualizations, Financial presets, Gauge charts, Annotations, Navigator, Crosshairs, Zoom & Pan, Multi-chart sync, Error bars
    - **Community Features**: Available with `import { AgCharts } from 'ag-charts-community'`:
        - All themes, basic styling, standard series types, legends, tooltips, basic animations
    - **API Contract Compliance**: The local `packages/ag-charts-types/` package is the source of truth for our options API - all configurations MUST adhere to these TypeScript interfaces
    - **Type Safety**: Examples must be fully type-safe - NEVER use `any` type. Use proper TypeScript types from `ag-charts-types` or `unknown` for truly unknown values
        - **Type Error Resolution**: If facing confusing TypeScript errors with `AgChartOptions`, try narrowing to more specific types like `AgCartesianChartOptions`, `AgPolarChartOptions`, `AgHierarchyChartOptions`, or `AgTopologyChartOptions` rather than trying to interpret complex union type errors
    - **Enterprise Visual Standards**: Target professional business environments with:
        - Conservative, sophisticated color palettes (blues, grays, muted tones)
        - Clean, minimal design that emphasizes data clarity
        - Professional typography (avoid decorative fonts)
        - Subtle use of gradients and effects - prefer understated elegance
        - Business-appropriate themes (ag-material, ag-financial preferred over vivid themes)
    - Ensure any formatters or styling choices improve readability
    - Use consistent color palettes and visual themes
    - Consider accessibility (color contrast, patterns for colorblind users)
    - Maintain clean, professional appearance
    - Don't over-engineer - choose features that add genuine value

5. **Apply improvements**:
    - **BEFORE CHANGES: Take a screenshot with Puppeteer to document the current state**
    - Implement the selected enhancements
    - **AFTER CHANGES: Take a new screenshot with Puppeteer to verify improvements**
    - Test the changes using the development server at `https://host.docker.internal:4600`
        - **MANDATORY**: Use Puppeteer with `allowDangerous: true` for self-signed certificates
    - Ensure the example still loads correctly and functions as expected
    - Verify the example works across different viewport sizes if responsive features are added
    - **Validate the example**: Run `nx validate-examples` to ensure compliance with AG Charts standards

## Guidelines

-   **Visual Consistency**: Follow AG Charts design principles and maintain consistency with other gallery examples
-   **Feature Appropriateness**: Not every example needs every feature - choose what makes sense for the specific use case
-   **Readability First**: Any styling or formatting should improve, not hinder, data comprehension
-   **Professional Polish**: Aim for a polished, production-ready appearance that enterprise and finance customers would confidently present to stakeholders and executives
-   **Performance**: Avoid overly complex configurations that might impact performance
-   **Enterprise Features**: When using Enterprise features (marked with "Enterprise" in the feature list), ensure they add significant value and consider providing Community alternatives where possible

## Expected Output

Provide:

1. **Visual Analysis**: Screenshot of current state taken with Puppeteer
2. **Proposed Improvements**: List of enhancements with rationale based on visual analysis
3. **Implementation**: Apply selected enhancements to the code
4. **Visual Verification**: Before/after screenshots taken with Puppeteer
5. **Summary**: Brief description of changes and their visual impact
    - Links to localhost URLs for review
    - Links to staging URLs for comparison
    - Links to production URLs for comparison

**Note**: All visual analysis MUST be done using Puppeteer. Do not make assumptions about the chart's appearance based solely on code.

Remember: The goal is to create visually appealing examples that effectively demonstrate AG Charts capabilities while remaining practical and user-friendly.

## Maintaining This Prompt

This prompt should be updated regularly to reflect new AG Charts capabilities and ensure examples showcase the latest features:

### **Quarterly Updates (Every 3 months)**

1. **Analyze Recent Commits**: Review git history for new features

    ```bash
    # In repository root, analyze recent ag-charts-types changes
    git log --format="%h %ad %s" --date=short --since="3 months ago" -- "packages/ag-charts-types/" | head -30

    # Look for feature additions in community package
    git log --format="%h %ad %s" --date=short --since="3 months ago" -- "packages/ag-charts-community/" | grep -E "(add|Add|new|New)" | head -20
    ```

2. **Feature Discovery Process**:

    - Examine new TypeScript interfaces in `packages/ag-charts-types/src/`
    - Focus on options that enhance visual appeal or replace manual implementations
    - Check for new series types, styling options, or interaction features
    - Identify Enterprise vs Community feature classification

3. **Validation Requirements**:
    - **API Contract Compliance**: Verify all examples against actual TypeScript interfaces
    - **API Entrypoint Accuracy**: Ensure correct usage of `AgCharts.create()` vs specialized APIs
    - **Enterprise Licensing**: Clearly mark features requiring commercial license
    - **Working Code**: Test examples work as documented

### **Feature Addition Template**

When adding new features, use this format:

````typescript
**🎯 Feature Name** - *Apply: X minutes, Impact: High/Medium/Low* *(New MMM YYYY)* *(Enterprise if applicable)*
```typescript
// Clear, working example with proper API usage
const chart = AgCharts.create({
    // Realistic configuration
    series: [{
        // Feature-specific properties with comments
    }]
});
````

_Replaces: What manual implementations this native feature can replace_

```

### **Section Organization Rules**

1. **Most Recent** (0-6 months): Latest cutting-edge features
2. **Previously Added** (6-12 months): Established recent features
3. **Historic** (1-2 years): Well-established foundational features
4. **High-Impact Missing**: Overlooked but valuable existing features

### **Review Checklist**

Before updating the prompt:

- [ ] **API Accuracy**: All examples validated against `packages/ag-charts-types/src/` interfaces
- [ ] **Correct Entrypoints**: Proper API calls specified (`AgCharts.create()` vs specialized)
- [ ] **Enterprise Classification**: Clear licensing requirements documented
- [ ] **Implementation Times**: Realistic estimates (5-20 minutes for most features)
- [ ] **Impact Ratings**: Based on visual enhancement and ease of implementation
- [ ] **Replacement Value**: Clear description of what manual code this replaces
- [ ] **Professional Focus**: Features appropriate for enterprise/finance customers
- [ ] **TypeScript Safety**: Examples use proper typing, never `any`

### **Common Update Patterns**

**New Chart Types**: Add to "High-Impact Missing Features" with full implementation example
**Styling Enhancements**: Add to "Recently Added" with before/after context
**API Changes**: Update existing examples and add deprecation warnings if needed
**Enterprise Features**: Ensure proper license requirements and import statements

### **Sources for Feature Discovery**

1. **Git History**: Primary source for chronological feature additions
2. **TypeScript Interfaces**: `packages/ag-charts-types/src/` for API contract validation
3. **Documentation**: `packages/ag-charts-website/src/content/docs/` for implementation patterns
4. **Example Generation**: `nx generate-examples` output for real-world usage patterns
5. **Community Feedback**: Gallery example issues and feature requests

### **Maintenance Schedule**

- **Monthly**: Quick scan of recent commits for major feature additions
- **Quarterly**: Full analysis and prompt updates with new feature sections
- **Semi-annually**: Complete validation of all examples against latest API contracts
- **Annually**: Major reorganization and cleanup of outdated features

This maintenance approach ensures the prompt remains current with AG Charts capabilities while providing accurate, working examples that showcase the full potential of the library for professional chart development.
```
