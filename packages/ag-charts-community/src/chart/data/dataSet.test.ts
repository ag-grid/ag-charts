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
     * Performance tests to verify scalability optimizations.
     * Tests verify behavioral guarantees (O(changes) not O(data)) rather than implementation details.
     */
    describe('performance optimizations', () => {
        /**
         * Simplified operation tracker - counts reads and splice operations.
         */
        class OperationTracker<T> {
            reads = 0;
            splices = 0;

            wrap(array: T[]): T[] {
                const tracker = this;
                return new Proxy(array, {
                    get(target, prop) {
                        // Count element reads
                        if (typeof prop === 'string' && !Number.isNaN(Number(prop))) {
                            tracker.reads++;
                        }
                        // Intercept splice to count batch operations
                        if (prop === 'splice') {
                            return function (this: T[], ...args: any[]) {
                                tracker.splices++;
                                return Array.prototype.splice.apply(this, args as any);
                            };
                        }
                        return (target as any)[prop];
                    },
                });
            }

            reset() {
                this.reads = 0;
                this.splices = 0;
            }
        }

        function createTrackedDataSet<T>(initialData: T[]) {
            const tracker = new OperationTracker<T>();
            const trackedData = tracker.wrap(initialData);
            const dataSet = new DataSet(trackedData);

            return { dataSet, tracker };
        }

        describe('append/prepend-only operations', () => {
            test.each([
                { op: 'append', size: 10000, transaction: { append: [10001, 10002, 10003] } },
                { op: 'prepend', size: 10000, transaction: { prepend: [-3, -2, -1] } },
                { op: 'both', size: 10000, transaction: { prepend: [-1], append: [10001] } },
            ])('$op: should not scan original data', ({ size, transaction }) => {
                const data = Array.from({ length: size }, (_, i) => i);
                const { dataSet, tracker } = createTrackedDataSet(data);

                dataSet.addTransaction(transaction);
                dataSet.getChangeDescription();

                // Building change description should not read original data
                expect(tracker.reads).toBe(0);

                tracker.reset();
                dataSet.commitPendingTransactions();

                // Should use batch operations
                expect(tracker.splices).toBeLessThanOrEqual(2);
            });
        });

        describe('removal optimizations', () => {
            test.each([
                {
                    name: 'remove recently appended items',
                    size: 10000,
                    setup: (ds: DataSet<number>) => ds.addTransaction({ append: [10001, 10002, 10003] }),
                    remove: [10002],
                    expectNoScan: true,
                },
                {
                    name: 'remove recently prepended items',
                    size: 10000,
                    setup: (ds: DataSet<number>) => ds.addTransaction({ prepend: [-3, -2, -1] }),
                    remove: [-2],
                    expectNoScan: true,
                },
            ])('$name: avoids scanning original data', ({ size, setup, remove, expectNoScan }) => {
                const data = Array.from({ length: size }, (_, i) => i);
                const { dataSet, tracker } = createTrackedDataSet(data);

                // Setup appends/prepends but DON'T commit yet
                setup(dataSet);

                // Now add removal transaction (removing from pending prepends/appends)
                dataSet.addTransaction({ remove });
                dataSet.getChangeDescription();

                // Verify change description was built without scanning original data
                if (expectNoScan) {
                    expect(tracker.reads).toBe(0);
                }

                tracker.reset();

                // Now commit all transactions
                dataSet.commitPendingTransactions();
                expect(tracker.splices).toBeLessThanOrEqual(3);
            });
        });

        describe('scale verification', () => {
            test('operations scale with changes, not data size', () => {
                const sizes = [1000, 10000, 100000];
                const results: { size: number; reads: number; splices: number }[] = [];

                for (const size of sizes) {
                    const data = Array.from({ length: size }, (_, i) => i);
                    const { dataSet, tracker } = createTrackedDataSet(data);

                    // Same operations regardless of size
                    dataSet.addTransaction({ append: [size + 1, size + 2] });
                    dataSet.addTransaction({ remove: [size + 1] });
                    dataSet.commitPendingTransactions();

                    results.push({
                        size,
                        reads: tracker.reads,
                        splices: tracker.splices,
                    });
                }

                // Operations should be constant regardless of data size
                const reads = results.map((r) => r.reads);
                const splices = results.map((r) => r.splices);

                // All read counts should be the same (or very close)
                expect(Math.max(...reads) - Math.min(...reads)).toBeLessThan(10);
                // All splice counts should be the same
                expect(new Set(splices).size).toBe(1);

                // Should be efficient
                expect(Math.max(...reads)).toBeLessThan(50);
                expect(Math.max(...splices)).toBeLessThanOrEqual(3);
            });

            test('mixed operations remain efficient at scale', () => {
                const size = 50000;
                // Use primitives to avoid object identity scan
                const data = Array.from({ length: size }, (_, i) => i);
                const { dataSet, tracker } = createTrackedDataSet(data);

                // Multiple transactions with mixed operations
                const obj1 = size + 1;
                const obj2 = size + 2;
                dataSet.addTransaction({ prepend: [-2, -1] });
                dataSet.addTransaction({ append: [obj1, obj2] });

                // Remove from recently added items (no scan needed) - before committing
                dataSet.addTransaction({ remove: [-1, obj1] });
                dataSet.getChangeDescription();

                // Building change description should not scan original data
                expect(tracker.reads).toBe(0);

                tracker.reset();

                // Commit should use efficient batch operations
                dataSet.commitPendingTransactions();
                expect(tracker.splices).toBeLessThanOrEqual(5);

                // Verify correctness
                expect(dataSet.data).toHaveLength(size + 2); // 50000 + 2prepends + 2appends - 2removes = 50002
            });
        });

        describe('early stopping verification', () => {
            test('stops scanning after finding all items in buildIndexMap', () => {
                const size = 10000;
                const data = Array.from({ length: size }, (_, i) => i);
                const { dataSet, tracker } = createTrackedDataSet(data);

                // Remove items near the beginning
                dataSet.addTransaction({ remove: [10, 20, 30] });

                // Build change description (this is where scanning happens)
                dataSet.getChangeDescription();

                // Should have scanned to find the items, stopping after finding all 3
                expect(tracker.reads).toBeLessThan(50); // Early stop around index 30
                expect(tracker.reads).toBeGreaterThan(25); // But scanned past 30

                tracker.reset();

                // Now commit (splice operations will cause additional reads)
                dataSet.commitPendingTransactions();

                // Verify correctness
                expect(dataSet.data).not.toContain(10);
                expect(dataSet.data).not.toContain(20);
                expect(dataSet.data).not.toContain(30);
                expect(dataSet.data).toHaveLength(size - 3);
            });
        });

        describe('object identity limitation', () => {
            test('object removal requires full scan (documented limitation)', () => {
                const size = 10000;
                const data = Array.from({ length: size }, (_, i) => ({ id: i }));
                const { dataSet, tracker } = createTrackedDataSet(data);

                // Try to remove with different object instance (won't match)
                dataSet.addTransaction({ remove: [{ id: 100 }] });
                dataSet.commitPendingTransactions();

                // Will scan entire array looking for the object
                expect(tracker.reads).toBe(size);

                // Verify item not removed (different object reference)
                expect(dataSet.data).toHaveLength(size);
            });

            test('same object reference avoids scan', () => {
                const size = 10000;
                const obj = { id: -1 };
                const data = Array.from({ length: size }, (_, i) => ({ id: i }));
                const { dataSet, tracker } = createTrackedDataSet(data);

                // Prepend and remove using SAME reference
                dataSet.addTransaction({ prepend: [obj] });
                tracker.reset();

                dataSet.addTransaction({ remove: [obj] });
                dataSet.commitPendingTransactions();

                // Should find in prepends, no scan needed
                expect(tracker.reads).toBe(0);
                expect(dataSet.data).toHaveLength(size);
            });
        });
    });

    describe('arbitrary insertions (addIndex support)', () => {
        describe('single insertion', () => {
            test('should insert at middle of array', () => {
                expectCommitResult({
                    initial: ['A', 'B', 'C', 'D', 'E'],
                    transactions: { add: ['X'], addIndex: 2 },
                    expected: ['A', 'B', 'X', 'C', 'D', 'E'],
                });
            });

            test('should insert at beginning (index 0)', () => {
                expectCommitResult({
                    initial: ['A', 'B', 'C'],
                    transactions: { add: ['X'], addIndex: 0 },
                    expected: ['X', 'A', 'B', 'C'],
                });
            });

            test('should append when index equals length', () => {
                expectCommitResult({
                    initial: ['A', 'B', 'C'],
                    transactions: { add: ['X'], addIndex: 3 },
                    expected: ['A', 'B', 'C', 'X'],
                });
            });

            test('should append when index exceeds length', () => {
                expectCommitResult({
                    initial: ['A', 'B', 'C'],
                    transactions: { add: ['X'], addIndex: 10 },
                    expected: ['A', 'B', 'C', 'X'],
                });
            });

            test('should insert multiple items at once', () => {
                expectCommitResult({
                    initial: ['A', 'B', 'C'],
                    transactions: { add: ['X', 'Y', 'Z'], addIndex: 1 },
                    expected: ['A', 'X', 'Y', 'Z', 'B', 'C'],
                });
            });
        });

        describe('multiple insertions across transactions', () => {
            test('should handle sequential insertions with index stability', () => {
                runCommitScenario({
                    initial: ['A', 'B', 'C', 'D', 'E'],
                    steps: [
                        {
                            transactions: [{ add: ['X'], addIndex: 2 }],
                            expected: ['A', 'B', 'X', 'C', 'D', 'E'],
                        },
                        {
                            // Index 4 is relative to current state ['A', 'B', 'X', 'C', 'D', 'E']
                            // So it inserts between 'C' and 'D'
                            transactions: [{ add: ['Y'], addIndex: 4 }],
                            expected: ['A', 'B', 'X', 'C', 'Y', 'D', 'E'],
                        },
                    ],
                });
            });

            test('should handle multiple insertions in same transaction', () => {
                runCommitScenario({
                    initial: ['A', 'B', 'C', 'D', 'E'],
                    steps: [
                        {
                            transactions: [
                                { add: ['X'], addIndex: 2 },
                                { add: ['Y'], addIndex: 4 },
                            ],
                            expected: ['A', 'B', 'X', 'C', 'Y', 'D', 'E'],
                        },
                    ],
                });
            });

            test('should handle insertion before earlier insertion', () => {
                runCommitScenario({
                    initial: ['A', 'B', 'C', 'D'],
                    steps: [
                        {
                            transactions: [{ add: ['X'], addIndex: 3 }],
                            expected: ['A', 'B', 'C', 'X', 'D'],
                        },
                        {
                            // Insert before X (at index 1)
                            transactions: [{ add: ['Y'], addIndex: 1 }],
                            expected: ['A', 'Y', 'B', 'C', 'X', 'D'],
                        },
                    ],
                });
            });
        });

        describe('insertions with removals', () => {
            test('should insert and remove in same transaction', () => {
                const initial = ['A', 'B', 'C', 'D', 'E'];
                expectCommitResult({
                    initial,
                    transactions: {
                        add: ['X'],
                        addIndex: 2,
                        remove: [initial[1]], // Remove 'B'
                    },
                    expected: ['A', 'X', 'C', 'D', 'E'],
                });
            });

            test('should handle inserting and removing same item in single transaction', () => {
                const initial = ['A', 'B', 'C'];
                const newItem = 'X';
                expectCommitResult({
                    initial,
                    transactions: {
                        add: [newItem],
                        addIndex: 1,
                        remove: [newItem],
                    },
                    expected: ['A', 'B', 'C'], // Item should not appear
                });
            });

            test('should handle multiple inserts then remove all in single transaction', () => {
                const initial = ['A', 'B'];
                const items = ['X', 'Y', 'Z'];
                expectCommitResult({
                    initial,
                    transactions: {
                        add: items,
                        addIndex: 1,
                        remove: items,
                    },
                    expected: ['A', 'B'], // Items should not appear
                });
            });

            test('should handle partial removal of inserted items', () => {
                const initial = ['A', 'B'];
                const items = ['X', 'Y', 'Z'];
                expectCommitResult({
                    initial,
                    transactions: {
                        add: items,
                        addIndex: 1,
                        remove: ['Y'], // Remove only 'Y'
                    },
                    expected: ['A', 'X', 'Z', 'B'], // Only X and Z should appear
                });
            });

            test('should handle removal before insertion index', () => {
                const initial = ['A', 'B', 'C', 'D', 'E'];
                runCommitScenario({
                    initial,
                    steps: [
                        {
                            transactions: [{ remove: [initial[1]] }], // Remove 'B'
                            expected: ['A', 'C', 'D', 'E'],
                        },
                        {
                            // Index 2 is relative to ['A', 'C', 'D', 'E']
                            transactions: [{ add: ['X'], addIndex: 2 }],
                            expected: ['A', 'C', 'X', 'D', 'E'],
                        },
                    ],
                });
            });

            test('should handle removal after insertion', () => {
                const initial = ['A', 'B', 'C', 'D', 'E'];
                runCommitScenario({
                    initial,
                    steps: [
                        {
                            transactions: [{ add: ['X'], addIndex: 2 }],
                            expected: ['A', 'B', 'X', 'C', 'D', 'E'],
                        },
                        {
                            transactions: [{ remove: [initial[3]] }], // Remove original 'D'
                            expected: ['A', 'B', 'X', 'C', 'E'],
                        },
                    ],
                });
            });
        });

        describe('insertions with prepends and appends', () => {
            test('should handle insertion after prepend', () => {
                runCommitScenario({
                    initial: ['A', 'B', 'C'],
                    steps: [
                        {
                            transactions: [{ add: ['X'], addIndex: 0 }],
                            expected: ['X', 'A', 'B', 'C'],
                        },
                        {
                            // Index 2 is relative to ['X', 'A', 'B', 'C']
                            transactions: [{ add: ['Y'], addIndex: 2 }],
                            expected: ['X', 'A', 'Y', 'B', 'C'],
                        },
                    ],
                });
            });

            test('should handle insertion before append', () => {
                runCommitScenario({
                    initial: ['A', 'B', 'C'],
                    steps: [
                        {
                            transactions: [
                                { add: ['X'], addIndex: 1 },
                                { add: ['Y'], addIndex: 10 }, // Append
                            ],
                            expected: ['A', 'X', 'B', 'C', 'Y'],
                        },
                    ],
                });
            });

            test('should handle complex mixed operations', () => {
                const initial = ['A', 'B', 'C', 'D'];
                runCommitScenario({
                    initial,
                    steps: [
                        {
                            transactions: [
                                { add: ['P'], addIndex: 0 }, // Prepend
                                { add: ['M'], addIndex: 3 }, // Middle insert
                                { add: ['Q'], addIndex: 100 }, // Append
                                { remove: [initial[1]] }, // Remove 'B'
                            ],
                            expected: ['P', 'A', 'M', 'C', 'D', 'Q'],
                        },
                    ],
                });
            });
        });

        describe('edge cases', () => {
            test('should handle insertion into empty array', () => {
                expectCommitResult({
                    initial: [],
                    transactions: { add: ['X'], addIndex: 0 },
                    expected: ['X'],
                });
            });

            test('should handle insertion at index 1 of single-element array', () => {
                expectCommitResult({
                    initial: ['A'],
                    transactions: { add: ['X'], addIndex: 1 },
                    expected: ['A', 'X'],
                });
            });

            test('should handle removing inserted item', () => {
                const initial = ['A', 'B', 'C'];
                const newItem = 'X';
                runCommitScenario({
                    initial,
                    steps: [
                        {
                            transactions: [{ add: [newItem], addIndex: 1 }],
                            expected: ['A', 'X', 'B', 'C'],
                        },
                        {
                            transactions: [{ remove: [newItem] }],
                            expected: ['A', 'B', 'C'],
                        },
                    ],
                });
            });

            test('should handle multiple insertions at same index', () => {
                runCommitScenario({
                    initial: ['A', 'B', 'C'],
                    steps: [
                        {
                            transactions: [
                                { add: ['X'], addIndex: 1 },
                                { add: ['Y'], addIndex: 2 }, // Now inserts after X
                            ],
                            expected: ['A', 'X', 'Y', 'B', 'C'],
                        },
                    ],
                });
            });

            test('should handle two insertions at exact same index in single commit', () => {
                expectCommitResult({
                    initial: ['A', 'B', 'C'],
                    transactions: [
                        { add: ['X'], addIndex: 1 },
                        { add: ['Y'], addIndex: 1 }, // Same index as X
                    ],
                    expected: ['A', 'Y', 'X', 'B', 'C'], // Y should come before X
                });
            });

            test('should handle three insertions at exact same index', () => {
                expectCommitResult({
                    initial: ['A', 'B'],
                    transactions: [
                        { add: ['X'], addIndex: 1 },
                        { add: ['Y'], addIndex: 1 },
                        { add: ['Z'], addIndex: 1 },
                    ],
                    expected: ['A', 'Z', 'Y', 'X', 'B'], // Z, Y, X in that order
                });
            });

            test('should handle multiple multi-item insertions at same index', () => {
                expectCommitResult({
                    initial: ['A', 'B'],
                    transactions: [
                        { add: ['X1', 'X2'], addIndex: 1 },
                        { add: ['Y1', 'Y2'], addIndex: 1 },
                    ],
                    expected: ['A', 'Y1', 'Y2', 'X1', 'X2', 'B'],
                });
            });
        });

        describe('virtual index adjustment when removing earlier insertions', () => {
            test('removing earlier insertion adjusts later insertion virtualIndex', () => {
                const x = { id: 'x' };
                const y = { id: 'y' };
                expectCommitResult({
                    initial: ['A', 'B', 'C', 'D'],
                    transactions: [
                        { add: [x], addIndex: 1 },
                        { add: [y], addIndex: 3, remove: [x] },
                    ],
                    expected: ['A', 'B', y, 'C', 'D'],
                });
            });

            test('removing multiple items from earlier insertion', () => {
                const items1 = ['X', 'Y', 'Z'];
                const item2 = 'A';
                expectCommitResult({
                    initial: ['1', '2', '3', '4'],
                    transactions: [
                        { add: items1, addIndex: 1 },
                        { add: [item2], addIndex: 5, remove: ['X', 'Y'] },
                    ],
                    // After tx1: ['1', 'X', 'Y', 'Z', '2', '3', '4']
                    // After remove X,Y: ['1', 'Z', '2', '3', '4']
                    // Add A at adjusted index 3: ['1', 'Z', '2', 'A', '3', '4']
                    expected: ['1', 'Z', '2', item2, '3', '4'],
                });
            });

            test('removing entire earlier insertion', () => {
                const x = { id: 'x' };
                const y = { id: 'y' };
                expectCommitResult({
                    initial: ['A', 'B', 'C'],
                    transactions: [
                        { add: [x], addIndex: 1 },
                        { add: [y], addIndex: 3, remove: [x] },
                    ],
                    expected: ['A', 'B', y, 'C'],
                });
            });

            test('removing from middle insertion adjusts only later ones', () => {
                const x = 'X';
                const y = 'Y';
                const z = 'Z';
                expectCommitResult({
                    initial: ['A', 'B', 'C', 'D', 'E'],
                    transactions: [
                        { add: [x], addIndex: 1 },
                        { add: [y], addIndex: 3 },
                        { add: [z], addIndex: 5 },
                        { remove: [y] },
                    ],
                    // After insertions: ['A', 'X', 'B', 'Y', 'C', 'Z', 'D', 'E']
                    // After removing Y: ['A', 'X', 'B', 'C', 'Z', 'D', 'E']
                    expected: ['A', x, 'B', 'C', z, 'D', 'E'],
                });
            });

            test('removing from multiple insertions in sequence', () => {
                const x = 'X';
                const y = 'Y';
                const z = 'Z';
                expectCommitResult({
                    initial: ['A', 'B', 'C'],
                    transactions: [
                        { add: [x], addIndex: 1 },
                        { add: [y], addIndex: 3 },
                        { add: [z], addIndex: 5, remove: [x, y] },
                    ],
                    // After tx1: ['A', 'X', 'B', 'C']
                    // After tx2: ['A', 'X', 'B', 'Y', 'C']
                    // After remove X,Y: ['A', 'B', 'C']
                    // Add Z at adjusted index 3: ['A', 'B', 'C', 'Z']
                    expected: ['A', 'B', 'C', z],
                });
            });

            test('removing earlier insertion with original data removal', () => {
                const initial = ['A', 'B', 'C', 'D', 'E'];
                const x = 'X';
                const y = 'Y';
                expectCommitResult({
                    initial,
                    transactions: [
                        { add: [x], addIndex: 1 },
                        { add: [y], addIndex: 4, remove: [x, initial[2]] }, // Remove 'C' and 'X'
                    ],
                    // After tx1: ['A', 'X', 'B', 'C', 'D', 'E']
                    // After remove X and 'C': ['A', 'B', 'D', 'E']
                    // Add Y at adjusted index 2: ['A', 'B', 'Y', 'D', 'E']
                    expected: ['A', 'B', y, 'D', 'E'],
                });
            });

            test('complex scenario with prepends, insertions, and removals', () => {
                const initial = ['B', 'C', 'D'];
                const x = 'X';
                const y = 'Y';
                expectCommitResult({
                    initial,
                    transactions: [
                        { add: ['A'], addIndex: 0 }, // This becomes a prepend
                        { add: [x], addIndex: 2 },
                        { add: [y], addIndex: 4, remove: [x] },
                    ],
                    // After prepend: ['A', 'B', 'C', 'D']
                    // After add X: ['A', 'B', 'X', 'C', 'D']
                    // After remove X: ['A', 'B', 'C', 'D']
                    // Add Y at adjusted index 3: ['A', 'B', 'C', 'Y', 'D']
                    expected: ['A', 'B', 'C', y, 'D'],
                });
            });
        });
    });
});
