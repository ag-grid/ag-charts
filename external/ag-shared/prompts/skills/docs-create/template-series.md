# Series Page Template

Use this template when creating documentation for chart series types (bar, line, pie, etc.).

## Workflow

1. Load series page template from `.rulesync/skills/spruce-docs/docs-series-page.md`
2. Research `Ag<Name>SeriesOptions` interface in `packages/ag-charts-types/src/`
3. Review a similar series page for patterns (e.g., bar-series)
4. Create structure following progressive disclosure: Simple → Variations → Customisation → API

## Example: Creating a Waterfall Series Page

**Input:**
```
Page Type: series
Page Name: waterfall-series
Primary API Interface: AgWaterfallSeriesOptions
Description: Document the Waterfall Series which visualizes sequential positive and negative changes
Additional Context: Should cover positive/negative connectors, subtotals, line configuration
```

**Process:**
1. Load series page template
2. Research `AgWaterfallSeriesOptions` interface
3. Review bar-series for similar patterns
4. Create structure: Simple → Subtotals → Connectors → Customisation → API
5. Generate example specifications
6. Output complete page

## Typical Series Page Sections

1. **Frontmatter** — title, enterprise indicator
2. **Opening paragraph** — what the series visualises, primary use case
3. **Simple Example** — minimal configuration
4. **Data Format** — expected data shape
5. **Variations/Modes** — different series configurations
6. **Styling** — colours, labels, markers
7. **Advanced Features** — specific to the series type
8. **API Reference** — `AgChartOptions`, `Ag<Name>SeriesOptions`
