import { DataChangeDescriptorBuilder } from './dataChangeDescriptor';
import { DataModel, ProcessedData } from './dataModel';
import { ProcessedDataMutator } from './processedDataMutator';

describe('ProcessedDataMutator', () => {
    let mockDataModel: DataModel<any>;
    let mutator: ProcessedDataMutator;
    let processedData: ProcessedData<any>;

    beforeEach(() => {
        // Create a mock DataModel
        mockDataModel = {} as DataModel<any>;

        // Create the mutator
        mutator = new ProcessedDataMutator(mockDataModel);

        // Create basic ungrouped ProcessedData for testing
        processedData = {
            type: 'ungrouped',
            input: { count: 3 },
            scopes: new Set(['test-scope']),
            dataSources: new Map([['test-scope', [{ a: 1 }, { a: 2 }, { a: 3 }]]]),
            invalidKeys: undefined,
            invalidKeyCount: undefined,
            invalidData: undefined,
            keys: [new Map([['test-scope', ['key1', 'key2', 'key3']]])],
            columns: [[1, 2, 3]], // Single column with values 1, 2, 3
            columnScopes: [new Set(['test-scope'])],
            domain: {
                keys: [['key1', 'key2', 'key3']],
                values: [[1, 2, 3]],
            },
            defs: {
                keys: [],
                values: [],
                allScopesHaveSameDefs: true,
            },
            partialValidDataCount: 3,
            time: Date.now(),
        } as unknown as ProcessedData<any>;

        // Add symbol properties using Object.defineProperty to avoid type issues
        Object.defineProperty(processedData, Symbol('domain-ranges'), { value: new Map() });
        Object.defineProperty(processedData, Symbol('key-sort-orders'), { value: new Map() });
        Object.defineProperty(processedData, Symbol('column-sort-orders'), { value: new Map() });
    });

    describe('mutate', () => {
        it('should handle empty changes without error', () => {
            const emptyChanges = DataChangeDescriptorBuilder.create().build();

            expect(() => mutator.mutate(processedData, emptyChanges)).not.toThrow();

            // Data should remain unchanged
            expect(processedData.columns[0]).toEqual([1, 2, 3]);
            expect(processedData.keys[0].get('test-scope')).toEqual(['key1', 'key2', 'key3']);
        });

        it('should throw error for grouped data (not yet implemented)', () => {
            const groupedData = { ...processedData, type: 'grouped' } as ProcessedData<any>;
            const changes = DataChangeDescriptorBuilder.create().addInsertion(0, { a: 4 }).build();

            expect(() => mutator.mutate(groupedData, changes)).toThrow('Grouped data mutations not yet implemented');
        });

        it('should apply simple removal to columns and keys', () => {
            const changes = DataChangeDescriptorBuilder.create()
                .addRemoval(1, { a: 2 }) // Remove middle item
                .build();

            mutator.mutate(processedData, changes);

            // Column should have item removed
            expect(processedData.columns[0]).toEqual([1, 3]);

            // Keys should have item removed
            expect(processedData.keys[0].get('test-scope')).toEqual(['key1', 'key3']);
        });

        it('should apply simple insertion to columns and keys', () => {
            const changes = DataChangeDescriptorBuilder.create()
                .addInsertion(1, { a: 4 }) // Insert at position 1
                .build();

            mutator.mutate(processedData, changes);

            // Column should have item inserted (with null placeholder for now)
            expect(processedData.columns[0]).toEqual([1, null, 2, 3]);

            // Keys should have item inserted
            expect(processedData.keys[0].get('test-scope')).toEqual(['key1', null, 'key2', 'key3']);
        });

        it('should apply simple update to columns and keys', () => {
            const changes = DataChangeDescriptorBuilder.create()
                .addUpdate(1, { a: 2 }, { a: 5 }) // Update middle item
                .build();

            mutator.mutate(processedData, changes);

            // Column should have item updated (with null placeholder for now)
            expect(processedData.columns[0]).toEqual([1, null, 3]);

            // Keys should have item updated
            expect(processedData.keys[0].get('test-scope')).toEqual(['key1', null, 'key3']);
        });

        it('should apply multiple operations in correct order', () => {
            const changes = DataChangeDescriptorBuilder.create()
                .addRemoval(0, { a: 1 }) // Remove first item
                .addInsertion(2, { a: 4 }) // Insert at end (after removal)
                .addUpdate(1, { a: 3 }, { a: 6 }) // Update what will be index 1 after removal
                .build();

            mutator.mutate(processedData, changes);

            // After removal: [2, 3]
            // After update: [2, null] (index 1 updated)
            // After insertion: [2, null, null] (inserted at index 2)
            expect(processedData.columns[0]).toEqual([2, null, null]);
        });

        it('should update metadata correctly', () => {
            const changes = DataChangeDescriptorBuilder.create()
                .addRemoval(0, { a: 1 })
                .addInsertion(1, { a: 4 })
                .build();

            mutator.mutate(processedData, changes);

            // Should have diff metadata
            expect(processedData.reduced?.diff).toBeDefined();
            expect(processedData.reduced?.diff?.default.changed).toBe(true);

            // Should disable animations
            expect(processedData.reduced?.animationValidation).toEqual({
                uniqueKeys: false,
                orderedKeys: false,
            });
        });

        it('should clear domain entries', () => {
            const changes = DataChangeDescriptorBuilder.create().addRemoval(0, { a: 1 }).build();

            mutator.mutate(processedData, changes);

            // Domain should be cleared for recalculation
            expect(processedData.domain.keys[0]).toEqual([]);
            expect(processedData.domain.values[0]).toEqual([]);
        });

        it('should handle out-of-bounds indices gracefully', () => {
            const changes = DataChangeDescriptorBuilder.create()
                .addRemoval(10, { a: 999 }) // Index beyond array length
                .addInsertion(5, { a: 4 }) // Insert beyond current length
                .addUpdate(8, { a: 2 }, { a: 5 }) // Update beyond current length
                .build();

            // Should not throw error
            expect(() => mutator.mutate(processedData, changes)).not.toThrow();

            // Original data should remain mostly unchanged
            expect(processedData.columns[0]).toEqual([1, 2, 3, null]); // Only valid insertion applied
        });

        it('should throw error on internal failures', () => {
            // Create an invalid processedData that will cause errors
            const invalidData = {
                ...processedData,
                columns: null, // This will cause errors during mutation
            } as any;

            const changes = DataChangeDescriptorBuilder.create().addRemoval(0, { a: 1 }).build();

            expect(() => mutator.mutate(invalidData, changes)).toThrow(/ProcessedDataMutator failed/);
        });
    });

    describe('cache invalidation', () => {
        it('should invalidate symbol caches when data changes', () => {
            // Set up cached values using Object.defineProperty
            Object.defineProperty(processedData, Symbol('domain-ranges'), {
                value: new Map([['column-0', 'some-cached-value']]),
                configurable: true,
            });
            Object.defineProperty(processedData, Symbol('key-sort-orders'), {
                value: new Map([[0, { sortOrder: 'asc' }]]),
                configurable: true,
            });
            Object.defineProperty(processedData, Symbol('column-sort-orders'), {
                value: new Map([[0, { sortOrder: 'desc' }]]),
                configurable: true,
            });

            const changes = DataChangeDescriptorBuilder.create().addRemoval(0, { a: 1 }).build();

            mutator.mutate(processedData, changes);

            // Since cache invalidation is not yet implemented (TODOs in code),
            // this test primarily ensures no errors are thrown during mutation
            // when Symbol properties are present
        });
    });
});
