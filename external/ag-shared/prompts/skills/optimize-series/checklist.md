# Optimization Checklist for New Series Types

Use this checklist when applying the optimisation patterns to a new series type. For detailed pattern explanations, see the relevant sub-docs.

## Node Class (e.g., `OhlcBaseNode`, `CandlestickNode`)

- [ ] **Migrate to `@Declared*` decorators and add `declare __fieldName`**

    Use `@DeclaredSceneChangeDetection` instead of `@SceneChangeDetection` for type-safe backing field access:

    ```typescript
    // Before (no type safety):
    @SceneChangeDetection()
    centerX: number = 0;

    // After (type-safe - TypeScript enforces matching types):
    @DeclaredSceneChangeDetection()
    centerX: number = 0;
    declare __centerX: number; // Must match property type

    @DeclaredSceneChangeDetection()
    width: number = 0;
    declare __width: number;

    @DeclaredSceneChangeDetection()
    crisp: boolean = false;
    declare __crisp: boolean;
    ```

    **Note**: The `@Declared*` decorators will cause TypeScript errors if the `declare` statement type doesn't match the property type, catching bugs at compile time.

- [ ] **Create `setStaticProperties()` method**

    ```typescript
    setStaticProperties(
        centerX: number,
        width: number,
        y: number,
        height: number,
        yOpen: number,
        yClose: number,
        crisp: boolean
    ): void {
        this.__centerX = centerX;
        this.__width = width;
        this.__y = y;
        this.__height = height;
        this.__yOpen = yOpen;
        this.__yClose = yClose;
        this.__crisp = crisp;

        this.dirtyPath = true;
        this.markDirty();
    }
    ```

- [ ] **Use backing fields in `updatePath()` and render methods**
    ```typescript
    override updatePath() {
        const {
            __centerX: centerX,
            __width: width,
            __y: y,
            __height: height,
        } = this;
        // ...
    }
    ```

## Series Class (e.g., `OhlcSeriesBase`)

### Context and Caching

- [ ] **Create context interface**

    ```typescript
    interface OhlcSeriesNodeDatumContext {
        readonly rawData: { data: any[] } | undefined;
        readonly xValues: any[];
        readonly openValues: any[];
        readonly closeValues: any[];
        // ... other cached values
        readonly canIncrementallyUpdate: boolean;
        nodes: OhlcNodeDatum[];
        nodeIndex: number;
    }
    ```

- [ ] **Create `createNodeDatumContext()` method**

- [ ] **Create scratch object in `createNodeData()`**

### `createNodeData()` Decomposition

- [ ] **Decompose monolithic `createNodeData()`** following the pattern:

    ```
    createNodeData()
    +-- createNodeDatumContext()
    +-- computeXPosition() / position helper
    +-- nodeDatumParamsScratch
    +-- [Strategy Selection]
    |   +-- createNodeDataWithAggregation()
    |   +-- createNodeDataSimple()
    +-- upsertNodeDatum()
    |   +-- createNodeDatum()
    |   +-- updateNodeDatum()
    +-- [Result Assembly]
    ```

- [ ] **Extract strategy methods** for different data paths:
    - `createNodeDataSimple()` - ungrouped data iteration
    - `createNodeDataWithAggregation()` - aggregated data (if applicable)

- [ ] **Create node lifecycle methods**:
    - `prepareNodeDatumState()` - validation and state preparation
    - `createSkeletonNodeDatum()` - minimal node creation
    - `createNodeDatum()` - skeleton + update
    - `updateNodeDatum()` - in-place property updates
    - `upsertNodeDatum()` - create vs update decision

### Node Updates

- [ ] **Create `updateNodeDatum()` for in-place updates**

- [ ] **Create `upsertNodeDatum()` to handle create vs update**

- [ ] **Update `updateDatumNodes()` to use `setStaticProperties()`**

    ```typescript
    // Before:
    node.centerX = centerX;
    node.width = width;
    node.y = y;
    // ... 7 property assignments = 7 markDirty() calls

    // After:
    node.setStaticProperties(centerX, width, y, height, yOpen, yClose, crisp);
    // = 1 markDirty() call
    ```

- [ ] **Use context values instead of repeated lookups**

### Animation Optimisation

- [ ] **Override `resetDatumAnimation()` to use `resetBarSelectionsDirect()`**

    ```typescript
    protected override resetDatumAnimation(data: YourAnimationData) {
        resetBarSelectionsDirect([data.datumSelection]);
    }
    ```

### Selection Update Optimisation

- [ ] **Skip datum ID computation when animation is not supported**

    ```typescript
    protected override updateDatumSelection(opts: {
        nodeData: YourNodeDatum[];
        datumSelection: Selection<YourNode, YourNodeDatum>;
    }) {
        if (!processedDataIsAnimatable(this.processedData!)) {
            // Optimised update path, no need to match nodes by id.
            return opts.datumSelection.update(opts.nodeData);
        }
        return opts.datumSelection.update(opts.nodeData, undefined, (datum) => this.getDatumId(datum));
    }
    ```

    **Important**: Use `processedDataIsAnimatable()` NOT `animationManager.isSkipped()`. The former ensures consistent ID assignment based on data count threshold, while the latter can temporarily skip IDs during user interactions, breaking subsequent animations.

### Label Optimisation

- [ ] **Skip label formatting when labels are disabled**
    - Add `labelEnabled` to context interface
    - Check `ctx.labelEnabled` or `label.enabled` before calling `getLabelText()`
    - For separate label update methods: return early and clear label arrays when disabled

---

## Series-Specific Notes

### OHLC/Candlestick

**Current state** (optimisations applied):

- Uses `setStyleProperties()` from Shape
- Has `@DeclaredSceneChangeDetection()` decorators with `declare __fieldName` backing fields
- Has `setStaticProperties()` methods on node classes (`OhlcNode`, `CandlestickNode`)
- Has context object caching (`OhlcSeriesNodeDatumContext`)
- Has scratch object pattern (`PreparedOhlcNodeDatumState`)
- Has incremental node updates (`updateNodeDatum()`, `upsertNodeDatum()`)
- Has deferred aggregation computation (`aggregateOhlcDataFromDataModelPartial()`)
- Has TypedArray reuse with `valueData` stored in filter interface
- Uses `dataModel.resolveColumnNeedsValueOf()` for correct `xNeedsValueOf`/`yNeedsValueOf`
- Overrides `resetDatumAnimation()` with `resetOhlcSelectionsDirect()` (animation hotspot fix)
- Overrides `updateDatumSelection()` to skip datum ID computation when animation disabled
- Uses shared `getMidpointsForIndices()` from aggregation.ts for midpoint calculation

**Key implementation details**:

1. **Filter interface includes `valueData`** for compaction array reuse:

    ```typescript
    export interface OhlcSeriesDataAggregationFilter {
        indexData: Uint32Array;
        valueData: Float64Array; // Required for compaction reuse
        maxRange: number;
        midpointIndices: Uint32Array;
    }
    ```

2. **Custom compaction loop** (not `collectAggregationLevels()`):

    ```typescript
    while (maxRange > AGGREGATION_MIN_RANGE) {
        const nextExistingFilter = existingFilters?.find((f) => f.maxRange === nextMaxRange);
        const compacted = compactAggregationIndices(indexData, valueData, currentMaxRange, {
            reuseIndexData: nextExistingFilter?.indexData,
            reuseValueData: nextExistingFilter?.valueData,
        });
        // ...
    }
    ```

3. **Helper functions accept reuse parameters**:
    ```typescript
    function getMidpoints(maxRange: number, indexData: Uint32Array, reuseMidpointData?: Uint32Array): Uint32Array;
    ```

**Reference files**:

- `packages/ag-charts-enterprise/src/series/ohlc/ohlcSeriesBase.ts`
- `packages/ag-charts-enterprise/src/series/ohlc/ohlcNode.ts`
- `packages/ag-charts-enterprise/src/series/ohlc/ohlcAggregation.ts`
- `packages/ag-charts-enterprise/src/series/candlestick/candlestickNode.ts`
- `packages/ag-charts-enterprise/src/series/candlestick/candlestickSeries.ts`

### RangeBarSeries

**Current state** (optimisations applied):

- Uses `setStyleProperties()` from Shape
- Has `@DeclaredSceneChangeDetection()` decorators with `declare __fieldName` backing fields
- Has context object caching (`RangeBarSeriesNodeDatumContext`)
- Has scratch object pattern (`PreparedRangeBarNodeDatumState`)
- Has incremental node updates (`updateNodeDatum()`, `upsertNodeDatum()`)
- Has deferred aggregation computation (`aggregateRangeBarDataFromDataModelPartial()`)
- Has TypedArray reuse with `valueData` stored in filter interface
- Uses `dataModel.resolveColumnNeedsValueOf()` for correct `xNeedsValueOf`/`yNeedsValueOf`
- Overrides `resetDatumAnimation()` with `resetBarSelectionsDirect()` (animation hotspot fix)
- Overrides `updateDatumSelection()` to skip datum ID computation when animation disabled
- Skips label formatting when labels disabled
- Uses shared `getMidpointsForIndices()` from aggregation.ts for midpoint calculation

**Reference files**:

- `packages/ag-charts-enterprise/src/series/range-bar/rangeBarSeries.ts`
- `packages/ag-charts-enterprise/src/series/range-bar/rangeBarAggregation.ts`

### LineSeries

**Current state** (optimisations applied):

- Uses `@DeclaredSceneChangeDetection()` decorators with `declare __fieldName` backing fields on Marker class
- Has context object caching (`LineSeriesDatumContext`)
- Has scratch object pattern (`LineNodeDatumScratch`)
- Has deferred aggregation computation via `AggregationManager`
- Has `createNodeData()` decomposition with `handleDatum()` method
- Overrides `resetDatumAnimation()` with `resetMarkerSelectionsDirect()` (marker animation hotspot fix)
- Marker class has `resetAnimationProperties()` for direct backing field writes
- Uses `resetScalingProperties()` to properly trigger transform matrix recalculation

**Key implementation details**:

1. **Marker transform handling** - Markers use `Scalable` mixin which requires special care:

    ```typescript
    // In Marker.resetAnimationProperties()
    this.__x = x;
    this.__y = y;
    this.__size = size;
    this.__opacity = opacity;
    // Use encapsulated method that triggers onChangeDetection()
    this.resetScalingProperties(scalingX, scalingY, x, y);
    this.dirtyPath = true;
    this.markDirty();
    ```

2. **Size preservation** - Original `resetMotion` behaviour doesn't reset marker size, so `resetMarkerSelectionsDirect` must preserve `node.size`:

    ```typescript
    node.resetAnimationProperties(x, y, node.size, 1, 1, 1); // NOT datum.point.size
    ```

**Reference files**:

- `packages/ag-charts-community/src/chart/series/cartesian/lineSeries.ts`
- `packages/ag-charts-community/src/chart/series/cartesian/lineUtil.ts`
- `packages/ag-charts-community/src/chart/series/cartesian/lineAggregation.ts`
- `packages/ag-charts-community/src/chart/series/cartesian/markerUtil.ts`
- `packages/ag-charts-community/src/chart/marker/marker.ts`
- `packages/ag-charts-community/src/scene/transformable.ts`

### AreaSeries

**Current state** (optimisations applied):

- Uses `setStyleProperties()` from Shape
- Has context object caching (`AreaSeriesCreateNodeDatumContext`)
- Has scratch object pattern (`AreaNodeDatumScratch`)
- Has `createNodeData()` decomposition (`createNodeDatumContext()`, `handleDatum()`, `computeMarkerCoordinate()`)
- Has incremental node updates (reuses existing marker data when structure unchanged)
- Overrides `resetDatumAnimation()` with `resetMarkerSelectionsDirect()` (marker animation hotspot fix)
- Overrides `updateDatumSelection()` to skip datum ID computation when animation disabled
- Skips label formatting when labels disabled (`ctx.labelsEnabled` check)
- Has deferred aggregation computation via `AggregationManager`
- Has partial aggregation function (`aggregateAreaDataFromDataModelPartial()`)

**Key architectural differences from LineSeries**:

1. **Stacking support**: AreaSeries has stacking via `seriesBelowStackContext`, similar to BarSeries
2. **Dual paths**: Fill path + stroke path + phantom spans (for area fill closure)
3. **Span generation lifecycle**: Spans are generated in `createStackContext()`, separate from `createNodeData()`
4. **Full TypedArray aggregation**: All aggregation arrays use TypedArrays (`indices`, `metaIndices`, `indexData`, `valueData`)

**Area-specific considerations**:

- **Phantom spans**: Define the "bottom" of the area fill, MUST be synchronised with fill spans
- **metaIndices**: Track aggregation bucket boundaries for proper fill path closure in `plotAreaPathFill()`
- **Stack context lifecycle**: `createStackContext()` runs BEFORE `createNodeData()`, so span arrays (`fillSpans`, `strokeSpans`, `phantomSpans`) are already populated
- **Full TypedArray reuse**: All filter arrays use TypedArrays (`Uint32Array` for `indices`, `metaIndices`, `indexData`; `Float64Array` for `valueData`)
- **Two-pass approach for indices/metaIndices**: Since these are built incrementally, uses count-then-populate pattern to enable TypedArray reuse

**Reference files**:

- `packages/ag-charts-community/src/chart/series/cartesian/areaSeries.ts`
- `packages/ag-charts-community/src/chart/series/cartesian/areaAggregation.ts`
- `packages/ag-charts-community/src/chart/series/cartesian/areaUtil.ts`
- `packages/ag-charts-community/src/chart/series/cartesian/markerUtil.ts`

### Histogram Series

**Focus areas**:

- Similar to BarSeries (uses Rect nodes)
- Bin calculation caching
- Can likely reuse much of BarSeries optimisation infrastructure

---

## Measuring Impact

Use the benchmark suite to verify optimisations:

```bash
# Run benchmarks for specific series
yarn nx benchmark ag-charts-community -- -t "bar.*volume"
yarn nx benchmark ag-charts-enterprise -- -t "ohlc|candlestick"

# Enable debug mode for memory profiling
AG_BENCHMARK_DEBUG=1 yarn nx benchmark ag-charts-community
```

Key metrics to track:

- Frame render time (target: < 16ms for 60fps)
- GC pause frequency
- Memory allocation rate during animation
- Node update throughput (nodes/ms)

---

## Common Pitfalls

1. **Don't bypass decorators for properties that need change callbacks**
    - `fill` and `stroke` have `onFillChange()` / `onStrokeChange()` callbacks
    - Use normal setters for these, or call callbacks manually after direct writes

2. **Remember to call `markDirty()` after direct field writes**
    - Scene graph won't re-render without this

3. **Don't over-optimise cold paths**
    - Initial setup, configuration changes don't need optimisation
    - Focus on per-frame rendering hot paths

4. **Test with large datasets**
    - Optimisations matter most with 1000+ data points
    - Always benchmark before and after

5. **Don't use `collectAggregationLevels()` when you need array reuse**
    - This utility doesn't pass reuse arrays to `compactAggregationIndices()`
    - Use a custom while loop instead (see BarAggregation pattern)

6. **Don't forget `valueData` in aggregation filter interfaces**
    - If you only store `indexData`, you can't reuse arrays during compaction
    - Both `indexData` AND `valueData` must be stored and passed for full reuse

7. **Verify `existingFilters` is actually being used**
    - It's easy to add `existingFilters` to the parameter list but forget to pass it to the actual aggregation functions
    - Check that `existingFilters` is passed to both `createAggregationIndices()` (via `reuseIndexData`/`reuseValueData`) AND `compactAggregationIndices()`
    - Don't just mark it `void existingFilters` - trace the parameter through all aggregation paths

8. **Don't default `xNeedsValueOf`/`yNeedsValueOf` to `true`**
    - Use `dataModel.resolveColumnNeedsValueOf()` to detect actual need
    - Unnecessary `.valueOf()` calls on plain numbers cause significant overhead

9. **Don't forget to pass reuse arrays to helper functions**
    - Functions like `getMidpoints()` should accept optional reuse parameters
    - Check array size matches before reusing: `reuse && reuse.length === required`

10. **Transform matrix dirty flag for Scalable/Rotatable/Translatable mixins**
    - When bypassing decorators to write to `__scalingX`, `__scalingY`, etc., you MUST call `onChangeDetection()` afterward
    - The `MatrixTransformInternal` class uses `_dirtyTransform` flag which is only set by `onChangeDetection()`
    - Without this, `computeTransformMatrix()` will early-exit and the transform matrix won't be recalculated
    - Symptom: incorrect marker/node positioning during animations (visible in snapshot tests)
    - Solution: Encapsulate the reset in a method like `resetScalingProperties()` that calls `this.onChangeDetection('scaling')` after writing backing fields

11. **Match original reset behaviour when creating direct reset functions**
    - When replacing `resetMotion(selections, callback)` with a direct reset function, ensure you reset the **same properties** in the **same way**
    - Example: The original `resetMarkerFn` + `resetMarkerPositionFn` does NOT reset marker `size`, so `resetMarkerSelectionsDirect` must preserve `node.size`
    - Check the `animationResetFns.datum` callback to see exactly what properties are being reset
    - Mismatched behaviour causes subtle animation bugs visible in mid-animation snapshot tests

12. **Prefer TypedArrays with two-pass approach over regular arrays with push()**
    - When building index arrays incrementally, use a two-pass approach instead of `push()`:
        - First pass: count how many elements will be added
        - Second pass: allocate correctly-sized TypedArray and populate it
    - This enables TypedArray reuse (if sizes match) and reduces GC pressure
    - Example: LineSeries and AreaSeries both use `Uint32Array` for `indices` and `metaIndices`
    - The extra pass is negligible compared to allocation savings in high-frequency updates
