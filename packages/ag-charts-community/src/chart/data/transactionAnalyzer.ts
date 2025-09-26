import type { AgDataTransaction } from 'ag-charts-types';

import { type DataChangeDescriptor, DataChangeDescriptorBuilder } from './dataChangeDescriptor';
import type { DataRef } from './dataRef';

/**
 * Analyzes DataRef pending transactions and converts them to DataChangeDescriptor format.
 * This class is responsible for converting transaction operations (prepend, append, remove)
 * into a structured format that can be efficiently applied to ProcessedData structures.
 *
 * Key constraints:
 * - Must be called BEFORE DataRef.commitPendingTransactions() to work with original indices
 * - Only supports single data source scenarios (returns undefined for multi-source)
 * - Uses object identity matching for removal operations
 * - Computes net index shifts accounting for all operations
 */
export class TransactionAnalyzer {
    /**
     * Analyze pending transactions and convert to DataChangeDescriptor.
     *
     * @param dataRef - The DataRef containing pending transactions
     * @param sources - Map of all data sources (used to validate single-source constraint)
     * @returns DataChangeDescriptor for single source scenarios, undefined for multi-source
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
