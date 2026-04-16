# Feature Page Template

Use this template when creating documentation for chart-wide features (tooltips, legend, zoom, etc.).

## Workflow

1. Load feature page template from `.rulesync/skills/spruce-docs/docs-feature-page.md`
2. Research the relevant options interface in `packages/ag-charts-types/src/`
3. Review a similar feature page for patterns (e.g., legend, themes)
4. Create structure: Default → Position/Layout → Customisation → Advanced → API

## Example: Creating a Gradient Legend Page

**Input:**
```
Page Type: feature
Page Name: gradient-legend
Primary API Interface: AgChartGradientLegendOptions
Description: Document gradient legend feature for continuous color scales
Additional Context: Enterprise feature, applies to heatmaps and gradient series
```

**Process:**
1. Load feature page template
2. Research `AgChartGradientLegendOptions` interface
3. Review legend and themes pages for patterns
4. Create structure: Default → Position → Scale → Customisation → API
5. Mark as enterprise in frontmatter
6. Generate example specifications
7. Output complete page

## Typical Feature Page Sections

1. **Frontmatter** — title, enterprise indicator
2. **Opening paragraph** — what the feature does, when to use it
3. **Default Behaviour** — what happens out of the box
4. **Configuration** — key options and their effects
5. **Customisation** — styling, callbacks, renderers
6. **Advanced Usage** — edge cases, integration with other features
7. **API Reference** — relevant interfaces
