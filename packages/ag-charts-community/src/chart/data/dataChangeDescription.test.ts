import { DataSet } from './dataSet';

describe('DataChangeDescription', () => {
    describe('spliceOps optimization using DataSet', () => {
        describe('consecutive deletions', () => {
            it('should merge 100 consecutive deletions into 1 splice operation', () => {
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

            it('should merge consecutive deletions at the start', () => {
                const initialData = Array.from({ length: 20 }, (_, i) => ({ value: i }));
                const dataSet = new DataSet(initialData);

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
                const dataSet = new DataSet(initialData);

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
                const dataSet = new DataSet(initialData);

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

            it('should handle single deletions between consecutive groups', () => {
                const initialData = Array.from({ length: 20 }, (_, i) => ({ value: i }));
                const dataSet = new DataSet(initialData);

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
                const dataSet = new DataSet(initialData);

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
                const dataSet = new DataSet(initialData);

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
                const dataSet = new DataSet(initialData);

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
                const dataSet = new DataSet(initialData);

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
});
