import { describe, expect, it } from '@jest/globals';

import { DATA_BROWSER_MARKET_SHARE } from '../test/data';
import * as examples from '../test/examples';
import { expectWarningsCalls, setupMockConsole } from '../test/utils';
import {
    accumulatedGroupValues,
    accumulatedPropertyValue,
    area,
    basicDataSet,
    categoryKey,
    categoryValue,
    expectedKeys,
    extractGroupValues,
    groupAverage,
    groupCount,
    normaliseGroupTo,
    normalisePropertyTo,
    range,
    rangeKey,
    resolveGroupColumn,
    rowCountProperty,
    scopedValue,
    sum,
    value,
    verifyReprocessMatchesBaseline,
} from './data-model/test/testUtils';
import type { GroupByFn } from './dataModel';
import { DataModel, KEY_SORT_ORDERS, getPathComponents } from './dataModel';
import { DataSet } from './dataSet';
import { SMALLEST_KEY_INTERVAL, SORT_DOMAIN_GROUPS, rangedValueProperty } from './processors';

describe('DataModel', () => {
    setupMockConsole();

    describe('ungrouped processing', () => {
        it('should generated the expected results', () => {
            const data = basicDataSet(examples.SIMPLE_LINE_CHART_EXAMPLE.data ?? []);
            const dataModel = new DataModel<any, any>({
                props: [rangeKey('date'), value('petrol'), value('diesel')],
            });

            expect(dataModel.processData(data)).toMatchSnapshot({
                time: expect.any(Number),
                version: expect.any(Number),
                optimizations: expect.any(Object),
            });
        });

        describe('property tests', () => {
            describe('simple data', () => {
                const dataModel = new DataModel<any, any>({
                    props: [rangeKey('kp'), value('vp1'), value('vp2'), SMALLEST_KEY_INTERVAL],
                });
                const data = basicDataSet([
                    { kp: 2, vp1: 5, vp2: 7 },
                    { kp: 3, vp1: 1, vp2: 2 },
                    { kp: 4, vp1: 6, vp2: 9 },
                ]);

                it('should extract the configured keys', () => {
                    const result = dataModel.processData(data)!;

                    expect(result.type).toEqual('ungrouped');
                    expect(result.keys).toEqual(expectedKeys([2, 3, 4]));
                });

                it('should extract the configured values', () => {
                    const result = dataModel.processData(data)!;

                    expect(result.type).toEqual('ungrouped');
                    expect(result.columns).toEqual([
                        [5, 1, 6],
                        [7, 2, 9],
                    ]);
                });

                it('should calculate the domains', () => {
                    const result = dataModel.processData(data)!;

                    expect(result.type).toEqual('ungrouped');
                    expect(result.domain.keys).toEqual([[2, 4]]);
                    expect(result.domain.values).toEqual([
                        [1, 6],
                        [2, 9],
                    ]);
                });

                it('should calculate smallest X interval', () => {
                    const result = dataModel.processData(data)!;

                    expect(result.reduced?.smallestKeyInterval).toEqual(1);
                });
            });

            describe('category data', () => {
                const dataModel = new DataModel<any, any, false>({
                    props: [categoryKey('kp'), value('vp1'), value('vp2')],
                    groupByKeys: false,
                });
                const data = basicDataSet([
                    { kp: 'Q1', vp1: 5, vp2: 7 },
                    { kp: 'Q1', vp1: 1, vp2: 2 },
                    { kp: 'Q2', vp1: 6, vp2: 9 },
                    { kp: 'Q2', vp1: 6, vp2: 9 },
                ]);

                it('should extract the configured keys', () => {
                    const result = dataModel.processData(data)!;

                    expect(result.type).toEqual('ungrouped');
                    expect(result.keys).toEqual(expectedKeys(['Q1', 'Q1', 'Q2', 'Q2']));
                });

                it('should extract the configured values', () => {
                    const result = dataModel.processData(data)!;

                    expect(result.type).toEqual('ungrouped');
                    expect(result.columns[0]).toHaveLength(4);
                    expect(result.columns).toEqual([
                        [5, 1, 6, 6],
                        [7, 2, 9, 9],
                    ]);
                });
            });

            describe('category data with toString()', () => {
                const dataModel = new DataModel<any, any, false>({
                    props: [categoryKey('kp'), value('vp1'), value('vp2')],
                    groupByKeys: false,
                });
                const dataSet = [
                    { kp: { toString: () => 'Q1' }, vp1: 5, vp2: 7 },
                    { kp: { toString: () => 'Q1' }, vp1: 1, vp2: 2 },
                    { kp: { toString: () => 'Q2' }, vp1: 6, vp2: 9 },
                    { kp: { toString: () => 'Q2' }, vp1: 6, vp2: 9 },
                ];
                const data = basicDataSet(dataSet);

                it('should extract the configured keys', () => {
                    const result = dataModel.processData(data)!;

                    expect(result.type).toEqual('ungrouped');
                    expect(result.keys).toEqual(
                        expectedKeys([dataSet[0].kp, dataSet[1].kp, dataSet[2].kp, dataSet[3].kp])
                    );
                });

                it('should extract the configured values', () => {
                    const result = dataModel.processData(data)!;

                    expect(result.type).toEqual('ungrouped');
                    expect(result.columns).toEqual([
                        [5, 1, 6, 6],
                        [7, 2, 9, 9],
                    ]);
                });
            });
        });
    });

    describe('ungrouped processing - accumulated and normalised properties', () => {
        it('should generated the expected results', () => {
            const data = basicDataSet(examples.SIMPLE_PIE_CHART_EXAMPLE.series?.[0].data ?? []);
            const dataModel = new DataModel<any, any>({
                props: [
                    accumulatedPropertyValue('population'),
                    categoryValue('religion'),
                    value('population'),
                    normalisePropertyTo('population', [0, 2 * Math.PI]),
                ],
            });

            expect(dataModel.processData(data)).toMatchSnapshot({
                time: expect.any(Number),
                version: expect.any(Number),
                optimizations: expect.any(Object),
            });
        });

        describe('property tests', () => {
            describe('simple data', () => {
                const dataModel = new DataModel<any, any>({
                    props: [
                        rangeKey('kp'),
                        accumulatedPropertyValue('vp1'),
                        accumulatedPropertyValue('vp2'),
                        value('vp3'),
                        normalisePropertyTo('vp1', [0, 100]),
                    ],
                });
                const data = basicDataSet([
                    { kp: 2, vp1: 5, vp2: 7, vp3: 1 },
                    { kp: 3, vp1: 1, vp2: -5, vp3: 2 },
                    { kp: 4, vp1: 6, vp2: 9, vp3: 3 },
                ]);

                it('should extract the configured keys', () => {
                    const result = dataModel.processData(data)!;

                    expect(result.type).toEqual('ungrouped');
                    expect(result.keys).toEqual(expectedKeys([2, 3, 4]));
                });

                it('should extract the configured values', () => {
                    const result = dataModel.processData(data)!;

                    expect(result.type).toEqual('ungrouped');
                    expect(result.columns).toHaveLength(3);
                    expect(result.columns).toEqual([
                        [0, 14.285714285714285, 100],
                        [7, 7, 16],
                        [1, 2, 3],
                    ]);
                });

                it('should calculate the domains', () => {
                    const result = dataModel.processData(data)!;

                    expect(result.type).toEqual('ungrouped');
                    expect(result.domain.keys).toEqual([[2, 4]]);
                    expect(result.domain.values).toEqual([
                        [0, 100],
                        [7, 16],
                        [1, 3],
                    ]);
                });
            });

            describe('category data', () => {
                const dataModel = new DataModel<any, any, false>({
                    props: [categoryKey('kp'), value('vp1'), value('vp2')],
                    groupByKeys: false,
                });
                const data = basicDataSet([
                    { kp: 'Q1', vp1: 5, vp2: 7 },
                    { kp: 'Q1', vp1: 1, vp2: 2 },
                    { kp: 'Q2', vp1: 6, vp2: 9 },
                    { kp: 'Q2', vp1: 6, vp2: 9 },
                ]);

                it('should extract the configured keys', () => {
                    const result = dataModel.processData(data)!;

                    expect(result.type).toEqual('ungrouped');
                    expect(result.keys).toEqual(expectedKeys(['Q1', 'Q1', 'Q2', 'Q2']));
                });

                it('should extract the configured values', () => {
                    const result = dataModel.processData(data)!;

                    expect(result.type).toEqual('ungrouped');
                    expect(result.columns).toHaveLength(2);
                    expect(result.columns).toEqual([
                        [5, 1, 6, 6],
                        [7, 2, 9, 9],
                    ]);
                });
            });
        });
    });

    describe('grouped processing - grouped example', () => {
        it('should generated the expected results', () => {
            const data = basicDataSet(examples.GROUPED_BAR_CHART_EXAMPLE.data ?? []);
            const dataModel = new DataModel<any, any, true>({
                props: [categoryKey('type'), value('total', 'all'), value('regular', 'all'), sum('all')],
                groupByKeys: true,
            });

            expect(dataModel.processData(data)).toMatchSnapshot({
                time: expect.any(Number),
                version: expect.any(Number),
                optimizations: expect.any(Object),
            });
        });

        describe('property tests', () => {
            const dataModel = new DataModel<any, any, true>({
                props: [categoryKey('kp'), value('vp1'), value('vp2')],
                groupByKeys: true,
            });
            const data = basicDataSet([
                { kp: 'Q1', vp1: 5, vp2: 7 },
                { kp: 'Q1', vp1: 1, vp2: 2 },
                { kp: 'Q2', vp1: 6, vp2: 9 },
                { kp: 'Q2', vp1: 6, vp2: 9 },
            ]);

            it('should extract the configured keys', () => {
                const result = dataModel.processData(data)!;

                expect(result.type).toEqual('grouped');
                expect(result.groups).toHaveLength(4);
                expect(result.groups[0].keys).toEqual(['Q1']);
                expect(result.groups[1].keys).toEqual(['Q1']);
                expect(result.groups[2].keys).toEqual(['Q2']);
                expect(result.groups[3].keys).toEqual(['Q2']);
            });

            it('should extract the configured values', () => {
                const result = dataModel.processData(data)!;

                expect(result.type).toEqual('grouped');
                expect(result.groups).toHaveLength(4);
                expect(result.groups[0].datumIndices).toEqual([[0], [0]]);
                expect(result.groups[1].datumIndices).toEqual([[0], [0]]);
                expect(result.groups[2].datumIndices).toEqual([[0], [0]]);
                expect(result.groups[3].datumIndices).toEqual([[0], [0]]);
                expect(resolveGroupColumn(result, 0, 0)).toEqual([5]);
                expect(resolveGroupColumn(result, 1, 0)).toEqual([1]);
                expect(resolveGroupColumn(result, 2, 0)).toEqual([6]);
                expect(resolveGroupColumn(result, 3, 0)).toEqual([6]);
            });

            it('should calculate the domains', () => {
                const result = dataModel.processData(data)!;

                expect(result.type).toEqual('grouped');
                expect(result.domain.keys).toEqual([['Q1', 'Q2']]);
                expect(result.domain.values).toEqual([
                    [1, 6],
                    [2, 9],
                ]);
            });

            it('should not include sums', () => {
                const result = dataModel.processData(data)!;

                expect(result.groups.filter((g) => g.aggregation.length !== 0)).toHaveLength(0);
                expect(result.domain.aggValues).toBeUndefined();
            });

            it('should only sum per data-item', () => {
                const dataModel2 = new DataModel<any, any, true>({
                    props: [categoryKey('kp'), value('vp1', 'all'), value('vp2', 'all'), sum('all')],
                    groupByKeys: true,
                });
                const data2 = basicDataSet([
                    { kp: 'Q1', vp1: 5, vp2: 7 },
                    { kp: 'Q1', vp1: 1, vp2: 2 },
                    { kp: 'Q2', vp1: 6, vp2: 9 },
                    { kp: 'Q2', vp1: 6, vp2: 9 },
                ]);

                const result = dataModel2.processData(data2)!;

                expect(result.domain.aggValues).toEqual([[0, expect.closeTo(15)]]);
                expect(result.groups[0].aggregation).toEqual([[0, expect.closeTo(12)]]);
                expect(result.groups[1].aggregation).toEqual([[0, expect.closeTo(3)]]);
                expect(result.groups[2].aggregation).toEqual([[0, expect.closeTo(15)]]);
                expect(result.groups[3].aggregation).toEqual([[0, expect.closeTo(15)]]);
            });

            it('should ignore missing scoped values when aggregating', () => {
                const raggedModel = new DataModel<any, any, true>({
                    props: [
                        categoryKey('key', ['left', 'right']),
                        scopedValue('left', 'value', 'shared'),
                        scopedValue('right', 'value', 'shared'),
                        sum('shared'),
                    ],
                    groupByKeys: true,
                });

                const sources = new Map<string, DataSet<any>>([
                    [
                        'left',
                        new DataSet([
                            { key: 'A', value: 1 },
                            { key: 'B', value: 2 },
                            { key: 'C', value: 3 },
                        ]),
                    ],
                    [
                        'right',
                        new DataSet([
                            { key: 'A', value: 10 },
                            { key: 'B', value: 20 },
                            { key: 'D', value: 40 },
                        ]),
                    ],
                ]);

                const result = raggedModel.processData(sources)!;

                expect(result.type).toEqual('grouped');
                expect(result.groups.map((group) => group.keys[0])).toEqual(['A', 'B', 'C', 'D']);
                expect(result.groups.map((group) => group.aggregation[0])).toEqual([
                    [0, 11],
                    [0, 22],
                    [0, 3],
                    [0, 40],
                ]);
            });
        });
    });

    describe('grouped processing - category objects', () => {
        describe('property tests', () => {
            const dataModel = new DataModel<any, any, true>({
                props: [categoryKey('kp'), value('vp1'), value('vp2')],
                groupByKeys: true,
            });
            const dataSet = [
                { kp: { id: 1, q: 'Q1' }, vp1: 5, vp2: 7 },
                { kp: { id: 2, q: 'Q1' }, vp1: 1, vp2: 2 },
                { kp: { id: 3, q: 'Q2' }, vp1: 6, vp2: 9 },
                { kp: { id: 4, q: 'Q2' }, vp1: 6, vp2: 9 },
            ];
            const data = basicDataSet(dataSet);

            it('should extract the configured keys', () => {
                const result = dataModel.processData(data)!;

                expect(result.type).toEqual('grouped');
                expect(result.groups).toHaveLength(4);
                expect(result.groups.map((d) => d.keys[0])).toEqual(dataSet.map((d: any) => d.kp));
            });

            it('should extract the configured values', () => {
                const result = dataModel.processData(data)!;

                expect(result.type).toEqual('grouped');
                expect(result.groups).toHaveLength(4);
                expect(resolveGroupColumn(result, 0, 0)).toEqual([5]);
                expect(resolveGroupColumn(result, 0, 1)).toEqual([7]);
                expect(resolveGroupColumn(result, 1, 0)).toEqual([1]);
                expect(resolveGroupColumn(result, 1, 1)).toEqual([2]);
                expect(resolveGroupColumn(result, 2, 0)).toEqual([6]);
                expect(resolveGroupColumn(result, 2, 1)).toEqual([9]);
                expect(resolveGroupColumn(result, 3, 0)).toEqual([6]);
                expect(resolveGroupColumn(result, 3, 1)).toEqual([9]);
            });

            it('should calculate the domains', () => {
                const result = dataModel.processData(data)!;

                expect(result.type).toEqual('grouped');
                expect(result.domain.keys[0]).toEqual(dataSet.map((d: any) => d.kp));
                expect(result.domain.values).toEqual([
                    [1, 6],
                    [2, 9],
                ]);
            });

            it('should not include sums', () => {
                const result = dataModel.processData(data)!;

                expect(result.groups.filter((g) => g.aggregation.length !== 0)).toHaveLength(0);
                expect(result.domain.aggValues).toBeUndefined();
            });
        });
    });

    describe('grouped processing - time-series example', () => {
        describe('property tests', () => {
            const dataModel = new DataModel<any, any, true>({
                props: [{ ...rangeKey('kp'), validation: (v) => v instanceof Date }, value('vp1'), value('vp2')],
                groupByKeys: true,
            });
            const dataSet = [
                { kp: new Date('2023-01-01T00:00:00.000Z'), vp1: 5, vp2: 7 },
                { kp: new Date('2023-01-02T00:00:00.000Z'), vp1: 1, vp2: 2 },
                { kp: new Date('2023-01-03T00:00:00.000Z'), vp1: 6, vp2: 9 },
                { kp: new Date('2023-01-04T00:00:00.000Z'), vp1: 6, vp2: 9 },
                { kp: null, vp1: 6, vp2: 9 },
            ];
            const data = basicDataSet(dataSet);

            it('should extract the configured keys', () => {
                const result = dataModel.processData(data)!;

                expect(result.type).toEqual('grouped');
                expect(result.keys).toHaveLength(1);
                expect(result.keys[0].get('test')).toHaveLength(5);
                expect(result.keys[0].get('test')).toEqual([
                    new Date('2023-01-01T00:00:00.000Z'),
                    new Date('2023-01-02T00:00:00.000Z'),
                    new Date('2023-01-03T00:00:00.000Z'),
                    new Date('2023-01-04T00:00:00.000Z'),
                    undefined,
                ]);
                expectWarningsCalls().toMatchInlineSnapshot(`
[
  [
    "AG Charts - invalid value of type [object] for [test / undefined] ignored:",
    "[null]",
  ],
]
`);
            });

            it('should extract the configured values', () => {
                const result = dataModel.processData(data)!;

                expect(result.type).toEqual('grouped');
                expect(result.columns[0]).toHaveLength(5);
                expect(result.columns).toEqual([
                    [5, 1, 6, 6, undefined],
                    [7, 2, 9, 9, undefined],
                ]);
                expectWarningsCalls().toMatchInlineSnapshot(`
[
  [
    "AG Charts - invalid value of type [object] for [test / undefined] ignored:",
    "[null]",
  ],
]
`);
            });

            it('should calculate the domains', () => {
                const result = dataModel.processData(data)!;

                expect(result.type).toEqual('grouped');
                expect(result.domain.keys).toEqual([[dataSet[0].kp, dataSet[3].kp]]);
                expect(result.domain.values).toEqual([
                    [1, 6],
                    [2, 9],
                ]);
                expectWarningsCalls().toMatchInlineSnapshot(`
[
  [
    "AG Charts - invalid value of type [object] for [test / undefined] ignored:",
    "[null]",
  ],
]
`);
            });

            it('should not include sums', () => {
                const result = dataModel.processData(data)!;

                expect(result.groups.filter((g) => g.aggregation.length !== 0)).toHaveLength(0);
                expect(result.domain.aggValues).toBeUndefined();
                expectWarningsCalls().toMatchInlineSnapshot(`
                    [
                      [
                        "AG Charts - invalid value of type [object] for [test / undefined] ignored:",
                        "[null]",
                      ],
                    ]
                    `);
            });

            it('should only sum per data-item', () => {
                const dataModel2 = new DataModel<any, any, true>({
                    props: [categoryKey('kp'), value('vp1', 'all'), value('vp2', 'all'), sum('all')],
                    groupByKeys: true,
                });
                const data2 = basicDataSet([
                    { kp: 'Q1', vp1: 5, vp2: 7 },
                    { kp: 'Q1', vp1: 1, vp2: 2 },
                    { kp: 'Q2', vp1: 6, vp2: 9 },
                    { kp: 'Q2', vp1: 6, vp2: 9 },
                ]);

                const result = dataModel2.processData(data2)!;

                expect(result.domain.aggValues).toEqual([[0, expect.closeTo(15)]]);
                expect(result.groups[0].aggregation).toEqual([[0, expect.closeTo(12)]]);
                expect(result.groups[1].aggregation).toEqual([[0, expect.closeTo(3)]]);
                expect(result.groups[2].aggregation).toEqual([[0, expect.closeTo(15)]]);
                expect(result.groups[3].aggregation).toEqual([[0, expect.closeTo(15)]]);
            });
        });
    });

    describe('grouped processing - stacked example', () => {
        it('should generated the expected results', () => {
            const data = basicDataSet(examples.STACKED_BAR_CHART_EXAMPLE.data ?? []);
            const dataModel = new DataModel<any, any, true>({
                props: [
                    categoryKey('type'),
                    value('ownerOccupied', 'all'),
                    value('privateRented', 'all'),
                    value('localAuthority', 'all'),
                    value('housingAssociation', 'all'),
                    sum('all'),
                ],
                groupByKeys: true,
            });

            expect(dataModel.processData(data)).toMatchSnapshot({
                time: expect.any(Number),
                version: expect.any(Number),
                optimizations: expect.any(Object),
            });
        });

        describe('property tests', () => {
            const dataModel = new DataModel<any, any, true>({
                props: [
                    categoryKey('kp'),
                    value('vp1', 'group1'),
                    value('vp2', 'group1'),
                    value('vp3', 'group2'),
                    value('vp4', 'group2'),
                    sum('group1'),
                    sum('group2'),
                ],
                groupByKeys: true,
            });
            const data = basicDataSet([
                { kp: 'Q1', vp1: 5, vp2: 7, vp3: 1, vp4: 5 },
                { kp: 'Q1', vp1: 1, vp2: 2, vp3: 2, vp4: 4 },
                { kp: 'Q2', vp1: 6, vp2: 9, vp3: 3, vp4: 3 },
                { kp: 'Q2', vp1: 6, vp2: 9, vp3: 4, vp4: 2 },
            ]);

            it('should extract the configured keys', () => {
                const result = dataModel.processData(data)!;

                expect(result.type).toEqual('grouped');
                expect(result.groups).toHaveLength(4);
                expect(result.groups[0].keys).toEqual(['Q1']);
                expect(result.groups[1].keys).toEqual(['Q1']);
                expect(result.groups[2].keys).toEqual(['Q2']);
                expect(result.groups[3].keys).toEqual(['Q2']);
            });

            it('should extract the configured values', () => {
                const result = dataModel.processData(data)!;

                expect(result.type).toEqual('grouped');
                expect(result.groups).toHaveLength(4);
                expect(resolveGroupColumn(result, 0, 0)).toEqual([5]);
                expect(resolveGroupColumn(result, 0, 1)).toEqual([7]);
                expect(resolveGroupColumn(result, 0, 2)).toEqual([1]);
                expect(resolveGroupColumn(result, 0, 3)).toEqual([5]);
                expect(resolveGroupColumn(result, 1, 0)).toEqual([1]);
                expect(resolveGroupColumn(result, 1, 1)).toEqual([2]);
                expect(resolveGroupColumn(result, 1, 2)).toEqual([2]);
                expect(resolveGroupColumn(result, 1, 3)).toEqual([4]);
            });

            it('should calculate the domains', () => {
                const result = dataModel.processData(data)!;

                expect(result.type).toEqual('grouped');
                expect(result.domain.keys).toEqual([['Q1', 'Q2']]);
                expect(result.domain.values).toEqual([
                    [1, 6],
                    [2, 9],
                    [1, 4],
                    [2, 5],
                ]);
            });

            it('should calculate the sums', () => {
                const result = dataModel.processData(data)!;

                expect(result.groups.map((g) => g.aggregation)).toEqual([
                    [
                        [0, expect.closeTo(12)],
                        [0, expect.closeTo(6)],
                    ],
                    [
                        [0, expect.closeTo(3)],
                        [0, expect.closeTo(6)],
                    ],
                    [
                        [0, expect.closeTo(15)],
                        [0, expect.closeTo(6)],
                    ],
                    [
                        [0, expect.closeTo(15)],
                        [0, expect.closeTo(6)],
                    ],
                ]);
                expect(result.domain.aggValues).toEqual([
                    [0, expect.closeTo(15)],
                    [0, expect.closeTo(6)],
                ]);
            });
        });
    });

    describe('grouped processing - stacked with accumulation example', () => {
        it('should generated the expected results', () => {
            const data = basicDataSet(examples.STACKED_BAR_CHART_EXAMPLE.data ?? []);
            const dataModel = new DataModel<any, any, true>({
                props: [
                    categoryKey('type'),
                    accumulatedPropertyValue('ownerOccupied'),
                    accumulatedPropertyValue('privateRented'),
                    accumulatedPropertyValue('localAuthority'),
                    accumulatedPropertyValue('housingAssociation'),
                ],
                groupByKeys: true,
            });

            expect(dataModel.processData(data)).toMatchSnapshot({
                time: expect.any(Number),
                version: expect.any(Number),
                optimizations: expect.any(Object),
            });
        });

        describe('property tests', () => {
            const dataModel = new DataModel<any, any, true>({
                props: [
                    categoryKey('kp'),
                    accumulatedPropertyValue('vp1'),
                    accumulatedPropertyValue('vp2'),
                    accumulatedPropertyValue('vp3'),
                    accumulatedPropertyValue('vp4'),
                ],
                groupByKeys: true,
            });
            const data = basicDataSet([
                { kp: 'Q1', vp1: 5, vp2: 7, vp3: 1, vp4: 5 },
                { kp: 'Q1', vp1: 1, vp2: 2, vp3: 2, vp4: 4 },
                { kp: 'Q2', vp1: 6, vp2: 9, vp3: 3, vp4: 3 },
                { kp: 'Q2', vp1: 6, vp2: 9, vp3: 4, vp4: 2 },
            ]);

            it('should extract the configured keys', () => {
                const result = dataModel.processData(data)!;

                expect(result.type).toEqual('grouped');
                expect(result.groups).toHaveLength(4);
                expect(result.groups[0].keys).toEqual(['Q1']);
                expect(result.groups[1].keys).toEqual(['Q1']);
                expect(result.groups[2].keys).toEqual(['Q2']);
                expect(result.groups[3].keys).toEqual(['Q2']);
            });

            it('should extract the configured accumulated values', () => {
                const result = dataModel.processData(data)!;

                expect(result.type).toEqual('grouped');
                expect(result.groups).toHaveLength(4);
                expect(result.groups[0].datumIndices).toEqual([[0], [0], [0], [0]]);
                expect(result.groups[1].datumIndices).toEqual([[0], [0], [0], [0]]);
                expect(result.groups[2].datumIndices).toEqual([[0], [0], [0], [0]]);
                expect(result.groups[3].datumIndices).toEqual([[0], [0], [0], [0]]);
            });

            it('should calculate the domains', () => {
                const result = dataModel.processData(data)!;

                expect(result.type).toEqual('grouped');
                expect(result.domain.keys).toEqual([['Q1', 'Q2']]);
                expect(result.domain.values).toEqual([
                    [5, 18],
                    [7, 27],
                    [1, 10],
                    [5, 14],
                ]);
            });
        });
    });

    describe('grouped processing - stacked and normalised example', () => {
        it('should generated the expected results for 100% stacked columns example', () => {
            const data = basicDataSet(examples.ONE_HUNDRED_PERCENT_STACKED_COLUMNS_EXAMPLE.data ?? []);
            const dataModel = new DataModel<any, any, true>({
                props: [
                    categoryKey('type'),
                    value('white', 'all'),
                    value('mixed', 'all'),
                    value('asian', 'all'),
                    value('black', 'all'),
                    value('chinese', 'all'),
                    value('other', 'all'),
                    sum('all'),
                    normaliseGroupTo('all', 100),
                ],
                groupByKeys: true,
            });

            expect(dataModel.processData(data)).toMatchSnapshot({
                time: expect.any(Number),
                version: expect.any(Number),
                optimizations: expect.any(Object),
            });
        });

        it('should generated the expected results for 100% stacked area example', () => {
            const data = basicDataSet(examples.ONE_HUNDRED_PERCENT_STACKED_AREA_GRAPH_EXAMPLE.data ?? []);
            const dataModel = new DataModel<any, any, true>({
                props: [
                    categoryKey('month'),
                    value('petroleum', 'all'),
                    value('naturalGas', 'all'),
                    value('bioenergyWaste', 'all'),
                    value('nuclear', 'all'),
                    value('windSolarHydro', 'all'),
                    value('imported', 'all'),
                    sum('all'),
                    normaliseGroupTo('all', 100),
                ],
                groupByKeys: true,
            });

            const result = dataModel.processData(data)!;
            expect(result).toMatchSnapshot({
                time: expect.any(Number),
                version: expect.any(Number),
                optimizations: expect.any(Object),
            });
            expect(result.domain.aggValues).toEqual([[0, expect.closeTo(249.15)]]);
        });

        describe('property tests', () => {
            const dataModel = new DataModel<any, any, true>({
                props: [
                    categoryKey('kp'),
                    value('vp1', 'group1'),
                    value('vp2', 'group1'),
                    value('vp3', 'group2'),
                    value('vp4', 'group2'),
                    sum('group1'),
                    sum('group2'),
                    normaliseGroupTo('group1', 100),
                    normaliseGroupTo('group2', 100),
                ],
                groupByKeys: true,
            });
            const data = basicDataSet([
                { kp: 'Q1', vp1: 5, vp2: 7, vp3: 1, vp4: 5 },
                { kp: 'Q1', vp1: 1, vp2: 2, vp3: 2, vp4: 4 },
                { kp: 'Q2', vp1: 6, vp2: 9, vp3: 3, vp4: 3 },
                { kp: 'Q2', vp1: 6, vp2: 9, vp3: 4, vp4: 2 },
            ]);

            it('should allow normalisation of values', () => {
                const result = dataModel.processData(data)!;

                expect(result.groups.map((g) => g.aggregation)).toMatchInlineSnapshot(`
[
  [
    [
      0,
      171.42857142857144,
    ],
    [
      0,
      120,
    ],
  ],
  [
    [
      0,
      150,
    ],
    [
      0,
      150,
    ],
  ],
  [
    [
      0,
      166.66666666666669,
    ],
    [
      0,
      200,
    ],
  ],
  [
    [
      0,
      166.66666666666669,
    ],
    [
      0,
      150,
    ],
  ],
]
`);
                expect(result.domain.aggValues).toMatchInlineSnapshot(`
[
  [
    0,
    171.42857142857144,
  ],
  [
    0,
    200,
  ],
]
`);

                expect(extractGroupValues(result)).toMatchInlineSnapshot(`
[
  [
    [
      71.42857142857143,
      100,
      20,
      100,
    ],
  ],
  [
    [
      50,
      100,
      50,
      100,
    ],
  ],
  [
    [
      66.66666666666667,
      100,
      100,
      100,
    ],
  ],
  [
    [
      66.66666666666667,
      100,
      100,
      50,
    ],
  ],
]
`);
            });
        });
    });

    describe('grouped processing - stacked with accumulation and normalised example', () => {
        it('should generated the expected results', () => {
            const data = basicDataSet(examples.STACKED_BAR_CHART_EXAMPLE.data ?? []);
            const dataModel = new DataModel<any, any, true>({
                props: [
                    categoryKey('type'),
                    ...accumulatedGroupValues(
                        ['ownerOccupied', 'privateRented', 'localAuthority', 'housingAssociation'],
                        'all'
                    ),
                    range('all'),
                    normaliseGroupTo('all', 100),
                ],
                groupByKeys: true,
            });

            expect(dataModel.processData(data)).toMatchSnapshot({
                time: expect.any(Number),
                version: expect.any(Number),
                optimizations: expect.any(Object),
            });
        });

        describe('property tests', () => {
            const dataModel = new DataModel<any, any, true>({
                props: [
                    categoryKey('kp'),
                    ...accumulatedGroupValues(['vp1', 'vp2', 'vp3', 'vp4'], 'all'),
                    range('all'),
                    normaliseGroupTo('all', 100),
                ],
                groupByKeys: true,
            });
            const data = basicDataSet([
                { kp: 'Q1', vp1: 5, vp2: 7, vp3: 1, vp4: 5 },
                { kp: 'Q1', vp1: 1, vp2: 2, vp3: 2, vp4: 4 },
                { kp: 'Q2', vp1: 6, vp2: 9, vp3: 3, vp4: 3 },
                { kp: 'Q2', vp1: 6, vp2: 9, vp3: 4, vp4: 2 },
            ]);

            it('should extract the configured keys', () => {
                const result = dataModel.processData(data)!;

                expect(result.type).toEqual('grouped');
                expect(result.groups).toHaveLength(4);
                expect(result.groups[0].keys).toEqual(['Q1']);
                expect(result.groups[1].keys).toEqual(['Q1']);
                expect(result.groups[2].keys).toEqual(['Q2']);
                expect(result.groups[3].keys).toEqual(['Q2']);
            });

            it('should extract the configured accumulated values', () => {
                const result = dataModel.processData(data)!;

                expect(result.type).toEqual('grouped');
                expect(result.groups).toHaveLength(4);
                expect(extractGroupValues(result, 0)).toMatchInlineSnapshot(`
[
  [
    27.77777777777778,
    66.66666666666667,
    72.22222222222223,
    100,
  ],
]
`);
                expect(extractGroupValues(result, 1)).toMatchInlineSnapshot(`
[
  [
    11.11111111111111,
    33.333333333333336,
    55.55555555555556,
    100,
  ],
]
`);
                expect(extractGroupValues(result, 2)).toMatchInlineSnapshot(`
[
  [
    28.571428571428573,
    71.42857142857143,
    85.71428571428571,
    100,
  ],
]
`);
                expect(extractGroupValues(result, 3)).toMatchInlineSnapshot(`
[
  [
    28.571428571428573,
    71.42857142857143,
    90.47619047619048,
    100,
  ],
]
`);
            });

            it('should calculate the domains', () => {
                const result = dataModel.processData(data)!;

                expect(result.type).toEqual('grouped');
                expect(result.domain.keys).toEqual([['Q1', 'Q2']]);
                expect(result.domain.values).toMatchInlineSnapshot(`
[
  [
    11.11111111111111,
    28.571428571428573,
  ],
  [
    33.333333333333336,
    71.42857142857143,
  ],
  [
    55.55555555555556,
    90.47619047619048,
  ],
  [
    100,
    100,
  ],
]
`);
            });
        });
    });

    describe('grouped processing - calculated grouping', () => {
        const groupByFn: GroupByFn = () => {
            return (keys) => {
                if (typeof keys[0] === 'number' && keys[0] < 100) {
                    return ['<100'];
                } else if (typeof keys[0] === 'number' && keys[0] <= 150) {
                    return ['100 - 150'];
                }
                return ['>150'];
            };
        };

        it('should generated the expected results for simple histogram example with hard-coded buckets', () => {
            const data = basicDataSet(examples.SIMPLE_HISTOGRAM_CHART_EXAMPLE.data?.slice(0, 20) ?? []);
            const dataModel = new DataModel<any, any, true>({
                props: [categoryKey('engine-size'), rowCountProperty('count'), groupCount(), SORT_DOMAIN_GROUPS],
                groupByFn,
            });

            expect(dataModel.processData(data)).toMatchSnapshot({
                time: expect.any(Number),
                version: expect.any(Number),
                optimizations: expect.any(Object),
            });
        });

        it('should generated the expected results for simple histogram example with average bucket calculation', () => {
            const data = basicDataSet(examples.XY_HISTOGRAM_WITH_MEAN_EXAMPLE.data?.slice(0, 20) ?? []);
            const dataModel = new DataModel<any, any, true>({
                props: [
                    categoryKey('engine-size'),
                    value('highway-mpg', 'mpg'),
                    groupAverage('mpg'),
                    SORT_DOMAIN_GROUPS,
                ],
                groupByFn,
            });

            expect(dataModel.processData(data)).toMatchSnapshot({
                time: expect.any(Number),
                version: expect.any(Number),
                optimizations: expect.any(Object),
            });
        });

        it('should generated the expected results for simple histogram example with area bucket calculation', () => {
            const data = basicDataSet(examples.HISTOGRAM_WITH_SPECIFIED_BINS_EXAMPLE.data?.slice(0, 20) ?? []);
            const dataModel = new DataModel<any, any, true>({
                props: [
                    rangeKey('curb-weight'),
                    value('curb-weight', 'weight'),
                    area('weight', groupCount()),
                    SORT_DOMAIN_GROUPS,
                ],
                groupByFn: () => {
                    return (keys) => {
                        if (typeof keys[0] === 'number' && keys[0] < 2000) {
                            return [0, 2000];
                        } else if (typeof keys[0] === 'number' && keys[0] <= 3000) {
                            return [2000, 3000];
                        }
                        return [3000, 4500];
                    };
                },
            });

            expect(dataModel.processData(data)).toMatchSnapshot({
                time: expect.any(Number),
                version: expect.any(Number),
                optimizations: expect.any(Object),
            });
        });
    });

    describe('repeated property processing', () => {
        it('should generated the expected results', () => {
            const data = basicDataSet([...(examples.PIE_IN_A_DONUT.series?.[0]?.data?.map((v) => ({ ...v })) ?? [])]);
            const dataModel = new DataModel<any, any>({
                props: [
                    accumulatedPropertyValue('share', 'angleGroup', 'angle'),
                    {
                        ...rangedValueProperty('share', {
                            id: 'radius',
                            min: 0.05,
                            max: 0.7,
                        }),
                        scopes: ['test'],
                    },
                    normalisePropertyTo({ id: 'angle' }, [0, 1]),
                ],
            });

            expect(dataModel.processData(data)).toMatchSnapshot({
                time: expect.any(Number),
                version: expect.any(Number),
                optimizations: expect.any(Object),
            });
        });
    });

    describe('multiple data sources', () => {
        it.failing('should generate the expected results', () => {
            const dataModel = new DataModel<any, any>({
                props: [
                    {
                        scopes: ['test1', 'test2'],
                        property: 'year',
                        type: 'key' as const,
                        valueType: 'category' as const,
                    },
                    scopedValue(['test1', 'test2'], 'ie'),
                    scopedValue(['test1', 'test2'], 'chrome'),
                    scopedValue(['test1', 'test2'], 'firefox'),
                    scopedValue(['test1', 'test2'], 'safari'),
                ],
            });

            const data1 = DATA_BROWSER_MARKET_SHARE.map((d) => d);
            const data2 = DATA_BROWSER_MARKET_SHARE.map((d) => ({
                ...d,
                firefox: d.firefox ? d.firefox * 2 : d.firefox,
            }));

            const allData = basicDataSet(data2).set('test1', new DataSet(data1)).set('test2', new DataSet(data2));
            const processedData = dataModel.processData(allData);

            expect(processedData!.columns).toEqual([
                data1.map((d) => d.ie),
                data1.map((d) => d.chrome),
                data1.map((d) => d.firefox), // This needs to be present
                data2.map((d) => d.firefox),
                data1.map((d) => d.safari),
            ]);
            expect(processedData).toMatchSnapshot({
                time: expect.any(Number),
                version: expect.any(Number),
                optimizations: expect.any(Object),
            });
        });
    });

    describe('getPathComponents', () => {
        it('parses valid paths', () => {
            expect(getPathComponents(`a . b [ 'c' ] [ "d" ] [ 0 ] [ 99 ]`)).toEqual(['a', 'b', 'c', 'd', '0', '99']);
            expect(getPathComponents(`. b [ 'c' ] [ "d" ] [ 0 ] [ 99 ]`)).toEqual(['b', 'c', 'd', '0', '99']);
            expect(getPathComponents(`[ 'c' ] [ "d" ] [ 0 ] [ 99 ]`)).toEqual(['c', 'd', '0', '99']);
        });

        it('handles string escapes paths', () => {
            expect(getPathComponents(`[ 'a\\'b' ] [ "a\\"b" ]`)).toEqual([`a'b`, `a"b`]);
        });

        it('handles string escapes paths', () => {
            expect(getPathComponents(`[ 'a\\\\'b' ]`)).toBe(undefined);
            expect(getPathComponents(`[ "a\\\\"b" ]`)).toBe(undefined);
        });

        it('rejects invalid paths', () => {
            expect(getPathComponents(`["test"]other`)).toBe(undefined);
            expect(getPathComponents(`[test]`)).toBe(undefined);
        });
    });

    describe('mid-dataset insertions', () => {
        it('should match full processing when inserting within ungrouped data', () => {
            const dataModel = new DataModel<any, any>({
                props: [rangeKey('x'), value('y')],
            });

            const initialData = [
                { x: 1, y: 10 },
                { x: 2, y: 20 },
                { x: 4, y: 40 },
                { x: 5, y: 50 },
            ];
            const dataSet = new DataSet(initialData);
            const sources = basicDataSet(initialData).set('test', dataSet);

            const processedData = dataModel.processData(sources);

            // Opt-in to diff metadata so incremental path mimics chart usage.
            processedData!.reduced = { diff: {} };

            dataSet.addTransaction({
                add: [{ x: 3, y: 30 }],
                addIndex: 2,
            });

            const reprocessed = dataModel.reprocessData(processedData!);
            verifyReprocessMatchesBaseline(dataModel, reprocessed, sources);

            expect(reprocessed.keys[0].get('test')).toEqual([1, 2, 3, 4, 5]);
            expect(reprocessed.columns).toEqual([[10, 20, 30, 40, 50]]);
            expect(reprocessed.domain.keys).toEqual([[1, 5]]);
            expect(reprocessed.domain.values).toEqual([[10, 50]]);
        });

        it('should stay aligned after transaction, full process, and another transaction with mid insert', () => {
            const dataModel = new DataModel<any, any>({
                props: [rangeKey('x'), value('y')],
            });

            const initialData = [
                { x: 0, y: 0 },
                { x: 2, y: 20 },
                { x: 4, y: 40 },
                { x: 6, y: 60 },
            ];
            const dataSet = new DataSet(initialData);
            const sources = basicDataSet(initialData).set('test', dataSet);

            const processedData = dataModel.processData(sources);
            processedData!.reduced = { diff: {} };

            dataSet.addTransaction({
                add: [{ x: 3, y: 30 }],
                addIndex: 2,
            });

            const firstReprocess = dataModel.reprocessData(processedData!);
            verifyReprocessMatchesBaseline(dataModel, firstReprocess, sources);

            // Simulate updateDelta() recreating the DataSet with the latest materialized data.
            const snapshotDataSet = new DataSet([...dataSet.data]);
            sources.set('test', snapshotDataSet);

            const fullProcess = dataModel.processData(sources);
            fullProcess!.reduced = { diff: {} };

            snapshotDataSet.addTransaction({
                add: [{ x: 5, y: 50 }],
                addIndex: 4,
            });

            const secondReprocess = dataModel.reprocessData(fullProcess!);
            verifyReprocessMatchesBaseline(dataModel, secondReprocess, sources);

            expect(secondReprocess.keys[0].get('test')).toEqual([0, 2, 3, 4, 5, 6]);
            expect(secondReprocess.columns).toEqual([[0, 20, 30, 40, 50, 60]]);
            expect(secondReprocess.domain.keys).toEqual([[0, 6]]);
            expect(secondReprocess.domain.values).toEqual([[0, 60]]);
        });

        it('should handle insertion at index 0 (prepend boundary)', () => {
            const dataModel = new DataModel<any, any>({
                props: [rangeKey('x'), value('y')],
            });

            const initialData = [
                { x: 2, y: 20 },
                { x: 3, y: 30 },
                { x: 4, y: 40 },
            ];
            const dataSet = new DataSet(initialData);
            const sources = basicDataSet(initialData).set('test', dataSet);

            const processedData = dataModel.processData(sources);
            processedData!.reduced = { diff: {} };

            dataSet.addTransaction({
                add: [{ x: 1, y: 10 }],
                addIndex: 0,
            });

            const reprocessed = dataModel.reprocessData(processedData!);
            verifyReprocessMatchesBaseline(dataModel, reprocessed, sources);

            expect(reprocessed.keys[0].get('test')).toEqual([1, 2, 3, 4]);
            expect(reprocessed.columns).toEqual([[10, 20, 30, 40]]);
        });

        it('should handle insertion at last valid index (append boundary)', () => {
            const dataModel = new DataModel<any, any>({
                props: [rangeKey('x'), value('y')],
            });

            const initialData = [
                { x: 1, y: 10 },
                { x: 2, y: 20 },
                { x: 3, y: 30 },
            ];
            const dataSet = new DataSet(initialData);
            const sources = basicDataSet(initialData).set('test', dataSet);

            const processedData = dataModel.processData(sources);
            processedData!.reduced = { diff: {} };

            dataSet.addTransaction({
                add: [{ x: 4, y: 40 }],
                addIndex: 3,
            });

            const reprocessed = dataModel.reprocessData(processedData!);
            verifyReprocessMatchesBaseline(dataModel, reprocessed, sources);

            expect(reprocessed.keys[0].get('test')).toEqual([1, 2, 3, 4]);
            expect(reprocessed.columns).toEqual([[10, 20, 30, 40]]);
        });

        it('should handle multiple sequential mid-insertions', () => {
            const dataModel = new DataModel<any, any>({
                props: [rangeKey('x'), value('y')],
            });

            const initialData = [
                { x: 1, y: 10 },
                { x: 5, y: 50 },
            ];
            const dataSet = new DataSet(initialData);
            const sources = basicDataSet(initialData).set('test', dataSet);

            const processedData = dataModel.processData(sources);
            processedData!.reduced = { diff: {} };

            // First insertion
            dataSet.addTransaction({
                add: [{ x: 3, y: 30 }],
                addIndex: 1,
            });

            const reprocessed1 = dataModel.reprocessData(processedData!);
            verifyReprocessMatchesBaseline(dataModel, reprocessed1, sources);

            // Second insertion
            dataSet.addTransaction({
                add: [{ x: 2, y: 20 }],
                addIndex: 1,
            });

            const reprocessed2 = dataModel.reprocessData(reprocessed1);
            verifyReprocessMatchesBaseline(dataModel, reprocessed2, sources);

            // Third insertion
            dataSet.addTransaction({
                add: [{ x: 4, y: 40 }],
                addIndex: 3,
            });

            const reprocessed3 = dataModel.reprocessData(reprocessed2);
            verifyReprocessMatchesBaseline(dataModel, reprocessed3, sources);

            expect(reprocessed3.keys[0].get('test')).toEqual([1, 2, 3, 4, 5]);
            expect(reprocessed3.columns).toEqual([[10, 20, 30, 40, 50]]);
        });
    });

    describe('columnNeedValueOf optimization', () => {
        it('should correctly identify columns with primitive values', () => {
            const dataModel = new DataModel<any, any>({
                props: [categoryKey('id'), value('count'), value('amount')],
            });

            const data = [
                { id: 'A', count: 10, amount: 100.5 },
                { id: 'B', count: 20, amount: 200.3 },
                { id: 'C', count: 30, amount: 300.7 },
            ];

            const dataSet = new DataSet(data);
            const sources = basicDataSet(data).set('test', dataSet);
            const processedData = dataModel.processData(sources);

            // columnNeedValueOf only tracks value columns (count, amount), not keys
            // Both value columns contain primitives (numbers), so should be false
            expect(processedData!.columnNeedValueOf).toEqual([false, false]);
        });

        it('should correctly identify value columns with Date objects', () => {
            const dataModel = new DataModel<any, any>({
                props: [rangeKey('timestamp'), value('dateValue'), value('primitiveValue')],
            });

            const data = [
                { timestamp: new Date(2024, 0, 1), dateValue: new Date(2024, 0, 1), primitiveValue: 10 },
                { timestamp: new Date(2024, 0, 2), dateValue: new Date(2024, 0, 2), primitiveValue: 20 },
                { timestamp: new Date(2024, 0, 3), dateValue: new Date(2024, 0, 3), primitiveValue: 30 },
            ];

            const dataSet = new DataSet(data);
            const sources = basicDataSet(data).set('test', dataSet);
            const processedData = dataModel.processData(sources);

            // columnNeedValueOf only tracks value columns (not the timestamp key)
            // First value column (dateValue) contains Date objects - needs valueOf
            // Second value column (primitiveValue) contains primitives - doesn't need valueOf
            expect(processedData!.columnNeedValueOf).toEqual([true, false]);
        });

        it('should correctly identify columns with mixed object types', () => {
            const dataModel = new DataModel<any, any>({
                props: [categoryKey('key'), value('primitiveValue'), value('objectValue')],
            });

            const data = [
                { key: 'A', primitiveValue: 10, objectValue: new Date(2024, 0, 1) },
                { key: 'B', primitiveValue: 20, objectValue: new Date(2024, 0, 2) },
            ];

            const dataSet = new DataSet(data);
            const sources = basicDataSet(data).set('test', dataSet);
            const processedData = dataModel.processData(sources);

            // columnNeedValueOf only tracks value columns (not the key)
            // First value column: primitives (false)
            // Second value column: objects/dates (true)
            expect(processedData!.columnNeedValueOf).toEqual([false, true]);
        });

        it('should handle incremental updates without losing columnNeedValueOf metadata', () => {
            const dataModel = new DataModel<any, any>({
                props: [rangeKey('timestamp'), value('dateValue'), value('primitiveValue')],
            });

            const initialData = [
                { timestamp: new Date(2024, 0, 1), dateValue: new Date(2024, 0, 1), primitiveValue: 10 },
                { timestamp: new Date(2024, 0, 2), dateValue: new Date(2024, 0, 2), primitiveValue: 20 },
            ];

            const dataSet = new DataSet(initialData);
            const sources = basicDataSet(initialData).set('test', dataSet);
            const processedData = dataModel.processData(sources);

            // columnNeedValueOf should track value columns (dateValue: true, primitiveValue: false)
            expect(processedData!.columnNeedValueOf).toEqual([true, false]);

            // Add more data
            dataSet.addTransaction({
                append: [{ timestamp: new Date(2024, 0, 3), dateValue: new Date(2024, 0, 3), primitiveValue: 30 }],
            });

            const reprocessed = dataModel.reprocessData(processedData!);

            // Should maintain columnNeedValueOf metadata
            expect(reprocessed.columnNeedValueOf).toEqual([true, false]);
        });
    });

    describe('update operations', () => {
        describe('ungrouped data', () => {
            it('should process updated items correctly', () => {
                const dataModel = new DataModel<any, any>({
                    props: [rangeKey('x'), value('y')],
                });

                const item0 = { x: 1, y: 10 };
                const item1 = { x: 2, y: 20 };
                const item2 = { x: 3, y: 30 };
                const dataSet = new DataSet([item0, item1, item2]);
                const sources = new Map([['test', dataSet]]);

                const processedData = dataModel.processData(sources);

                // Mutate item in place
                item1.y = 25;
                dataSet.addTransaction({ update: [item1] });

                const reprocessed = dataModel.reprocessData(processedData!);
                verifyReprocessMatchesBaseline(dataModel, reprocessed, sources);

                // Verify updated values are reflected
                expect(reprocessed.columns).toEqual([[10, 25, 30]]);
                expect(reprocessed.domain.values).toEqual([[10, 30]]);
            });

            it('should handle multiple updated items', () => {
                const dataModel = new DataModel<any, any>({
                    props: [rangeKey('x'), value('y')],
                });

                const item0 = { x: 1, y: 10 };
                const item1 = { x: 2, y: 20 };
                const item2 = { x: 3, y: 30 };
                const dataSet = new DataSet([item0, item1, item2]);
                const sources = new Map([['test', dataSet]]);

                const processedData = dataModel.processData(sources);
                processedData!.reduced = { diff: {} };

                // Mutate items in place
                item0.y = 15;
                item2.y = 35;
                dataSet.addTransaction({ update: [item0, item2] });

                const reprocessed = dataModel.reprocessData(processedData!);
                verifyReprocessMatchesBaseline(dataModel, reprocessed, sources);

                // Verify updated values are reflected
                expect(reprocessed.columns).toEqual([[15, 20, 35]]);
                expect(reprocessed.domain.values).toEqual([[15, 35]]);
            });

            it('should handle combined update and append', () => {
                const dataModel = new DataModel<any, any>({
                    props: [rangeKey('x'), value('y')],
                });

                const item0 = { x: 1, y: 10 };
                const item1 = { x: 2, y: 20 };
                const dataSet = new DataSet([item0, item1]);
                const sources = new Map([['test', dataSet]]);

                const processedData = dataModel.processData(sources);
                processedData!.reduced = { diff: {} };

                // Mutate and add
                item0.y = 15;
                const newItem = { x: 3, y: 30 };
                dataSet.addTransaction({ update: [item0], append: [newItem] });

                const reprocessed = dataModel.reprocessData(processedData!);
                verifyReprocessMatchesBaseline(dataModel, reprocessed, sources);

                expect(reprocessed.columns).toEqual([[15, 20, 30]]);
                expect(reprocessed.keys[0].get('test')).toEqual([1, 2, 3]);
            });

            it('should handle combined update and prepend', () => {
                const dataModel = new DataModel<any, any>({
                    props: [rangeKey('x'), value('y')],
                });

                const item0 = { x: 2, y: 20 };
                const item1 = { x: 3, y: 30 };
                const dataSet = new DataSet([item0, item1]);
                const sources = new Map([['test', dataSet]]);

                const processedData = dataModel.processData(sources);
                processedData!.reduced = { diff: {} };

                // Mutate and prepend
                item1.y = 35;
                const newItem = { x: 1, y: 10 };
                dataSet.addTransaction({ update: [item1], prepend: [newItem] });

                const reprocessed = dataModel.reprocessData(processedData!);
                verifyReprocessMatchesBaseline(dataModel, reprocessed, sources);

                expect(reprocessed.columns).toEqual([[10, 20, 35]]);
                expect(reprocessed.keys[0].get('test')).toEqual([1, 2, 3]);
            });

            it('should handle combined update, remove, and add', () => {
                const dataModel = new DataModel<any, any>({
                    props: [rangeKey('x'), value('y')],
                });

                const item0 = { x: 1, y: 10 };
                const item1 = { x: 2, y: 20 };
                const item2 = { x: 3, y: 30 };
                const dataSet = new DataSet([item0, item1, item2]);
                const sources = new Map([['test', dataSet]]);

                const processedData = dataModel.processData(sources);
                processedData!.reduced = { diff: {} };

                // Remove, update, and add
                item0.y = 15;
                const newItem = { x: 4, y: 40 };
                dataSet.addTransaction({
                    remove: [item1],
                    update: [item0],
                    append: [newItem],
                });

                const reprocessed = dataModel.reprocessData(processedData!);
                verifyReprocessMatchesBaseline(dataModel, reprocessed, sources);

                expect(reprocessed.columns).toEqual([[15, 30, 40]]);
                expect(reprocessed.keys[0].get('test')).toEqual([1, 3, 4]);
            });

            it('should preserve update behavior through multiple reprocessing cycles', () => {
                const dataModel = new DataModel<any, any>({
                    props: [rangeKey('x'), value('y')],
                });

                const item0 = { x: 1, y: 10 };
                const item1 = { x: 2, y: 20 };
                const dataSet = new DataSet([item0, item1]);
                const sources = new Map([['test', dataSet]]);

                const initialProcessedData = dataModel.processData(sources)!;
                initialProcessedData.reduced = { diff: {} };

                // First update
                item0.y = 15;
                dataSet.addTransaction({ update: [item0] });
                const firstReprocessed = dataModel.reprocessData(initialProcessedData);
                verifyReprocessMatchesBaseline(dataModel, firstReprocessed, sources);

                expect(firstReprocessed.columns).toEqual([[15, 20]]);

                // Second update
                item1.y = 25;
                dataSet.addTransaction({ update: [item1] });
                const secondReprocessed = dataModel.reprocessData(firstReprocessed);
                verifyReprocessMatchesBaseline(dataModel, secondReprocessed, sources);

                expect(secondReprocessed.columns).toEqual([[15, 25]]);
            });
        });

        describe('grouped data', () => {
            it('should process updated items in grouped data', () => {
                const dataModel = new DataModel<any, any, true>({
                    props: [categoryKey('category'), value('value')],
                    groupByKeys: true,
                });

                const item0 = { category: 'A', value: 10 };
                const item1 = { category: 'B', value: 20 };
                const item2 = { category: 'C', value: 30 };
                const dataSet = new DataSet([item0, item1, item2]);
                const sources = new Map([['test', dataSet]]);

                const processedData = dataModel.processData(sources)!;

                // Mutate item in place
                item1.value = 25;
                dataSet.addTransaction({ update: [item1] });

                const reprocessed = dataModel.reprocessData(processedData);
                verifyReprocessMatchesBaseline(dataModel, reprocessed, sources);

                // Verify updated value is reflected in the group
                if (reprocessed.type === 'grouped') {
                    expect(resolveGroupColumn(reprocessed, 1, 0)).toEqual([25]);
                }
            });

            it('should handle multiple updates in grouped data', () => {
                const dataModel = new DataModel<any, any, true>({
                    props: [categoryKey('category'), value('value')],
                    groupByKeys: true,
                });

                const item0 = { category: 'A', value: 10 };
                const item1 = { category: 'B', value: 20 };
                const item2 = { category: 'C', value: 30 };
                const dataSet = new DataSet([item0, item1, item2]);
                const sources = new Map([['test', dataSet]]);

                const processedData = dataModel.processData(sources)!;

                // Mutate items in place
                item0.value = 15;
                item2.value = 35;
                dataSet.addTransaction({ update: [item0, item2] });

                const reprocessed = dataModel.reprocessData(processedData);
                verifyReprocessMatchesBaseline(dataModel, reprocessed, sources);

                if (reprocessed.type === 'grouped') {
                    expect(resolveGroupColumn(reprocessed, 0, 0)).toEqual([15]);
                    expect(resolveGroupColumn(reprocessed, 2, 0)).toEqual([35]);
                }
            });

            it('should handle updates with category key changes', () => {
                const dataModel = new DataModel<any, any, true>({
                    props: [categoryKey('category'), value('value')],
                    groupByKeys: true,
                });

                const item0 = { category: 'A', value: 10 };
                const item1 = { category: 'B', value: 20 };
                const dataSet = new DataSet([item0, item1]);
                const sources = new Map([['test', dataSet]]);

                const processedData = dataModel.processData(sources)!;

                // Change both category and value
                item1.category = 'C';
                item1.value = 25;
                dataSet.addTransaction({ update: [item1] });

                const reprocessed = dataModel.reprocessData(processedData);
                verifyReprocessMatchesBaseline(dataModel, reprocessed, sources);

                // Verify the updated category appears in the groups
                if (reprocessed.type === 'grouped') {
                    expect(reprocessed.groups.map((g) => g.keys[0])).toEqual(['A', 'C']);
                    expect(resolveGroupColumn(reprocessed, 1, 0)).toEqual([25]);
                }
            });
        });

        describe('accumulated and normalized properties', () => {
            it('should handle updates with accumulated values', () => {
                const dataModel = new DataModel<any, any>({
                    props: [rangeKey('x'), accumulatedPropertyValue('y'), normalisePropertyTo('y', [0, 100])],
                });

                const item0 = { x: 1, y: 10 };
                const item1 = { x: 2, y: 20 };
                const item2 = { x: 3, y: 30 };
                const dataSet = new DataSet([item0, item1, item2]);
                const sources = new Map([['test', dataSet]]);

                const processedData = dataModel.processData(sources);

                // Mutate item - this should affect accumulation
                item1.y = 25;
                dataSet.addTransaction({ update: [item1] });

                const reprocessed = dataModel.reprocessData(processedData!);
                verifyReprocessMatchesBaseline(dataModel, reprocessed, sources);

                // Verify accumulated and normalized values are recalculated
                // Accumulated: [10, 35, 65], Normalized to [0, 100]
                const accumulated = [10, 35, 65];
                const domainMin = Math.min(...accumulated);
                const domainMax = Math.max(...accumulated);
                const span = domainMax - domainMin || 1; // Avoid divide-by-zero when span is zero.
                const expectedNormalized = accumulated.map((v) => ((v - domainMin) / span) * 100);

                expect(reprocessed.columns[0]).toHaveLength(3);
                expect(reprocessed.columns[0][0]).toBeCloseTo(expectedNormalized[0], 1);
                expect(reprocessed.columns[0][1]).toBeCloseTo(expectedNormalized[1], 1);
                expect(reprocessed.columns[0][2]).toBeCloseTo(expectedNormalized[2], 1);
            });
        });

        describe('with mid-dataset insertions', () => {
            it('should handle update combined with mid-dataset insertion', () => {
                const dataModel = new DataModel<any, any>({
                    props: [rangeKey('x'), value('y')],
                });

                const item0 = { x: 1, y: 10 };
                const item1 = { x: 2, y: 20 };
                const item3 = { x: 4, y: 40 };
                const dataSet = new DataSet([item0, item1, item3]);
                const sources = new Map([['test', dataSet]]);

                const processedData = dataModel.processData(sources);
                processedData!.reduced = { diff: {} };

                // Insert item in middle and update existing item
                const item2 = { x: 3, y: 30 };
                item1.y = 25;
                dataSet.addTransaction({
                    add: [item2],
                    addIndex: 2,
                    update: [item1],
                });

                const reprocessed = dataModel.reprocessData(processedData!);
                verifyReprocessMatchesBaseline(dataModel, reprocessed, sources);

                expect(reprocessed.keys[0].get('test')).toEqual([1, 2, 3, 4]);
                expect(reprocessed.columns).toEqual([[10, 25, 30, 40]]);
            });
        });

        describe('with banded reducers', () => {
            const runSmallestIntervalScenario = (
                initialData: any[],
                transaction: Parameters<DataSet['addTransaction']>[0]
            ) => {
                const dataModel = new DataModel<any, any>({
                    props: [rangeKey('x'), value('y'), SMALLEST_KEY_INTERVAL],
                });

                const dataSet = new DataSet(initialData);
                const sources = basicDataSet(initialData).set('test', dataSet);
                const processedData = dataModel.processData(sources);

                dataSet.addTransaction(transaction);

                const reprocessed = dataModel.reprocessData(processedData!);

                verifyReprocessMatchesBaseline(dataModel, reprocessed, sources);

                return reprocessed;
            };

            const expectSmallestInterval = (
                reprocessed: any,
                expected?: number,
                { allowNonFinite = false }: { allowNonFinite?: boolean } = {}
            ) => {
                const interval = reprocessed.reduced?.smallestKeyInterval;
                expect(interval).toBeDefined();
                if (!allowNonFinite) {
                    expect(Number.isFinite(interval)).toBe(true);
                }
                if (expected !== undefined) {
                    expect(interval).toBe(expected);
                }
            };

            describe('ungrouped data with interval reducers', () => {
                it('should match full processing after append with smallestKeyInterval', () => {
                    const initialData = Array.from({ length: 10000 }, (_, i) => ({ x: i, y: i }));
                    const newData = Array.from({ length: 100 }, (_, i) => ({ x: 10000 + i, y: 10000 + i }));

                    const reprocessed = runSmallestIntervalScenario(initialData, { append: newData });

                    expectSmallestInterval(reprocessed, 1);
                });

                it('should match full processing after prepend with smallestKeyInterval', () => {
                    const initialData = Array.from({ length: 10000 }, (_, i) => ({ x: i + 100, y: i }));
                    const newData = Array.from({ length: 100 }, (_, i) => ({ x: i, y: i }));

                    const reprocessed = runSmallestIntervalScenario(initialData, { prepend: newData });

                    expectSmallestInterval(reprocessed, 1);
                });

                it('should match full processing after mid-insertion with smallestKeyInterval', () => {
                    const initialData = Array.from({ length: 10000 }, (_, i) => ({
                        x: i < 5000 ? i : i + 100,
                        y: i,
                    }));
                    const newData = Array.from({ length: 100 }, (_, i) => ({ x: 5000 + i, y: 5000 + i }));

                    const reprocessed = runSmallestIntervalScenario(initialData, { add: newData, addIndex: 5000 });

                    expectSmallestInterval(reprocessed, 1);
                });

                it('should match full processing after removal with smallestKeyInterval', () => {
                    const initialData = Array.from({ length: 10000 }, (_, i) => ({ x: i, y: i }));
                    const removeData = initialData.slice(5000, 5100);

                    const reprocessed = runSmallestIntervalScenario(initialData, { remove: removeData });

                    expectSmallestInterval(reprocessed, 1);
                });
            });

            describe('cross-band scenarios', () => {
                it('should detect smallest interval at band boundary', () => {
                    // Create data with smallest interval at band boundary
                    // With 10K items and targetBandCount=10, bands are ~1000 items each
                    const initialData = Array.from({ length: 10000 }, (_, i) => {
                        if (i < 999) return { x: i * 10, y: i };
                        if (i < 1001) return { x: 9990 + (i - 999), y: i };
                        return { x: (i - 2) * 10 + 2, y: i };
                    });
                    const newData = [{ x: 99990, y: 10000 }];

                    const reprocessed = runSmallestIntervalScenario(initialData, { append: newData });

                    expectSmallestInterval(reprocessed);
                    // Smallest interval is at boundary: 9991 - 9990 = 1
                    expectSmallestInterval(reprocessed, 1);
                });

                it('should handle intervals spanning multiple bands', () => {
                    // Create sparse data where smallest interval might span bands
                    const initialData = Array.from({ length: 10000 }, (_, i) => ({ x: i * 100, y: i }));
                    const reprocessed = runSmallestIntervalScenario(initialData, {
                        append: [{ x: 1000000, y: 10000 }],
                    });

                    expectSmallestInterval(reprocessed, 100);
                });
            });

            describe('band splitting during updates', () => {
                it('should match full processing when append triggers band split', () => {
                    const initialData = Array.from({ length: 10000 }, (_, i) => ({ x: i, y: i }));
                    const newData = Array.from({ length: 500 }, (_, i) => ({ x: 10000 + i, y: 10000 + i }));

                    const reprocessed = runSmallestIntervalScenario(initialData, { append: newData });

                    expectSmallestInterval(reprocessed, 1);
                });
            });

            describe('invalid data handling', () => {
                it('should match full processing with NaN values across bands', () => {
                    // Mix valid and invalid data across bands
                    const initialData = Array.from({ length: 10000 }, (_, i) => ({
                        x: i % 10 === 0 ? Number.NaN : i,
                        y: i,
                    }));

                    const reprocessed = runSmallestIntervalScenario(initialData, { append: [{ x: 10000, y: 10000 }] });

                    expectSmallestInterval(reprocessed);
                });

                it('should return initialValue for all-NaN data', () => {
                    const dataModel = new DataModel<any, any>({
                        props: [rangeKey('x'), value('y'), SMALLEST_KEY_INTERVAL],
                    });

                    const initialData = Array.from({ length: 10000 }, (_, i) => ({ x: Number.NaN, y: i }));
                    const dataSet = new DataSet(initialData);
                    const sources = basicDataSet(initialData).set('test', dataSet);

                    const processedData = dataModel.processData(sources);

                    // Verify initial processing returns Infinity (initialValue) for all-NaN data
                    expectSmallestInterval(processedData, Infinity, { allowNonFinite: true });

                    dataSet.addTransaction({ append: [{ x: Number.NaN, y: 10000 }] });

                    const reprocessed = dataModel.reprocessData(processedData!);

                    // Verify reprocessing also returns Infinity for all-NaN data
                    expectSmallestInterval(reprocessed, Infinity, { allowNonFinite: true });
                });

                it('should handle sparse data with gaps', () => {
                    // Sparse data with large gaps
                    const initialData = Array.from({ length: 10000 }, (_, i) => ({
                        x: i * (i % 100 === 0 ? 1000 : 1),
                        y: i,
                    }));

                    const reprocessed = runSmallestIntervalScenario(initialData, {
                        append: [{ x: 10000000, y: 10000 }],
                    });

                    expectSmallestInterval(reprocessed);
                });
            });

            describe('rolling window optimization', () => {
                it('should match full processing for remove-from-start and append-to-end', () => {
                    const initialData = Array.from({ length: 10000 }, (_, i) => ({ x: i, y: i }));
                    const removeData = initialData.slice(0, 100);
                    const newData = Array.from({ length: 100 }, (_, i) => ({ x: 10000 + i, y: 10000 + i }));

                    const reprocessed = runSmallestIntervalScenario(initialData, {
                        remove: removeData,
                        append: newData,
                    });

                    expectSmallestInterval(reprocessed, 1);
                });
            });
        });
    });

    describe('optimization metadata', () => {
        it('should collect optimization metadata when debug enabled', () => {
            const dataModel = new DataModel<any, any>({
                props: [rangeKey('x'), value('y')],
            });

            const dataSet = new DataSet([
                { x: 1, y: 10 },
                { x: 2, y: 20 },
            ]);
            const sources = new Map([['test', dataSet]]);

            const processedData = dataModel.processData(sources);

            expect(processedData?.optimizations).toBeDefined();
            expect(processedData?.optimizations?.performance).toBeDefined();
            expect(processedData?.optimizations?.performance?.pathTaken).toBe('full-process');
            expect(processedData?.optimizations?.reprocessing).toBeDefined();
            expect(processedData?.optimizations?.reprocessing?.applied).toBe(false);
        });

        it('should track reprocessing applied', () => {
            const dataModel = new DataModel<any, any>({
                props: [rangeKey('x'), value('y')],
            });

            const dataSet = new DataSet([
                { x: 1, y: 10 },
                { x: 2, y: 20 },
            ]);
            const sources = new Map([['test', dataSet]]);

            const processedData = dataModel.processData(sources);

            dataSet.addTransaction({ append: [{ x: 3, y: 30 }] });
            const reprocessed = dataModel.reprocessData(processedData!);

            expect(reprocessed.optimizations).toBeDefined();
            expect(reprocessed.optimizations?.reprocessing?.applied).toBe(true);
            expect(reprocessed.optimizations?.performance?.pathTaken).toBe('reprocess');
        });

        it('should explain why reprocessing is not supported', () => {
            const dataModel = new DataModel<any, any, true>({
                props: [categoryKey('category'), value('value', 'value'), sum('value')],
                groupByKeys: true,
            });

            const dataSet = new DataSet([
                { category: 'A', value: 10 },
                { category: 'B', value: 20 },
            ]);
            const sources = new Map([['test', dataSet]]);

            const processedData = dataModel.processData(sources);

            expect(processedData?.optimizations?.reprocessing?.applied).toBe(false);
            expect(processedData?.optimizations?.reprocessing?.reason).toContain('aggregates');
        });

        it('should track shared datum indices for grouped data', () => {
            const dataModel = new DataModel<any, any, true>({
                props: [categoryKey('category'), value('value')],
                groupByKeys: true,
            });

            const dataSet = new DataSet([
                { category: 'A', value: 10 },
                { category: 'B', value: 20 },
                { category: 'C', value: 30 },
            ]);
            const sources = new Map([['test', dataSet]]);

            const processedData = dataModel.processData(sources);

            expect(processedData?.optimizations?.sharedDatumIndices).toBeDefined();
            expect(processedData?.optimizations?.sharedDatumIndices?.applied).toBe(true);
            expect(processedData?.optimizations?.sharedDatumIndices?.sharedGroupCount).toBeGreaterThan(0);
        });

        // Note: Batch merging and domain banding metadata are collected but may not
        // always be present depending on the data structure and processing path

        it('should always collect metadata for testing', () => {
            const dataModel = new DataModel<any, any>({
                props: [rangeKey('x'), value('y')],
            });

            const dataSet = new DataSet([
                { x: 1, y: 10 },
                { x: 2, y: 20 },
            ]);
            const sources = new Map([['test', dataSet]]);

            const processedData = dataModel.processData(sources);

            // Metadata is now always collected for testing purposes
            expect(processedData?.optimizations).toBeDefined();
            expect(processedData?.optimizations?.performance).toBeDefined();
            expect(processedData?.optimizations?.reprocessing).toBeDefined();
        });

        describe('banded reducer optimizations', () => {
            it('should track reducer banding metadata when banding is applied', () => {
                const dataModel = new DataModel<any, any>({
                    props: [rangeKey('x'), value('y'), SMALLEST_KEY_INTERVAL],
                });

                // Create large dataset (above banding threshold)
                const initialData = Array.from({ length: 10000 }, (_, i) => ({ x: i, y: i }));
                const dataSet = new DataSet(initialData);
                const sources = new Map([['test', dataSet]]);

                const processedData = dataModel.processData(sources);

                // Verify banding metadata exists
                expect(processedData?.optimizations?.reducerBanding).toBeDefined();
                const reducerMeta = processedData?.optimizations?.reducerBanding?.reducers?.find(
                    (r) => r.property === 'smallestKeyInterval'
                );
                expect(reducerMeta).toBeDefined();
                expect(reducerMeta?.applied).toBe(true);

                // Verify stats are reasonable
                const stats = reducerMeta?.stats;
                expect(stats).toBeDefined();
                expect(stats?.totalBands).toBeGreaterThan(1);
                expect(stats?.dataSize).toBe(10000);
                expect(stats?.scanRatio).toBe(1); // Full scan on initial processing
            });

            it('should report correct band statistics after incremental update', () => {
                const dataModel = new DataModel<any, any>({
                    props: [rangeKey('x'), value('y'), SMALLEST_KEY_INTERVAL],
                });

                const initialData = Array.from({ length: 10000 }, (_, i) => ({ x: i, y: i }));
                const dataSet = new DataSet(initialData);
                const sources = new Map([['test', dataSet]]);

                const processedData = dataModel.processData(sources);

                // Append data (rolling window scenario)
                const removeData = initialData.slice(0, 100);
                const appendData = Array.from({ length: 100 }, (_, i) => ({ x: 10000 + i, y: 10000 + i }));
                dataSet.addTransaction({ remove: removeData, append: appendData });

                const reprocessed = dataModel.reprocessData(processedData!);

                // Verify banding was applied during reprocessing
                expect(reprocessed.optimizations?.reducerBanding).toBeDefined();
                const reducerMeta = reprocessed.optimizations?.reducerBanding?.reducers?.find(
                    (r) => r.property === 'smallestKeyInterval'
                );
                expect(reducerMeta).toBeDefined();
                expect(reducerMeta?.applied).toBe(true);

                const stats = reducerMeta?.stats;
                expect(stats).toBeDefined();
                expect(stats?.totalBands).toBeGreaterThan(1);
                expect(stats?.dataSize).toBe(10000);
                expect(stats?.dirtyBands).toBeGreaterThan(0);
                expect(stats?.dirtyBands).toBeLessThan(stats?.totalBands ?? 0);
                expect(stats?.scanRatio).toBeLessThan(1); // Partial scan
                expect(stats?.scanRatio).toBeGreaterThan(0);
                expect(stats?.cacheHits).toBeGreaterThan(0);
            });

            it('should not apply banding for small datasets', () => {
                const dataModel = new DataModel<any, any>({
                    props: [rangeKey('x'), value('y'), SMALLEST_KEY_INTERVAL],
                });

                // Create small dataset (below banding threshold of 1000)
                const initialData = Array.from({ length: 500 }, (_, i) => ({ x: i, y: i }));
                const dataSet = new DataSet(initialData);
                const sources = new Map([['test', dataSet]]);

                const processedData = dataModel.processData(sources);

                // Verify banding was not applied (or applied but with single band)
                const reducerMeta = processedData?.optimizations?.reducerBanding?.reducers?.find(
                    (r) => r.property === 'smallestKeyInterval'
                );
                if (reducerMeta?.stats) {
                    // If metadata exists, it should indicate single band
                    expect(reducerMeta.stats.totalBands).toBeLessThanOrEqual(1);
                }
            });

            it('should track low scan ratio for rolling window operations', () => {
                const dataModel = new DataModel<any, any>({
                    props: [rangeKey('x'), value('y'), SMALLEST_KEY_INTERVAL],
                });

                const initialData = Array.from({ length: 10000 }, (_, i) => ({ x: i, y: i }));
                const dataSet = new DataSet(initialData);
                const sources = new Map([['test', dataSet]]);

                const processedData = dataModel.processData(sources);

                // Multiple rolling window updates
                for (let i = 0; i < 5; i++) {
                    const removeData = [initialData[i * 100]];
                    const appendData = [{ x: 10000 + i, y: 10000 + i }];
                    dataSet.addTransaction({ remove: removeData, append: appendData });
                }

                const reprocessed = dataModel.reprocessData(processedData!);

                // Verify efficient caching (low scan ratio)
                const reducerMeta = reprocessed.optimizations?.reducerBanding?.reducers?.find(
                    (r) => r.property === 'smallestKeyInterval'
                );
                const stats = reducerMeta?.stats;
                expect(stats).toBeDefined();
                expect(stats?.scanRatio).toBeLessThan(0.5); // Less than 50% re-scanned
            });
        });
    });

    describe('KEY_SORT_ORDERS metadata', () => {
        describe('continuous keys', () => {
            it('should track ascending sorted unique keys', () => {
                const dataModel = new DataModel<any, any>({
                    props: [rangeKey('x'), value('y')],
                });
                const data = basicDataSet([
                    { x: 1, y: 10 },
                    { x: 2, y: 20 },
                    { x: 3, y: 30 },
                    { x: 4, y: 40 },
                ]);

                const result = dataModel.processData(data)!;
                const entry = result[KEY_SORT_ORDERS].get(0);

                expect(entry).toBeDefined();
                expect(entry!.sortOrder).toBe(1);
                expect(entry!.isUnique).toBe(true);
                expect(entry!.isDirty).toBe(false);
            });

            it('should track descending sorted unique keys', () => {
                const dataModel = new DataModel<any, any>({
                    props: [rangeKey('x'), value('y')],
                });
                const data = basicDataSet([
                    { x: 100, y: 10 },
                    { x: 75, y: 20 },
                    { x: 50, y: 30 },
                    { x: 25, y: 40 },
                ]);

                const result = dataModel.processData(data)!;
                const entry = result[KEY_SORT_ORDERS].get(0);

                expect(entry).toBeDefined();
                expect(entry!.sortOrder).toBe(-1);
                expect(entry!.isUnique).toBe(true);
            });

            it('should detect unordered keys', () => {
                const dataModel = new DataModel<any, any>({
                    props: [rangeKey('x'), value('y')],
                });
                const data = basicDataSet([
                    { x: 1, y: 10 },
                    { x: 5, y: 20 },
                    { x: 3, y: 30 },
                    { x: 4, y: 40 },
                ]);

                const result = dataModel.processData(data)!;
                const entry = result[KEY_SORT_ORDERS].get(0);

                expect(entry).toBeDefined();
                expect(entry!.sortOrder).toBeUndefined();
            });

            it('should detect duplicate keys', () => {
                const dataModel = new DataModel<any, any>({
                    props: [rangeKey('x'), value('y')],
                });
                const data = basicDataSet([
                    { x: 1, y: 10 },
                    { x: 2, y: 20 },
                    { x: 2, y: 25 },
                    { x: 3, y: 30 },
                ]);

                const result = dataModel.processData(data)!;
                const entry = result[KEY_SORT_ORDERS].get(0);

                expect(entry).toBeDefined();
                expect(entry!.sortOrder).toBe(1);
                expect(entry!.isUnique).toBe(false);
            });

            it('should track Date keys correctly', () => {
                const dataModel = new DataModel<any, any>({
                    props: [rangeKey('date'), value('y')],
                });
                const data = basicDataSet([
                    { date: new Date('2024-01-01'), y: 10 },
                    { date: new Date('2024-01-02'), y: 20 },
                    { date: new Date('2024-01-03'), y: 30 },
                ]);

                const result = dataModel.processData(data)!;
                const entry = result[KEY_SORT_ORDERS].get(0);

                expect(entry).toBeDefined();
                expect(entry!.sortOrder).toBe(1);
                expect(entry!.isUnique).toBe(true);
            });

            it('should handle single-element data', () => {
                const dataModel = new DataModel<any, any>({
                    props: [rangeKey('x'), value('y')],
                });
                const data = basicDataSet([{ x: 42, y: 10 }]);

                const result = dataModel.processData(data)!;
                const entry = result[KEY_SORT_ORDERS].get(0);

                expect(entry).toBeDefined();
                expect(entry!.sortOrder).toBeUndefined(); // No direction determinable
                expect(entry!.isUnique).toBe(true);
            });

            it('should handle empty data', () => {
                const dataModel = new DataModel<any, any>({
                    props: [rangeKey('x'), value('y')],
                });
                const data = basicDataSet([]);

                const result = dataModel.processData(data)!;
                const entry = result[KEY_SORT_ORDERS].get(0);

                expect(entry).toBeDefined();
                expect(entry!.isUnique).toBe(true);
            });
        });

        describe('category keys', () => {
            it('should track unique category keys', () => {
                const dataModel = new DataModel<any, any>({
                    props: [categoryKey('category'), value('y')],
                });
                const data = basicDataSet([
                    { category: 'A', y: 10 },
                    { category: 'B', y: 20 },
                    { category: 'C', y: 30 },
                ]);

                const result = dataModel.processData(data)!;
                const entry = result[KEY_SORT_ORDERS].get(0);

                expect(entry).toBeDefined();
                // Category keys don't have numeric sort order
                expect(entry!.isUnique).toBe(true);
            });

            it('should detect duplicate category keys', () => {
                const dataModel = new DataModel<any, any>({
                    props: [categoryKey('category'), value('y')],
                });
                const data = basicDataSet([
                    { category: 'A', y: 10 },
                    { category: 'A', y: 15 },
                    { category: 'B', y: 20 },
                ]);

                const result = dataModel.processData(data)!;
                const entry = result[KEY_SORT_ORDERS].get(0);

                expect(entry).toBeDefined();
                // Category duplicates don't affect numeric tracking (strings not tracked)
                // isUnique should be true since we only track numeric values
                expect(entry!.isUnique).toBe(true);
            });
        });

        describe('incremental updates', () => {
            it('should maintain metadata for ascending append', () => {
                const dataModel = new DataModel<any, any>({
                    props: [rangeKey('x'), value('y')],
                });

                const initialData = [
                    { x: 1, y: 10 },
                    { x: 2, y: 20 },
                    { x: 3, y: 30 },
                ];
                const dataSet = new DataSet(initialData);
                const sources = new Map([['test', dataSet]]);

                const result = dataModel.processData(sources)!;
                expect(result[KEY_SORT_ORDERS].get(0)?.sortOrder).toBe(1);
                expect(result[KEY_SORT_ORDERS].get(0)?.isUnique).toBe(true);

                // Append ascending data
                dataSet.addTransaction({ append: [{ x: 4, y: 40 }] });
                const reprocessed = dataModel.reprocessData(result);

                expect(reprocessed[KEY_SORT_ORDERS].get(0)?.sortOrder).toBe(1);
                expect(reprocessed[KEY_SORT_ORDERS].get(0)?.isUnique).toBe(true);
            });

            it('should detect order violation on append', () => {
                const dataModel = new DataModel<any, any>({
                    props: [rangeKey('x'), value('y')],
                });

                const initialData = [
                    { x: 1, y: 10 },
                    { x: 2, y: 20 },
                    { x: 3, y: 30 },
                ];
                const dataSet = new DataSet(initialData);
                const sources = new Map([['test', dataSet]]);

                const result = dataModel.processData(sources)!;
                expect(result[KEY_SORT_ORDERS].get(0)?.sortOrder).toBe(1);

                // Append data that violates ascending order
                dataSet.addTransaction({ append: [{ x: 1, y: 40 }] });
                const reprocessed = dataModel.reprocessData(result);

                expect(reprocessed[KEY_SORT_ORDERS].get(0)?.sortOrder).toBeUndefined();
            });

            it('should detect duplicates on append', () => {
                const dataModel = new DataModel<any, any>({
                    props: [rangeKey('x'), value('y')],
                });

                const initialData = [
                    { x: 1, y: 10 },
                    { x: 2, y: 20 },
                    { x: 3, y: 30 },
                ];
                const dataSet = new DataSet(initialData);
                const sources = new Map([['test', dataSet]]);

                const result = dataModel.processData(sources)!;
                expect(result[KEY_SORT_ORDERS].get(0)?.isUnique).toBe(true);

                // Append duplicate key
                dataSet.addTransaction({ append: [{ x: 3, y: 40 }] });
                const reprocessed = dataModel.reprocessData(result);

                expect(reprocessed[KEY_SORT_ORDERS].get(0)?.isUnique).toBe(false);
            });

            it('should handle rolling window appends (ascending)', () => {
                const dataModel = new DataModel<any, any>({
                    props: [rangeKey('x'), value('y')],
                });

                const initialData = Array.from({ length: 100 }, (_, i) => ({ x: i, y: i * 10 }));
                const dataSet = new DataSet(initialData);
                const sources = new Map([['test', dataSet]]);

                const result = dataModel.processData(sources)!;
                expect(result[KEY_SORT_ORDERS].get(0)?.sortOrder).toBe(1);
                expect(result[KEY_SORT_ORDERS].get(0)?.isUnique).toBe(true);

                // Rolling window: remove from start, append to end
                for (let i = 0; i < 10; i++) {
                    const toRemove = initialData[i];
                    dataSet.addTransaction({
                        remove: [toRemove],
                        append: [{ x: 100 + i, y: (100 + i) * 10 }],
                    });
                }

                const reprocessed = dataModel.reprocessData(result);

                // Order should be preserved
                expect(reprocessed[KEY_SORT_ORDERS].get(0)?.sortOrder).toBe(1);
                expect(reprocessed[KEY_SORT_ORDERS].get(0)?.isUnique).toBe(true);
            });
        });
    });

    describe('sorted domain optimization', () => {
        it('should produce correct domains with sorted unique Date keys', () => {
            const dataModel = new DataModel<any, any>({
                props: [categoryKey('date'), value('value')],
                domainBandingConfig: {
                    minDataSizeForBanding: 10,
                    targetBandCount: 3,
                    enableBanding: true,
                },
            });

            // Create sorted unique Date data
            const data = Array.from({ length: 30 }, (_, i) => ({
                date: new Date(`2024-01-${String(i + 1).padStart(2, '0')}`),
                value: i * 10,
            }));
            const dataSet = new DataSet(data);
            const sources = basicDataSet(data).set('test', dataSet);

            const result = dataModel.processData(sources)!;

            // Verify KEY_SORT_ORDERS metadata
            expect(result[KEY_SORT_ORDERS].get(0)?.sortOrder).toBe(1);
            expect(result[KEY_SORT_ORDERS].get(0)?.isUnique).toBe(true);

            // Verify domain is correct
            expect(result.domain.keys[0].length).toBe(30);
            expect(result.domain.keys[0][0]).toBeInstanceOf(Date);
            expect((result.domain.keys[0][0] as Date).getTime()).toBe(new Date('2024-01-01').getTime());
            expect((result.domain.keys[0][29] as Date).getTime()).toBe(new Date('2024-01-30').getTime());
        });

        it('should handle incremental updates with sorted unique Date keys', () => {
            const dataModel = new DataModel<any, any>({
                props: [categoryKey('date'), value('value')],
                domainBandingConfig: {
                    minDataSizeForBanding: 10,
                    targetBandCount: 3,
                    enableBanding: true,
                },
            });

            const data = Array.from({ length: 30 }, (_, i) => ({
                date: new Date(`2024-01-${String(i + 1).padStart(2, '0')}`),
                value: i * 10,
            }));
            const dataSet = new DataSet(data);
            const sources = basicDataSet(data).set('test', dataSet);

            const result = dataModel.processData(sources)!;

            // Append new sorted data
            dataSet.addTransaction({
                append: [{ date: new Date('2024-01-31'), value: 300 }],
            });

            const reprocessed = dataModel.reprocessData(result);
            verifyReprocessMatchesBaseline(dataModel, reprocessed, sources);

            // Verify domain extended
            expect(reprocessed.domain.keys[0].length).toBe(31);
            expect((reprocessed.domain.keys[0][30] as Date).getTime()).toBe(new Date('2024-01-31').getTime());

            // Verify sort order preserved
            expect(reprocessed[KEY_SORT_ORDERS].get(0)?.sortOrder).toBe(1);
            expect(reprocessed[KEY_SORT_ORDERS].get(0)?.isUnique).toBe(true);
        });

        it('should handle rolling window with sorted unique Date keys', () => {
            const dataModel = new DataModel<any, any>({
                props: [categoryKey('date'), value('value')],
                domainBandingConfig: {
                    minDataSizeForBanding: 10,
                    targetBandCount: 5,
                    enableBanding: true,
                },
            });

            // Start with Jan 1-30
            const data = Array.from({ length: 30 }, (_, i) => ({
                date: new Date(`2024-01-${String(i + 1).padStart(2, '0')}`),
                value: i * 10,
            }));
            const dataSet = new DataSet(data);
            const sources = basicDataSet(data).set('test', dataSet);

            let result: any = dataModel.processData(sources)!;

            // Rolling window: remove first, append next day (continuing into February)
            const appendedDates: Date[] = [];
            for (let i = 0; i < 5; i++) {
                const toRemove = data[i];
                // Continue sequence into February: Jan 31, Feb 1, Feb 2, Feb 3, Feb 4
                const newDate = new Date(2024, i === 0 ? 0 : 1, i === 0 ? 31 : i);
                appendedDates.push(newDate);
                dataSet.addTransaction({
                    remove: [toRemove],
                    append: [{ date: newDate, value: (30 + i) * 10 }],
                });

                result = dataModel.reprocessData(result);
                verifyReprocessMatchesBaseline(dataModel, result, sources);
            }

            // For discrete domains with banding, the domain tracks ALL unique values
            // ever seen (not just currently visible ones). The bands are rebuilt on
            // structure changes, but the full domain history is preserved.
            // Current data is Jan 6-Feb 4 (30 items), but domain includes all seen dates.
            // The actual length depends on banding behavior, but first and last should match.
            const domainTimes = result.domain.keys[0]
                .map((d: Date) => d.getTime())
                .filter((t: number) => Number.isFinite(t));
            const earliestInitial = data[0].date.getTime();
            const latestSeen = appendedDates.at(-1)!.getTime();

            expect(domainTimes.length).toBeGreaterThan(0);
            expect(domainTimes.at(0)).toBeLessThanOrEqual(earliestInitial);
            expect(domainTimes.at(-1)).toBeGreaterThanOrEqual(latestSeen);
        });
    });
});
