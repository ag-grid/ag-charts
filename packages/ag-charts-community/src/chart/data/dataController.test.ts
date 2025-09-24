import { beforeEach, describe, expect, it } from '@jest/globals';

import type { ChartMode } from '../chartMode';
import { DataController } from './dataController';
import type { DataModelOptions, DatumPropertyDefinition } from './dataModel';
import { DataRef, wrapRawData } from './dataRef';

describe('DataController', () => {
    let controller: DataController;
    let data: DataRef<Record<string, number>>;

    beforeEach(() => {
        controller = new DataController('standalone', false);
        data = { data: [], pendingTransactions: [] };
    });

    it('should merge compatible requests with identical definitions', async () => {
        const def = {
            props: [
                {
                    id: 'keyProp1-key',
                    property: 'keyProp1',
                    type: 'key' as const,
                    valueType: 'category' as const,
                },
                {
                    property: 'valueProp1',
                    type: 'value' as const,
                    valueType: 'range' as const,
                },
            ],
        };
        const promise1 = controller.request('test1', data, def);
        const promise2 = controller.request('test2', data, def);

        controller.execute();
        const results = await Promise.all([promise1, promise2]);

        expect(results[0]).toEqual(results[1]);
        expect(results[0].processedData.defs.keys).toHaveLength(1);
        expect(results[0].processedData.defs.values).toHaveLength(1);
    });

    it('should merge compatible requests with different ids', async () => {
        const promise1 = controller.request('test1', data, {
            props: [
                {
                    id: 'keyProp1-key',
                    property: 'keyProp1',
                    type: 'key',
                    valueType: 'category',
                },
                {
                    property: 'valueProp1',
                    type: 'value',
                    valueType: 'range',
                },
            ],
        });

        const promise2 = controller.request('test2', data, {
            props: [
                {
                    id: 'keyProp2-key',
                    property: 'keyProp1',
                    type: 'key',
                    valueType: 'category',
                },
                {
                    property: 'valueProp1',
                    type: 'value',
                    valueType: 'range',
                },
            ],
        });

        controller.execute();
        const results = await Promise.all([promise1, promise2]);

        expect(results[0]).toEqual(results[1]);
        expect(results[0].processedData.defs.keys).toHaveLength(1);
        expect(results[0].processedData.defs.values).toHaveLength(1);
    });

    it('should not merge incompatible requests', async () => {
        const promise1 = controller.request('test1', data, {
            props: [
                {
                    id: 'keyProp1-key',
                    property: 'keyProp1',
                    type: 'key',
                    valueType: 'category',
                },
                {
                    property: 'valueProp1',
                    type: 'value',
                    valueType: 'range',
                },
            ],
        });

        const promise2 = controller.request('test2', data, {
            props: [
                {
                    id: 'keyProp2-key',
                    property: 'keyProp2',
                    type: 'key',
                    valueType: 'category',
                },
                {
                    property: 'valueProp1',
                    type: 'value',
                    valueType: 'range',
                },
            ],
        });

        controller.execute();
        const results = await Promise.all([promise1, promise2]);

        expect(results[0]).not.toEqual(results[1]);
        expect(results[0].processedData.defs.keys).toHaveLength(1);
        expect(results[0].processedData.defs.values).toHaveLength(1);
        expect(results[1].processedData.defs.keys).toHaveLength(1);
        expect(results[1].processedData.defs.values).toHaveLength(1);
    });

    it('should merge compatible requests', async () => {
        const promise1 = controller.request('test1', data, {
            props: [
                {
                    id: 'keyProp1-key',
                    property: 'keyProp1',
                    type: 'key',
                    valueType: 'category',
                },
                {
                    id: 'valueProp1-key',
                    property: 'valueProp1',
                    type: 'value',
                    valueType: 'range',
                },
                {
                    id: 'valueProp2-key',
                    property: 'valueProp2',
                    type: 'value',
                    valueType: 'range',
                },
            ],
        });

        const promise2 = controller.request('test2', data, {
            props: [
                {
                    id: 'keyProp1-key',
                    property: 'keyProp1',
                    type: 'key',
                    valueType: 'category',
                },
                {
                    id: 'valueProp1-key',
                    property: 'valueProp2',
                    type: 'value',
                    valueType: 'range',
                },
                {
                    id: 'valueProp2-key',
                    property: 'valueProp1',
                    type: 'value',
                    valueType: 'range',
                },
            ],
        });

        controller.execute();
        const results = await Promise.all([promise1, promise2]);

        const test1ValueProp1DataIdx = results[0].dataModel.resolveProcessedDataDefById(
            { id: 'test1' },
            'valueProp1-key'
        );

        const test2ValueProp1DataIdx = results[0].dataModel.resolveProcessedDataDefById(
            { id: 'test2' },
            'valueProp1-key'
        );

        expect(results[0]).toEqual(results[1]);

        expect(test1ValueProp1DataIdx).not.toEqual(test2ValueProp1DataIdx);

        expect(results[0].processedData.defs.keys).toHaveLength(1);
        expect(results[0].processedData.defs.values).toHaveLength(2);

        expect(results[0].processedData.defs.keys[0].idsMap?.size).toEqual(2);
        expect(results[0].processedData.defs.keys[0].idsMap).toEqual(
            new Map([
                ['test1', new Set(['keyProp1-key'])],
                ['test2', new Set(['keyProp1-key'])],
            ])
        );

        expect(results[0].processedData.defs.values[0].idsMap?.size).toEqual(2);
        expect(results[0].processedData.defs.values[0].idsMap).toEqual(
            new Map([
                ['test1', new Set(['valueProp1-key'])],
                ['test2', new Set(['valueProp2-key'])],
            ])
        );

        expect(results[0].processedData.defs.values[1].idsMap?.size).toEqual(2);
        expect(results[0].processedData.defs.values[1].idsMap).toEqual(
            new Map([
                ['test1', new Set(['valueProp2-key'])],
                ['test2', new Set(['valueProp1-key'])],
            ])
        );
    });

    it('should not leak scopes', async () => {
        data = wrapRawData([
            { keyProp1: 2020, valueProp1: 100 },
            { keyProp1: 2021, valueProp1: 200 },
            { keyProp1: 2022, valueProp1: 300 },
        ]);

        const promise1 = controller.request('test1', data, {
            props: [
                {
                    id: 'keyProp1-key',
                    property: 'keyProp1',
                    type: 'key',
                    valueType: 'category',
                },
                {
                    id: 'valueProp1-key',
                    property: 'valueProp1',
                    type: 'value',
                    valueType: 'range',
                },
            ],
        });

        controller.execute();
        const results = await Promise.all([promise1]);

        expect(results[0].processedData.keys).toEqual([new Map([['test1', [2020, 2021, 2022]]])]);
        expect(results[0].processedData.columns).toEqual([[100, 200, 300]]);
    });

    describe('with multiple data sources', () => {
        it('should extract scoped data for each request with shared scopes', async () => {
            const data1 = wrapRawData([
                { keyProp1: '2020', valueProp1: 100 },
                { keyProp1: '2021', valueProp1: 200 },
                { keyProp1: '2022', valueProp1: 300 },
            ]);
            const data2 = wrapRawData([
                { keyProp1: '2020', valueProp1: 40 },
                { keyProp1: '2021', valueProp1: 50 },
                { keyProp1: '2022', valueProp1: 60 },
            ]);

            const def: DataModelOptions<'keyProp1' | 'valueProp1', any, false> = {
                props: [
                    {
                        id: 'keyProp1-key',
                        property: 'keyProp1',
                        type: 'key',
                        valueType: 'category',
                    },
                    {
                        id: 'valueProp1-key',
                        property: 'valueProp1',
                        type: 'value',
                        valueType: 'range',
                    },
                ],
            };

            const promise1 = controller.request('test1', data1, def);
            const promise2 = controller.request('test2', data2, def);

            controller.execute();
            const results = await Promise.all([promise1, promise2]);

            expect(results.length).toEqual(2);
            expect(results[0].processedData.columns.map((c) => c[0])).toEqual([100]);
            expect(results[1].processedData.columns.map((c) => c[0])).toEqual([40]);
        });

        it('should extract scoped data for each request with unique scopes', async () => {
            const data1 = wrapRawData([
                { keyProp1: '2020', valueProp1: 100 },
                { keyProp1: '2021', valueProp1: 200 },
                { keyProp1: '2022', valueProp1: 300 },
            ]);
            const data2 = wrapRawData([
                { keyProp1: '2020', valueProp1: 40 },
                { keyProp1: '2021', valueProp1: 50 },
                { keyProp1: '2022', valueProp1: 60 },
            ]);

            const promise1 = controller.request('test1', data1, {
                props: [
                    {
                        id: 'keyProp1-key',
                        property: 'keyProp1',
                        type: 'key',
                        valueType: 'category',
                    },
                    {
                        id: 'valueProp1-key',
                        property: 'valueProp1',
                        type: 'value',
                        valueType: 'range',
                    },
                ],
            });

            const promise2 = controller.request('test2', data2, {
                props: [
                    {
                        id: 'keyProp1-key',
                        property: 'keyProp1',
                        type: 'key',
                        valueType: 'category',
                    },
                    {
                        id: 'valueProp1-key',
                        property: 'valueProp1',
                        type: 'value',
                        valueType: 'range',
                    },
                ],
            });

            controller.execute();
            const results = await Promise.all([promise1, promise2]);

            expect(results[0].processedData.columns.map((c) => c[0])).toEqual([100]);
            expect(results[1].processedData.columns.map((c) => c[0])).toEqual([40]);
        });

        it('should extract scoped data for each request and not include given properties', async () => {
            const data1 = wrapRawData([{ valueProp1: 100 }, { valueProp1: 200 }, { valueProp1: 300 }]);
            const data2 = wrapRawData([{ valueProp1: 40 }, { valueProp1: 50 }, { valueProp1: 60 }]);

            const promise1 = controller.request('test1', data1, {
                props: [
                    {
                        id: 'valueProp1-key1',
                        property: 'valueProp1',
                        type: 'value',
                        valueType: 'category',
                    },
                    {
                        id: 'valueProp1-key2',
                        property: 'valueProp1',
                        type: 'value',
                        valueType: 'category',
                        includeProperty: false,
                        processor: () => (value: any) => `key2 ${value}`,
                    },
                ],
            });

            const promise2 = controller.request('test2', data2, {
                props: [
                    {
                        id: 'valueProp1-key1',
                        property: 'valueProp1',
                        type: 'value',
                        valueType: 'category',
                    },
                    {
                        id: 'valueProp1-key2',
                        property: 'valueProp1',
                        type: 'value',
                        valueType: 'category',
                        includeProperty: false,
                        processor: () => (value: any) => `key2 ${value}`,
                    },
                ],
            });

            controller.execute();
            const results = await Promise.all([promise1, promise2]);

            expect(results[0].processedData.columns.map((c) => c[0])).toEqual([100, 'key2 100']);
            expect(results[1].processedData.columns.map((c) => c[0])).toEqual([40, 'key2 40']);
        });

        it('should extract scoped grouped data and not leak scopes', async () => {
            const data1 = wrapRawData([
                { keyProp1: '2020', valueProp1: 100 },
                { keyProp1: '2021', valueProp1: 200 },
                { keyProp1: '2022', valueProp1: 300 },
            ]);
            const data2 = wrapRawData([
                { keyProp1: '2020', valueProp1: 40 },
                { keyProp1: '2021', valueProp1: 50 },
                { keyProp1: '2022', valueProp1: 60 },
            ]);

            const def = {
                groupByKeys: true,
                props: [
                    {
                        type: 'key',
                        property: 'keyProp1' as const,
                        valueType: 'category',
                    },
                    {
                        property: 'valueProp1' as const,
                        type: 'value',
                        valueType: 'range',
                        groupId: 'valueProp1',
                        id: undefined,
                    },
                ] satisfies DatumPropertyDefinition<any>[],
            };

            const promise1 = controller.request('test1', data1, def);
            const promise2 = controller.request('test2', data2, def);

            controller.execute();
            const results = await Promise.all([promise1, promise2]);

            expect(results[0].processedData.columns).toEqual([[100, 200, 300]]);
            expect(results[1].processedData.columns).toEqual([[40, 50, 60]]);
        });
    });

    describe('deepEqual', () => {
        it('should correctly compare primitive values', () => {
            expect(DataController.deepEqual(1, 1)).toBe(true);
            expect(DataController.deepEqual('test', 'test')).toBe(true);
            expect(DataController.deepEqual(true, false)).toBe(false);
        });

        it('should correctly compare arrays', () => {
            expect(DataController.deepEqual([1, 2, 3], [1, 2, 3])).toBe(true);
            expect(DataController.deepEqual(['a', 'b', 'c'], ['a', 'b', 'c'])).toBe(true);
            expect(DataController.deepEqual([1, 2, 3], [3, 2, 1])).toBe(false);
        });

        it('should correctly compare simple objects', () => {
            expect(DataController.deepEqual({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(true);
            expect(DataController.deepEqual({ a: 'test', b: 'check' }, { a: 'test', b: 'check' })).toBe(true);
            expect(DataController.deepEqual({ a: 1, b: 2 }, { a: 2, b: 1 })).toBe(false);
        });

        it('should correctly compare nested objects', () => {
            const obj1 = { a: 1, b: { c: 2, d: 3 } };
            const obj2 = { a: 1, b: { c: 2, d: 3 } };
            const obj3 = { a: 1, b: { c: 3, d: 2 } };
            expect(DataController.deepEqual(obj1, obj2)).toBe(true);
            expect(DataController.deepEqual(obj1, obj3)).toBe(false);
        });

        it('should correctly compare objects containing arrays', () => {
            const obj1 = { a: [1, 2, 3], b: 'test' };
            const obj2 = { a: [1, 2, 3], b: 'test' };
            const obj3 = { a: [3, 2, 1], b: 'test' };
            expect(DataController.deepEqual(obj1, obj2)).toBe(true);
            expect(DataController.deepEqual(obj1, obj3)).toBe(false);
        });

        it('should correctly ignore specified keys when comparing objects', () => {
            const obj1 = { id: 123, name: 'John', type: 'admin' };
            const obj2 = { id: 456, name: 'John', type: 'user' };
            expect(DataController.deepEqual(obj1, obj2)).toBe(true); // assuming id and type are in skipKeys
        });
    });

    describe('incremental updates', () => {
        const TEST_MODE: ChartMode = 'standalone';

        beforeEach(() => {
            controller = new DataController(TEST_MODE, false);
        });

        it('should process data without transactions normally', async () => {
            const dataRef: DataRef<{ x: number; y: number }> = {
                data: [
                    { x: 1, y: 10 },
                    { x: 2, y: 20 },
                ],
                pendingTransactions: [],
            };

            const opts: DataModelOptions<any, false> = {
                props: [
                    { type: 'key', property: 'x', valueType: 'category', scopes: ['test'] },
                    { type: 'value', property: 'y', valueType: 'range', scopes: ['test'] },
                ],
            };

            const resultPromise = controller.request('test', dataRef, opts);
            controller.execute();
            const result = await resultPromise;

            expect(result.processedData).toBeDefined();
            expect(result.processedData.input.count).toBe(2);
            expect(result.processedData.incremental).toBeUndefined();
        });

        it('should apply transactions incrementally when cache exists', async () => {
            const dataRef: DataRef<{ x: number; y: number }> = {
                data: [
                    { x: 1, y: 10 },
                    { x: 2, y: 20 },
                ],
                pendingTransactions: [],
            };

            const opts: DataModelOptions<any, false> = {
                props: [
                    { type: 'key', property: 'x', valueType: 'category', scopes: ['test'] },
                    { type: 'value', property: 'y', valueType: 'range', scopes: ['test'] },
                ],
            };

            // Initial request without transactions
            const result1Promise = controller.request('test', dataRef, opts);
            const cache1 = controller.execute();
            const result1 = await result1Promise;

            expect(result1.processedData.input.count).toBe(2);
            expect(result1.processedData.incremental).toBeUndefined();

            // Second request with transactions
            controller = new DataController(TEST_MODE, false);
            dataRef.pendingTransactions = [
                {
                    append: [
                        { x: 3, y: 30 },
                        { x: 4, y: 40 },
                    ],
                },
            ];

            const result2Promise = controller.request('test', dataRef, opts);
            controller.execute(cache1);
            const result2 = await result2Promise;

            expect(result2.processedData.input.count).toBe(4);
            expect(result2.processedData.incremental).toBeDefined();
            expect(result2.processedData.incremental?.baseDataSize).toBe(2);
            expect(result2.processedData.incremental?.addedRows).toEqual([2, 3]);
            expect(dataRef.pendingTransactions.length).toBe(0); // Should be cleared
        });

        it('should handle prepend transactions incrementally', async () => {
            const dataRef: DataRef<{ x: number; y: number }> = {
                data: [
                    { x: 1, y: 10 },
                    { x: 2, y: 20 },
                ],
                pendingTransactions: [],
            };

            const opts: DataModelOptions<any, false> = {
                props: [
                    { type: 'key', property: 'x', valueType: 'category', scopes: ['test'] },
                    { type: 'value', property: 'y', valueType: 'range', scopes: ['test'] },
                ],
            };

            const result1Promise = controller.request('test', dataRef, opts);
            const cache1 = controller.execute();
            await result1Promise;

            controller = new DataController(TEST_MODE, false);
            dataRef.pendingTransactions = [
                {
                    prepend: [
                        { x: 0, y: 5 },
                    ],
                },
            ];

            const result2Promise = controller.request('test', dataRef, opts);
            controller.execute(cache1);
            const result2 = await result2Promise;

            expect(result2.processedData.incremental).toBeDefined();
            expect(result2.processedData.input.count).toBe(3);

            const dataSource = result2.processedData.dataSources.get('test') as { x: number; y: number }[] | undefined;
            expect(dataSource?.[0]).toEqual({ x: 0, y: 5 });
            expect(dataRef.data[0]).toEqual({ x: 0, y: 5 });
            expect(result2.processedData.incremental?.prependedCount).toBe(1);
            expect(result2.processedData.incremental?.addedRows).toEqual([0]);
            expect(result2.processedData.incremental?.baseDataSize).toBe(2);
            expect(dataRef.pendingTransactions.length).toBe(0);
        });

        it('should track modified domains correctly', async () => {
            const dataRef: DataRef<{ x: string; y: number }> = {
                data: [
                    { x: 'A', y: 10 },
                    { x: 'B', y: 20 },
                ],
                pendingTransactions: [],
            };

            const opts: DataModelOptions<any, false> = {
                props: [
                    { type: 'key', property: 'x', valueType: 'category', scopes: ['test'] },
                    { type: 'value', property: 'y', valueType: 'range', scopes: ['test'] },
                ],
            };

            // Initial request
            const result1Promise = controller.request('test', dataRef, opts);
            const cache1 = controller.execute();
            await result1Promise;

            // Add data with new domain values
            controller = new DataController(TEST_MODE, false);
            dataRef.pendingTransactions = [
                {
                    append: [
                        { x: 'C', y: 30 }, // New x domain value
                        { x: 'D', y: 50 }, // New x domain value, new y range
                    ],
                },
            ];

            const result2Promise = controller.request('test', dataRef, opts);
            controller.execute(cache1);
            const result2 = await result2Promise;

            const incremental = result2.processedData.incremental;
            expect(incremental).toBeDefined();
            expect(incremental?.modifiedDomains.keys.length).toBeGreaterThan(0);
            expect(incremental?.modifiedDomains.values.length).toBeGreaterThan(0);
        });

        it('should handle multiple transactions in sequence', async () => {
            const dataRef: DataRef<{ x: number; y: number }> = {
                data: [{ x: 1, y: 10 }],
                pendingTransactions: [],
            };

            const opts: DataModelOptions<any, false> = {
                props: [
                    { type: 'key', property: 'x', valueType: 'category', scopes: ['test'] },
                    { type: 'value', property: 'y', valueType: 'range', scopes: ['test'] },
                ],
            };

            // Initial request
            const result1Promise = controller.request('test', dataRef, opts);
            const cache1 = controller.execute();
            const result1 = await result1Promise;

            expect(result1.processedData.input.count).toBe(1);

            // Add multiple transactions
            controller = new DataController(TEST_MODE, false);
            dataRef.pendingTransactions = [
                { append: [{ x: 2, y: 20 }] },
                {
                    append: [
                        { x: 3, y: 30 },
                        { x: 4, y: 40 },
                    ],
                },
            ];

            const result2Promise = controller.request('test', dataRef, opts);
            controller.execute(cache1);
            const result2 = await result2Promise;

            expect(result2.processedData.input.count).toBe(4);
            expect(result2.processedData.incremental?.addedRows).toEqual([1, 2, 3]);
        });

        it('should apply pending transactions when cache is not available', async () => {
            const dataRef: DataRef<{ x: number; y: number }> = {
                data: [
                    { x: 1, y: 10 },
                    { x: 2, y: 20 },
                ],
                pendingTransactions: [
                    {
                        append: [{ x: 3, y: 30 }],
                    },
                ],
            };

            const opts: DataModelOptions<any, false> = {
                props: [
                    { type: 'key', property: 'x', valueType: 'category', scopes: ['test'] },
                    { type: 'value', property: 'y', valueType: 'range', scopes: ['test'] },
                ],
            };

            // Request without cache (first time)
            const resultPromise = controller.request('test', dataRef, opts);
            controller.execute();
            const result = await resultPromise;

            // Should process base data plus pending transactions even without cache
            expect(result.processedData.input.count).toBe(3);
            expect(result.processedData.incremental).toBeUndefined();
        });
    });
});
