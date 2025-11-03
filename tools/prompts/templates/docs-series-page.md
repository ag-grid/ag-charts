# Documentation Template: Series Page

This template provides a standard structure for documenting AG Charts series types (e.g., Bar, Line, Pie, Area, Scatter, etc.).

**When to use**: When documenting a chart series type that visualizes data.

**Pattern**: Simple → Variations → Customization → Data → API Reference

---

## Template Structure

Replace `[SeriesName]` with the actual series name (e.g., "Bar", "Line", "Waterfall").
Replace `[series-type]` with the kebab-case series type (e.g., "bar", "line", "waterfall").
Replace `[SeriesType]` with PascalCase for TypeScript interfaces (e.g., "Bar", "Line", "Waterfall").

---

```markdown
---
title: '[SeriesName] Series'
description: '$framework [SeriesName] Charts [brief description of what they visualize and key capabilities]. Supports [list key features]. See API docs for more info.'
---

[Opening paragraph: Clearly state what the series does and primary use case]

A [SeriesName] Series [description of what it visualizes and when to use it].

## Simple [SeriesName]

[If series can be grouped/overlaid, mention the default behavior]

{% chartExampleRunner title="Simple [SeriesName]" name="simple-[series-type]" type="generated" /%}

To create a [SeriesName] Series, use the `'[series-type]'` series type.

```js format="snippet"
{
    series: [
        { type: '[series-type]', xKey: '[x-property]', yKey: '[y-property]', yName: '[Display Name]' },
        // ... additional series if applicable
    ],
}
```

In this configuration:

-   `xKey` [description of what this maps to, typically categories or time].
-   `yKey` [description of what this represents, typically numerical values].
-   `yName` configures display names, reflected in [Tooltip Titles](./tooltips/) and [Legend Items](./legend/).

[Add any series-specific required properties and their explanations]

## [Variation 1 Name]

[Description of this variation and when to use it]

{% chartExampleRunner title="[Variation Name]" name="[variation-example-name]" type="generated" /%}

[Explanation of how to enable this variation]

```js format="snippet"
{
    series: [
        { type: '[series-type]', [configuration for this variation] },
    ],
}
```

[Additional notes or important information about this variation]

## [Variation 2 Name]

[Repeat pattern for each major variation: Horizontal, Stacked, Normalized, Grouped, etc.]

## [Additional Variations as Needed]

[Continue with variations like Grouped Category, different data modes, etc.]

## Customisation

[Introduction to customization options available for this series]

{% chartExampleRunner title="Customised [SeriesName] Series" name="customised-[series-type]" type="generated" /%}

[Explanation of what customizations are shown in the example]

### [Customization Category 1]

[e.g., Labels, Markers, Corner Radius, Interpolation, etc.]

{% chartExampleRunner title="[Customization Name]" name="[customization-example]" type="generated" /%}

[Explanation of this customization]

```js format="snippet"
{
    series: [
        {
            type: '[series-type]',
            [customization configuration],
        },
    ],
}
```

[Additional notes, cross-references to API, or related features]

### [Customization Category 2]

[Repeat pattern for each major customization area]

## Data

[Optional section - only include if there are important data-specific considerations]

### [Data Handling Topic 1]

[e.g., Missing Data, Continuous Data, Data Format Requirements, etc.]

{% chartExampleRunner title="[SeriesName] with [Data Feature]" name="[data-example]" type="generated" /%}

-   [Key point about how data is handled]
-   [Additional points about data requirements or behavior]

```js format="snippet"
{
    series: [
        {
            type: '[series-type]',
            [data-related configuration],
        },
    ],
}
```

### [Data Handling Topic 2]

[e.g., Time Data, Hierarchical Data, etc.]

[Repeat pattern for other data-related topics]

## API Reference

{% tabs %}

{% tabItem id="Ag[SeriesType]SeriesOptions" label="[SeriesName] Series" %}
{% apiReference id="Ag[SeriesType]SeriesOptions" /%}
{% /tabItem %}

[If there are related interfaces, add additional tabs]
{% tabItem id="Ag[SeriesType][Feature]Options" label="[Feature Name]" %}
{% apiReference id="Ag[SeriesType][Feature]Options" /%}
{% /tabItem %}

{% /tabs %}
```

---

## Checklist for Series Pages

Before finalizing your series documentation:

- [ ] Opening paragraph clearly explains what the series does
- [ ] Simple example comes first, before variations
- [ ] Each variation has: example, explanation, code snippet
- [ ] Customization section shows visual styling options
- [ ] Data section included if relevant (missing data, continuous data, etc.)
- [ ] All examples exist in `_examples/` folder
- [ ] All examples are framework-compatible (no `@ag-skip-fws`)
- [ ] Configuration snippets use `format="snippet"`
- [ ] Cross-links to related features (tooltips, legend, axes, etc.)
- [ ] API Reference at end with correct interface name(s)
- [ ] Description in frontmatter uses `$framework` placeholder

---

## Examples of Series Pages

Reference these existing series pages for patterns:

- **`bar-series`**: Shows stacking, normalization, grouped stacks, horizontal orientation
- **`line-series`**: Shows customization, interpolation, missing data, continuous data
- **`pie-series`**: Shows labels (callout and sector), variable radius
- **`area-series`**: Shows stacking, normalization, markers, interpolation

---

## Common Series Variations

**For Cartesian Series** (bar, line, area, scatter, etc.):
- Simple [SeriesName]
- Horizontal [SeriesName] (if applicable)
- Stacked [SeriesName] (if applicable)
- Normalized [SeriesName] (if stacking supported)
- Grouped Stacks (if applicable)
- Grouped Category (if categorical)

**For Polar/Radial Series** (pie, donut, radar, etc.):
- Simple [SeriesName]
- Labels (if applicable)
- Variable Radius (if applicable)
- Inner/Outer Radius (if applicable)

**Common Customization Sections**:
- Labels
- Markers (for line-based series)
- Colors/Fills
- Strokes/Borders
- Corner Radius (for bar-like series)
- Interpolation (for line-based series)

**Common Data Sections**:
- Missing Data
- Continuous Data (time or number axes)
- Data Format Requirements
- Hierarchical Data (if applicable)

