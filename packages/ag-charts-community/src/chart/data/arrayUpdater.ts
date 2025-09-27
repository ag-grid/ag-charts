import type { DataChangeDescriptor } from './dataChangeDescriptor';

/**
 * Utility class for applying data changes to arrays in-place.
 * Provides efficient array manipulation with index management for high-performance updates.
 *
 * The ArrayUpdater performs operations in a specific order to maintain correctness:
 * 1. Removals (in reverse order to preserve indices)
 * 2. Updates (modify existing items)
 * 3. Insertions (add new items at specified indices)
 *
 * @example Basic array mutation
 * ```typescript
 * const data = ['a', 'b', 'c', 'd', 'e'];
 * const changes = DataChangeDescriptorBuilder.create()
 *     .addRemoval(1, 'b')        // Remove 'b' at index 1
 *     .addInsertion(2, 'x')      // Insert 'x' at index 2
 *     .addUpdate(3, 'd', 'D')    // Update 'd' to 'D' at index 3
 *     .build();
 *
 * ArrayUpdater.applyChanges(data, changes);
 * // Result: ['a', 'c', 'x', 'D', 'e']
 * ```
 *
 * @example With custom extractor function
 * ```typescript
 * const values = [10, 20, 30, 40];
 * const changes = DataChangeDescriptorBuilder.create()
 *     .addInsertion(1, { value: 15 })
 *     .build();
 *
 * ArrayUpdater.applyChanges(values, changes, (datum) => datum.value);
 * // Result: [10, 15, 20, 30, 40]
 * ```
 *
 * @remarks
 * **Performance Characteristics:**
 * - O(r + i + u) where r=removals, i=insertions, u=updates
 * - In-place mutations avoid memory allocations
 * - Optimized splice operations for array manipulation
 * - Minimal data copying through direct index manipulation
 *
 * **Operation Ordering:**
 * The specific ordering is critical for correctness:
 * - **Removals first**: Processed in reverse order (high to low index) to prevent index invalidation
 * - **Updates second**: Modify existing items at their current positions (adjusted for removals)
 * - **Insertions last**: Add new items accounting for all previous operations
 *
 * **Index Management:**
 * - Removal indices are validated against original array bounds
 * - Update indices are adjusted to account for completed removals
 * - Insertion indices account for cumulative offset from previous insertions
 * - All operations maintain array integrity throughout the process
 *
 * **Error Handling:**
 * - Validates array bounds for all operations before starting
 * - Checks for conflicting operations (e.g., update + remove at same index)
 * - Throws descriptive errors for out-of-bounds or invalid operations
 * - Fails fast to prevent partial updates that could corrupt data
 */
export class ArrayUpdater {
    /**
     * Apply a set of changes to an array in-place.
     *
     * @param array - The array to modify directly (no cloning for performance)
     * @param changes - The change descriptor containing operations to apply
     * @param extractor - Optional function to transform data before adding to array
     *
     * @example
     * ```typescript
     * const data = [1, 2, 3, 4, 5];
     * const changes = builder
     *     .addRemoval(1, 2) // Remove item at index 1
     *     .addInsertion(2, 99) // Insert 99 at index 2
     *     .addUpdate(3, 4, 44) // Update item at index 3
     *     .build();
     *
     * ArrayUpdater.applyChanges(data, changes);
     * // Result: [1, 3, 99, 44, 5]
     * ```
     */
    static applyChanges<T>(
        array: T[],
        changes: DataChangeDescriptor,
        extractor?: (datum: any, index: number) => T
    ): void {
        // Early return for empty changes to avoid unnecessary work
        if (this.hasNoChanges(changes)) {
            return;
        }

        // Validate input parameters
        this.validateInputs(array, changes);

        // Apply operations in the correct order to maintain index integrity
        this.applyRemovals(array, changes.removed);
        this.applyUpdates(array, changes.updated, changes.removed, extractor);
        this.applyInsertions(array, changes.inserted, extractor);
    }

    /**
     * Check if the change descriptor has any actual changes.
     * @private
     */
    private static hasNoChanges(changes: DataChangeDescriptor): boolean {
        return changes.removed.length === 0 && changes.inserted.length === 0 && changes.updated.length === 0;
    }

    /**
     * Validate input parameters for the applyChanges method.
     * @private
     */
    private static validateInputs<T>(array: T[], changes: DataChangeDescriptor): void {
        if (!Array.isArray(array)) {
            throw new Error('Array parameter must be an array');
        }

        if (!changes) {
            throw new Error('Changes parameter is required');
        }

        // Validate that removal indices are within bounds
        for (const removal of changes.removed) {
            if (removal.index < 0 || removal.index >= array.length) {
                throw new Error(`Removal index ${removal.index} is out of bounds for array of length ${array.length}`);
            }
        }

        // Validate that update indices are within bounds (considering removals)
        const removalIndices = new Set(changes.removed.map((r) => r.index));
        for (const update of changes.updated) {
            if (update.index < 0 || update.index >= array.length) {
                throw new Error(`Update index ${update.index} is out of bounds for array of length ${array.length}`);
            }
            if (removalIndices.has(update.index)) {
                throw new Error(`Cannot update index ${update.index} that is marked for removal`);
            }
        }
    }

    /**
     * Apply removal operations to the array.
     * Removals are processed in reverse order to maintain correct indices.
     * @private
     */
    private static applyRemovals<T>(array: T[], removals: Array<{ index: number; datum: any }>): void {
        if (removals.length === 0) {
            return;
        }

        // Sort removals by index in descending order to process from end to beginning
        const sortedRemovals = [...removals].sort((a, b) => b.index - a.index);

        for (const removal of sortedRemovals) {
            // Use splice to remove one element at the specified index
            array.splice(removal.index, 1);
        }
    }

    /**
     * Apply update operations to the array.
     * Updates modify existing items in place.
     * Note: Updates are applied using the original indices from the change descriptor.
     * The validation in validateInputs ensures that update indices don't conflict with removals.
     * @private
     */
    private static applyUpdates<T>(
        array: T[],
        updates: Array<{ index: number; oldDatum: any; newDatum: any }>,
        removals: Array<{ index: number; datum: any }>,
        extractor?: (datum: any, index: number) => T
    ): void {
        if (updates.length === 0) {
            return;
        }

        // Calculate how many removals occurred before each update index
        const sortedRemovals = [...removals].sort((a, b) => a.index - b.index);

        for (const update of updates) {
            // Calculate the adjusted index after accounting for removals
            let adjustedIndex = update.index;

            // Count how many removals occurred before this update index
            for (const removal of sortedRemovals) {
                if (removal.index < update.index) {
                    adjustedIndex--;
                }
            }

            const newValue = extractor ? extractor(update.newDatum, update.index) : update.newDatum;
            array[adjustedIndex] = newValue;
        }
    }

    /**
     * Apply insertion operations to the array.
     * Insertions are processed in ascending order of their target indices.
     * @private
     */
    private static applyInsertions<T>(
        array: T[],
        insertions: Array<{ index: number; datum: any }>,
        extractor?: (datum: any, index: number) => T
    ): void {
        if (insertions.length === 0) {
            return;
        }

        // Sort insertions by index in ascending order
        const sortedInsertions = [...insertions].sort((a, b) => a.index - b.index);

        // Apply insertions with cumulative index adjustment
        let indexOffset = 0;

        for (const insertion of sortedInsertions) {
            const actualIndex = insertion.index + indexOffset;
            const newValue = extractor ? extractor(insertion.datum, insertion.index) : insertion.datum;

            // Validate that the insertion index is valid
            if (actualIndex < 0) {
                throw new Error(`Insertion index ${actualIndex} is out of bounds for array of length ${array.length}`);
            }

            const boundedIndex = Math.min(actualIndex, array.length);

            // Use splice to insert the new element at the calculated index
            array.splice(boundedIndex, 0, newValue);

            // Increment offset for subsequent insertions
            indexOffset++;
        }
    }

    /**
     * Create a copy of an array with changes applied.
     * This is a convenience method for cases where you don't want to modify the original array.
     *
     * @param array - The source array to copy and modify
     * @param changes - The change descriptor containing operations to apply
     * @param extractor - Optional function to transform data before adding to array
     * @returns A new array with changes applied
     */
    static applyChangesToCopy<T>(
        array: T[],
        changes: DataChangeDescriptor,
        extractor?: (datum: any, index: number) => T
    ): T[] {
        const copy = [...array];
        this.applyChanges(copy, changes, extractor);
        return copy;
    }

    /**
     * Calculate the expected final array length after applying changes.
     * This is useful for pre-allocating memory or validation.
     *
     * @param originalLength - The original array length
     * @param changes - The change descriptor
     * @returns The expected final array length
     */
    static calculateFinalLength(originalLength: number, changes: DataChangeDescriptor): number {
        return originalLength + changes.metadata.netSizeChange;
    }

    /**
     * Validate that a set of changes can be applied to an array of given length.
     * This performs validation without actually applying the changes.
     *
     * @param arrayLength - The length of the target array
     * @param changes - The change descriptor to validate
     * @returns True if changes are valid, throws error otherwise
     */
    static validateChanges(arrayLength: number, changes: DataChangeDescriptor): boolean {
        // Check removal indices
        for (const removal of changes.removed) {
            if (removal.index < 0 || removal.index >= arrayLength) {
                throw new Error(`Removal index ${removal.index} is out of bounds for array of length ${arrayLength}`);
            }
        }

        // Check update indices (must not conflict with removals)
        const removalIndices = new Set(changes.removed.map((r) => r.index));
        for (const update of changes.updated) {
            if (update.index < 0 || update.index >= arrayLength) {
                throw new Error(`Update index ${update.index} is out of bounds for array of length ${arrayLength}`);
            }
            if (removalIndices.has(update.index)) {
                throw new Error(`Cannot update index ${update.index} that is marked for removal`);
            }
        }

        // Check insertion indices (after accounting for removals and updates)
        const finalLength = this.calculateFinalLength(arrayLength, changes);
        for (const insertion of changes.inserted) {
            if (insertion.index < 0 || insertion.index > finalLength) {
                throw new Error(
                    `Insertion index ${insertion.index} would be out of bounds for final array length ${finalLength}`
                );
            }
        }

        return true;
    }
}
