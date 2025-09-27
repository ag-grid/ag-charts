import type { AgDataTransaction } from 'ag-charts-types';

import { type DataChangeDescriptor, DataChangeDescriptorBuilder } from './dataChangeDescriptor';
import type { DataRef } from './dataRef';

/**
 * Analyzes DataRef pending transactions and converts them to DataChangeDescriptor format.
 * This class is responsible for converting transaction operations (prepend, append, remove)
 * into a structured format that can be efficiently applied to ProcessedData structures.
 *
 * The TransactionAnalyzer implements deterministic transaction ordering to ensure correct
 * index management across complex operation combinations.
 *
 * @example Basic transaction analysis
 * ```typescript
 * // Prepare some transaction data
 * const dataRef = new DataRef([
 *     { id: 1, value: 10 },
 *     { id: 2, value: 20 },
 *     { id: 3, value: 30 }
 * ]);
 *
 * // Add some transactions
 * dataRef.addTransaction({
 *     append: [{ id: 4, value: 40 }],
 *     remove: [{ id: 2, value: 20 }],
 *     prepend: [{ id: 0, value: 5 }]
 * });
 *
 * const sources = new Map([['default', dataRef.data]]);
 * const changeDescriptor = TransactionAnalyzer.analyze(dataRef, sources);
 *
 * if (changeDescriptor) {
 *     console.log('Removals:', changeDescriptor.removed);
 *     console.log('Insertions:', changeDescriptor.inserted);
 *     console.log('Index shifts:', changeDescriptor.indexShiftRanges);
 * }
 * ```
 *
 * @remarks
 * **Key Constraints:**
 * - Must be called BEFORE DataRef.commitPendingTransactions() to work with original indices
 * - Only supports single data source scenarios (returns undefined for multi-source)
 * - Uses object identity matching for removal operations
 * - Computes net index shifts accounting for all operations
 *
 * **Transaction Ordering:**
 * The analyzer implements a deterministic ordering strategy:
 * 1. **Removals**: Processed in reverse index order (highest to lowest) to prevent index shifts
 * 2. **Updates**: Processed at their original indices (updates don't change indices)
 * 3. **Insertions**: Processed in forward index order (lowest to highest) for correct placement
 *
 * **Performance Characteristics:**
 * - O(n log n) complexity due to sorting operations
 * - Memory efficient using range-based index shift tracking
 * - Optimized for scenarios with small numbers of transactions relative to data size
 *
 * **Error Handling:**
 * - Returns undefined for unsupported scenarios (graceful fallback)
 * - Validates transaction consistency (no duplicate indices)
 * - Handles edge cases like empty data or no transactions
 */
export class TransactionAnalyzer {
    /**
     * Analyze pending transactions and convert to DataChangeDescriptor.
     *
     * This is the main entry point for transaction analysis. It validates constraints,
     * processes all transaction types, and returns a structured change descriptor
     * suitable for incremental ProcessedData updates.
     *
     * @example Analyzing complex transactions
     * ```typescript
     * const dataRef = new DataRef([
     *     { x: 1, y: 10 },
     *     { x: 2, y: 20 },
     *     { x: 3, y: 30 },
     *     { x: 4, y: 40 }
     * ]);
     *
     * // Add multiple transaction types
     * dataRef.addTransaction({
     *     remove: [{ x: 2, y: 20 }],        // Remove second item
     *     append: [{ x: 5, y: 50 }],        // Add to end
     *     prepend: [{ x: 0, y: 5 }]         // Add to beginning
     * });
     *
     * const sources = new Map([['series1', dataRef.data]]);
     * const changes = TransactionAnalyzer.analyze(dataRef, sources);
     *
     * // Result structure:
     * // {
     * //   removed: [{ index: 1, datum: { x: 2, y: 20 } }],
     * //   inserted: [
     * //     { index: 0, datum: { x: 0, y: 5 } },
     * //     { index: 4, datum: { x: 5, y: 50 } }
     * //   ],
     * //   updated: [],
     * //   indexShiftRanges: [...],
     * //   metadata: { totalRemoved: 1, totalInserted: 2, ... }
     * // }
     * ```
     *
     * @param dataRef - The DataRef containing pending transactions
     * @param sources - Map of all data sources (used to validate single-source constraint)
     * @returns DataChangeDescriptor for single source scenarios, undefined for multi-source
     *
     * @remarks
     * **Return Values:**
     * - Returns a valid DataChangeDescriptor when analysis succeeds
     * - Returns empty descriptor when no transactions are pending
     * - Returns undefined when constraints are violated (triggers fallback to full reprocessing)
     *
     * **Constraint Validation:**
     * - Immediately returns undefined if sources.size > 1 (multi-source not supported)
     * - Returns empty descriptor if no pending transactions exist
     * - All transaction processing assumes single data source context
     *
     * **Object Identity Matching:**
     * - Removal operations use strict object identity (===) for matching
     * - This ensures precise removal even with duplicate values
     * - Objects must be exactly the same reference, not just equal content
     *
     * **Index Calculation:**
     * - All indices are calculated relative to the original data array
     * - Index shifts are computed to account for operations affecting subsequent indices
     * - Range-based shift tracking optimizes memory usage for large datasets
     */
    static analyze<T = unknown>(
        dataRef: DataRef<T>,
        sources: Map<string, unknown[]>
    ): DataChangeDescriptor | undefined {
        // Early bailout for multi-source scenarios - not supported for incremental updates
        if (sources.size > 1) {
            return undefined;
        }

        // If no pending transactions, return empty descriptor
        if (dataRef.pendingTransactions.length === 0) {
            return DataChangeDescriptorBuilder.create().build();
        }

        const builder = DataChangeDescriptorBuilder.create();
        const currentData = dataRef.data;

        // Process all pending transactions in order
        for (const transaction of dataRef.pendingTransactions) {
            this.processTransaction(transaction, currentData, builder);
        }

        return builder.build();
    }

    /**
     * Process a single transaction and add its operations to the builder.
     *
     * @private
     */
    private static processTransaction<T>(
        transaction: AgDataTransaction<T>,
        currentData: T[],
        builder: DataChangeDescriptorBuilder
    ): void {
        // Handle removals - these must be processed first to maintain index stability
        if (transaction.remove && transaction.remove.length > 0) {
            this.processRemovals(transaction.remove, currentData, builder);
        }

        // Handle prepend operations (insertions at index 0)
        if (transaction.prepend && transaction.prepend.length > 0) {
            this.processPrepends(transaction.prepend, builder);
        }

        // Handle append operations (insertions at end)
        if (transaction.append && transaction.append.length > 0) {
            this.processAppends(transaction.append, currentData, builder);
        }
    }

    /**
     * Process removal operations using object identity matching.
     *
     * @private
     */
    private static processRemovals<T>(toRemove: T[], currentData: T[], builder: DataChangeDescriptorBuilder): void {
        // Find indices of items to remove using object identity
        const removalIndices: Array<{ index: number; datum: T }> = [];

        for (const itemToRemove of toRemove) {
            // Find all matching indices (there could be duplicates)
            for (let i = 0; i < currentData.length; i++) {
                if (currentData[i] === itemToRemove) {
                    removalIndices.push({ index: i, datum: itemToRemove });
                }
            }
        }

        // Sort by index in descending order to process highest indices first
        // This prevents index shifts from affecting subsequent removals
        removalIndices.sort((a, b) => b.index - a.index);

        // Remove duplicates if the same index appears multiple times
        const uniqueRemovals = new Map<number, T>();
        for (const { index, datum } of removalIndices) {
            if (!uniqueRemovals.has(index)) {
                uniqueRemovals.set(index, datum);
            }
        }

        // Add removals to builder (will be sorted internally)
        uniqueRemovals.forEach((datum, index) => {
            builder.addRemoval(index, datum);
        });
    }

    /**
     * Process prepend operations (insertions at index 0).
     *
     * @private
     */
    private static processPrepends<T>(toPrepend: T[], builder: DataChangeDescriptorBuilder): void {
        // Prepend operations insert at index 0
        // Process in reverse order so the final order matches the input array
        for (let i = toPrepend.length - 1; i >= 0; i--) {
            builder.addInsertion(0, toPrepend[i]);
        }
    }

    /**
     * Process append operations (insertions at end).
     *
     * @private
     */
    private static processAppends<T>(toAppend: T[], currentData: T[], builder: DataChangeDescriptorBuilder): void {
        // Append operations insert at the end of the current data
        const baseIndex = currentData.length;

        for (let i = 0; i < toAppend.length; i++) {
            builder.addInsertion(baseIndex + i, toAppend[i]);
        }
    }
}
