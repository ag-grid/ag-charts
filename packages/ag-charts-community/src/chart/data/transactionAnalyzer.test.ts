import { describe, expect, it } from '@jest/globals';

import type { AgDataTransaction } from 'ag-charts-types';

import { DataRef } from './dataRef';
import { TransactionAnalyzer } from './transactionAnalyzer';

describe('TransactionAnalyzer', () => {
    // Helper function to create test data
    const createTestData = () => [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' },
        { id: 3, name: 'Item 3' },
        { id: 4, name: 'Item 4' },
        { id: 5, name: 'Item 5' },
    ];

    describe('Multi-source vs Single-source scenarios', () => {
        it('should return undefined for multi-source scenarios', () => {
            const data = createTestData();
            const dataRef = new DataRef(data, []);
            const sources = new Map([
                ['source1', [{ a: 1 }]],
                ['source2', [{ b: 2 }]],
            ]);

            const result = TransactionAnalyzer.analyze(dataRef, sources);

            expect(result).toBeUndefined();
        });

        it('should process single-source scenarios', () => {
            const data = createTestData();
            const dataRef = new DataRef(data, []);
            const sources = new Map([['source1', data]]);

            const result = TransactionAnalyzer.analyze(dataRef, sources);

            expect(result).toBeDefined();
            expect(result?.metadata.totalRemoved).toBe(0);
            expect(result?.metadata.totalInserted).toBe(0);
            expect(result?.metadata.totalUpdated).toBe(0);
            expect(result?.metadata.netSizeChange).toBe(0);
        });

        it('should handle empty sources map', () => {
            const data = createTestData();
            const dataRef = new DataRef(data, []);
            const sources = new Map();

            const result = TransactionAnalyzer.analyze(dataRef, sources);

            expect(result).toBeDefined();
            expect(result?.metadata.netSizeChange).toBe(0);
        });
    });

    describe('Empty transactions', () => {
        it('should handle no pending transactions', () => {
            const data = createTestData();
            const dataRef = new DataRef(data, []);
            const sources = new Map([['source1', data]]);

            const result = TransactionAnalyzer.analyze(dataRef, sources);

            expect(result).toBeDefined();
            expect(result?.removed).toEqual([]);
            expect(result?.inserted).toEqual([]);
            expect(result?.updated).toEqual([]);
            expect(result?.indexShiftRanges).toEqual([]);
            expect(result?.metadata).toEqual({
                totalRemoved: 0,
                totalInserted: 0,
                totalUpdated: 0,
                netSizeChange: 0,
            });
        });

        it('should handle empty transaction objects', () => {
            const data = createTestData();
            const emptyTransaction: AgDataTransaction = {};
            const dataRef = new DataRef(data, [emptyTransaction]);
            const sources = new Map([['source1', data]]);

            const result = TransactionAnalyzer.analyze(dataRef, sources);

            expect(result).toBeDefined();
            expect(result?.metadata.netSizeChange).toBe(0);
        });
    });

    describe('Prepend operations', () => {
        it('should handle single prepend operation', () => {
            const data = createTestData();
            const newItem = { id: 0, name: 'New Item' };
            const transaction: AgDataTransaction = {
                prepend: [newItem],
            };
            const dataRef = new DataRef(data, [transaction]);
            const sources = new Map([['source1', data]]);

            const result = TransactionAnalyzer.analyze(dataRef, sources);

            expect(result).toBeDefined();
            expect(result?.inserted).toEqual([{ index: 0, datum: newItem }]);
            expect(result?.removed).toEqual([]);
            expect(result?.updated).toEqual([]);
            expect(result?.metadata.totalInserted).toBe(1);
            expect(result?.metadata.netSizeChange).toBe(1);
        });

        it('should handle multiple prepend items', () => {
            const data = createTestData();
            const newItems = [
                { id: -1, name: 'New Item 1' },
                { id: -2, name: 'New Item 2' },
            ];
            const transaction: AgDataTransaction = {
                prepend: newItems,
            };
            const dataRef = new DataRef(data, [transaction]);
            const sources = new Map([['source1', data]]);

            const result = TransactionAnalyzer.analyze(dataRef, sources);

            expect(result).toBeDefined();
            // Items should be inserted in reverse order to maintain prepend array order
            expect(result?.inserted).toEqual([
                { index: 0, datum: newItems[1] },
                { index: 0, datum: newItems[0] },
            ]);
            expect(result?.metadata.totalInserted).toBe(2);
            expect(result?.metadata.netSizeChange).toBe(2);
        });

        it('should handle empty prepend array', () => {
            const data = createTestData();
            const transaction: AgDataTransaction = {
                prepend: [],
            };
            const dataRef = new DataRef(data, [transaction]);
            const sources = new Map([['source1', data]]);

            const result = TransactionAnalyzer.analyze(dataRef, sources);

            expect(result).toBeDefined();
            expect(result?.inserted).toEqual([]);
            expect(result?.metadata.netSizeChange).toBe(0);
        });
    });

    describe('Append operations', () => {
        it('should handle single append operation', () => {
            const data = createTestData();
            const newItem = { id: 6, name: 'New Item' };
            const transaction: AgDataTransaction = {
                append: [newItem],
            };
            const dataRef = new DataRef(data, [transaction]);
            const sources = new Map([['source1', data]]);

            const result = TransactionAnalyzer.analyze(dataRef, sources);

            expect(result).toBeDefined();
            expect(result?.inserted).toEqual([{ index: 5, datum: newItem }]);
            expect(result?.removed).toEqual([]);
            expect(result?.updated).toEqual([]);
            expect(result?.metadata.totalInserted).toBe(1);
            expect(result?.metadata.netSizeChange).toBe(1);
        });

        it('should handle multiple append items', () => {
            const data = createTestData();
            const newItems = [
                { id: 6, name: 'New Item 1' },
                { id: 7, name: 'New Item 2' },
            ];
            const transaction: AgDataTransaction = {
                append: newItems,
            };
            const dataRef = new DataRef(data, [transaction]);
            const sources = new Map([['source1', data]]);

            const result = TransactionAnalyzer.analyze(dataRef, sources);

            expect(result).toBeDefined();
            expect(result?.inserted).toEqual([
                { index: 5, datum: newItems[0] },
                { index: 6, datum: newItems[1] },
            ]);
            expect(result?.metadata.totalInserted).toBe(2);
            expect(result?.metadata.netSizeChange).toBe(2);
        });

        it('should handle append to empty data', () => {
            const data: any[] = [];
            const newItem = { id: 1, name: 'First Item' };
            const transaction: AgDataTransaction = {
                append: [newItem],
            };
            const dataRef = new DataRef(data, [transaction]);
            const sources = new Map([['source1', data]]);

            const result = TransactionAnalyzer.analyze(dataRef, sources);

            expect(result).toBeDefined();
            expect(result?.inserted).toEqual([{ index: 0, datum: newItem }]);
            expect(result?.metadata.netSizeChange).toBe(1);
        });
    });

    describe('Remove operations', () => {
        it('should handle single remove operation by object identity', () => {
            const data = createTestData();
            const itemToRemove = data[2]; // Item 3
            const transaction: AgDataTransaction = {
                remove: [itemToRemove],
            };
            const dataRef = new DataRef(data, [transaction]);
            const sources = new Map([['source1', data]]);

            const result = TransactionAnalyzer.analyze(dataRef, sources);

            expect(result).toBeDefined();
            expect(result?.removed).toEqual([{ index: 2, datum: itemToRemove }]);
            expect(result?.inserted).toEqual([]);
            expect(result?.updated).toEqual([]);
            expect(result?.metadata.totalRemoved).toBe(1);
            expect(result?.metadata.netSizeChange).toBe(-1);
        });

        it('should handle multiple remove operations', () => {
            const data = createTestData();
            const itemsToRemove = [data[1], data[3]]; // Items 2 and 4
            const transaction: AgDataTransaction = {
                remove: itemsToRemove,
            };
            const dataRef = new DataRef(data, [transaction]);
            const sources = new Map([['source1', data]]);

            const result = TransactionAnalyzer.analyze(dataRef, sources);

            expect(result).toBeDefined();
            // Should be sorted by index
            expect(result?.removed).toEqual([
                { index: 1, datum: itemsToRemove[0] },
                { index: 3, datum: itemsToRemove[1] },
            ]);
            expect(result?.metadata.totalRemoved).toBe(2);
            expect(result?.metadata.netSizeChange).toBe(-2);
        });

        it('should handle removing item not found in data', () => {
            const data = createTestData();
            const nonExistentItem = { id: 999, name: 'Non-existent' };
            const transaction: AgDataTransaction = {
                remove: [nonExistentItem],
            };
            const dataRef = new DataRef(data, [transaction]);
            const sources = new Map([['source1', data]]);

            const result = TransactionAnalyzer.analyze(dataRef, sources);

            expect(result).toBeDefined();
            expect(result?.removed).toEqual([]);
            expect(result?.metadata.totalRemoved).toBe(0);
            expect(result?.metadata.netSizeChange).toBe(0);
        });

        it('should handle removing duplicate items', () => {
            const data = createTestData();
            const duplicateItem = { id: 999, name: 'Duplicate' };
            data.push(duplicateItem, duplicateItem); // Add same object twice

            const transaction: AgDataTransaction = {
                remove: [duplicateItem],
            };
            const dataRef = new DataRef(data, [transaction]);
            const sources = new Map([['source1', data]]);

            const result = TransactionAnalyzer.analyze(dataRef, sources);

            expect(result).toBeDefined();
            // Should remove both instances
            expect(result?.removed).toEqual([
                { index: 5, datum: duplicateItem },
                { index: 6, datum: duplicateItem },
            ]);
            expect(result?.metadata.totalRemoved).toBe(2);
            expect(result?.metadata.netSizeChange).toBe(-2);
        });

        it('should not remove similar objects that are not identical', () => {
            const data = createTestData();
            const similarItem = { id: 1, name: 'Item 1' }; // Same content as data[0] but different object
            const transaction: AgDataTransaction = {
                remove: [similarItem],
            };
            const dataRef = new DataRef(data, [transaction]);
            const sources = new Map([['source1', data]]);

            const result = TransactionAnalyzer.analyze(dataRef, sources);

            expect(result).toBeDefined();
            expect(result?.removed).toEqual([]); // No removal because object identity doesn't match
            expect(result?.metadata.totalRemoved).toBe(0);
        });
    });

    describe('Mixed operation combinations', () => {
        it('should handle prepend + append in same transaction', () => {
            const data = createTestData();
            const prependItem = { id: 0, name: 'Prepend Item' };
            const appendItem = { id: 6, name: 'Append Item' };
            const transaction: AgDataTransaction = {
                prepend: [prependItem],
                append: [appendItem],
            };
            const dataRef = new DataRef(data, [transaction]);
            const sources = new Map([['source1', data]]);

            const result = TransactionAnalyzer.analyze(dataRef, sources);

            expect(result).toBeDefined();
            expect(result?.inserted).toEqual([
                { index: 0, datum: prependItem },
                { index: 5, datum: appendItem },
            ]);
            expect(result?.metadata.totalInserted).toBe(2);
            expect(result?.metadata.netSizeChange).toBe(2);
        });

        it('should handle remove + append in same transaction', () => {
            const data = createTestData();
            const itemToRemove = data[1];
            const appendItem = { id: 6, name: 'New Item' };
            const transaction: AgDataTransaction = {
                remove: [itemToRemove],
                append: [appendItem],
            };
            const dataRef = new DataRef(data, [transaction]);
            const sources = new Map([['source1', data]]);

            const result = TransactionAnalyzer.analyze(dataRef, sources);

            expect(result).toBeDefined();
            expect(result?.removed).toEqual([{ index: 1, datum: itemToRemove }]);
            expect(result?.inserted).toEqual([{ index: 5, datum: appendItem }]);
            expect(result?.metadata.totalRemoved).toBe(1);
            expect(result?.metadata.totalInserted).toBe(1);
            expect(result?.metadata.netSizeChange).toBe(0);
        });

        it('should handle prepend + remove + append in same transaction', () => {
            const data = createTestData();
            const prependItem = { id: 0, name: 'Prepend Item' };
            const itemToRemove = data[2];
            const appendItem = { id: 6, name: 'Append Item' };
            const transaction: AgDataTransaction = {
                prepend: [prependItem],
                remove: [itemToRemove],
                append: [appendItem],
            };
            const dataRef = new DataRef(data, [transaction]);
            const sources = new Map([['source1', data]]);

            const result = TransactionAnalyzer.analyze(dataRef, sources);

            expect(result).toBeDefined();
            expect(result?.removed).toEqual([{ index: 2, datum: itemToRemove }]);
            expect(result?.inserted).toEqual([
                { index: 0, datum: prependItem },
                { index: 5, datum: appendItem },
            ]);
            expect(result?.metadata.totalRemoved).toBe(1);
            expect(result?.metadata.totalInserted).toBe(2);
            expect(result?.metadata.netSizeChange).toBe(1);
        });
    });

    describe('Multiple transactions', () => {
        it('should handle multiple sequential transactions', () => {
            const data = createTestData();
            const transaction1: AgDataTransaction = {
                append: [{ id: 6, name: 'Item 6' }],
            };
            const transaction2: AgDataTransaction = {
                remove: [data[1]], // Remove Item 2
            };
            const transaction3: AgDataTransaction = {
                prepend: [{ id: 0, name: 'Item 0' }],
            };

            const dataRef = new DataRef(data, [transaction1, transaction2, transaction3]);
            const sources = new Map([['source1', data]]);

            const result = TransactionAnalyzer.analyze(dataRef, sources);

            expect(result).toBeDefined();
            expect(result?.removed).toEqual([{ index: 1, datum: data[1] }]);
            expect(result?.inserted).toEqual([
                { index: 0, datum: { id: 0, name: 'Item 0' } },
                { index: 5, datum: { id: 6, name: 'Item 6' } },
            ]);
            expect(result?.metadata.totalRemoved).toBe(1);
            expect(result?.metadata.totalInserted).toBe(2);
            expect(result?.metadata.netSizeChange).toBe(1);
        });
    });

    describe('Index shift computation accuracy', () => {
        it('should compute correct index shifts for complex operations', () => {
            const data = createTestData();
            const transaction: AgDataTransaction = {
                prepend: [{ id: 0, name: 'Prepend' }],
                remove: [data[2]], // Remove index 2
                append: [{ id: 6, name: 'Append' }],
            };
            const dataRef = new DataRef(data, [transaction]);
            const sources = new Map([['source1', data]]);

            const result = TransactionAnalyzer.analyze(dataRef, sources);

            expect(result).toBeDefined();
            // Should have proper index shift ranges
            expect(result?.indexShiftRanges).toBeDefined();
            expect(result?.indexShiftRanges.length).toBeGreaterThan(0);

            // Verify that the DataChangeDescriptorBuilder correctly computed shifts
            // (The exact shifts are tested in the DataChangeDescriptorBuilder tests)
            expect(result?.metadata.netSizeChange).toBe(1); // +1 prepend, -1 remove, +1 append = +1
        });

        it('should handle operations that result in no net index shift', () => {
            const data = createTestData();
            const transaction: AgDataTransaction = {
                remove: [data[1], data[3]], // Remove 2 items
                append: [
                    { id: 6, name: 'Item 6' },
                    { id: 7, name: 'Item 7' },
                ], // Add 2 items
            };
            const dataRef = new DataRef(data, [transaction]);
            const sources = new Map([['source1', data]]);

            const result = TransactionAnalyzer.analyze(dataRef, sources);

            expect(result).toBeDefined();
            expect(result?.metadata.netSizeChange).toBe(0); // No net change in size
            expect(result?.metadata.totalRemoved).toBe(2);
            expect(result?.metadata.totalInserted).toBe(2);
        });
    });

    describe('Edge cases', () => {
        it('should handle transactions on empty data', () => {
            const data: any[] = [];
            const transaction: AgDataTransaction = {
                prepend: [{ id: 1, name: 'First' }],
                append: [{ id: 2, name: 'Second' }],
            };
            const dataRef = new DataRef(data, [transaction]);
            const sources = new Map([['source1', data]]);

            const result = TransactionAnalyzer.analyze(dataRef, sources);

            expect(result).toBeDefined();
            expect(result?.inserted).toEqual([
                { index: 0, datum: { id: 1, name: 'First' } },
                { index: 0, datum: { id: 2, name: 'Second' } },
            ]);
            expect(result?.metadata.netSizeChange).toBe(2);
        });

        it('should handle removing all data', () => {
            const data = createTestData();
            const transaction: AgDataTransaction = {
                remove: [...data], // Remove all items
            };
            const dataRef = new DataRef(data, [transaction]);
            const sources = new Map([['source1', data]]);

            const result = TransactionAnalyzer.analyze(dataRef, sources);

            expect(result).toBeDefined();
            expect(result?.removed.length).toBe(5);
            expect(result?.metadata.totalRemoved).toBe(5);
            expect(result?.metadata.netSizeChange).toBe(-5);
        });

        it('should handle large append operations', () => {
            const data = createTestData();
            const largeAppend = Array.from({ length: 100 }, (_, i) => ({
                id: i + 100,
                name: `Item ${i + 100}`,
            }));
            const transaction: AgDataTransaction = {
                append: largeAppend,
            };
            const dataRef = new DataRef(data, [transaction]);
            const sources = new Map([['source1', data]]);

            const result = TransactionAnalyzer.analyze(dataRef, sources);

            expect(result).toBeDefined();
            expect(result?.inserted.length).toBe(100);
            expect(result?.metadata.totalInserted).toBe(100);
            expect(result?.metadata.netSizeChange).toBe(100);
            // First insertion should be at index 5 (after existing 5 items)
            expect(result?.inserted[0].index).toBe(5);
            expect(result?.inserted[99].index).toBe(104);
        });
    });
});
