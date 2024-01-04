import { describe, expect, it } from '@jest/globals';

import { DataController } from './dataController';

describe('DataController', () => {
    let controller: DataController;
    let data: Record<string, number>[];

    beforeEach(() => {
        controller = new DataController('standalone');
        data = [];
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

        await controller.execute();
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

        await controller.execute();
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

        await controller.execute();
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
                    scopes: ['test1'],
                    id: 'keyProp1-key',
                    property: 'keyProp1',
                    type: 'key',
                    valueType: 'category',
                },
                {
                    scopes: ['test1'],
                    id: 'valueProp1-key',
                    property: 'valueProp1',
                    type: 'value',
                    valueType: 'range',
                },
                {
                    scopes: ['test1'],
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
                    scopes: ['test2'],
                    id: 'keyProp1-key',
                    property: 'keyProp1',
                    type: 'key',
                    valueType: 'category',
                },
                {
                    scopes: ['test2'],
                    id: 'valueProp1-key',
                    property: 'valueProp2',
                    type: 'value',
                    valueType: 'range',
                },
                {
                    scopes: ['test2'],
                    id: 'valueProp2-key',
                    property: 'valueProp1',
                    type: 'value',
                    valueType: 'range',
                },
            ],
        });

        await controller.execute();
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

        expect(results[0].processedData.defs.keys[0].ids).toHaveLength(2);
        expect(results[0].processedData.defs.keys[0].ids).toEqual([
            ['test1', 'keyProp1-key'],
            ['test2', 'keyProp1-key'],
        ]);

        expect(results[0].processedData.defs.values[0].ids).toHaveLength(2);
        expect(results[0].processedData.defs.values[0].ids).toEqual([
            ['test1', 'valueProp1-key'],
            ['test2', 'valueProp2-key'],
        ]);

        expect(results[0].processedData.defs.values[1].ids).toHaveLength(2);
        expect(results[0].processedData.defs.values[1].ids).toEqual([
            ['test1', 'valueProp2-key'],
            ['test2', 'valueProp1-key'],
        ]);
    });

    describe('with multiple data sources', () => {
        it('should extract scoped data for each request with shared scopes', async () => {
            const data1 = [
                { keyProp1: '2020', valueProp1: 100 },
                { keyProp1: '2021', valueProp1: 200 },
                { keyProp1: '2022', valueProp1: 300 },
            ];
            const data2 = [
                { keyProp1: '2020', valueProp1: 40 },
                { keyProp1: '2021', valueProp1: 50 },
                { keyProp1: '2022', valueProp1: 60 },
            ];

            const def = {
                props: [
                    {
                        scopes: ['test1', 'test2'],
                        id: 'keyProp1-key',
                        property: 'keyProp1',
                        type: 'key',
                        valueType: 'category',
                    },
                    {
                        scopes: ['test1', 'test2'],
                        id: 'valueProp1-key',
                        property: 'valueProp1',
                        type: 'value',
                        valueType: 'range',
                    },
                ],
            };

            const promise1 = controller.request('test1', data1, def);

            const promise2 = controller.request('test2', data2, def);

            await controller.execute();
            const results = await Promise.all([promise1, promise2]);

            expect(results[0].processedData.data[0].values).toEqual([100]);
            expect(results[1].processedData.data[0].values).toEqual([40]);
        });

        it('should extract scoped data for each request with unique scopes', async () => {
            const data1 = [
                { keyProp1: '2020', valueProp1: 100 },
                { keyProp1: '2021', valueProp1: 200 },
                { keyProp1: '2022', valueProp1: 300 },
            ];
            const data2 = [
                { keyProp1: '2020', valueProp1: 40 },
                { keyProp1: '2021', valueProp1: 50 },
                { keyProp1: '2022', valueProp1: 60 },
            ];

            const promise1 = controller.request('test1', data1, {
                props: [
                    {
                        scopes: ['test1'],
                        id: 'keyProp1-key',
                        property: 'keyProp1',
                        type: 'key',
                        valueType: 'category',
                    },
                    {
                        scopes: ['test1'],
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
                        scopes: ['test2'],
                        id: 'keyProp1-key',
                        property: 'keyProp1',
                        type: 'key',
                        valueType: 'category',
                    },
                    {
                        scopes: ['test2'],
                        id: 'valueProp1-key',
                        property: 'valueProp1',
                        type: 'value',
                        valueType: 'range',
                    },
                ],
            });

            await controller.execute();
            const results = await Promise.all([promise1, promise2]);

            expect(results[0].processedData.data[0].values).toEqual([100]);
            expect(results[1].processedData.data[0].values).toEqual([40]);
        });
    });
});
