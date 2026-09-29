---
root: false
targets: ['*']
description: 'Series development guide for AG Charts including architecture and data flow'
globs: ['packages/ag-charts-community/src/**/series/**/*.ts', 'packages/ag-charts-enterprise/src/**/series/**/*.ts']
---

# Series Development Guide

## Architecture

`Series` (base) → `CartesianSeries` (Line/Area/Bar…), `PolarSeries` (Pie/Donut, enterprise Radar/Radial…), `HierarchySeries` (Treemap/Sunburst…), enterprise `FlowProportionSeries` (Sankey/Chord) and `TopologySeries` (Map series). Enterprise series extend community base classes; every series ships as a module that users register with `ModuleRegistry.registerModules()`.

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

## Performance

For any optimisation work — scene-change detection, batched property updates, allocation in hot paths — invoke `/ag-charts:optimize-series`. Reference implementations:

| Pattern              | Reference file                |
| -------------------- | ----------------------------- |
| Context caching      | `barSeries.ts`                |
| Backing fields       | `shape.ts`, `barShape.ts`     |
| Deferred aggregation | `deferredExecutor.ts`         |
| Animation reset      | `barUtil.ts`, `markerUtil.ts` |
| TypedArray reuse     | `barAggregation.ts`           |

## Module System Integration

Each series is a `SeriesModuleDefinition` (`packages/ag-charts-core/src/modules/moduleDefinition.ts`) in its `*SeriesModule.ts` file: `type: 'series'`, `name`, `version`, `chartType`, `options`, `themeTemplate`, `create` — see `barSeriesModule.ts`. What a module owns and how it is registered is covered by the `/module-definitions` skill.

## Testing

-   Visual snapshot tests live in `*.test.ts` alongside the series; use `prepareTestOptions()` (community) / `prepareEnterpriseTestOptions()` (enterprise)
-   When modifying community series, check enterprise extensions too
