import { describe, expect, it } from 'vitest';

import { testLogger } from 'ag-charts-test';

import { DataModel } from '../../dataModel';
import type { GroupByFn } from '../../dataModelTypes';
import { DataSet } from '../../dataSet';
import { categoryKey, categoryKeyAllowNull, scopedValue } from '../test/testUtils';

describe('DataGrouper', () => {
    describe('Column Batch Merging', () => {
        it('should merge batches with identical keys and invalidKeys', () => {
            const dataSet1 = new DataSet(
                [
                    { key: 1, valueA: 10 },
                    { key: 2, valueA: 20 },
                ],
                testLogger
            );

            const dataSet2 = new DataSet(
                [
                    { key: 1, valueB: 100 },
                    { key: 2, valueB: 200 },
                ],
                testLogger
            );

            const dataModel = new DataModel<any, any, true>(
                {
                    props: [
                        categoryKey('key', ['scope1']),
                        categoryKey('key', ['scope2']),
                        scopedValue('scope1', 'valueA'),
                        scopedValue('scope2', 'valueB'),
                    ],
                    groupByKeys: true,
                },
                testLogger
            );

            const data = new Map<string, DataSet<any>>([
                ['scope1', dataSet1],
                ['scope2', dataSet2],
            ]);

            const result = dataModel.processData(data);

            // Both scopes have the same keys [1, 2], so batches should be merged
            expect(result).toBeDefined();
            expect(result?.type).toBe('grouped');
            if (result?.type === 'grouped') {
                expect(result.groups).toHaveLength(2);
                // Verify that data from both scopes is present
                expect(result.groups[0].keys).toEqual([1]);
                expect(result.groups[1].keys).toEqual([2]);
            }
        });

        it('should not merge batches with different keys', () => {
            const dataSet1 = new DataSet(
                [
                    { key: 1, value: 10 },
                    { key: 2, value: 20 },
                ],
                testLogger
            );

            const dataSet2 = new DataSet(
                [
                    { key: 3, value: 30 },
                    { key: 4, value: 40 },
                ],
                testLogger
            );

            const dataModel = new DataModel<any, any, true>(
                {
                    props: [
                        categoryKey('key', ['scope1']),
                        categoryKey('key', ['scope2']),
                        scopedValue('scope1', 'value'),
                        scopedValue('scope2', 'value'),
                    ],
                    groupByKeys: true,
                },
                testLogger
            );

            const data = new Map<string, DataSet<any>>([
                ['scope1', dataSet1],
                ['scope2', dataSet2],
            ]);

            const result = dataModel.processData(data);

            // Different keys mean batches should NOT be merged
            expect(result).toBeDefined();
            expect(result?.type).toBe('grouped');
            if (result?.type === 'grouped') {
                // All 4 groups should be present
                expect(result.groups).toHaveLength(4);
            }
        });

        it('should handle edge case with undefined invalidData and invalidKeys', () => {
            const dataSet1 = new DataSet(
                [
                    { key: 1, value: 10 },
                    { key: 2, value: 20 },
                ],
                testLogger
            );

            const dataSet2 = new DataSet(
                [
                    { key: 1, value: 100 },
                    { key: 2, value: 200 },
                ],
                testLogger
            );

            const dataModel = new DataModel<any, any, true>(
                {
                    props: [
                        categoryKey('key', ['scope1']),
                        categoryKey('key', ['scope2']),
                        scopedValue('scope1', 'value'),
                        scopedValue('scope2', 'value'),
                    ],
                    groupByKeys: true,
                },
                testLogger
            );

            const data = new Map<string, DataSet<any>>([
                ['scope1', dataSet1],
                ['scope2', dataSet2],
            ]);

            const result = dataModel.processData(data);

            // All data is valid, so batches with same keys should merge cleanly
            expect(result).toBeDefined();
            expect(result?.type).toBe('grouped');
            if (result?.type === 'grouped') {
                expect(result.groups).toHaveLength(2);
                expect(result.groups[0].validScopes.size).toBeGreaterThan(0);
                expect(result.groups[1].validScopes.size).toBeGreaterThan(0);
            }
        });

        it('should merge batches with multiple columns per scope', () => {
            const dataSet1 = new DataSet(
                [
                    { key: 1, valueA1: 10, valueA2: 15 },
                    { key: 2, valueA1: 20, valueA2: 25 },
                ],
                testLogger
            );

            const dataSet2 = new DataSet(
                [
                    { key: 1, valueB1: 100, valueB2: 150 },
                    { key: 2, valueB1: 200, valueB2: 250 },
                ],
                testLogger
            );

            const dataModel = new DataModel<any, any, true>(
                {
                    props: [
                        categoryKey('key', ['scope1']),
                        categoryKey('key', ['scope2']),
                        scopedValue('scope1', 'valueA1'),
                        scopedValue('scope1', 'valueA2'),
                        scopedValue('scope2', 'valueB1'),
                        scopedValue('scope2', 'valueB2'),
                    ],
                    groupByKeys: true,
                },
                testLogger
            );

            const data = new Map<string, DataSet<any>>([
                ['scope1', dataSet1],
                ['scope2', dataSet2],
            ]);

            const result = dataModel.processData(data);

            expect(result).toBeDefined();
            expect(result?.type).toBe('grouped');
            if (result?.type === 'grouped') {
                expect(result.groups).toHaveLength(2);
                // All groups should have both scopes as valid
                for (const group of result.groups) {
                    expect(group.validScopes.has('scope1')).toBe(true);
                    expect(group.validScopes.has('scope2')).toBe(true);
                }
                // Verify column count (2 value columns per scope = 4 total)
                expect(result.columns).toHaveLength(4);
            }
        });
    });

    describe('Group key equality', () => {
        type Summary = { keys: unknown[]; count: number };

        // Groups by the single key `k`, via a grouping function (one scope) or across two scopes (no function).
        const summarise = (rows: { k: unknown }[], mode: 'function' | 'scopes'): Summary[] => {
            const scopes = mode === 'function' ? ['s1'] : ['s1', 's2'];
            const groupByFn: GroupByFn | undefined = mode === 'function' ? () => (keys) => [keys[0]] : undefined;
            const dataModel = new DataModel<any, any, true>(
                {
                    props: [
                        ...scopes.map((scope) => categoryKeyAllowNull('k', [scope])),
                        ...scopes.map((scope) => scopedValue(scope, 'v')),
                    ],
                    groupByKeys: mode === 'scopes' ? true : undefined,
                    groupByFn,
                },
                testLogger
            );
            const data = new Map(
                scopes.map((scope) => [
                    scope,
                    new DataSet(
                        rows.map((r) => ({ ...r, v: 1 })),
                        testLogger
                    ),
                ])
            );

            const result = dataModel.processData(data);
            if (result?.type !== 'grouped') throw new Error('expected grouped data');

            return result.groups.map((g, i) => ({
                keys: result.domain.groups![i],
                count: g.datumIndices[0].length,
            }));
        };

        const cases: [string, unknown[], Summary[]][] = [
            [
                'numbers',
                [1, 2, 1, 3, 2, 1],
                [
                    { keys: [1], count: 3 },
                    { keys: [2], count: 2 },
                    { keys: [3], count: 1 },
                ],
            ],
            [
                'strings',
                ['a', 'b', 'a'],
                [
                    { keys: ['a'], count: 2 },
                    { keys: ['b'], count: 1 },
                ],
            ],
            [
                'Dates of equal time',
                [new Date(1000), new Date(2000), new Date(1000), new Date(1000)],
                [
                    { keys: [new Date(1000)], count: 3 },
                    { keys: [new Date(2000)], count: 1 },
                ],
            ],
            [
                'a Date and its ISO string',
                [new Date(1000), '1970-01-01T00:00:01.000Z', new Date(1000)],
                [
                    { keys: [new Date(1000)], count: 2 },
                    { keys: ['1970-01-01T00:00:01.000Z'], count: 1 },
                ],
            ],
            [
                'a Date and a number of the same time',
                [new Date(1000), 1000, new Date(1000), 1000],
                [
                    { keys: [new Date(1000)], count: 2 },
                    { keys: [1000], count: 2 },
                ],
            ],
            [
                'bigints',
                [1n, 2n, 1n],
                [
                    { keys: [1n], count: 2 },
                    { keys: [2n], count: 1 },
                ],
            ],
            [
                'a number and a bigint of the same value',
                [5, 5n, 6, 5],
                [
                    { keys: [5], count: 3 },
                    { keys: [6], count: 1 },
                ],
            ],
            [
                'a number and a string of the same value',
                [5, '5', 6, '5'],
                [
                    { keys: [5], count: 3 },
                    { keys: [6], count: 1 },
                ],
            ],
            [
                'positive and negative zero',
                [0, -0, 1],
                [
                    { keys: [0], count: 2 },
                    { keys: [1], count: 1 },
                ],
            ],
            [
                'null, undefined and their literal strings',
                [null, undefined, 'null', 'undefined', null, undefined, 'null'],
                [
                    { keys: [null], count: 2 },
                    { keys: [undefined], count: 2 },
                    { keys: ['null'], count: 2 },
                    { keys: ['undefined'], count: 1 },
                ],
            ],
            [
                'primitives followed by objects',
                [1, 2, { a: 1 }, 1, { a: 1 }, 2],
                [
                    { keys: [1], count: 2 },
                    { keys: [2], count: 2 },
                    { keys: [{ a: 1 }], count: 2 },
                ],
            ],
        ];

        describe.each(['function', 'scopes'] as const)('with %s grouping', (mode) => {
            it.each(cases)('should group %s as its string form does', (_name, keys, expected) => {
                const summary = summarise(
                    keys.map((k) => ({ k })),
                    mode
                );

                expect(summary).toEqual(expected);
            });
        });
    });
});
