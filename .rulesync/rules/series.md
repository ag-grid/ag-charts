---
root: false
targets: ['*']
description: 'Series development guide for AG Charts including architecture, performance patterns, and data flow'
globs: ['**/series/**/*.ts', '**/series/**/*.test.ts']
---

# Series Development Guide

This guide provides context for working with series code in AG Charts.

## Architecture

### Class Hierarchy

```
Series (base)
├── CartesianSeries
│   ├── LineSeries, AreaSeries, BarSeries, etc.
│   └── (Enterprise) WaterfallSeries, BoxPlotSeries, etc.
├── PolarSeries
│   ├── PieSeries, DonutSeries
│   └── (Enterprise) RadarSeries, RadialSeries, etc.
├── HierarchySeries
│   ├── TreemapSeries, SunburstSeries
│   └── (Enterprise) etc.
└── TopologySeries
    └── (Enterprise) SankeySeries, ChordSeries, etc.
```

-   Enterprise series extend community counterparts
-   Module system registers series types via `registerModule()`

### Key Files

**Community:**

-   `packages/ag-charts-community/src/chart/series/series.ts` - Base class (1,256 lines)
-   `packages/ag-charts-community/src/chart/series/seriesAreaManager.ts` - Layout management
-   `packages/ag-charts-community/src/chart/series/cartesian/cartesianSeries.ts` - Cartesian base

**Enterprise:**

-   `packages/ag-charts-enterprise/src/series/` - Enterprise-specific series
-   Series modules in `packages/ag-charts-enterprise/src/series/*/`

## Performance Patterns

### Critical Patterns

1. **Backing field access** - Use `@DeclaredSceneChangeDetection` decorators for property access optimisation
2. **Context caching** - Cache expensive computations in context objects passed through the pipeline
3. **Scratch objects** - Reuse temporary objects to avoid allocation in hot paths
4. **Deferred computation** - Delay expensive work until absolutely needed
5. **TypedArray usage** - Use TypedArrays for large numeric datasets

### Hotspots to Watch

-   `createNodeData()` - Called on data changes, must be efficient
-   `updateNodes()` - Called frequently during animation
-   Animation reset paths - Check for unnecessary recomputation
-   Property accessors - Avoid expensive getters in render loops

## Data Flow

```
Raw options
    ↓
createNodeData() → nodeData (array of datum objects)
    ↓
updateNodes() → Scene graph updates (nodes, labels, markers)
    ↓
Scene graph → Canvas rendering
```

### Key Methods

-   `createNodeData()` - Transform raw data into renderable datum objects
-   `updateNodes()` - Apply datum values to scene graph nodes
-   `updateNodeDatum()` - (New pattern) Update individual datum for reuse

## Current Refactoring

The `updateNodeDatum()` pattern is being introduced across series:

**Goals:**

-   Separate datum creation from node updates
-   Enable datum reuse across animation frames
-   Reduce memory allocation in hot paths

**Pattern:**

```typescript
protected updateNodeDatum(datum: MyDatum, { dataIndex }: { dataIndex: number }): void {
    const { xValue, yValue } = this.getNodeData()[dataIndex];
    datum.x = this.getScaledX(xValue);
    datum.y = this.getScaledY(yValue);
    // ... update other datum properties
}
```

## Module System Integration

Series are registered via modules:

```typescript
// In series module file
export const MySeriesModule: SeriesModule = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'community', // or 'enterprise'
    chartTypes: ['cartesian'],
    identifier: 'my-series',
    moduleFactory: (ctx) => new MySeries(ctx),
    tooltipDefaults: {
        /* ... */
    },
    themeTemplate: {
        /* ... */
    },
};
```

## Testing

-   Visual snapshots in `*.test.ts` files alongside series
-   Use `prepareTestOptions()` for community tests
-   Use `prepareEnterpriseTestOptions()` for enterprise tests
-   Verify warnings and assertions alongside visual snapshots

### Running Tests

```bash
# Test specific series
yarn nx test ag-charts-community --testPathPattern="barSeries"

# Test all series
yarn nx test ag-charts-community --testPathPattern="series"
```

## Common Tasks

### Adding a New Series Type

1. Create series class extending appropriate base (`CartesianSeries`, etc.)
2. Implement required abstract methods (`createNodeData`, `updateNodes`, etc.)
3. Create module definition with theme template
4. Register module in appropriate package
5. Add TypeScript types in `ag-charts-types`
6. Write visual snapshot tests
7. Document in website

### Modifying Existing Series

1. Check for performance implications
2. Update tests to cover new behaviour
3. Verify visual snapshots update correctly
4. Check enterprise extensions if modifying community series
