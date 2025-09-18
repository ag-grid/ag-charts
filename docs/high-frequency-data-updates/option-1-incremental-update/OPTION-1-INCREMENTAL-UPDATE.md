# Option 1: Incremental Update API for AG Charts High-Frequency Data Updates

## Executive Summary

This document outlines the design for an incremental data update API for AG Charts, modeled after AG Grid's successful transaction-based approach. The proposed `updateData()` method will enable high-frequency updates (100+ updates/second across 5 concurrent series) with sub-50ms redraw latency by providing surgical data modifications rather than full dataset replacements.

The design leverages AG Grid's proven transaction pattern (`applyTransaction`, `applyTransactionAsync`) which achieves 150K updates/second, ensuring ecosystem consistency while meeting the performance requirements for real-time financial charting applications.

## Current State Analysis

### Existing Update Methods

AG Charts currently provides two update methods:

```typescript
interface AgTypedChartInstance<TDatum, TContext, O> {
    // Full options replacement - triggers complete re-render
    update(options: O): Promise<void>;

    // Partial options update - still processes entire option tree
    updateDelta(deltaOptions: DeepPartial<O>): Promise<void>;
}
```

### Performance Limitations

-   **Full Data Reprocessing**: Both methods trigger complete data pipeline re-execution (~393ms for 1M points)
-   **Data Inefficiency**: No distinction between data changes vs. configuration changes
-   **Processing Overhead**: Entire datasets are processed even for small changes (68% of execution time)
-   **Animation Conflicts**: Rapid updates cause flickering and animation interruption
-   **Note**: Rendering itself is efficient (~3-4ms), but data processing is the bottleneck

## API Design

### Core Interface

```typescript
interface AgDataTransaction<TDatum = any> {
    /** Data items to append to the end of the dataset */
    append?: TDatum[];

    /** Data items to prepend to the beginning of the dataset */
    prepend?: TDatum[];

    /** Replace existing items based on ID matching */
    update?: TDatum[];

    /** Remove items by ID or predicate function */
    remove?: (string | number)[] | ((datum: TDatum) => boolean);

    /** Replace entire dataset (equivalent to current behavior) */
    replace?: TDatum[];

    /** Clear all data (equivalent to setting data: []) */
    clear?: boolean;

    /** Target specific series by ID (optional - defaults to all series) */
    seriesId?: string;

    /** Optional metadata for transaction tracking */
    transactionId?: string;
}

interface AgDataTransactionResult {
    /** Unique identifier for this transaction */
    transactionId: string;

    /** Number of items affected by each operation */
    operationCounts: {
        appended: number;
        prepended: number;
        updated: number;
        removed: number;
        replaced: number;
    };

    /** Total dataset size after transaction */
    totalDataSize: number;

    /** Processing time in milliseconds */
    processingTime: number;

    /** Whether the transaction triggered a visual update */
    visualUpdate: boolean;
}

// Enhanced chart instance interface
interface AgTypedChartInstance<TDatum, TContext, O> extends ExistingInterface {
    /**
     * Apply incremental data updates to the chart using transaction-based operations.
     *
     * @param transaction - The data operations to perform
     * @returns Promise resolving to transaction result details
     */
    updateData(transaction: AgDataTransaction<TDatum>): Promise<AgDataTransactionResult>;

    /**
     * Apply incremental data updates asynchronously with batching.
     * Multiple calls within the same frame are automatically batched.
     *
     * @param transaction - The data operations to perform
     * @returns Promise resolving to transaction result details
     */
    updateDataAsync(transaction: AgDataTransaction<TDatum>): Promise<AgDataTransactionResult>;

    /**
     * Get current data for a specific series or all series
     *
     * @param seriesId - Optional series ID, returns all series data if omitted
     * @returns Current dataset(s)
     */
    getData(seriesId?: string): TDatum[] | Record<string, TDatum[]>;
}
```

### Multi-Series Operations

```typescript
interface AgMultiSeriesTransaction<TDatum = any> {
    /** Transactions grouped by series ID */
    transactions: Record<string, AgDataTransaction<TDatum>>;

    /** Apply transactions atomically (all succeed or all fail) */
    atomic?: boolean;

    /** Optional batch identifier for related operations */
    batchId?: string;
}

// Extended interface for multi-series coordination
interface AgTypedChartInstance<TDatum, TContext, O> extends PreviousInterface {
    /**
     * Apply transactions to multiple series simultaneously
     *
     * @param multiTransaction - Transactions for multiple series
     * @returns Promise resolving to results per series
     */
    updateMultiSeriesData(
        multiTransaction: AgMultiSeriesTransaction<TDatum>
    ): Promise<Record<string, AgDataTransactionResult>>;
}
```

## Data Operation Types

### 1. Append Operations

```typescript
// Add new data points to the end (most common for real-time feeds)
chart.updateData({
    append: [
        { timestamp: Date.now(), price: 100.5, volume: 1000 },
        { timestamp: Date.now() + 1000, price: 100.75, volume: 1200 },
    ],
});
```

**Performance Characteristics:**

-   O(n) where n = number of items to append
-   No data reindexing required
-   Optimal for time-series data
-   Automatic viewport management

### 2. Prepend Operations

```typescript
// Add historical data to the beginning
chart.updateData({
    prepend: [{ timestamp: earlierTime, price: 99.8, volume: 800 }],
});
```

**Performance Characteristics:**

-   O(n + m) where n = items to prepend, m = existing items
-   Requires index adjustment
-   Less common but needed for historical data loading

### 3. Update Operations

```typescript
// Modify existing data points
chart.updateData({
    update: [
        { id: 'trade-123', price: 100.6, volume: 1100 }, // Updates by ID
    ],
});
```

**Performance Characteristics:**

-   O(n \* log m) where n = updates, m = dataset size
-   Uses ID-based lookup with hash map optimization
-   Requires unique identifier field

### 4. Remove Operations

```typescript
// Remove by ID
chart.updateData({
    remove: ['trade-123', 'trade-124'],
});

// Remove by predicate
chart.updateData({
    remove: (datum) => datum.timestamp < cutoffTime,
});
```

**Performance Characteristics:**

-   By ID: O(n) where n = items to remove
-   By predicate: O(m) where m = total dataset size
-   Automatic array compaction

### 5. Replace Operations

```typescript
// Full dataset replacement (fallback to current behavior)
chart.updateData({
    replace: newCompleteDataset,
});
```

### 6. Clear Operations

```typescript
// Clear all data
chart.updateData({
    clear: true,
});
```

## Multi-Series Coordination Strategy

### Synchronized Updates

```typescript
// Update multiple series atomically
await chart.updateMultiSeriesData({
    transactions: {
        'price-series': {
            append: [{ timestamp: now, price: 100.5 }],
        },
        'volume-series': {
            append: [{ timestamp: now, volume: 1000 }],
        },
        'indicator-series': {
            append: [{ timestamp: now, rsi: 65.2 }],
        },
    },
    atomic: true,
    batchId: 'tick-update-001',
});
```

### Series-Specific Updates

```typescript
// Update single series with targeting
await chart.updateData({
    seriesId: 'price-series',
    append: [{ timestamp: now, price: 100.5 }],
});
```

### Batch Processing

```typescript
// Multiple rapid updates are automatically batched
chart.updateDataAsync({ seriesId: 'series-1', append: [data1] });
chart.updateDataAsync({ seriesId: 'series-2', append: [data2] });
chart.updateDataAsync({ seriesId: 'series-3', append: [data3] });
// All three updates processed in single render cycle
```

## Performance Optimization Techniques

### 1. Incremental Data Processing (Primary Focus)

```typescript
interface SeriesDataManager<TDatum> {
    /** Track changes for optimized data processing */
    private changeTracker: {
        appended: TDatum[];
        prepended: TDatum[];
        updated: Map<string | number, TDatum>;
        removed: Set<string | number>;
        hasChanges: boolean;
        lastProcessedIndex: number;
    };

    /** Apply transaction with optimized data processing */
    applyTransaction(transaction: AgDataTransaction<TDatum>): void;

    /** Process only changed data (68% of performance gain) */
    processIncrementalChanges(): ProcessedDataSet<TDatum>;

    /** Mark changes as processed */
    commitChanges(): void;
}
```

### 2. Data Processing Pipeline Optimization

```typescript
interface OptimizedDataPipeline {
    /** Process only new/changed data points */
    incrementalDataProcessing(changeSet: ChangeSet<TDatum>): ProcessedData;

    /** Reuse existing calculations where possible */
    reuseComputedValues(): void;

    /** Batch domain calculations for multiple changes */
    batchDomainCalculations(): void;

    /** Skip expensive transformations for unchanged data */
    skipRedundantTransformations(): void;
}
```

### 3. Data Structure Optimization

```typescript
interface DataStructureManager<TDatum> {
    /** Optimize data structures for incremental processing */
    private segmentedData: DataSegment<TDatum>[];
    private indexMaps: Map<string | number, number>;

    /** Get optimized data structure for processing */
    getProcessingStructure(): OptimizedDataStructure<TDatum>;

    /** Update indices incrementally */
    updateIndicesIncremental(changes: ChangeSet<TDatum>): void;

    /** Pre-allocate based on expected data size */
    preallocate(expectedSize: number): void;
}
```

### 4. Asynchronous Data Processing

```typescript
interface AsyncDataProcessor<TDatum> {
    /** Queue for pending data operations */
    private pendingDataOps: DataOperation<TDatum>[];

    /** Batch data processing operations */
    private batchWindow: number; // 16ms for 60fps

    /** Process data operations in chunks to avoid blocking */
    private processDataBatch(): Promise<ProcessedData<TDatum>>;

    /** Schedule next data processing batch */
    private scheduleNextProcessing(): void;
}
```

## Memory Management

### 1. Automatic Data Windowing

```typescript
interface DataWindowOptions {
    /** Maximum number of data points to keep in memory */
    maxDataPoints?: number;

    /** Time-based window (keep data newer than this) */
    maxAge?: number;

    /** Callback when data is aged out */
    onDataAged?: (agedData: TDatum[]) => void;

    /** Strategy for removing old data */
    agingStrategy: 'fifo' | 'time-based' | 'custom';
}

// Configuration at chart level
const chartOptions: AgChartOptions = {
    dataWindow: {
        maxDataPoints: 10000,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        agingStrategy: 'time-based',
    },
    // ... other options
};
```

### 2. Memory Monitoring

```typescript
interface MemoryMonitor {
    /** Current memory usage by series */
    getMemoryUsage(): Record<string, number>;

    /** Trigger cleanup if memory threshold exceeded */
    checkMemoryThreshold(): boolean;

    /** Force garbage collection hint */
    forceCleanup(): void;
}
```

## Implementation Phases

### Phase 1: Foundation (4-6 weeks)

-   [ ] Core `AgDataTransaction` interface implementation
-   [ ] Basic append/prepend operations
-   [ ] Single series transaction processing
-   [ ] Unit tests for core functionality
-   [ ] Performance benchmarking framework

### Phase 2: Advanced Operations (3-4 weeks)

-   [ ] Update operations with ID-based lookup
-   [ ] Remove operations (by ID and predicate)
-   [ ] Replace and clear operations
-   [ ] Transaction result reporting
-   [ ] Memory pool management

### Phase 3: Multi-Series Support (4-5 weeks)

-   [ ] `updateMultiSeriesData()` implementation
-   [ ] Atomic transaction processing
-   [ ] Batch coordination across series
-   [ ] Cross-series synchronization
-   [ ] Advanced performance optimizations

### Phase 4: Production Features (3-4 weeks)

-   [ ] Automatic data windowing
-   [ ] Memory monitoring and management
-   [ ] Error handling and rollback
-   [ ] Integration testing with real-world scenarios
-   [ ] Documentation and examples

### Phase 5: Optimization & Polish (2-3 weeks)

-   [ ] Render pipeline optimizations
-   [ ] Viewport culling improvements
-   [ ] Animation system integration
-   [ ] Final performance tuning
-   [ ] Beta testing with partners

## Risk Mitigation Strategies

### 1. Backward Compatibility

```typescript
// Existing update() method remains unchanged
chart.update(options); // Still works

// New updateData() method is additive
chart.updateData({ append: newData }); // New capability
```

### 2. Gradual Migration Path

```typescript
// Phase 1: Basic operations only
updateData({ append: data })

// Phase 2: Advanced operations
updateData({ update: modifiedData, remove: oldIds })

// Phase 3: Multi-series coordination
updateMultiSeriesData({ transactions: {...} })
```

### 3. Performance Fallbacks

```typescript
interface UpdatePerformanceConfig {
    /** Fall back to full update if transaction is too complex */
    complexityThreshold: number;

    /** Maximum batch size before splitting */
    maxBatchSize: number;

    /** Disable optimizations if performance degrades */
    performanceMonitoring: boolean;
}
```

### 4. Memory Safety

```typescript
interface MemorySafetyConfig {
    /** Maximum memory allocation per series */
    maxMemoryPerSeries: number;

    /** Emergency cleanup threshold */
    emergencyCleanupThreshold: number;

    /** Callback for memory pressure events */
    onMemoryPressure: () => void;
}
```

## Integration with Existing Architecture

### 1. Scene Graph Updates

```typescript
// Existing scene graph integration points
interface SceneGraphNode {
    /** Mark node as needing incremental update */
    markForIncrementalUpdate(changeSet: ChangeSet): void;

    /** Apply only necessary changes */
    applyIncrementalChanges(): void;

    /** Skip full recalculation if no changes */
    skipIfUnchanged(): boolean;
}
```

### 2. Animation System

```typescript
interface AnimationController {
    /** Handle incremental data animations */
    animateDataChanges(changeSet: ChangeSet): void;

    /** Interrupt existing animations for updates */
    interruptForUpdate(): void;

    /** Queue animations for batch processing */
    queueAnimations(animations: Animation[]): void;
}
```

### 3. Event System

```typescript
// New events for transaction lifecycle
interface TransactionEvents {
    /** Fired before transaction processing */
    transactionStart: (transaction: AgDataTransaction) => void;

    /** Fired after successful transaction */
    transactionComplete: (result: AgDataTransactionResult) => void;

    /** Fired if transaction fails */
    transactionError: (error: Error, transaction: AgDataTransaction) => void;

    /** Fired when data is automatically aged out */
    dataAged: (agedData: any[], seriesId: string) => void;
}
```

## Code Examples

### Basic Real-time Data Feed

```typescript
// Financial data feed simulation
class RealTimeDataFeed {
    private chart: AgChartInstance;
    private lastPrice = 100.0;

    constructor(chart: AgChartInstance) {
        this.chart = chart;
        this.startFeed();
    }

    private startFeed() {
        setInterval(() => {
            // Generate new tick data
            const tick = {
                timestamp: Date.now(),
                price: this.lastPrice + (Math.random() - 0.5) * 2,
                volume: Math.floor(Math.random() * 1000) + 500,
            };

            this.lastPrice = tick.price;

            // Efficiently append new data
            this.chart.updateDataAsync({
                append: [tick],
            });
        }, 100); // 10 updates per second
    }
}
```

### Multi-Series Coordination

```typescript
// Coordinated updates across price, volume, and indicators
class TradingChartController {
    private chart: AgChartInstance;

    async updateTick(tickData: TickData) {
        const result = await this.chart.updateMultiSeriesData({
            transactions: {
                ohlc: {
                    append: [
                        {
                            timestamp: tickData.timestamp,
                            open: tickData.price,
                            high: tickData.price,
                            low: tickData.price,
                            close: tickData.price,
                        },
                    ],
                },
                volume: {
                    append: [
                        {
                            timestamp: tickData.timestamp,
                            volume: tickData.volume,
                        },
                    ],
                },
                'sma-20': {
                    append: [
                        {
                            timestamp: tickData.timestamp,
                            value: this.calculateSMA(tickData.price, 20),
                        },
                    ],
                },
            },
            atomic: true,
            batchId: `tick-${tickData.timestamp}`,
        });

        console.log(
            `Updated ${result['ohlc'].totalDataSize} OHLC points, ` +
                `${result['volume'].totalDataSize} volume points in ` +
                `${result['ohlc'].processingTime}ms`
        );
    }
}
```

### Historical Data Loading

```typescript
// Efficient historical data loading
class HistoricalDataLoader {
    private chart: AgChartInstance;

    async loadHistoricalData(startDate: Date, endDate: Date) {
        // Load data in chunks to avoid blocking UI
        const chunkSize = 1000;
        const data = await this.fetchHistoricalData(startDate, endDate);

        for (let i = 0; i < data.length; i += chunkSize) {
            const chunk = data.slice(i, i + chunkSize);

            await this.chart.updateDataAsync({
                prepend: chunk, // Add to beginning for historical data
            });

            // Allow UI to remain responsive
            await new Promise((resolve) => setTimeout(resolve, 10));
        }
    }
}
```

### Data Window Management

```typescript
// Automatic data aging for memory management
const chartOptions: AgChartOptions = {
    dataWindow: {
        maxDataPoints: 50000, // Keep last 50K points
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        agingStrategy: 'time-based',
        onDataAged: (agedData) => {
            console.log(`Aged out ${agedData.length} data points`);
            // Optionally save to IndexedDB or server
            this.archiveData(agedData);
        },
    },
    series: [
        {
            type: 'line',
            xKey: 'timestamp',
            yKey: 'price',
        },
    ],
};
```

## Comparison with Current update() Method

| Aspect                | Current update()                | New updateData()                      |
| --------------------- | ------------------------------- | ------------------------------------- |
| **Data Processing**   | Full reprocessing (~393ms)      | Incremental processing (~15-30ms)     |
| **Memory Usage**      | Full dataset processing         | Delta-only processing                 |
| **Use Case**          | Configuration changes           | High-frequency data updates           |
| **Granularity**       | Entire chart options            | Specific data operations              |
| **Batching**          | Manual batching required        | Automatic batching                    |
| **Multi-series**      | All series updated              | Targeted series updates               |
| **Animation**         | Full animation restart          | Smooth incremental animations         |
| **Memory Management** | No automatic cleanup            | Built-in data windowing               |
| **Rendering Impact**  | Rendering already fast (~3-4ms) | Focus on data processing optimization |

### Migration Example

```typescript
// Before: Full data replacement
chart.update({
    ...currentOptions,
    data: [...existingData, ...newData],
});

// After: Incremental append
chart.updateData({
    append: newData,
});
```

## TypeScript Integration

### Generic Type Safety

```typescript
interface StockTick {
    timestamp: number;
    symbol: string;
    price: number;
    volume: number;
}

// Strongly typed chart instance
const stockChart = AgCharts.create<StockTick>({
    data: initialStockData,
    series: [
        {
            type: 'line',
            xKey: 'timestamp',
            yKey: 'price',
        },
    ],
});

// Type-safe transactions
await stockChart.updateData({
    append: [
        {
            timestamp: Date.now(),
            symbol: 'AAPL',
            price: 150.25,
            volume: 1000,
            // TypeScript ensures all required fields are present
        },
    ],
});
```

### Runtime Validation

```typescript
interface TransactionValidator<TDatum> {
    /** Validate transaction structure */
    validateTransaction(transaction: AgDataTransaction<TDatum>): ValidationResult;

    /** Validate data integrity */
    validateData(data: TDatum[]): ValidationResult;

    /** Custom validation rules */
    addRule(rule: ValidationRule<TDatum>): void;
}
```

## Performance Benchmarks Target

| Metric                | Target                | Current update()      |
| --------------------- | --------------------- | --------------------- |
| **Update Frequency**  | 100+ updates/sec      | ~10 updates/sec       |
| **Data Processing**   | <30ms for 1M points   | ~393ms for 1M points  |
| **Rendering Latency** | ~3-4ms (already fast) | ~3-4ms                |
| **Memory Growth**     | <1% per 1K updates    | 5-10% per update      |
| **CPU Usage**         | <20% during updates   | 60-80% during updates |
| **Concurrent Series** | 5+ series             | 2-3 series            |

## Conclusion

The incremental update API represents a significant evolution in AG Charts' data handling capabilities, directly addressing the performance bottlenecks that prevent real-time application adoption. By following AG Grid's proven transaction pattern, we ensure ecosystem consistency while delivering the performance characteristics required for modern financial and IoT applications.

The phased implementation approach minimizes risk while delivering incremental value, allowing early adopters to benefit from basic functionality while the full feature set is developed. The backward-compatible design ensures existing applications continue to work unchanged, while new applications can leverage the improved performance characteristics.

This design positions AG Charts to compete effectively in the high-frequency data visualization market while maintaining its zero-dependency philosophy and canvas-based performance advantages.
