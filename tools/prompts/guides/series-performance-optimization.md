# Series Performance Optimization Guide

This guide documents the performance optimization patterns applied to BarSeries as part of AG-16239 and provides a checklist for applying these optimizations to other series types (OHLC, Candlestick, Area, Histogram, etc.).

> **Reference Implementation**: When in doubt, refer to BarSeries and its related utilities as the canonical example. Key files:
>
> -   `packages/ag-charts-community/src/chart/series/cartesian/barSeries.ts`
> -   `packages/ag-charts-community/src/chart/series/cartesian/barAggregation.ts`
> -   `packages/ag-charts-community/src/scene/shape/barShape.ts`
> -   `packages/ag-charts-community/src/scene/shape/rect.ts`
> -   `packages/ag-charts-community/src/scene/shape/shape.ts`
> -   `packages/ag-charts-community/src/util/deferredExecutor.ts`

## Overview

The optimizations fall into four categories:

1. **Memory/GC Optimizations** - Reduce object allocations in hot paths
2. **Decorator Bypass Optimizations** - Avoid property setter overhead
3. **Data Processing Optimizations** - Minimize redundant computation
4. **Deferred Computation** - Schedule non-critical work for idle time

## Optimization Patterns

### 1. Context Object Caching

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

-   Data arrays from `dataModel.resolveColumnById()` and `resolveKeysById()`
-   Axis scales
-   Pre-computed coordinate offsets
-   Boolean flags (`isStacked`, `yReversed`, `crisp`)
-   Property keys and names

---

### 2. Scratch Object Reuse

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

-   Before: 1000+ object allocations per render
-   After: 1 allocation reused 1000 times

---

### 3. Direct Backing Field Access (`__fieldName`)

**Problem**: Property decorators (`@SceneChangeDetection`, `@DeclaredSceneChangeDetection`) add overhead to every getter/setter.

**Solution**: Access backing fields directly in hot rendering paths.

**IMPORTANT: Use `@Declared*` Decorators for Type Safety**

Always use the `@DeclaredSceneChangeDetection` or `@DeclaredSceneObjectChangeDetection` decorators instead of the older `@SceneChangeDetection` variants. The `@Declared*` decorators enforce type safety between the property and its backing field declaration:

```typescript
// changeDetectable.ts - Type constraint ensures __fieldName matches
export function DeclaredSceneChangeDetection<V>(opts?: SceneChangeDetectionOptions) {
    return function <K extends string, T extends Target & { [P in `__${K}`]: V }>(target: T, key: K): void {
        // TypeScript will error if declare __fieldName doesn't match the property type
    };
}
```

**Correct Pattern** (`shape.ts`):

```typescript
// Property declaration with type-safe backing field
@DeclaredSceneChangeDetection()
fillOpacity: number = 1;
declare __fillOpacity: number; // TypeScript enforces this matches the property type

@DeclaredSceneChangeDetection()
strokeWidth: number = 0;
declare __strokeWidth: number; // Type-safe: must be number

@DeclaredSceneObjectChangeDetection({ equals: objectsEqual, changeCb: Shape.handleFillChange })
fill: ShapeColor | undefined = 'black';
declare __fill: ShapeColor | undefined; // Type-safe: must match fill's type
```

**Type Safety Benefits**:

-   **Compile-time errors** if `declare __fieldName` type doesn't match the property type
-   **Refactoring safety** - changing property type will flag mismatched backing fields
-   **IDE support** - autocomplete and type inference work correctly

**Incorrect (will cause TypeScript errors)**:

```typescript
@DeclaredSceneChangeDetection()
fillOpacity: number = 1;
declare __fillOpacity: string; // ERROR: Type 'string' is not assignable to type 'number'
```

**In hot paths, access backing field directly**:

```typescript
protected renderFill(ctx: CanvasContext, path?: Path2D) {
    const { __fill: fill, __fillOpacity: fillOpacity = 1 } = this;
    // Using __fillOpacity bypasses the getter
}
```

**When to Use**:

-   Render methods (`renderFill`, `renderStroke`, `updatePath`)
-   High-frequency update loops
-   Any code called 1000+ times per frame

**When NOT to Use**:

-   Initial setup code
-   Infrequently called methods
-   Code that needs change detection

**Migration Note**: When adding backing field access to existing properties using `@SceneChangeDetection`, migrate them to `@DeclaredSceneChangeDetection` to get type safety.

---

### 4. Batched Property Setting (`setStyleProperties`, `setStaticProperties`)

**Problem**: Setting multiple properties individually triggers change detection and `markDirty()` for each.

**Solution**: Create specialized methods that write directly to backing fields and call `markDirty()` once.

**Shape.setStyleProperties()** (`shape.ts:441-505`):

```typescript
setStyleProperties(
    style?: Partial<Pick<Shape, 'fill' | 'fillOpacity' | 'stroke' | 'strokeOpacity' | 'strokeWidth' | ...>>,
    fillBBox?: { series: BBox; axis: BBox },
    fillParams?: GradientParams
): void {
    const opacity = style?.opacity ?? 1;
    const computedFillOpacity = (style?.fillOpacity ?? 1) * opacity;
    const computedStrokeOpacity = (style?.strokeOpacity ?? 1) * opacity;

    let hasDirectChanges = false;

    // Write directly to backing fields
    if (this.__fillOpacity !== computedFillOpacity) {
        this.__fillOpacity = computedFillOpacity;
        hasDirectChanges = true;
    }
    if (this.__strokeOpacity !== computedStrokeOpacity) {
        this.__strokeOpacity = computedStrokeOpacity;
        hasDirectChanges = true;
    }
    // ... other fields

    // Single dirty notification for all changes
    if (hasDirectChanges) {
        this.markDirty();
    }
}
```

**BarShape.setStaticProperties()** (`barShape.ts:30-59`):

```typescript
setStaticProperties(
    drawingMode: AgDrawingMode,
    topLeftCornerRadius: number,
    topRightCornerRadius: number,
    bottomRightCornerRadius: number,
    bottomLeftCornerRadius: number,
    visible: boolean,
    direction: 'x' | 'y',
    featherRatio: number,
    crisp: boolean,
    fillShadow: DropShadow | undefined
): void {
    // Direct backing field writes
    this.__drawingMode = drawingMode;
    this.__topLeftCornerRadius = topLeftCornerRadius;
    // ... etc

    this.dirtyPath = true;
    this.markDirty(); // Single call
}
```

**Usage in Series**:

```typescript
// Before (slow):
node.fill = style.fill;
node.fillOpacity = style.fillOpacity;
node.stroke = style.stroke;
// ... 10 more properties = 10 markDirty() calls

// After (fast):
node.setStyleProperties(style, fillBBox);
node.setStaticProperties(drawingMode, ...);
// = 2 markDirty() calls total
```

---

### 5. Incremental Node Updates

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

-   Check `processedData.changeDescription` to detect incremental updates
-   Use `Mutable<T>` type to allow writing to readonly properties
-   Update nested objects (BBox, midPoint) in-place when they exist
-   Only create new objects when the node doesn't exist yet

---

### 6. BBox In-Place Updates

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

### 7. Visible Range Filtering

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

### 8. `createNodeData()` Decomposition Pattern

**Problem**: Monolithic `createNodeData()` methods become difficult to maintain, test, and optimize. They often mix concerns: context setup, data iteration strategies, node creation logic, and result assembly.

**Solution**: Decompose `createNodeData()` into a clean architecture with specialized methods for each concern.

**BarSeries Architecture** (`barSeries.ts:1105-1182`):

```
createNodeData()
├── createNodeDatumContext()     → Creates cached context object
├── computeXPosition()           → Pure position calculation helper
├── nodeDatumParamsScratch       → Pre-allocated scratch object
│
├── [Strategy Selection]
│   ├── createNodeDataWithAggregation()  → Aggregated data path
│   ├── createNodeDataGrouped()          → Grouped data path
│   └── createNodeDataSimple()           → Simple ungrouped path
│
├── upsertNodeDatum()            → Create vs update decision
│   ├── createNodeDatum()        → New node creation
│   │   ├── createSkeletonNodeDatum()
│   │   └── updateNodeDatum()
│   └── updateNodeDatum()        → In-place update
│       └── prepareNodeDatumState()
│
└── [Result Assembly]            → Trim arrays, build return object
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

    // 4. Strategy selection - delegate to specialized methods
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
 * Grouped path: processes data organized into groups (e.g., stacked bars).
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
 * Centralizes the incremental update logic.
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
        // ... minimal initialization
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
| **Maintainability**        | Changes localized to relevant methods                |
| **Performance Profiling**  | Easy to identify which path is slow                  |

**Decomposition Checklist for New Series**:

-   [ ] Extract context creation to `createNodeDatumContext()`
-   [ ] Extract position calculation to `computeXPosition()` (or similar)
-   [ ] Identify data iteration strategies (simple, grouped, aggregated)
-   [ ] Create strategy method for each: `createNodeDataSimple()`, etc.
-   [ ] Extract node creation logic to `createNodeDatum()`
-   [ ] Extract node update logic to `updateNodeDatum()`
-   [ ] Create `upsertNodeDatum()` to centralize create/update decision
-   [ ] Extract validation to `prepareNodeDatumState()`
-   [ ] Keep `createNodeData()` thin: setup → strategy selection → cleanup → return

---

### 9. Deferred Aggregation Computation

**Problem**: Computing all aggregation levels upfront during `processData()` blocks the main thread, causing UI jank during data loading. Many aggregation levels may never be needed if the user doesn't zoom.

**Solution**: Use the shared `AggregationManager` class to compute only the immediately-needed aggregation level synchronously, then defer remaining levels to idle time using `requestIdleCallback`.

**Reference**: See `aggregationManager.ts`, `barSeries.ts`, and `deferredExecutor.ts`

**Architecture**:

```
processData()
└── aggregateData()
    ├── aggregationManager.markStale()
    └── aggregationManager.aggregate({
        computePartial: (existingFilters) => ...,
        computeFull: (existingFilters) => ...,
        targetRange
    })
        ├── Cancel pending deferred work
        ├── Pass existingFilters to callbacks for array reuse
        ├── computePartial() returns { immediate, computeRemaining }
        └── Schedule deferred computation
            └── requestIdleCallback → mergeFilters()

createNodeData()
└── createNodeDatumContext()
    ├── aggregationManager.ensureLevelForRange(range)
    │   └── If needed level missing & deferred pending:
    │       └── demand() → Force immediate computation
    └── aggregationManager.getFilterForRange(range)
```

**Key Components**:

```typescript
// 1. AggregationManager (aggregationManager.ts)
// Shared class that encapsulates DeferredExecutor and filter management
export class AggregationManager<TFilter extends AggregationFilterBase> {
    private _filters: TFilter[] | undefined;
    private readonly executor = new DeferredExecutor<TFilter[]>();

    get filters(): TFilter[] | undefined;

    /**
     * Perform aggregation with deferred computation of coarser levels.
     * Callbacks receive existingFilters for array reuse.
     */
    aggregate(options: {
        computePartial?: (existingFilters: TFilter[] | undefined) => PartialAggregationResult<TFilter> | undefined;
        computeFull: (existingFilters: TFilter[] | undefined) => TFilter[] | undefined;
        targetRange: number;
    }): TFilter[] | undefined;

    /**
     * Ensure we have an aggregation level suitable for the given range.
     * Forces deferred computation if needed.
     */
    ensureLevelForRange(range: number): void;

    /**
     * Get the best filter for a given range.
     */
    getFilterForRange(range: number): TFilter | undefined;

    /**
     * Cancel any pending deferred computation.
     */
    cancel(): void;

    /**
     * Mark all filters as stale (for invalidation on data refresh).
     */
    markStale(): void;
}

// 2. Series integration (barSeries.ts)
class BarSeries {
    private readonly aggregationManager = new AggregationManager<BarSeriesDataAggregationFilter>();

    private aggregateData(dataModel, processedData) {
        // Mark existing filters as stale before recomputing
        this.aggregationManager.markStale();

        if (processedDataIsAnimatable(processedData)) return;

        const xAxis = this.axes[ChartAxisDirection.X];
        if (xAxis == null) return;

        const targetRange = this.estimateTargetRange();

        // AggregationManager passes existing filters to callbacks for array reuse
        this.aggregationManager.aggregate({
            computePartial: (existingFilters) =>
                aggregateBarDataFromDataModelPartial(
                    xAxis.scale.type,
                    dataModel,
                    processedData,
                    this,
                    targetRange,
                    existingFilters // Use filters from callback parameter
                ),
            computeFull: (existingFilters) =>
                aggregateBarDataFromDataModel(xAxis.scale.type, dataModel, processedData, this, existingFilters),
            targetRange,
        });
    }

    private createNodeDatumContext(xAxis, yAxis) {
        // ...
        const range = Math.abs(xScale.range[1] - xScale.range[0]);

        // Ensure we have the aggregation level needed for the current range
        this.aggregationManager.ensureLevelForRange(range);

        const dataAggregationFilter = this.aggregationManager.getFilterForRange(range);
        // ...
    }
}
```

**Partial Aggregation Function Pattern**:

```typescript
// barAggregation.ts
export function aggregateBarDataFromDataModelPartial(
    scaleType: string,
    dataModel: DataModel,
    processedData: ProcessedData,
    series: Series,
    targetRange: number,
    existingFilters?: AggregationFilter[] // Passed from AggregationManager callback
): { immediate: AggregationFilter[]; computeRemaining?: () => AggregationFilter[] } | undefined {

    // Determine which aggregation levels are needed
    const allLevels = calculateAggregationLevels(...);

    // Find the level needed for current zoom
    const immediateLevel = allLevels.find(l => l.maxRange > targetRange);
    const immediateIndex = allLevels.indexOf(immediateLevel);

    // Compute immediate level synchronously, reusing arrays from existingFilters
    const immediate = computeAggregationLevel(immediateLevel, existingFilters);

    // Return deferred computation for remaining levels
    const remainingLevels = allLevels.slice(immediateIndex + 1);
    const computeRemaining = remainingLevels.length > 0
        ? () => remainingLevels.map(level => computeAggregationLevel(level, existingFilters))
        : undefined;

    return { immediate: [immediate], computeRemaining };
}

// Full aggregation function also accepts existingFilters for array reuse
export function aggregateBarDataFromDataModel(
    scaleType: string,
    dataModel: DataModel,
    processedData: ProcessedData,
    series: Series,
    existingFilters?: AggregationFilter[] // Passed from AggregationManager callback
): AggregationFilter[] | undefined {
    // When existingFilters provided, bypass memoization to enable array reuse
    if (existingFilters) {
        return computeAggregation(..., { existingFilters });
    }
    // Otherwise use memoized version
    return memoizedAggregateData(...);
}
```

**When to Use Deferred Aggregation**:

| Scenario                     | Use Deferred? | Reason                                  |
| ---------------------------- | ------------- | --------------------------------------- |
| Large datasets (10k+ points) | Yes           | Multiple aggregation levels expensive   |
| Time-series data             | Yes           | Users often zoom, need multiple levels  |
| Static/small datasets        | No            | Full computation is fast enough         |
| Animation in progress        | No            | Use `processedDataIsAnimatable()` check |

**Implementation Checklist**:

-   [ ] Create `*Partial` version of aggregation function that accepts `existingFilters` parameter
-   [ ] Add `existingFilters` parameter to full aggregation function for array reuse
-   [ ] Bypass memoization when `existingFilters` is provided (memoization conflicts with array reuse)
-   [ ] Add `AggregationManager` instance to series class (not raw `DeferredExecutor`)
-   [ ] Call `aggregationManager.markStale()` before recomputing
-   [ ] Use callback parameters: `computePartial: (existingFilters) => ...` and `computeFull: (existingFilters) => ...`
-   [ ] Pass `existingFilters` from callback to aggregation functions
-   [ ] Estimate target range from current axis scale
-   [ ] Use `aggregationManager.ensureLevelForRange()` in `createNodeDatumContext()`
-   [ ] Use `aggregationManager.getFilterForRange()` to get the appropriate filter

---

### 10. TypedArray Reuse in Aggregation

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
        reuseMidpointData && reuseMidpointData.length === maxRange
            ? reuseMidpointData
            : new Uint32Array(maxRange);
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

### 11. Correct `xNeedsValueOf`/`yNeedsValueOf` Detection

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
| `Date`         | `true`         | Needs `.valueOf()` → ms       |
| Custom object  | `true`         | Needs `.valueOf()` for number |

**Impact**: For 10k data points with plain numbers:

-   With `xNeedsValueOf: true`: ~20ms overhead from unnecessary `.valueOf()` calls
-   With `xNeedsValueOf: false`: Eliminates overhead entirely

---

### 12. Direct Animation Reset (`resetBarSelectionsDirect`)

**Problem**: The base class `resetDatumAnimation()` method uses `resetMotion()` which invokes a callback function for every node and goes through the decorator system. This is a significant hotspot during animations.

**Solution**: Override `resetDatumAnimation()` to use `resetBarSelectionsDirect()` which bypasses callbacks and decorators entirely.

**Base Class Implementation** (SLOW - `cartesianSeries.ts`):

```typescript
protected resetDatumAnimation(data: CartesianAnimationData<TNode, TDatum, TLabel, TContext>) {
    const { datum } = this.opts?.animationResetFns ?? {};

    if (datum) {
        resetMotion([data.datumSelection], datum);  // Invokes callback per node
    }
}
```

**resetMotion Pattern** (SLOW - `resetMotion.ts`):

```typescript
export function resetMotion<N extends Node, T extends Partial<N>, D>(
    selectionsOrNodes: Selection<N, D>[] | N[],
    propsFn: (node: N, datum: D) => T // Called for EVERY node
) {
    for (const selection of selections) {
        selection.batchedUpdate(function resetMotionNodes() {
            for (const node of selectionNodes) {
                const from = propsFn(node, node.datum); // Callback overhead
                node.setProperties(from); // Decorator overhead
            }
        });
    }
}
```

**Optimized Override** (FAST - `barSeries.ts`):

```typescript
protected override resetDatumAnimation(
    data: CartesianAnimationData<BarShape<BarNodeDatum>, BarNodeDatum, BarNodeDatum, BarSeriesNodeDataContext>
) {
    // Use direct reset to bypass resetMotion callback overhead
    resetBarSelectionsDirect([data.datumSelection, this.phantomSelection]);
}
```

**resetBarSelectionsDirect Pattern** (FAST - `barUtil.ts`):

```typescript
export function resetBarSelectionsDirect<D extends AnimatableBarDatum & { crisp?: boolean }>(
    selections: { nodes(): Iterable<Rect<D>>; cleanup(): void; batchedUpdate(fn: () => void): void }[]
): void {
    for (const selection of selections) {
        const nodes = selection.nodes();
        selection.batchedUpdate(function resetBarNodes() {
            for (const node of nodes) {
                const datum = node.datum;
                if (datum == null) continue;

                // Direct method bypasses decorators - writes to __x, __y, etc.
                node.resetAnimationProperties(
                    datum.x,
                    datum.y,
                    datum.width,
                    datum.height,
                    datum.opacity ?? 1,
                    datum.clipBBox
                );
                node.crisp = datum.crisp ?? false;
            }
            selection.cleanup();
        });
    }
}
```

**Performance Difference**:

| Aspect              | `resetMotion()` (Base)  | `resetBarSelectionsDirect()`    |
| ------------------- | ----------------------- | ------------------------------- |
| Callback overhead   | Per-node function call  | No callbacks                    |
| Decorator overhead  | Full decorator system   | Direct backing field writes     |
| `markDirty()` calls | Multiple per node       | Single consolidated call        |
| Properties handled  | All (flexible but slow) | 6 critical animation properties |

**When Called**: Animation resets happen during:

-   `animateEmptyUpdateReady()`
-   `animateWaitingUpdateReady()`
-   `animateReadyResize()`
-   `animateClearingUpdateEmpty()`

This means the optimization impacts **every animation frame** where state resets occur.

**Implementation for Bar-like Series**:

```typescript
// 1. Add to _ModuleSupport destructuring
const {
    // ... existing imports
    resetBarSelectionsDirect,
} = _ModuleSupport;

// 2. Override resetDatumAnimation
protected override resetDatumAnimation(data: YourAnimationData) {
    // Use direct reset to bypass resetMotion callback overhead
    resetBarSelectionsDirect([data.datumSelection]);
}
```

**Measured Impact** (RangeBarSeries with 100k points):

| Benchmark          | Before  | After   | Improvement |
| ------------------ | ------- | ------- | ----------- |
| 10x append batch   | 34.98ms | 31.70ms | ~9% faster  |
| 1x remove batch    | 35.63ms | 31.31ms | ~12% faster |
| 50x rolling window | 37.43ms | 31.70ms | ~15% faster |

**Checklist**:

-   [ ] Add `resetBarSelectionsDirect` to `_ModuleSupport` destructuring
-   [ ] Override `resetDatumAnimation()` method
-   [ ] Pass all relevant selections (datum selection, phantom selection if applicable)
-   [ ] Verify tests pass
-   [ ] Run benchmarks to measure improvement

---

### 13. Skip Datum ID Computation When Animation Disabled

**Problem**: The `updateDatumSelection()` method computes datum IDs via `getDatumId()` for every node to enable animated transitions between data states. When animation is disabled (common for high-frequency updates), this ID computation and lookup overhead is wasted.

**Solution**: Check if animation is enabled and skip the `getDatumId` callback when it's not needed.

**BarSeries Pattern** (`barSeries.ts:1238-1249`):

```typescript
protected override updateDatumSelection(opts: {
    nodeData: BarNodeDatum[];
    datumSelection: Selection<BarShape, BarNodeDatum>;
}) {
    const animationEnabled = !this.ctx.animationManager.isSkipped();

    if (!animationEnabled) {
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

**When Animation is Skipped**:

-   High-frequency data updates (`applyTransaction()` in tight loops)
-   Initial chart render with `animation: { enabled: false }`
-   Programmatic updates where visual continuity isn't needed

**Measured Impact** (RangeBarSeries with 100k points):

| Benchmark          | Before  | After   | Improvement |
| ------------------ | ------- | ------- | ----------- |
| 1x append batch    | 39.26ms | 32.36ms | ~18% faster |
| 10x append batch   | 29.01ms | 22.66ms | ~22% faster |
| 1x remove batch    | 30.68ms | 21.60ms | ~30% faster |
| 10x rolling window | 28.30ms | 22.33ms | ~21% faster |

**Checklist**:

-   [ ] Override `updateDatumSelection()` in series class
-   [ ] Check `this.ctx.animationManager.isSkipped()`
-   [ ] Use simple `datumSelection.update(data)` when animation disabled
-   [ ] Use `datumSelection.update(data, undefined, getDatumId)` when animation enabled
-   [ ] Verify animated transitions still work correctly

---

### 14. Skip Label Formatting When Labels Disabled

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
| `getLabelText()` calls   | High (2x/node) | ✅       |
| Position calculations    | Medium         | ✅       |
| Label data object allocs | Low-Medium     | ✅       |
| Array length operations  | Low            | ✅       |

**Measured Impact** (RangeBarSeries with 100k points, labels disabled):

| Benchmark          | Before  | After   | Improvement |
| ------------------ | ------- | ------- | ----------- |
| 1x append batch    | 44.52ms | 39.26ms | ~12% faster |
| 10x rolling window | 32.97ms | 28.30ms | ~14% faster |
| 50x rolling window | 31.70ms | 26.22ms | ~17% faster |

**Checklist**:

-   [ ] Add `labelEnabled` to context interface (cache once per `createNodeData()`)
-   [ ] Check `labelEnabled` before calling `getLabelText()`
-   [ ] For separate `updateLabelData()` methods: return early when disabled
-   [ ] Clear label arrays when disabled (handles case where labels were previously enabled)
-   [ ] Verify tests pass with both labels enabled and disabled

---

## Applying to New Series: Checklist

### Node Class (e.g., `OhlcBaseNode`, `CandlestickNode`)

-   [ ] **Migrate to `@Declared*` decorators and add `declare __fieldName`**

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

-   [ ] **Create `setStaticProperties()` method**

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

-   [ ] **Use backing fields in `updatePath()` and render methods**
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

### Series Class (e.g., `OhlcSeriesBase`)

#### Context & Caching

-   [ ] **Create context interface**

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

-   [ ] **Create `createNodeDatumContext()` method**

-   [ ] **Create scratch object in `createNodeData()`**

#### `createNodeData()` Decomposition

-   [ ] **Decompose monolithic `createNodeData()`** following the pattern:

    ```
    createNodeData()
    ├── createNodeDatumContext()
    ├── computeXPosition() / position helper
    ├── nodeDatumParamsScratch
    ├── [Strategy Selection]
    │   ├── createNodeDataWithAggregation()
    │   └── createNodeDataSimple()
    ├── upsertNodeDatum()
    │   ├── createNodeDatum()
    │   └── updateNodeDatum()
    └── [Result Assembly]
    ```

-   [ ] **Extract strategy methods** for different data paths:

    -   `createNodeDataSimple()` - ungrouped data iteration
    -   `createNodeDataWithAggregation()` - aggregated data (if applicable)

-   [ ] **Create node lifecycle methods**:
    -   `prepareNodeDatumState()` - validation and state preparation
    -   `createSkeletonNodeDatum()` - minimal node creation
    -   `createNodeDatum()` - skeleton + update
    -   `updateNodeDatum()` - in-place property updates
    -   `upsertNodeDatum()` - create vs update decision

#### Node Updates

-   [ ] **Create `updateNodeDatum()` for in-place updates**

-   [ ] **Create `upsertNodeDatum()` to handle create vs update**

-   [ ] **Update `updateDatumNodes()` to use `setStaticProperties()`**

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

-   [ ] **Use context values instead of repeated lookups**

#### Animation Optimization

-   [ ] **Override `resetDatumAnimation()` to use `resetBarSelectionsDirect()`**

    ```typescript
    protected override resetDatumAnimation(data: YourAnimationData) {
        resetBarSelectionsDirect([data.datumSelection]);
    }
    ```

#### Selection Update Optimization

-   [ ] **Skip datum ID computation when animation is disabled**

    ```typescript
    protected override updateDatumSelection(opts: {
        nodeData: YourNodeDatum[];
        datumSelection: Selection<YourNode, YourNodeDatum>;
    }) {
        const animationEnabled = !this.ctx.animationManager.isSkipped();

        if (!animationEnabled) {
            // Optimised update path, no need to match nodes by id.
            return opts.datumSelection.update(opts.nodeData);
        }
        return opts.datumSelection.update(opts.nodeData, undefined, (datum) => this.getDatumId(datum));
    }
    ```

#### Label Optimization

-   [ ] **Skip label formatting when labels are disabled**

    -   Add `labelEnabled` to context interface
    -   Check `ctx.labelEnabled` or `label.enabled` before calling `getLabelText()`
    -   For separate label update methods: return early and clear label arrays when disabled

---

## Series-Specific Notes

### OHLC/Candlestick

**Current state** (optimizations applied):

-   ✅ Uses `setStyleProperties()` from Shape
-   ✅ Has `@DeclaredSceneChangeDetection()` decorators with `declare __fieldName` backing fields
-   ✅ Has `setStaticProperties()` methods on node classes (`OhlcNode`, `CandlestickNode`)
-   ✅ Has context object caching (`OhlcSeriesNodeDatumContext`)
-   ✅ Has scratch object pattern (`PreparedOhlcNodeDatumState`)
-   ✅ Has incremental node updates (`updateNodeDatum()`, `upsertNodeDatum()`)
-   ✅ Has deferred aggregation computation (`aggregateOhlcDataFromDataModelPartial()`)
-   ✅ Has TypedArray reuse with `valueData` stored in filter interface
-   ✅ Uses `dataModel.resolveColumnNeedsValueOf()` for correct `xNeedsValueOf`/`yNeedsValueOf`
-   ✅ Overrides `resetDatumAnimation()` with `resetOhlcSelectionsDirect()` (animation hotspot fix)
-   ✅ Overrides `updateDatumSelection()` to skip datum ID computation when animation disabled
-   ✅ Uses shared `getMidpointsForIndices()` from aggregation.ts for midpoint calculation

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

-   `packages/ag-charts-enterprise/src/series/ohlc/ohlcSeriesBase.ts`
-   `packages/ag-charts-enterprise/src/series/ohlc/ohlcNode.ts`
-   `packages/ag-charts-enterprise/src/series/ohlc/ohlcAggregation.ts`
-   `packages/ag-charts-enterprise/src/series/candlestick/candlestickNode.ts`
-   `packages/ag-charts-enterprise/src/series/candlestick/candlestickSeries.ts`

### RangeBarSeries

**Current state** (optimizations applied):

-   ✅ Uses `setStyleProperties()` from Shape
-   ✅ Has `@DeclaredSceneChangeDetection()` decorators with `declare __fieldName` backing fields
-   ✅ Has context object caching (`RangeBarSeriesNodeDatumContext`)
-   ✅ Has scratch object pattern (`PreparedRangeBarNodeDatumState`)
-   ✅ Has incremental node updates (`updateNodeDatum()`, `upsertNodeDatum()`)
-   ✅ Has deferred aggregation computation (`aggregateRangeBarDataFromDataModelPartial()`)
-   ✅ Has TypedArray reuse with `valueData` stored in filter interface
-   ✅ Uses `dataModel.resolveColumnNeedsValueOf()` for correct `xNeedsValueOf`/`yNeedsValueOf`
-   ✅ Overrides `resetDatumAnimation()` with `resetBarSelectionsDirect()` (animation hotspot fix)
-   ✅ Overrides `updateDatumSelection()` to skip datum ID computation when animation disabled
-   ✅ Skips label formatting when labels disabled
-   ✅ Uses shared `getMidpointsForIndices()` from aggregation.ts for midpoint calculation

**Reference files**:

-   `packages/ag-charts-enterprise/src/series/range-bar/rangeBarSeries.ts`
-   `packages/ag-charts-enterprise/src/series/range-bar/rangeBarAggregation.ts`

---

### Area Series

**Focus areas**:

-   Path point accumulation (avoid array reallocations)
-   Marker node updates (similar to bar nodes)
-   Context caching for fill/stroke coordinate calculations

### Histogram Series

**Focus areas**:

-   Similar to BarSeries (uses Rect nodes)
-   Bin calculation caching
-   Can likely reuse much of BarSeries optimization infrastructure

---

## Measuring Impact

Use the benchmark suite to verify optimizations:

```bash
# Run benchmarks for specific series
yarn nx benchmark ag-charts-community -- -t "bar.*volume"
yarn nx benchmark ag-charts-enterprise -- -t "ohlc|candlestick"

# Enable debug mode for memory profiling
AG_BENCHMARK_DEBUG=1 yarn nx benchmark ag-charts-community
```

Key metrics to track:

-   Frame render time (target: < 16ms for 60fps)
-   GC pause frequency
-   Memory allocation rate during animation
-   Node update throughput (nodes/ms)

---

## Common Pitfalls

1. **Don't bypass decorators for properties that need change callbacks**

    - `fill` and `stroke` have `onFillChange()` / `onStrokeChange()` callbacks
    - Use normal setters for these, or call callbacks manually after direct writes

2. **Remember to call `markDirty()` after direct field writes**

    - Scene graph won't re-render without this

3. **Don't over-optimize cold paths**

    - Initial setup, configuration changes don't need optimization
    - Focus on per-frame rendering hot paths

4. **Test with large datasets**

    - Optimizations matter most with 1000+ data points
    - Always benchmark before and after

5. **Don't use `collectAggregationLevels()` when you need array reuse**

    - This utility doesn't pass reuse arrays to `compactAggregationIndices()`
    - Use a custom while loop instead (see BarAggregation pattern)

6. **Don't forget `valueData` in aggregation filter interfaces**

    - If you only store `indexData`, you can't reuse arrays during compaction
    - Both `indexData` AND `valueData` must be stored and passed for full reuse

7. **Don't default `xNeedsValueOf`/`yNeedsValueOf` to `true`**

    - Use `dataModel.resolveColumnNeedsValueOf()` to detect actual need
    - Unnecessary `.valueOf()` calls on plain numbers cause significant overhead

8. **Don't forget to pass reuse arrays to helper functions**

    - Functions like `getMidpoints()` should accept optional reuse parameters
    - Check array size matches before reusing: `reuse && reuse.length === required`

---

## Quick Reference

When implementing these optimizations, always refer to the BarSeries implementation as the canonical example:

| Pattern              | Reference File                        | Key Methods/Patterns                                         |
| -------------------- | ------------------------------------- | ------------------------------------------------------------ |
| Context Caching      | `barSeries.ts`                        | `createNodeDatumContext()`, `BarSeriesNodeDatumContext`      |
| Scratch Objects      | `barSeries.ts`                        | `NodeDatumParams`, `PreparedBarNodeDatumState`               |
| Backing Fields       | `shape.ts`, `barShape.ts`             | `declare __fieldName`, `setStyleProperties()`                |
| Static Properties    | `barShape.ts`, `rect.ts`              | `setStaticProperties()`                                      |
| Incremental Updates  | `barSeries.ts`                        | `upsertNodeDatum()`, `updateNodeDatum()`                     |
| Decomposition        | `barSeries.ts`                        | `createNodeDataSimple()`, `createNodeDataWithAggregation()`  |
| Deferred Aggregation | `barSeries.ts`, `deferredExecutor.ts` | `DeferredExecutor`, `aggregateBarDataFromDataModelPartial()` |
| Data Aggregation     | `barAggregation.ts`                   | Aggregation filter patterns                                  |
| TypedArray Reuse     | `barAggregation.ts`                   | `reuseIndexData`, `reuseValueData`, custom compaction loop   |
| Shared Midpoints     | `aggregation.ts`                      | `getMidpointsForIndices()` - shared helper for all series    |
| ValueOf Detection    | `barAggregation.ts`                   | `dataModel.resolveColumnNeedsValueOf()`, `xNeedsValueOf`     |
| Animation Reset      | `barSeries.ts`, `barUtil.ts`          | `resetDatumAnimation()`, `resetBarSelectionsDirect()`        |
| Datum ID Skip        | `barSeries.ts`, `rangeBarSeries.ts`   | `updateDatumSelection()`, `animationManager.isSkipped()`     |
| Label Skip           | `barSeries.ts`, `rangeBarSeries.ts`   | `ctx.label.enabled`, early return in `updateLabelData()`     |

**File locations**:

```
packages/ag-charts-community/src/
├── chart/series/
│   ├── aggregation.ts            # Shared aggregation helpers (getMidpointsForIndices)
│   └── cartesian/
│       ├── barSeries.ts          # Main reference implementation
│       ├── barAggregation.ts     # Bar-specific aggregation utilities
│       └── barUtil.ts            # resetBarSelectionsDirect(), animation helpers
├── scene/shape/
│   ├── shape.ts                  # Base shape with setStyleProperties()
│   ├── rect.ts                   # Rect with backing fields
│   └── barShape.ts               # BarShape with setStaticProperties()
├── motion/
│   └── resetMotion.ts            # Base resetMotion (slower, callback-based)
└── util/
    └── deferredExecutor.ts       # Deferred computation utility

packages/ag-charts-enterprise/src/series/
├── range-bar/
│   ├── rangeBarSeries.ts         # RangeBar series implementation
│   └── rangeBarAggregation.ts    # RangeBar aggregation (uses shared helpers)
└── ohlc/
    ├── ohlcSeriesBase.ts         # OHLC series implementation
    └── ohlcAggregation.ts        # OHLC aggregation (uses shared helpers)
```

When in doubt about implementation details, patterns, or edge cases, examine the BarSeries code directly - it represents the most thoroughly optimized series implementation.
