import { beforeEach, describe, expect, it } from '@jest/globals';

import { DataController } from './dataController';
import type { DataModelOptions, DatumPropertyDefinition } from './dataModel';
import { DataRef, wrapRawData } from './dataRef';

describe('DataController', () => {
    let controller: DataController;
    let data: DataRef<Record<string, number>>;

    beforeEach(() => {
        controller = new DataController('standalone', false);
        data = DataRef.empty();
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
        const promise1 = controller.request('test1', data.data, def);
        const promise2 = controller.request('test2', data.data, def);

        controller.execute();
        const results = await Promise.all([promise1, promise2]);

        expect(results[0]).toEqual(results[1]);
        expect(results[0].processedData.defs.keys).toHaveLength(1);
        expect(results[0].processedData.defs.values).toHaveLength(1);
    });

    it('rejects invalid transaction shapes during preview', async () => {
        const transactionalData = wrapRawData([{ valueProp1: 100 }]);
        transactionalData.pendingTransactions.push({ append: 42 as any });

        const promise = controller.request('preview-test', transactionalData?.data ?? [], {
            props: [
                {
                    id: 'valueProp1-key',
                    property: 'valueProp1',
                    type: 'value',
                    valueType: 'range',
                },
            ],
        });

        controller.execute();

        await expect(promise).rejects.toThrow('AG Charts - data transaction "append" must be an array.');
        expect(transactionalData.pendingTransactions).toHaveLength(1);
    });

    it('should merge compatible requests with different ids', async () => {
        const promise1 = controller.request('test1', data.data, {
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

        const promise2 = controller.request('test2', data.data, {
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
        const promise1 = controller.request('test1', data.data, {
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

        const promise2 = controller.request('test2', data.data, {
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
        const promise1 = controller.request('test1', data.data, {
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

        const promise2 = controller.request('test2', data.data, {
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

        const promise1 = controller.request('test1', data?.data ?? [], {
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

            const promise1 = controller.request('test1', data1?.data ?? [], def);
            const promise2 = controller.request('test2', data2?.data ?? [], def);

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

            const promise1 = controller.request('test1', data1?.data ?? [], {
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

            const promise2 = controller.request('test2', data2?.data ?? [], {
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

            const promise1 = controller.request('test1', data1?.data ?? [], {
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

            const promise2 = controller.request('test2', data2?.data ?? [], {
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

            const promise1 = controller.request('test1', data1?.data ?? [], def);
            const promise2 = controller.request('test2', data2?.data ?? [], def);

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
});
