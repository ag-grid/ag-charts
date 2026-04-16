---
targets: ['*']
name: optimize-series
description: 'Comprehensive series performance optimization guide. Use when optimizing rendering performance, reducing GC pressure, or implementing incremental updates.'
context: fork
---

# Series Performance Optimization Guide

This guide documents the performance optimisation patterns applied to BarSeries as part of AG-16239 and provides a checklist for applying these optimisations to other series types (OHLC, Candlestick, Area, Line, Histogram, etc.).

> **Reference Implementation**: When in doubt, refer to BarSeries and its related utilities as the canonical example. Key files:
>
> - `packages/ag-charts-community/src/chart/series/cartesian/barSeries.ts`
> - `packages/ag-charts-community/src/chart/series/cartesian/barAggregation.ts`
> - `packages/ag-charts-community/src/scene/shape/barShape.ts`
> - `packages/ag-charts-community/src/scene/shape/rect.ts`
> - `packages/ag-charts-community/src/scene/shape/shape.ts`
> - `packages/ag-charts-community/src/util/deferredExecutor.ts`

## Optimisation Categories

| Category | Sub-Doc | When to Use |
|----------|---------|-------------|
| Memory/GC | `memory-gc.md` | Reducing object allocations in hot paths (scratch objects, TypedArray reuse, incremental updates, BBox reuse) |
| Decorator Bypass | `decorator-bypass.md` | Avoiding property setter overhead (`DeclaredSceneChangeDetection`, backing fields, batched property setting, direct animation resets) |
| Data Processing | `data-processing.md` | Minimising redundant computation (`createNodeData()` decomposition, valueOf detection, datum ID skip, label skip) |
| Deferred Computation | `deferred-computation.md` | Scheduling non-critical work for idle time (`AggregationManager`, partial aggregation, `requestIdleCallback`) |
| Implementation Checklist | `checklist.md` | Applying optimisations to a new series type (step-by-step checklist, series-specific notes, common pitfalls, benchmarking) |

## Quick Reference

### Memory/GC (see `memory-gc.md`)

- **Context object caching**: Create a context interface per `createNodeData()` call that caches data arrays, scales, computed offsets, and boolean flags. Avoids repeated lookups in loops.
- **Scratch object reuse**: Pre-allocate a scratch object before loops and mutate it in place. Reduces 1000+ allocations to 1 per render.
- **Incremental node updates**: Check `processedData.changeDescription` and reuse existing node datum objects via `upsertNodeDatum()` pattern. Use `Mutable<T>` for in-place writes.
- **BBox in-place updates**: Update existing BBox properties directly instead of allocating new BBox objects.
- **TypedArray reuse**: Store ALL TypedArrays (`indexData` AND `valueData`) in filter interfaces. Use custom while loops for compaction (not `collectAggregationLevels()`). Pass reuse arrays to helper functions.
- **Two-pass TypedArray indices**: Count first, allocate/reuse second. Enables TypedArray reuse for `indices` and `metaIndices`.

### Decorator Bypass (see `decorator-bypass.md`)

- **`@DeclaredSceneChangeDetection`**: Always use over `@SceneChangeDetection` for type-safe `declare __fieldName` backing fields. Access backing fields directly in render methods and hot loops.
- **`setStyleProperties()` / `setStaticProperties()`**: Write directly to backing fields and call `markDirty()` once instead of per-property. Reduces N `markDirty()` calls to 1.
- **`resetBarSelectionsDirect()`**: Override `resetDatumAnimation()` for bar-like series to bypass `resetMotion()` callback overhead. ~9-15% faster on 100k points.
- **`resetMarkerSelectionsDirect()`**: Override `resetDatumAnimation()` for marker-based series. Must call `resetScalingProperties()` which triggers `onChangeDetection()` for transform matrix recalculation.

### Data Processing (see `data-processing.md`)

- **`createNodeData()` decomposition**: Split into `createNodeDatumContext()`, strategy methods (`createNodeDataSimple()`, `createNodeDataWithAggregation()`), and node lifecycle methods (`upsertNodeDatum()`, `createNodeDatum()`, `updateNodeDatum()`).
- **`xNeedsValueOf` / `yNeedsValueOf`**: Use `dataModel.resolveColumnNeedsValueOf()` instead of defaulting to `true`. Eliminates ~20ms overhead for plain numbers on 10k points.
- **Skip datum ID when animation disabled**: Use `processedDataIsAnimatable()` (NOT `animationManager.isSkipped()`) to skip `getDatumId` callback. ~18-30% faster on 100k points.
- **Skip label formatting**: Check `label.enabled` before `getLabelText()`. ~12-17% faster when labels disabled.

### Deferred Computation (see `deferred-computation.md`)

- **`AggregationManager`**: Shared class that computes only the immediately-needed aggregation level synchronously and defers remaining levels via `requestIdleCallback`. Use `ensureLevelForRange()` to force computation on demand.
- **Partial aggregation functions**: Create `*Partial` versions that return `{ immediate, computeRemaining }`. Both partial and full functions accept `existingFilters` for array reuse.

## Key File Locations

```
packages/ag-charts-community/src/
+-- chart/
|   +-- marker/marker.ts              # Marker with resetAnimationProperties()
|   +-- series/
|       +-- aggregation.ts            # Shared helpers (getMidpointsForIndices)
|       +-- cartesian/
|           +-- barSeries.ts          # Main reference implementation
|           +-- barAggregation.ts     # Bar-specific aggregation
|           +-- barUtil.ts            # resetBarSelectionsDirect()
|           +-- lineSeries.ts         # Line with marker reset override
|           +-- lineAggregation.ts    # Line aggregation (two-pass indices)
|           +-- areaSeries.ts         # Area with marker reset override
|           +-- areaAggregation.ts    # Area aggregation (two-pass indices/metaIndices)
|           +-- markerUtil.ts         # resetMarkerSelectionsDirect()
+-- scene/
|   +-- transformable.ts              # Scalable/Rotatable mixins, resetScalingProperties()
|   +-- shape/
|       +-- shape.ts                  # Base shape with setStyleProperties()
|       +-- rect.ts                   # Rect with backing fields
|       +-- barShape.ts              # BarShape with setStaticProperties()
+-- motion/resetMotion.ts             # Base resetMotion (slower, callback-based)
+-- util/deferredExecutor.ts          # Deferred computation utility

packages/ag-charts-enterprise/src/series/
+-- range-bar/
|   +-- rangeBarSeries.ts             # RangeBar implementation
|   +-- rangeBarAggregation.ts        # RangeBar aggregation
+-- ohlc/
    +-- ohlcSeriesBase.ts             # OHLC implementation
    +-- ohlcAggregation.ts            # OHLC aggregation
```
