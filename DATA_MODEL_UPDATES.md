# DataModel Transaction Support - Implementation Plan

## Context

This document outlines the implementation plan for adding efficient transaction support to AG Charts' DataModel class. The goal is to enable `chart.applyTransaction()` to update existing ProcessedData structures in-place rather than reprocessing all data from scratch.

### Current State

-   `DataRef` stores data and pending transactions (prepend, append, remove operations)
-   `DataModel.processData()` creates ProcessedData from raw data sources
-   When transactions are applied via `DataRef.commitPendingTransactions()`, the data array is mutated
-   Currently, ProcessedData must be completely regenerated after any data change
-   This full reprocessing is inefficient for small incremental updates

### Target State

-   Add `DataModel.applyTransactions()` method to update ProcessedData in-place
-   Support index shifts, insertions, removals, and updates efficiently
-   Maintain consistency across ungrouped, grouped, and accumulated data cases
-   Achieve 10x+ performance improvement for incremental updates

### Scope Limitations

-   **IMPORTANT**: High-frequency updates via `applyTransaction()` are limited to single data source scenarios
-   Multi-scope data sources are not supported for incremental updates (will fall back to full reprocessing)
-   This simplification avoids complex scope synchronization and identity mapping issues

### Animation Handling

-   **High-frequency updates should skip animations**
-   Pass `skipAnimations: true` to `chart.update()` when using `applyTransaction()`
-   The data changes faster than meaningful animation duration (typically 16-33ms vs 200-500ms animations)
-   Set `processedData.reduced.animationValidation` flags to false during incremental updates
-   No "before" snapshot is maintained during incremental updates

## Implementation Tasks

### Phase 1: Core Infrastructure

#### Task 1.1: Create Change Description System

-   [x] Create `DataChangeDescriptor` interface in `/packages/ag-charts-community/src/chart/data/dataChangeDescriptor.ts`
    ```typescript
    export interface DataChangeDescriptor {
        // Removed indices (sorted ascending) with their original data
        removed: Array<{ index: number; datum: any }>;
        // Inserted items (sorted by index)
        inserted: Array<{ index: number; datum: any }>;
        // Updated items with both old and new data
        updated: Array<{
            index: number;
            oldDatum: any;
            newDatum: any;
        }>;
        // Range-based index shifts for memory efficiency
        // Each range represents a contiguous block of indices that shift by the same amount
        indexShiftRanges: Array<{
            startIndex: number; // First index in range (inclusive)
            endIndex: number; // Last index in range (inclusive)
            shift: number; // Amount to shift (positive = right, negative = left)
        }>;
        // Metadata about the change
        metadata: {
            totalRemoved: number;
            totalInserted: number;
            totalUpdated: number;
            netSizeChange: number;
        };
    }
    ```
    <!-- RESOLVED: Arrays provide deterministic ordering, old data included for proper domain/aggregation updates -->
-   [x] Create `DataChangeDescriptorBuilder` class alongside the interface for creation/validation logic
-   [x] Add unit tests for DataChangeDescriptor creation and validation
<!-- RESOLVED: Builder class will provide creation logic and validation methods -->

#### Task 1.2: Implement Index Mapping Utilities

-   [ ] Extend `/packages/ag-charts-community/src/chart/series/cartesian/diffUtil.ts` with index mapping capabilities
    -   Add `IndexMapper` class to existing diff utilities
    -   Methods needed:
        -   `applyRemovals(indices: number[]): void`
        -   `applyInsertions(insertions: Array<{index: number, datum: any}>): void`
        -   `getNewIndex(oldIndex: number): number | undefined`
        -   `getOldIndex(newIndex: number): number | undefined`
    -   Must handle cascading shifts from multiple operations
    -   Target O(log r) lookup performance where r = number of ranges (typically small)
    -   Support range-based shifts from DataChangeDescriptor.indexShiftRanges
    <!-- RESOLVED: Range-based approach reduces memory from O(n) to O(r) where r << n -->
-   [ ] Add comprehensive unit tests for IndexMapper

#### Task 1.3: Build Transaction Analyzer

-   [ ] Create `TransactionAnalyzer` class in `/packages/ag-charts-community/src/chart/data/transactionAnalyzer.ts`
    -   Method: `analyze(dataRef: DataRef, originalData: any[]): DataChangeDescriptor`
    -   **MUST run BEFORE `DataRef.commitPendingTransactions()` to work with original indices**
    -   Convert DataRef pending transactions to DataChangeDescriptor
    -   Handle prepend operations (insertions at index 0)
    -   Handle append operations (insertions at end)
    -   Handle remove operations (by reference, using object identity)
    -   Compute net index shifts accounting for all operations
    -   Store removed data for domain/aggregation rollback
        <!-- RESOLVED: Analyzer runs before mutation, uses object identity matching from original data -->
        <!-- RESOLVED: TransactionAnalyzer needs full sources Map<string, unknown[]> not just single array, to handle multi-scope correctly -->
-   [ ] Update TransactionAnalyzer signature:
    ```typescript
    analyze(dataRef: DataRef, sources: Map<string, unknown[]>): DataChangeDescriptor
    ```
-   [ ] Add early bailout for multi-source scenarios:
    ```typescript
    if (sources.size > 1) {
        return undefined; // Signal fallback to full reprocessing
    }
    ```
-   [ ] Add unit tests covering all transaction types and combinations
<!-- RESOLVED: Analyzer enforces single-source limitation upfront -->

#### Task 1.4: Transaction Ordering Rules

-   [ ] Implement deterministic transaction ordering in TransactionAnalyzer:
    ```typescript
    // Order of operations to maintain index stability:
    // 1. Process removals in reverse index order (highest to lowest)
    //    This prevents index shifts from affecting subsequent removals
    // 2. Process updates at their original indices
    //    Updates don't change indices, safe to process in any order
    // 3. Process insertions in forward index order (lowest to highest)
    //    This ensures each insertion index is correct relative to previous insertions
    ```
-   [ ] Add validation to ensure operation indices don't overlap:
    -   Removal indices must be unique
    -   Update indices must not overlap with removals
    -   Insertion indices account for prior removals
-   [ ] Unit test edge cases:
    -   Simultaneous remove + insert at same index
    -   Multiple operations affecting adjacent indices
    -   Operations that would create gaps or overlaps

#### Task 1.5: Extract DataModel Prerequisites

-   [ ] Refactor DataModel to expose required functionality:

    ```typescript
    // Cache value extractors for reuse in incremental updates
    private extractorCache = new Map<InternalDatumPropertyDefinition, ProcessorFn>();

    // Expose processValue for group updates
    public processValue(def: InternalDatumPropertyDefinition, datum: any, idx: number): ProcessedValue {
        // Move existing processValue logic here
    }
    ```

-   [ ] Initialize extractor cache during first processData run
-   [ ] Ensure extractors are reusable across incremental updates
-   [ ] Add tests for extractor caching and processValue exposure
<!-- RESOLVED: Prerequisites moved earlier to unblock dependent tasks -->

### Phase 2: DataModel Extension

#### Task 2.1: Add applyTransactions Method to DataModel

-   [ ] Add method to `/packages/ag-charts-community/src/chart/data/dataModel.ts`:
    ```typescript
    applyTransactions(
      dataRef: DataRef,
      processedData: ProcessedData<D>,
      sources: Map<string, unknown[]>
    ): ProcessedData<D> | undefined
    ```
-   [ ] Method should:
    -   Detect if transactions can be applied incrementally
    -   Fall back to full reprocessing if needed
    -   **Mutate ProcessedData in-place for maximum performance**
    -   Return the same ProcessedData instance (modified) or undefined on error
    -   All updates are synchronous and atomic
    -   **NOTE: High-frequency updates disable animations - no "before" snapshot needed**
    -   Set `processedData.reduced.animationValidation = { uniqueKeys: false, orderedKeys: false }` to prevent animations
    -   Caller should pass `skipAnimations: true` to `chart.update()`
        <!-- RESOLVED: AnimationValidation flags prevent animations, chart.update() has skipAnimations option -->
        <!-- CONCERN: `chart.applyTransaction()` currently calls `chart.update(ChartUpdateType.UPDATE_DATA, { apiUpdate: true })` with no hook for `skipAnimations`; where is this option wired in so the public API keeps working without extra user glue code? -->
        <!-- QUESTION: Are we also flipping the global update flag so that downstream diff/animation processors skip their work when validations are false? Otherwise the animation system still runs and inspects mutated arrays. -->

#### Task 2.2: Create ProcessedDataMutator Class

-   [ ] Create `/packages/ag-charts-community/src/chart/data/processedDataMutator.ts`
-   [ ] Implement core mutation logic:
    -   Constructor accepts DataModel instance for access to definitions
    -   Main method: `mutate(processedData: ProcessedData, changes: DataChangeDescriptor): void`
    -   **Mutates ProcessedData in-place** - no cloning needed
    -   Track affected columns/keys for targeted updates:
        ```typescript
        // Determine which columns need updating
        const affectedColumns = new Set<number>();
        const affectedKeys = new Set<number>();
        // Only update affected structures
        ```
    -   Coordinate all update operations in correct order
    -   Invalidate affected caches (these are Symbol keys in ProcessedData):
        -   `processedData[DOMAIN_RANGES]` - Map of range lookups
        -   `processedData[KEY_SORT_ORDERS]` - Map of key sort orders
        -   `processedData[COLUMN_SORT_ORDERS]` - Map of column sort orders
    -   **Cache Rebuild Strategy**:
        -   Caches are lazily rebuilt on first access after invalidation
        -   Add getter methods that check invalidation state before returning cached value
        -   If cache is invalid, rebuild it using current ProcessedData state
        -   Example pattern:
            ```typescript
            getDomainRange(column: number): Range {
                if (!this.domainRangeCache.has(column)) {
                    this.domainRangeCache.set(column, calculateRange(this.columns[column]));
                }
                return this.domainRangeCache.get(column);
            }
            ```
    -   Update `processedData.reduced` metadata:
        -   `diff` - ProcessedOutputDiff
        -   `animationValidation` - { uniqueKeys, orderedKeys }
    -   Clear affected entries in `processedData.domain`:
        -   `keys`, `values`, `groups`, `aggValues` arrays as needed
    -   Maintain consistency across all data structures
    -   **Fail fast on any error - no rollback needed** (errors are bugs)
    -   **ACCEPTED TRADE-OFF**: Rollback would require extra memory/time and obfuscate bugs
    -   Errors during mutation indicate implementation bugs that must be fixed, not runtime conditions
    -   If mutation fails, the chart state is corrupted and requires page reload
        <!-- RESOLVED: We accept these trade-offs for performance and debugging clarity -->
        <!-- CONCERN: Stating "reload the page" is not an operational plan; can we at least reset `processedData` by re-running `processData` so the chart survives instead of crashing the app? -->
-   [ ] Add integration tests with DataModel
<!-- RESOLVED: Fail-fast approach - any error is a bug to be fixed, not recovered from -->

### Phase 3: Component Updaters

#### Task 3.1: Implement Array Update Utilities

-   [ ] Create `/packages/ag-charts-community/src/chart/data/arrayUpdater.ts`
-   [ ] Implement generic array manipulation with index management:
    ```typescript
    export class ArrayUpdater<T> {
        static applyChanges<T>(
            array: T[],
            changes: DataChangeDescriptor,
            extractor?: (datum: any, index: number) => T
        ): void;
    }
    ```
-   [ ] Operations to support:
    -   **Mutate arrays in-place using splice**
    -   Remove items at indices (splice in reverse order)
    -   Insert items at new indices
    -   Update items in place
    -   No array cloning - direct manipulation for performance
-   [ ] Add unit tests for edge cases (empty arrays, single items, etc.)
<!-- RESOLVED: indexShifts map old->new for lookups only, array splice operations handle actual movement -->

#### Task 3.2: Update Columns and Keys

-   [ ] Extend ProcessedDataMutator to update `processedData.columns`:
    -   Apply ArrayUpdater to each column
    -   Use appropriate value extractors from DataModel definitions
    -   Handle invalid value scenarios
-   [ ] Extend ProcessedDataMutator to update `processedData.keys`:
    -   Update each key Map for appropriate scopes
    -   Maintain scope isolation
    -   Handle missing keys appropriately
-   [ ] Add tests for single-scope scenarios (incremental path)
-   [ ] Add tests verifying multi-scope scenarios trigger fallback to full reprocessing
<!-- RESOLVED: Multi-scope tests verify fallback behavior, not incremental updates -->

#### Task 3.3: Implement Domain Updates

-   [ ] Create `/packages/ag-charts-community/src/chart/data/domainUpdater.ts`
-   [ ] Implement incremental domain updates:
    ```typescript
    export class DomainUpdater {
        static updateDomain(
            currentDomain: any[],
            changes: DataChangeDescriptor,
            columnIndex: number,
            valueExtractor: (datum: any) => any,
            isDiscrete: boolean
        ): any[];
    }
    ```
-   [ ] **PREREQUISITE**: Refactor DataModel to cache value extractors outside processData closure:
    ```typescript
    private extractorCache = new Map<InternalDatumPropertyDefinition, ProcessorFn>();
    ```
-   [ ] Extract column values from change descriptors using cached value extractors
<!-- RESOLVED: DataModel will cache extractors on first processData run for reuse in incremental updates -->
-   [ ] For continuous domains:
    -   Only recalculate if min/max affected
    -   Track if removed values were at extremes
-   [ ] For discrete domains:
    -   Add/remove unique values
    -   Maintain order if applicable
-   [ ] Add performance tests comparing to full recalculation
<!-- RESOLVED: DomainUpdater will extract column values from changes using DataModel's extractors -->

#### Task 3.4: Update Invalidation Tracking

-   [ ] Extend ProcessedDataMutator to update `invalidData` and `invalidKeys`:
    -   Shift indices in existing boolean arrays
    -   Add entries for inserted data
    -   Remove entries for deleted data
    -   Validate new data against definitions
-   [ ] Update `invalidKeyCount` Map appropriately
-   [ ] Add tests for invalidation scenarios

### Phase 4: Grouped Data Handling

#### Task 4.1: Implement Group Membership Updates

-   [ ] Create `/packages/ag-charts-community/src/chart/data/groupUpdater.ts`
-   [ ] Implement group membership recalculation:
    ```typescript
    export class GroupUpdater {
        static updateGroups(
            groups: DataGroup[],
            changes: DataChangeDescriptor,
            keyExtractor: (datum: any) => any[]
        ): void; // Mutates groups array in-place
    }
    ```
-   [ ] Operations needed:
    -   **Reuse DataModel's existing key extraction and grouping logic**
    -   **PREREQUISITE**: Refactor DataModel to expose processValue() method:
        ```typescript
        public processValue(def: InternalDatumPropertyDefinition, datum: any, idx: number): ProcessedValue
        ```
    -   Calculate group keys for new/updated data using exposed DataModel.processValue()
    -   Find or create appropriate groups
    -   Remove data from old groups
    -   Delete empty groups
    -   Update validScopes for partial invalidity
-   [ ] Add tests for group creation/deletion scenarios
<!-- RESOLVED: processValue will be refactored to be a public method for reuse -->

#### Task 4.2: Implement Group Index Management

-   [ ] Extend GroupUpdater with index management:
    -   Update `datumIndices` arrays in each DataGroup
    -   Apply index shifts to existing indices
    -   Add indices for new group members
    -   Remove indices for removed members
    -   Keep indices sorted for efficiency
-   [ ] Optimize for large groups (consider using Set for lookups)
-   [ ] Add performance tests with large group counts

#### Task 4.3: Implement Aggregation Updates

-   [ ] Extend `AggregatePropertyDefinition` interface with capability flag:
    ```typescript
    interface AggregatePropertyDefinition {
        // ... existing properties ...
        supportsIncremental?: boolean;
        incrementalUpdater?: (current: any, removed: any[], added: any[]) => any;
    }
    ```
-   [ ] Create `/packages/ag-charts-community/src/chart/data/aggregationUpdater.ts`
-   [ ] Implement partial aggregation recalculation:
    ```typescript
    export class AggregationUpdater {
        static updateAggregations(
            groups: DataGroup[],
            changes: DataChangeDescriptor,
            aggregateDefs: AggregatePropertyDefinition[]
        ): void; // Mutates group aggregations in-place
    }
    ```
-   [ ] Track "dirty" groups needing recalculation
-   [ ] Use incrementalUpdater when available and supportsIncremental is true
-   [ ] **Complex Aggregation Criteria** (fallback to full recalculation):
    -   Aggregations WITHOUT incrementalUpdater implementation
    -   Includes: percentiles (p50, p90, p99), median, mode, variance, stddev
    -   Custom reducer functions without incremental support
    -   Window/rolling aggregations that depend on order
    -   **Simple aggregations** with incrementalUpdater: sum, count, min, max, average
-   [ ] Update domain.aggValues appropriately
-   [ ] Add tests for various aggregation types
<!-- RESOLVED: Capability flag allows opt-in incremental updates, fallback for complex cases -->

### Phase 5: Metadata & Optimization

#### Task 5.1: Generate ProcessedOutputDiff

-   [ ] Extend ProcessedDataMutator to generate diff metadata:
    ```typescript
    interface ProcessedOutputDiff {
        changed: boolean;
        added: Set<string>;
        updated: Set<string>;
        removed: Set<string>;
        moved: Set<string>;
    }
    ```
-   [ ] Track all keys affected by changes
-   [ ] Update `processedData.reduced.diff` appropriately
-   [ ] Add tests for diff accuracy
<!-- RESOLVED: ProcessedOutputDiff already exists in dataModel.ts, we're just populating it -->

#### Task 5.2: Update Animation Validation

-   [ ] Update `processedData.reduced.animationValidation`:
    -   Check if keys remain unique after updates
    -   Check if key ordering is maintained
    -   Set flags appropriately for animation system
-   [ ] Add tests for animation validation logic

#### Task 5.3: Performance Benchmarking (Deferred)

-   [ ] **DEFERRED TO FOLLOW-UP** - Focus on correctness first
-   [ ] Add performance benchmarks:
    -   Compare to full reprocessing
    -   Test with various data sizes (100, 1K, 10K, 100K items)
    -   Test with various change percentages (1%, 10%, 50% changes)
-   [ ] Profile and identify bottlenecks before optimizing
<!-- RESOLVED: Micro-optimizations deferred to follow-up after correctness is proven -->

### Phase 6: Integration & Testing

#### Task 6.1: Update DataController Integration

-   [ ] Add capability detection to DataModel:
    ```typescript
    supportsIncrementalUpdate(): boolean {
        // Check if all processors support incremental
        const aggregatesOk = this.aggregates.every(a => a.supportsIncremental !== false);
        const processorsOk = this.propertyProcessors.every(p => p.supportsIncremental !== false);
        const reducersOk = this.reducers.every(r => r.supportsIncremental !== false);
        const groupProcessorsOk = this.groupProcessors.every(g => g.supportsIncremental !== false);
        return aggregatesOk && processorsOk && reducersOk && groupProcessorsOk;
    }
    ```
-   [ ] Extend processor interfaces with capability flags where needed
-   [ ] Modify DataController to detect when incremental updates are possible:
    ```typescript
    if (dataModel.supportsIncrementalUpdate() && sources.size === 1) {
        const result = dataModel.applyTransactions(dataRef, processedData, sources);
        if (!result) {
            warnOnce(`Incremental update disabled: check processor capabilities`);
            // Fall back to full reprocessing
        }
    }
    ```
-   [ ] Add warnOnce() call when incremental updates are disabled:

    ```typescript
    import { warnOnce } from 'ag-charts-core';

    // In DataModel.supportsIncrementalUpdate()
    if (!aggregatesOk) {
        const unsupported = this.aggregates
            .filter((a) => a.supportsIncremental === false)
            .map((a) => a.id || 'unknown');
        warnOnce(`Incremental updates disabled due to aggregations: ${unsupported.join(', ')}`);
    }
    ```

-   [ ] Add logic to choose between full processing and incremental updates
-   [ ] Ensure backward compatibility for existing code paths
-   [ ] Add feature flag to enable/disable incremental updates
<!-- RESOLVED: warnOnce() provides user feedback when incremental mode unavailable -->

#### Task 6.2: Series Integration (No Changes Needed)

-   [ ] **Series work automatically** - part of normal chart.update() flow
-   [ ] DataController returns same ProcessedData reference after in-place mutation
-   [ ] Chart.update() handles series updates as normal
-   [ ] **Pass `skipAnimations: true` to chart.update()** when using high-frequency updates:
    ```typescript
    // After applying transactions
    dataModel.applyTransactions(dataRef, processedData, sources);
    // Trigger chart update with animations disabled
    chart.update(ChartUpdateType.UPDATE_DATA, { skipAnimations: true });
    ```
-   [ ] No changes needed to series classes
-   [ ] Test that all series types continue working correctly
<!-- RESOLVED: Series update automatically via chart.update() flow, no extra notification needed -->

#### Task 6.3: Comprehensive Testing

-   [ ] Create test suite in `/packages/ag-charts-community/src/chart/data/dataModel.test.ts`:
    -   Unit tests for each updater component
    -   Integration tests for full transaction flow
    -   Edge cases: empty data, single item, null values
    -   Grouped vs ungrouped data scenarios
    -   **Single-scope scenarios** - verify incremental updates work correctly
    -   **Multi-scope scenarios** - verify fallback to full reprocessing
    <!-- RESOLVED: Test plan explicitly distinguishes incremental vs fallback scenarios -->
-   [ ] Add E2E tests:
    -   Test chart updates with various transaction types
    -   Verify visual correctness after updates
    -   Test performance with real-world data sizes
-   [ ] Add concurrency tests:
    -   **Rapid successive transactions**: Queue 10+ transactions with 10ms intervals
    -   **During rendering**: Apply transaction while chart.update() is in progress
    -   **Memory pressure**: Apply 1000+ transactions in rapid succession, verify memory usage
    -   **Interleaved operations**: Mix applyTransaction() with direct data modifications
    -   **Stress test**: 100 transactions/second for 10 seconds, verify final state correctness
-   [ ] Add memory leak tests:
    -   Ensure removed data is properly released
    -   Check for accumulating references
    -   Monitor heap growth during high-frequency updates

#### Task 6.4: Documentation

-   [ ] Add JSDoc comments to all new public APIs
-   [ ] Create usage examples for applyTransactions
-   [ ] Document performance characteristics
-   [ ] Add migration guide for any breaking changes

## Success Criteria

### Performance Targets

-   [ ] 10x+ performance improvement for updates affecting <10% of data
-   [ ] <50ms update time for 10K items with 100 changes
-   [ ] **Near-zero memory overhead** - in-place mutations avoid allocations
-   [ ] No memory leaks in long-running update scenarios
-   [ ] O(k) complexity where k is number of changes, not O(n) data size

### Correctness Requirements

-   [ ] Zero data inconsistency bugs
-   [ ] All existing tests continue to pass
-   [ ] Incremental updates produce identical results to full reprocessing
-   [ ] Animations work correctly with incremental updates

### Code Quality

-   [ ] 90%+ test coverage for new code
-   [ ] All new code passes linting
-   [ ] Type safety maintained throughout
-   [ ] Clear separation of concerns

## Development Notes

### Key Files to Reference

-   `/packages/ag-charts-community/src/chart/data/dataModel.ts` - Main DataModel class
-   `/packages/ag-charts-community/src/chart/data/dataRef.ts` - DataRef with transaction storage
-   `/packages/ag-charts-community/src/chart/data/transactionUtils.ts` - Existing transaction utilities
-   `/packages/ag-charts-community/src/chart/series/dataModelSeries.ts` - Series base class using DataModel

### Design Considerations

1. **Backward Compatibility**: All changes must be backward compatible. Existing code paths should continue to work.
2. **Memory Efficiency**: Use in-place mutations exclusively to minimize allocations and GC pressure.
3. **Synchronous Updates**: All mutations complete atomically before returning - no partial states.
4. **Error Handling**: Fail fast on errors - they indicate bugs to fix, not runtime conditions to recover from.
5. **Scope Isolation**: Maintain proper scope isolation when updating scoped data (though single-scope is primary use case).
6. **Type Safety**: Maintain TypeScript type safety throughout the implementation.

### Testing Strategy

1. Start with unit tests for individual components
2. Build integration tests as components are connected
3. Use property-based testing for index mapping logic
4. Performance test with production-like data volumes
5. Memory profile to ensure no leaks

### Implementation Note

This is a prototype implementation to validate feasibility and performance characteristics. Production implementation will be done in a separate epic based on learnings from this prototype.
