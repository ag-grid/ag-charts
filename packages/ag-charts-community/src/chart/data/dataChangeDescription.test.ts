import { testLogger } from 'ag-charts-test';

import { DataSet } from './dataSet';

describe('DataChangeDescription', () => {
    describe('spliceOps optimization using DataSet', () => {
        describe('consecutive deletions', () => {
            it('should merge 100 consecutive deletions into 1 splice operation', () => {
                // Create initial data with 200 items
                const initialData = Array.from({ length: 200 }, (_, i) => ({ value: i }));
                const dataSet = new DataSet(initialData, testLogger);

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

            it('should merge consecutive deletions at the start', () => {
                const initialData = Array.from({ length: 20 }, (_, i) => ({ value: i }));
                const dataSet = new DataSet(initialData, testLogger);

                // Remove first 5 items
                const itemsToRemove = initialData.slice(0, 5);

                dataSet.addTransaction({ remove: itemsToRemove });
                const changeDescription = dataSet.getChangeDescription();
                if (!changeDescription) {
                    throw new Error('Expected changeDescription to be defined');
                }

                const removeSpliceOps = changeDescription.indexMap.spliceOps.filter(
                    (op) => op.deleteCount > 0 && op.insertCount === 0
                );

                expect(removeSpliceOps).toHaveLength(1);
                expect(removeSpliceOps[0]).toEqual({
                    index: 0,
                    deleteCount: 5,
                    insertCount: 0,
                });
            });

            it('should merge consecutive deletions at the end', () => {
                const initialData = Array.from({ length: 20 }, (_, i) => ({ value: i }));
                const dataSet = new DataSet(initialData, testLogger);

                // Remove last 5 items
                const itemsToRemove = initialData.slice(15, 20);

                dataSet.addTransaction({ remove: itemsToRemove });
                const changeDescription = dataSet.getChangeDescription();
                if (!changeDescription) {
                    throw new Error('Expected changeDescription to be defined');
                }

                const removeSpliceOps = changeDescription.indexMap.spliceOps.filter(
                    (op) => op.deleteCount > 0 && op.insertCount === 0
                );

                expect(removeSpliceOps).toHaveLength(1);
                expect(removeSpliceOps[0]).toEqual({
                    index: 15,
                    deleteCount: 5,
                    insertCount: 0,
                });
            });

            it('should handle consecutive deletions with prepends', () => {
                const initialData = Array.from({ length: 20 }, (_, i) => ({ value: i }));
                const dataSet = new DataSet(initialData, testLogger);

                // Remove indices 5-9
                const itemsToRemove = initialData.slice(5, 10);

                // Prepend and remove in same transaction
                dataSet.addTransaction({
                    prepend: [{ value: -3 }, { value: -2 }, { value: -1 }],
                    remove: itemsToRemove,
                });

                const changeDescription = dataSet.getChangeDescription();
                if (!changeDescription) {
                    throw new Error('Expected changeDescription to be defined');
                }

                // Should have prepend operation and delete operation
                const prependOps = changeDescription.indexMap.spliceOps.filter(
                    (op) => op.deleteCount === 0 && op.insertCount > 0
                );
                const removeSpliceOps = changeDescription.indexMap.spliceOps.filter(
                    (op) => op.deleteCount > 0 && op.insertCount === 0
                );

                expect(prependOps).toHaveLength(1);
                expect(prependOps[0]).toEqual({
                    index: 0,
                    deleteCount: 0,
                    insertCount: 3,
                });

                expect(removeSpliceOps).toHaveLength(1);
                expect(removeSpliceOps[0]).toEqual({
                    index: 8, // 5 + 3 prepended items
                    deleteCount: 5,
                    insertCount: 0,
                });
            });
        });

        describe('non-consecutive deletions', () => {
            it('should create separate operations for non-consecutive groups', () => {
                const initialData = Array.from({ length: 20 }, (_, i) => ({ value: i }));
                const dataSet = new DataSet(initialData, testLogger);

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

            it('should handle single deletions between consecutive groups', () => {
                const initialData = Array.from({ length: 20 }, (_, i) => ({ value: i }));
                const dataSet = new DataSet(initialData, testLogger);

                // Remove groups: 1-3, 5 (single), 7-9
                const itemsToRemove = [...initialData.slice(1, 4), initialData[5], ...initialData.slice(7, 10)];

                dataSet.addTransaction({ remove: itemsToRemove });
                const changeDescription = dataSet.getChangeDescription();
                if (!changeDescription) {
                    throw new Error('Expected changeDescription to be defined');
                }

                const removeSpliceOps = changeDescription.indexMap.spliceOps.filter(
                    (op) => op.deleteCount > 0 && op.insertCount === 0
                );

                // Should have 3 splice operations
                expect(removeSpliceOps).toHaveLength(3);

                // Operations should be in descending order
                expect(removeSpliceOps[0]).toEqual({
                    index: 7,
                    deleteCount: 3,
                    insertCount: 0,
                });
                expect(removeSpliceOps[1]).toEqual({
                    index: 5,
                    deleteCount: 1,
                    insertCount: 0,
                });
                expect(removeSpliceOps[2]).toEqual({
                    index: 1,
                    deleteCount: 3,
                    insertCount: 0,
                });
            });
        });

        describe('edge cases', () => {
            it('should handle single deletion', () => {
                const initialData = Array.from({ length: 20 }, (_, i) => ({ value: i }));
                const dataSet = new DataSet(initialData, testLogger);

                // Remove single item at index 5
                const itemsToRemove = [initialData[5]];

                dataSet.addTransaction({ remove: itemsToRemove });
                const changeDescription = dataSet.getChangeDescription();
                if (!changeDescription) {
                    throw new Error('Expected changeDescription to be defined');
                }

                const removeSpliceOps = changeDescription.indexMap.spliceOps.filter(
                    (op) => op.deleteCount > 0 && op.insertCount === 0
                );

                expect(removeSpliceOps).toHaveLength(1);
                expect(removeSpliceOps[0]).toEqual({
                    index: 5,
                    deleteCount: 1,
                    insertCount: 0,
                });
            });

            it('should handle all indices removed', () => {
                const initialData = Array.from({ length: 10 }, (_, i) => ({ value: i }));
                const dataSet = new DataSet(initialData, testLogger);

                // Remove all items
                dataSet.addTransaction({ remove: initialData });
                const changeDescription = dataSet.getChangeDescription();
                if (!changeDescription) {
                    throw new Error('Expected changeDescription to be defined');
                }

                const removeSpliceOps = changeDescription.indexMap.spliceOps.filter(
                    (op) => op.deleteCount > 0 && op.insertCount === 0
                );

                expect(removeSpliceOps).toHaveLength(1);
                expect(removeSpliceOps[0]).toEqual({
                    index: 0,
                    deleteCount: 10,
                    insertCount: 0,
                });
            });
        });

        describe('array transformation', () => {
            it('should correctly apply optimized splice operations', () => {
                const initialData = Array.from({ length: 10 }, (_, i) => ({ value: i }));
                const dataSet = new DataSet(initialData, testLogger);

                // Remove indices 2-4 and 7-8 (non-consecutive)
                const itemsToRemove = [...initialData.slice(2, 5), ...initialData.slice(7, 9)];

                dataSet.addTransaction({ remove: itemsToRemove });
                const changeDescription = dataSet.getChangeDescription();
                if (!changeDescription) {
                    throw new Error('Expected changeDescription to be defined');
                }

                const array = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
                changeDescription.applyToArray(array, () => -1); // Shouldn't insert anything

                expect(array).toEqual([0, 1, 5, 6, 9]);
            });

            it('should handle complex transformation with prepends and appends', () => {
                const initialData: any[] = Array.from({ length: 5 }, (_, i) => ({ value: i }));
                const dataSet = new DataSet(initialData, testLogger);

                // Remove indices 1-2
                const itemsToRemove = initialData.slice(1, 3);

                dataSet.addTransaction({
                    prepend: [{ value: 'P1' }, { value: 'P2' }],
                    remove: itemsToRemove,
                    append: [{ value: 'A1' }],
                });

                const changeDescription = dataSet.getChangeDescription();
                if (!changeDescription) {
                    throw new Error('Expected changeDescription to be defined');
                }

                const array = ['a', 'b', 'c', 'd', 'e'];
                let insertIndex = 0;
                const insertValues = ['P1', 'P2', 'A1'];
                changeDescription.applyToArray(array, () => insertValues[insertIndex++]);

                expect(array).toEqual(['P1', 'P2', 'a', 'd', 'e', 'A1']);
            });
        });
    });

    describe('applyToTypedArray', () => {
        it('should handle rolling window (remove head + append tail)', () => {
            const data = Array.from({ length: 10 }, (_, i) => ({ value: i }));
            const ds = new DataSet(data, testLogger);

            // Remove first 3, append 3 new
            ds.addTransaction({ remove: data.slice(0, 3), append: [{ value: 10 }, { value: 11 }, { value: 12 }] });
            const desc = ds.getChangeDescription()!;

            // Selection: indices 1, 4, 7 are selected
            const sel = new Uint8Array(10);
            sel[1] = 1;
            sel[4] = 1;
            sel[7] = 1;

            const result = desc.applyToTypedArray(sel);

            // After removing 0,1,2: old 3->0, old 4->1, old 5->2, old 6->3, old 7->4, old 8->5, old 9->6
            // Appended 3 new at indices 7,8,9 (default 0)
            expect(result.length).toBe(10);
            expect(result[1]).toBe(1); // old idx 4 -> new idx 1
            expect(result[4]).toBe(1); // old idx 7 -> new idx 4
            expect(result[0]).toBe(0); // old idx 3 was not selected
            expect(result[7]).toBe(0); // appended, default
        });

        it('should handle append-only', () => {
            const data = [{ value: 0 }, { value: 1 }];
            const ds = new DataSet(data, testLogger);
            ds.addTransaction({ append: [{ value: 2 }] });
            const desc = ds.getChangeDescription()!;

            const sel = new Uint8Array(2);
            sel[0] = 1;
            sel[1] = 1;

            const result = desc.applyToTypedArray(sel);
            expect(result.length).toBe(3);
            expect(Array.from(result)).toEqual([1, 1, 0]);
        });

        it('should handle prepend-only', () => {
            const data = [{ value: 0 }, { value: 1 }];
            const ds = new DataSet(data, testLogger);
            ds.addTransaction({ prepend: [{ value: -1 }] });
            const desc = ds.getChangeDescription()!;

            const sel = new Uint8Array(2);
            sel[1] = 1;

            const result = desc.applyToTypedArray(sel);
            expect(result.length).toBe(3);
            expect(Array.from(result)).toEqual([0, 0, 1]); // old idx 1 -> new idx 2
        });

        it('should handle single removal', () => {
            const data = [{ value: 0 }, { value: 1 }, { value: 2 }, { value: 3 }];
            const ds = new DataSet(data, testLogger);
            ds.addTransaction({ remove: [data[1]] });
            const desc = ds.getChangeDescription()!;

            const sel = new Uint8Array(4);
            sel[0] = 1;
            sel[2] = 1;

            const result = desc.applyToTypedArray(sel);
            expect(result.length).toBe(3);
            expect(Array.from(result)).toEqual([1, 1, 0]); // old 0->0, old 2->1, old 3->2
        });

        it('should handle no-op (no changes)', () => {
            const data = [{ value: 0 }];
            const ds = new DataSet(data, testLogger);
            ds.addTransaction({}); // Empty transaction

            const desc = ds.getChangeDescription()!;
            const sel = new Uint8Array(1);
            sel[0] = 1;
            const result = desc.applyToTypedArray(sel);
            expect(Array.from(result)).toEqual([1]);
        });

        it('should handle full removal', () => {
            const data = [{ value: 0 }, { value: 1 }, { value: 2 }];
            const ds = new DataSet(data, testLogger);
            ds.addTransaction({ remove: [...data] });
            const desc = ds.getChangeDescription()!;

            const sel = new Uint8Array(3);
            sel.fill(1);

            const result = desc.applyToTypedArray(sel);
            expect(result.length).toBe(0);
        });

        it('should handle prepend + removals + append', () => {
            const data = [{ value: 0 }, { value: 1 }, { value: 2 }, { value: 3 }, { value: 4 }];
            const ds = new DataSet(data, testLogger);

            ds.addTransaction({
                prepend: [{ value: -2 }, { value: -1 }],
                remove: [data[1], data[3]],
                append: [{ value: 5 }],
            });
            const desc = ds.getChangeDescription()!;

            // Selected: indices 0, 2, 4
            const sel = new Uint8Array(5);
            sel[0] = 1;
            sel[2] = 1;
            sel[4] = 1;

            const result = desc.applyToTypedArray(sel);
            // After: [-2, -1, 0, 2, 4, 5] (6 items)
            // Old 0 -> new 2, old 2 -> new 3, old 4 -> new 4
            expect(result.length).toBe(6);
            expect(result[0]).toBe(0); // prepended
            expect(result[1]).toBe(0); // prepended
            expect(result[2]).toBe(1); // old idx 0
            expect(result[3]).toBe(1); // old idx 2
            expect(result[4]).toBe(1); // old idx 4
            expect(result[5]).toBe(0); // appended
        });

        it('should handle mid-array insertion with removals (slow path)', () => {
            const data = Array.from({ length: 10 }, (_, i) => ({ id: i, value: i }));
            const ds = new DataSet(data, testLogger, 'id');

            // After: [0, 1, 3, 4, X, X, X, 5, 6, 7, 8, 9] (12 items)
            ds.addTransaction({
                remove: [data[2]],
                insertions: [
                    {
                        index: 5,
                        items: [
                            { id: 100, value: 100 },
                            { id: 101, value: 101 },
                            { id: 102, value: 102 },
                        ],
                    },
                ],
            });
            const desc = ds.getChangeDescription()!;

            // Selected: indices 0, 3, 7
            const sel = new Uint8Array(10);
            sel[0] = 1;
            sel[3] = 1;
            sel[7] = 1;

            const result = desc.applyToTypedArray(sel);

            // Verify via applyToArray as reference
            const refArray = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
            desc.applyToArray(refArray, () => -1);
            // refArray shows the structure: [0, 1, 3, 4, -1, -1, -1, 5, 6, 7, 8, 9]

            expect(result.length).toBe(refArray.length);

            expect(result[0]).toBe(1); // old idx 0 → value 0
            expect(result[2]).toBe(1); // old idx 3 → value 3 (shifted by removal of idx 2)
            expect(result[9]).toBe(1); // old idx 7 → value 7 (shifted by removal + 3 insertions)

            // Inserted positions should be 0
            expect(result[4]).toBe(0);
            expect(result[5]).toBe(0);
            expect(result[6]).toBe(0);
        });

        it('should support custom default value', () => {
            const data = [{ value: 0 }, { value: 1 }];
            const ds = new DataSet(data, testLogger);
            ds.addTransaction({ append: [{ value: 2 }] });
            const desc = ds.getChangeDescription()!;

            const sel = new Uint8Array(2);
            sel[0] = 1;

            const result = desc.applyToTypedArray(sel, 1);
            expect(result.length).toBe(3);
            expect(result[0]).toBe(1); // preserved
            expect(result[1]).toBe(0); // preserved (was 0)
            expect(result[2]).toBe(1); // appended with default=1
        });
    });
});
