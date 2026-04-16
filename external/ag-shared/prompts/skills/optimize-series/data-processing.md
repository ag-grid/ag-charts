# Data Processing Optimization Patterns

These patterns minimise redundant computation in data processing, node creation, and update paths.

## 1. `createNodeData()` Decomposition Pattern

**Problem**: Monolithic `createNodeData()` methods become difficult to maintain, test, and optimise. They often mix concerns: context setup, data iteration strategies, node creation logic, and result assembly.

**Solution**: Decompose `createNodeData()` into a clean architecture with specialised methods for each concern.

**BarSeries Architecture** (`barSeries.ts:1105-1182`):

```
createNodeData()
+-- createNodeDatumContext()     -> Creates cached context object
+-- computeXPosition()           -> Pure position calculation helper
+-- nodeDatumParamsScratch       -> Pre-allocated scratch object
|
+-- [Strategy Selection]
|   +-- createNodeDataWithAggregation()  -> Aggregated data path
|   +-- createNodeDataGrouped()          -> Grouped data path
|   +-- createNodeDataSimple()           -> Simple ungrouped path
|
+-- upsertNodeDatum()            -> Create vs update decision
|   +-- createNodeDatum()        -> New node creation
|   |   +-- createSkeletonNodeDatum()
|   |   +-- updateNodeDatum()
|   +-- updateNodeDatum()        -> In-place update
|       +-- prepareNodeDatumState()
|
+-- [Result Assembly]            -> Trim arrays, build return object
```

**Key Methods and Their Responsibilities**:

```typescript
/**
 * Main entry point - orchestrates the decomposed methods.
 * Kept thin: setup, strategy selection, cleanup.
 */
createNodeData() {
    const xAxis = this.getCategoryAxis();
    const yAxis = this.getValueAxis();
    if (!this.dataModel || !this.processedData || !xAxis || !yAxis) return;

    // 1. Create shared context (instantiated once)
    const ctx = this.createNodeDatumContext(xAxis, yAxis);
    if (!ctx) return;

    // 2. Create position helper (uses context)
    const xPosition = (index: number): number => this.computeXPosition(ctx, index);

    // 3. Pre-allocate scratch object
    const nodeDatumParamsScratch: NodeDatumParams = { /* ... */ };

    // 4. Strategy selection - delegate to specialised methods
    if (ctx.dataAggregationFilter != null) {
        this.createNodeDataWithAggregation(ctx, xPosition, nodeDatumParamsScratch);
    } else if (this.processedData.type === 'grouped') {
        this.createNodeDataGrouped(ctx, xPosition, nodeDatumParamsScratch);
    } else {
        this.createNodeDataSimple(ctx, xPosition, nodeDatumParamsScratch);
    }

    // 5. Cleanup: trim excess nodes from incremental updates
    if (ctx.canIncrementallyUpdate) {
        if (ctx.nodeIndex < ctx.nodes.length) {
            ctx.nodes.length = ctx.nodeIndex;
        }
    }

    // 6. Return result
    return {
        itemId: this.properties.yKey,
        nodeData: ctx.nodes,
        // ...
    };
}
```

**Strategy Methods - Data Iteration Patterns**:

```typescript
/**
 * Aggregation path: processes pre-aggregated buckets for large datasets.
 * Each bucket represents multiple data points collapsed into one visual element.
 */
private createNodeDataWithAggregation(
    ctx: BarSeriesNodeDatumContext,
    xPosition: (index: number) => number,
    nodeDatumParamsScratch: NodeDatumParams
): void {
    for (let p = 0; p < 2; p += 1) {
        const positive = p === 0;
        const indices = positive
            ? ctx.dataAggregationFilter!.positiveIndices
            : ctx.dataAggregationFilter!.negativeIndices;

        const visibleRange = this.visibleRangeIndices('xValue', ctx.xAxis.range, indices);

        for (let i = visibleRange[0]; i < visibleRange[1]; i += 1) {
            // Populate scratch object with aggregated values
            nodeDatumParamsScratch.datumIndex = yMaxIndex;
            nodeDatumParamsScratch.x = x;
            nodeDatumParamsScratch.width = width;
            // ...

            this.upsertNodeDatum(ctx, nodeDatumParamsScratch);
        }
    }
}

/**
 * Grouped path: processes data organised into groups (e.g., stacked bars).
 */
private createNodeDataGrouped(
    ctx: BarSeriesNodeDatumContext,
    xPosition: (index: number) => number,
    nodeDatumParamsScratch: NodeDatumParams
): void {
    const groups = (this.processedData as GroupedData<any>).groups;
    const visibleRange = visibleRangeIndices(1, groups.length, ctx.xAxis.range, ...);

    for (let groupIndex = visibleRange[0]; groupIndex < visibleRange[1]; groupIndex++) {
        const group = groups[groupIndex];
        for (const relativeDatumIndex of group.datumIndices[columnIndex]) {
            // Populate scratch and upsert
            this.upsertNodeDatum(ctx, nodeDatumParamsScratch);
        }
    }
}

/**
 * Simple path: direct iteration over ungrouped data.
 */
private createNodeDataSimple(
    ctx: BarSeriesNodeDatumContext,
    xPosition: (index: number) => number,
    nodeDatumParamsScratch: NodeDatumParams
): void {
    const visibleRange = this.visibleRangeIndices('xValue', ctx.xAxis.range);

    for (let datumIndex = visibleRange[0]; datumIndex < visibleRange[1]; datumIndex++) {
        if (ctx.yRawValues[datumIndex] == null) continue;

        nodeDatumParamsScratch.datumIndex = datumIndex;
        nodeDatumParamsScratch.x = xPosition(datumIndex);
        // ...

        this.upsertNodeDatum(ctx, nodeDatumParamsScratch);
    }
}
```

**Node Creation/Update Methods**:

```typescript
/**
 * Decision point: reuse existing node or create new one.
 * Centralises the incremental update logic.
 */
private upsertNodeDatum(ctx: Context, params: NodeDatumParams) {
    const canReuseNode = ctx.canIncrementallyUpdate && ctx.nodeIndex < ctx.nodes.length;

    if (canReuseNode) {
        // Update existing node in-place
        this.updateNodeDatum(ctx, ctx.nodes[ctx.nodeIndex], params);
    } else {
        // Create new node
        const result = this.createNodeDatum(ctx, params);
        if (result.nodeData) {
            ctx.nodes.push(result.nodeData);
        }
    }
    ctx.nodeIndex++;
}

/**
 * Validates and prepares state needed for node creation/update.
 * Returns undefined if datum should be skipped.
 */
private prepareNodeDatumState(
    ctx: Context,
    scratch: PreparedState,
    datumIndex: number,
    yStart: number,
    yEnd: number
): PreparedState | undefined {
    if (!Number.isFinite(yEnd)) return undefined;

    const xValue = ctx.xValues[datumIndex];
    if (xValue == null) return undefined;

    // Populate scratch with validated, computed values
    scratch.datum = ctx.rawData?.data[datumIndex];
    scratch.xValue = xValue;
    scratch.yRawValue = ctx.yRawValues[datumIndex];
    // ...

    return scratch;
}

/**
 * Creates a minimal skeleton node - actual values set by updateNodeDatum.
 */
private createSkeletonNodeDatum(ctx: Context, params: NodeDatumParams): NodeDatum {
    return {
        series: this,
        itemId: ctx.yKey,
        datum: undefined,      // Set by updateNodeDatum
        x: 0, y: 0,            // Set by updateNodeDatum
        midPoint: { x: 0, y: 0 },
        clipBBox: undefined,   // Created by updateNodeDatum
        // ... minimal initialisation
    };
}

/**
 * Creates a new node: skeleton + update.
 */
private createNodeDatum(ctx: Context, params: NodeDatumParams): CreateResult {
    const prepared = this.prepareNodeDatumState(ctx, params.scratch, ...);
    if (!prepared) return { nodeData: undefined };

    const nodeData = this.createSkeletonNodeDatum(ctx, params);
    this.updateNodeDatum(ctx, nodeData, params, prepared);

    return { nodeData };
}

/**
 * Updates node properties in-place.
 * Shared by both create (skeleton + update) and incremental update paths.
 */
private updateNodeDatum(
    ctx: Context,
    node: NodeDatum,
    params: NodeDatumParams,
    prepared?: PreparedState
): void {
    prepared ??= this.prepareNodeDatumState(ctx, params.scratch, ...);
    if (!prepared) return;

    const mutableNode = node as Mutable<NodeDatum>;

    // All coordinate calculations and property assignments
    mutableNode.datum = prepared.datum;
    mutableNode.x = computedX;
    mutableNode.y = computedY;
    // ...

    // Update nested objects in-place
    if (mutableNode.clipBBox) {
        mutableNode.clipBBox.x = rectX;
        // ...
    } else {
        mutableNode.clipBBox = new BBox(...);
    }
}
```

**Benefits of This Architecture**:

| Benefit                    | Description                                          |
| -------------------------- | ---------------------------------------------------- |
| **Separation of Concerns** | Each method has a single responsibility              |
| **Testability**            | Individual methods can be unit tested                |
| **Strategy Pattern**       | Easy to add new data processing paths                |
| **Code Reuse**             | `updateNodeDatum()` shared between create and update |
| **Maintainability**        | Changes localised to relevant methods                |
| **Performance Profiling**  | Easy to identify which path is slow                  |

**Decomposition Checklist for New Series**:

- [ ] Extract context creation to `createNodeDatumContext()`
- [ ] Extract position calculation to `computeXPosition()` (or similar)
- [ ] Identify data iteration strategies (simple, grouped, aggregated)
- [ ] Create strategy method for each: `createNodeDataSimple()`, etc.
- [ ] Extract node creation logic to `createNodeDatum()`
- [ ] Extract node update logic to `updateNodeDatum()`
- [ ] Create `upsertNodeDatum()` to centralise create/update decision
- [ ] Extract validation to `prepareNodeDatumState()`
- [ ] Keep `createNodeData()` thin: setup -> strategy selection -> cleanup -> return

---

## 2. Correct `xNeedsValueOf`/`yNeedsValueOf` Detection

**Problem**: Defaulting `xNeedsValueOf` and `yNeedsValueOf` to `true` causes unnecessary `.valueOf()` calls on plain numbers, significantly hurting performance.

**Solution**: Use `dataModel.resolveColumnNeedsValueOf()` to determine if values actually need `.valueOf()` conversion.

**Wrong Pattern** (defaults to `true`):

```typescript
// BAD: Always calls .valueOf() even for plain numbers
const { indexData, valueData } = createAggregationIndices(xValues, highValues, lowValues, d0, d1, maxRange, {
    xNeedsValueOf: true, // Wrong! May not be needed
    yNeedsValueOf: true, // Wrong! May not be needed
});
```

**Correct Pattern**:

```typescript
// GOOD: Detect actual need from data model
const xNeedsValueOf = dataModel.resolveColumnNeedsValueOf(series, 'xValue', processedData);
const yNeedsValueOf =
    dataModel.resolveColumnNeedsValueOf(series, 'highValue', processedData) ??
    dataModel.resolveColumnNeedsValueOf(series, 'lowValue', processedData);

const { indexData, valueData } = createAggregationIndices(xValues, highValues, lowValues, d0, d1, maxRange, {
    xNeedsValueOf,
    yNeedsValueOf,
});
```

**When `valueOf()` is Needed**:

| Data Type      | `needsValueOf` | Reason                        |
| -------------- | -------------- | ----------------------------- |
| Plain `number` | `false`        | Already a number              |
| `Date`         | `true`         | Needs `.valueOf()` -> ms       |
| Custom object  | `true`         | Needs `.valueOf()` for number |

**Impact**: For 10k data points with plain numbers:

- With `xNeedsValueOf: true`: ~20ms overhead from unnecessary `.valueOf()` calls
- With `xNeedsValueOf: false`: Eliminates overhead entirely

---

## 3. Skip Datum ID Computation When Animation Not Supported

**Problem**: The `updateDatumSelection()` method computes datum IDs via `getDatumId()` for every node to enable animated transitions between data states. When animation is not supported (e.g., datasets exceeding `MAX_ANIMATABLE_NODES` threshold), this ID computation and lookup overhead is wasted.

**Solution**: Check if the processed data is animatable using `processedDataIsAnimatable()` and skip the `getDatumId` callback when animation is not supported. This uses the same `MAX_ANIMATABLE_NODES = 1000` threshold that `processData()` uses for diff/animationValidation calculations, ensuring consistent behaviour.

**Important**: Do NOT use `animationManager.isSkipped()` for this check. `isSkipped()` can return `true` temporarily due to user interactions (zoom/pan) that short-circuit animations, but when animations resume, scene-graph nodes won't have matching IDs assigned, breaking subsequent animations. Always use `processedDataIsAnimatable()` to ensure consistent ID assignment based on data count.

**BarSeries Pattern** (`barSeries.ts:1198-1205`):

```typescript
protected override updateDatumSelection(opts: {
    nodeData: BarNodeDatum[];
    datumSelection: Selection<BarShape, BarNodeDatum>;
}) {
    if (!processedDataIsAnimatable(this.processedData!)) {
        // Optimised update path, no need to ensure we match up nodes by id.
        return opts.datumSelection.update(opts.nodeData);
    }
    return opts.datumSelection.update(opts.nodeData, undefined, this.getDatumId.bind(this));
}
```

**Why This Matters**:

| With `getDatumId`                 | Without `getDatumId`           |
| --------------------------------- | ------------------------------ |
| Callback invoked per node         | No callback overhead           |
| ID string creation per node       | No string allocations          |
| Map lookup to match nodes         | Direct index-based update      |
| Required for animated transitions | Sufficient for instant updates |

**When Animation is Not Supported**:

- Datasets exceeding `MAX_ANIMATABLE_NODES` (1000) threshold
- Large datasets where animation performance would be poor
- Same threshold used by `processData()` for diff/animationValidation calculations

**Why `processedDataIsAnimatable()` Instead of `animationManager.isSkipped()`**:

| Aspect                      | `animationManager.isSkipped()`                  | `processedDataIsAnimatable()`                       |
| --------------------------- | ----------------------------------------------- | --------------------------------------------------- |
| **Consistency**             | Can change based on temporary user interactions | Based on stable data count threshold                |
| **Scene-graph IDs**         | May omit IDs when animations resume             | Always assigns IDs when animation is supported      |
| **Threshold**               | N/A (runtime state)                             | `MAX_ANIMATABLE_NODES = 1000` (matches processData) |
| **User interaction impact** | Temporary skip breaks subsequent animations     | Unaffected by temporary animation skips             |

**Measured Impact** (RangeBarSeries with 100k points):

| Benchmark          | Before  | After   | Improvement |
| ------------------ | ------- | ------- | ----------- |
| 1x append batch    | 39.26ms | 32.36ms | ~18% faster |
| 10x append batch   | 29.01ms | 22.66ms | ~22% faster |
| 1x remove batch    | 30.68ms | 21.60ms | ~30% faster |
| 10x rolling window | 28.30ms | 22.33ms | ~21% faster |

**Checklist**:

- [ ] Override `updateDatumSelection()` in series class
- [ ] Check `!processedDataIsAnimatable(this.processedData!)` (NOT `animationManager.isSkipped()`)
- [ ] Use simple `datumSelection.update(data)` when animation not supported
- [ ] Use `datumSelection.update(data, undefined, getDatumId)` when animation is supported
- [ ] Verify animated transitions still work correctly
- [ ] Ensure `processedDataIsAnimatable` is imported (from `../../data/processors` or `_ModuleSupport`)

---

## 4. Skip Label Formatting When Labels Disabled

**Problem**: Label formatting via `getLabelText()` is expensive (involves formatters, value conversion, string operations). When labels are disabled, this work is wasted but still performed on every datum.

**Solution**: Check `label.enabled` early and skip all label-related computation when labels are disabled.

**BarSeries Pattern** (`barSeries.ts`):

```typescript
// In createNodeDatum(), check before expensive getLabelText() call
const labelText =
    ctx.label.enabled && yRawValue != null
        ? this.getLabelText<AgBarSeriesLabelFormatterParams>(
              yFilterValue ?? yRawValue,
              datum,
              ctx.yKey,
              'y',
              yDomain,
              label,
              { itemType: 'low', value: yLowValue, ...labelParams }
          )
        : undefined;
```

**RangeBarSeries Pattern** (`rangeBarSeries.ts`):

For series with separate label update methods, check at the start and return early:

```typescript
private updateLabelData({
    labels,
    labelEnabled,
    // ... other params
}: {
    labels: RangeBarNodeLabelDatum[];
    labelEnabled: boolean;
    // ...
}): void {
    // Skip all label computation if labels are disabled - getLabelText is expensive
    if (!labelEnabled) {
        labels.length = 0;
        return;
    }

    // Expensive label formatting only happens when enabled
    const yLowText = this.getLabelText<AgRangeBarSeriesLabelFormatterParams>(...);
    const yHighText = this.getLabelText<AgRangeBarSeriesLabelFormatterParams>(...);
    // ...
}
```

**Cache Label Enabled State in Context**:

```typescript
interface RangeBarSeriesNodeDatumContext {
    // ... other fields
    readonly labelEnabled: boolean;  // Cache once per createNodeData()
}

private createNodeDatumContext(...): RangeBarSeriesNodeDatumContext {
    return {
        // ... other fields
        labelEnabled: this.properties.label.enabled,
    };
}
```

**What Gets Skipped**:

| Computation              | Cost           | Skipped? |
| ------------------------ | -------------- | -------- |
| `getLabelText()` calls   | High (2x/node) | Yes      |
| Position calculations    | Medium         | Yes      |
| Label data object allocs | Low-Medium     | Yes      |
| Array length operations  | Low            | Yes      |

**Measured Impact** (RangeBarSeries with 100k points, labels disabled):

| Benchmark          | Before  | After   | Improvement |
| ------------------ | ------- | ------- | ----------- |
| 1x append batch    | 44.52ms | 39.26ms | ~12% faster |
| 10x rolling window | 32.97ms | 28.30ms | ~14% faster |
| 50x rolling window | 31.70ms | 26.22ms | ~17% faster |

**Checklist**:

- [ ] Add `labelEnabled` to context interface (cache once per `createNodeData()`)
- [ ] Check `labelEnabled` before calling `getLabelText()`
- [ ] For separate `updateLabelData()` methods: return early when disabled
- [ ] Clear label arrays when disabled (handles case where labels were previously enabled)
- [ ] Verify tests pass with both labels enabled and disabled
