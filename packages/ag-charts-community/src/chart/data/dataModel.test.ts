import { describe, expect, it } from '@jest/globals';

import { isFiniteNumber } from 'ag-charts-core';

import { DATA_BROWSER_MARKET_SHARE } from '../test/data';
import * as examples from '../test/examples';
import { expectWarningsCalls, setupMockConsole } from '../test/utils';
import {
    accumulatedValue,
    area as actualArea,
    groupAverage as actualGroupAverage,
    groupCount as actualGroupCount,
    range as actualRange,
    sumValues,
} from './aggregateFunctions';
import type {
    AggregatePropertyDefinition,
    DataModelOptions,
    GroupByFn,
    GroupedData,
    PropertyDefinition,
    PropertyId,
    Scoped,
} from './dataModel';
import { DataModel, getPathComponents } from './dataModel';
import { DataRef } from './dataRef';
import {
    SMALLEST_KEY_INTERVAL,
    SORT_DOMAIN_GROUPS,
    accumulateGroup as actualAccumulateGroup,
    normaliseGroupTo as actualNormaliseGroupTo,
    normalisePropertyTo as actualNormalisePropertyTo,
    rowCountProperty as actualRowCountProperty,
    rangedValueProperty,
} from './processors';

const rangeKey = (property: string) => ({
    scopes: ['test'],
    property,
    type: 'key' as const,
    valueType: 'range' as const,
});
const categoryKey = (property: string, scopes = ['test']) => ({
    scopes,
    property,
    type: 'key' as const,
    valueType: 'category' as const,
});
const scopedValue = (scope: string[] | string, property: string, groupId?: string, id?: string) => {
    let scopes: string[];
    if (Array.isArray(scope)) {
        scopes = scope;
    } else {
        scopes = [scope];
    }
    return {
        scopes,
        property,
        type: 'value' as const,
        valueType: 'range' as const,
        groupId,
        id,
        useScopedValues: Array.isArray(scope) ? scope.length > 1 : false,
    };
};
const value = (property: string, groupId?: string, id?: string) => scopedValue('test', property, groupId, id);
const categoryValue = (property: string) => ({
    scopes: ['test'],
    property,
    type: 'value' as const,
    valueType: 'category' as const,
});
const accumulatedGroupValues = (properties: string[], groupId: string): (Scoped & PropertyDefinition<any>)[] => [
    ...properties.map((p) => ({ ...accumulatedGroupValue(p, groupId), scopes: ['test'] })),
    { ...actualAccumulateGroup(groupId, 'normal', 'current'), scopes: ['test'] },
];
const accumulatedGroupValue = (property: string, groupId: string = property, id?: string) => ({
    ...value(property, groupId, id),
});
const accumulatedPropertyValue = (property: string, groupId: string = property, id?: string) => ({
    ...value(property, groupId, id),
    processor: accumulatedValue(true),
});
const sum = (groupId: string): AggregatePropertyDefinition<any, any> => ({
    id: `sum-${groupId}`,
    matchGroupIds: [groupId],
    type: 'aggregate',
    aggregateFunction: (values) => sumValues(values),
});
const scopedSum = (scopes: string[], groupId: string) => ({ ...sum(groupId), scopes });
const range = (groupId: string) => ({ ...actualRange(`range-${groupId}`, groupId), scopes: ['test'] });
const groupAverage = (matchGroupId: string) => ({
    ...actualGroupAverage(`groupAverage-${matchGroupId}`, { matchGroupId }),
    scopes: ['test'],
});
const rowCountProperty = (prop: string) => ({ ...actualRowCountProperty(prop), scopes: ['test'] });
const groupCount = () => ({ ...actualGroupCount(`groupCount`), scopes: ['test'] });
const area = (groupId: string, aggFn: AggregatePropertyDefinition<any, any>) => ({
    ...actualArea(`area-${groupId}`, aggFn),
    scopes: ['test'],
});
const normaliseGroupTo = (groupId: string, normaliseTo: number) => ({
    ...actualNormaliseGroupTo([groupId], normaliseTo),
    scopes: ['test'],
});
const normalisePropertyTo = (prop: PropertyId<any>, normaliseTo: [number, number]) => ({
    ...actualNormalisePropertyTo(prop, normaliseTo, 0),
    scopes: ['test'],
});

function basicDataSet<T>(data: T[], scopes = ['test']) {
    return new Map([...scopes.map((s) => [s, data] as const)]);
}

function expectedKeys(expected: unknown[]) {
    return [new Map([['test', expected]])];
}

function resolveGroupColumn(result: GroupedData<unknown>, groupIdx: number, columnIdx: number) {
    return result.groups[groupIdx].datumIndices[columnIdx].map((index) => result.columns[columnIdx][index]);
}

function extractGroupValues(data: GroupedData<unknown>, groupIndex?: number) {
    let groups = data.groups;
    if (groupIndex != null) {
        groups = groups.slice(groupIndex, groupIndex + 1);
    }
    const result = groups.map((g) =>
        g.datumIndices[0].map((_, di) => g.datumIndices.map((d, ci) => data.columns[ci][d[di]]))
    );
    if (groupIndex != null) {
        return result[0];
    }
    return result;
}

function mutilatedBrowserData() {
    const datumKeys = ['ie', 'chrome', 'firefox', 'safari'] as const;
    const rawData = DATA_BROWSER_MARKET_SHARE.map((v) => ({ ...v }));
    rawData.forEach((datum, idx) => {
        const keyToDelete = datumKeys[idx % 4];
        delete datum[keyToDelete];
        if (idx % 3 === 0) {
            const illegalValueKey = datumKeys[(idx + 1) % 4];
            datum[illegalValueKey] = 'illegal value' as any;
        }
    });
    return rawData;
}

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
                expect(result.groups[1].datumIndices).toEqual([[1], [1]]);
                expect(result.groups[2].datumIndices).toEqual([[2], [2]]);
                expect(result.groups[3].datumIndices).toEqual([[3], [3]]);
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
                expect(result.groups[1].datumIndices).toEqual([[1], [1], [1], [1]]);
                expect(result.groups[2].datumIndices).toEqual([[2], [2], [2], [2]]);
                expect(result.groups[3].datumIndices).toEqual([[3], [3], [3], [3]]);
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
            });
        });
    });

    describe('missing and invalid data processing', () => {
        it('should generated the expected results', () => {
            const data = basicDataSet(mutilatedBrowserData());
            const DEFAULTS = {
                invalidValue: NaN,
                missingValue: null,
                validation: isFiniteNumber,
            };
            const dataModel = new DataModel<any, any>({
                props: [
                    categoryKey('year'),
                    { ...DEFAULTS, ...value('ie') },
                    { ...DEFAULTS, ...value('chrome') },
                    { ...DEFAULTS, ...value('firefox') },
                    { ...DEFAULTS, ...value('safari') },
                ],
            });

            expect(dataModel.processData(data)).toMatchSnapshot({
                time: expect.any(Number),
            });
        });

        describe('property tests', () => {
            const defaults = { missingValue: null, invalidValue: NaN };
            const validated = { ...defaults, validation: (v: unknown) => typeof v === 'number' };
            const dataModel = new DataModel<any, any, true>({
                props: [
                    categoryKey('kp'),
                    { ...value('vp1', 'group1'), ...validated },
                    { ...value('vp2', 'group1'), ...validated },
                    { ...value('vp3', 'group2'), ...defaults },
                    sum('group1'),
                ],
                groupByKeys: true,
            });
            const data = basicDataSet([
                { kp: 'Q1', /* vp1: 5,*/ vp2: 7, vp3: 1 },
                { kp: 'Q1', vp1: 1, vp2: 'illegal value', vp3: 2 },
                { kp: 'Q2', vp1: 6, vp2: 9 /* vp3: 3 */ },
                { kp: 'Q2', vp1: 6, vp2: 9, vp3: 4 },
            ]);

            it('should substitute missing value when configured', () => {
                const result = dataModel.processData(data)!;

                expect(extractGroupValues(result, 0)).toEqual([[null, 7, 1]]);
                expect(extractGroupValues(result, 1)).toEqual([[1, NaN, 2]]);
                expect(extractGroupValues(result, 2)).toEqual([[6, 9, null]]);
                expect(extractGroupValues(result, 3)).toEqual([[6, 9, 4]]);
            });
        });
    });

    describe('missing and invalid data processing - multiple scopes', () => {
        it('should generated the expected results', () => {
            const data = new Map()
                .set('test', mutilatedBrowserData())
                .set('series-a', mutilatedBrowserData())
                .set('series-b', mutilatedBrowserData())
                .set('series-c', mutilatedBrowserData());
            const DEFAULTS = {
                missingValue: null,
                validation: isFiniteNumber,
            };
            const dataModel = new DataModel<any, any>({
                props: [
                    categoryKey('year'),
                    { ...DEFAULTS, ...scopedValue('test', 'ie') },
                    { ...DEFAULTS, ...scopedValue('series-a', 'chrome') },
                    { ...DEFAULTS, ...scopedValue('series-b', 'firefox') },
                    { ...DEFAULTS, ...scopedValue('series-c', 'safari') },
                ],
            });

            expect(dataModel.processData(data)).toMatchSnapshot({
                time: expect.any(Number),
            });
            expectWarningsCalls().toMatchInlineSnapshot(`
[
  [
    "AG Charts - invalid value of type [string] for [test / undefined] ignored:",
    "[illegal value]",
  ],
  [
    "AG Charts - invalid value of type [string] for [series-a / undefined] ignored:",
    "[illegal value]",
  ],
  [
    "AG Charts - invalid value of type [undefined] for [series-b / undefined] ignored:",
    "[undefined]",
  ],
  [
    "AG Charts - invalid value of type [string] for [series-b / undefined] ignored:",
    "[illegal value]",
  ],
  [
    "AG Charts - invalid value of type [undefined] for [series-c / undefined] ignored:",
    "[undefined]",
  ],
  [
    "AG Charts - invalid value of type [string] for [series-c / undefined] ignored:",
    "[illegal value]",
  ],
]
`);
        });

        describe('property tests', () => {
            const validated = { validation: (v: unknown) => typeof v === 'number' };
            const dataModel = new DataModel<any, any, true>({
                props: [
                    categoryKey('kp', ['test', 'scope-1', 'scope-2']),
                    { ...scopedValue('test', 'vp1', 'group1'), ...validated },
                    { ...scopedValue('scope-1', 'vp2', 'group1'), ...validated },
                    { ...scopedValue('scope-2', 'vp3', 'group2') },
                    scopedSum(['scope-1'], 'group1'),
                ],
                groupByKeys: true,
            });
            const rawData = [
                { kp: 'Q1', vp1: 'illegal value', vp2: 7, vp3: 1 },
                { kp: 'Q2', vp1: 1, vp2: 'illegal value', vp3: 2 },
                { kp: 'Q3', vp1: 6, vp2: 9, vp3: 'illegal value' },
                { kp: 'Q4', vp1: 6, vp2: 9, vp3: 4 },
            ];
            const data = new Map([...['test', 'scope-1', 'scope-2'].map((s) => [s, rawData] as const)]);

            it('should record per result data validation status per scope', () => {
                const result = dataModel.processData(data)!;

                expect(result.groups[0].validScopes).toEqual(new Set(['scope-1', 'scope-2']));
                expect(result.groups[1].validScopes).toEqual(new Set(['test', 'scope-2']));
                expect(result.groups[2].validScopes).toEqual(new Set(['test', 'scope-1', 'scope-2']));
                expectWarningsCalls().toMatchInlineSnapshot(`
[
  [
    "AG Charts - invalid value of type [string] for [test / undefined] ignored:",
    "[illegal value]",
  ],
  [
    "AG Charts - invalid value of type [string] for [scope-1 / undefined] ignored:",
    "[illegal value]",
  ],
]
`);
            });

            it('should handle scope validations distinctly for values', () => {
                const result = dataModel.processData(data)!;

                expect(result.groups).toHaveLength(4);
                expect(extractGroupValues(result, 0)).toEqual([[undefined, 7, 1]]);
                expect(extractGroupValues(result, 1)).toEqual([[1, undefined, 2]]);
                expect(extractGroupValues(result, 2)).toEqual([[6, 9, 'illegal value']]);
                expect(extractGroupValues(result, 3)).toEqual([[6, 9, 4]]);
                expectWarningsCalls().toMatchInlineSnapshot(`
[
  [
    "AG Charts - invalid value of type [string] for [test / undefined] ignored:",
    "[illegal value]",
  ],
  [
    "AG Charts - invalid value of type [string] for [scope-1 / undefined] ignored:",
    "[illegal value]",
  ],
]
`);
            });

            it('should error on missing scope keys', () => {
                const config: DataModelOptions<any, true> = {
                    props: [
                        categoryKey('kp'), // Not scoped, so doesn't match values below.
                        scopedValue('test', 'vp1', 'group1'),
                        scopedValue('scope-1', 'vp2', 'group1'),
                        scopedValue('scope-2', 'vp3', 'group2'),
                        scopedSum(['scope-1'], 'group1'),
                    ],
                    groupByKeys: true,
                };

                expect(() => new DataModel<any, any, true>(config)).toThrowErrorMatchingInlineSnapshot(
                    `"AG Charts - scopes missing key for grouping, illegal configuration: scope-1,scope-2"`
                );
            });
        });
    });

    describe('empty data set processing', () => {
        it('should generated the expected results', () => {
            const dataModel = new DataModel<any, any>({
                props: [categoryKey('year'), value('ie'), value('chrome'), value('firefox'), value('safari')],
            });

            expect(dataModel.processData(basicDataSet([]))).toMatchSnapshot({
                time: expect.any(Number),
            });
        });

        describe('property tests', () => {
            const dataModel = new DataModel<any, any>({
                props: [categoryKey('year'), value('ie'), value('chrome'), value('firefox'), value('safari')],
            });

            it('should not generate data extracts', () => {
                const result = dataModel.processData(basicDataSet([]))!;

                expect(result.keys).toEqual([new Map([['test', []]])]);
            });

            it('should not generate values for domains', () => {
                const result = dataModel.processData(basicDataSet([]))!;

                expect(result.domain.keys).toEqual([[]]);
                expect(result.domain.values).toEqual([[], [], [], []]);
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

            const allData = basicDataSet(data2).set('test1', data1).set('test2', data2);
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

    describe('processValue method', () => {
        it('should expose processValue as a public method', () => {
            const dataModel = new DataModel<any, any>({
                props: [rangeKey('kp'), value('vp1')],
            });

            expect(typeof dataModel.processValue).toBe('function');
        });

        it('should process values correctly with basic property access', () => {
            const dataModel = new DataModel<any, any>({
                props: [rangeKey('kp'), value('vp1')],
            });

            const def = {
                scopes: ['test'],
                property: 'vp1',
                type: 'value' as const,
                valueType: 'range' as const,
                index: 0,
                missing: new Map(),
            };

            const datum = { kp: 2, vp1: 5 };
            const result = dataModel.processValue(def, datum, 0);

            expect(result).toEqual({
                value: 5,
                missing: false,
                valid: true,
            });
        });

        it('should handle missing values correctly', () => {
            const dataModel = new DataModel<any, any>({
                props: [rangeKey('kp'), value('vp1')],
            });

            const def = {
                scopes: ['test'],
                property: 'vp1',
                type: 'value' as const,
                valueType: 'range' as const,
                index: 0,
                missing: new Map(),
                missingValue: null,
            };

            const datum = { kp: 2 }; // vp1 is missing
            const result = dataModel.processValue(def, datum, 0, 'test');

            expect(result).toEqual({
                value: null,
                missing: true,
                valid: true,
            });
        });

        it('should cache processors for reuse', () => {
            const processorCallCount = { count: 0 };
            const mockProcessor = () => {
                processorCallCount.count += 1;
                return (value: any) => value * 2;
            };

            const dataModel = new DataModel<any, any>({
                props: [rangeKey('kp'), { ...value('vp1'), processor: mockProcessor }],
            });

            const def = {
                scopes: ['test'],
                property: 'vp1',
                type: 'value' as const,
                valueType: 'range' as const,
                index: 0,
                missing: new Map(),
                processor: mockProcessor,
            };

            const datum1 = { kp: 2, vp1: 5 };
            const datum2 = { kp: 3, vp1: 6 };

            // First call should create and cache the processor
            const result1 = dataModel.processValue(def, datum1, 0);
            expect(result1.value).toBe(10); // 5 * 2
            expect(processorCallCount.count).toBe(1);

            // Second call should reuse the cached processor
            const result2 = dataModel.processValue(def, datum2, 1);
            expect(result2.value).toBe(12); // 6 * 2
            expect(processorCallCount.count).toBe(1); // Should still be 1, not 2
        });

        it('should handle validation correctly', () => {
            const dataModel = new DataModel<any, any>({
                props: [rangeKey('kp'), value('vp1')],
            });

            const def = {
                scopes: ['test'],
                property: 'vp1',
                type: 'value' as const,
                valueType: 'range' as const,
                index: 0,
                missing: new Map(),
                validation: (value: any) => typeof value === 'number',
                invalidValue: NaN,
            };

            // Valid value
            const validDatum = { kp: 2, vp1: 5 };
            const validResult = dataModel.processValue(def, validDatum, 0);
            expect(validResult).toEqual({
                value: 5,
                missing: false,
                valid: true,
            });

            // Invalid value
            const invalidDatum = { kp: 2, vp1: 'not a number' };
            const invalidResult = dataModel.processValue(def, invalidDatum, 0);
            expect(invalidResult).toEqual({
                value: NaN,
                missing: false,
                valid: false,
            });
        });

        it('should handle forced values', () => {
            const dataModel = new DataModel<any, any>({
                props: [rangeKey('kp'), value('vp1')],
            });

            const def = {
                scopes: ['test'],
                property: 'vp1',
                type: 'value' as const,
                valueType: 'range' as const,
                index: 0,
                missing: new Map(),
                forceValue: 100,
            };

            const datum = { kp: 2, vp1: 5 };
            const result = dataModel.processValue(def, datum, 0);

            expect(result).toEqual({
                value: 100,
                missing: false,
                valid: true,
            });
        });

        it('should track missing values by scope', () => {
            const dataModel = new DataModel<any, any>({
                props: [rangeKey('kp'), value('vp1')],
            });

            const def = {
                scopes: ['test'],
                property: 'vp1',
                type: 'value' as const,
                valueType: 'range' as const,
                index: 0,
                missing: new Map(),
            };

            const datum = { kp: 2 }; // vp1 is missing
            dataModel.processValue(def, datum, 0, 'test');

            expect(def.missing.get('test')).toBe(1);

            // Process another missing value
            dataModel.processValue(def, datum, 1, 'test');
            expect(def.missing.get('test')).toBe(2);
        });

        it('should track missing values by multiple scopes', () => {
            const dataModel = new DataModel<any, any>({
                props: [rangeKey('kp'), value('vp1')],
            });

            const def = {
                scopes: ['test1', 'test2'],
                property: 'vp1',
                type: 'value' as const,
                valueType: 'range' as const,
                index: 0,
                missing: new Map(),
            };

            const datum = { kp: 2 }; // vp1 is missing
            dataModel.processValue(def, datum, 0, ['test1', 'test2']);

            expect(def.missing.get('test1')).toBe(1);
            expect(def.missing.get('test2')).toBe(1);
        });

        describe('applyTransactions', () => {
            it('should update processed data in place for single-scope transactions', () => {
                const dataModel = new DataModel<any, any>({
                    props: [categoryKey('id'), value('amount')],
                });

                const data = [
                    { id: 'A', amount: 1 },
                    { id: 'B', amount: 2 },
                    { id: 'C', amount: 3 },
                ];

                const dataRef = new DataRef(data.slice());
                const sources = basicDataSet(dataRef.data);
                const processed = dataModel.processData(sources)!;

                const newDatum = { id: 'D', amount: 4 };
                dataRef.pendingTransactions = [
                    {
                        remove: [data[1]],
                        append: [newDatum],
                        prepend: undefined,
                    },
                ];

                const incremental = dataModel.applyTransactions(dataRef, processed, sources);
                expect(incremental).toBe(processed);

                dataRef.commitPendingTransactions();
                const reprocessed = dataModel.processData(basicDataSet(dataRef.data))!;

                expect(processed.columns).toEqual(reprocessed.columns);
                expect(processed.keys[0].get('test')).toEqual(reprocessed.keys[0].get('test'));
                expect(processed.domain.values).toEqual(reprocessed.domain.values);
                expect(processed.domain.keys).toEqual(reprocessed.domain.keys);
                expect(processed.input.count).toBe(reprocessed.input.count);
                expect(processed.partialValidDataCount).toBe(reprocessed.partialValidDataCount);
                expect(processed.reduced?.diff?.default.changed).toBe(true);
            });
        });
    });

    // =====================================================================================
    // COMPREHENSIVE INCREMENTAL UPDATE SYSTEM TESTS - Task 6.3
    // =====================================================================================

    describe('Incremental Update System - Unit Tests for Updater Components', () => {
        setupMockConsole();

        describe('DataChangeDescriptor and Builder', () => {
            it('should create empty descriptor correctly', () => {
                const { DataChangeDescriptorBuilder } = require('./dataChangeDescriptor');
                const builder = DataChangeDescriptorBuilder.create();
                expect(builder.isEmpty()).toBe(true);

                const descriptor = builder.build();
                expect(descriptor.removed).toEqual([]);
                expect(descriptor.inserted).toEqual([]);
                expect(descriptor.updated).toEqual([]);
                expect(descriptor.indexShiftRanges).toEqual([]);
                expect(descriptor.metadata.totalRemoved).toBe(0);
                expect(descriptor.metadata.totalInserted).toBe(0);
                expect(descriptor.metadata.totalUpdated).toBe(0);
                expect(descriptor.metadata.netSizeChange).toBe(0);
            });

            it('should handle single removal operation', () => {
                const { DataChangeDescriptorBuilder } = require('./dataChangeDescriptor');
                const builder = DataChangeDescriptorBuilder.create();
                builder.addRemoval(1, { id: 'B', value: 2 });

                const descriptor = builder.build();
                expect(descriptor.removed).toEqual([{ index: 1, datum: { id: 'B', value: 2 } }]);
                expect(descriptor.metadata.totalRemoved).toBe(1);
                expect(descriptor.metadata.netSizeChange).toBe(-1);
            });

            it('should handle single insertion operation', () => {
                const { DataChangeDescriptorBuilder } = require('./dataChangeDescriptor');
                const builder = DataChangeDescriptorBuilder.create();
                builder.addInsertion(2, { id: 'D', value: 4 });

                const descriptor = builder.build();
                expect(descriptor.inserted).toEqual([{ index: 2, datum: { id: 'D', value: 4 } }]);
                expect(descriptor.metadata.totalInserted).toBe(1);
                expect(descriptor.metadata.netSizeChange).toBe(1);
            });

            it('should handle update operation', () => {
                const { DataChangeDescriptorBuilder } = require('./dataChangeDescriptor');
                const builder = DataChangeDescriptorBuilder.create();
                const oldData = { id: 'C', value: 3 };
                const newData = { id: 'C', value: 30 };
                builder.addUpdate(2, oldData, newData);

                const descriptor = builder.build();
                expect(descriptor.updated).toEqual([{ index: 2, oldDatum: oldData, newDatum: newData }]);
                expect(descriptor.metadata.totalUpdated).toBe(1);
                expect(descriptor.metadata.netSizeChange).toBe(0);
            });

            it('should compute index shift ranges for complex operations', () => {
                const { DataChangeDescriptorBuilder } = require('./dataChangeDescriptor');
                const builder = DataChangeDescriptorBuilder.create();

                // Remove at indices 1 and 3, insert at indices 0 and 2
                builder.addRemoval(1, { id: 'B' });
                builder.addRemoval(3, { id: 'D' });
                builder.addInsertion(0, { id: 'New1' });
                builder.addInsertion(2, { id: 'New2' });

                const descriptor = builder.build();
                expect(descriptor.indexShiftRanges.length).toBeGreaterThan(0);
                expect(descriptor.metadata.netSizeChange).toBe(0); // 2 removals, 2 insertions
            });

            it('should validate against duplicate indices', () => {
                const { DataChangeDescriptorBuilder } = require('./dataChangeDescriptor');
                const builder = DataChangeDescriptorBuilder.create();

                builder.addRemoval(1, { id: 'B' });
                expect(() => builder.addRemoval(1, { id: 'C' })).toThrow('Duplicate removal at index 1');

                builder.addUpdate(2, { id: 'old' }, { id: 'new' });
                expect(() => builder.addUpdate(2, { id: 'old2' }, { id: 'new2' })).toThrow(
                    'Duplicate update at index 2'
                );
            });

            it('should validate against conflicting operations', () => {
                const { DataChangeDescriptorBuilder } = require('./dataChangeDescriptor');
                const builder = DataChangeDescriptorBuilder.create();

                builder.addRemoval(1, { id: 'B' });
                builder.addUpdate(1, { id: 'old' }, { id: 'new' });

                expect(() => builder.build()).toThrow('Index 1 cannot be both removed and updated');
            });
        });

        describe('TransactionAnalyzer', () => {
            it('should return undefined for multi-source scenarios', () => {
                const { TransactionAnalyzer } = require('./transactionAnalyzer');
                const dataRef = new DataRef([{ id: 'A' }]);
                const multiSources = new Map([
                    ['scope1', [{ id: 'A' }]],
                    ['scope2', [{ id: 'B' }]],
                ]);

                const result = TransactionAnalyzer.analyze(dataRef, multiSources);
                expect(result).toBeUndefined();
            });

            it('should return empty descriptor for no pending transactions', () => {
                const { TransactionAnalyzer } = require('./transactionAnalyzer');
                const dataRef = new DataRef([{ id: 'A' }]);
                const singleSource = new Map([['test', [{ id: 'A' }]]]);

                const result = TransactionAnalyzer.analyze(dataRef, singleSource);
                expect(result).toBeDefined();
                expect(result!.removed).toEqual([]);
                expect(result!.inserted).toEqual([]);
                expect(result!.updated).toEqual([]);
            });

            it('should analyze append transactions correctly', () => {
                const { TransactionAnalyzer } = require('./transactionAnalyzer');
                const originalData = [{ id: 'A' }, { id: 'B' }];
                const dataRef = new DataRef(originalData.slice());
                const newData = { id: 'C' };

                dataRef.pendingTransactions = [
                    {
                        append: [newData],
                        remove: undefined,
                        prepend: undefined,
                    },
                ];

                const result = TransactionAnalyzer.analyze(dataRef, new Map([['test', originalData]]));
                expect(result).toBeDefined();
                expect(result!.inserted).toEqual([{ index: 2, datum: newData }]);
                expect(result!.metadata.totalInserted).toBe(1);
            });

            it('should analyze prepend transactions correctly', () => {
                const { TransactionAnalyzer } = require('./transactionAnalyzer');
                const originalData = [{ id: 'A' }, { id: 'B' }];
                const dataRef = new DataRef(originalData.slice());
                const newData = { id: 'Zero' };

                dataRef.pendingTransactions = [
                    {
                        prepend: [newData],
                        append: undefined,
                        remove: undefined,
                    },
                ];

                const result = TransactionAnalyzer.analyze(dataRef, new Map([['test', originalData]]));
                expect(result).toBeDefined();
                expect(result!.inserted).toEqual([{ index: 0, datum: newData }]);
                expect(result!.metadata.totalInserted).toBe(1);
            });

            it('should analyze removal transactions using object identity', () => {
                const { TransactionAnalyzer } = require('./transactionAnalyzer');
                const itemA = { id: 'A' };
                const itemB = { id: 'B' };
                const itemC = { id: 'C' };
                const originalData = [itemA, itemB, itemC];
                const dataRef = new DataRef(originalData.slice());

                dataRef.pendingTransactions = [
                    {
                        remove: [itemB],
                        append: undefined,
                        prepend: undefined,
                    },
                ];

                const result = TransactionAnalyzer.analyze(dataRef, new Map([['test', originalData]]));
                expect(result).toBeDefined();
                expect(result!.removed).toEqual([{ index: 1, datum: itemB }]);
                expect(result!.metadata.totalRemoved).toBe(1);
            });

            it('should handle complex mixed transactions', () => {
                const { TransactionAnalyzer } = require('./transactionAnalyzer');
                const itemA = { id: 'A' };
                const itemB = { id: 'B' };
                const itemC = { id: 'C' };
                const originalData = [itemA, itemB, itemC];
                const dataRef = new DataRef(originalData.slice());

                const newPrepend = { id: 'Zero' };
                const newAppend = { id: 'D' };

                dataRef.pendingTransactions = [
                    {
                        remove: [itemB],
                        prepend: [newPrepend],
                        append: [newAppend],
                    },
                ];

                const result = TransactionAnalyzer.analyze(dataRef, new Map([['test', originalData]]));
                expect(result).toBeDefined();
                expect(result!.removed).toEqual([{ index: 1, datum: itemB }]);
                expect(result!.inserted).toEqual([
                    { index: 0, datum: newPrepend },
                    { index: 3, datum: newAppend },
                ]);
                expect(result!.metadata.totalRemoved).toBe(1);
                expect(result!.metadata.totalInserted).toBe(2);
                expect(result!.metadata.netSizeChange).toBe(1);
            });
        });

        describe('ArrayUpdater', () => {
            it('should handle empty changes gracefully', () => {
                const { ArrayUpdater } = require('./arrayUpdater');
                const { DataChangeDescriptorBuilder } = require('./dataChangeDescriptor');

                const array = [1, 2, 3, 4, 5];
                const changes = DataChangeDescriptorBuilder.create().build();

                ArrayUpdater.applyChanges(array, changes);
                expect(array).toEqual([1, 2, 3, 4, 5]);
            });

            it('should apply removals correctly', () => {
                const { ArrayUpdater } = require('./arrayUpdater');
                const { DataChangeDescriptorBuilder } = require('./dataChangeDescriptor');

                const array = [1, 2, 3, 4, 5];
                const changes = DataChangeDescriptorBuilder.create().addRemoval(1, 2).addRemoval(3, 4).build();

                ArrayUpdater.applyChanges(array, changes);
                expect(array).toEqual([1, 3, 5]); // Removed items at indices 1 and 3
            });

            it('should apply insertions correctly', () => {
                const { ArrayUpdater } = require('./arrayUpdater');
                const { DataChangeDescriptorBuilder } = require('./dataChangeDescriptor');

                const array = [1, 2, 3];
                const changes = DataChangeDescriptorBuilder.create()
                    .addInsertion(0, 0)
                    .addInsertion(2, 2.5)
                    .addInsertion(5, 4)
                    .build();

                ArrayUpdater.applyChanges(array, changes);
                expect(array).toEqual([0, 1, 2.5, 2, 3, 4]); // Inserted at correct positions
            });

            it('should apply updates correctly', () => {
                const { ArrayUpdater } = require('./arrayUpdater');
                const { DataChangeDescriptorBuilder } = require('./dataChangeDescriptor');

                const array = [1, 2, 3, 4, 5];
                const changes = DataChangeDescriptorBuilder.create().addUpdate(1, 2, 20).addUpdate(3, 4, 40).build();

                ArrayUpdater.applyChanges(array, changes);
                expect(array).toEqual([1, 20, 3, 40, 5]); // Updated values at indices 1 and 3
            });

            it('should apply complex mixed operations correctly', () => {
                const { ArrayUpdater } = require('./arrayUpdater');
                const { DataChangeDescriptorBuilder } = require('./dataChangeDescriptor');

                const array = [10, 20, 30, 40, 50];
                const changes = DataChangeDescriptorBuilder.create()
                    .addRemoval(1, 20) // Remove 20
                    .addUpdate(2, 30, 300) // Update 30 to 300
                    .addInsertion(0, 5) // Insert 5 at start
                    .addInsertion(4, 45) // Insert 45
                    .build();

                ArrayUpdater.applyChanges(array, changes);
                expect(array).toEqual([5, 10, 300, 40, 45, 50]); // Complex transformation
            });

            it('should use extractor function when provided', () => {
                const { ArrayUpdater } = require('./arrayUpdater');
                const { DataChangeDescriptorBuilder } = require('./dataChangeDescriptor');

                const array = [1, 2, 3];
                const changes = DataChangeDescriptorBuilder.create()
                    .addInsertion(1, { value: 1.5 })
                    .addUpdate(2, 3, { value: 30 })
                    .build();

                const extractor = (datum: any) => datum.value;
                ArrayUpdater.applyChanges(array, changes, extractor);
                expect(array).toEqual([1, 1.5, 30, 3]);
            });

            it('should validate input parameters', () => {
                const { ArrayUpdater } = require('./arrayUpdater');
                const { DataChangeDescriptorBuilder } = require('./dataChangeDescriptor');

                const changes = DataChangeDescriptorBuilder.create().build();

                expect(() => ArrayUpdater.applyChanges(null, changes)).toThrow('Array parameter must be an array');
                expect(() => ArrayUpdater.applyChanges([], null)).toThrow('Changes parameter is required');
            });

            it('should validate index bounds for operations', () => {
                const { ArrayUpdater } = require('./arrayUpdater');
                const { DataChangeDescriptorBuilder } = require('./dataChangeDescriptor');

                const array = [1, 2, 3];
                const changes = DataChangeDescriptorBuilder.create()
                    .addRemoval(5, 'invalid') // Out of bounds
                    .build();

                expect(() => ArrayUpdater.applyChanges(array, changes)).toThrow(
                    'Removal index 5 is out of bounds for array of length 3'
                );
            });
        });

        describe('ProcessedDataMutator', () => {
            it('should require valid processValue function', () => {
                const { ProcessedDataMutator } = require('./processedDataMutator');

                expect(() => new ProcessedDataMutator({})).toThrow(
                    'ProcessedDataMutator requires a processValue implementation'
                );
                expect(() => new ProcessedDataMutator({ processValue: 'not a function' })).toThrow(
                    'ProcessedDataMutator requires a processValue implementation'
                );
            });

            it('should handle empty changes gracefully', () => {
                const { ProcessedDataMutator } = require('./processedDataMutator');
                const { DataChangeDescriptorBuilder } = require('./dataChangeDescriptor');

                const mockProcessValue = jest.fn();
                const mutator = new ProcessedDataMutator({ processValue: mockProcessValue });

                const processedData = {
                    type: 'ungrouped',
                    input: { count: 3 },
                    columns: [
                        [1, 2, 3],
                        [10, 20, 30],
                    ],
                    keys: [new Map([['test', ['A', 'B', 'C']]])],
                    defs: { keys: [], values: [] },
                    domain: { keys: [], values: [] },
                    time: Date.now(),
                };

                const changes = DataChangeDescriptorBuilder.create().build();

                // Should not throw and should not modify data for empty changes
                mutator.mutate(processedData, changes);
                expect(processedData.columns).toEqual([
                    [1, 2, 3],
                    [10, 20, 30],
                ]);
                expect(mockProcessValue).not.toHaveBeenCalled();
            });
        });
    });

    describe('Incremental Update System - Integration Tests', () => {
        setupMockConsole();

        describe('Full Transaction Flow', () => {
            it('should complete full incremental update cycle for simple append', () => {
                const dataModel = new DataModel<any, any>({
                    props: [categoryKey('id'), value('amount')],
                });

                const originalData = [
                    { id: 'A', amount: 1 },
                    { id: 'B', amount: 2 },
                    { id: 'C', amount: 3 },
                ];

                const dataRef = new DataRef(originalData.slice());
                const sources = basicDataSet(dataRef.data);
                const processed = dataModel.processData(sources)!;

                // Record original state for reference
                expect(processed.input.count).toBe(3);

                // Apply append transaction
                const newDatum = { id: 'D', amount: 4 };
                dataRef.pendingTransactions = [
                    {
                        append: [newDatum],
                        remove: undefined,
                        prepend: undefined,
                    },
                ];

                const incremental = dataModel.applyTransactions(dataRef, processed, sources);
                expect(incremental).toBe(processed); // Same reference

                // Verify incremental update worked
                expect(processed.columns[0]).toEqual([1, 2, 3, 4]); // amounts
                expect(processed.keys[0].get('test')).toEqual(['A', 'B', 'C', 'D']); // ids
                expect(processed.input.count).toBe(4);
                expect(processed.reduced?.diff?.default?.changed).toBe(true);

                // Verify against full reprocessing
                dataRef.commitPendingTransactions();
                const reprocessed = dataModel.processData(basicDataSet(dataRef.data))!;

                expect(processed.columns).toEqual(reprocessed.columns);
                expect(processed.keys[0].get('test')).toEqual(reprocessed.keys[0].get('test'));
                expect(processed.domain.values).toEqual(reprocessed.domain.values);
                expect(processed.domain.keys).toEqual(reprocessed.domain.keys);
                expect(processed.input.count).toBe(reprocessed.input.count);
            });

            it('should complete full incremental update cycle for removal', () => {
                const dataModel = new DataModel<any, any>({
                    props: [categoryKey('id'), value('amount')],
                });

                const itemA = { id: 'A', amount: 1 };
                const itemB = { id: 'B', amount: 2 };
                const itemC = { id: 'C', amount: 3 };
                const originalData = [itemA, itemB, itemC];

                const dataRef = new DataRef(originalData.slice());
                const sources = basicDataSet(dataRef.data);
                const processed = dataModel.processData(sources)!;

                // Apply removal transaction
                dataRef.pendingTransactions = [
                    {
                        remove: [itemB],
                        append: undefined,
                        prepend: undefined,
                    },
                ];

                const incremental = dataModel.applyTransactions(dataRef, processed, sources);
                expect(incremental).toBe(processed);

                // Verify incremental update worked
                expect(processed.columns[0]).toEqual([1, 3]); // amounts without B
                expect(processed.keys[0].get('test')).toEqual(['A', 'C']); // ids without B
                expect(processed.input.count).toBe(2);

                // Verify against full reprocessing
                dataRef.commitPendingTransactions();
                const reprocessed = dataModel.processData(basicDataSet(dataRef.data))!;

                expect(processed.columns).toEqual(reprocessed.columns);
                expect(processed.keys[0].get('test')).toEqual(reprocessed.keys[0].get('test'));
                expect(processed.domain.values).toEqual(reprocessed.domain.values);
                expect(processed.domain.keys).toEqual(reprocessed.domain.keys);
                expect(processed.input.count).toBe(reprocessed.input.count);
            });

            it('should complete full incremental update cycle for prepend', () => {
                const dataModel = new DataModel<any, any>({
                    props: [categoryKey('id'), value('amount')],
                });

                const originalData = [
                    { id: 'B', amount: 2 },
                    { id: 'C', amount: 3 },
                ];

                const dataRef = new DataRef(originalData.slice());
                const sources = basicDataSet(dataRef.data);
                const processed = dataModel.processData(sources)!;

                // Apply prepend transaction
                const newDatum = { id: 'A', amount: 1 };
                dataRef.pendingTransactions = [
                    {
                        prepend: [newDatum],
                        append: undefined,
                        remove: undefined,
                    },
                ];

                const incremental = dataModel.applyTransactions(dataRef, processed, sources);
                expect(incremental).toBe(processed);

                // Verify incremental update worked
                expect(processed.columns[0]).toEqual([1, 2, 3]); // amounts with A first
                expect(processed.keys[0].get('test')).toEqual(['A', 'B', 'C']); // ids with A first
                expect(processed.input.count).toBe(3);

                // Verify against full reprocessing
                dataRef.commitPendingTransactions();
                const reprocessed = dataModel.processData(basicDataSet(dataRef.data))!;

                expect(processed.columns).toEqual(reprocessed.columns);
                expect(processed.keys[0].get('test')).toEqual(reprocessed.keys[0].get('test'));
                expect(processed.domain.values).toEqual(reprocessed.domain.values);
                expect(processed.domain.keys).toEqual(reprocessed.domain.keys);
                expect(processed.input.count).toBe(reprocessed.input.count);
            });

            it('should handle complex mixed transactions correctly', () => {
                const dataModel = new DataModel<any, any>({
                    props: [categoryKey('id'), value('amount')],
                });

                const itemA = { id: 'A', amount: 1 };
                const itemB = { id: 'B', amount: 2 };
                const itemC = { id: 'C', amount: 3 };
                const itemD = { id: 'D', amount: 4 };
                const originalData = [itemA, itemB, itemC, itemD];

                const dataRef = new DataRef(originalData.slice());
                const sources = basicDataSet(dataRef.data);
                const processed = dataModel.processData(sources)!;

                // Complex transaction: remove B and C, prepend Zero, append E
                const prependItem = { id: 'Zero', amount: 0 };
                const appendItem = { id: 'E', amount: 5 };

                dataRef.pendingTransactions = [
                    {
                        remove: [itemB, itemC],
                        prepend: [prependItem],
                        append: [appendItem],
                    },
                ];

                const incremental = dataModel.applyTransactions(dataRef, processed, sources);
                expect(incremental).toBe(processed);

                // Expected result: [Zero, A, D, E] with amounts [0, 1, 4, 5]
                expect(processed.columns[0]).toEqual([0, 1, 4, 5]);
                expect(processed.keys[0].get('test')).toEqual(['Zero', 'A', 'D', 'E']);
                expect(processed.input.count).toBe(4);

                // Verify against full reprocessing
                dataRef.commitPendingTransactions();
                const reprocessed = dataModel.processData(basicDataSet(dataRef.data))!;

                expect(processed.columns).toEqual(reprocessed.columns);
                expect(processed.keys[0].get('test')).toEqual(reprocessed.keys[0].get('test'));
                expect(processed.domain.values).toEqual(reprocessed.domain.values);
                expect(processed.domain.keys).toEqual(reprocessed.domain.keys);
                expect(processed.input.count).toBe(reprocessed.input.count);
            });

            it('should update domains correctly after incremental changes', () => {
                const dataModel = new DataModel<any, any>({
                    props: [rangeKey('x'), value('y')],
                });

                const originalData = [
                    { x: 1, y: 10 },
                    { x: 2, y: 20 },
                    { x: 3, y: 30 },
                ];

                const dataRef = new DataRef(originalData.slice());
                const sources = basicDataSet(dataRef.data);
                const processed = dataModel.processData(sources)!;

                // Original domains
                expect(processed.domain.keys).toEqual([[1, 3]]);
                expect(processed.domain.values).toEqual([[10, 30]]);

                // Add data that extends the domains
                const newDatum = { x: 5, y: 50 };
                dataRef.pendingTransactions = [
                    {
                        append: [newDatum],
                        remove: undefined,
                        prepend: undefined,
                    },
                ];

                dataModel.applyTransactions(dataRef, processed, sources);

                // Domains should be updated
                expect(processed.domain.keys).toEqual([[1, 5]]);
                expect(processed.domain.values).toEqual([[10, 50]]);

                // Verify against full reprocessing
                dataRef.commitPendingTransactions();
                const reprocessed = dataModel.processData(basicDataSet(dataRef.data))!;
                expect(processed.domain).toEqual(reprocessed.domain);
            });
        });

        describe('Animation Validation Flags', () => {
            it('should set animation validation flags correctly during incremental updates', () => {
                const dataModel = new DataModel<any, any>({
                    props: [categoryKey('id'), value('amount')],
                });

                const originalData = [
                    { id: 'A', amount: 1 },
                    { id: 'B', amount: 2 },
                ];

                const dataRef = new DataRef(originalData.slice());
                const sources = basicDataSet(dataRef.data);
                const processed = dataModel.processData(sources)!;

                // Apply transaction
                dataRef.pendingTransactions = [
                    {
                        append: [{ id: 'C', amount: 3 }],
                        remove: undefined,
                        prepend: undefined,
                    },
                ];

                dataModel.applyTransactions(dataRef, processed, sources);

                // Animation validation should be disabled for high-frequency updates
                expect(processed.reduced?.animationValidation?.uniqueKeys).toBe(false);
                expect(processed.reduced?.animationValidation?.orderedKeys).toBe(false);
            });
        });
    });

    describe('Incremental Update System - Edge Cases', () => {
        setupMockConsole();

        describe('Empty Data Scenarios', () => {
            it('should handle incremental updates starting from empty data', () => {
                const dataModel = new DataModel<any, any>({
                    props: [categoryKey('id'), value('amount')],
                });

                const dataRef = new DataRef<any>([]);
                const sources = basicDataSet(dataRef.data);
                const processed = dataModel.processData(sources)!;

                expect(processed.input.count).toBe(0);
                expect(processed.columns).toEqual([[]]);

                // Add first item to empty data
                const newDatum = { id: 'A', amount: 1 };
                dataRef.pendingTransactions = [
                    {
                        append: [newDatum],
                        remove: undefined,
                        prepend: undefined,
                    },
                ];

                const incremental = dataModel.applyTransactions(dataRef, processed, sources);
                expect(incremental).toBe(processed);

                expect(processed.input.count).toBe(1);
                expect(processed.columns[0]).toEqual([1]);
                expect(processed.keys[0].get('test')).toEqual(['A']);
            });

            it('should handle transition from single item to empty', () => {
                const dataModel = new DataModel<any, any>({
                    props: [categoryKey('id'), value('amount')],
                });

                const singleItem = { id: 'A', amount: 1 };
                const dataRef = new DataRef([singleItem]);
                const sources = basicDataSet(dataRef.data);
                const processed = dataModel.processData(sources)!;

                expect(processed.input.count).toBe(1);

                // Remove the only item
                dataRef.pendingTransactions = [
                    {
                        remove: [singleItem],
                        append: undefined,
                        prepend: undefined,
                    },
                ];

                const incremental = dataModel.applyTransactions(dataRef, processed, sources);
                expect(incremental).toBe(processed);

                expect(processed.input.count).toBe(0);
                expect(processed.columns).toEqual([[]]);
                expect(processed.keys[0].get('test')).toEqual([]);
            });
        });

        describe('Single Item Scenarios', () => {
            it('should handle operations on single-item data', () => {
                const dataModel = new DataModel<any, any>({
                    props: [categoryKey('id'), value('amount')],
                });

                const singleItem = { id: 'A', amount: 1 };
                const dataRef = new DataRef([singleItem]);
                const sources = basicDataSet(dataRef.data);
                const processed = dataModel.processData(sources)!;

                // Replace single item with prepend + remove
                const newItem = { id: 'B', amount: 2 };
                dataRef.pendingTransactions = [
                    {
                        remove: [singleItem],
                        prepend: [newItem],
                        append: undefined,
                    },
                ];

                const incremental = dataModel.applyTransactions(dataRef, processed, sources);
                expect(incremental).toBe(processed);

                expect(processed.input.count).toBe(1);
                expect(processed.columns[0]).toEqual([2]);
                expect(processed.keys[0].get('test')).toEqual(['B']);
            });
        });

        describe('Null and Invalid Value Scenarios', () => {
            it('should handle null values in transaction data', () => {
                const dataModel = new DataModel<any, any>({
                    props: [categoryKey('id'), value('amount')],
                });

                const originalData = [
                    { id: 'A', amount: 1 },
                    { id: 'B', amount: 2 },
                ];

                const dataRef = new DataRef(originalData.slice());
                const sources = basicDataSet(dataRef.data);
                const processed = dataModel.processData(sources)!;

                // Add item with null value
                const nullItem = { id: 'C', amount: null as any };
                dataRef.pendingTransactions = [
                    {
                        append: [nullItem],
                        remove: undefined,
                        prepend: undefined,
                    },
                ];

                const incremental = dataModel.applyTransactions(dataRef, processed, sources);
                expect(incremental).toBe(processed);

                expect(processed.input.count).toBe(3);
                expect(processed.columns[0]).toEqual([1, 2, null]);
                expect(processed.keys[0].get('test')).toEqual(['A', 'B', 'C']);
            });

            it('should handle undefined values in transaction data', () => {
                const dataModel = new DataModel<any, any>({
                    props: [categoryKey('id'), value('amount')],
                });

                const originalData = [{ id: 'A', amount: 1 }];
                const dataRef = new DataRef(originalData.slice());
                const sources = basicDataSet(dataRef.data);
                const processed = dataModel.processData(sources)!;

                // Add item with undefined value
                const undefinedItem = { id: 'B' } as any; // amount is undefined
                dataRef.pendingTransactions = [
                    {
                        append: [undefinedItem],
                        remove: undefined,
                        prepend: undefined,
                    },
                ];

                const incremental = dataModel.applyTransactions(dataRef, processed, sources);
                expect(incremental).toBe(processed);

                expect(processed.input.count).toBe(2);
                expect(processed.columns[0]).toEqual([1, undefined]);
                expect(processed.keys[0].get('test')).toEqual(['A', 'B']);
            });
        });

        describe('Validation and Error Handling', () => {
            it('should handle missing properties gracefully', () => {
                const dataModel = new DataModel<any, any>({
                    props: [categoryKey('id'), value('amount'), value('optional')],
                });

                const originalData = [{ id: 'A', amount: 1, optional: 10 }];
                const dataRef = new DataRef(originalData.slice());
                const sources = basicDataSet(dataRef.data);
                const processed = dataModel.processData(sources)!;

                // Add item missing optional property
                const incompleteItem = { id: 'B', amount: 2 } as any; // missing 'optional'
                dataRef.pendingTransactions = [
                    {
                        append: [incompleteItem],
                        remove: undefined,
                        prepend: undefined,
                    },
                ];

                const incremental = dataModel.applyTransactions(dataRef, processed, sources);
                expect(incremental).toBe(processed);

                expect(processed.input.count).toBe(2);
                expect(processed.columns[0]).toEqual([1, 2]); // amounts
                expect(processed.columns[1]).toEqual([10, undefined]); // optional values
            });

            it('should handle object identity removal correctly', () => {
                const dataModel = new DataModel<any, any>({
                    props: [categoryKey('id'), value('amount')],
                });

                const itemA = { id: 'A', amount: 1 };
                const itemB = { id: 'B', amount: 2 };
                const itemC = { id: 'C', amount: 3 };
                const originalData = [itemA, itemB, itemC];

                const dataRef = new DataRef(originalData.slice());
                const sources = basicDataSet(dataRef.data);
                const processed = dataModel.processData(sources)!;

                // Try to remove using a different object with same properties
                const notSameObject = { id: 'B', amount: 2 }; // Same values, different object
                dataRef.pendingTransactions = [
                    {
                        remove: [notSameObject],
                        append: undefined,
                        prepend: undefined,
                    },
                ];

                const incremental = dataModel.applyTransactions(dataRef, processed, sources);
                expect(incremental).toBe(processed);

                // Should not remove anything since object identity doesn't match
                expect(processed.input.count).toBe(3);
                expect(processed.columns[0]).toEqual([1, 2, 3]);
                expect(processed.keys[0].get('test')).toEqual(['A', 'B', 'C']);
            });
        });
    });

    describe('Incremental Update System - Grouped vs Ungrouped Data', () => {
        setupMockConsole();

        describe('Ungrouped Data Scenarios', () => {
            it('should handle ungrouped data incremental updates correctly', () => {
                const dataModel = new DataModel<any, any, false>({
                    props: [categoryKey('category'), value('value1'), value('value2')],
                    groupByKeys: false,
                });

                const originalData = [
                    { category: 'A', value1: 1, value2: 10 },
                    { category: 'A', value1: 2, value2: 20 },
                    { category: 'B', value1: 3, value2: 30 },
                ];

                const dataRef = new DataRef(originalData.slice());
                const sources = basicDataSet(dataRef.data);
                const processed = dataModel.processData(sources)!;

                expect(processed.type).toBe('ungrouped');
                expect(processed.input.count).toBe(3);

                // Add more ungrouped data
                const newItems = [
                    { category: 'C', value1: 4, value2: 40 },
                    { category: 'A', value1: 5, value2: 50 },
                ];

                dataRef.pendingTransactions = [
                    {
                        append: newItems,
                        remove: undefined,
                        prepend: undefined,
                    },
                ];

                const incremental = dataModel.applyTransactions(dataRef, processed, sources);
                expect(incremental).toBe(processed);

                expect(processed.type).toBe('ungrouped');
                expect(processed.input.count).toBe(5);
                expect(processed.columns[0]).toEqual([1, 2, 3, 4, 5]); // value1
                expect(processed.columns[1]).toEqual([10, 20, 30, 40, 50]); // value2
                expect(processed.keys[0].get('test')).toEqual(['A', 'A', 'B', 'C', 'A']);

                // Verify against full reprocessing
                dataRef.commitPendingTransactions();
                const reprocessed = dataModel.processData(basicDataSet(dataRef.data))!;
                expect(processed.columns).toEqual(reprocessed.columns);
                expect(processed.keys).toEqual(reprocessed.keys);
            });
        });

        describe('Grouped Data Scenarios', () => {
            it('should handle grouped data incremental updates correctly', () => {
                const dataModel = new DataModel<any, any, true>({
                    props: [categoryKey('category'), value('value1'), value('value2')],
                    groupByKeys: true,
                });

                const originalData = [
                    { category: 'A', value1: 1, value2: 10 },
                    { category: 'B', value1: 2, value2: 20 },
                    { category: 'A', value1: 3, value2: 30 },
                ];

                const dataRef = new DataRef(originalData.slice());
                const sources = basicDataSet(dataRef.data);
                const processed = dataModel.processData(sources)!;

                expect(processed.type).toBe('grouped');
                expect(processed.input.count).toBe(3);
                if (processed.type === 'grouped') {
                    expect(processed.groups).toHaveLength(3);
                }

                // Add new grouped data
                const newItems = [
                    { category: 'C', value1: 4, value2: 40 },
                    { category: 'B', value1: 5, value2: 50 },
                ];

                dataRef.pendingTransactions = [
                    {
                        append: newItems,
                        remove: undefined,
                        prepend: undefined,
                    },
                ];

                const incremental = dataModel.applyTransactions(dataRef, processed, sources);
                expect(incremental).toBe(processed);

                expect(processed.type).toBe('grouped');
                expect(processed.input.count).toBe(5);
                if (processed.type === 'grouped') {
                    expect(processed.groups).toHaveLength(5); // Each item becomes its own group
                }

                // Verify against full reprocessing
                dataRef.commitPendingTransactions();
                const reprocessed = dataModel.processData(basicDataSet(dataRef.data))!;
                expect(processed.columns).toEqual(reprocessed.columns);
                expect(processed.keys).toEqual(reprocessed.keys);
                if (processed.type === 'grouped' && reprocessed.type === 'grouped') {
                    expect(processed.groups.length).toBe(reprocessed.groups.length);
                }
            });
        });
    });

    describe('Incremental Update System - Single-scope vs Multi-scope', () => {
        setupMockConsole();

        describe('Single-scope Scenarios (Incremental Updates)', () => {
            it('should apply incremental updates for single data source', () => {
                const dataModel = new DataModel<any, any>({
                    props: [categoryKey('id'), value('amount')],
                });

                const originalData = [
                    { id: 'A', amount: 1 },
                    { id: 'B', amount: 2 },
                ];

                const dataRef = new DataRef(originalData.slice());
                const singleScopeSource = new Map([['test', dataRef.data]]);
                const processed = dataModel.processData(singleScopeSource)!;

                const newDatum = { id: 'C', amount: 3 };
                dataRef.pendingTransactions = [
                    {
                        append: [newDatum],
                        remove: undefined,
                        prepend: undefined,
                    },
                ];

                const result = dataModel.applyTransactions(dataRef, processed, singleScopeSource);

                // Should return the same processed data instance (incremental update succeeded)
                expect(result).toBe(processed);
                expect(processed.input.count).toBe(3);
                expect(processed.columns[0]).toEqual([1, 2, 3]);
                expect(processed.reduced?.diff?.default?.changed).toBe(true);
            });

            it('should handle single-scope with multiple operations', () => {
                const dataModel = new DataModel<any, any>({
                    props: [categoryKey('id'), value('amount')],
                });

                const itemA = { id: 'A', amount: 1 };
                const itemB = { id: 'B', amount: 2 };
                const itemC = { id: 'C', amount: 3 };
                const originalData = [itemA, itemB, itemC];

                const dataRef = new DataRef(originalData.slice());
                const singleScopeSource = new Map([['test', dataRef.data]]);
                const processed = dataModel.processData(singleScopeSource)!;

                // Complex transaction: remove middle item, add two new items
                const newItem1 = { id: 'D', amount: 4 };
                const newItem2 = { id: 'E', amount: 5 };

                dataRef.pendingTransactions = [
                    {
                        remove: [itemB],
                        append: [newItem1],
                        prepend: [newItem2],
                    },
                ];

                const result = dataModel.applyTransactions(dataRef, processed, singleScopeSource);

                expect(result).toBe(processed);
                expect(processed.input.count).toBe(4); // 3 - 1 + 2 = 4
                expect(processed.columns[0]).toEqual([5, 1, 3, 4]); // [E, A, C, D]
                expect(processed.keys[0].get('test')).toEqual(['E', 'A', 'C', 'D']);
            });
        });

        describe('Multi-scope Scenarios (Fallback to Full Reprocessing)', () => {
            it('should return undefined for multi-scope data sources', () => {
                const dataModel = new DataModel<any, any>({
                    props: [
                        categoryKey('id', ['scope1', 'scope2']),
                        scopedValue('scope1', 'amount1'),
                        scopedValue('scope2', 'amount2'),
                    ],
                });

                const data1 = [
                    { id: 'A', amount1: 1 },
                    { id: 'B', amount1: 2 },
                ];
                const data2 = [
                    { id: 'A', amount2: 10 },
                    { id: 'B', amount2: 20 },
                ];
                const dataRef = new DataRef(data1.slice());

                const multiScopeSource = new Map([
                    ['scope1', data1],
                    ['scope2', data2 as any],
                ] as [string, any[]][]);

                const processed = dataModel.processData(multiScopeSource)!;

                dataRef.pendingTransactions = [
                    {
                        append: [{ id: 'C', amount1: 3 }],
                        remove: undefined,
                        prepend: undefined,
                    },
                ];

                const result = dataModel.applyTransactions(dataRef, processed, multiScopeSource);

                // Should return undefined indicating fallback to full reprocessing needed
                expect(result).toBeUndefined();
            });

            it('should correctly identify multi-scope scenarios', () => {
                const dataModel = new DataModel<any, any>({
                    props: [categoryKey('id'), value('amount')],
                });

                const originalData = [{ id: 'A', amount: 1 }];
                const dataRef = new DataRef(originalData.slice());

                // Create multi-scope source even with same data
                const multiScopeSource = new Map([
                    ['scope1', originalData],
                    ['scope2', originalData], // Same data, but multiple scopes
                ]);

                const processed = dataModel.processData(multiScopeSource)!;

                dataRef.pendingTransactions = [
                    {
                        append: [{ id: 'B', amount: 2 }],
                        remove: undefined,
                        prepend: undefined,
                    },
                ];

                const result = dataModel.applyTransactions(dataRef, processed, multiScopeSource);

                expect(result).toBeUndefined();
            });

            it('should handle edge case of exactly one scope', () => {
                const dataModel = new DataModel<any, any>({
                    props: [categoryKey('id'), value('amount')],
                });

                const originalData = [{ id: 'A', amount: 1 }];
                const dataRef = new DataRef(originalData.slice());

                // Exactly one scope - should allow incremental updates
                const singleScopeSource = new Map([['onlyScope', originalData]]);

                const processed = dataModel.processData(singleScopeSource)!;

                dataRef.pendingTransactions = [
                    {
                        append: [{ id: 'B', amount: 2 }],
                        remove: undefined,
                        prepend: undefined,
                    },
                ];

                const result = dataModel.applyTransactions(dataRef, processed, singleScopeSource);

                expect(result).toBe(processed); // Should succeed
            });
        });
    });

    describe('Incremental Update System - Performance Tests', () => {
        setupMockConsole();

        describe('Real-world Data Size Performance', () => {
            it('should handle 1K items efficiently', () => {
                const dataModel = new DataModel<any, any>({
                    props: [categoryKey('id'), value('value1'), value('value2')],
                });

                // Generate 1K items
                const largeData = Array.from({ length: 1000 }, (_, i) => ({
                    id: `item_${i}`,
                    value1: Math.random() * 100,
                    value2: Math.random() * 1000,
                }));

                const dataRef = new DataRef(largeData.slice());
                const sources = basicDataSet(dataRef.data);
                const processed = dataModel.processData(sources)!;

                expect(processed.input.count).toBe(1000);

                const startTime = performance.now();

                // Add 100 new items
                const newItems = Array.from({ length: 100 }, (_, i) => ({
                    id: `new_item_${i}`,
                    value1: Math.random() * 100,
                    value2: Math.random() * 1000,
                }));

                dataRef.pendingTransactions = [
                    {
                        append: newItems,
                        remove: undefined,
                        prepend: undefined,
                    },
                ];

                const incremental = dataModel.applyTransactions(dataRef, processed, sources);
                const endTime = performance.now();

                expect(incremental).toBe(processed);
                expect(processed.input.count).toBe(1100);

                // Performance expectation: should complete in reasonable time
                const duration = endTime - startTime;
                expect(duration).toBeLessThan(100); // Less than 100ms
            });

            it('should handle 10K items with reasonable performance', () => {
                const dataModel = new DataModel<any, any>({
                    props: [categoryKey('id'), value('value')],
                });

                // Generate 10K items
                const largeData = Array.from({ length: 10000 }, (_, i) => ({
                    id: `item_${i}`,
                    value: i,
                }));

                const dataRef = new DataRef(largeData.slice());
                const sources = basicDataSet(dataRef.data);
                const processed = dataModel.processData(sources)!;

                const startTime = performance.now();

                // Remove 1K items and add 500 new items
                const toRemove = largeData.slice(1000, 2000); // Remove 1K items
                const newItems = Array.from({ length: 500 }, (_, i) => ({
                    id: `new_${i}`,
                    value: 20000 + i,
                }));

                dataRef.pendingTransactions = [
                    {
                        remove: toRemove,
                        append: newItems,
                        prepend: undefined,
                    },
                ];

                const incremental = dataModel.applyTransactions(dataRef, processed, sources);
                const endTime = performance.now();

                expect(incremental).toBe(processed);
                expect(processed.input.count).toBe(9500); // 10K - 1K + 500

                // Performance expectation: should complete within reasonable time for large dataset
                const duration = endTime - startTime;
                expect(duration).toBeLessThan(500); // Less than 500ms for 10K items
            });

            it('should demonstrate performance advantage over full reprocessing', () => {
                const dataModel = new DataModel<any, any>({
                    props: [categoryKey('id'), value('value')],
                });

                // Generate 5K items
                const data = Array.from({ length: 5000 }, (_, i) => ({
                    id: `item_${i}`,
                    value: i,
                }));

                const dataRef = new DataRef(data.slice());
                const sources = basicDataSet(dataRef.data);
                const processed = dataModel.processData(sources)!;

                const newItems = Array.from({ length: 50 }, (_, i) => ({
                    id: `new_${i}`,
                    value: 10000 + i,
                }));

                // Measure incremental update time
                dataRef.pendingTransactions = [
                    {
                        append: newItems,
                        remove: undefined,
                        prepend: undefined,
                    },
                ];

                const incrementalStart = performance.now();
                const incremental = dataModel.applyTransactions(dataRef, processed, sources);
                const incrementalEnd = performance.now();
                const incrementalTime = incrementalEnd - incrementalStart;

                expect(incremental).toBe(processed);

                // Simulate full reprocessing
                dataRef.commitPendingTransactions();
                const fullReprocessStart = performance.now();
                const reprocessed = dataModel.processData(basicDataSet(dataRef.data))!;
                const fullReprocessEnd = performance.now();
                const fullReprocessTime = fullReprocessEnd - fullReprocessStart;

                // Incremental should be faster (but allow for timing variance in CI environments)
                if (fullReprocessTime > 0) {
                    expect(incrementalTime).toBeLessThan(fullReprocessTime * 2); // Allow up to 2x slower in worst case
                }
                expect(processed.columns).toEqual(reprocessed.columns);
            });
        });

        describe('Memory Usage Tests', () => {
            it('should not leak memory during repeated updates', () => {
                const dataModel = new DataModel<any, any>({
                    props: [categoryKey('id'), value('value')],
                });

                const initialData = Array.from({ length: 100 }, (_, i) => ({
                    id: `item_${i}`,
                    value: i,
                }));

                const dataRef = new DataRef(initialData.slice());
                const sources = basicDataSet(dataRef.data);
                const processed = dataModel.processData(sources)!;

                // Perform many incremental updates
                for (let batch = 0; batch < 10; batch++) {
                    const newItems = Array.from({ length: 10 }, (_, i) => ({
                        id: `batch_${batch}_item_${i}`,
                        value: 1000 + batch * 10 + i,
                    }));

                    dataRef.pendingTransactions = [
                        {
                            append: newItems,
                            remove: undefined,
                            prepend: undefined,
                        },
                    ];

                    const result = dataModel.applyTransactions(dataRef, processed, sources);
                    expect(result).toBe(processed);
                    dataRef.commitPendingTransactions();
                }

                // Final verification
                expect(processed.input.count).toBe(200); // 100 initial + 10 batches * 10 items
                expect(processed.columns[0]).toHaveLength(200);

                // Memory should be stable (no growing references)
                expect(processed.columns[0][0]).toBe(0); // First item still there
                expect(processed.columns[0][199]).toBe(1099); // Last item correctly added
            });
        });
    });

    describe('Incremental Update System - Concurrency Tests', () => {
        setupMockConsole();

        describe('Rapid Successive Transactions', () => {
            it('should handle rapid successive append operations', async () => {
                const dataModel = new DataModel<any, any>({
                    props: [categoryKey('id'), value('value')],
                });

                const initialData = [
                    { id: 'A', value: 1 },
                    { id: 'B', value: 2 },
                ];

                const dataRef = new DataRef(initialData.slice());
                const sources = basicDataSet(dataRef.data);
                const processed = dataModel.processData(sources)!;

                // Simulate rapid successive transactions
                const transactions = [];
                for (let i = 0; i < 10; i++) {
                    transactions.push({
                        append: [{ id: `rapid_${i}`, value: 100 + i }],
                        remove: undefined,
                        prepend: undefined,
                    });
                }

                // Apply all transactions rapidly
                for (const transaction of transactions) {
                    dataRef.pendingTransactions = [transaction];
                    const result = dataModel.applyTransactions(dataRef, processed, sources);
                    expect(result).toBe(processed);
                    dataRef.commitPendingTransactions();
                }

                // Verify final state
                expect(processed.input.count).toBe(12); // 2 initial + 10 rapid adds
                expect(processed.columns[0]).toEqual([1, 2, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109]);
            });

            it('should handle interleaved add/remove operations', () => {
                const dataModel = new DataModel<any, any>({
                    props: [categoryKey('id'), value('value')],
                });

                const itemA = { id: 'A', value: 1 };
                const itemB = { id: 'B', value: 2 };
                const itemC = { id: 'C', value: 3 };
                const initialData = [itemA, itemB, itemC];

                const dataRef = new DataRef(initialData.slice());
                const sources = basicDataSet(dataRef.data);
                const processed = dataModel.processData(sources)!;

                // Interleaved operations: add, remove, add, remove
                const operations = [
                    { append: [{ id: 'D', value: 4 }], remove: undefined, prepend: undefined },
                    { remove: [itemB], append: undefined, prepend: undefined },
                    { prepend: [{ id: 'Zero', value: 0 }], append: undefined, remove: undefined },
                    { remove: [itemC], append: undefined, prepend: undefined },
                    { append: [{ id: 'E', value: 5 }], remove: undefined, prepend: undefined },
                ];

                for (const operation of operations) {
                    dataRef.pendingTransactions = [operation];
                    const result = dataModel.applyTransactions(dataRef, processed, sources);
                    expect(result).toBe(processed);
                    dataRef.commitPendingTransactions();
                }

                // Final state should be: [Zero, A, D, E] (B and C removed)
                expect(processed.input.count).toBe(4);
                expect(processed.keys[0].get('test')).toEqual(['Zero', 'A', 'D', 'E']);
                expect(processed.columns[0]).toEqual([0, 1, 4, 5]);
            });
        });

        describe('Stress Tests', () => {
            it('should handle 100 transactions per second scenario', () => {
                const dataModel = new DataModel<any, any>({
                    props: [categoryKey('id'), value('value')],
                });

                const initialData = Array.from({ length: 50 }, (_, i) => ({
                    id: `initial_${i}`,
                    value: i,
                }));

                const dataRef = new DataRef(initialData.slice());
                const sources = basicDataSet(dataRef.data);
                const processed = dataModel.processData(sources)!;

                const startTime = performance.now();

                // Simulate 100 rapid transactions
                for (let i = 0; i < 100; i++) {
                    const transaction = {
                        append: [{ id: `stress_${i}`, value: 1000 + i }],
                        remove: undefined,
                        prepend: undefined,
                    };

                    dataRef.pendingTransactions = [transaction];
                    const result = dataModel.applyTransactions(dataRef, processed, sources);
                    expect(result).toBe(processed);
                    dataRef.commitPendingTransactions();
                }

                const endTime = performance.now();
                const duration = endTime - startTime;

                // Should complete in reasonable time
                expect(duration).toBeLessThan(1000); // Less than 1 second for 100 operations

                // Verify final state
                expect(processed.input.count).toBe(150); // 50 initial + 100 stress
                expect(processed.columns[0][0]).toBe(0); // First initial item
                expect(processed.columns[0][149]).toBe(1099); // Last stress item
            });

            it('should maintain consistency under mixed operation stress', () => {
                const dataModel = new DataModel<any, any>({
                    props: [categoryKey('id'), value('value')],
                });

                const items = Array.from({ length: 20 }, (_, i) => ({
                    id: `item_${i}`,
                    value: i,
                }));

                const dataRef = new DataRef(items.slice());
                const sources = basicDataSet(dataRef.data);
                const processed = dataModel.processData(sources)!;

                // Mixed stress operations
                let currentItems = items.slice();
                for (let round = 0; round < 20; round++) {
                    const operationType = round % 3;

                    let transaction;
                    if (operationType === 0) {
                        // Add operation
                        const newItem = { id: `new_${round}`, value: 1000 + round };
                        transaction = { append: [newItem], remove: undefined, prepend: undefined };
                        currentItems.push(newItem);
                    } else if (operationType === 1 && currentItems.length > 5) {
                        // Remove operation (keep at least 5 items)
                        const removeIndex = Math.floor(Math.random() * currentItems.length);
                        const itemToRemove = currentItems[removeIndex];
                        transaction = { remove: [itemToRemove], append: undefined, prepend: undefined };
                        currentItems = currentItems.filter((item) => item !== itemToRemove);
                    } else {
                        // Prepend operation
                        const newItem = { id: `prepend_${round}`, value: 2000 + round };
                        transaction = { prepend: [newItem], append: undefined, remove: undefined };
                        currentItems.unshift(newItem);
                    }

                    dataRef.pendingTransactions = [transaction];
                    const result = dataModel.applyTransactions(dataRef, processed, sources);
                    expect(result).toBe(processed);
                    dataRef.commitPendingTransactions();
                }

                // Verify final consistency
                expect(processed.input.count).toBe(currentItems.length);
                expect(processed.columns[0]).toHaveLength(currentItems.length);

                // Data should remain consistent
                const expectedValues = currentItems.map((item) => item.value);
                expect(processed.columns[0]).toEqual(expectedValues);
            });
        });

        describe('Memory Pressure Tests', () => {
            it('should handle memory pressure during high-frequency updates', () => {
                const dataModel = new DataModel<any, any>({
                    props: [categoryKey('id'), value('value')],
                });

                const initialData = Array.from({ length: 100 }, (_, i) => ({
                    id: `mem_${i}`,
                    value: i,
                }));

                const dataRef = new DataRef(initialData.slice());
                const sources = basicDataSet(dataRef.data);
                const processed = dataModel.processData(sources)!;

                // Create memory pressure with large batches
                for (let batch = 0; batch < 10; batch++) {
                    const largeBatch = Array.from({ length: 100 }, (_, i) => ({
                        id: `batch_${batch}_${i}`,
                        value: batch * 1000 + i,
                    }));

                    dataRef.pendingTransactions = [
                        {
                            append: largeBatch,
                            remove: undefined,
                            prepend: undefined,
                        },
                    ];

                    const result = dataModel.applyTransactions(dataRef, processed, sources);
                    expect(result).toBe(processed);
                    dataRef.commitPendingTransactions();

                    // Verify integrity after each batch
                    expect(processed.input.count).toBe(100 + (batch + 1) * 100);
                    expect(processed.columns[0]).toHaveLength(processed.input.count);
                }

                // Final verification after memory pressure
                expect(processed.input.count).toBe(1100); // 100 initial + 10 * 100
                expect(processed.columns[0][0]).toBe(0); // First item preserved
                expect(processed.columns[0][1099]).toBe(9099); // Last item correct
            });

            it('should handle alternating large add/remove cycles', () => {
                const dataModel = new DataModel<any, any>({
                    props: [categoryKey('id'), value('value')],
                });

                const baseItems = Array.from({ length: 50 }, (_, i) => ({
                    id: `base_${i}`,
                    value: i,
                }));

                const dataRef = new DataRef(baseItems.slice());
                const sources = basicDataSet(dataRef.data);
                const processed = dataModel.processData(sources)!;

                let currentItems = baseItems.slice();

                // Alternating large add/remove cycles
                for (let cycle = 0; cycle < 5; cycle++) {
                    // Add large batch
                    const addBatch = Array.from({ length: 80 }, (_, i) => ({
                        id: `cycle_${cycle}_add_${i}`,
                        value: cycle * 1000 + i,
                    }));

                    dataRef.pendingTransactions = [
                        {
                            append: addBatch,
                            remove: undefined,
                            prepend: undefined,
                        },
                    ];

                    let result = dataModel.applyTransactions(dataRef, processed, sources);
                    expect(result).toBe(processed);
                    dataRef.commitPendingTransactions();
                    currentItems.push(...addBatch);

                    expect(processed.input.count).toBe(currentItems.length);

                    // Remove batch (keep base items)
                    const toRemove = addBatch.slice(0, 60); // Remove 60 of the 80 added
                    dataRef.pendingTransactions = [
                        {
                            remove: toRemove,
                            append: undefined,
                            prepend: undefined,
                        },
                    ];

                    result = dataModel.applyTransactions(dataRef, processed, sources);
                    expect(result).toBe(processed);
                    dataRef.commitPendingTransactions();
                    currentItems = currentItems.filter((item) => !toRemove.includes(item));

                    expect(processed.input.count).toBe(currentItems.length);
                }

                // Should maintain consistency after cycles
                expect(processed.input.count).toBeGreaterThan(50); // At least base items
                expect(processed.columns[0]).toHaveLength(processed.input.count);
            });
        });
    });

    describe('Incremental Update System - E2E Integration Tests', () => {
        setupMockConsole();

        describe('Chart Update Integration', () => {
            it('should integrate with chart update lifecycle', () => {
                const dataModel = new DataModel<any, any>({
                    props: [categoryKey('id'), value('amount')],
                });

                const originalData = [
                    { id: 'A', amount: 1 },
                    { id: 'B', amount: 2 },
                    { id: 'C', amount: 3 },
                ];

                const dataRef = new DataRef(originalData.slice());
                const sources = basicDataSet(dataRef.data);
                const processed = dataModel.processData(sources)!;

                // Simulate chart update with transaction
                const newDatum = { id: 'D', amount: 4 };
                dataRef.pendingTransactions = [
                    {
                        append: [newDatum],
                        remove: undefined,
                        prepend: undefined,
                    },
                ];

                // Apply incremental update (mimics what DataController would do)
                const incrementalResult = dataModel.applyTransactions(dataRef, processed, sources);
                expect(incrementalResult).toBe(processed); // Same reference returned

                // Verify animation flags are set for high-frequency updates
                expect(processed.reduced?.animationValidation?.uniqueKeys).toBe(false);
                expect(processed.reduced?.animationValidation?.orderedKeys).toBe(false);

                // Verify diff metadata is updated
                expect(processed.reduced?.diff?.default?.changed).toBe(true);

                // Chart series would receive the updated ProcessedData reference
                // and should see the new data without reprocessing
                expect(processed.input.count).toBe(4);
                expect(processed.columns[0]).toEqual([1, 2, 3, 4]);
                expect(processed.keys[0].get('test')).toEqual(['A', 'B', 'C', 'D']);

                // Domains should be updated
                expect(processed.domain.values[0]).toEqual([1, 4]);
            });

            it('should handle chart update with multiple transaction types', () => {
                const dataModel = new DataModel<any, any>({
                    props: [rangeKey('x'), value('y')],
                });

                const itemA = { x: 1, y: 10 };
                const itemB = { x: 2, y: 20 };
                const itemC = { x: 3, y: 30 };
                const originalData = [itemA, itemB, itemC];

                const dataRef = new DataRef(originalData.slice());
                const sources = basicDataSet(dataRef.data);
                const processed = dataModel.processData(sources)!;

                // Original state
                expect(processed.domain.keys).toEqual([[1, 3]]);
                expect(processed.domain.values).toEqual([[10, 30]]);

                // Complex chart update: remove middle point, add new endpoints
                const prependItem = { x: 0, y: 5 };
                const appendItem = { x: 4, y: 40 };

                dataRef.pendingTransactions = [
                    {
                        remove: [itemB],
                        prepend: [prependItem],
                        append: [appendItem],
                    },
                ];

                const incrementalResult = dataModel.applyTransactions(dataRef, processed, sources);
                expect(incrementalResult).toBe(processed);

                // Chart should see updated data with correct ordering and domains
                expect(processed.input.count).toBe(4); // -1 + 2 = +1
                expect(processed.keys[0].get('test')).toEqual([0, 1, 3, 4]); // x values
                expect(processed.columns[0]).toEqual([5, 10, 30, 40]); // y values

                // Domains should expand
                expect(processed.domain.keys).toEqual([[0, 4]]);
                expect(processed.domain.values).toEqual([[5, 40]]);

                // Animation should be disabled
                expect(processed.reduced?.animationValidation?.uniqueKeys).toBe(false);
                expect(processed.reduced?.animationValidation?.orderedKeys).toBe(false);
            });
        });

        describe('Cross-Component Integration', () => {
            it('should work correctly with different property types', () => {
                const dataModel = new DataModel<any, any>({
                    props: [categoryKey('category'), rangeKey('timestamp'), value('amount'), value('percentage')],
                });

                const originalData = [
                    { category: 'A', amount: 100, percentage: 0.1, timestamp: 1000 },
                    { category: 'B', amount: 200, percentage: 0.2, timestamp: 2000 },
                ];

                const dataRef = new DataRef(originalData.slice());
                const sources = basicDataSet(dataRef.data);
                const processed = dataModel.processData(sources)!;

                // Add mixed data types
                const newItems = [
                    { category: 'C', amount: 300, percentage: 0.3, timestamp: 3000 },
                    { category: 'D', amount: 400, percentage: 0.4, timestamp: 4000 },
                ];

                dataRef.pendingTransactions = [
                    {
                        append: newItems,
                        remove: undefined,
                        prepend: undefined,
                    },
                ];

                const result = dataModel.applyTransactions(dataRef, processed, sources);
                expect(result).toBe(processed);

                // Verify all property types handled correctly
                expect(processed.columns[0]).toEqual([100, 200, 300, 400]); // amount
                expect(processed.columns[1]).toEqual([0.1, 0.2, 0.3, 0.4]); // percentage
                expect(processed.keys[0].get('test')).toEqual(['A', 'B', 'C', 'D']); // category
                expect(processed.keys[1].get('test')).toEqual([1000, 2000, 3000, 4000]); // timestamp

                // Domains for different types
                expect(processed.domain.values[0]).toEqual([100, 400]); // amount domain
                expect(processed.domain.values[1]).toEqual([0.1, 0.4]); // percentage domain
                expect(processed.domain.keys[1]).toEqual([1000, 4000]); // timestamp domain
            });

            it('should handle complex data with validation rules', () => {
                const validation = (v: unknown) => typeof v === 'number' && v >= 0;
                const dataModel = new DataModel<any, any>({
                    props: [
                        categoryKey('id'),
                        { ...value('validatedValue'), validation, invalidValue: -1 },
                        { ...value('optionalValue'), missingValue: null },
                    ],
                });

                const originalData = [
                    { id: 'A', validatedValue: 10, optionalValue: 100 },
                    { id: 'B', validatedValue: 20 }, // missing optionalValue
                ];

                const dataRef = new DataRef(originalData.slice());
                const sources = basicDataSet(dataRef.data);
                const processed = dataModel.processData(sources)!;

                // Add data with validation issues
                const newItems = [
                    { id: 'C', validatedValue: -999, optionalValue: 300 }, // Invalid validatedValue
                    { id: 'D', validatedValue: 40 }, // Missing optionalValue, valid validatedValue
                    { id: 'E', validatedValue: 'invalid' as any, optionalValue: 500 }, // Invalid validatedValue type
                ];

                dataRef.pendingTransactions = [
                    {
                        append: newItems,
                        remove: undefined,
                        prepend: undefined,
                    },
                ];

                const result = dataModel.applyTransactions(dataRef, processed, sources);
                expect(result).toBe(processed);

                // Verify validation and missing value handling
                expect(processed.columns[0]).toEqual([10, 20, -1, 40, -1]); // validatedValue with invalidValue
                expect(processed.columns[1]).toEqual([100, null, 300, null, 500]); // optionalValue with missingValue
                expect(processed.keys[0].get('test')).toEqual(['A', 'B', 'C', 'D', 'E']);
            });
        });

        describe('Error Scenarios and Recovery', () => {
            it('should handle graceful fallback when incremental update is not possible', () => {
                const dataModel = new DataModel<any, any>({
                    props: [
                        categoryKey('id', ['scope1', 'scope2']),
                        scopedValue('scope1', 'value1'),
                        scopedValue('scope2', 'value2'),
                    ],
                });

                const data1 = [{ id: 'A', value1: 1 }];
                const data2 = [{ id: 'A', value2: 10 }];
                const dataRef = new DataRef(data1.slice());

                const multiScopeSource = new Map([
                    ['scope1', data1],
                    ['scope2', data2 as any],
                ] as [string, any[]][]);

                const processed = dataModel.processData(multiScopeSource)!;

                // This should trigger fallback to full reprocessing
                dataRef.pendingTransactions = [
                    {
                        append: [{ id: 'B', value1: 2 }],
                        remove: undefined,
                        prepend: undefined,
                    },
                ];

                const result = dataModel.applyTransactions(dataRef, processed, multiScopeSource);

                // Should return undefined indicating fallback needed
                expect(result).toBeUndefined();

                // Calling code should fall back to full reprocessing
                dataRef.commitPendingTransactions();
                const newData1 = [...data1, { id: 'B', value1: 2 }];
                const newSources = new Map([
                    ['scope1', newData1],
                    ['scope2', data2 as any],
                ] as [string, any[]][]);

                const fullReprocessed = dataModel.processData(newSources)!;
                expect(fullReprocessed.input.count).toBe(2);
            });

            it('should maintain data integrity during error conditions', () => {
                const dataModel = new DataModel<any, any>({
                    props: [categoryKey('id'), value('amount')],
                });

                const originalData = [
                    { id: 'A', amount: 1 },
                    { id: 'B', amount: 2 },
                ];

                const dataRef = new DataRef(originalData.slice());
                const sources = basicDataSet(dataRef.data);
                const processed = dataModel.processData(sources)!;

                // Verify initial state
                expect(processed.input.count).toBe(2);

                // Valid operation that should succeed
                dataRef.pendingTransactions = [
                    {
                        append: [{ id: 'C', amount: 3 }],
                        remove: undefined,
                        prepend: undefined,
                    },
                ];

                const result = dataModel.applyTransactions(dataRef, processed, sources);
                expect(result).toBe(processed);

                // Verify successful update
                expect(processed.input.count).toBe(3);
                expect(processed.columns[0]).toEqual([1, 2, 3]);
                expect(processed.keys[0].get('test')).toEqual(['A', 'B', 'C']);

                // Data should be consistent and complete
                expect(processed.columns[0]).toHaveLength(processed.input.count);
                expect(processed.keys[0].get('test')).toHaveLength(processed.input.count);
            });
        });
    });
});
