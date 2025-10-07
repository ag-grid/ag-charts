import { describe, expect, test } from '@jest/globals';

import { DataSet } from './dataSet';

type DataTransaction<T> = Parameters<DataSet<T>['addTransaction']>[0];

interface CommitStep<T> {
    transactions: DataTransaction<T>[];
    expected: T[];
}

function runCommitScenario<T>({ initial, steps }: { initial: T[]; steps: CommitStep<T>[] }) {
    const dataSet = new DataSet<T>([...initial]);

    for (const step of steps) {
        for (const transaction of step.transactions) {
            dataSet.addTransaction(transaction);
        }

        dataSet.commitPendingTransactions();
        expect(dataSet.data).toEqual(step.expected);
    }
}

function expectCommitResult<T>({
    initial,
    transactions,
    expected,
}: {
    initial: T[];
    transactions: DataTransaction<T> | DataTransaction<T>[];
    expected: T[];
}) {
    runCommitScenario({
        initial,
        steps: [
            {
                transactions: Array.isArray(transactions) ? transactions : [transactions],
                expected,
            },
        ],
    });
}

describe('DataSet', () => {
    describe('getChangeDescription', () => {
        test('should return undefined when there are no pending transactions', () => {
            const dataSet = new DataSet([1, 2, 3]);
            expect(dataSet.getChangeDescription()).toBeUndefined();
        });

        test('should handle append-only operations', () => {
            const dataSet = new DataSet([1, 2, 3]);
            dataSet.addTransaction({ append: [4, 5] });

            const desc = dataSet.getChangeDescription()!;
            expect(desc).toBeDefined();

            // Check index map
            expect(desc.indexMap.originalLength).toBe(3);
            expect(desc.indexMap.finalLength).toBe(5);
            expect(desc.indexMap.spliceOps).toHaveLength(1);
            expect(desc.indexMap.spliceOps[0]).toEqual({
                index: 3,
                deleteCount: 0,
                insertCount: 2,
            });
            // Check that prepend/append counts are tracked
            expect(desc.indexMap.totalPrependCount).toBe(0);
            expect(desc.indexMap.totalAppendCount).toBe(2);
            // Verify preserved indices through the iterator
            const preserved: Array<[number, number]> = [];
            desc.forEachPreservedIndex((src, dest) => preserved.push([src, dest]));
            expect(preserved).toEqual([
                [0, 0],
                [1, 1],
                [2, 2],
            ]);

            // Check removed indices
            expect(desc.getRemovedIndices()).toEqual([]);
        });

        test('should handle prepend-only operations', () => {
            const dataSet = new DataSet([1, 2, 3]);
            dataSet.addTransaction({ prepend: [0] });

            const desc = dataSet.getChangeDescription()!;
            expect(desc).toBeDefined();

            // Check index map
            expect(desc.indexMap.originalLength).toBe(3);
            expect(desc.indexMap.finalLength).toBe(4);
            expect(desc.indexMap.spliceOps).toHaveLength(1);
            expect(desc.indexMap.spliceOps[0]).toEqual({
                index: 0,
                deleteCount: 0,
                insertCount: 1,
            });
            // Check that prepend/append counts are tracked
            expect(desc.indexMap.totalPrependCount).toBe(1);
            expect(desc.indexMap.totalAppendCount).toBe(0);
            // Verify preserved indices through the iterator (shifted by prepend)
            const preserved: Array<[number, number]> = [];
            desc.forEachPreservedIndex((src, dest) => preserved.push([src, dest]));
            expect(preserved).toEqual([
                [0, 1],
                [1, 2],
                [2, 3],
            ]);

            // Check removed indices
            expect(desc.getRemovedIndices()).toEqual([]);
        });

        test('should handle remove-only operations', () => {
            const item0 = { x: 0 };
            const item1 = { x: 1 };
            const item2 = { x: 2 };
            const dataSet = new DataSet([item0, item1, item2]);
            dataSet.addTransaction({ remove: [item1] });

            const desc = dataSet.getChangeDescription()!;
            expect(desc).toBeDefined();

            // Check index map
            expect(desc.indexMap.originalLength).toBe(3);
            expect(desc.indexMap.finalLength).toBe(2);
            expect(desc.indexMap.spliceOps).toHaveLength(1);
            expect(desc.indexMap.spliceOps[0]).toEqual({
                index: 1,
                deleteCount: 1,
                insertCount: 0,
            });
            // Check that prepend/append counts are tracked
            expect(desc.indexMap.totalPrependCount).toBe(0);
            expect(desc.indexMap.totalAppendCount).toBe(0);
            // Verify preserved indices through the iterator
            const preserved: Array<[number, number]> = [];
            desc.forEachPreservedIndex((src, dest) => preserved.push([src, dest]));
            expect(preserved).toEqual([
                [0, 0],
                [2, 1],
            ]);
            // Check removed indices
            expect(desc.indexMap.removedIndices.has(1)).toBe(true);

            // Check removed indices
            expect(desc.getRemovedIndices()).toEqual([1]);
        });

        test('should handle complex transaction sequence: prepend + remove', () => {
            const item0 = { x: 0 };
            const item1 = { x: 1 };
            const item2 = { x: 2 };
            const dataSet = new DataSet([item0, item1, item2]);

            dataSet.addTransaction({ prepend: [{ x: -1 }] });
            dataSet.addTransaction({ remove: [item1] });

            const desc = dataSet.getChangeDescription()!;
            expect(desc).toBeDefined();

            // After prepend: [X, 0, 1, 2] (X is new)
            // After remove:  [X, 0, 2]
            expect(desc.indexMap.originalLength).toBe(3);
            expect(desc.indexMap.finalLength).toBe(3);

            // Check removed indices
            expect(desc.getRemovedIndices()).toEqual([1]);
        });

        test('should handle complex transaction sequence: remove + append', () => {
            const item0 = { x: 0 };
            const item1 = { x: 1 };
            const item2 = { x: 2 };
            const dataSet = new DataSet([item0, item1, item2]);

            dataSet.addTransaction({ remove: [item1] });
            dataSet.addTransaction({ append: [{ x: 3 }, { x: 4 }] });

            const desc = dataSet.getChangeDescription()!;
            expect(desc).toBeDefined();

            // After remove: [0, 2]
            // After append: [0, 2, 3, 4]
            expect(desc.indexMap.originalLength).toBe(3);
            expect(desc.indexMap.finalLength).toBe(4);

            // Check removed indices
            expect(desc.getRemovedIndices()).toEqual([1]);
        });

        test('should handle removing multiple items', () => {
            const item0 = { x: 0 };
            const item1 = { x: 1 };
            const item2 = { x: 2 };
            const item3 = { x: 3 };
            const item4 = { x: 4 };
            const dataSet = new DataSet([item0, item1, item2, item3, item4]);

            dataSet.addTransaction({ remove: [item1, item3] });

            const desc = dataSet.getChangeDescription()!;
            expect(desc).toBeDefined();

            // After remove: [0, 2, 4]
            expect(desc.indexMap.originalLength).toBe(5);
            expect(desc.indexMap.finalLength).toBe(3);

            // Check removed indices
            expect(desc.getRemovedIndices()).toEqual([1, 3]);
        });

        test('should handle prepend + append + remove', () => {
            const item0 = { x: 0 };
            const item1 = { x: 1 };
            const dataSet = new DataSet([item0, item1]);

            dataSet.addTransaction({ prepend: [{ x: -1 }] });
            dataSet.addTransaction({ append: [{ x: 2 }, { x: 3 }] });
            dataSet.addTransaction({ remove: [item0] });

            const desc = dataSet.getChangeDescription()!;
            expect(desc).toBeDefined();

            // After prepend: [X, 0, 1]
            // After append:  [X, 0, 1, 2, 3]
            // After remove:  [X, 1, 2, 3]
            expect(desc.indexMap.originalLength).toBe(2);
            expect(desc.indexMap.finalLength).toBe(4);

            // Check removed indices
            expect(desc.getRemovedIndices()).toEqual([0]);
        });

        test('should cache the result', () => {
            const dataSet = new DataSet([1, 2, 3]);
            dataSet.addTransaction({ append: [4] });

            const desc1 = dataSet.getChangeDescription();
            const desc2 = dataSet.getChangeDescription();

            expect(desc1).toBe(desc2);
        });

        test('should invalidate cache after commitPendingTransactions', () => {
            const dataSet = new DataSet([1, 2, 3]);
            dataSet.addTransaction({ append: [4] });

            const descBefore = dataSet.getChangeDescription();
            expect(descBefore).toBeDefined();

            dataSet.commitPendingTransactions();

            const descAfter = dataSet.getChangeDescription();
            expect(descAfter).toBeUndefined(); // No pending transactions after commit

            dataSet.addTransaction({ append: [5] });
            const descAfter2 = dataSet.getChangeDescription();
            expect(descAfter2).toBeDefined();
            expect(descBefore).not.toBe(descAfter2);
        });

        test('should invalidate cache automatically when adding transactions', () => {
            const dataSet = new DataSet([1, 2, 3]);
            dataSet.addTransaction({ append: [4] });

            const desc1 = dataSet.getChangeDescription();
            expect(desc1).toBeDefined();
            expect(desc1?.indexMap.finalLength).toBe(4);

            // Adding another transaction should invalidate the cache
            dataSet.addTransaction({ append: [5] });

            const desc2 = dataSet.getChangeDescription();
            expect(desc2).toBeDefined();
            expect(desc2).not.toBe(desc1);
            expect(desc2?.indexMap.finalLength).toBe(5);
        });

        test('should handle empty array', () => {
            const dataSet = new DataSet<number>([]);
            dataSet.addTransaction({ append: [1, 2] });

            const desc = dataSet.getChangeDescription()!;
            expect(desc).toBeDefined();
            expect(desc.indexMap.originalLength).toBe(0);
            expect(desc.indexMap.finalLength).toBe(2);
        });

        test('should handle removing all items', () => {
            const item0 = { x: 0 };
            const item1 = { x: 1 };
            const dataSet = new DataSet([item0, item1]);

            dataSet.addTransaction({ remove: [item0, item1] });

            const desc = dataSet.getChangeDescription()!;
            expect(desc).toBeDefined();
            expect(desc.indexMap.originalLength).toBe(2);
            expect(desc.indexMap.finalLength).toBe(0);
            expect(desc.getRemovedIndices()).toEqual([0, 1]);
        });

        test('forEachPreservedSegment should iterate only preserved segments', () => {
            const item0 = { x: 0 };
            const item1 = { x: 1 };
            const item2 = { x: 2 };
            const item3 = { x: 3 };
            const dataSet = new DataSet([item0, item1, item2, item3]);

            dataSet.addTransaction({ remove: [item1, item2] });

            const desc = dataSet.getChangeDescription()!;
            const preserved: Array<[number, number]> = [];

            desc.forEachPreservedIndex((sourceIdx, destIdx) => {
                preserved.push([sourceIdx, destIdx]);
            });

            expect(preserved).toHaveLength(2);
            expect(preserved[0]).toEqual([0, 0]); // item0 preserved at same index
            expect(preserved[1]).toEqual([3, 1]); // item3 moved to index 1
        });
    });

    describe('commitPendingTransactions', () => {
        describe('multiple disjoint removals', () => {
            test('should correctly remove multiple non-consecutive items', () => {
                expectCommitResult({
                    initial: ['a', 'b', 'c', 'd', 'e'],
                    transactions: { remove: ['b', 'd'] },
                    expected: ['a', 'c', 'e'],
                }); // Will FAIL with current bug
            });

            test('should handle removing alternating elements', () => {
                expectCommitResult({
                    initial: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
                    transactions: { remove: [1, 3, 5, 7, 9] },
                    expected: [0, 2, 4, 6, 8],
                }); // Will FAIL
            });

            test('should handle removing first and last with middle elements', () => {
                expectCommitResult({
                    initial: ['first', 'a', 'b', 'c', 'last'],
                    transactions: { remove: ['first', 'b', 'last'] },
                    expected: ['a', 'c'],
                }); // Will FAIL
            });

            test('should handle massive disjoint removals', () => {
                const initial = Array.from({ length: 100 }, (_, i) => i);
                const toRemove = initial.filter((x) => x % 3 === 0);

                expectCommitResult({
                    initial,
                    transactions: { remove: toRemove },
                    expected: initial.filter((x) => x % 3 !== 0),
                });
            });
        });

        describe('multiple prepend transactions', () => {
            test('should maintain LIFO order for sequential prepends', () => {
                expectCommitResult<string | number>({
                    initial: [42],
                    transactions: [{ prepend: ['a'] }, { prepend: ['b'] }],
                    expected: ['b', 'a', 42],
                }); // Will FAIL - gets ['a', 'b', 42]
            });

            test('should handle multiple prepends with multiple values each', () => {
                expectCommitResult({
                    initial: ['original'],
                    transactions: [{ prepend: ['a1', 'a2'] }, { prepend: ['b1', 'b2'] }],
                    expected: ['b1', 'b2', 'a1', 'a2', 'original'],
                }); // Will FAIL
            });

            test('should handle three consecutive prepend transactions', () => {
                expectCommitResult<string>({
                    initial: [] as string[],
                    transactions: [{ prepend: ['first'] }, { prepend: ['second'] }, { prepend: ['third'] }],
                    expected: ['third', 'second', 'first'],
                }); // Will FAIL
            });
        });

        describe('combined operations in single transaction', () => {
            test('prepend + remove in same transaction', () => {
                expectCommitResult({
                    initial: [1, 2, 3, 4, 5],
                    transactions: {
                        prepend: [0],
                        remove: [2, 4],
                    },
                    expected: [0, 1, 3, 5],
                });
            });

            test('append + remove in same transaction', () => {
                expectCommitResult({
                    initial: [1, 2, 3, 4, 5],
                    transactions: {
                        append: [6, 7],
                        remove: [1, 3],
                    },
                    expected: [2, 4, 5, 6, 7],
                });
            });

            test('prepend + append + remove in same transaction', () => {
                expectCommitResult({
                    initial: ['b', 'c', 'd'],
                    transactions: {
                        prepend: ['a'],
                        append: ['e'],
                        remove: ['c'],
                    },
                    expected: ['a', 'b', 'd', 'e'],
                });
            });

            test('remove then prepend in separate transactions', () => {
                expectCommitResult({
                    initial: [1, 2, 3, 4, 5],
                    transactions: [{ remove: [2, 4] }, { prepend: [0] }],
                    expected: [0, 1, 3, 5],
                });
            });

            test('prepend then remove in separate transactions', () => {
                expectCommitResult({
                    initial: [1, 2, 3],
                    transactions: [{ prepend: [0] }, { remove: [2] }],
                    expected: [0, 1, 3],
                });
            });

            test('multiple appends then multiple removes', () => {
                expectCommitResult({
                    initial: [1, 2, 3],
                    transactions: [{ append: [4] }, { append: [5, 6] }, { remove: [2, 4, 5] }],
                    expected: [1, 3, 6],
                });
            });

            test('complex multi-transaction sequence', () => {
                expectCommitResult({
                    initial: ['a', 'b', 'c'],
                    transactions: [
                        { prepend: ['x'] },
                        { append: ['d'] },
                        { remove: ['b'] },
                        { prepend: ['y'] },
                        { append: ['e'] },
                    ],
                    expected: ['y', 'x', 'a', 'c', 'd', 'e'],
                });
            });
        });

        test('remove all elements then append', () => {
            expectCommitResult({
                initial: [1, 2, 3],
                transactions: [{ remove: [1, 2, 3] }, { append: [4, 5] }],
                expected: [4, 5],
            });
        });

        test('empty initial array with operations', () => {
            expectCommitResult<number>({
                initial: [],
                transactions: [{ prepend: [1] }, { append: [2] }, { prepend: [0] }],
                expected: [0, 1, 2],
            });
        });

        test('remove non-existent items should be ignored', () => {
            expectCommitResult({
                initial: [1, 2, 3],
                transactions: { remove: [4, 5] },
                expected: [1, 2, 3],
            });
        });

        test('multiple operations on same data', () => {
            runCommitScenario({
                initial: ['a', 'b', 'c'],
                steps: [
                    {
                        transactions: [{ prepend: ['x'] }, { append: ['d'] }],
                        expected: ['x', 'a', 'b', 'c', 'd'],
                    },
                    {
                        transactions: [{ remove: ['b'] }, { prepend: ['y'] }],
                        expected: ['y', 'x', 'a', 'c', 'd'],
                    },
                ],
            });
        });
    });

    /**
     * Performance tests to verify the scalability optimizations in buildIndexMap.
     * These tests ensure we're performing the minimum number of array operations.
     */
    describe('buildIndexMap performance - Array Operation Scale', () => {
        /**
         * Helper to create a spy that tracks data access patterns
         */
        function createDataSetWithTracking<T>(initialData: T[]) {
            const accessedIndices = new Set<number>();
            let maxAccessedIndex = -1;

            // Create a proxy around the data array to track accesses
            const dataProxy = new Proxy(initialData, {
                get(target, prop) {
                    if (typeof prop === 'string' && !isNaN(Number(prop))) {
                        const index = Number(prop);
                        accessedIndices.add(index);
                        maxAccessedIndex = Math.max(maxAccessedIndex, index);
                    }
                    return target[prop as any];
                },
            });

            const dataSet = new DataSet(dataProxy);

            return {
                dataSet,
                getAccessStats: () => ({
                    accessedIndices: Array.from(accessedIndices).sort((a, b) => a - b),
                    accessCount: accessedIndices.size,
                    maxAccessedIndex,
                }),
                resetAccessStats: () => {
                    accessedIndices.clear();
                    maxAccessedIndex = -1;
                },
            };
        }

        describe('removing appended items', () => {
            test('should NOT scan original data when removing recently appended items (primitive values)', () => {
                // Create large dataset with PRIMITIVE values for proper Set matching
                const dataSize = 10000;
                const data = Array.from({ length: dataSize }, (_, i) => i);
                const { dataSet, getAccessStats, resetAccessStats } = createDataSetWithTracking(data);

                // Append some items
                const appendedItems = [dataSize, dataSize + 1, dataSize + 2];
                dataSet.addTransaction({ append: appendedItems });

                // Reset stats before the operation we want to measure
                resetAccessStats();

                // Remove one of the appended items
                dataSet.addTransaction({ remove: [dataSize + 1] });
                dataSet.getChangeDescription();

                const stats = getAccessStats();

                // Should NOT have accessed any of the original data
                expect(stats.accessCount).toBe(0);
                expect(stats.maxAccessedIndex).toBe(-1);
            });

            test('should scan data when removing objects (limitation: object identity)', () => {
                // Objects require scanning because Set uses reference equality
                const dataSize = 10000;
                const data = Array.from({ length: dataSize }, (_, i) => ({ id: i }));
                const { dataSet, getAccessStats, resetAccessStats } = createDataSetWithTracking(data);

                // Append some items (different object instances)
                const appendedItems = [{ id: dataSize }, { id: dataSize + 1 }, { id: dataSize + 2 }];
                dataSet.addTransaction({ append: appendedItems });

                resetAccessStats();

                // Try to remove with a new object instance - won't match appended items
                dataSet.addTransaction({ remove: [{ id: dataSize + 1 }] });
                dataSet.getChangeDescription();

                const stats = getAccessStats();

                // Will scan original data looking for the object (and won't find it)
                expect(stats.accessCount).toBe(dataSize);
            });

            test('should handle removing all appended items without scanning original data', () => {
                const dataSize = 5000;
                const data = Array.from({ length: dataSize }, (_, i) => i);
                const { dataSet, getAccessStats, resetAccessStats } = createDataSetWithTracking(data);

                const appendedItems = [100001, 100002, 100003, 100004, 100005];
                dataSet.addTransaction({ append: appendedItems });

                resetAccessStats();

                // Remove all appended items
                dataSet.addTransaction({ remove: appendedItems });
                dataSet.getChangeDescription();

                const stats = getAccessStats();

                // Should not have scanned the original 5000 items
                expect(stats.accessCount).toBe(0);
            });
        });

        describe('removing prepended items', () => {
            test('should NOT scan original data when removing recently prepended items (primitive values)', () => {
                const dataSize = 10000;
                const data = Array.from({ length: dataSize }, (_, i) => i);
                const { dataSet, getAccessStats, resetAccessStats } = createDataSetWithTracking(data);

                // Prepend some items with primitive values
                const prependedItems = [-3, -2, -1];
                dataSet.addTransaction({ prepend: prependedItems });

                resetAccessStats();

                // Remove one of the prepended items
                dataSet.addTransaction({ remove: [-2] });
                dataSet.getChangeDescription();

                const stats = getAccessStats();

                // Should NOT have accessed any of the original data
                expect(stats.accessCount).toBe(0);
            });

            test('should work with same object references', () => {
                const dataSize = 10000;
                const data = Array.from({ length: dataSize }, (_, i) => ({ id: i }));
                const { dataSet, getAccessStats, resetAccessStats } = createDataSetWithTracking(data);

                // Prepend some items - keep references
                const obj1 = { id: -3 };
                const obj2 = { id: -2 };
                const obj3 = { id: -1 };
                const prependedItems = [obj1, obj2, obj3];
                dataSet.addTransaction({ prepend: prependedItems });

                resetAccessStats();

                // Remove using the SAME object reference
                dataSet.addTransaction({ remove: [obj2] });
                dataSet.getChangeDescription();

                const stats = getAccessStats();

                // Should NOT have accessed any of the original data
                expect(stats.accessCount).toBe(0);
            });
        });

        describe('early stopping optimization', () => {
            test('should stop scanning after finding items at the beginning', () => {
                const dataSize = 10000;
                const data = Array.from({ length: dataSize }, (_, i) => ({ id: i, value: i }));
                const { dataSet, getAccessStats, resetAccessStats } = createDataSetWithTracking(data);

                resetAccessStats();

                // Remove first 5 items
                const itemsToRemove = data.slice(0, 5);
                dataSet.addTransaction({ remove: itemsToRemove });
                dataSet.getChangeDescription();

                const stats = getAccessStats();

                // Should have only accessed the first 5 items, not all 10000
                expect(stats.accessCount).toBe(5);
                expect(stats.maxAccessedIndex).toBe(4);
                expect(stats.accessedIndices).toEqual([0, 1, 2, 3, 4]);
            });

            test('should stop scanning once all items are found', () => {
                const dataSize = 10000;
                const data = Array.from({ length: dataSize }, (_, i) => i);
                const { dataSet, getAccessStats, resetAccessStats } = createDataSetWithTracking(data);

                resetAccessStats();

                // Remove items 10, 20, 30
                dataSet.addTransaction({ remove: [10, 20, 30] });
                dataSet.getChangeDescription();

                const stats = getAccessStats();

                // Should stop after finding item 30 (at index 30), not scan to 10000
                expect(stats.maxAccessedIndex).toBeLessThanOrEqual(30);
                expect(stats.accessCount).toBeLessThanOrEqual(31); // May need to scan up to index 30
            });
        });

        describe('no removal optimization', () => {
            test('should NOT scan data when only appending', () => {
                const dataSize = 10000;
                const data = Array.from({ length: dataSize }, (_, i) => i);
                const { dataSet, getAccessStats, resetAccessStats } = createDataSetWithTracking(data);

                resetAccessStats();

                // Only append, no removals
                dataSet.addTransaction({ append: [10001, 10002, 10003] });
                dataSet.getChangeDescription();

                const stats = getAccessStats();

                // Should not have accessed any data
                expect(stats.accessCount).toBe(0);
            });

            test('should NOT scan data when only prepending', () => {
                const dataSize = 10000;
                const data = Array.from({ length: dataSize }, (_, i) => i);
                const { dataSet, getAccessStats, resetAccessStats } = createDataSetWithTracking(data);

                resetAccessStats();

                // Only prepend, no removals
                dataSet.addTransaction({ prepend: [-3, -2, -1] });
                dataSet.getChangeDescription();

                const stats = getAccessStats();

                // Should not have accessed any data
                expect(stats.accessCount).toBe(0);
            });

            test('should NOT scan data for mixed append/prepend without removals', () => {
                const dataSize = 10000;
                const data = Array.from({ length: dataSize }, (_, i) => i);
                const { dataSet, getAccessStats, resetAccessStats } = createDataSetWithTracking(data);

                resetAccessStats();

                // Mixed operations but no removals
                dataSet.addTransaction({
                    prepend: [-3, -2, -1],
                    append: [10001, 10002, 10003],
                });
                dataSet.getChangeDescription();

                const stats = getAccessStats();

                // Should not have accessed any data
                expect(stats.accessCount).toBe(0);
            });
        });

        describe('complex scenarios', () => {
            test('should optimize multiple transactions with mixed operations (using same references)', () => {
                const dataSize = 5000;
                const data = Array.from({ length: dataSize }, (_, i) => ({ id: i }));
                const { dataSet, getAccessStats, resetAccessStats } = createDataSetWithTracking(data);

                // Keep references to objects we'll remove later
                const prepend1 = { id: -1 };
                const prepend2 = { id: -2 };
                const append1 = { id: 5000 };
                const append2 = { id: 5001 };

                // First transaction: add some items
                dataSet.addTransaction({
                    prepend: [prepend1, prepend2],
                    append: [append1, append2],
                });

                resetAccessStats();

                // Second transaction: remove using SAME object references
                dataSet.addTransaction({
                    remove: [prepend1, append2],
                });
                dataSet.getChangeDescription();

                const stats = getAccessStats();

                // Should not have scanned original data (removed from prepends/appends only)
                expect(stats.accessCount).toBe(0);
            });

            test('should handle removal of non-existent items efficiently', () => {
                const dataSize = 5000;
                const data = Array.from({ length: dataSize }, (_, i) => i);
                const { dataSet, getAccessStats, resetAccessStats } = createDataSetWithTracking(data);

                resetAccessStats();

                // Try to remove items that don't exist
                dataSet.addTransaction({ remove: [99999, 88888, 77777] });
                dataSet.getChangeDescription();

                const stats = getAccessStats();

                // Should scan the entire array once (since items don't exist)
                // but should NOT create a full Map or do multiple passes
                expect(stats.accessCount).toBe(dataSize);
            });

            test('should efficiently handle removing items from different sections', () => {
                const dataSize = 1000;
                const data = Array.from({ length: dataSize }, (_, i) => i);
                const { dataSet, getAccessStats, resetAccessStats } = createDataSetWithTracking(data);

                // Add items to prepends and appends
                dataSet.addTransaction({
                    prepend: [-1, -2, -3],
                    append: [1000, 1001, 1002],
                });

                resetAccessStats();

                // Remove from all three sections
                dataSet.addTransaction({
                    remove: [-2, 50, 1001], // prepend, original, append
                });
                dataSet.getChangeDescription();

                const stats = getAccessStats();

                // Should only scan up to index 50 in original data (not all 1000)
                expect(stats.maxAccessedIndex).toBeLessThanOrEqual(50);
                expect(stats.accessCount).toBeLessThanOrEqual(51);
            });
        });

        describe('scale verification with large datasets', () => {
            test('should handle 100k items with minimal operations when removing appended items', () => {
                const dataSize = 100000;
                const data = Array.from({ length: dataSize }, (_, i) => i);
                const { dataSet, getAccessStats, resetAccessStats } = createDataSetWithTracking(data);

                // Append items
                const appended = Array.from({ length: 100 }, (_, i) => dataSize + i);
                dataSet.addTransaction({ append: appended });

                resetAccessStats();

                // Remove half of appended items
                const toRemove = appended.slice(0, 50);
                dataSet.addTransaction({ remove: toRemove });
                dataSet.getChangeDescription();

                const stats = getAccessStats();

                // Should NOT have touched the 100k original items
                expect(stats.accessCount).toBe(0);
                expect(stats.maxAccessedIndex).toBe(-1);
            });

            test('should handle 100k items with early stopping for beginning removals', () => {
                const dataSize = 100000;
                const data = Array.from({ length: dataSize }, (_, i) => ({ id: i }));
                const { dataSet, getAccessStats, resetAccessStats } = createDataSetWithTracking(data);

                resetAccessStats();

                // Remove first 10 items from 100k dataset
                const toRemove = data.slice(0, 10);
                dataSet.addTransaction({ remove: toRemove });
                dataSet.getChangeDescription();

                const stats = getAccessStats();

                // Should only access first 10 items, not all 100k
                expect(stats.accessCount).toBe(10);
                expect(stats.maxAccessedIndex).toBe(9);
            });
        });
    });

    describe('commitPendingTransactions performance - No full data scans', () => {
        /**
         * Helper to track array operations during commit
         */
        function createCommitTrackingDataSet<T>(initialData: T[]) {
            const writeOperations: Array<{ type: string; index: number; count?: number }> = [];
            let fullScanDetected = false;

            // Track array mutations
            const dataProxy = new Proxy(initialData, {
                get(target, prop) {
                    // Track methods that indicate full array scans
                    if (prop === 'unshift') {
                        return function (...items: T[]) {
                            writeOperations.push({ type: 'unshift', index: 0, count: items.length });
                            return Array.prototype.unshift.apply(target, items);
                        };
                    }
                    if (prop === 'push') {
                        return function (...items: T[]) {
                            writeOperations.push({ type: 'push', index: target.length, count: items.length });
                            return Array.prototype.push.apply(target, items);
                        };
                    }
                    if (prop === 'splice') {
                        return function (start: number, deleteCount?: number, ...items: T[]) {
                            writeOperations.push({
                                type: 'splice',
                                index: start,
                                count: deleteCount,
                            });
                            return Array.prototype.splice.apply(target, [start, deleteCount!, ...items] as any);
                        };
                    }

                    // Detect iteration over all elements (would indicate full scan)
                    if (prop === Symbol.iterator || prop === 'forEach' || prop === 'map' || prop === 'filter') {
                        fullScanDetected = true;
                    }

                    // For indexed access, just return the value directly
                    // We'll track writes in the set trap

                    return target[prop as any];
                },
                set(target, prop, value) {
                    if (typeof prop === 'string' && !isNaN(Number(prop))) {
                        const index = Number(prop);
                        writeOperations.push({ type: 'write', index });
                    }
                    target[prop as any] = value;
                    return true;
                },
            });

            const dataSet = new DataSet(dataProxy);

            return {
                dataSet,
                getOperationStats: () => ({
                    operations: [...writeOperations],
                    operationCount: writeOperations.length,
                    fullScanDetected,
                }),
                resetStats: () => {
                    writeOperations.length = 0;
                    fullScanDetected = false;
                },
            };
        }

        test('should not do full array scan when only appending', () => {
            const dataSize = 10000;
            const data = Array.from({ length: dataSize }, (_, i) => i);
            const { dataSet, getOperationStats, resetStats } = createCommitTrackingDataSet(data);

            dataSet.addTransaction({ append: [10000, 10001, 10002] });

            resetStats();
            dataSet.commitPendingTransactions();
            const stats = getOperationStats();

            // Should only have a single splice operation (equivalent to push), no full scan
            expect(stats.fullScanDetected).toBe(false);
            expect(stats.operations).toHaveLength(1);
            expect(stats.operations[0]).toEqual({
                type: 'splice',
                index: dataSize,
                count: 0, // deleteCount is 0 for pure append
            });
        });

        test('should not do full array scan when only prepending', () => {
            const dataSize = 10000;
            const data = Array.from({ length: dataSize }, (_, i) => i);
            const { dataSet, getOperationStats, resetStats } = createCommitTrackingDataSet(data);

            dataSet.addTransaction({ prepend: [-3, -2, -1] });

            resetStats();
            dataSet.commitPendingTransactions();
            const stats = getOperationStats();

            // Should only have a single splice operation (equivalent to unshift), no full scan
            expect(stats.fullScanDetected).toBe(false);
            expect(stats.operations).toHaveLength(1);
            expect(stats.operations[0]).toEqual({
                type: 'splice',
                index: 0,
                count: 0, // deleteCount is 0 for pure prepend
            });
        });

        test('should use splice for removals instead of rewriting entire array', () => {
            const dataSize = 1000;
            const data = Array.from({ length: dataSize }, (_, i) => i);
            const { dataSet, getOperationStats, resetStats } = createCommitTrackingDataSet(data);

            // Remove items 10-14 (consecutive)
            dataSet.addTransaction({ remove: [10, 11, 12, 13, 14] });

            resetStats();
            dataSet.commitPendingTransactions();
            const stats = getOperationStats();

            // Should use a single splice operation for consecutive removals
            expect(stats.fullScanDetected).toBe(false);
            expect(stats.operations).toHaveLength(1);
            expect(stats.operations[0].type).toBe('splice');
            expect(stats.operations[0].count).toBe(5); // Removing 5 consecutive items
        });

        test('should use multiple splices for non-consecutive removals', () => {
            const dataSize = 1000;
            const data = Array.from({ length: dataSize }, (_, i) => i);
            const { dataSet, getOperationStats, resetStats } = createCommitTrackingDataSet(data);

            // Remove non-consecutive items
            dataSet.addTransaction({ remove: [10, 20, 30] });

            resetStats();
            dataSet.commitPendingTransactions();
            const stats = getOperationStats();

            // Should use separate splice operations, no full scan
            expect(stats.fullScanDetected).toBe(false);
            // Should have 3 splice operations (one for each removal)
            expect(stats.operations.filter((op) => op.type === 'splice')).toHaveLength(3);
        });

        test('should efficiently handle mixed operations', () => {
            const dataSize = 1000;
            const data = Array.from({ length: dataSize }, (_, i) => i);
            const { dataSet, getOperationStats, resetStats } = createCommitTrackingDataSet(data);

            dataSet.addTransaction({
                prepend: [-1, -2],
                append: [1000, 1001],
                remove: [50, 51, 52], // consecutive removals
            });

            resetStats();
            dataSet.commitPendingTransactions();
            const stats = getOperationStats();

            // Should not do full scan
            expect(stats.fullScanDetected).toBe(false);

            // Should have 3 splice operations: one for prepend, one for removal, one for append
            // applyToArray uses splice for all operations
            const spliceOps = stats.operations.filter((op) => op.type === 'splice');

            expect(spliceOps).toHaveLength(3);
            // First splice: prepend at index 0
            expect(spliceOps[0].index).toBe(0);
            expect(spliceOps[0].count).toBe(0); // no deletions for prepend
            // Second splice: remove at index 52 (50 original + 2 prepended)
            expect(spliceOps[1].index).toBe(52);
            expect(spliceOps[1].count).toBe(3); // removing 3 items
            // Third splice: append at end
            expect(spliceOps[2].index).toBe(999); // after removals
        });

        test('should handle large consecutive removals efficiently', () => {
            const dataSize = 100000;
            const data = Array.from({ length: dataSize }, (_, i) => i);
            const { dataSet, getOperationStats, resetStats } = createCommitTrackingDataSet(data);

            // Remove 1000 consecutive items from the middle
            const toRemove = Array.from({ length: 1000 }, (_, i) => 50000 + i);
            dataSet.addTransaction({ remove: toRemove });

            resetStats();
            dataSet.commitPendingTransactions();
            const stats = getOperationStats();

            // Should use a single splice for 1000 consecutive removals
            expect(stats.fullScanDetected).toBe(false);
            expect(stats.operations).toHaveLength(1);
            expect(stats.operations[0]).toEqual({
                type: 'splice',
                index: 50000,
                count: 1000,
            });
        });

        test('should avoid array rewrites even with complex removal patterns', () => {
            const dataSize = 1000;
            const data = Array.from({ length: dataSize }, (_, i) => i);
            const { dataSet, getOperationStats, resetStats } = createCommitTrackingDataSet(data);

            // Multiple groups of consecutive removals
            dataSet.addTransaction({
                remove: [
                    10,
                    11,
                    12, // Group 1
                    100,
                    101,
                    102, // Group 2
                    500,
                    501, // Group 3
                ],
            });

            resetStats();
            dataSet.commitPendingTransactions();
            const stats = getOperationStats();

            // Should not do full scan
            expect(stats.fullScanDetected).toBe(false);

            // Should use splice operations only
            const spliceOps = stats.operations.filter((op) => op.type === 'splice');
            expect(spliceOps).toHaveLength(3); // One splice per group

            // Verify no individual element writes occurred
            const writeOps = stats.operations.filter((op) => op.type === 'write');
            expect(writeOps).toHaveLength(0);
        });
    });
});
