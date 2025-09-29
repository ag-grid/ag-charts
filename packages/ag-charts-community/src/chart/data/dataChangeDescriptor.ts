/**
 * Describes changes made to a data array during a transaction.
 * Provides efficient tracking of removals, insertions, and updates with their indices and data.
 */
export interface DataChangeDescriptor {
    /** Removed indices (sorted ascending) with their original data */
    removed: Array<{ index: number; datum: any }>;

    /** Inserted items (sorted by index) */
    inserted: Array<{ index: number; datum: any }>;

    /** Updated items with both old and new data */
    updated: Array<{
        index: number;
        oldDatum: any;
        newDatum: any;
    }>;

    /**
     * Range-based index shifts for memory efficiency.
     * Each range represents a contiguous block of indices that shift by the same amount.
     */
    indexShiftRanges: Array<{
        startIndex: number; // First index in range (inclusive)
        endIndex: number; // Last index in range (inclusive)
        shift: number; // Amount to shift (positive = right, negative = left)
    }>;

    /** Metadata about the change */
    metadata: {
        totalRemoved: number;
        totalInserted: number;
        totalUpdated: number;
        netSizeChange: number;
    };
}

/**
 * Builder class for creating and validating DataChangeDescriptor instances.
 * Provides methods to add removals, insertions, and updates with validation logic.
 */
export class DataChangeDescriptorBuilder {
    private removed: Array<{ index: number; datum: any }> = [];
    private inserted: Array<{ index: number; datum: any }> = [];
    private updated: Array<{ index: number; oldDatum: any; newDatum: any }> = [];

    /**
     * Add a removal operation.
     * @param index - The original index of the item to remove
     * @param datum - The original data being removed
     */
    addRemoval(index: number, datum: any): this {
        if (index < 0) {
            throw new Error('Removal index cannot be negative');
        }

        // Check for duplicate removal index
        if (this.removed.some((r) => r.index === index)) {
            throw new Error(`Duplicate removal at index ${index}`);
        }

        this.removed.push({ index, datum });
        return this;
    }

    /**
     * Add an insertion operation.
     * @param index - The target index for insertion (after accounting for prior operations)
     * @param datum - The data being inserted
     */
    addInsertion(index: number, datum: any): this {
        if (index < 0) {
            throw new Error('Insertion index cannot be negative');
        }

        this.inserted.push({ index, datum });
        return this;
    }

    /**
     * Add an update operation.
     * @param index - The index of the item to update
     * @param oldDatum - The original data
     * @param newDatum - The new data
     */
    addUpdate(index: number, oldDatum: any, newDatum: any): this {
        if (index < 0) {
            throw new Error('Update index cannot be negative');
        }

        // Check for duplicate update index
        if (this.updated.some((u) => u.index === index)) {
            throw new Error(`Duplicate update at index ${index}`);
        }

        this.updated.push({ index, oldDatum, newDatum });
        return this;
    }

    /**
     * Validate that indices don't conflict across operation types.
     * @private
     */
    private validateIndices(): void {
        const removedIndices = new Set(this.removed.map((r) => r.index));
        const updatedIndices = new Set(this.updated.map((u) => u.index));

        // Check that update indices don't conflict with removals
        updatedIndices.forEach((updateIndex) => {
            if (removedIndices.has(updateIndex)) {
                throw new Error(`Index ${updateIndex} cannot be both removed and updated`);
            }
        });
    }

    /**
     * Compute index shift ranges efficiently.
     * Groups contiguous index ranges that have the same shift amount.
     * @private
     */
    private computeIndexShiftRanges(): Array<{ startIndex: number; endIndex: number; shift: number }> {
        if (this.removed.length === 0 && this.inserted.length === 0) {
            return [];
        }

        // Sort operations by index
        const sortedRemovals = [...this.removed].sort((a, b) => a.index - b.index);
        const sortedInsertions = [...this.inserted].sort((a, b) => a.index - b.index);

        // Calculate net shift at each position
        const shiftPoints: Array<{ index: number; netShift: number }> = [];
        let currentShift = 0;
        let removalIdx = 0;
        let insertionIdx = 0;

        // Process all operations in index order
        while (removalIdx < sortedRemovals.length || insertionIdx < sortedInsertions.length) {
            const nextRemoval = removalIdx < sortedRemovals.length ? sortedRemovals[removalIdx] : null;
            const nextInsertion = insertionIdx < sortedInsertions.length ? sortedInsertions[insertionIdx] : null;

            let currentIndex: number;

            if (nextRemoval && (!nextInsertion || nextRemoval.index <= nextInsertion.index)) {
                // Process removal
                currentIndex = nextRemoval.index;
                currentShift -= 1;
                removalIdx++;

                // If there's an insertion at the same index, process it too
                if (nextInsertion && nextInsertion.index === currentIndex) {
                    currentShift += 1;
                    insertionIdx++;
                }
            } else if (nextInsertion) {
                // Process insertion
                currentIndex = nextInsertion.index;
                currentShift += 1;
                insertionIdx++;
            } else {
                break;
            }

            shiftPoints.push({ index: currentIndex, netShift: currentShift });
        }

        if (shiftPoints.length === 0) {
            return [];
        }

        // Group contiguous ranges with the same shift
        const ranges: Array<{ startIndex: number; endIndex: number; shift: number }> = [];
        let currentRange: { startIndex: number; endIndex: number; shift: number } | null = null;

        for (let i = 0; i < shiftPoints.length; i++) {
            const point = shiftPoints[i];
            const nextPoint = i + 1 < shiftPoints.length ? shiftPoints[i + 1] : null;

            if (!currentRange || currentRange.shift !== point.netShift) {
                // Start new range
                if (currentRange) {
                    ranges.push(currentRange);
                }
                currentRange = {
                    startIndex: point.index + 1, // Shifts apply to indices after the operation
                    endIndex: nextPoint ? nextPoint.index : Number.MAX_SAFE_INTEGER,
                    shift: point.netShift,
                };
            } else {
                // Extend current range
                currentRange.endIndex = nextPoint ? nextPoint.index : Number.MAX_SAFE_INTEGER;
            }
        }

        if (currentRange) {
            ranges.push(currentRange);
        }

        if (ranges.length === 0) {
            return ranges;
        }

        const filteredRanges: typeof ranges = [];
        let seenNonZeroShift = false;

        for (const range of ranges) {
            if (range.shift !== 0) {
                seenNonZeroShift = true;
                filteredRanges.push(range);
                continue;
            }

            if (seenNonZeroShift) {
                filteredRanges.push(range);
            }
        }

        return filteredRanges;
    }

    /**
     * Build and return a valid DataChangeDescriptor.
     * Performs validation and computes index shift ranges.
     */
    build(): DataChangeDescriptor {
        this.validateIndices();

        // Sort arrays for consistent output
        const sortedRemoved = [...this.removed].sort((a, b) => a.index - b.index);
        const sortedInserted = this.inserted
            .map((entry, sequence) => ({ ...entry, sequence }))
            .sort((a, b) => {
                const indexDelta = a.index - b.index;
                return indexDelta !== 0 ? indexDelta : b.sequence - a.sequence;
            })
            .map(({ sequence: _sequence, ...entry }) => entry);
        const sortedUpdated = [...this.updated].sort((a, b) => a.index - b.index);

        const indexShiftRanges = this.computeIndexShiftRanges();

        const metadata = {
            totalRemoved: this.removed.length,
            totalInserted: this.inserted.length,
            totalUpdated: this.updated.length,
            netSizeChange: this.inserted.length - this.removed.length,
        };

        return {
            removed: sortedRemoved,
            inserted: sortedInserted,
            updated: sortedUpdated,
            indexShiftRanges,
            metadata,
        };
    }

    /**
     * Create a new builder with empty state.
     */
    static create(): DataChangeDescriptorBuilder {
        return new DataChangeDescriptorBuilder();
    }

    /**
     * Check if any changes have been recorded.
     */
    isEmpty(): boolean {
        return this.removed.length === 0 && this.inserted.length === 0 && this.updated.length === 0;
    }

    /**
     * Clear all recorded changes.
     */
    clear(): this {
        this.removed = [];
        this.inserted = [];
        this.updated = [];
        return this;
    }
}
