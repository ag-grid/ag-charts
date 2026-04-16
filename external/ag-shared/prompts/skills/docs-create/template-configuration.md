# Configuration Page Template

Use this template when creating documentation for configuration areas (axes, layout, etc.).

## Workflow

1. Load configuration page template from `.rulesync/skills/spruce-docs/docs-configuration-page.md`
2. Research the relevant options interface in `packages/ag-charts-types/src/`
3. Review a similar configuration page for patterns (e.g., axes-types)
4. Create structure: Overview → Key Options → Formatting → Advanced → API

## Example: Creating an Axes Labels Page

**Input:**
```
Page Type: configuration
Page Name: axes-labels
Primary API Interface: AgAxisLabelOptions
Description: Document axis label configuration including formatting, rotation, and padding
```

**Process:**
1. Load configuration page template
2. Research `AgAxisLabelOptions` interface
3. Review axes-types for patterns
4. Create structure: Overview → Formatting → Rotation → Padding → API
5. Generate examples for each configuration area
6. Output complete page

## Typical Configuration Page Sections

1. **Frontmatter** — title
2. **Opening paragraph** — what this configures, why it matters
3. **Overview** — key concepts
4. **Configuration Options** — one section per major option group
5. **Formatting** — formatters, templates
6. **Advanced** — edge cases, performance
7. **API Reference** — relevant interfaces
