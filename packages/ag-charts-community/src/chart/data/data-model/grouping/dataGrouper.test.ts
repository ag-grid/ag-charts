import { describe, expect, it } from 'vitest';

import { testLogger } from 'ag-charts-test';

import { expectWarningsCalls, setupMockConsole } from '../../../test/utils';
import { DataModel } from '../../dataModel';
import type { GroupByFn } from '../../dataModelTypes';
import { DataSet } from '../../dataSet';
import { categoryKey, categoryKeyAllowNull, scopedValue } from '../test/testUtils';
import { toKeyString } from '../utils/helpers';

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

    describe('Group keys against the toKeyString reference', () => {
        setupMockConsole();

        type Summary = { keys: unknown[]; indices: number[] };

        // The reference: one group per distinct `toKeyString`, in first-seen order, with absolute datum indices.
        const referenceGroups = (tuples: unknown[][]): Summary[] => {
            const byString = new Map<string, Summary>();
            for (const [datumIndex, keys] of tuples.entries()) {
                const str = toKeyString(keys);
                const existing = byString.get(str);
                if (existing == null) {
                    byString.set(str, { keys, indices: [datumIndex] });
                } else {
                    existing.indices.push(datumIndex);
                }
            }
            return [...byString.values()];
        };

        // Deterministic pseudo-random sequence so a failure reproduces.
        const sequence = <T>(pool: T[], length: number, seed: number): T[] => {
            let state = seed;
            return Array.from({ length }, () => {
                state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
                return pool[state % pool.length];
            });
        };

        // How the group is produced: the grouping function returns the (reused) `keys` array itself, a copy of it,
        // or there is no function and the data model groups two scopes by their keys.
        type Mode = 'returns keys' | 'returns copy' | 'two scopes';
        const modes: Mode[] = ['returns keys', 'returns copy', 'two scopes'];

        const group = (tuples: unknown[][], mode: Mode): Summary[] => {
            const keyCount = tuples[0].length;
            const keyProps = Array.from({ length: keyCount }, (_, i) => `k${i}`);
            const scopes = mode === 'two scopes' ? ['s1', 's2'] : ['s1'];
            const groupByFns: Record<Mode, GroupByFn | undefined> = {
                'returns keys': () => (keys) => keys,
                'returns copy': () => (keys) => [...keys],
                'two scopes': undefined,
            };
            const groupByFn = groupByFns[mode];
            const dataModel = new DataModel<any, any, true>(
                {
                    props: [
                        ...keyProps.flatMap((prop) => scopes.map((scope) => categoryKeyAllowNull(prop, [scope]))),
                        ...scopes.map((scope) => scopedValue(scope, 'v')),
                    ],
                    groupByKeys: mode === 'two scopes' ? true : undefined,
                    groupByFn,
                },
                testLogger
            );
            const rows = tuples.map((keys) => ({
                ...Object.fromEntries(keys.map((key, i) => [keyProps[i], key])),
                v: 1,
            }));
            const data = new Map(scopes.map((scope) => [scope, new DataSet(rows, testLogger)]));

            const result = dataModel.processData(data);
            if (result?.type !== 'grouped') throw new Error('expected grouped data');

            return result.groups.map((g, groupIndex) => ({
                keys: result.domain.groups![groupIndex],
                indices: g.datumIndices[0].map((relative) => groupIndex + relative),
            }));
        };

        const ints = (n: number) => Array.from({ length: n }, (_, i) => i);

        const homogeneous: [string, () => unknown[]][] = [
            ['numbers', () => sequence(ints(40), 300, 1)],
            ['strings', () => sequence(ints(40), 300, 2).map((i) => `key-${i}`)],
            ['bigints', () => sequence(ints(40), 300, 3).map((i) => BigInt(i) * 10n ** 18n)],
            ['fresh Date instances', () => sequence(ints(40), 300, 4).map((i) => new Date(i * 86400000))],
            [
                'negative and fractional numbers',
                () => sequence([-1.5, -1, 0, 0.1, 0.2, 0.1 + 0.2, 1e21, 2 ** 53], 100, 5),
            ],
        ];

        describe.each(modes)('with a grouping that %s', (mode) => {
            it.each(homogeneous)('should group %s as toKeyString does', (_name, makeKeys) => {
                const tuples = makeKeys().map((key) => [key]);

                expect(group(tuples, mode)).toEqual(referenceGroups(tuples));
            });

            // Keys of different kinds that share a string form (`5`, `5n`, `'5'`; a `Date` and its quoted ISO string)
            // must still share a group, wherever in the sequence the kinds change.
            const mixedPool: unknown[] = [
                1,
                '1',
                1n,
                new Date(1),
                JSON.stringify(new Date(1)),
                2,
                '2',
                2n,
                new Date(2),
                null,
                undefined,
                'null',
                'undefined',
                0,
                -0,
                '',
                { a: 1 },
                [1, 2],
            ];

            it.each([11, 22, 33, 44, 55, 66])(
                'should group a mixed-kind sequence (seed %i) as toKeyString does',
                (seed) => {
                    const tuples = sequence(mixedPool, 80, seed).map((key) => [key]);

                    expect(group(tuples, mode)).toEqual(referenceGroups(tuples));
                }
            );

            it('should join a later key of another kind to the group of an earlier one with the same string', () => {
                // 50 numeric groups, then keys of other kinds whose string form equals an existing group's.
                const keys = [...ints(50), ...ints(50), '7', 7n, '50', 7, 50n, new Date(7)];
                const tuples = keys.map((key) => [key]);

                const grouped = group(tuples, mode);

                expect(grouped).toEqual(referenceGroups(tuples));
                // `'7'`, `7n` and `7` are in the group of the first `7`; `'50'` and `50n` start one group that holds both.
                expect(grouped.find((g) => g.keys[0] === 7)!.indices).toEqual([7, 57, 100, 101, 103]);
                expect(grouped.find((g) => g.keys[0] === '50')!.indices).toEqual([102, 104]);
                expect(grouped).toHaveLength(52);
            });

            it('should group a sequence that starts with a non-primitive key as toKeyString does', () => {
                const tuples = [[{ a: 1 }], [1], [1], [{ a: 1 }], ['1'], [null], [1n]];

                expect(group(tuples, mode)).toEqual(referenceGroups(tuples));
            });

            it.each([
                ['numbers', [1, 2, 3]],
                ['strings', ['a', 'b', 'c']],
                ['Dates', [new Date(1), new Date(2), new Date(3)]],
            ])('should give each group its own keys array for %s', (_name, keys) => {
                const tuples = [...keys, ...keys, ...keys].map((key) => [key]);

                const grouped = group(tuples, mode);
                const arrays = grouped.map((g) => g.keys);

                // A reused scratch array would leave every group holding the last datum's keys.
                expect(arrays).toEqual(keys.map((key) => [key]));
                expect(new Set(arrays).size).toBe(3);
            });
        });

        describe.each(['returns keys', 'returns copy'] as const)(
            'with two key columns and a grouping that %s',
            (mode) => {
                it('should group tuples as toKeyString does', () => {
                    const xs = [1, '1', new Date(1), 1n, null, undefined, 'a'];
                    const ys = ['a', 1, 'a-1', null, undefined, new Date(1), 2n];
                    const tuples = sequence(xs, 120, 7).map((x, i) => [x, ys[(i * 7 + (i >> 2)) % ys.length]]);

                    expect(group(tuples, mode)).toEqual(referenceGroups(tuples));
                });

                it('should not join tuples whose parts differ, even where the first parts are equal', () => {
                    const tuples = [
                        [1, 'a'],
                        [1, 'b'],
                        [1, 'a'],
                        [new Date(1), 'a'],
                        [new Date(1), 'a'],
                    ];

                    const grouped = group(tuples, mode);

                    expect(grouped).toEqual([
                        { keys: [1, 'a'], indices: [0, 2] },
                        { keys: [1, 'b'], indices: [1] },
                        { keys: [new Date(1), 'a'], indices: [3, 4] },
                    ]);
                });
            }
        );

        describe('with a grouping function that returns a bin for the key', () => {
            // The shape of a histogram: shared `[min, max]` bin arrays, and a fresh empty array for datums out of range.
            const bins = [
                [0, 10],
                [10, 20],
                [20, 30],
            ];
            const binOf = (keys: unknown[]) => {
                const x = keys[0] instanceof Date ? keys[0].getTime() : keys[0];
                return bins.find(([min, max]) => typeof x === 'number' && x >= min && x < max) ?? [];
            };

            it.each([
                ['numbers', (n: number) => n],
                ['Dates', (n: number) => new Date(n)],
            ])('should group %s by bin, with out-of-range datums in one empty-keyed group', (_name, toKey) => {
                const xs = [3, 12, 25, 3, 40, 14, -5, 29, 40, 0, 10];
                const dataModel = new DataModel<any, any, true>(
                    { props: [categoryKey('x'), scopedValue('test', 'v')], groupByFn: () => binOf },
                    testLogger
                );
                const data = new Map([
                    [
                        'test',
                        new DataSet(
                            xs.map((x) => ({ x: toKey(x), v: 1 })),
                            testLogger
                        ),
                    ],
                ]);

                const result = dataModel.processData(data);
                if (result?.type !== 'grouped') throw new Error('expected grouped data');

                expect(result.domain.groups).toEqual([[0, 10], [10, 20], [20, 30], []]);
                const indices = result.groups.map((g, groupIndex) => g.datumIndices[0].map((r) => groupIndex + r));
                expect(indices).toEqual([
                    [0, 3, 9],
                    [1, 5, 10],
                    [2, 7],
                    [4, 6, 8],
                ]);
            });
        });

        describe('with scopes that differ', () => {
            const rowsFor = (scopeRows: Record<string, unknown>[]) => new DataSet(scopeRows, testLogger);

            it('should group equal Dates from different scopes and report which scopes hold valid data', () => {
                const dataModel = new DataModel<any, any, true>(
                    {
                        props: [
                            categoryKeyAllowNull('k', ['s1']),
                            categoryKeyAllowNull('k', ['s2']),
                            { ...scopedValue('s1', 'v'), validation: (v: unknown) => typeof v === 'number' },
                            scopedValue('s2', 'v'),
                        ],
                        groupByKeys: true,
                    },
                    testLogger
                );
                const data = new Map([
                    [
                        's1',
                        rowsFor([
                            { k: new Date(1000), v: 1 },
                            { k: new Date(2000), v: 'not a number' },
                            { k: new Date(3000), v: 3 },
                        ]),
                    ],
                    [
                        's2',
                        rowsFor([
                            { k: new Date(2000), v: 20 },
                            { k: new Date(1000), v: 10 },
                            { k: new Date(4000), v: 40 },
                        ]),
                    ],
                ]);

                const result = dataModel.processData(data);
                if (result?.type !== 'grouped') throw new Error('expected grouped data');

                expect(result.domain.groups).toEqual([
                    [new Date(1000)],
                    [new Date(2000)],
                    [new Date(3000)],
                    [new Date(4000)],
                ]);
                expectWarningsCalls().toEqual([
                    ['AG Charts - invalid value of type [string] for [s1 / undefined] ignored:', '[not a number]'],
                ]);
                expect(result.groups.map((g) => [...g.validScopes].sort((a, b) => a.localeCompare(b)))).toEqual([
                    ['s1', 's2'],
                    ['s2'],
                    ['s1', 's2'],
                    ['s1', 's2'],
                ]);
            });

            it('should group a single-key scope with a two-key scope by their string forms', () => {
                // `['1-2']` and `[1, 2]` share the string `1-2`, so they are one group, as they are today.
                const dataModel = new DataModel<any, any, true>(
                    {
                        props: [
                            categoryKeyAllowNull('a', ['s1', 's2']),
                            categoryKeyAllowNull('b', ['s2']),
                            scopedValue('s1', 'v'),
                            scopedValue('s2', 'v'),
                        ],
                        groupByKeys: true,
                    },
                    testLogger
                );
                const data = new Map([
                    [
                        's1',
                        rowsFor([
                            { a: 1, v: 1 },
                            { a: '1-2', v: 2 },
                            { a: 2, v: 3 },
                        ]),
                    ],
                    [
                        's2',
                        rowsFor([
                            { a: 1, b: 2, v: 4 },
                            { a: 3, b: 4, v: 5 },
                            { a: 1, b: 2, v: 6 },
                        ]),
                    ],
                ]);

                const result = dataModel.processData(data);
                if (result?.type !== 'grouped') throw new Error('expected grouped data');

                expect(result.domain.groups).toEqual([[1], ['1-2'], [2], [3, 4]]);
                // Column 0 is s1's `v` and column 1 is s2's; both are indexed by each scope's own datum index.
                const columnOf = (column: number) =>
                    result.groups.map((g, groupIndex) => g.datumIndices[column]?.map((r) => groupIndex + r));
                expect(columnOf(0)).toEqual([[0], [1], [2], undefined]);
                expect(columnOf(1)).toEqual([undefined, [0, 2], undefined, [1]]);
            });
        });
    });
});
