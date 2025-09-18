# High-Frequency Data Updates - Design Document

Status: **Design Phase** | [TODO](./TODO.md) | [PRD](./PRD.md) | [Competitive Analysis](./COMPETITIVE-ANALYSIS.md)

## Quick Navigation

🎯 **[Simplified API →](./SIMPLIFIED-API.md)** | 📊 **[Comparison Matrix →](./COMPARISON-MATRIX.md)** | 🔄 **[Hybrid Approach →](./HYBRID-APPROACH.md)** | 📝 **[Framework Examples →](./FRAMEWORK-INTEGRATION-EXAMPLES.md)**

## Executive Summary

This document outlines the technical design for implementing high-frequency data update capabilities in AG Charts, targeting 100+ updates per second with minimal performance degradation. After comprehensive analysis, we recommend a **phased approach**: Phase 1 implements efficient delta processing with the Transaction-Based API (Option B) while optionally supporting identifier-based updates (Option A) for hybrid coverage, delivering 60-70% performance improvement. Phase 2 adds optional batching optimization for an additional 10-15% gain.

## Sub-documents

### 🎯 Recommended Implementation (NEW)

-   **[Simplified API Design](./SIMPLIFIED-API.md)** - Framework-agnostic JavaScript API following AG Grid's proven pattern
-   **[Framework Integration Examples](./FRAMEWORK-INTEGRATION-EXAMPLES.md)** - Practical examples for React, Angular, and Vue using direct API calls

### Core Analysis Documents

-   **[Data Flow Analysis](./DATA-FLOW-ANALYSIS.md)** - Comprehensive technical analysis of current data flow from API to scene graph
-   **[Comparison Matrix](./COMPARISON-MATRIX.md)** - Comprehensive evaluation of all options with final recommendation
-   **[Solution Alignment Analysis](./SOLUTION-ALIGNMENT-ANALYSIS.md)** - Cross-reference with AG Grid and competitor approaches
-   **[Hybrid Approach](./HYBRID-APPROACH.md)** - Combining strategies for optimal solution

### Shared Implementation

-   **[Common Implementation Elements](./COMMON-IMPLEMENTATION-ELEMENTS.md)** - Infrastructure shared across all options (60-70% of work)
-   **[Line Series Common Implementation](./LINE-SERIES-COMMON-IMPLEMENTATION.md)** - Core optimizations required by all approaches

### Option B Implementation Details (Transaction-Based API)

-   **[Design Document](./option-b-transaction-api/OPTION-B-TRANSACTION-API.md)** - Transaction-based API design

### Option C Implementation Details (Stream-Based API)

-   **[Design Document](./option-c-stream-api/OPTION-C-STREAM-API.md)** - Native streaming without dependencies

### Internal Implementation Strategy 1: Batched Update Queue (Optional - Phase 2)

-   **[Design Document](./internal-batched-queue/BATCHED-UPDATE-QUEUE.md)** - Frame-aligned batching system
-   **Note**: This is an optional Phase 2 optimization that can be added post-release

### Internal Implementation Strategy 2: Differential Updates ❌ (Not Recommended)

-   **[Design Document](./internal-virtual-dom/DIFFERENTIAL-UPDATES.md)** - Virtual DOM analysis showing why this approach fails

## Current Architecture Analysis

For a comprehensive technical analysis of the current data flow from API calls to scene graph rendering, see **[DATA-FLOW-ANALYSIS.md](./DATA-FLOW-ANALYSIS.md)**.

### Update Pipeline Summary

-   **Current Flow**: `chart.update()` → `UpdateService` → Full options reconciliation → DataController/DataModel processing → Series node creation → Canvas re-render
-   **Key Components**:
    -   **DataController**: Coordinates data processing across all series, manages caching
    -   **DataModel**: Performs heavy data transformation (68% of total processing time), extracts values, calculates domains, handles grouping/stacking
    -   **Series**: Uses DataModel columns to create scene graph nodes
-   **Critical Bottlenecks** (see [DATA-FLOW-ANALYSIS.md](./DATA-FLOW-ANALYSIS.md#critical-bottlenecks-identified) for details):
    -   Full options reconciliation on every update
    -   Complete data array replacement with no incremental capability
    -   New DataController/DataModel instances created each update
    -   All data points reprocessed from scratch
    -   Domains fully recalculated every time
    -   No reuse of processed columns or node data

### Existing Infrastructure

-   **DataService**: Already implements throttling and `dispatchOnlyLatest` for lazy loading scenarios
-   **MementoCaretaker**: Preserves zoom/navigator state across updates but can cause axis domain churn
-   **UpdateService**: Coordinates updates but lacks incremental data handling capabilities

### Framework Integration

-   **React** (`packages/ag-charts-react/src/index.ts`):
    -   Creates chart in `useLayoutEffect`, updates via `useEffect` on options identity change
    -   Consumers typically regenerate options objects on each render
-   **Angular** (`packages/ag-charts-angular/projects/ag-charts-angular/src/lib/ag-charts-base.ts`):
    -   `ngOnChanges` triggers full updates, runs outside Angular zone for performance
    -   Still requires object cloning per update
-   **Vue** (`packages/ag-charts-vue3/src/index.ts`):
    -   Watches options object and spreads to create new object on each update
    -   No granular reactivity for data-only changes

### Performance Constraints

-   Canvas rendering limited by browser's 60 FPS (16.67ms frame budget)
-   JavaScript main thread blocking during large data processing
-   Memory allocation/GC pressure from continuous data replacement
-   No public telemetry for monitoring performance metrics

## Performance Profile Analysis

### Empirical Performance Data

Analysis of loading 1M data points into a single-line series with `window.agChartsDebug = 'scene:stats'` reveals critical insights:

**Performance Breakdown (580ms total):**

-   **Data Processing**: 393ms (68% of total time)
-   **Canvas Rendering**: 3-4ms (<1% of total time)
-   **Scene Graph Operations**: ~0.2ms
-   **Other Operations**: ~183ms combined (axis calculations ~65ms, layout ~110ms, etc.)

This profile fundamentally challenges assumptions about performance bottlenecks. The actual canvas rendering operations complete in just 3-4 milliseconds, while data processing dominates execution time.

### Implications for Solution Design

#### Rendering Culling is Redundant

Several implementation options discuss sophisticated rendering culling strategies (viewport clipping, off-screen element skipping, partial redraws). However, with full canvas re-renders taking only 3-4ms, these optimizations are:

-   **Unnecessary**: The performance gain from avoiding renders is negligible
-   **Complex**: Viewport tracking and partial updates add significant code complexity
-   **Error-prone**: Culling logic can introduce visual artifacts and edge cases
-   **Counter-productive**: The overhead of determining what to cull may exceed render cost

#### Focus on Data Processing

Since data processing consumes ~68% of execution time (with additional overhead from axis/layout operations), optimization efforts should target:

-   **Incremental data processing**: Avoid reprocessing unchanged data
-   **Efficient data structures**: Optimize for append/update operations
-   **Memory allocation patterns**: Reduce GC pressure during updates
-   **Batching strategies**: Coalesce multiple updates before processing

### Revised Optimization Priorities

Based on this analysis, the implementation approach should prioritize:

1. **Data Layer Optimization** (Critical)

    - Incremental domain calculations
    - Efficient data indexing
    - Update batching/coalescing
    - Memory pooling for transient objects

2. **Update Pipeline Efficiency** (Important)

    - Skip unnecessary reconciliation steps
    - Direct data mutation paths
    - Frame-aligned batch processing

3. **Rendering** (Already Optimized)
    - Keep existing full canvas redraw
    - No complex culling logic needed
    - Focus on maintaining current 3-4ms performance

This performance profile validates prioritising core delta processing as the primary optimisation target, with Phase 2 batching treated as an optional enhancement once the data-processing gains are realised.

## Design Goals & Non-Goals

### Goals

-   Support 100+ updates/second for 5 concurrent series
-   Maintain 120-140ms redraw latency in Phase 1, with <50ms as a stretch target once batching is enabled
-   Automatic memory management with configurable retention
-   Zero runtime dependencies
-   Backward compatible with existing API
-   Minimal framework reconciliation overhead

### Non-Goals

-   WebGL/WebAssembly rendering (maintain Canvas-only)
-   Server-side aggregation or data processing
-   Bi-directional data binding
-   Background worker processing (initially)
-   Framework-specific or optimized implementations (React, Angular, Vue)

## User-Facing API Options

The first key decision is how users will provide data changes to AG Charts. This is separate from how we internally process those changes.

### Option A: Unique Identifier-Based Delta Detection (NEW)

**Approach**: Users provide full data array with unique identifiers; system automatically detects changes

**How it works**:

```typescript
// User provides data with unique IDs
chart.update({
    data: [
        { id: 'trade-1', timestamp: 1000, value: 100 },
        { id: 'trade-2', timestamp: 2000, value: 102 }, // Updated
        { id: 'trade-4', timestamp: 4000, value: 105 }, // New
        // trade-3 is implicitly removed
    ],
    dataId: 'id', // Specify which field is the unique identifier
});
```

**Pros**:

-   Simplest API for users - just provide data
-   Follows AG Grid's `getRowId` pattern
-   No need to track changes explicitly
-   Works with existing `update()` method

**Cons**:

-   Requires unique IDs in data
-   System must compute delta (O(n) comparison)
-   Memory overhead for tracking previous state

### Option B: Transaction-Based API (Incremental Updates)

**Approach**: Explicit `applyDataTransaction()` method with add/update/remove operations

**How it works**:

```typescript
chart.applyDataTransaction({
    add: [{ timestamp: 4000, value: 105 }],
    update: [{ id: 'trade-2', value: 102 }],
    remove: ['trade-3'],
});
```

**Pros**:

-   Precise control over operations
-   Follows AG Grid transaction pattern
-   No delta computation needed
-   Optimal performance

**Cons**:

-   Users must track changes
-   More complex API
-   Requires learning new patterns

For detailed design of Option B implementation, see [Transaction-Based API Design](./option-b-transaction-api/OPTION-B-TRANSACTION-API.md)

### Option C: Stream-Based API

**Approach**: Observable/stream pattern for continuous updates

**How it works**:

```typescript
const stream = chart.createDataStream();
stream.next({ timestamp: Date.now(), value: 105 });
```

**Pros**:

-   Natural for real-time data
-   Built-in backpressure handling
-   Composable with RxJS/streams

**Cons**:

-   New paradigm for AG ecosystem
-   Learning curve
-   Dependency considerations

For detailed design of Option C implementation, see [Stream-Based API Design](./option-c-stream-api/OPTION-C-STREAM-API.md)

### Option D: Enhanced Current Approach

**Approach**: Continue using `update()`/`updateDelta()` with internal optimizations

**Pros**:

-   No API changes
-   Backward compatible
-   Familiar to users

**Cons**:

-   Limited optimization potential
-   No explicit change semantics
-   Framework reconciliation overhead

### Option E: Hybrid Approach (API Recommendation)

**Approach**: Support both identifier-based (Option A) and transaction-based (Option B)

```typescript
// Method 1: Automatic delta detection
chart.update({ data: newData, dataId: 'id' });

// Method 2: Explicit transactions
chart.applyDataTransaction({ add: [...], update: [...] });
```

**Pros**:

-   Flexibility for different use cases
-   Easy migration path
-   Matches AG Grid patterns

**Cons**:

-   Two patterns to maintain
-   Potential user confusion without clear guidance

## Internal Implementation Strategies

Regardless of the API choice, these are the internal optimizations needed:

### Core Requirement: Efficient Delta Processing

**Focus**: Process only changed data, not entire dataset

Based on the [Data Flow Analysis](./DATA-FLOW-ANALYSIS.md), the critical bottlenecks are:

1. **DataModel Recreation** (68% of processing time):

    - New DataModel instances created on every update
    - Complete re-extraction of all data values
    - Full domain recalculation from scratch
    - No reuse of processed columns

2. **Options Reconciliation**:

    - Full deep clone and reconciliation on every update
    - No distinction between data and configuration changes

3. **Data Replacement**:
    - Entire data array pushed to series
    - `forceNodeDataRefresh` triggers full reprocessing
    - No incremental update capability

**Key Optimizations Required**:

-   **Incremental DataModel Updates**:

    -   Reuse existing DataModel instances
    -   Update only affected columns
    -   Incremental domain calculation (append/update/remove without full scan)
    -   Cache property definitions between updates

-   **Direct Data Mutation Paths**:

    -   Bypass options reconciliation for data-only updates
    -   Dedicated `applyDataTransaction()` API
    -   Direct updates to DataModel columns

-   **Memory Management**:

    -   Object pooling for node data and markers
    -   TypedArray backing for numeric columns (50% memory reduction)
    -   Reuse processed data structures

-   **Selective Processing**:
    -   Process only affected series
    -   Skip unchanged data ranges
    -   Leverage visible range calculations for partial updates

**Performance Impact**: 60-70% reduction in processing time with delta processing alone (393ms → 120-140ms for 1M points)

### Optimization 1: Batched Update Queue (Optional - Phase 2)

**Approach**: Queue updates and process in animation frames

**Status**: **Optional optimization for Phase 2**, not required for initial release

**Rationale**:

-   Adds complexity to initial implementation
-   Core delta processing provides most value (60-70% improvement)
-   Can be added transparently after launch
-   Provides additional 10-15% performance gain when added

For design details, see [Batched Update Queue Design](./internal-batched-queue/BATCHED-UPDATE-QUEUE.md)

### Optimization 2: Memory Management

**Approach**: Implement retention policies and ring buffers

**Components**:

-   Time-based retention (keep last N minutes)
-   Count-based retention (keep last N points)
-   Ring buffer for fixed-size windows
-   Automatic trimming on memory pressure

### Optimization 3: Rendering Pipeline

**Note**: Rendering is only 3-4ms (less than 1% of total time)

**Minimal optimizations needed**:

-   Keep full canvas redraw (already fast)
-   No complex culling needed
-   Focus on data processing instead

## Recommended Implementation Approach

### Phase 1: Core Delta Processing (4 weeks)

**Priority**: Implement efficient delta processing regardless of API choice

1. **Incremental data processing pipeline** (2 weeks)

    - Partial series updates
    - Incremental domain calculations
    - Memory pooling infrastructure

2. **API Implementation** (1 week)

    - Transaction-based API (Option B) as primary
    - Optional identifier-based API (Option A) for simpler use cases
    - Keep API surface minimal initially

3. **Testing and optimization** (1 week)
    - Performance benchmarks
    - Memory profiling
    - Framework integration testing

### Phase 2: Performance Optimizations (2-3 weeks) - Optional Post-Release

**Can be deferred to post-release**

1. **Batched Update Queue** (1-2 weeks)

    - Add requestAnimationFrame batching
    - Implement coalescing strategies
    - Queue overflow handling

2. **Advanced Memory Management** (1 week)
    - Sophisticated retention policies
    - Predictive memory allocation
    - GC optimization

### Phase 3: Additional API Options (Future)

1. Stream-based API if customer demand
2. WebSocket adapters
3. Framework-specific helpers

## Framework Integration Strategy

### Learning from AG Grid: Simple JavaScript API Approach

Based on AG Grid's proven approach to high-frequency updates (achieving 150,000+ updates/second), we are adopting a **framework-agnostic JavaScript API** rather than creating complex framework-specific implementations.

**Key Principle**: Provide powerful JavaScript APIs that developers can call directly from their framework components, rather than creating framework-specific wrappers, hooks, or services.

### Why This Approach?

1. **Proven Performance**: AG Grid achieves exceptional performance without framework-specific APIs
2. **Simplicity**: 70-80% less code to maintain
3. **Consistency**: Same API across all frameworks
4. **Developer Freedom**: Let developers use their preferred framework patterns
5. **Maintenance**: Easier to document, test, and evolve

### Core JavaScript API

The high-frequency update capability is exposed through simple chart instance methods:

```javascript
// Option A: Identifier-based automatic delta detection
chart.update({
    data: newDataArray,
    dataId: 'id' // Field to use as unique identifier
});

// Option B: Explicit transaction (for precise control)
chart.applyDataTransaction({
    add: [...],
    update: [...],
    remove: [...],
});

// Future: Async transaction with batching (Phase 2 optimization)
chart.applyDataTransactionAsync({
    add: [...],
    update: [...],
    remove: [...],
});
```

### Framework Integration Examples

Developers get a reference to the chart instance and call methods directly:

#### React

```javascript
const chartRef = useRef(null);

useEffect(() => {
    const chart = chartRef.current?.getInstance();
    chart?.applyDataTransaction({ add: newData });
}, [newData]);
```

#### Angular

```typescript
@ViewChild(AgCharts) chart: AgCharts;

onDataUpdate(newData) {
    this.chart.getInstance().applyDataTransaction({ add: newData });
}
```

#### Vue

```javascript
const chart = ref(null);

watch(data, (newData) => {
    chart.value?.getInstance().applyDataTransaction({ add: newData });
});
```

### Common Integration Principles

1. **Get chart instance reference** using framework patterns
2. **Call JavaScript API methods** directly
3. **Disable animations** for high-frequency updates via options
4. **Let developers choose** their own optimization patterns
5. **Provide examples** not prescriptive implementations

### Archived Framework-Specific Approaches

Previous framework-specific implementation documents have been archived in `./archived-framework-specific/` for reference. These approaches were deemed overly complex compared to AG Grid's simpler pattern.

## Testing Strategy

### Unit Tests

-   Queue behavior under various load patterns
-   Retention policy correctness
-   Memory leak detection
-   Framework wrapper isolation

### Integration Tests

-   Multi-series update coordination
-   Interaction with existing features (zoom, crosshairs)
-   Framework integration scenarios

### Performance Tests

-   Handle 100+ updates/second with acceptable FPS
-   Verify latency under sustained load
-   Memory stability over extended periods

### Benchmarks

-   Sustained load: 1000 updates/sec for 5 minutes
-   Burst patterns: 0-500-0 updates/sec cycles
-   Memory stability: 24-hour continuous updates
-   Framework overhead: Measure reconciliation cost
-   Visual regression: Ensure interactions remain stable under live updates
-   CPU usage validation for framework-specific integration (target: <80% at 100 updates/sec)

## Open Questions

-   **API Standardization**: Should we expose both identifier-based `update()` support and transaction APIs, or standardize on one approach?
-   **Enterprise Feature Behavior**: How do annotations, tooltips, and other enterprise features behave under rapid updates? Do we need feature-specific performance budgets?
-   **Worker Environment Support**: Do we need explicit scheduling hooks for alignment with worker timers in worker-heavy environments?
-   **Framework Guardrails**: What safeguards prevent accidental controller recreation during component lifecycle events?
-   **Hybrid Data Sources**: How do we integrate streaming updates with existing lazy-loading `DataService` for hybrid pull/push scenarios?

## Key Findings & Recommendations

Based on comprehensive analysis documented in the sub-documents:

### Primary Recommendation: Phased Approach

#### Phase 1: Core Delta Processing (Required)

-   **API**: Transaction-based (Option B) as primary, with optional identifier-based (Option A) support
-   **Internal**: Efficient incremental data processing
-   **Timeline**: 4 weeks
-   **Performance**: 60-70% improvement from delta processing alone

#### Phase 2: Batching Optimization (Optional Post-Release)

-   **Internal**: Add batched update queue for additional performance
-   **Timeline**: 2-3 weeks (can be done post-release)
-   **Performance**: Additional 10-15% improvement
-   **Note**: Transparent optimization that doesn't change public API

#### Phase 3: Extended APIs (Future)

-   **API**: Option C (Streaming) if customer demand
-   **Timeline**: As needed
-   **Note**: Only if specific use cases require it

### Why Defer Batching?

1. **Complexity Reduction**: Batching adds significant complexity
2. **Core Value**: Delta processing provides most performance gain (70%)
3. **Transparent Addition**: Can add batching without API changes
4. **Faster Delivery**: Ship core functionality 3-4 weeks earlier
5. **Lower Risk**: Simpler initial implementation

### Expected Outcomes

#### With Phase 1 Only:

-   **Performance**: 60-70% improvement (from delta processing)
-   **Timeline**: 4 weeks
-   **Risk**: Low
-   **Complexity**: Manageable

#### With Phase 1 + 2:

-   **Performance**: 70-85% improvement (delta + batching)
-   **Timeline**: 6-7 weeks total (or 4 weeks + post-release enhancement)
-   **Risk**: Low-medium
-   **Complexity**: Moderate

For detailed analysis, see the **[Comparison Matrix](./COMPARISON-MATRIX.md)** and **[Hybrid Approach](./HYBRID-APPROACH.md)** documents.

## Success Metrics

-   Achieve 100+ updates/sec with 120-140ms processing latency in Phase 1 (stretch goal: <50ms with optional batching)
-   Memory usage stable over 24-hour period (Achievable with memory pooling)
-   60-70% reduction in processing time with Phase 1 implementation
-   Additional 10-15% improvement with optional Phase 2 batching to approach sub-50ms latency
-   Zero performance regressions for existing use cases (Backward compatible design)
-   Customer validation from financial services sector (Pending implementation)
-   Successful migration of enterprise customers from competitor solutions (Post-release target)
