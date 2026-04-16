# Memory and GC Optimization Patterns

These patterns reduce object allocations in hot paths, minimising garbage collection pressure during rendering and data updates.

## 1. Context Object Caching

**Problem**: Repeated property lookups and scale conversions in loops are expensive.

**Solution**: Create a context object once per `createNodeData()` call that caches expensive computations.

**BarSeries Example** (`barSeries.ts:102-152`):

```typescript
interface BarSeriesNodeDatumContext {
    // Data arrays (resolved from dataModel - worth caching)
    readonly rawData: { data: any[] } | undefined;
    readonly xValues: any[];
    readonly yRawValues: any[];

    // Scales (axis lookups - worth caching)
    readonly xScale: Scale<any, any>;
    readonly yScale: Scale<any, any>;

    // Computed positioning (involves scale conversions - worth caching)
    readonly barWidth: number;
    readonly groupOffset: number;

    // Pre-computed values
    readonly yReversed: boolean;
    readonly bboxBottom: number;
    readonly crisp: boolean;

    // Property lookups (constant across all datums)
    readonly xKey: string;
    readonly yKey: string;
}
```

**Implementation Pattern**:

```typescript
private createNodeDatumContext(xAxis: ChartAxis, yAxis: ChartAxis): Context | undefined {
    const { dataModel, processedData } = this;
    if (!dataModel || !processedData) return undefined;

    return {
        rawData: processedData.dataSources.get(this.id),
        xValues: dataModel.resolveKeysById(this, 'xValue', processedData),
        yRawValues: dataModel.resolveColumnById(this, 'yValue-raw', processedData),
        xScale: xAxis.scale,
        yScale: yAxis.scale,
        // ... cache other expensive lookups
    };
}

createNodeData() {
    const ctx = this.createNodeDatumContext(xAxis, yAxis);
    if (!ctx) return;

    // Use ctx.xValues, ctx.yScale, etc. - already resolved
    for (let i = 0; i < dataLength; i++) {
        // Access cached values instead of repeated lookups
        const xValue = ctx.xValues[i];
        const y = ctx.yScale.convert(value);
    }
}
```

**What to Cache**:

- Data arrays from `dataModel.resolveColumnById()` and `resolveKeysById()`
- Axis scales
- Pre-computed coordinate offsets
- Boolean flags (`isStacked`, `yReversed`, `crisp`)
- Property keys and names

---

## 2. Scratch Object Reuse

**Problem**: Creating new objects in tight loops causes GC pressure.

**Solution**: Pre-allocate "scratch" objects before loops and mutate them in place.

**BarSeries Example** (`barSeries.ts:160-182`):

```typescript
interface NodeDatumParams {
    nodeDatumScratch: PreparedBarNodeDatumState;
    datumIndex: number;
    x: number;
    width: number;
    yStart: number;
    yEnd: number;
}

// In createNodeData():
const nodeDatumParamsScratch: NodeDatumParams = {
    nodeDatumScratch: {
        datum: undefined,
        xValue: undefined,
        yRawValue: 0,
        // ... initial values
    },
    datumIndex: 0,
    x: 0,
    width: 0,
    // ...
};

for (let i = 0; i < dataLength; i++) {
    // Mutate scratch object instead of creating new one
    nodeDatumParamsScratch.datumIndex = i;
    nodeDatumParamsScratch.x = xPosition(i);
    nodeDatumParamsScratch.width = barWidth;
    // ...
    handleNodeDatum(nodeDatumParamsScratch);
}
```

**Impact**: For 1000 data points:

- Before: 1000+ object allocations per render
- After: 1 allocation reused 1000 times

---

## 3. Incremental Node Updates

**Problem**: Recreating all node datum objects on every data change is expensive.

**Solution**: When data values change but structure is the same, update existing objects in-place.

**BarSeries Pattern** (`barSeries.ts:739-878`):

```typescript
interface BarSeriesNodeDatumContext {
    // ...
    readonly canIncrementallyUpdate: boolean;
    nodes: BarNodeDatum[];
    nodeIndex: number;
}

private createNodeDatumContext(): Context {
    const canIncrementallyUpdate =
        processedData.changeDescription != null && this.contextNodeData?.nodeData != null;

    return {
        // ...
        canIncrementallyUpdate,
        nodes: canIncrementallyUpdate ? this.contextNodeData.nodeData : [],
        nodeIndex: 0,
    };
}

private upsertNodeDatum(ctx: Context, params: NodeDatumParams) {
    const canReuseNode = ctx.canIncrementallyUpdate && ctx.nodeIndex < ctx.nodes.length;

    if (canReuseNode) {
        // Update existing node in place
        const existingNode = ctx.nodes[ctx.nodeIndex];
        this.updateNodeDatum(ctx, existingNode, params);
    } else {
        // Create new node only when needed
        const newNode = this.createNodeDatum(ctx, params);
        ctx.nodes.push(newNode);
    }
    ctx.nodeIndex++;
}

private updateNodeDatum(ctx: Context, node: BarNodeDatum, params: NodeDatumParams): void {
    const mutableNode = node as Mutable<BarNodeDatum>;

    // Update properties in-place
    mutableNode.datum = params.datum;
    mutableNode.x = params.x;
    mutableNode.y = params.y;

    // Update nested objects in-place
    if (mutableNode.clipBBox) {
        mutableNode.clipBBox.x = rectX;
        mutableNode.clipBBox.y = rectY;
        // ...
    } else {
        mutableNode.clipBBox = new BBox(...);
    }

    // Update midPoint in-place
    const mutableMidPoint = mutableNode.midPoint as Mutable<Point>;
    mutableMidPoint.x = centerX;
    mutableMidPoint.y = centerY;
}
```

**Key Points**:

- Check `processedData.changeDescription` to detect incremental updates
- Use `Mutable<T>` type to allow writing to readonly properties
- Update nested objects (BBox, midPoint) in-place when they exist
- Only create new objects when the node doesn't exist yet

---

## 4. BBox In-Place Updates

**Problem**: Creating new BBox objects in loops adds memory pressure.

**Solution**: Update existing BBox properties directly.

```typescript
// Before (allocates new BBox):
mutableNode.clipBBox = new BBox(rectX, rectY, rectWidth, rectHeight);

// After (reuses existing BBox when possible):
const existingClipBBox = mutableNode.clipBBox;
if (existingClipBBox) {
    existingClipBBox.x = rectX;
    existingClipBBox.y = rectY;
    existingClipBBox.width = rectWidth;
    existingClipBBox.height = rectHeight;
} else {
    mutableNode.clipBBox = new BBox(rectX, rectY, rectWidth, rectHeight);
}
```

---

## 5. Visible Range Filtering

**Problem**: Processing all data points when only a subset is visible wastes cycles.

**Solution**: Calculate visible range indices and only process those.

```typescript
const visibleRange = this.visibleRangeIndices('xValue', xAxis.range);
const start = visibleRange[0];
const end = visibleRange[1];

for (let datumIndex = start; datumIndex < end; datumIndex++) {
    // Only process visible data points
}
```

---

## 6. TypedArray Reuse in Aggregation

**Problem**: Aggregation functions allocate large TypedArrays (`Uint32Array`, `Float64Array`) on every data update, causing significant GC pressure during high-frequency updates.

**Solution**: Store ALL TypedArrays needed for reuse in the filter interface and pass them to both `createAggregationIndices()` and `compactAggregationIndices()`.

**Critical Learning**: The `collectAggregationLevels()` utility does NOT support array reuse for compaction. You MUST use a custom while loop to pass reuse arrays at each level.

**BarSeries Reference** (`barAggregation.ts`):

```typescript
// Filter interface stores ALL arrays needed for reuse
export interface BarSeriesDataAggregationFilter {
    maxRange: number;
    positiveIndices: Uint32Array;
    positiveIndexData: Uint32Array;
    positiveValueData: Float64Array; // CRITICAL: Store valueData for compaction reuse
    negativeIndices: Uint32Array;
    negativeIndexData: Uint32Array;
    negativeValueData: Float64Array; // CRITICAL: Store valueData for compaction reuse
}

// Pass ALL reuse arrays to createAggregationIndices
const {
    indexData: positiveIndexData,
    valueData: positiveValueData,
    negativeIndexData,
    negativeValueData,
} = createAggregationIndices(xValues, yEndValues, yStartValues ?? yEndValues, d0, d1, maxRange, {
    split: true,
    xNeedsValueOf,
    yNeedsValueOf,
    reuseIndexData: existingFilter?.positiveIndexData,
    reuseValueData: existingFilter?.positiveValueData, // Don't forget!
    reuseNegativeIndexData: existingFilter?.negativeIndexData,
    reuseNegativeValueData: existingFilter?.negativeValueData, // Don't forget!
});

// Custom while loop for compaction with array reuse (NOT collectAggregationLevels)
while (maxRange > 64) {
    const currentMaxRange = maxRange;
    const nextMaxRange = Math.trunc(currentMaxRange / 2);

    // Find existing filter at target level for array reuse
    const nextExistingFilter = existingFilters?.find((f) => f.maxRange === nextMaxRange);

    // Pass reuse arrays to compactAggregationIndices
    const positiveCompacted = compactAggregationIndices(positiveIndexData, positiveValueData, currentMaxRange, {
        reuseIndexData: nextExistingFilter?.positiveIndexData,
        reuseValueData: nextExistingFilter?.positiveValueData,
    });

    // ... use compacted results
}
```

**Common Mistakes**:

1. **Missing `valueData` in filter interface** - If you only store `indexData`, you can't reuse arrays for compaction
2. **Using `collectAggregationLevels()`** - This utility doesn't pass reuse arrays to `compactAggregationIndices()`
3. **Only passing `reuseIndexData`** - Must also pass `reuseValueData` for full reuse

**Helper Functions Should Accept Reuse Parameters**:

```typescript
// Before (always allocates):
function getMidpoints(maxRange: number, indexData: Uint32Array): Uint32Array {
    const midpoints = new Uint32Array(maxRange);
    // ...
    return midpoints;
}

// After (reuses when possible):
function getMidpoints(maxRange: number, indexData: Uint32Array, reuseMidpointData?: Uint32Array): Uint32Array {
    const midpoints =
        reuseMidpointData && reuseMidpointData.length === maxRange ? reuseMidpointData : new Uint32Array(maxRange);
    // ...
    return midpoints;
}
```

**Shared `getMidpointsForIndices()` Helper**:

The community package provides a shared helper for midpoint calculation in `aggregation.ts`:

```typescript
import { getMidpointsForIndices } from '_ModuleSupport';

// Generic midpoint calculation for any aggregation type
const midpoints = getMidpointsForIndices(
    maxRange,
    indexData,
    AGGREGATION_INDEX_X_MIN, // xMinOffset
    AGGREGATION_INDEX_X_MAX, // xMaxOffset
    -1, // invalidSentinel
    existingFilter?.midpointIndices // reuse array
);
```

This helper consolidates the midpoint calculation logic from `rangeBarAggregation.ts` and `ohlcAggregation.ts`, reducing code duplication while supporting array reuse.

---

## 7. Two-Pass Approach for TypedArray Indices

When building index arrays incrementally, use a two-pass approach instead of `push()`:

- First pass: count how many elements will be added
- Second pass: allocate correctly-sized TypedArray and populate it

This enables TypedArray reuse (if sizes match) and reduces GC pressure.

```typescript
// In buildIndicesFromAggregation():
function buildIndicesFromAggregation(
    xValues,
    d0,
    d1,
    indexData,
    maxRange,
    xNeedsValueOf,
    xValuesLength,
    reuseIndices?: Uint32Array,
    reuseMetaIndices?: Uint32Array
): { indices: Uint32Array; metaIndices: Uint32Array } {
    // First pass: count indices and metaIndices
    let indicesCount = 0;
    let metaIndicesCount = 0;
    let currentGroup = -1;

    for (let datumIndex = 0; datumIndex < xValuesLength; datumIndex++) {
        const group = aggregationIndexType(xValues, d0, d1, indexData, maxRange, datumIndex, xNeedsValueOf);
        if (group === -1) continue;

        indicesCount++;
        if (group !== currentGroup) {
            metaIndicesCount++;
            currentGroup = group;
        }
    }
    metaIndicesCount++; // For final closing index

    // Allocate or reuse TypedArrays
    const indices = reuseIndices?.length === indicesCount ? reuseIndices : new Uint32Array(indicesCount);
    const metaIndices =
        reuseMetaIndices?.length === metaIndicesCount ? reuseMetaIndices : new Uint32Array(metaIndicesCount);

    // Second pass: populate arrays
    // ... (same iteration, now populating instead of counting)

    return { indices, metaIndices };
}
```

Example: LineSeries and AreaSeries both use `Uint32Array` for `indices` and `metaIndices`. The extra pass is negligible compared to allocation savings in high-frequency updates.
