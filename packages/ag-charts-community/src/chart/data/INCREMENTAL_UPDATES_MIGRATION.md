# Incremental Updates Migration Guide

This guide helps you migrate to the new incremental update system and understand any breaking changes or behavioral differences.

## Overview

The incremental update system introduces new APIs and optimizations while maintaining backward compatibility for existing code. However, there are some important considerations for developers who want to optimize their usage.

## What's New

### New Public APIs

#### DataModel.applyTransactions()

```typescript
// New method for high-performance incremental updates
applyTransactions<T>(
    dataRef: DataRef<T>,
    processedData: ProcessedData<D>,
    sources: Map<string, unknown[]>
): ProcessedData<D> | undefined
```

#### DataModel.supportsIncrementalUpdate()

```typescript
// New method to check if configuration supports incremental updates
public supportsIncrementalUpdate(): boolean
```

#### Enhanced Property Definitions

All processor interfaces now support the `supportsIncremental` flag:

```typescript
// AggregatePropertyDefinition
interface AggregatePropertyDefinition {
    // ... existing properties
    supportsIncremental?: boolean;
    incrementalUpdater?: (current: any, removed: any[], added: any[]) => any;
}

// GroupValueProcessorDefinition
interface GroupValueProcessorDefinition {
    // ... existing properties
    supportsIncremental?: boolean;
}

// PropertyValueProcessorDefinition
interface PropertyValueProcessorDefinition {
    // ... existing properties
    supportsIncremental?: boolean;
}

// ReducerOutputPropertyDefinition
interface ReducerOutputPropertyDefinition {
    // ... existing properties
    supportsIncremental?: boolean;
}

// ProcessorOutputPropertyDefinition
interface ProcessorOutputPropertyDefinition {
    // ... existing properties
    supportsIncremental?: boolean;
}
```

## No Breaking Changes

The incremental update system is designed to be **completely backward compatible**. All existing code will continue to work without modification.

### Chart API Compatibility

```typescript
// ✅ Existing chart.applyTransaction() API unchanged
chart.applyTransaction({
    append: [{ x: 4, y: 40 }],
    remove: [existingDataPoint],
    prepend: [{ x: 0, y: 5 }]
});

// ✅ Existing chart.setData() API unchanged
chart.setData(newDataArray);

// ✅ All existing configuration options still work
const chart = AgChart.create({
    data: [...],
    series: [...]
});
```

### DataModel API Compatibility

```typescript
// ✅ Existing DataModel.processData() unchanged
const processedData = dataModel.processData(sources);

// ✅ All existing property definitions work as before
const dataModel = new DataModel({
    props: [
        { type: 'key', property: 'x', valueType: 'range' },
        { type: 'value', property: 'y', valueType: 'range' },
    ],
});
```

## Migration Benefits

### Automatic Performance Improvements

Most applications will automatically benefit from incremental updates without code changes:

```typescript
// This code gets faster automatically
const chart = AgChart.create({
    data: initialData,
    series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
});

// These operations now use incremental updates under the hood
chart.applyTransaction({ append: newData });
chart.applyTransaction({ remove: oldData });
```

### Opt-in Optimizations

For maximum performance, you can enable specific optimizations:

#### 1. Disable Animations for High-Frequency Updates

```typescript
// Before: Animation enabled (default)
chart.applyTransaction(transaction);

// After: Disable animations for better performance
chart.update(ChartUpdateType.UPDATE_DATA, { skipAnimations: true });
```

#### 2. Check Incremental Support

```typescript
// New: Check if your configuration supports incremental updates
if (dataModel.supportsIncrementalUpdate()) {
    console.log('Incremental updates are enabled');
} else {
    console.log('Falling back to full reprocessing');
}
```

## Configuration Considerations

### Grouping Limitations

Grouping features are not yet supported with incremental updates:

```typescript
// ❌ Not supported with incremental updates (will fall back)
const dataModel = new DataModel({
    props: [...],
    groupByKeys: true  // Disables incremental updates
});

// ❌ Also not supported
const dataModel = new DataModel({
    props: [...],
    groupByFn: (data) => groupingFunction(data)  // Disables incremental updates
});

// ✅ Works with incremental updates
const dataModel = new DataModel({
    props: [...]  // No grouping - incremental updates enabled
});
```

### Processor Compatibility

Custom processors need to declare incremental support:

```typescript
// Before: Processor without incremental support flag
const processor = {
    type: 'property-value-processor',
    property: 'normalizedValue',
    adjust: () => (processedData, valueIndex) => {
        // Complex normalization requiring full dataset
    }
};

// After: Explicitly declare incremental support
const processor = {
    type: 'property-value-processor',
    property: 'normalizedValue',
    adjust: () => (processedData, valueIndex) => {
        // Complex normalization requiring full dataset
    },
    supportsIncremental: false  // Explicitly disable for this processor
};
```

### Aggregation Updates

For custom aggregations, implement incremental updaters for better performance:

```typescript
// Before: Only full recalculation
const aggregation = {
    type: 'aggregate',
    aggregateFunction: (values) => values.reduce((a, b) => a + b, 0)
};

// After: Add incremental support
const aggregation = {
    type: 'aggregate',
    aggregateFunction: (values) => values.reduce((a, b) => a + b, 0),
    supportsIncremental: true,
    incrementalUpdater: (current, removed, added) => {
        const removedSum = removed.reduce((a, b) => a + b, 0);
        const addedSum = added.reduce((a, b) => a + b, 0);
        return current - removedSum + addedSum;
    }
};
```

## Performance Migration

### High-Frequency Update Patterns

If you have high-frequency update scenarios, consider these optimizations:

#### Before: Standard Updates

```typescript
// Standard approach - works but not optimized
setInterval(() => {
    const newPoint = generateDataPoint();
    chart.applyTransaction({ append: [newPoint] });
}, 16); // 60 FPS
```

#### After: Optimized High-Frequency Updates

```typescript
// Optimized approach with batching and animation control
class HighFrequencyUpdater {
    private pendingUpdates: any[] = [];
    private updateTimer: NodeJS.Timeout | null = null;

    addDataPoint(point: any) {
        this.pendingUpdates.push(point);

        if (!this.updateTimer) {
            this.updateTimer = setTimeout(() => this.flush(), 16);
        }
    }

    private flush() {
        if (this.pendingUpdates.length > 0) {
            chart.applyTransaction({ append: this.pendingUpdates });
            // Disable animations for high-frequency updates
            chart.update(ChartUpdateType.UPDATE_DATA, { skipAnimations: true });
            this.pendingUpdates = [];
        }
        this.updateTimer = null;
    }
}
```

### Memory Management Migration

#### Before: No Memory Management

```typescript
// Potential memory leak with unlimited growth
setInterval(() => {
    chart.applyTransaction({ append: [newDataPoint()] });
}, 100);
```

#### After: Memory-Aware Updates

```typescript
class MemoryManagedChart {
    private readonly maxDataPoints = 1000;

    addDataPoint(point: any) {
        const transaction: any = { append: [point] };

        // Remove old data when approaching limit
        if (chart.data.length >= this.maxDataPoints) {
            const excess = chart.data.length + 1 - this.maxDataPoints;
            transaction.remove = chart.data.slice(0, excess);
        }

        chart.applyTransaction(transaction);
    }
}
```

## Testing and Validation

### Verifying Incremental Updates

```typescript
// Test that incremental updates are working
function testIncrementalUpdates() {
    const startTime = performance.now();

    // Apply a small transaction
    chart.applyTransaction({
        append: [{ x: Date.now(), y: Math.random() }],
    });

    const endTime = performance.now();
    const updateTime = endTime - startTime;

    // Incremental updates should be very fast (< 5ms typically)
    console.log(`Update time: ${updateTime.toFixed(2)}ms`);

    if (updateTime < 5) {
        console.log('✅ Incremental updates working');
    } else {
        console.log('⚠️  May be falling back to full reprocessing');
    }
}
```

### Comparing Performance

```typescript
// Benchmark comparison tool
class PerformanceComparison {
    async compareApproaches(testData: any[]) {
        // Test full replacement
        const fullStart = performance.now();
        chart.setData([...chart.data, ...testData]);
        const fullTime = performance.now() - fullStart;

        // Reset chart
        chart.setData(originalData);

        // Test incremental approach
        const incStart = performance.now();
        chart.applyTransaction({ append: testData });
        const incTime = performance.now() - incStart;

        console.log(`Full replacement: ${fullTime.toFixed(2)}ms`);
        console.log(`Incremental update: ${incTime.toFixed(2)}ms`);
        console.log(`Speedup: ${(fullTime / incTime).toFixed(1)}x`);
    }
}
```

## Troubleshooting Migration Issues

### Common Warning Messages

#### "Incremental updates disabled: grouping not yet supported"

```typescript
// Problem: Using grouping with incremental updates
const config = {
    groupByKeys: true  // This disables incremental updates
};

// Solution: Remove grouping or accept full reprocessing
const config = {
    // Remove groupByKeys for incremental updates
};
```

#### "Incremental updates disabled due to aggregations: [list]"

```typescript
// Problem: Custom aggregation without incremental support
const aggregation = {
    type: 'aggregate',
    aggregateFunction: complexCalculation  // No incremental support
};

// Solution: Add incremental support or mark as non-incremental
const aggregation = {
    type: 'aggregate',
    aggregateFunction: complexCalculation,
    supportsIncremental: false  // Explicitly disable
};
```

### Performance Regression Investigation

If you experience performance regression after updating:

1. **Check Configuration**

    ```typescript
    console.log('Supports incremental:', dataModel.supportsIncrementalUpdate());
    ```

2. **Monitor Update Times**

    ```typescript
    const start = performance.now();
    chart.applyTransaction(transaction);
    console.log('Update time:', performance.now() - start);
    ```

3. **Verify Transaction Size**
    ```typescript
    const size =
        (transaction.append?.length || 0) + (transaction.remove?.length || 0) + (transaction.prepend?.length || 0);
    console.log('Transaction size:', size);
    ```

### Debugging Checklist

-   [ ] Configuration supports incremental updates
-   [ ] Transaction sizes are reasonable (< 100 items for optimal performance)
-   [ ] No grouping features are enabled
-   [ ] Custom processors have appropriate `supportsIncremental` flags
-   [ ] Memory management is in place for long-running applications
-   [ ] Update frequency is not overwhelming the system

## Best Practices for Migration

1. **Start Simple**: Begin with basic incremental updates before optimizing
2. **Monitor Performance**: Use the provided performance monitoring tools
3. **Test Thoroughly**: Verify behavior with your specific data patterns
4. **Gradual Migration**: Migrate high-frequency scenarios first
5. **Fallback Strategy**: Always have a fallback to full reprocessing
6. **Profile Real Usage**: Test with production-like data volumes and patterns

## Support and Resources

-   **Performance Guide**: See `INCREMENTAL_UPDATES_PERFORMANCE.md`
-   **Usage Examples**: See `INCREMENTAL_UPDATES_USAGE.md`
-   **API Documentation**: Check JSDoc comments in the source code
-   **Issues**: Report problems through normal AG Charts support channels

The incremental update system is designed to provide significant performance improvements while maintaining full backward compatibility. Most applications will benefit automatically, and those with high-frequency update patterns can achieve even greater improvements with targeted optimizations.
