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
            expect(descAfter).toBeDefined(); // Cleared after next update.

            dataSet.addTransaction({ append: [5] });
            const descAfter2 = dataSet.getChangeDescription();
            expect(descAfter2).toBeDefined();
            expect(descAfter).not.toBe(descAfter2);
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
});
