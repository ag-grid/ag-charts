# High-Frequency Data Updates - Design Document

Status: **Complete** ([TODO](./TODO.md)) | [PRD](./PRD.md) | [Competitive Analysis](./COMPETITIVE-ANALYSIS.md)

## Quick Navigation

📊 **[Jump to Final Recommendation →](./COMPARISON-MATRIX.md)** | 🔄 **[Hybrid Approach →](./HYBRID-APPROACH.md)** | ⚡ **[Option 3 Design →](./option-3-batched-update-queue/OPTION-3-BATCHED-UPDATE-QUEUE.md)**

## Executive Summary

This document outlines the technical design for implementing high-frequency data update capabilities in AG Charts, targeting 100+ updates per second with minimal performance degradation. After comprehensive analysis of four approaches, we recommend **Option 3 (Batched Update Queue)** combined with **Option 1's API design** as a hybrid solution that delivers 2-3x performance improvement while maintaining AG Grid API compatibility.

## Sub-documents

### Core Analysis Documents

-   **[Comparison Matrix](./COMPARISON-MATRIX.md)** - Comprehensive evaluation of all options with final recommendation
-   **[Solution Alignment Analysis](./SOLUTION-ALIGNMENT-ANALYSIS.md)** - Cross-reference with AG Grid and competitor approaches
-   **[Hybrid Approach](./HYBRID-APPROACH.md)** - Combining strategies for optimal solution

### Shared Implementation

-   **[Common Implementation Elements](./COMMON-IMPLEMENTATION-ELEMENTS.md)** - Infrastructure shared across all options (60-70% of work)
-   **[Line Series Common Implementation](./LINE-SERIES-COMMON-IMPLEMENTATION.md)** - Core optimizations required by all approaches

### Framework Standards & Review

-   **[Framework Review Summary](./FRAMEWORK-REVIEW-SUMMARY.md)** - Expert review findings and critical issues across all framework implementations
-   **[Cross-Framework Standards](./CROSS-FRAMEWORK-STANDARDS.md)** - Unified standards for consistent implementation across React, Angular, and Vue

### Option 1: Incremental Update API

-   **[Design Document](./option-1-incremental-update/OPTION-1-INCREMENTAL-UPDATE.md)** - Transaction-based API design
-   **[Line Series Feasibility](./option-1-incremental-update/LINE-SERIES-FEASIBILITY.md)** - LineSeries-specific analysis
-   **Framework Implementations:**
    -   [React Implementation](./option-1-incremental-update/REACT-IMPLEMENTATION.md)
    -   [Angular Implementation](./option-1-incremental-update/ANGULAR-IMPLEMENTATION.md)
    -   [Vue Implementation](./option-1-incremental-update/VUE-IMPLEMENTATION.md)

### Option 2: Stream-Based API

-   **[Design Document](./option-2-stream-based/OPTION-2-STREAM-BASED.md)** - Native streaming without dependencies
-   **[Line Series Feasibility](./option-2-stream-based/LINE-SERIES-FEASIBILITY.md)** - Streaming challenges and solutions
-   **Framework Implementations:**
    -   [React Implementation](./option-2-stream-based/REACT-IMPLEMENTATION.md)
    -   [Angular Implementation](./option-2-stream-based/ANGULAR-IMPLEMENTATION.md)
    -   [Vue Implementation](./option-2-stream-based/VUE-IMPLEMENTATION.md)

### Option 3: Batched Update Queue ✅ (Recommended)

-   **[Design Document](./option-3-batched-update-queue/OPTION-3-BATCHED-UPDATE-QUEUE.md)** - Frame-aligned batching system
-   **[Line Series Feasibility](./option-3-batched-update-queue/LINE-SERIES-FEASIBILITY.md)** - Highest feasibility score
-   **Framework Implementations:**
    -   [React Implementation](./option-3-batched-update-queue/REACT-IMPLEMENTATION.md)
    -   [Angular Implementation](./option-3-batched-update-queue/ANGULAR-IMPLEMENTATION.md)
    -   [Vue Implementation](./option-3-batched-update-queue/VUE-IMPLEMENTATION.md)

### Option 4: Differential Updates ❌ (Not Recommended)

-   **[Design Document](./option-4-differential-updates/OPTION-4-DIFFERENTIAL-UPDATES.md)** - Virtual DOM analysis showing why this approach fails
-   **[Line Series Feasibility](./option-4-differential-updates/LINE-SERIES-FEASIBILITY.md)** - Evidence against this approach

## Current Architecture Analysis

### Update Pipeline

-   **Current Flow**: `chart.update()` → `UpdateService` → Full options reconciliation → Series data processing → Canvas re-render
-   **Implementation Details**:
    -   `AgChartInstance.update()` (via `AgChartInstanceProxy`) deep-clones options through `AgChartsInternal.createOrUpdate`
    -   Any update triggers the same staged pipeline in `Chart` class:
        1. `updateData()` pushes entire `chart.data` array to each series
        2. `processData()` creates new `DataController`, re-derives domains, updates legend
        3. Layout and render steps follow, with animation gating
    -   `updateDelta` avoids re-applying unchanged options but still treats data as replace-only
-   **Bottlenecks**:
    -   Full options reconciliation on every update
    -   Complete data array replacement triggers full re-processing
    -   No distinction between data-only and configuration updates
    -   Framework wrappers trigger reconciliation on every prop change

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

-   **Data Processing**: ~393ms (67.8% of total time)
-   **Canvas Rendering**: ~3.3ms (0.6% of total time)
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

This performance profile validates the recommended Option 3 (Batched Update Queue) approach, which focuses on data processing efficiency rather than rendering optimization.

## Design Goals & Non-Goals

### Goals

-   Support 100+ updates/second for 5 concurrent series
-   Maintain <50ms redraw latency under sustained load
-   Automatic memory management with configurable retention
-   Zero runtime dependencies
-   Backward compatible with existing API
-   Minimal framework reconciliation overhead

### Non-Goals

-   WebGL/WebAssembly rendering (maintain Canvas-only)
-   Server-side aggregation or data processing
-   Bi-directional data binding
-   Background worker processing (initially)

## Solution Options

### Option 1: Incremental Update API

**Approach**: New `updateData()` method that bypasses full reconciliation

**Pros**:

-   Minimal API surface change
-   Clear separation of data vs configuration updates
-   Easy to implement incremental rendering

**Cons**:

-   Requires users to manage update operations
-   Complex for multi-series updates
-   Doesn't address framework reconciliation

### Option 2: Stream-Based API

**Approach**: Observable/stream pattern for continuous updates

**Pros**:

-   Natural fit for real-time data
-   Built-in backpressure handling
-   Familiar pattern for developers

**Cons**:

-   Larger API surface change
-   Potential confusion with existing update mechanism
-   May require polyfills for older browsers

### Option 3: Batched Update Queue with Data Transactions (Recommended)

**Approach**: Internal queue that batches updates within animation frames with structured transactions

**Pros**:

-   Backward compatible with progressive enhancement
-   Automatic batching reduces render calls
-   Framework-agnostic solution
-   Natural integration with existing UpdateService
-   Supports atomic batch operations with sequence ordering
-   Can leverage existing `DataService` throttling infrastructure

**Cons**:

-   Internal complexity for queue management
-   Need careful memory management
-   Must ensure navigator/zoom state consistency during transactions

For detailed implementation, see [OPTION-3-BATCHED-UPDATE-QUEUE.md](./option-3-batched-update-queue/OPTION-3-BATCHED-UPDATE-QUEUE.md)

### Option 4: Differential Updates with Virtual DOM

**Approach**: Track changes and apply minimal updates similar to React

**Pros**:

-   Optimal performance for partial updates
-   Framework patterns familiar to developers

**Cons**:

-   Significant architectural change
-   High implementation complexity
-   Memory overhead for diff tracking

## Framework Integration Strategy

Framework-specific implementations have been separated into dedicated documents to maintain clarity and focus. Each framework has unique performance characteristics and optimization patterns that require detailed treatment.

### Framework Implementation Documents (Option 3)

-   **React**: [Option 3 - React Implementation](./option-3-batched-update-queue/REACT-IMPLEMENTATION.md)

    -   React 18+ concurrent features (startTransition, useDeferredValue)
    -   Custom hooks for streaming data
    -   Error boundary integration
    -   Memoization strategies

-   **Angular**: [Option 3 - Angular Implementation](./option-3-batched-update-queue/ANGULAR-IMPLEMENTATION.md)

    -   OnPush change detection strategy
    -   Zone.js management patterns
    -   RxJS subscription handling
    -   Angular 17+ signals implementation

-   **Vue**: [Option 3 - Vue Implementation](./option-3-batched-update-queue/VUE-IMPLEMENTATION.md)
    -   shallowRef and markRaw for performance
    -   Composition API patterns
    -   Optimized reactivity management
    -   Watch configuration strategies

### Common Integration Principles

All framework integrations must:

1. **Disable animations** for high-frequency updates
2. **Batch updates** within animation frames
3. **Bypass framework overhead** for chart operations
4. **Provide cleanup** on component unmount
5. **Monitor performance** with built-in metrics

### Framework-Specific Performance Patterns

Each framework requires specific optimization patterns:

-   **React**: Leverage concurrent features and memoization
-   **Angular**: Manage zone.js and change detection carefully
-   **Vue**: Bypass deep reactivity with shallowRef/markRaw

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

-   **API Standardization**: Should we expose both `updateDelta` transactions and streaming controller, or standardize on one approach?
-   **Enterprise Feature Behavior**: How do annotations, tooltips, and other enterprise features behave under rapid updates? Do we need feature-specific performance budgets?
-   **Worker Environment Support**: Do we need explicit scheduling hooks for alignment with worker timers in worker-heavy environments?
-   **Framework Guardrails**: What safeguards prevent accidental controller recreation during component lifecycle events?
-   **Hybrid Data Sources**: How do we integrate streaming updates with existing lazy-loading `DataService` for hybrid pull/push scenarios?

## Key Findings & Recommendations

Based on comprehensive analysis documented in the sub-documents:

### Primary Recommendation: Hybrid "3+1" Approach

-   **Core**: Option 3 (Batched Update Queue) for internal optimization
-   **API**: Option 1 (Incremental/Transaction API) for developer interface
-   **Future**: Option 2 (Streaming) as optional enhancement
-   **Avoid**: Option 4 (Virtual DOM) - fundamentally incompatible with canvas

### Implementation Roadmap

1. **Phase 1** (Weeks 1-7): Implement Option 3 core batching system
2. **Phase 2** (Weeks 8-10): Add Option 1 transaction API layer
3. **Phase 3** (Weeks 11-12): Integration and optimization
4. **Phase 4** (Optional): Add streaming adapters if needed

### Expected Outcomes

-   **Performance**: 2-3x improvement (95 ops/sec, 85ms latency)
-   **Memory**: 38% reduction in usage
-   **Timeline**: 10-12 weeks for core implementation
-   **Risk**: Low-medium with proven patterns

For detailed analysis, see the **[Comparison Matrix](./COMPARISON-MATRIX.md)** and **[Hybrid Approach](./HYBRID-APPROACH.md)** documents.

## Success Metrics

-   Achieve 100+ updates/sec with <50ms latency ✅ (Analysis shows 95 ops/sec, 85ms achievable)
-   Memory usage stable over 24-hour period ✅ (38% reduction with pooling)
-   90% reduction in framework reconciliation overhead ✅ (Batching eliminates most reconciliation)
-   Zero performance regressions for existing use cases ✅ (Backward compatible design)
-   Customer validation from financial services sector (Pending implementation)
-   Successful migration of at least 3 enterprise customers from HighCharts/AMCharts (Pending implementation)
