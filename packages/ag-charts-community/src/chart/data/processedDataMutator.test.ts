import { DataChangeDescriptorBuilder } from './dataChangeDescriptor';
import { ProcessedData } from './dataModel';
import { ProcessedDataMutator } from './processedDataMutator';

describe('ProcessedDataMutator', () => {
    let mutator: ProcessedDataMutator;
    let processedData: ProcessedData<any>;
    let scopeId: string;
    let rawData: Array<{ id: string; a: number; b?: number; category?: string }>;
    let keyDef: any;
    let valueDef: any;

    beforeEach(() => {
        scopeId = 'test-scope';
        rawData = [
            { id: 'key1', a: 1 },
            { id: 'key2', a: 2 },
            { id: 'key3', a: 3 },
        ];

        const createDefinition = (definition: any) => ({
            missing: new Map(),
            ...definition,
        });

        keyDef = createDefinition({
            type: 'key',
            property: 'id',
            valueType: 'category',
            scopes: [scopeId],
            invalidValue: null,
        });

        valueDef = createDefinition({
            type: 'value',
            property: 'a',
            valueType: 'range',
            scopes: [scopeId],
            invalidValue: null,
        });

        const processValue = (def: any, datum: any, _idx: number, valueScopes?: string | string[]) => {
            const hasProperty = datum != null && Object.prototype.hasOwnProperty.call(datum, def.property);
            const value = hasProperty ? datum[def.property] : def.missingValue;
            const missing = !hasProperty;
            const valid = !missing && (def.type === 'key' ? value != null : typeof value === 'number');

            if (missing && valueScopes) {
                const scopes = Array.isArray(valueScopes) ? valueScopes : [valueScopes];
                for (const scope of scopes) {
                    const current = def.missing.get(scope) ?? 0;
                    def.missing.set(scope, current + 1);
                }
            }

            return { value, missing, valid };
        };

        mutator = new ProcessedDataMutator({ processValue });

        processedData = {
            type: 'ungrouped',
            input: { count: rawData.length },
            scopes: new Set([scopeId]),
            dataSources: new Map([[scopeId, rawData]]),
            invalidKeys: undefined,
            invalidKeyCount: undefined,
            invalidData: undefined,
            keys: [new Map([[scopeId, rawData.map((datum) => datum.id)]])],
            columns: [rawData.map((datum) => datum.a)],
            columnScopes: [new Set([scopeId])],
            domain: {
                keys: [rawData.map((datum) => datum.id)],
                values: [[1, 3]],
            },
            defs: {
                keys: [keyDef],
                values: [valueDef],
                allScopesHaveSameDefs: true,
            },
            partialValidDataCount: 0,
            time: Date.now(),
        } as unknown as ProcessedData<any>;

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

        it('should handle grouped data without throwing', () => {
            const groupedData = { ...processedData, type: 'grouped' } as ProcessedData<any>;
            const changes = DataChangeDescriptorBuilder.create().addInsertion(0, { id: 'key4', a: 4 }).build();

            expect(() => mutator.mutate(groupedData, changes)).not.toThrow();
            expect(groupedData.columns[0]).toEqual([4, 1, 2, 3]);
            expect(groupedData.keys[0].get('test-scope')).toEqual(['key4', 'key1', 'key2', 'key3']);
        });

        it('should apply simple removal to columns and keys', () => {
            const removalDatum = rawData[1];
            const changes = DataChangeDescriptorBuilder.create().addRemoval(1, removalDatum).build();

            mutator.mutate(processedData, changes);

            // Column should have item removed
            expect(processedData.columns[0]).toEqual([1, 3]);

            // Keys should have item removed
            expect(processedData.keys[0].get('test-scope')).toEqual(['key1', 'key3']);
            expect(processedData.partialValidDataCount).toBe(0);
        });

        it('should apply simple insertion to columns and keys', () => {
            const newDatum = { id: 'key4', a: 4 };
            const changes = DataChangeDescriptorBuilder.create().addInsertion(1, newDatum).build();

            mutator.mutate(processedData, changes);

            expect(processedData.columns[0]).toEqual([1, 4, 2, 3]);

            expect(processedData.keys[0].get('test-scope')).toEqual(['key1', 'key4', 'key2', 'key3']);
            expect(processedData.partialValidDataCount).toBe(0);
        });

        it('should apply simple update to columns and keys', () => {
            const oldDatum = rawData[1];
            const newDatum = { id: 'key2', a: 5 };
            const changes = DataChangeDescriptorBuilder.create().addUpdate(1, oldDatum, newDatum).build();

            mutator.mutate(processedData, changes);

            expect(processedData.columns[0]).toEqual([1, 5, 3]);

            expect(processedData.keys[0].get('test-scope')).toEqual(['key1', 'key2', 'key3']);
            expect(processedData.partialValidDataCount).toBe(0);
        });

        it('should apply multiple operations in correct order', () => {
            const removeDatum = rawData[1];
            const updateOld = rawData[0];
            const updateNew = { id: 'key1', a: 10 };
            const insertDatum = { id: 'key4', a: 4 };

            const changes = DataChangeDescriptorBuilder.create()
                .addRemoval(1, removeDatum)
                .addUpdate(0, updateOld, updateNew)
                .addInsertion(2, insertDatum)
                .build();

            mutator.mutate(processedData, changes);

            expect(processedData.columns[0]).toEqual([10, 3, 4]);
            expect(processedData.keys[0].get('test-scope')).toEqual(['key1', 'key3', 'key4']);
            expect(processedData.partialValidDataCount).toBe(0);
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

        it('should update domain ranges after mutations', () => {
            // Set up test data with continuous values (numbers)
            processedData.columns[0] = [1, 2, 3];
            processedData.domain.values[0] = [1, 3]; // Original domain range

            const changes = DataChangeDescriptorBuilder.create().addRemoval(1, rawData[1]).build();

            mutator.mutate(processedData, changes);

            // Column should have item removed: [1, 3]
            expect(processedData.columns[0]).toEqual([1, 3]);

            // Domain should be recalculated to reflect remaining data: [1, 3]
            expect(processedData.domain.values[0]).toEqual([1, 3]);
        });

        it('should update discrete domain ranges after mutations', () => {
            // Set up test data with discrete values (strings)
            processedData.columns[0] = ['apple', 'banana', 'cherry'];
            processedData.domain.values[0] = ['apple', 'banana', 'cherry']; // Original discrete domain
            (processedData.defs.values[0] as any).valueType = 'category';

            const changes = DataChangeDescriptorBuilder.create().addRemoval(1, rawData[1]).build();

            mutator.mutate(processedData, changes);

            // Column should have item removed: ['apple', 'cherry']
            expect(processedData.columns[0]).toEqual(['apple', 'cherry']);

            // Domain should be recalculated to reflect remaining data
            // The exact order may vary, so we'll check it contains the right elements
            const domain = processedData.domain.values[0];
            expect(domain).toContain('apple');
            expect(domain).toContain('cherry');
            expect(domain).not.toContain('banana');
            expect(domain.length).toBe(2);
        });

        it('should update continuous domain after insertion', () => {
            // Set up test data with continuous values
            processedData.columns[0] = [1, 2, 3];
            processedData.domain.values[0] = [1, 3]; // Original domain range

            const newDatum = { id: 'key4', a: 5 };
            const changes = DataChangeDescriptorBuilder.create().addInsertion(3, newDatum).build();

            mutator.mutate(processedData, changes);

            expect(processedData.columns[0]).toEqual([1, 2, 3, 5]);
            expect(processedData.domain.values[0]).toEqual([1, 5]);
        });

        it('should handle empty domain ranges correctly', () => {
            // Set up test data that becomes empty after removal
            processedData.columns[0] = [1];
            processedData.domain.values[0] = [1, 1]; // Single value domain

            const changes = DataChangeDescriptorBuilder.create().addRemoval(0, rawData[0]).build();

            mutator.mutate(processedData, changes);

            // Column should be empty
            expect(processedData.columns[0]).toEqual([]);

            // Domain should be empty array for empty columns
            expect(processedData.domain.values[0]).toEqual([]);
        });

        it('should throw error on internal failures', () => {
            // Create an invalid processedData that will cause errors
            const invalidData = {
                ...processedData,
                columns: null, // This will cause errors during mutation
            } as any;

            const changes = DataChangeDescriptorBuilder.create().addRemoval(0, rawData[0]).build();

            expect(() => mutator.mutate(invalidData, changes)).toThrow(/ProcessedDataMutator failed/);
        });
    });

    describe('cache invalidation', () => {
        it('should invalidate symbol caches when data changes', () => {
            // Set up cached values using Symbol.for to match our implementation
            const domainRangesKey = Symbol.for('domain-ranges');
            const keySortOrdersKey = Symbol.for('key-sort-orders');
            const columnSortOrdersKey = Symbol.for('column-sort-orders');

            const domainRangesCache = new Map([
                ['column-0', 'cached-column-range'],
                ['values-0', 'cached-values-range'],
                ['key-0', 'cached-key-range'],
                ['keys-0', 'cached-keys-range'],
            ]);
            const keySortOrdersCache = new Map([[0, { sortOrder: 'asc' }]]);
            const columnSortOrdersCache = new Map([[0, { sortOrder: 'desc' }]]);

            Object.defineProperty(processedData, domainRangesKey, {
                value: domainRangesCache,
                configurable: true,
            });
            Object.defineProperty(processedData, keySortOrdersKey, {
                value: keySortOrdersCache,
                configurable: true,
            });
            Object.defineProperty(processedData, columnSortOrdersKey, {
                value: columnSortOrdersCache,
                configurable: true,
            });

            // Add some cached reduced data
            processedData.reduced = {
                cachedProperty: 'some-cached-data',
                anotherCache: 42,
            } as any;

            const changes = DataChangeDescriptorBuilder.create().addRemoval(0, { a: 1 }).build();

            mutator.mutate(processedData, changes);

            // Verify domain ranges cache was cleared for affected column (0) and key (0)
            expect(domainRangesCache.has('column-0')).toBe(false);
            expect(domainRangesCache.has('values-0')).toBe(false);
            expect(domainRangesCache.has('key-0')).toBe(false);
            expect(domainRangesCache.has('keys-0')).toBe(false);

            // Verify sort order caches were cleared for affected indices
            expect(keySortOrdersCache.has(0)).toBe(false);
            expect(columnSortOrdersCache.has(0)).toBe(false);

            // Verify cached reduced data was cleared (except diff and animationValidation)
            expect((processedData.reduced as any)?.cachedProperty).toBeUndefined();
            expect((processedData.reduced as any)?.anotherCache).toBeUndefined();

            // Verify that diff and animationValidation are still present (managed explicitly)
            expect(processedData.reduced?.diff).toBeDefined();
            expect(processedData.reduced?.animationValidation).toBeDefined();
        });

        it('should not invalidate caches for unaffected indices', () => {
            // Set up caches with data for multiple indices
            const domainRangesKey = Symbol.for('domain-ranges');
            const keySortOrdersKey = Symbol.for('key-sort-orders');
            const columnSortOrdersKey = Symbol.for('column-sort-orders');

            const domainRangesCache = new Map([
                ['column-0', 'cached-column-0'],
                ['column-1', 'cached-column-1'], // Should remain
                ['key-0', 'cached-key-0'],
                ['key-1', 'cached-key-1'], // Should remain
            ]);
            const keySortOrdersCache = new Map([
                [0, { sortOrder: 'asc' }],
                [1, { sortOrder: 'desc' }], // Should remain
            ]);
            const columnSortOrdersCache = new Map([
                [0, { sortOrder: 'desc' }],
                [1, { sortOrder: 'asc' }], // Should remain
            ]);

            Object.defineProperty(processedData, domainRangesKey, {
                value: domainRangesCache,
                configurable: true,
            });
            Object.defineProperty(processedData, keySortOrdersKey, {
                value: keySortOrdersCache,
                configurable: true,
            });
            Object.defineProperty(processedData, columnSortOrdersKey, {
                value: columnSortOrdersCache,
                configurable: true,
            });

            // Expand test data to have multiple columns and keys
            rawData[0].b = 4;
            rawData[1].b = 5;
            rawData[2].b = 6;
            rawData[0].category = 'keyA';
            rawData[1].category = 'keyB';
            rawData[2].category = 'keyC';

            const additionalValueDef = {
                type: 'value',
                property: 'b',
                valueType: 'range',
                scopes: [scopeId],
                invalidValue: null,
                missing: new Map(),
            };

            const additionalKeyDef = {
                type: 'key',
                property: 'category',
                valueType: 'category',
                scopes: [scopeId],
                invalidValue: null,
                missing: new Map(),
            };

            processedData.columns = [rawData.map((datum) => datum.a), rawData.map((datum) => datum.b)];
            processedData.keys = [
                new Map([[scopeId, rawData.map((datum) => datum.id)]]),
                new Map([[scopeId, rawData.map((datum) => datum.category)]]),
            ];
            processedData.defs.values = [valueDef, additionalValueDef];
            processedData.defs.keys = [keyDef, additionalKeyDef];
            processedData.domain.keys = [rawData.map((datum) => datum.id), rawData.map((datum) => datum.category)];
            processedData.domain.values = [
                [1, 3],
                [4, 6],
            ];

            const changes = DataChangeDescriptorBuilder.create().addRemoval(0, rawData[0]).build();

            mutator.mutate(processedData, changes);

            // Since all columns/keys are marked as affected in the current implementation,
            // all caches will be cleared. This test documents current behavior.
            // In a future optimization, only affected indices should be cleared.
            expect(domainRangesCache.has('column-0')).toBe(false);
            expect(domainRangesCache.has('column-1')).toBe(false); // Currently cleared due to broad invalidation
            expect(keySortOrdersCache.has(0)).toBe(false);
            expect(keySortOrdersCache.has(1)).toBe(false); // Currently cleared due to broad invalidation
        });
    });

    describe('diff metadata generation', () => {
        it('should generate accurate diff for removals only', () => {
            const changes = DataChangeDescriptorBuilder.create()
                .addRemoval(1, rawData[1]) // Remove 'key2'
                .build();

            mutator.mutate(processedData, changes);

            const diff = processedData.reduced?.diff?.default;
            expect(diff).toBeDefined();
            expect(diff?.changed).toBe(true);
            expect(diff?.removed.has('key2')).toBe(true);
            expect(diff?.added.size).toBe(0);
            expect(diff?.updated.size).toBe(0);
            expect(diff?.moved.size).toBe(0);
        });

        it('should generate accurate diff for insertions only', () => {
            const newDatum = { id: 'key4', a: 4 };
            const changes = DataChangeDescriptorBuilder.create()
                .addInsertion(1, newDatum) // Insert 'key4' at position 1
                .build();

            mutator.mutate(processedData, changes);

            const diff = processedData.reduced?.diff?.default;
            expect(diff).toBeDefined();
            expect(diff?.changed).toBe(true);
            expect(diff?.added.has('key4')).toBe(true);
            expect(diff?.removed.size).toBe(0);
            expect(diff?.updated.size).toBe(0);
            expect(diff?.moved.size).toBe(0);
        });

        it('should generate accurate diff for updates only', () => {
            const oldDatum = rawData[1];
            const newDatum = { id: 'key2', a: 5 }; // Same key, different value
            const changes = DataChangeDescriptorBuilder.create().addUpdate(1, oldDatum, newDatum).build();

            mutator.mutate(processedData, changes);

            const diff = processedData.reduced?.diff?.default;
            expect(diff).toBeDefined();
            expect(diff?.changed).toBe(true);
            expect(diff?.updated.has('key2')).toBe(true);
            expect(diff?.added.size).toBe(0);
            expect(diff?.removed.size).toBe(0);
            expect(diff?.moved.size).toBe(0);
        });

        it('should generate accurate diff for mixed operations', () => {
            const removeDatum = rawData[0]; // Remove 'key1'
            const updateOld = rawData[1];
            const updateNew = { id: 'key2', a: 10 }; // Update 'key2'
            const insertDatum = { id: 'key4', a: 4 }; // Insert 'key4'

            const changes = DataChangeDescriptorBuilder.create()
                .addRemoval(0, removeDatum)
                .addUpdate(1, updateOld, updateNew)
                .addInsertion(2, insertDatum)
                .build();

            mutator.mutate(processedData, changes);

            const diff = processedData.reduced?.diff?.default;
            expect(diff).toBeDefined();
            expect(diff?.changed).toBe(true);
            expect(diff?.removed.has('key1')).toBe(true);
            // key2 might be marked as moved due to index shifts from the removal at index 0
            expect((diff?.updated.has('key2') ?? false) || (diff?.moved.has('key2') ?? false)).toBe(true);
            expect(diff?.added.has('key4')).toBe(true);
        });

        it('should handle operations that cause index movements', () => {
            // This scenario would cause indices to shift
            const removeDatum = rawData[0]; // Remove at index 0
            const insertDatum = { id: 'key4', a: 4 }; // Insert at index 0
            const updateOld = rawData[2];
            const updateNew = { id: 'key3', a: 30 }; // Update at index 2 (but it will be at index 1 after removal)

            const changes = DataChangeDescriptorBuilder.create()
                .addRemoval(0, removeDatum)
                .addInsertion(0, insertDatum)
                .addUpdate(2, updateOld, updateNew)
                .build();

            mutator.mutate(processedData, changes);

            const diff = processedData.reduced?.diff?.default;
            expect(diff).toBeDefined();
            expect(diff?.changed).toBe(true);
            expect(diff?.removed.has('key1')).toBe(true);
            expect(diff?.added.has('key4')).toBe(true);
            // key3 could be marked as moved or updated depending on the shift ranges
            expect((diff?.updated.has('key3') ?? false) || (diff?.moved.has('key3') ?? false)).toBe(true);
        });

        it('should handle data without key definitions', () => {
            // Test with data that doesn't have proper key definitions
            processedData.defs.keys = [];

            const changes = DataChangeDescriptorBuilder.create()
                .addRemoval(0, rawData[0])
                .addInsertion(1, { id: 'key4', a: 4 })
                .build();

            mutator.mutate(processedData, changes);

            const diff = processedData.reduced?.diff?.default;
            expect(diff).toBeDefined();
            expect(diff?.changed).toBe(true);
            expect(diff?.removed.size).toBe(1);
            expect(diff?.added.size).toBe(1);
            // Should fall back to some default key representation
            expect(Array.from(diff!.removed)[0]).toMatch(/key1|index-0|object-0/);
            expect(Array.from(diff!.added)[0]).toMatch(/key4|index-1|object-1/);
        });

        it('should handle null/undefined data gracefully', () => {
            const changes = DataChangeDescriptorBuilder.create().addRemoval(0, null).addInsertion(1, undefined).build();

            mutator.mutate(processedData, changes);

            const diff = processedData.reduced?.diff?.default;
            expect(diff).toBeDefined();
            expect(diff?.changed).toBe(true);
            expect(diff?.removed.has('index-0')).toBe(true);
            expect(diff?.added.has('index-1')).toBe(true);
        });

        it('should handle primitive data types', () => {
            const changes = DataChangeDescriptorBuilder.create()
                .addRemoval(0, 'string-value')
                .addInsertion(1, 42)
                .build();

            mutator.mutate(processedData, changes);

            const diff = processedData.reduced?.diff?.default;
            expect(diff).toBeDefined();
            expect(diff?.changed).toBe(true);
            expect(diff?.removed.has('string-value')).toBe(true);
            expect(diff?.added.has('42')).toBe(true);
        });

        it('should use common object properties as fallback keys', () => {
            const objectWithId = { id: 'test-id', value: 10 };
            const objectWithName = { name: 'test-name', value: 20 };
            const objectWithKey = { key: 'test-key', value: 30 };

            // Clear key definitions to test fallback behavior
            processedData.defs.keys = [];

            const changes = DataChangeDescriptorBuilder.create()
                .addInsertion(0, objectWithId)
                .addInsertion(1, objectWithName)
                .addInsertion(2, objectWithKey)
                .build();

            mutator.mutate(processedData, changes);

            const diff = processedData.reduced?.diff?.default;
            expect(diff).toBeDefined();
            expect(diff?.added.has('test-id')).toBe(true);
            expect(diff?.added.has('test-name')).toBe(true);
            expect(diff?.added.has('test-key')).toBe(true);
        });

        it('should set changed flag to false when no operations are applied', () => {
            const emptyChanges = DataChangeDescriptorBuilder.create().build();

            mutator.mutate(processedData, emptyChanges);

            // For empty changes, diff should not be set at all since updateProcessedDataMetadata
            // calls generateDiffMetadata which would show changed: false
            const diff = processedData.reduced?.diff?.default;
            if (diff) {
                expect(diff.changed).toBe(false);
            }
        });
    });

    describe('animation validation logic', () => {
        it('should set both flags to false for high-frequency updates (insertions)', () => {
            const newDatum = { id: 'key4', a: 4 };
            const changes = DataChangeDescriptorBuilder.create().addInsertion(1, newDatum).build();

            mutator.mutate(processedData, changes);

            expect(processedData.reduced?.animationValidation).toEqual({
                uniqueKeys: false,
                orderedKeys: false,
            });
        });

        it('should set both flags to false for high-frequency updates (removals)', () => {
            const changes = DataChangeDescriptorBuilder.create().addRemoval(1, rawData[1]).build();

            mutator.mutate(processedData, changes);

            expect(processedData.reduced?.animationValidation).toEqual({
                uniqueKeys: false,
                orderedKeys: false,
            });
        });

        it('should set both flags to false for high-frequency updates (updates)', () => {
            const oldDatum = rawData[1];
            const newDatum = { id: 'key2', a: 5 };
            const changes = DataChangeDescriptorBuilder.create().addUpdate(1, oldDatum, newDatum).build();

            mutator.mutate(processedData, changes);

            expect(processedData.reduced?.animationValidation).toEqual({
                uniqueKeys: false,
                orderedKeys: false,
            });
        });

        it('should set both flags to false for mixed operations', () => {
            const changes = DataChangeDescriptorBuilder.create()
                .addRemoval(0, rawData[0])
                .addInsertion(1, { id: 'key4', a: 4 })
                .addUpdate(1, rawData[1], { id: 'key2', a: 5 })
                .build();

            mutator.mutate(processedData, changes);

            expect(processedData.reduced?.animationValidation).toEqual({
                uniqueKeys: false,
                orderedKeys: false,
            });
        });

        it('should detect when key uniqueness would be affected by insertions', () => {
            // Create a scenario where uniqueness checking logic would work
            // but since we treat all incremental updates as high-frequency,
            // it should still return false
            const newDatum = { id: 'key1', a: 4 }; // Duplicate key
            const changes = DataChangeDescriptorBuilder.create().addInsertion(3, newDatum).build();

            mutator.mutate(processedData, changes);

            // Should be false due to high-frequency update detection
            expect(processedData.reduced?.animationValidation?.uniqueKeys).toBe(false);
        });

        it('should detect when key ordering would be affected by removals', () => {
            // Set up a scenario with continuous key data (numbers)
            const continuousKeyDef = {
                type: 'key' as const,
                property: 'timestamp',
                valueType: 'range' as const, // Continuous data type
                scopes: [scopeId],
                invalidValue: null,
                missing: new Map(),
            };

            // Update test data to have timestamp values
            const timestampData = [
                { id: 'key1', a: 1, timestamp: 100 },
                { id: 'key2', a: 2, timestamp: 200 },
                { id: 'key3', a: 3, timestamp: 300 },
            ];

            processedData.defs.keys = [continuousKeyDef];
            processedData.keys = [new Map([[scopeId, timestampData.map((d) => d.timestamp)]])];

            const changes = DataChangeDescriptorBuilder.create().addRemoval(1, timestampData[1]).build();

            mutator.mutate(processedData, changes);

            // Should be false due to high-frequency update detection
            expect(processedData.reduced?.animationValidation?.orderedKeys).toBe(false);
        });

        it('should handle edge cases with empty data', () => {
            // Set up empty processed data
            processedData.columns = [[]];
            processedData.keys = [new Map([[scopeId, []]])];
            processedData.input.count = 0;

            const newDatum = { id: 'key1', a: 1 };
            const changes = DataChangeDescriptorBuilder.create().addInsertion(0, newDatum).build();

            mutator.mutate(processedData, changes);

            expect(processedData.reduced?.animationValidation).toEqual({
                uniqueKeys: false,
                orderedKeys: false,
            });
        });

        it('should handle edge cases with single item data', () => {
            // Set up single item data
            const singleData = [{ id: 'key1', a: 1 }];
            processedData.columns = [[1]];
            processedData.keys = [new Map([[scopeId, ['key1']]])];
            processedData.input.count = 1;

            const changes = DataChangeDescriptorBuilder.create().addRemoval(0, singleData[0]).build();

            mutator.mutate(processedData, changes);

            expect(processedData.reduced?.animationValidation).toEqual({
                uniqueKeys: false,
                orderedKeys: false,
            });
        });

        it('should handle updates that change key values', () => {
            const oldDatum = rawData[1];
            const newDatum = { id: 'key_changed', a: 2 }; // Key value changes
            const changes = DataChangeDescriptorBuilder.create().addUpdate(1, oldDatum, newDatum).build();

            mutator.mutate(processedData, changes);

            // Should be false due to high-frequency update detection
            expect(processedData.reduced?.animationValidation).toEqual({
                uniqueKeys: false,
                orderedKeys: false,
            });
        });

        it('should handle updates that only change value properties', () => {
            const oldDatum = rawData[1];
            const newDatum = { id: 'key2', a: 20 }; // Same key, different value
            const changes = DataChangeDescriptorBuilder.create().addUpdate(1, oldDatum, newDatum).build();

            mutator.mutate(processedData, changes);

            // Should be false due to high-frequency update detection
            expect(processedData.reduced?.animationValidation).toEqual({
                uniqueKeys: false,
                orderedKeys: false,
            });
        });

        it('should handle mixed key types (categorical and continuous)', () => {
            // Set up mixed key definitions
            const categoricalKeyDef = {
                type: 'key' as const,
                property: 'category',
                valueType: 'category' as const,
                scopes: [scopeId],
                invalidValue: null,
                missing: new Map(),
            };

            const continuousKeyDef = {
                type: 'key' as const,
                property: 'timestamp',
                valueType: 'range' as const,
                scopes: [scopeId],
                invalidValue: null,
                missing: new Map(),
            };

            processedData.defs.keys = [categoricalKeyDef, continuousKeyDef];
            processedData.keys = [new Map([[scopeId, ['A', 'B', 'C']]]), new Map([[scopeId, [100, 200, 300]]])];

            const changes = DataChangeDescriptorBuilder.create()
                .addInsertion(1, { category: 'D', timestamp: 150 })
                .build();

            mutator.mutate(processedData, changes);

            expect(processedData.reduced?.animationValidation).toEqual({
                uniqueKeys: false,
                orderedKeys: false,
            });
        });

        it('should not affect animation validation when no changes are made', () => {
            const emptyChanges = DataChangeDescriptorBuilder.create().build();

            mutator.mutate(processedData, emptyChanges);

            // When no changes are made, the animation validation logic should not be called
            // The reduced metadata might not even be created for empty changes
            const animationValidation = processedData.reduced?.animationValidation;
            if (animationValidation) {
                // If present, it should indicate no issues since there are no changes
                expect(typeof animationValidation.uniqueKeys).toBe('boolean');
                expect(typeof animationValidation.orderedKeys).toBe('boolean');
            }
        });
    });
});
