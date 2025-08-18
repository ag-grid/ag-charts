# Recent Feature Additions

Track the latest AG Charts capabilities to ensure gallery examples showcase cutting-edge features.

## 🆕 Recently Added Features (Past 6 Months)

### 🔧 Global Font Theme Settings

_New Dec 2024 • Apply: 3 minutes • Impact: Low_ ❌ **GENERALLY AVOID**

```typescript
// ⚠️ ONLY use if you MUST override ALL fonts globally
// ❌ PREFER letting theme handle fonts automatically
theme: {
    params: {
        // ❌ AVOID setting fontSize - breaks theme consistency
        // ❌ AVOID setting fontWeight - unnecessary
        foregroundColor: '#333333',  // Only if absolutely needed
    }
}
```

_Note: Theme defaults are almost always better than manual font overrides_

### 🎯 Enhanced Marker Styling

_New Dec 2024 • Apply: 4 minutes • Impact: Medium_

```typescript
series: [
    {
        marker: {
            lineDash: [4, 2], // Dashed marker borders
            lineDashOffset: 2,
            // Don't set stroke - use theme colors
            strokeWidth: 2,
        },
        // Use the newer highlight options instead of deprecated highlightStyle
        highlight: {
            highlightedItem: {
                // Don't hardcode colors
                strokeWidth: 3,
            },
        },
    },
];
```

_Replaces: Simple solid marker borders, custom marker implementations_

### 📊 Zoom Aspect Ratio Control

_Enterprise • New Dec 2024 • Apply: 6 minutes • Impact: Medium_

```typescript
zoom: {
    enabled: true,
    enableSelecting: true,
    keepAspectRatio: true, // Maintain chart proportions during zoom selection
}
```

_Replaces: Manual aspect ratio calculations in zoom implementations_

### 🔍 Enhanced Series Visibility Events

_New Dec 2024 • Apply: 5 minutes • Impact: Low_

```typescript
listeners: {
    seriesVisibilityChange: (event) => {
        const { itemId, legendItemName, visible } = event;
        console.log(`${legendItemName} (${itemId}) is now ${visible ? 'visible' : 'hidden'}`);
    },
}
```

_Replaces: Manual series state tracking and visibility detection_

### ⚡ Field Dot Notation Control

_New Nov 2024 • Apply: 2 minutes • Impact: Medium_

```typescript
data: getData(),
suppressFieldDotNotation: true, // Improves performance for complex nested data
```

_Replaces: Manual data flattening and performance optimization workarounds_

## 📅 Previously Added Features (6-12 Months)

### 🔄 Donut Series Inner Labels

_New Aug 2024 • Apply: 8 minutes • Impact: High_

```typescript
// Replace manual center text with native inner labels
innerLabels: [
    {
        text: 'Total Sales',
        // ❌ Don't set fontSize/fontWeight - theme handles it
        // Don't set color - theme handles contrast
    },
    {
        text: '$1.2M',
        // ❌ Don't set fontSize/fontWeight - theme handles it
        // Don't set color - theme handles contrast
    },
];
```

_Replaces: Manual HTML overlays or canvas text drawing_

### 🎯 Enhanced Legend Positioning Strategy

_New Jul 2024 • Apply: 5 minutes • Impact: VERY HIGH_ ⭐

```typescript
// DECISION GUIDE FOR LEGEND POSITIONING:

// For MULTI-SERIES charts (consider floating with verification):
legend: {
    position: 'bottom', // Safe default
    // OR if space permits and verified:
    position: 'top-right',
    border: {
        enabled: true, // ALWAYS add border for floating
        strokeWidth: 1,
    },
    cornerRadius: 8,
    padding: 12,
}
```

_Replaces: Complex CSS positioning and manual legend placement_

### 🎨 Advanced Grid Line Styling

_New Jun 2024 • Apply: 6 minutes • Impact: HIGH_ ⭐ **RECOMMENDED**

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
    ],
}
```

_Replaces: Manual background bands and custom grid implementations_

### 📏 Spacing vs Padding Standardization

_New May 2024 • Apply: 3 minutes • Impact: Medium_

```typescript
// Context-specific usage of spacing and padding
legend: {
    spacing: 16, // Between legend and chart
    padding: 12, // Internal legend padding
}
```

_Replaces: Inconsistent padding properties across components_

### 🔧 Enhanced Tooltip Positioning

_New Apr 2024 • Apply: 8 minutes • Impact: High_

```typescript
tooltip: {
    position: {
        anchorTo: 'pointer', // 'node', 'cursor', 'pointer'
        placement: ['top', 'bottom'], // Fallback order
        xOffset: 10,
        yOffset: -10,
        constraints: 'never-flip', // 'flip-on-overflow'
    },
    wrapping: 'hyphenate', // 'normal', 'break-word', 'anywhere'
}
```

_Replaces: Manual tooltip positioning calculations and HTML-based tooltips_

### 🎭 Pattern & Gradient Enhancements

_New Mar 2024 • Apply: 10 minutes • Impact: Medium_

```typescript
fill: {
    type: 'pattern',
    pattern: 'forward-slanted-lines', // New stock patterns
    // Don't set fill/backgroundFill - theme handles pattern colors
    scale: 1.5,
    rotation: 45,
}
```

_Replaces: Custom SVG pattern definitions and manual pattern creation_

### 📊 Crosshair Label Enhancements

_Enterprise • New Feb 2024 • Apply: 7 minutes • Impact: Medium_

```typescript
crosshair: {
    label: {
        enabled: true,
        xOffset: 5,
        yOffset: -5,
        renderer: (params) => ({
            text: `${params.value}`,
            // Don't set color/backgroundColor - theme handles crosshair styling
            opacity: 0.9,
        }),
    },
}
```

_Replaces: Manual crosshair label positioning and custom hover indicators_

## 📜 Historic Feature Additions (1-2 Years)

### 🎬 Series Load Animations

_New May 2023 • Apply: 5 minutes • Impact: High_

```typescript
animation: {
    enabled: true,
    duration: 1200, // Animation duration in milliseconds
}
// Works across all series types with different entrance effects
```

_Replaces: Static chart loading and manual animation implementations_

### 📏 Axis Title Formatting

_New May 2023 • Apply: 8 minutes • Impact: Medium_

```typescript
axes: [
    {
        type: 'number', // Required
        position: 'left',
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

### 📐 Axis Label Rotation

_New Apr 2023 • Apply: 4 minutes • Impact: Low_

```typescript
axes: [
    {
        type: 'category', // Required
        position: 'bottom',
        label: {
            // ❌ Don't set fontSize - theme handles it
            rotation: 0, // Keep horizontal when possible (if needed)
            // ❌ Don't set fontFamily - breaks consistency
            // Don't set color - theme handles label colors
        },
    },
];
```

_Note: Only use rotation if labels truly overlap, otherwise leave default_

### 📊 Series Area Padding

_New Feb 2023 • Apply: 3 minutes • Impact: Medium_

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

### 🎯 Node Click Range Enhancement

_New Feb 2023 • Apply: 6 minutes • Impact: Medium_

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

### 🖱️ Node Double Click Handlers

_New Mar 2023 • Apply: 7 minutes • Impact: Low_

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

## 🔍 Feature Discovery Process

### Quarterly Updates (Every 3 months)

1. **Analyze Recent Commits**:

```bash
# In repository root, analyze recent ag-charts-types changes
git log --format="%h %ad %s" --date=short --since="3 months ago" -- "packages/ag-charts-types/" | head -30

# Look for feature additions in community package
git log --format="%h %ad %s" --date=short --since="3 months ago" -- "packages/ag-charts-community/" | grep -E "(add|Add|new|New)" | head -20
```

2. **Feature Discovery**:

    - Examine new TypeScript interfaces in `packages/ag-charts-types/src/`
    - Focus on options that enhance visual appeal
    - Check for new series types, styling options, or interaction features
    - Identify Enterprise vs Community feature classification

3. **Validation Requirements**:
    - API Contract Compliance: Verify against TypeScript interfaces
    - API Entrypoint Accuracy: Ensure correct usage
    - Enterprise Licensing: Clearly mark features requiring commercial license
    - Working Code: Test examples work as documented

## 📝 Maintenance Notes

### When Adding New Features

Use this format:

```markdown
### 🎯 Feature Name

_New MMM YYYY • Apply: X minutes • Impact: High/Medium/Low_ _(Enterprise if applicable)_

\`\`\`typescript
// Clear, working example
const chart = AgCharts.create({
// Feature-specific properties
});
\`\`\`

_Replaces: What manual implementations this native feature can replace_
```

### Section Organization

1. **Recently Added** (0-6 months): Latest cutting-edge features
2. **Previously Added** (6-12 months): Established recent features
3. **Historic** (1-2 years): Well-established foundational features

### Review Checklist

-   [ ] API Accuracy: Validated against `packages/ag-charts-types/src/`
-   [ ] Correct Entrypoints: Proper API calls specified
-   [ ] Enterprise Classification: Clear licensing requirements
-   [ ] Implementation Times: Realistic estimates
-   [ ] Impact Ratings: Based on visual enhancement
-   [ ] Replacement Value: Clear description of what this replaces

## 🎯 Priority Implementation

When updating examples, prioritize:

1. **High Impact + Low Effort** features first
2. **Visual improvements** over functional additions
3. **Theme-compatible** features (no hardcoded colors)
4. **Enterprise features** when they add significant value
5. **Recent additions** to showcase latest capabilities

Remember: The goal is to demonstrate AG Charts' latest capabilities while maintaining clean, professional examples.
