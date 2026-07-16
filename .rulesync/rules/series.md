---
root: false
targets: ['*']
description: 'Series development guide for AG Charts including architecture and data flow'
globs: ['**/series/**/*.ts']
---

# Series Development Guide

## Architecture

`Series` (base) → `CartesianSeries` (Line/Area/Bar…), `PolarSeries` (Pie/Donut, enterprise Radar/Radial…), `HierarchySeries` (Treemap/Sunburst…), `TopologySeries` (enterprise Sankey/Chord…). Enterprise series extend community counterparts and register via `registerModule()`.

**Key files:**

-   `packages/ag-charts-community/src/chart/series/series.ts` — base class
-   `packages/ag-charts-community/src/chart/series/cartesian/cartesianSeries.ts` — cartesian base
-   `packages/ag-charts-enterprise/src/series/*/` — enterprise series modules

## Data Flow

```
Raw options → createNodeData() → nodeData → updateNodes() → scene graph → canvas
```

-   `createNodeData()` — transform raw data into renderable datum objects; called on data changes, must be efficient
-   `updateNodes()` — apply datum values to scene graph nodes; called frequently during animation
-   `updateNodeDatum()` — newer pattern being introduced across series: separates datum creation from node updates so datums are reused across animation frames, reducing allocation in hot paths

For performance work, see `series-performance-optimization.md` / the `optimize-series` skill.

## Module System Integration

Series register via a `SeriesModule` definition (`type: 'series'`, `optionsKey: 'series[]'`, `packageType`, `chartTypes`, `identifier`, `moduleFactory`, `tooltipDefaults`, `themeTemplate`) in the series module file.

## Testing

-   Visual snapshot tests live in `*.test.ts` alongside the series; use `prepareTestOptions()` (community) / `prepareEnterpriseTestOptions()` (enterprise)
-   When modifying community series, check enterprise extensions too
