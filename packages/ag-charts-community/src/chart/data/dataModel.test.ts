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
                originalDataSources: expect.any(Map),
                originalToTransformedMap: expect.any(Map),
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
                expect(result.groups).toHaveLength(2);
                expect(result.groups[0].keys).toEqual(['Q1']);
                expect(result.groups[1].keys).toEqual(['Q2']);
            });

            it('should extract the configured values', () => {
                const result = dataModel.processData(data)!;

                expect(result.type).toEqual('grouped');
                expect(result.groups).toHaveLength(2);
                expect(result.groups[0].datumIndices).toEqual([
                    [0, 1],
                    [0, 1],
                ]);
                expect(result.groups[1].datumIndices).toEqual([
                    [2, 3],
                    [2, 3],
                ]);
                expect(resolveGroupColumn(result, 0, 0)).toEqual([5, 1]);
                expect(resolveGroupColumn(result, 0, 1)).toEqual([7, 2]);
                expect(resolveGroupColumn(result, 1, 0)).toEqual([6, 6]);
                expect(resolveGroupColumn(result, 1, 1)).toEqual([9, 9]);
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
                expect(result.groups).toHaveLength(2);
                expect(result.groups.map((g) => g.keys[0])).toEqual(['Q1', 'Q2']);
                expect(result.groups[0].aggregation).toEqual([[0, expect.closeTo(12)]]);
                expect(result.groups[1].aggregation).toEqual([[0, expect.closeTo(15)]]);
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
                expect(result.groups).toHaveLength(2);
                expect(result.groups[0].aggregation).toEqual([[0, expect.closeTo(12)]]);
                expect(result.groups[1].aggregation).toEqual([[0, expect.closeTo(15)]]);
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
                expect(result.groups).toHaveLength(2);
                expect(result.groups[0].keys).toEqual(['Q1']);
                expect(result.groups[1].keys).toEqual(['Q2']);
            });

            it('should extract the configured values', () => {
                const result = dataModel.processData(data)!;

                expect(result.type).toEqual('grouped');
                expect(result.groups).toHaveLength(2);
                expect(resolveGroupColumn(result, 0, 0)).toEqual([5, 1]);
                expect(resolveGroupColumn(result, 0, 1)).toEqual([7, 2]);
                expect(resolveGroupColumn(result, 0, 2)).toEqual([1, 2]);
                expect(resolveGroupColumn(result, 0, 3)).toEqual([5, 4]);
                expect(resolveGroupColumn(result, 1, 0)).toEqual([6, 6]);
                expect(resolveGroupColumn(result, 1, 1)).toEqual([9, 9]);
                expect(resolveGroupColumn(result, 1, 2)).toEqual([3, 4]);
                expect(resolveGroupColumn(result, 1, 3)).toEqual([3, 2]);
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

                expect(result.groups).toHaveLength(2);
                expect(result.groups.map((g) => g.aggregation)).toEqual([
                    [
                        [0, expect.closeTo(12)],
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
                originalDataSources: expect.any(Map),
                originalToTransformedMap: expect.any(Map),
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
                expect(result.groups).toHaveLength(2);
                expect(result.groups[0].keys).toEqual(['Q1']);
                expect(result.groups[1].keys).toEqual(['Q2']);
            });

            it('should extract the configured accumulated values', () => {
                const result = dataModel.processData(data)!;

                expect(result.type).toEqual('grouped');
                expect(result.groups).toHaveLength(2);
                expect(result.groups[0].datumIndices).toEqual([
                    [0, 1],
                    [0, 1],
                    [0, 1],
                    [0, 1],
                ]);
                expect(result.groups[1].datumIndices).toEqual([
                    [2, 3],
                    [2, 3],
                    [2, 3],
                    [2, 3],
                ]);
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
    150,
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
    [
      14.285714285714286,
      28.571428571428573,
      40,
      80,
    ],
  ],
  [
    [
      66.66666666666667,
      100,
      75,
      75,
    ],
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
                expect(result.groups).toHaveLength(2);
                expect(result.groups[0].keys).toEqual(['Q1']);
                expect(result.groups[1].keys).toEqual(['Q2']);
            });

            it('should extract the configured accumulated values', () => {
                const result = dataModel.processData(data)!;

                expect(result.type).toEqual('grouped');
                expect(result.groups).toHaveLength(2);
                expect(extractGroupValues(result, 0)).toMatchInlineSnapshot(`
[
  [
    27.77777777777778,
    66.66666666666667,
    72.22222222222223,
    100,
  ],
  [
    5.555555555555555,
    38.888888888888886,
    77.77777777777777,
    94.44444444444444,
  ],
]
`);
                expect(extractGroupValues(result, 1)).toMatchInlineSnapshot(`
[
  [
    28.571428571428573,
    71.42857142857143,
    85.71428571428571,
    100,
  ],
  [
    28.571428571428573,
    71.42857142857143,
    90.47619047619048,
    95.23809523809524,
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
    5.555555555555555,
    28.571428571428573,
  ],
  [
    38.888888888888886,
    71.42857142857143,
  ],
  [
    72.22222222222223,
    90.47619047619048,
  ],
  [
    94.44444444444444,
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

                expect(result.type).toEqual('grouped');
                expect(result.groups).toHaveLength(2);
                expect(extractGroupValues(result, 0)).toEqual([
                    [null, 7, 1],
                    [1, NaN, 2],
                ]);
                expect(extractGroupValues(result, 1)).toEqual([
                    [6, 9, null],
                    [6, 9, 4],
                ]);
            });
        });
    });

    describe('applyTransactions', () => {
        it('keeps range domains bounded while appending data', () => {
            const dataModel = new DataModel<any>({
                props: [rangeKey('time'), value('value')],
            });

            const initialData = basicDataSet([
                { time: 0, value: 1 },
                { time: 250, value: 2 },
            ]);

            const processed = dataModel.processData(initialData)!;

            expect(processed.domain.keys[0]).toEqual([0, 250]);

            dataModel.applyTransactions(
                processed,
                new Map([
                    [
                        'test',
                        {
                            append: [
                                {
                                    time: 500,
                                    value: 3,
                                },
                            ],
                        },
                    ],
                ])
            );

            expect(processed.domain.keys[0]).toEqual([0, 500]);
            expect(processed.domain.keys[0]).toHaveLength(2);

            dataModel.applyTransactions(
                processed,
                new Map([
                    [
                        'test',
                        {
                            append: [
                                {
                                    time: 750,
                                    value: 4,
                                },
                            ],
                        },
                    ],
                ])
            );

            expect(processed.domain.keys[0]).toEqual([0, 750]);
            expect(processed.domain.keys[0]).toHaveLength(2);
        });

        it('tracks prepended data incrementally', () => {
            const dataModel = new DataModel<any>({
                props: [rangeKey('time'), value('value')],
            });

            const initialData = basicDataSet([
                { time: 0, value: 1 },
                { time: 250, value: 2 },
            ]);

            const processed = dataModel.processData(initialData)!;

            const result = dataModel.applyTransactions(
                processed,
                new Map([
                    [
                        'test',
                        {
                            prepend: [
                                {
                                    time: -250,
                                    value: 0,
                                },
                            ],
                        },
                    ],
                ])
            );

            expect(result).toBe(processed);
            expect(result.domain.keys[0]).toEqual([-250, 250]);
            expect(result.input.count).toBe(3);
            expect(result.incremental).toBeDefined();
            expect(result.incremental?.prependedCount).toBe(1);
            expect(result.incremental?.addedRows).toEqual([0]);
            expect(result.incremental?.baseDataSize).toBe(2);
        });

        it('removes rows incrementally', () => {
            const dataModel = new DataModel<any>({
                props: [rangeKey('time'), value('value')],
            });

            const initialData = basicDataSet([
                { time: 0, value: 1 },
                { time: 250, value: 2 },
                { time: 500, value: 3 },
            ]);

            const processed = dataModel.processData(initialData)!;

            const dataSourceBefore = processed.dataSources.get('test') as { time: number; value: number }[] | undefined;
            const toRemove = dataSourceBefore?.[0];
            expect(toRemove).toBeDefined();

            const result = dataModel.applyTransactions(
                processed,
                new Map([
                    [
                        'test',
                        {
                            remove: toRemove ? [toRemove] : [],
                        },
                    ],
                ])
            );

            expect(result.input.count).toBe(2);
            expect(result.domain.keys[0]).toEqual([250, 500]);
            const dataSource = result.dataSources.get('test') as { time: number; value: number }[] | undefined;
            expect(dataSource).toEqual([
                { time: 250, value: 2 },
                { time: 500, value: 3 },
            ]);
            expect(result.incremental).toBeDefined();
            expect(result.incremental?.removedRows).toEqual([0]);
            expect(result.incremental?.addedRows).toEqual([]);
            expect(result.incremental?.modifiedDomains.keys).toEqual([0]);
            expect(result.incremental?.baseDataSize).toBe(3);
        });
        it('removes appended rows by reference', () => {
            const dataModel = new DataModel<any>({
                props: [rangeKey('time'), value('value')],
            });

            const initialData = basicDataSet([
                { time: 0, value: 1 },
                { time: 250, value: 2 },
            ]);

            const processed = dataModel.processData(initialData)!;

            const appended = { time: 500, value: 3 };
            dataModel.applyTransactions(
                processed,
                new Map([
                    [
                        'test',
                        {
                            append: [appended],
                        },
                    ],
                ])
            );

            const result = dataModel.applyTransactions(
                processed,
                new Map([
                    [
                        'test',
                        {
                            remove: [appended],
                        },
                    ],
                ])
            );

            expect(result.input.count).toBe(2);
            const incremental = result.incremental;
            expect(incremental?.removedRows).toEqual([2]);
            expect(result.dataSources.get('test')).toEqual([
                { time: 0, value: 1 },
                { time: 250, value: 2 },
            ]);
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

    describe('grouping with applyTransactions', () => {
        // These tests are skipped because applyTransactions with grouped data
        // requires proper incremental grouping implementation which is not yet complete
        it('should handle append transactions and regroup data', () => {
            const dataModel = new DataModel<any, any, true>({
                props: [categoryKey('category'), value('value1'), value('value2')],
                groupByKeys: true,
            });

            // Initial data
            const initialData = new Map([
                [
                    'test',
                    [
                        { category: 'A', value1: 10, value2: 20 },
                        { category: 'B', value1: 15, value2: 25 },
                    ],
                ],
            ]);

            const result1 = dataModel.processData(initialData);
            expect(result1?.type).toBe('grouped');
            if (result1?.type === 'grouped') {
                expect(result1.groups).toHaveLength(2);
            }

            // Apply append transaction
            const appendData = new Map([
                [
                    'test',
                    {
                        append: [
                            { category: 'A', value1: 12, value2: 22 },
                            { category: 'C', value1: 18, value2: 28 },
                        ],
                    },
                ],
            ]);

            const result2 = dataModel.applyTransactions(result1!, appendData);
            expect(result2?.type).toBe('grouped');
            if (result2?.type === 'grouped') {
                // After appending and regrouping, we should have three distinct category groups.
                expect(result2.groups).toHaveLength(3);

                const groupKeys = result2.groups.map((g) => g.keys[0]);
                expect(groupKeys).toEqual(['A', 'B', 'C']);

                const groupA = result2.groups.find((g) => g.keys[0] === 'A');
                expect(groupA).toBeDefined();
                expect(groupA?.datumIndices[0]).toEqual([0, 2]);
                expect(groupA?.datumIndices[1]).toEqual([0, 2]);
            }
        });

        it('should handle remove transactions with full regrouping', () => {
            const dataModel = new DataModel<any, any, true>({
                props: [categoryKey('category'), value('value')],
                groupByKeys: true,
            });

            // Keep references to data items so we can remove them
            const item1 = { category: 'A', value: 10 };
            const item2 = { category: 'B', value: 20 };
            const item3 = { category: 'A', value: 15 };

            const initialData = new Map([['test', [item1, item2, item3]]]);

            const result1 = dataModel.processData(initialData);
            expect(result1?.type).toBe('grouped');
            if (result1?.type === 'grouped') {
                expect(result1.groups).toHaveLength(2);
                expect(new Set(result1.groups.map((g) => g.keys[0]))).toEqual(new Set(['A', 'B']));
            }

            // Apply remove transaction - should fall back to full regrouping
            const removeData = new Map([
                [
                    'test',
                    {
                        remove: [item1], // Remove first 'A' item
                    },
                ],
            ]);

            const result2 = dataModel.applyTransactions(result1!, removeData);
            expect(result2?.type).toBe('grouped');
            if (result2?.type === 'grouped') {
                expect(result2.groups).toHaveLength(2);
                expect(new Set(result2.groups.map((g) => g.keys[0]))).toEqual(new Set(['A', 'B']));
            }
        });

        it('should handle multiple sequential transactions', () => {
            const dataModel = new DataModel<any, any, true>({
                props: [categoryKey('key'), value('value')],
                groupByKeys: true,
            });

            const data1 = new Map([['test', [{ key: 'A', value: 1 }]]]);
            const result1 = dataModel.processData(data1);

            // Apply multiple append transactions
            const append1 = new Map([['test', { append: [{ key: 'A', value: 2 }] }]]);
            const result2 = dataModel.applyTransactions(result1!, append1);
            expect(result2?.type).toBe('grouped');

            const append2 = new Map([['test', { append: [{ key: 'B', value: 3 }] }]]);
            const result3 = dataModel.applyTransactions(result2!, append2);

            expect(result3?.type).toBe('grouped');
            if (result3?.type === 'grouped') {
                // After appending A twice and B once, we should have groups for A and B.
                expect(result3.groups).toHaveLength(2);
                const groupKeys = result3.groups.map((g) => g.keys[0]).sort();
                expect(groupKeys).toEqual(['A', 'B']);
                const groupA = result3.groups.find((g) => g.keys[0] === 'A');
                expect(groupA?.datumIndices[0]).toEqual([0, 1]);
            }
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
                originalDataSources: expect.any(Map),
                originalToTransformedMap: expect.any(Map),
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

    describe('applyTransactions with stacked/accumulated data (grouped)', () => {
        it('should remove and append transactions on grouped accumulated values', () => {
            // This test demonstrates the actual issue with stacked line charts
            // where data is grouped and accumulated
            const dataModel = new DataModel<any, any, true>({
                props: [
                    rangeKey('time'),
                    ...accumulatedGroupValues(['series1', 'series2', 'series3', 'series4'], 'stacked'),
                ],
                groupByKeys: true,
            });

            // Initial grouped data similar to the high-freq-stacked-line example
            const initialData = [
                { time: 100, series1: 10, series2: 15, series3: 20, series4: 25 },
                { time: 200, series1: 12, series2: 18, series3: 22, series4: 28 },
                { time: 300, series1: 11, series2: 16, series3: 21, series4: 26 },
                { time: 400, series1: 13, series2: 17, series3: 23, series4: 27 },
            ];

            const scopedData = new Map([['test', initialData]]);
            const processed = dataModel.processData(scopedData);
            expect(processed?.type).toBe('grouped');
            expect(processed?.groups.length).toBe(4); // One group per time value

            // Store reference to the first data point to remove later
            const dataToRemove = initialData[0];
            const newDataPoint = { time: 500, series1: 14, series2: 19, series3: 24, series4: 29 };

            const transactions = new Map([
                [
                    'test',
                    {
                        remove: [dataToRemove],
                        append: [newDataPoint],
                    },
                ],
            ]);

            // Previously this failed because accumulated/grouped data prevented proper removal.
            // We now expect the transaction to regroup and update the domain correctly.
            const result = dataModel.applyTransactions(processed!, transactions);
            expect(result).toBeDefined();

            expect(processed?.type).toBe('grouped');
            expect(processed?.groups.length).toBe(4); // One group per time value
            expect(processed?.groups.map((g) => g.keys[0])).toEqual([200, 300, 400, 500]);
            expect(processed?.domain.keys[0]).toEqual([200, 300, 400, 500]);
        });
    });

    describe('applyTransactions with stacked/accumulated data (ungrouped)', () => {
        it('should handle remove and append transactions with accumulated values', () => {
            // This test demonstrates the issue with applyTransaction on stacked series
            // where removing data points fails because the accumulated/transformed data
            // doesn't match the original references

            const dataModel = new DataModel<any, any>({
                props: [
                    rangeKey('time'),
                    accumulatedPropertyValue('series1', 'stacked'),
                    accumulatedPropertyValue('series2', 'stacked'),
                    accumulatedPropertyValue('series3', 'stacked'),
                    accumulatedPropertyValue('series4', 'stacked'),
                    actualAccumulateGroup('stacked', 'normal', 'current'),
                ],
            });

            // Initial data similar to the high-freq-stacked-line example
            const initialData = [
                { time: 100, series1: 10, series2: 15, series3: 20, series4: 25 },
                { time: 200, series1: 12, series2: 18, series3: 22, series4: 28 },
                { time: 300, series1: 11, series2: 16, series3: 21, series4: 26 },
                { time: 400, series1: 13, series2: 17, series3: 23, series4: 27 },
            ];

            const scopedData = new Map([['test', initialData]]);
            const processed = dataModel.processData(scopedData);
            expect(processed?.type).toBe('ungrouped');
            expect(processed?.input.count).toBe(4);

            // Store reference to the first data point to remove later
            const dataToRemove = initialData[0];
            const newDataPoint = { time: 500, series1: 14, series2: 19, series3: 24, series4: 29 };

            // This should fail with the error:
            // "AG Charts - data transaction "remove" entries must reference an existing datum"
            // because the accumulated values have transformed the data
            const transactions = new Map([
                [
                    'test',
                    {
                        remove: [dataToRemove],
                        append: [newDataPoint],
                    },
                ],
            ]);

            // The issue: with accumulated values, the data has been transformed,
            // so the original data references may not match what's stored internally.
            // This demonstrates that applyTransaction with remove doesn't work properly
            // with stacked/accumulated series.

            // Try to apply the transaction - in the actual chart usage, this fails
            const result = dataModel.applyTransactions(processed!, transactions);

            // If it doesn't throw here, check if the removal actually worked
            // The transaction likely silently failed to remove the item
            expect(result).toBeDefined();

            // The count should be 4 (3 original + 1 new - 1 removed = 3)
            // but if removal failed, it would be 5
            // This test documents the current behavior where remove doesn't work with stacked data
            expect(result?.input.count).toEqual(4); // Removal likely didn't work
        });

        it('should work with append-only transactions for accumulated values', () => {
            // This test shows that append-only transactions work fine
            const dataModel = new DataModel<any, any>({
                props: [
                    rangeKey('time'),
                    accumulatedPropertyValue('series1', 'stacked'),
                    accumulatedPropertyValue('series2', 'stacked'),
                    actualAccumulateGroup('stacked', 'normal', 'current'),
                ],
            });

            const initialData = [
                { time: 100, series1: 10, series2: 15 },
                { time: 200, series1: 12, series2: 18 },
            ];

            const scopedData = new Map([['test', initialData]]);
            const processed = dataModel.processData(scopedData);
            expect(processed?.type).toBe('ungrouped');

            const newDataPoint = { time: 300, series1: 14, series2: 19 };
            const transactions = new Map([
                [
                    'test',
                    {
                        append: [newDataPoint],
                    },
                ],
            ]);

            const result = dataModel.applyTransactions(processed!, transactions);
            expect(result).toBeDefined();
            expect(result?.input.count).toBe(3);
        });

        it('should properly handle removal transactions with processors (accumulated values)', () => {
            // Test that shows removals work correctly with processors that transform data
            const dataModel = new DataModel<any, any>({
                props: [
                    rangeKey('time'),
                    accumulatedPropertyValue('series1', 'stacked'),
                    accumulatedPropertyValue('series2', 'stacked'),
                ],
            });

            const originalData = [
                { time: 100, series1: 10, series2: 15 },
                { time: 200, series1: 12, series2: 17 },
                { time: 300, series1: 14, series2: 19 },
            ];

            const scopedData = new Map([['test', originalData]]);
            const processed = dataModel.processData(scopedData);
            expect(processed?.type).toBe('ungrouped');

            // Verify original data tracking is present for processors
            expect(processed?.originalDataSources).toBeDefined();
            expect(processed?.originalToTransformedMap).toBeDefined();

            // Remove the middle item - this should work correctly even though data is transformed
            const removeItem = originalData[1]; // { time: 200, series1: 12, series2: 17 }
            const transactions = new Map([
                [
                    'test',
                    {
                        remove: [removeItem],
                    },
                ],
            ]);

            const result = dataModel.applyTransactions(processed!, transactions);
            expect(result).toBeDefined();
            expect(result?.input.count).toBe(2); // Should have 2 items left

            // Verify the correct item was removed by checking that we have 2 items
            if (result?.type === 'ungrouped') {
                // The exact column order depends on the internal structure,
                // but we can verify that we have the correct number of items
                expect(result.columns[0]).toHaveLength(2);
                expect(result.columns[1]).toHaveLength(2);
            }
        });
    });
});
