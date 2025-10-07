import { DataChangeDescription, type IndexTransformationMap, type SpliceOperation } from './dataChangeDescription';
import { DataSet } from './dataSet';

describe('DataChangeDescription', () => {
    describe('spliceOps optimization using DataSet', () => {
        it('should merge 100 consecutive deletions into 1 splice operation in DataSet', () => {
            // Create initial data with 200 items
            const initialData = Array.from({ length: 200 }, (_, i) => ({ value: i }));
            const dataSet = new DataSet(initialData);

            // Create removal items for indices 5-104
            const itemsToRemove = initialData.slice(5, 105);

            // Apply transaction to remove 100 consecutive items
            dataSet.addTransaction({ remove: itemsToRemove });

            // Get the data change description
            const changeDescription = dataSet.getChangeDescription();
            if (!changeDescription) {
                throw new Error('Expected changeDescription to be defined');
            }

            // Should have optimized to 1 splice operation for the removals
            const removeSpliceOps = changeDescription.indexMap.spliceOps.filter(
                (op) => op.deleteCount > 0 && op.insertCount === 0
            );

            expect(removeSpliceOps).toHaveLength(1);
            expect(removeSpliceOps[0]).toEqual({
                index: 5,
                deleteCount: 100,
                insertCount: 0,
            });
        });

        it('should create separate operations for non-consecutive removals in DataSet', () => {
            const initialData = Array.from({ length: 20 }, (_, i) => ({ value: i }));
            const dataSet = new DataSet(initialData);

            // Remove non-consecutive items: 2-4 and 10-12
            const itemsToRemove = [...initialData.slice(2, 5), ...initialData.slice(10, 13)];

            dataSet.addTransaction({ remove: itemsToRemove });
            const changeDescription = dataSet.getChangeDescription();
            if (!changeDescription) {
                throw new Error('Expected changeDescription to be defined');
            }

            const removeSpliceOps = changeDescription.indexMap.spliceOps.filter(
                (op) => op.deleteCount > 0 && op.insertCount === 0
            );

            // Should have 2 splice operations
            expect(removeSpliceOps).toHaveLength(2);

            // Operations should be in descending order
            expect(removeSpliceOps[0]).toEqual({
                index: 10,
                deleteCount: 3,
                insertCount: 0,
            });
            expect(removeSpliceOps[1]).toEqual({
                index: 2,
                deleteCount: 3,
                insertCount: 0,
            });
        });
    });

    describe('spliceOps optimization', () => {
        describe('consecutive deletions', () => {
            it('should merge 100 consecutive deletions into 1 splice operation', () => {
                // Create a set of 100 consecutive removed indices (5-104)
                const removedIndices = new Set<number>();
                for (let i = 5; i < 105; i++) {
                    removedIndices.add(i);
                }

                const indexMap: IndexTransformationMap = {
                    originalLength: 200,
                    finalLength: 100,
                    spliceOps: createOptimizedSpliceOps(removedIndices, 0, 0),
                    removedIndices,
                    totalPrependCount: 0,
                    totalAppendCount: 0,
                };

                // Should have exactly 1 splice operation
                expect(indexMap.spliceOps).toHaveLength(1);
                expect(indexMap.spliceOps[0]).toEqual({
                    index: 5,
                    deleteCount: 100,
                    insertCount: 0,
                });
            });

            it('should merge consecutive deletions at the start', () => {
                const removedIndices = new Set([0, 1, 2, 3, 4]);

                const indexMap: IndexTransformationMap = {
                    originalLength: 20,
                    finalLength: 15,
                    spliceOps: createOptimizedSpliceOps(removedIndices, 0, 0),
                    removedIndices,
                    totalPrependCount: 0,
                    totalAppendCount: 0,
                };

                expect(indexMap.spliceOps).toHaveLength(1);
                expect(indexMap.spliceOps[0]).toEqual({
                    index: 0,
                    deleteCount: 5,
                    insertCount: 0,
                });
            });

            it('should merge consecutive deletions at the end', () => {
                const removedIndices = new Set([15, 16, 17, 18, 19]);

                const indexMap: IndexTransformationMap = {
                    originalLength: 20,
                    finalLength: 15,
                    spliceOps: createOptimizedSpliceOps(removedIndices, 0, 0),
                    removedIndices,
                    totalPrependCount: 0,
                    totalAppendCount: 0,
                };

                expect(indexMap.spliceOps).toHaveLength(1);
                expect(indexMap.spliceOps[0]).toEqual({
                    index: 15,
                    deleteCount: 5,
                    insertCount: 0,
                });
            });

            it('should handle consecutive deletions with prepends', () => {
                const removedIndices = new Set([5, 6, 7, 8, 9]);
                const totalPrependCount = 3;

                const indexMap: IndexTransformationMap = {
                    originalLength: 20,
                    finalLength: 18, // 20 - 5 removed + 3 prepended
                    spliceOps: createOptimizedSpliceOps(removedIndices, totalPrependCount, 0),
                    removedIndices,
                    totalPrependCount,
                    totalAppendCount: 0,
                };

                // Should have 1 delete operation (prepend is handled separately)
                expect(indexMap.spliceOps).toHaveLength(1);
                expect(indexMap.spliceOps[0]).toEqual({
                    index: 8, // 5 + 3 prepends
                    deleteCount: 5,
                    insertCount: 0,
                });
            });
        });

        describe('non-consecutive deletions', () => {
            it('should create separate splice operations for non-consecutive groups', () => {
                // Two groups: 2-4 and 10-12
                const removedIndices = new Set([2, 3, 4, 10, 11, 12]);

                const indexMap: IndexTransformationMap = {
                    originalLength: 20,
                    finalLength: 14,
                    spliceOps: createOptimizedSpliceOps(removedIndices, 0, 0),
                    removedIndices,
                    totalPrependCount: 0,
                    totalAppendCount: 0,
                };

                // Should have 2 splice operations
                expect(indexMap.spliceOps).toHaveLength(2);

                // Operations should be in descending order
                expect(indexMap.spliceOps[0]).toEqual({
                    index: 10,
                    deleteCount: 3,
                    insertCount: 0,
                });
                expect(indexMap.spliceOps[1]).toEqual({
                    index: 2,
                    deleteCount: 3,
                    insertCount: 0,
                });
            });

            it('should handle single deletions between consecutive groups', () => {
                // Groups: 1-3, 5 (single), 7-9
                const removedIndices = new Set([1, 2, 3, 5, 7, 8, 9]);

                const indexMap: IndexTransformationMap = {
                    originalLength: 20,
                    finalLength: 13,
                    spliceOps: createOptimizedSpliceOps(removedIndices, 0, 0),
                    removedIndices,
                    totalPrependCount: 0,
                    totalAppendCount: 0,
                };

                // Should have 3 splice operations
                expect(indexMap.spliceOps).toHaveLength(3);

                // Operations should be in descending order
                expect(indexMap.spliceOps[0]).toEqual({
                    index: 7,
                    deleteCount: 3,
                    insertCount: 0,
                });
                expect(indexMap.spliceOps[1]).toEqual({
                    index: 5,
                    deleteCount: 1,
                    insertCount: 0,
                });
                expect(indexMap.spliceOps[2]).toEqual({
                    index: 1,
                    deleteCount: 3,
                    insertCount: 0,
                });
            });
        });

        describe('edge cases', () => {
            it('should handle empty removal set', () => {
                const removedIndices = new Set<number>();

                const indexMap: IndexTransformationMap = {
                    originalLength: 20,
                    finalLength: 20,
                    spliceOps: createOptimizedSpliceOps(removedIndices, 0, 0),
                    removedIndices,
                    totalPrependCount: 0,
                    totalAppendCount: 0,
                };

                expect(indexMap.spliceOps).toHaveLength(0);
            });

            it('should handle single deletion', () => {
                const removedIndices = new Set([5]);

                const indexMap: IndexTransformationMap = {
                    originalLength: 20,
                    finalLength: 19,
                    spliceOps: createOptimizedSpliceOps(removedIndices, 0, 0),
                    removedIndices,
                    totalPrependCount: 0,
                    totalAppendCount: 0,
                };

                expect(indexMap.spliceOps).toHaveLength(1);
                expect(indexMap.spliceOps[0]).toEqual({
                    index: 5,
                    deleteCount: 1,
                    insertCount: 0,
                });
            });

            it('should handle all indices removed', () => {
                const removedIndices = new Set<number>();
                for (let i = 0; i < 10; i++) {
                    removedIndices.add(i);
                }

                const indexMap: IndexTransformationMap = {
                    originalLength: 10,
                    finalLength: 0,
                    spliceOps: createOptimizedSpliceOps(removedIndices, 0, 0),
                    removedIndices,
                    totalPrependCount: 0,
                    totalAppendCount: 0,
                };

                expect(indexMap.spliceOps).toHaveLength(1);
                expect(indexMap.spliceOps[0]).toEqual({
                    index: 0,
                    deleteCount: 10,
                    insertCount: 0,
                });
            });
        });

        describe('array transformation', () => {
            it('should correctly apply optimized splice operations', () => {
                const removedIndices = new Set([2, 3, 4, 7, 8]);

                const indexMap: IndexTransformationMap = {
                    originalLength: 10,
                    finalLength: 5,
                    spliceOps: createOptimizedSpliceOps(removedIndices, 0, 0),
                    removedIndices,
                    totalPrependCount: 0,
                    totalAppendCount: 0,
                };

                const desc = new DataChangeDescription(indexMap, {
                    prependValues: [],
                    appendValues: [],
                });

                const array = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
                desc.applyToArray(array, () => -1); // Shouldn't insert anything

                expect(array).toEqual([0, 1, 5, 6, 9]);
            });

            it('should handle complex transformation with prepends and appends', () => {
                const removedIndices = new Set([1, 2]);

                // Create optimized splice ops for removals
                const removalOps = createOptimizedSpliceOps(removedIndices, 2, 0);

                // Combine all splice ops in order: prepend, removals, append
                const spliceOps: SpliceOperation[] = [
                    { index: 0, deleteCount: 0, insertCount: 2 }, // prepend
                    ...removalOps,
                    { index: 5, deleteCount: 0, insertCount: 1 }, // append at final position
                ];

                const indexMap: IndexTransformationMap = {
                    originalLength: 5,
                    finalLength: 6, // 5 - 2 removed + 2 prepended + 1 appended
                    spliceOps,
                    removedIndices,
                    totalPrependCount: 2,
                    totalAppendCount: 1,
                };

                const desc = new DataChangeDescription(indexMap, {
                    prependValues: ['P1', 'P2'],
                    appendValues: ['A1'],
                });

                const array = ['a', 'b', 'c', 'd', 'e'];
                let insertIndex = 0;
                const insertValues = ['P1', 'P2', 'A1'];
                desc.applyToArray(array, () => insertValues[insertIndex++]);

                expect(array).toEqual(['P1', 'P2', 'a', 'd', 'e', 'A1']);
            });
        });
    });
});

/**
 * Helper function that creates optimized splice operations from a set of removed indices.
 * This is the optimized version that merges consecutive deletions.
 */
function createOptimizedSpliceOps(
    removedIndices: Set<number>,
    totalPrependCount: number,
    _totalAppendCount: number
): SpliceOperation[] {
    if (removedIndices.size === 0) {
        return [];
    }

    const spliceOps: SpliceOperation[] = [];
    const sortedRemovals = Array.from(removedIndices).sort((a, b) => b - a);

    // Group consecutive indices and create splice operations
    let currentGroupStart = sortedRemovals[0];
    let currentGroupCount = 1;

    for (let i = 1; i < sortedRemovals.length; i++) {
        const currentIndex = sortedRemovals[i];
        const prevIndex = sortedRemovals[i - 1];

        if (prevIndex - currentIndex === 1) {
            // Consecutive (descending), continue the group
            currentGroupCount++;
        } else {
            // Non-consecutive, finalize current group
            spliceOps.push({
                index: currentGroupStart - currentGroupCount + 1 + totalPrependCount,
                deleteCount: currentGroupCount,
                insertCount: 0,
            });

            // Start new group
            currentGroupStart = currentIndex;
            currentGroupCount = 1;
        }
    }

    // Add the last group
    spliceOps.push({
        index: currentGroupStart - currentGroupCount + 1 + totalPrependCount,
        deleteCount: currentGroupCount,
        insertCount: 0,
    });

    return spliceOps;
}
