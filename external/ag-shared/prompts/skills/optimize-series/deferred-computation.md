# Deferred Computation Patterns

These patterns schedule non-critical work for idle time, keeping the main thread responsive during data loading and user interaction.

## Deferred Aggregation Computation

**Problem**: Computing all aggregation levels upfront during `processData()` blocks the main thread, causing UI jank during data loading. Many aggregation levels may never be needed if the user doesn't zoom.

**Solution**: Use the shared `AggregationManager` class to compute only the immediately-needed aggregation level synchronously, then defer remaining levels to idle time using `requestIdleCallback`.

**Reference**: See `aggregationManager.ts`, `barSeries.ts`, and `deferredExecutor.ts`

**Architecture**:

```
processData()
+-- aggregateData()
    +-- aggregationManager.markStale()
    +-- aggregationManager.aggregate({
        computePartial: (existingFilters) => ...,
        computeFull: (existingFilters) => ...,
        targetRange
    })
        +-- Cancel pending deferred work
        +-- Pass existingFilters to callbacks for array reuse
        +-- computePartial() returns { immediate, computeRemaining }
        +-- Schedule deferred computation
            +-- requestIdleCallback -> mergeFilters()

createNodeData()
+-- createNodeDatumContext()
    +-- aggregationManager.ensureLevelForRange(range)
    |   +-- If needed level missing & deferred pending:
    |       +-- demand() -> Force immediate computation
    +-- aggregationManager.getFilterForRange(range)
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
    // Otherwise use memoised version
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

- [ ] Create `*Partial` version of aggregation function that accepts `existingFilters` parameter
- [ ] Add `existingFilters` parameter to full aggregation function for array reuse
- [ ] Bypass memoisation when `existingFilters` is provided (memoisation conflicts with array reuse)
- [ ] Add `AggregationManager` instance to series class (not raw `DeferredExecutor`)
- [ ] Call `aggregationManager.markStale()` before recomputing
- [ ] Use callback parameters: `computePartial: (existingFilters) => ...` and `computeFull: (existingFilters) => ...`
- [ ] Pass `existingFilters` from callback to aggregation functions
- [ ] Estimate target range from current axis scale
- [ ] Use `aggregationManager.ensureLevelForRange()` in `createNodeDatumContext()`
- [ ] Use `aggregationManager.getFilterForRange()` to get the appropriate filter
