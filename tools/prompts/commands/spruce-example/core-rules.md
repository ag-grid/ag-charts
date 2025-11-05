# Core Rules and Exit Criteria

## ⚡ QUICK CHECKLIST - BEFORE YOU START

Before modifying ANY gallery example, verify:

-   [ ] NO hardcoded colors (hex, rgb, named colors)
-   [ ] NO fontSize, fontWeight, fontFamily, fontStyle properties
-   [ ] NO styles.css or ANY CSS files
-   [ ] NO inline styles in HTML
-   [ ] Using specific chart type (`AgCartesianChartOptions` etc, not generic `AgChartOptions`)
-   [ ] All axes have `type` specified
-   [ ] Tooltips have `heading` property (prevents empty lines)

**If ANY of these are violated, STOP and fix them first.**

## 🚨 MANDATORY STYLING RULES - ENFORCE WITHOUT EXCEPTION

### ❌ ABSOLUTELY NO HARDCODED STYLING

1. **REMOVE ALL COLOR PROPERTIES** - Delete every `color:`, `fill:`, `stroke:`, `backgroundColor:`
2. **NO HEX CODES** - Never use `#ffffff`, `#333333`, etc.
3. **NO RGB/RGBA** - Never use `rgb()`, `rgba()`, `hsl()`, etc.
4. **NO COLOR NAMES** - Never use `'white'`, `'black'`, `'blue'`, etc. in color properties
5. **NO FONT PROPERTIES** - NEVER set `fontSize`, `fontWeight`, `fontFamily`, `fontStyle`
6. **NO CUSTOM CSS** - NEVER create styles.css or add any CSS unless absolutely critical
7. **THEME HANDLES EVERYTHING** - The theme system manages ALL visual styling

**EXCEPTIONS (EXTREMELY RARE)**:

-   Color scales for heatmaps/specialized visualizations (MUST work in both light/dark themes)
-   Even then, prefer theme-aware color schemes when possible

**THIS IS THE #1 PRIORITY - THEME COMPATIBILITY OVERRIDES ALL OTHER CONCERNS**

### 📢 WHY THIS MATTERS

Gallery examples are used by thousands of developers who:

-   Copy/paste them into different environments (websites, apps, dashboards)
-   Switch between light/dark themes dynamically
-   Have corporate design systems that override fonts/colors
-   Run in various containers (Plunker, StackBlitz, CodeSandbox, etc.)

**ANY hardcoded styling breaks this portability and creates support issues.**

## ⚠️ Required Fields

-   **`axes[].type`** - MUST always be specified for every axis configuration
-   All TypeScript types must be properly defined - NEVER use `any`
-   Use specific chart types (`AgCartesianChartOptions`, `AgPolarChartOptions`, etc.) instead of generic `AgChartOptions` to avoid compiler errors

## ❌ Never Do List - ABSOLUTE PROHIBITIONS

### 🚫 STYLING (NEVER EVER DO THESE)

-   **Hardcode ANY colors** (`fill: '#4285f4'`, `stroke: 'red'`, `color: 'rgb(0,0,0)'`) - BREAKS THEMES
-   **Set fontSize ANYWHERE** - The theme handles ALL font sizes
-   **Set fontWeight ANYWHERE** - The theme handles ALL font weights
-   **Override fontFamily** - The theme handles ALL typography
-   **Add ANY CSS files** - NO styles.css, NO custom stylesheets, NO exceptions (99.9% of the time)
-   **Use inline styles** - NO style attributes in HTML
-   **Set fontStyle** - No italic, oblique, etc. - theme decides this

### 🚫 OTHER CRITICAL RULES

-   Use `any` TypeScript type - breaks type safety
-   Change chart types or data structure - focus on visual enhancement only
-   Set explicit themes (`theme: 'ag-default'`) - gallery handles theme switching
-   **For 'simple-\*' examples**: Add more series or data - these are meant to showcase a single series type in its purest form
-   **Custom tooltip HTML via `renderer()`** - use multiple `data[]` elements instead (simpler + better styling)
-   **Tooltip renderers without `heading`** - ALWAYS include `heading` property to avoid empty lines at the top of tooltips
-   **Use deprecated `highlightStyle`** - use the newer `highlight.*` options instead
-   **Add no-op formatters** - NEVER use formatters that just call `toLocaleString()` without additional formatting
-   **Use deeply nested formatters** - ALWAYS prefer root-level `formatter.x` and `formatter.y` over duplicating formatters
-   **Over-decorate radial/polar charts** - Avoid adding cross lines, excessive grid lines, or axis labels unless absolutely necessary
-   **Add unnecessary footnotes** - Only add footnotes if absolutely essential to explain the example (footnotes reduce vertical space for the visualization, especially critical for polar/radar charts)

## ⛔ CRITICAL EXIT CRITERIA - MUST PASS ALL

### Visual Quality Requirements:

-   ✅ PREVis score MUST be at least as good as baseline (no regression)
-   ✅ PREVis evaluation MUST NOT identify any new visual issues
-   ✅ If PREVis score decreases or new issues appear: **REVERT CHANGES**

### Technical Requirements (RUN IN THIS ORDER):

1.  ✅ Example MUST compile without TypeScript errors
2.  ✅ Example MUST generate without warnings
3.  ✅ **Validation MUST pass** (`yarn nx run ag-charts-website-gallery_[example-name]_main.ts:typecheck`) - **DO NOT SKIP THIS**
4.  ✅ Thumbnail generation MUST succeed (`yarn nx generate-thumbnails`)
5.  ✅ All `axes[].type` fields MUST be specified

### Failure Conditions (STOP IMMEDIATELY):

-   If Puppeteer fails to navigate to the example: **STOP - DO NOT PROCEED**
-   If screenshots cannot be captured: **STOP - DO NOT PROCEED**
-   If PREVis evaluation cannot be performed: **STOP - DO NOT PROCEED**
-   If PREVis score decreases: **REVERT ALL CHANGES**
-   If compilation fails: **FIX OR REVERT**
-   **If `yarn nx run ag-charts-website-gallery_[example-name]_main.ts:typecheck` fails: FIX OR REVERT - DO NOT SKIP**
-   If thumbnail generation fails: **FIX OR REVERT**
-   Do NOT proceed with code-only analysis
-   Report the error and explain that visual analysis is required

## 🎯 Quick Reference - Most Critical Features

### Multi-series charts:

-   Shared tooltips (`mode: 'shared'`) → Legend positioning (floating if appropriate) → Axis bands

### Single series charts:

-   Axis bands → Data labels → Series styling

### 'simple-\*' examples:

-   Keep single series! → Focus on labels, formatting, bands, tooltips (no additional data/series)

### Time series:

-   Navigator + crosshairs + date formatting

### Financial data:

-   Conservative styling + currency formatters + reference lines + right-side Y-axis positioning

### Radial/Polar charts:

-   **MINIMAL axis decoration** - Avoid cluttering with cross lines and labels
-   Only add grid lines if they enhance data readability
-   Keep axis labels sparse or remove entirely if not essential
-   **Maximize visualization space** - Avoid footnotes unless absolutely essential (vertical space is already constrained in circular layouts)
-   Focus on the data visualization, not the coordinate system

## Quick Wins (2-5 minutes, High Impact)

1. `tooltip: { mode: 'shared' }` for multi-series
2. `bandHighlight: { enabled: true }` on category axes
3. `gridLine: { style: [{ strokeWidth: 1, lineDash: [2,2] }, { strokeWidth: 0 }] }` for bands
4. `legend: { position: 'bottom' }` or careful floating with verification

## 📝 Formatter Best Practices

### ❌ NEVER use no-op formatters:

```typescript
// ❌ BAD - These add no value over built-in formatting
formatter: ({ value }) => value.toLocaleString();
formatter: ({ value }) => `$${value.toLocaleString()}`;
formatter: ({ value }) => `${value}`;
formatter: ({ value }) => value.toString();
```

### ❌ AVOID deeply nested formatters:

```typescript
// ❌ BAD - Repetitive nested formatters
axes: [
    {
        type: 'number',
        label: {
            formatter: ({ value }) => `$${(value / 1000).toFixed(0)}K`,
        },
    },
],
series: [
    {
        label: {
            formatter: ({ value }) => `$${(value / 1000).toFixed(0)}K`, // Same format!
        },
        tooltip: {
            renderer: ({ datum, yKey }) => ({
                content: `$${(datum[yKey] / 1000).toFixed(0)}K`, // Same format again!
            }),
        },
    },
];
```

### ✅ USE root-level formatters for consistency:

```typescript
// ✅ GOOD - Single formatter definition at root level
const options = {
    // Define formatters at the root for all y-values
    formatter: {
        y: ({ value }) => `$${(value / 1000).toFixed(0)}K`,
    },
    axes: [
        {
            type: 'number',
            position: 'left',
            // Automatically uses root formatter.y
        },
    ],
    series: [
        {
            type: 'bar',
            // Labels and tooltips automatically use root formatter.y
        },
    ],
};

// ✅ GOOD - Root formatter with x and y
const options = {
    formatter: {
        x: ({ value }) =>
            value.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
            }),
        y: ({ value }) => `${value.toFixed(1)}%`,
    },
    // All axes, series, labels, and tooltips use these formatters
};
```

### ✅ ONLY use nested formatters when they differ from root:

```typescript
// ✅ GOOD - Override only when needed
const options = {
    formatter: {
        y: ({ value }) => `$${(value / 1000).toFixed(0)}K`, // Default for most
    },
    series: [
        {
            type: 'bar',
            // Uses root formatter
        },
        {
            type: 'line',
            label: {
                formatter: ({ value }) => `${value.toFixed(1)}%`, // Different format for this series only
            },
        },
    ],
};
```

**WHY**: Root-level formatters provide:

-   **DRY principle** - Define once, use everywhere
-   **Consistency** - Same formatting across axes, labels, and tooltips
-   **Maintainability** - Single place to update formats
-   **Cleaner code** - Less nesting and repetition
-   **Performance** - AG Charts optimizes root formatters

## ⚠️ Deprecated API Patterns to Avoid

### ❌ `series[].highlightStyle` → ✅ Use `series[].highlight.*` properties:

```typescript
// ❌ DEPRECATED - Do not use
series: [
    {
        highlightStyle: {
            fill: 'yellow',
            strokeWidth: 3,
        },
    },
];

// ✅ MODERN - Use this instead
series: [
    {
        highlight: {
            highlightedItem: {
                fill: 'yellow', // Note: Avoid hardcoded colors
                strokeWidth: 3,
            },
        },
    },
];
```

### Other deprecated patterns to avoid:

-   Direct color values in highlight configurations
-   Legacy tooltip positioning methods
-   Old animation syntax
