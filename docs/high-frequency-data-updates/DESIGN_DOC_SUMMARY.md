# High-Frequency Data Updates - Executive Design Summary

**Status**: Design Phase | **Target**: 100+ updates/second | **Timeline**: 4-6 weeks

## Problem Statement

AG Charts currently struggles with high-frequency data updates (>10 updates/second), causing performance degradation in financial and IoT applications. Competitors like HighCharts handle 100+ updates/second effectively.

**Current Bottlenecks**:

-   Full data reprocessing on every update (68% of processing time)
-   Complete options reconciliation
-   No incremental update capability
-   Memory churn from constant object recreation

## Solution Overview

### Recommended Approach: Phased Implementation

**Phase 1 (4 weeks) - Core Delta Processing**

-   Implement transaction-based API following AG Grid patterns
-   Add incremental data processing pipeline
-   Expected: 60-70% performance improvement (393ms → 120-140ms for 1M points)

**Phase 2 (Optional, Post-Release) - Batching Optimization**

-   Add requestAnimationFrame-based update batching
-   Expected: Additional 10-15% improvement
-   Can be added transparently without API changes

## API Design

### Primary: Transaction-Based API (Following AG Grid Pattern)

```typescript
// Explicit transactions for precise control
chart.applyDataTransaction({
    add: [{ timestamp: 4000, value: 105 }],
    update: [{ id: 'trade-2', value: 102 }],
    remove: ['trade-3'],
});
```

### Secondary: Identifier-Based Updates (Optional)

```typescript
// Automatic delta detection with unique IDs
chart.update({
    data: newDataArray,
    dataId: 'id', // Specify unique identifier field
});
```

### Framework Integration

Following AG Grid's proven approach - simple JavaScript APIs called directly from frameworks:

```typescript
// React
const chartRef = useRef(null);
useEffect(() => {
    chartRef.current?.getInstance()
        .applyDataTransaction({ add: newData });
}, [newData]);

// Angular
@ViewChild(AgCharts) chart: AgCharts;
onDataUpdate(newData) {
    this.chart.getInstance()
        .applyDataTransaction({ add: newData });
}

// Vue
const chart = ref(null);
watch(data, (newData) => {
    chart.value?.getInstance()
        .applyDataTransaction({ add: newData });
});
```

## Technical Implementation

### Performance Profile Analysis

Testing with 1M data points reveals:

-   **Data Processing**: 393ms (68% of total)
-   **Canvas Rendering**: 3-4ms (<1% of total)
-   **Other Operations**: 183ms (32% - axis, layout, etc.)

**Key Insight**: Rendering optimization is unnecessary - focus entirely on data processing.

### Core Optimizations (Phase 1)

1. **Incremental DataModel Updates**

    - Reuse DataModel instances instead of recreation
    - Update only affected columns
    - Incremental domain calculations (append/update without full scan)

2. **Direct Data Mutation Paths**

    - Bypass options reconciliation for data-only updates
    - Dedicated `applyDataTransaction()` pipeline
    - Skip unchanged data ranges

3. **Memory Management**
    - Object pooling for node data
    - TypedArray backing for numeric columns (50% memory reduction)
    - Reuse processed data structures

### Implementation Components

```
Current Pipeline (Slow):
chart.update() → Full Reconciliation → New DataModel → Full Processing → Render

New Pipeline (Fast):
chart.applyDataTransaction() → Delta Detection → Update DataModel → Incremental Processing → Render
```

**Shared Infrastructure (60-70% of work)**:

-   Incremental domain calculations
-   Memory pooling system
-   Direct update paths
-   Selective series processing

## Architecture Changes

### DataController/DataModel Modifications

```typescript
// Current: Complete recreation
class DataModel {
    processData(data: any[]) {
        // Processes entire dataset
    }
}

// New: Incremental updates
class DataModel {
    applyTransaction(transaction: DataTransaction) {
        // Process only changes
        if (transaction.add) this.appendData(transaction.add);
        if (transaction.update) this.updateData(transaction.update);
        if (transaction.remove) this.removeData(transaction.remove);
    }
}
```

### Memory Retention Policies

```typescript
interface RetentionPolicy {
    maxPoints?: number; // Keep last N points
    maxDuration?: number; // Keep last N seconds
    maxMemory?: number; // Trim on memory pressure
}
```

## Success Metrics

| Metric                 | Target                | Validation Method         |
| ---------------------- | --------------------- | ------------------------- |
| Update Rate            | 100+ updates/sec      | Performance benchmark     |
| Processing Latency     | 120-140ms (Phase 1)   | Chrome DevTools profiling |
| Memory Stability       | <10% growth over 24hr | Heap snapshots            |
| Framework Overhead     | <5% additional        | Framework-specific tests  |
| Backward Compatibility | 100%                  | Existing test suite       |

## Risk Mitigation

| Risk                   | Mitigation                                                 |
| ---------------------- | ---------------------------------------------------------- |
| Breaking existing APIs | All changes additive, existing `update()` unchanged        |
| Framework performance  | Direct API calls bypass framework reconciliation           |
| Memory leaks           | Automatic retention policies, pooling infrastructure       |
| Complex implementation | Phase 1 focuses on core value (70% gain), defer complexity |

## Implementation Timeline

### Week 1-2: Core Infrastructure

-   Incremental DataModel implementation
-   Memory pooling system
-   Direct update pipeline

### Week 3: API Implementation

-   Transaction-based API
-   Optional identifier-based support
-   Framework integration examples

### Week 4: Testing & Optimization

-   Performance benchmarks
-   Memory profiling
-   Documentation

### Post-Release (Optional): Batching

-   RequestAnimationFrame integration
-   Update coalescing
-   Additional 10-15% performance gain

## Competitive Alignment

| Feature               | AG Charts (New)   | HighCharts       | AG Grid           |
| --------------------- | ----------------- | ---------------- | ----------------- |
| API Pattern           | Transaction-based | Stream-based     | Transaction-based |
| Performance           | 100+ updates/sec  | 100+ updates/sec | 150K+ updates/sec |
| Framework Integration | Direct API        | Wrappers         | Direct API        |
| Memory Management     | Automatic         | Manual           | Automatic         |

## Decision Points Resolved

1. **API Choice**: Transaction-based (matches AG Grid, proven pattern)
2. **Framework Strategy**: Direct JavaScript API (no framework-specific code)
3. **Batching**: Defer to Phase 2 (complexity vs immediate value)
4. **Rendering**: No optimization needed (already <1% of time)

## Next Steps

1. **Immediate**: Begin Phase 1 implementation (4 weeks)
2. **Testing**: Create performance benchmark suite
3. **Documentation**: Prepare migration guides for AG Grid users
4. **Customer Validation**: Early access program with financial services clients
5. **Phase 2 Decision**: Evaluate batching need based on Phase 1 results

---

_This design delivers 60-70% performance improvement in 4 weeks, with optional future enhancements for additional gains. The approach follows AG Grid's proven patterns, minimizing risk while maximizing compatibility and maintainability._
