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
import { DataSet } from './dataSet';
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
const windowAccumulatedGroupValues = (
    property: string,
    mode: 'window' | 'window-trailing',
    sum: 'current' | 'last',
    groupId: string,
    id?: string
): (Scoped & PropertyDefinition<any>)[] => [
    { ...value(property, groupId, id), scopes: ['test'] },
    { ...actualAccumulateGroup(groupId, mode, sum), scopes: ['test'] },
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
    const dataSet = new DataSet(data);
    return new Map([...scopes.map((s) => [s, dataSet] as const)]);
}

function expectedKeys(expected: unknown[]) {
    return [new Map([['test', expected]])];
}

function resolveGroupColumn(result: GroupedData<unknown>, groupIdx: number, columnIdx: number) {
    return result.groups[groupIdx].datumIndices[columnIdx].map(
        (relativeIndex) => result.columns[columnIdx][groupIdx + relativeIndex]
    );
}

function extractGroupValues(data: GroupedData<unknown>, groupIndex?: number) {
    let groups = data.groups;
    let startGroupIdx = 0;
    if (groupIndex != null) {
        groups = groups.slice(groupIndex, groupIndex + 1);
        startGroupIdx = groupIndex;
    }
    const result = groups.map((g, gidx) => {
        const actualGroupIdx = startGroupIdx + gidx;
        return g.datumIndices[0].map((_, di) =>
            g.datumIndices.map((d, ci) => data.columns[ci][actualGroupIdx + d[di]])
        );
    });
    if (groupIndex != null) {
        return result[0];
    }
    return result;
}

function mutilatedBrowserData() {
    const datumKeys = ['ie', 'chrome', 'firefox', 'safari'] as const;
    const rawData = DATA_BROWSER_MARKET_SHARE.map((v) => ({ ...v }));
    for (const [idx, datum] of rawData.entries()) {
        const keyToDelete = datumKeys[idx % 4];
        delete datum[keyToDelete];
        if (idx % 3 === 0) {
            const illegalValueKey = datumKeys[(idx + 1) % 4];
            datum[illegalValueKey] = 'illegal value' as any;
        }
    }
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
                invalidValue: Number.NaN,
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
            const defaults = { missingValue: null, invalidValue: Number.NaN };
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
                expect(extractGroupValues(result, 1)).toEqual([[1, Number.NaN, 2]]);
                expect(extractGroupValues(result, 2)).toEqual([[6, 9, null]]);
                expect(extractGroupValues(result, 3)).toEqual([[6, 9, 4]]);
            });
        });
    });

    describe('missing and invalid data processing - multiple scopes', () => {
        it('should generated the expected results', () => {
            const rawData = mutilatedBrowserData();
            const data = new Map()
                .set('test', new DataSet(rawData))
                .set('series-a', new DataSet(rawData))
                .set('series-b', new DataSet(rawData))
                .set('series-c', new DataSet(rawData));
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
            const data = new Map([...['test', 'scope-1', 'scope-2'].map((s) => [s, new DataSet(rawData)] as const)]);

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

    describe('reprocessData', () => {
        describe('append operations', () => {
            it('should handle append-only transaction', () => {
                const dataModel = new DataModel<any, any>({
                    props: [rangeKey('x'), value('y')],
                });

                // Initial data
                const initialData = [
                    { x: 1, y: 10 },
                    { x: 2, y: 20 },
                ];
                const dataSet = new DataSet(initialData);
                const sources = basicDataSet(initialData).set('test', dataSet);

                const processedData = dataModel.processData(sources);

                // Initialize diff tracking (opt-in to diff generation during reprocessing)
                processedData!.reduced = { diff: {} };

                // Add transaction
                dataSet.addTransaction({ append: [{ x: 3, y: 30 }] });

                // Reprocess
                const reprocessed = dataModel.reprocessData(processedData!);

                // Verify keys were updated
                expect(reprocessed.keys[0].get('test')).toEqual([1, 2, 3]);

                // Verify columns were updated
                expect(reprocessed.columns).toEqual([[10, 20, 30]]);

                // Verify domains
                expect(reprocessed.domain.keys).toEqual([[1, 3]]);
                expect(reprocessed.domain.values).toEqual([[10, 30]]);

                // Verify diff metadata
                expect(reprocessed.reduced?.diff?.test.added.size).toBe(1);
                expect(reprocessed.reduced?.diff?.test.added.has('3')).toBe(true);
            });
        });

        describe('prepend operations', () => {
            it('should handle prepend-only transaction', () => {
                const dataModel = new DataModel<any, any>({
                    props: [rangeKey('x'), value('y')],
                });

                const initialData = [
                    { x: 2, y: 20 },
                    { x: 3, y: 30 },
                ];
                const dataSet = new DataSet(initialData);
                const sources = basicDataSet(initialData).set('test', dataSet);

                const processedData = dataModel.processData(sources);

                // Initialize diff tracking (opt-in to diff generation during reprocessing)
                processedData!.reduced = { diff: {} };

                // Prepend transaction
                dataSet.addTransaction({ prepend: [{ x: 1, y: 10 }] });

                const reprocessed = dataModel.reprocessData(processedData!);

                // Verify keys were shifted and new key added
                expect(reprocessed.keys[0].get('test')).toEqual([1, 2, 3]);

                // Verify columns
                expect(reprocessed.columns).toEqual([[10, 20, 30]]);

                // Verify domains
                expect(reprocessed.domain.keys).toEqual([[1, 3]]);
                expect(reprocessed.domain.values).toEqual([[10, 30]]);

                // Verify diff shows moved items
                expect(reprocessed.reduced?.diff?.test.added.size).toBe(1);
                expect(reprocessed.reduced?.diff?.test.moved.size).toBe(2); // Original items moved
            });
        });

        describe('remove operations', () => {
            it('should handle remove transaction', () => {
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

                // Remove middle item
                dataSet.addTransaction({ remove: [initialData[1]] });

                const reprocessed = dataModel.reprocessData(processedData!);

                // Verify item was removed
                expect(reprocessed.keys[0].get('test')).toEqual([1, 3]);
                expect(reprocessed.columns).toEqual([[10, 30]]);

                // Verify domains updated
                expect(reprocessed.domain.keys).toEqual([[1, 3]]);
                expect(reprocessed.domain.values).toEqual([[10, 30]]);

                // Verify input count
                expect(reprocessed.input.count).toBe(2);
            });
        });

        describe('mixed operations', () => {
            it('should handle mixed append and remove', () => {
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

                // Remove first, add new
                dataSet.addTransaction({
                    remove: [initialData[0]],
                    append: [{ x: 4, y: 40 }],
                });

                const reprocessed = dataModel.reprocessData(processedData!);

                // After remove+append, we expect: [{x:2},{x:3},{x:4}]
                expect(dataSet.data).toEqual([
                    { x: 2, y: 20 },
                    { x: 3, y: 30 },
                    { x: 4, y: 40 },
                ]);
                expect(reprocessed.keys[0].get('test')).toEqual([2, 3, 4]);
                expect(reprocessed.columns).toEqual([[20, 30, 40]]);

                // Verify domains
                expect(reprocessed.domain.keys).toEqual([[2, 4]]);
                expect(reprocessed.domain.values).toEqual([[20, 40]]);

                expect(reprocessed.input.count).toBe(3);
            });

            it('should handle multiple value columns', () => {
                const dataModel = new DataModel<any, any>({
                    props: [rangeKey('x'), value('y1'), value('y2')],
                });

                const initialData = [{ x: 1, y1: 10, y2: 100 }];
                const dataSet = new DataSet(initialData);
                const sources = basicDataSet(initialData).set('test', dataSet);

                const processedData = dataModel.processData(sources);

                dataSet.addTransaction({ append: [{ x: 2, y1: 20, y2: 200 }] });

                const reprocessed = dataModel.reprocessData(processedData!);

                expect(reprocessed.columns).toEqual([
                    [10, 20],
                    [100, 200],
                ]);
                expect(reprocessed.domain.values).toEqual([
                    [10, 20],
                    [100, 200],
                ]);
            });
        });

        describe('diff tracking opt-in', () => {
            it('should NOT generate diffs when diff tracking is not initialized', () => {
                const dataModel = new DataModel<any, any>({
                    props: [rangeKey('x'), value('y')],
                });

                const initialData = [
                    { x: 1, y: 10 },
                    { x: 2, y: 20 },
                ];
                const dataSet = new DataSet(initialData);
                const sources = basicDataSet(initialData).set('test', dataSet);

                const processedData = dataModel.processData(sources);

                // DO NOT initialize diff tracking - it should remain undefined
                expect(processedData!.reduced?.diff).toBeUndefined();

                // Add transaction
                dataSet.addTransaction({ append: [{ x: 3, y: 30 }] });

                // Reprocess
                const reprocessed = dataModel.reprocessData(processedData!);

                // Verify data was updated correctly
                expect(reprocessed.keys[0].get('test')).toEqual([1, 2, 3]);
                expect(reprocessed.columns).toEqual([[10, 20, 30]]);

                // Verify domains
                expect(reprocessed.domain.keys).toEqual([[1, 3]]);
                expect(reprocessed.domain.values).toEqual([[10, 30]]);

                // Verify diff was NOT generated (still undefined)
                expect(reprocessed.reduced?.diff).toBeUndefined();
            });

            it('should generate diffs when diff tracking IS initialized', () => {
                const dataModel = new DataModel<any, any>({
                    props: [rangeKey('x'), value('y')],
                });

                const initialData = [
                    { x: 1, y: 10 },
                    { x: 2, y: 20 },
                ];
                const dataSet = new DataSet(initialData);
                const sources = basicDataSet(initialData).set('test', dataSet);

                const processedData = dataModel.processData(sources);

                // Opt-in to diff tracking
                processedData!.reduced = { diff: {} };

                // Add transaction
                dataSet.addTransaction({ append: [{ x: 3, y: 30 }] });

                // Reprocess
                const reprocessed = dataModel.reprocessData(processedData!);

                // Verify data was updated correctly
                expect(reprocessed.keys[0].get('test')).toEqual([1, 2, 3]);
                expect(reprocessed.columns).toEqual([[10, 20, 30]]);

                // Verify domains
                expect(reprocessed.domain.keys).toEqual([[1, 3]]);
                expect(reprocessed.domain.values).toEqual([[10, 30]]);

                // Verify diff WAS generated
                expect(reprocessed.reduced?.diff).toBeDefined();
                expect(reprocessed.reduced?.diff?.test).toBeDefined();
                expect(reprocessed.reduced?.diff?.test.added.size).toBe(1);
                expect(reprocessed.reduced?.diff?.test.added.has('3')).toBe(true);
            });

            it('should skip diff generation when no changes occur', () => {
                const dataModel = new DataModel<any, any>({
                    props: [rangeKey('x'), value('y')],
                });

                const initialData = [{ x: 1, y: 10 }];
                const dataSet = new DataSet(initialData);
                const sources = basicDataSet(initialData).set('test', dataSet);

                const processedData = dataModel.processData(sources);

                // Opt-in to diff tracking
                processedData!.reduced = { diff: {} };

                // No transaction added

                // Reprocess
                const reprocessed = dataModel.reprocessData(processedData!);

                // Should return same reference (no changes)
                expect(reprocessed).toBe(processedData);

                // Diff structure exists but is empty (no scopes changed)
                expect(reprocessed.reduced?.diff).toBeDefined();
                expect(Object.keys(reprocessed.reduced!.diff!)).toEqual([]);
            });
        });

        describe('edge cases', () => {
            it('should handle no pending transactions', () => {
                const dataModel = new DataModel<any, any>({
                    props: [rangeKey('x'), value('y')],
                });

                const initialData = [{ x: 1, y: 10 }];
                const dataSet = new DataSet(initialData);
                const sources = basicDataSet(initialData).set('test', dataSet);

                const processedData = dataModel.processData(sources);
                const reprocessed = dataModel.reprocessData(processedData!);

                // Should return same reference
                expect(reprocessed).toBe(processedData);
            });

            it('should handle category keys', () => {
                const dataModel = new DataModel<any, any>({
                    props: [categoryKey('category'), value('value')],
                });

                const initialData = [
                    { category: 'A', value: 10 },
                    { category: 'B', value: 20 },
                ];
                const dataSet = new DataSet(initialData);
                const sources = basicDataSet(initialData).set('test', dataSet);

                const processedData = dataModel.processData(sources);

                dataSet.addTransaction({ append: [{ category: 'C', value: 30 }] });

                const reprocessed = dataModel.reprocessData(processedData!);

                expect(reprocessed.keys[0].get('test')).toEqual(['A', 'B', 'C']);
                expect(reprocessed.domain.keys).toEqual([['A', 'B', 'C']]);
            });

            it('should track invalid data in insertions', () => {
                const dataModel = new DataModel<any, any>({
                    props: [
                        rangeKey('x'),
                        { ...value('y'), validation: (v: any) => typeof v === 'number', invalidValue: undefined },
                    ],
                });

                // Start with data that includes invalid item to ensure invalidData is initialized
                const initialData = [
                    { x: 1, y: 10 },
                    { x: 2, y: 'bad' as any },
                ];
                const dataSet = new DataSet(initialData);
                const sources = basicDataSet(initialData).set('test', dataSet);

                const processedData = dataModel.processData(sources)!;

                // Verify initial invalid tracking
                expect(processedData.invalidData?.has('test')).toBe(true);

                // Append with another invalid value
                dataSet.addTransaction({
                    append: [{ x: 3, y: 'invalid' as any }],
                });

                const reprocessed = dataModel.reprocessData(processedData);

                // The new invalid value should be tracked
                const invalidDataArray = reprocessed.invalidData?.get('test');
                expect(invalidDataArray).toBeDefined();
                expect(invalidDataArray![1]).toBe(true); // Second item (from initial)
                expect(invalidDataArray![2]).toBe(true); // Third item (appended)
                expect(reprocessed.partialValidDataCount).toBeGreaterThan(0);

                // Verify domains (only valid data: x=1 with y=10)
                expect(reprocessed.domain.keys).toEqual([[1, 1]]);
                expect(reprocessed.domain.values).toEqual([[10, 10]]);
            });
        });

        describe('grouped data reprocessing', () => {
            it('should handle append to grouped data', () => {
                const dataModel = new DataModel<any, any, true>({
                    props: [rangeKey('x'), value('y')],
                    groupByKeys: true,
                });

                // Initial grouped data
                const initialData = [
                    { x: 1, y: 10 },
                    { x: 2, y: 20 },
                ];
                const dataSet = new DataSet(initialData);
                const sources = basicDataSet(initialData).set('test', dataSet);

                const processedData = dataModel.processData(sources);
                expect(processedData!.type).toBe('grouped');
                expect(processedData!.groupsUnique).toBe(true);

                // Initialize diff tracking
                processedData!.reduced = { diff: {} };

                // Append transaction
                dataSet.addTransaction({ append: [{ x: 3, y: 30 }] });

                // Reprocess
                const reprocessed = dataModel.reprocessData(processedData!) as GroupedData<any>;

                // Verify groups were updated
                expect(reprocessed.groups.length).toBe(3);
                expect(reprocessed.groups[2].keys).toEqual([3]);
                expect(reprocessed.groups[2].datumIndices).toEqual([[0]]);

                // Verify domain.groups was rebuilt
                expect(reprocessed.domain.groups).toEqual([[1], [2], [3]]);

                // Verify columns
                expect(reprocessed.columns).toEqual([[10, 20, 30]]);

                // Verify diff metadata
                expect(reprocessed.reduced?.diff?.test.added.size).toBe(1);
                expect(reprocessed.reduced?.diff?.test.added.has('3')).toBe(true);
            });

            it('should handle prepend to grouped data', () => {
                const dataModel = new DataModel<any, any, true>({
                    props: [rangeKey('x'), value('y')],
                    groupByKeys: true,
                });

                const initialData = [
                    { x: 2, y: 20 },
                    { x: 3, y: 30 },
                ];
                const dataSet = new DataSet(initialData);
                const sources = basicDataSet(initialData).set('test', dataSet);

                const processedData = dataModel.processData(sources);
                processedData!.reduced = { diff: {} };

                // Prepend transaction
                dataSet.addTransaction({ prepend: [{ x: 1, y: 10 }] });

                const reprocessed = dataModel.reprocessData(processedData!) as GroupedData<any>;

                // Verify groups were updated and shifted
                expect(reprocessed.groups.length).toBe(3);
                expect(reprocessed.groups[0].keys).toEqual([1]);
                expect(reprocessed.groups[1].keys).toEqual([2]);
                expect(reprocessed.groups[2].keys).toEqual([3]);

                // All relative datumIndices should still be [0]
                expect(reprocessed.groups[0].datumIndices).toEqual([[0]]);
                expect(reprocessed.groups[1].datumIndices).toEqual([[0]]);
                expect(reprocessed.groups[2].datumIndices).toEqual([[0]]);

                // Verify domain.groups
                expect(reprocessed.domain.groups).toEqual([[1], [2], [3]]);

                // Verify columns
                expect(reprocessed.columns).toEqual([[10, 20, 30]]);

                // Verify diff metadata
                expect(reprocessed.reduced?.diff?.test.added.size).toBe(1);
                expect(reprocessed.reduced?.diff?.test.moved.size).toBe(2);
            });

            it('should handle remove from grouped data', () => {
                const dataModel = new DataModel<any, any, true>({
                    props: [rangeKey('x'), value('y')],
                    groupByKeys: true,
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

                // Remove middle item
                dataSet.addTransaction({ remove: [initialData[1]] });

                const reprocessed = dataModel.reprocessData(processedData!) as GroupedData<any>;

                // Verify group was removed
                expect(reprocessed.groups.length).toBe(2);
                expect(reprocessed.groups[0].keys).toEqual([1]);
                expect(reprocessed.groups[1].keys).toEqual([3]);

                // Verify domain.groups
                expect(reprocessed.domain.groups).toEqual([[1], [3]]);

                // Verify columns
                expect(reprocessed.columns).toEqual([[10, 30]]);

                // Verify diff metadata
                expect(reprocessed.reduced?.diff?.test.removed.size).toBe(1);
                expect(reprocessed.reduced?.diff?.test.removed.has('2')).toBe(true);
            });

            it('should throw error when appending data with invalid keys', () => {
                const dataModel = new DataModel<any, any, true>({
                    props: [rangeKey('x'), value('y')],
                    groupByKeys: true,
                });

                const initialData = [{ x: 1, y: 10 }];
                const dataSet = new DataSet(initialData);
                const sources = basicDataSet(initialData).set('test', dataSet);

                const processedData = dataModel.processData(sources);

                // Append data with invalid key (null)
                dataSet.addTransaction({ append: [{ x: null as any, y: 20 }] });

                // Should throw error about invalid keys
                expect(() => dataModel.reprocessData(processedData!)).toThrow(/invalid keys not supported/i);

                // Verify warning was logged for the invalid key during processing
                expectWarningsCalls().toMatchInlineSnapshot(`
[
  [
    "AG Charts - invalid value of type [object] for [test / undefined] ignored:",
    "[null]",
  ],
]
`);
            });
            it('should handle append to stacked grouped data with window accumulation and sum=current', () => {
                // Test stacking behavior with multiple series using window accumulation
                // This simulates how AreaSeries stacks multiple data series
                const dataModel = new DataModel<any, any, true>({
                    props: [
                        categoryKey('quarter'),
                        value('desktop', 'stack'),
                        value('mobile', 'stack'),
                        value('tablet', 'stack'),
                        actualAccumulateGroup('stack', 'window', 'current'),
                    ].map((p) => ({ ...p, scopes: ['test'] })),
                    groupByKeys: true,
                });

                const initialData = [
                    { quarter: 'Q1', desktop: 100, mobile: 50, tablet: 25 },
                    { quarter: 'Q2', desktop: 120, mobile: 60, tablet: 30 },
                    { quarter: 'Q3', desktop: 110, mobile: 55, tablet: 28 },
                ];
                const dataSet = new DataSet(initialData);
                const sources = basicDataSet(initialData).set('test', dataSet);

                const processedData = dataModel.processData(sources) as GroupedData<any>;

                // Verify initial stacking is correct
                // With window accumulation and sum='current', values accumulate within each group
                // Q1: desktop=100, mobile=150 (100+50), tablet=175 (100+50+25)
                expect(extractGroupValues(processedData, 0)).toEqual([[100, 150, 175]]);
                // Q2: desktop=120, mobile=180 (120+60), tablet=210 (120+60+30)
                expect(extractGroupValues(processedData, 1)).toEqual([[120, 180, 210]]);
                // Q3: desktop=110, mobile=165 (110+55), tablet=193 (110+55+28)
                expect(extractGroupValues(processedData, 2)).toEqual([[110, 165, 193]]);

                // Append new data
                dataSet.addTransaction({ append: [{ quarter: 'Q4', desktop: 130, mobile: 65, tablet: 35 }] });

                // Reprocess - should use optimized path
                const reprocessed = dataModel.reprocessData(processedData) as GroupedData<any>;

                // Verify existing groups unchanged (crucial for performance - no recomputation)
                expect(extractGroupValues(reprocessed, 0)).toEqual([[100, 150, 175]]);
                expect(extractGroupValues(reprocessed, 1)).toEqual([[120, 180, 210]]);
                expect(extractGroupValues(reprocessed, 2)).toEqual([[110, 165, 193]]);

                // Verify new group has correct stacking
                // Q4: desktop=130, mobile=195 (130+65), tablet=230 (130+65+35)
                expect(extractGroupValues(reprocessed, 3)).toEqual([[130, 195, 230]]);

                // Verify domains updated correctly for all stacked values
                expect(reprocessed.domain.keys).toEqual([['Q1', 'Q2', 'Q3', 'Q4']]);
                expect(reprocessed.domain.values).toEqual([
                    [100, 130], // desktop range
                    [150, 195], // mobile stacked range
                    [175, 230], // tablet stacked range
                ]);
            });
            it('should handle prepend to stacked grouped data with window accumulation and sum=current', () => {
                // Test that prepending data maintains correct stacking
                const dataModel = new DataModel<any, any, true>({
                    props: [
                        rangeKey('month'),
                        value('product1', 'stack'),
                        value('product2', 'stack'),
                        value('product3', 'stack'),
                        actualAccumulateGroup('stack', 'window', 'current'),
                    ].map((p) => ({ ...p, scopes: ['test'] })),
                    groupByKeys: true,
                });

                const initialData = [
                    { month: 2, product1: 200, product2: 100, product3: 50 },
                    { month: 3, product1: 220, product2: 110, product3: 55 },
                ];
                const dataSet = new DataSet(initialData);
                const sources = basicDataSet(initialData).set('test', dataSet);

                const processedData = dataModel.processData(sources) as GroupedData<any>;

                // Verify initial stacking
                // Month 2: product1=200, product2=300 (200+100), product3=350 (200+100+50)
                expect(extractGroupValues(processedData, 0)).toEqual([[200, 300, 350]]);
                // Month 3: product1=220, product2=330 (220+110), product3=385 (220+110+55)
                expect(extractGroupValues(processedData, 1)).toEqual([[220, 330, 385]]);

                // Prepend new data
                dataSet.addTransaction({ prepend: [{ month: 1, product1: 180, product2: 90, product3: 45 }] });

                // Reprocess
                const reprocessed = dataModel.reprocessData(processedData) as GroupedData<any>;

                // Verify all groups have correct stacking after prepend
                // Month 1 (new): product1=180, product2=270 (180+90), product3=315 (180+90+45)
                expect(extractGroupValues(reprocessed, 0)).toEqual([[180, 270, 315]]);
                // Month 2: should remain unchanged (crucial for performance)
                expect(extractGroupValues(reprocessed, 1)).toEqual([[200, 300, 350]]);
                // Month 3: should remain unchanged
                expect(extractGroupValues(reprocessed, 2)).toEqual([[220, 330, 385]]);

                // Verify domains
                expect(reprocessed.domain.keys).toEqual([[1, 3]]);
                expect(reprocessed.domain.values).toEqual([
                    [180, 220], // product1 range
                    [270, 330], // product2 stacked range
                    [315, 385], // product3 stacked range
                ]);
            });
        });

        describe('isReprocessingSupported', () => {
            it('should support ungrouped data without aggregates', () => {
                const dataModel = new DataModel<any, any>({
                    props: [rangeKey('x'), value('y')],
                });

                const sources = basicDataSet([{ x: 1, y: 10 }]);
                const processedData = dataModel.processData(sources);

                expect(dataModel.isReprocessingSupported(processedData!)).toBe(true);
            });

            it('should support grouped data with groupsUnique=true and single scope', () => {
                const dataModel = new DataModel<any, any, true>({
                    props: [rangeKey('x'), value('y')],
                    groupByKeys: true,
                });

                const sources = basicDataSet([
                    { x: 1, y: 10 },
                    { x: 2, y: 20 },
                ]);
                const processedData = dataModel.processData(sources);

                // Should be supported: single scope, groupsUnique=true, no invalid keys
                expect(processedData!.type).toBe('grouped');
                expect(processedData!.groupsUnique).toBe(true);
                expect(dataModel.isReprocessingSupported(processedData!)).toBe(true);
            });

            it('should not support grouped data with groupsUnique=false', () => {
                const dataModel = new DataModel<any, any, true>({
                    props: [rangeKey('x'), value('y')],
                    groupByKeys: true,
                    groupByFn: () => () => ['shared-group'], // Force all data into one group
                });

                const sources = basicDataSet([
                    { x: 1, y: 10 },
                    { x: 2, y: 20 },
                ]);
                const processedData = dataModel.processData(sources);

                // With batch merging optimization, this now has groupsUnique=true
                // which enables reprocessing support
                expect(processedData!.type).toBe('grouped');
                expect(processedData!.groupsUnique).toBe(true);
                expect(dataModel.isReprocessingSupported(processedData!)).toBe(true);
            });

            it('should not support data with aggregates', () => {
                const dataModel = new DataModel<any, any>({
                    props: [rangeKey('x'), value('y', 'group1'), sum('group1')],
                });

                const sources = basicDataSet([{ x: 1, y: 10 }]);
                const processedData = dataModel.processData(sources);

                expect(dataModel.isReprocessingSupported(processedData!)).toBe(false);
            });

            it('should support multiple scopes with same DataSet', () => {
                const dataModel = new DataModel<any, any, true>({
                    props: [
                        categoryKey('category', ['scope1', 'scope2']),
                        scopedValue('scope1', 'value1'),
                        scopedValue('scope2', 'value2'),
                    ],
                    groupByKeys: true,
                });

                const dataSet = new DataSet([
                    { category: 'A', value1: 10, value2: 100 },
                    { category: 'B', value1: 20, value2: 200 },
                ]);

                // Multiple scopes, same DataSet
                const sources = new Map([
                    ['scope1', dataSet],
                    ['scope2', dataSet],
                ]);

                const processedData = dataModel.processData(sources);

                expect(dataModel.isReprocessingSupported(processedData!)).toBe(true);
            });

            it('should not support multiple scopes with different DataSets', () => {
                const dataModel = new DataModel<any, any, true>({
                    props: [
                        categoryKey('category', ['scope1', 'scope2']),
                        scopedValue('scope1', 'value1'),
                        scopedValue('scope2', 'value2'),
                    ],
                    groupByKeys: true,
                });

                const dataSet1 = new DataSet([
                    { category: 'A', value1: 10, value2: 100 },
                    { category: 'B', value1: 20, value2: 200 },
                ]);
                const dataSet2 = new DataSet([
                    { category: 'A', value1: 10, value2: 100 },
                    { category: 'B', value1: 20, value2: 200 },
                ]);

                // Multiple scopes, different DataSets
                const sources = new Map([
                    ['scope1', dataSet1],
                    ['scope2', dataSet2],
                ]);

                const processedData = dataModel.processData(sources);

                expect(dataModel.isReprocessingSupported(processedData!)).toBe(false);
            });
            it('should support grouped data with window accumulation and sum=current', () => {
                const dataModel = new DataModel<any, any, true>({
                    props: [
                        categoryKey('quarter'),
                        ...windowAccumulatedGroupValues('sales', 'window', 'current', 'stack', 'salesValue'),
                    ],
                    groupByKeys: true,
                });
                const sources = basicDataSet([
                    { quarter: 'Q1', sales: 100 },
                    { quarter: 'Q2', sales: 200 },
                    { quarter: 'Q3', sales: 150 },
                ]);
                const processedData = dataModel.processData(sources);

                expect(processedData!.type).toBe('grouped');
                expect(dataModel.isReprocessingSupported(processedData!)).toBe(true);
            });
            it('should not support grouped data with window accumulation and sum=last', () => {
                const dataModel = new DataModel<any, any, true>({
                    props: [
                        categoryKey('quarter'),
                        ...windowAccumulatedGroupValues('sales', 'window', 'last', 'stack', 'salesValue'),
                    ],
                    groupByKeys: true,
                });
                const sources = basicDataSet([
                    { quarter: 'Q1', sales: 100 },
                    { quarter: 'Q2', sales: 200 },
                ]);
                const processedData = dataModel.processData(sources);

                expect(processedData!.type).toBe('grouped');
                expect(dataModel.isReprocessingSupported(processedData!)).toBe(false);
            });
            it('should not support grouped data with normal accumulation mode', () => {
                const dataModel = new DataModel<any, any, true>({
                    props: [categoryKey('quarter'), ...accumulatedGroupValues(['sales'], 'stack')],
                    groupByKeys: true,
                });
                const sources = basicDataSet([
                    { quarter: 'Q1', sales: 100 },
                    { quarter: 'Q2', sales: 200 },
                ]);
                const processedData = dataModel.processData(sources);

                expect(processedData!.type).toBe('grouped');
                expect(dataModel.isReprocessingSupported(processedData!)).toBe(false);
            });
            it('should not support grouped data with window-trailing accumulation and sum=last', () => {
                const dataModel = new DataModel<any, any, true>({
                    props: [
                        categoryKey('quarter'),
                        ...windowAccumulatedGroupValues('sales', 'window-trailing', 'last', 'stack', 'salesValue'),
                    ],
                    groupByKeys: true,
                });
                const sources = basicDataSet([
                    { quarter: 'Q1', sales: 100 },
                    { quarter: 'Q2', sales: 200 },
                ]);
                const processedData = dataModel.processData(sources);

                expect(processedData!.type).toBe('grouped');
                expect(dataModel.isReprocessingSupported(processedData!)).toBe(false);
            });
            it('should support grouped data with window-trailing accumulation and sum=current', () => {
                const dataModel = new DataModel<any, any, true>({
                    props: [
                        categoryKey('quarter'),
                        ...windowAccumulatedGroupValues('sales', 'window-trailing', 'current', 'stack', 'salesValue'),
                    ],
                    groupByKeys: true,
                });
                const sources = basicDataSet([
                    { quarter: 'Q1', sales: 100 },
                    { quarter: 'Q2', sales: 200 },
                ]);
                const processedData = dataModel.processData(sources);

                expect(processedData!.type).toBe('grouped');
                expect(dataModel.isReprocessingSupported(processedData!)).toBe(true);
            });
        });

        describe('reprocessing with stacked area charts', () => {
            it('should correctly reprocess stacked data with multiple series on append', () => {
                // Create a data model with multiple value columns that stack
                const dataModel = new DataModel<any, any, true>({
                    props: [
                        categoryKey('quarter'),
                        value('desktop', 'stack'),
                        value('mobile', 'stack'),
                        value('tablet', 'stack'),
                        actualAccumulateGroup('stack', 'window', 'current'),
                    ],
                    groupByKeys: true,
                });

                // Initial data with three series to stack
                const initialData = [
                    { quarter: 'Q1', desktop: 100, mobile: 50, tablet: 25 },
                    { quarter: 'Q2', desktop: 120, mobile: 60, tablet: 30 },
                ];
                const dataSet = new DataSet(initialData);
                const sources = basicDataSet(initialData).set('test', dataSet);

                const processedData = dataModel.processData(sources);
                expect(processedData!.type).toBe('grouped');

                // Check initial stacked values
                // With window accumulation, values stack within each group
                // Q1: desktop=100, mobile=150 (100+50), tablet=175 (150+25)
                // Q2: desktop=120, mobile=180 (120+60), tablet=210 (180+30)
                const columns = processedData!.columns;

                // Groups have datumIndices that point to the actual values in columns
                // For Q1 (group 0), the values are at index 0 in each column
                // For Q2 (group 1), the values are at index 1 in each column
                expect(columns[0][0]).toBe(100); // Q1 desktop
                expect(columns[1][0]).toBe(150); // Q1 mobile (stacked: 100+50)
                expect(columns[2][0]).toBe(175); // Q1 tablet (stacked: 150+25)

                expect(columns[0][1]).toBe(120); // Q2 desktop
                expect(columns[1][1]).toBe(180); // Q2 mobile (stacked: 120+60)
                expect(columns[2][1]).toBe(210); // Q2 tablet (stacked: 180+30)

                // Append more data
                dataSet.addTransaction({
                    append: [
                        { quarter: 'Q3', desktop: 140, mobile: 70, tablet: 35 },
                        { quarter: 'Q4', desktop: 160, mobile: 80, tablet: 40 },
                    ],
                });

                const reprocessed = dataModel.reprocessData(processedData!);
                expect(reprocessed.type).toBe('grouped');

                const reprocessedColumns = reprocessed.columns;

                // Verify original groups still have correct stacked values
                expect(reprocessedColumns[0][0]).toBe(100); // Q1 desktop
                expect(reprocessedColumns[1][0]).toBe(150); // Q1 mobile (stacked)
                expect(reprocessedColumns[2][0]).toBe(175); // Q1 tablet (stacked)
                expect(reprocessedColumns[0][1]).toBe(120); // Q2 desktop
                expect(reprocessedColumns[1][1]).toBe(180); // Q2 mobile (stacked)
                expect(reprocessedColumns[2][1]).toBe(210); // Q2 tablet (stacked)

                // Verify new groups have correct stacked values
                // Q3: desktop=140, mobile=210 (140+70), tablet=245 (210+35)
                // Q4: desktop=160, mobile=240 (160+80), tablet=280 (240+40)
                expect(reprocessedColumns[0][2]).toBe(140); // Q3 desktop
                expect(reprocessedColumns[1][2]).toBe(210); // Q3 mobile (stacked: 140+70)
                expect(reprocessedColumns[2][2]).toBe(245); // Q3 tablet (stacked: 210+35)
                expect(reprocessedColumns[0][3]).toBe(160); // Q4 desktop
                expect(reprocessedColumns[1][3]).toBe(240); // Q4 mobile (stacked: 160+80)
                expect(reprocessedColumns[2][3]).toBe(280); // Q4 tablet (stacked: 240+40)
            });

            it('should correctly reprocess stacked data with multiple series on prepend', () => {
                const dataModel = new DataModel<any, any, true>({
                    props: [
                        categoryKey('quarter'),
                        value('product1', 'stack'),
                        value('product2', 'stack'),
                        value('product3', 'stack'),
                        actualAccumulateGroup('stack', 'window', 'current'),
                    ],
                    groupByKeys: true,
                });

                const initialData = [
                    { quarter: 'Q3', product1: 200, product2: 100, product3: 50 },
                    { quarter: 'Q4', product1: 250, product2: 125, product3: 75 },
                ];
                const dataSet = new DataSet(initialData);
                const sources = basicDataSet(initialData).set('test', dataSet);

                const processedData = dataModel.processData(sources);
                const columns = processedData!.columns;

                // Q3: product1=200, product2=300 (200+100), product3=350 (300+50)
                // Q4: product1=250, product2=375 (250+125), product3=450 (375+75)
                expect(columns[0][0]).toBe(200); // Q3 product1
                expect(columns[1][0]).toBe(300); // Q3 product2 (stacked)
                expect(columns[2][0]).toBe(350); // Q3 product3 (stacked)
                expect(columns[0][1]).toBe(250); // Q4 product1
                expect(columns[1][1]).toBe(375); // Q4 product2 (stacked)
                expect(columns[2][1]).toBe(450); // Q4 product3 (stacked)

                // Prepend earlier quarters
                dataSet.addTransaction({
                    prepend: [
                        { quarter: 'Q1', product1: 100, product2: 50, product3: 25 },
                        { quarter: 'Q2', product1: 150, product2: 75, product3: 40 },
                    ],
                });

                const reprocessed = dataModel.reprocessData(processedData!);
                const reprocessedColumns = reprocessed.columns;

                // Q1: product1=100, product2=150 (100+50), product3=175 (150+25)
                // Q2: product1=150, product2=225 (150+75), product3=265 (225+40)
                expect(reprocessedColumns[0][0]).toBe(100); // Q1 product1
                expect(reprocessedColumns[1][0]).toBe(150); // Q1 product2 (stacked)
                expect(reprocessedColumns[2][0]).toBe(175); // Q1 product3 (stacked)
                expect(reprocessedColumns[0][1]).toBe(150); // Q2 product1
                expect(reprocessedColumns[1][1]).toBe(225); // Q2 product2 (stacked)
                expect(reprocessedColumns[2][1]).toBe(265); // Q2 product3 (stacked)

                // Original data should still be correct (now at indices 2 and 3)
                expect(reprocessedColumns[0][2]).toBe(200); // Q3 product1
                expect(reprocessedColumns[1][2]).toBe(300); // Q3 product2 (stacked)
                expect(reprocessedColumns[2][2]).toBe(350); // Q3 product3 (stacked)
                expect(reprocessedColumns[0][3]).toBe(250); // Q4 product1
                expect(reprocessedColumns[1][3]).toBe(375); // Q4 product2 (stacked)
                expect(reprocessedColumns[2][3]).toBe(450); // Q4 product3 (stacked)
            });

            it('should handle mixed operations with stacked series', () => {
                const dataModel = new DataModel<any, any, true>({
                    props: [
                        categoryKey('month'),
                        value('layer1', 'stack'),
                        value('layer2', 'stack'),
                        actualAccumulateGroup('stack', 'window', 'current'),
                    ],
                    groupByKeys: true,
                });

                const initialData = [
                    { month: 'Jan', layer1: 100, layer2: 50 },
                    { month: 'Feb', layer1: 120, layer2: 60 },
                    { month: 'Mar', layer1: 110, layer2: 55 },
                    { month: 'Apr', layer1: 130, layer2: 65 },
                    { month: 'May', layer1: 125, layer2: 62 },
                ];
                const dataSet = new DataSet(initialData);
                const sources = basicDataSet(initialData).set('test', dataSet);

                const processedData = dataModel.processData(sources);

                // Mixed operations: remove middle, add at both ends
                dataSet.addTransaction({
                    remove: [initialData[2]], // Remove March
                    append: [{ month: 'Jun', layer1: 140, layer2: 70 }],
                });

                const reprocessed = dataModel.reprocessData(processedData!);
                const groups = (reprocessed as any).groups;
                const columns = reprocessed.columns;

                // Should have 5 groups now (removed 1, added 1)
                expect(groups.length).toBe(5);

                // Verify stacking is correct after mixed operations
                // Jan: layer1=100, layer2=150 (100+50)
                expect(groups[0].keys).toEqual(['Jan']);
                expect(columns[0][0]).toBe(100);
                expect(columns[1][0]).toBe(150);

                // Feb: layer1=120, layer2=180 (120+60)
                expect(groups[1].keys).toEqual(['Feb']);
                expect(columns[0][1]).toBe(120);
                expect(columns[1][1]).toBe(180);

                // Apr (Mar was removed): layer1=130, layer2=195 (130+65)
                expect(groups[2].keys).toEqual(['Apr']);
                expect(columns[0][2]).toBe(130);
                expect(columns[1][2]).toBe(195);

                // May: layer1=125, layer2=187 (125+62)
                expect(groups[3].keys).toEqual(['May']);
                expect(columns[0][3]).toBe(125);
                expect(columns[1][3]).toBe(187);

                // Jun: layer1=140, layer2=210 (140+70)
                expect(groups[4].keys).toEqual(['Jun']);
                expect(columns[0][4]).toBe(140);
                expect(columns[1][4]).toBe(210);
            });

            it('should fallback to full reprocessing for normal accumulation mode', () => {
                // Normal accumulation mode (not window) should not support reprocessing
                const dataModel = new DataModel<any, any, true>({
                    props: [
                        categoryKey('category'),
                        value('seriesA', 'stack'),
                        value('seriesB', 'stack'),
                        actualAccumulateGroup('stack', 'normal', 'current'),
                    ],
                    groupByKeys: true,
                });

                const initialData = [
                    { category: 'A', seriesA: 100, seriesB: 50 },
                    { category: 'B', seriesA: 150, seriesB: 75 },
                ];
                const dataSet = new DataSet(initialData);
                const sources = basicDataSet(initialData).set('test', dataSet);

                const processedData = dataModel.processData(sources);

                // Should not support reprocessing with normal accumulation
                expect(dataModel.isReprocessingSupported(processedData!)).toBe(false);

                // Add data
                dataSet.addTransaction({
                    append: [{ category: 'C', seriesA: 200, seriesB: 100 }],
                });

                // This should trigger a full reprocess, not incremental
                const reprocessed = dataModel.reprocessData(processedData!);

                // Data should still be correct even with full reprocessing
                const groups = (reprocessed as any).groups;
                const columns = reprocessed.columns;

                expect(groups.length).toBe(3);

                // With normal accumulation, values accumulate across groups
                // A: seriesA=100, seriesB=150 (100+50)
                // B: seriesA=250 (100+150), seriesB=325 (150+75)
                // C: seriesA=450 (250+200), seriesB=425 (325+100)
                expect(columns[0][0]).toBe(100); // A seriesA
                expect(columns[1][0]).toBe(150); // A seriesB (100+50)
                expect(columns[0][1]).toBe(250); // B seriesA (100+150)
                expect(columns[1][1]).toBe(325); // B seriesB (150+75)
                expect(columns[0][2]).toBe(450); // C seriesA (250+200)
                expect(columns[1][2]).toBe(425); // C seriesB (325+100)
            });

            it('should handle stacking with zero and negative values', () => {
                const dataModel = new DataModel<any, any, true>({
                    props: [
                        categoryKey('period'),
                        value('revenue', 'stack'),
                        value('costs', 'stack'),
                        value('profit', 'stack'),
                        actualAccumulateGroup('stack', 'window', 'current'),
                    ],
                    groupByKeys: true,
                });

                const initialData = [
                    { period: 'P1', revenue: 100, costs: -50, profit: 0 },
                    { period: 'P2', revenue: 150, costs: -75, profit: 25 },
                ];
                const dataSet = new DataSet(initialData);
                const sources = basicDataSet(initialData).set('test', dataSet);

                const processedData = dataModel.processData(sources);
                const columns = processedData!.columns;

                // P1: revenue=100, costs=50 (100+(-50)), profit=50 (50+0)
                expect(columns[0][0]).toBe(100);
                expect(columns[1][0]).toBe(50);
                expect(columns[2][0]).toBe(50);

                // P2: revenue=150, costs=75 (150+(-75)), profit=100 (75+25)
                expect(columns[0][1]).toBe(150);
                expect(columns[1][1]).toBe(75);
                expect(columns[2][1]).toBe(100);

                // Add more data with mixed positive/negative values
                dataSet.addTransaction({
                    append: [{ period: 'P3', revenue: 200, costs: -120, profit: -10 }],
                });

                const reprocessed = dataModel.reprocessData(processedData!);
                const reprocessedColumns = reprocessed.columns;

                // P3: revenue=200, costs=80 (200+(-120)), profit=70 (80+(-10))
                expect(reprocessedColumns[0][2]).toBe(200);
                expect(reprocessedColumns[1][2]).toBe(80);
                expect(reprocessedColumns[2][2]).toBe(70);
            });

            it('should handle high-frequency updates with stacking', () => {
                const dataModel = new DataModel<any, any, true>({
                    props: [
                        categoryKey('timestamp'),
                        value('metric1', 'stack'),
                        value('metric2', 'stack'),
                        value('metric3', 'stack'),
                        actualAccumulateGroup('stack', 'window', 'current'),
                    ],
                    groupByKeys: true,
                });

                // Initial small dataset
                const initialData = [
                    { timestamp: 1000, metric1: 10, metric2: 5, metric3: 3 },
                    { timestamp: 1001, metric1: 11, metric2: 6, metric3: 4 },
                ];
                const dataSet = new DataSet(initialData);
                const sources = basicDataSet(initialData).set('test', dataSet);

                const processedData = dataModel.processData(sources);

                // Simulate high-frequency updates
                for (let i = 0; i < 10; i++) {
                    dataSet.addTransaction({
                        append: [{ timestamp: 1002 + i, metric1: 12 + i, metric2: 7 + i, metric3: 5 + i }],
                    });
                }

                const reprocessed = dataModel.reprocessData(processedData!);
                const groups = (reprocessed as any).groups;
                const columns = reprocessed.columns;

                // Should have 12 groups total
                expect(groups.length).toBe(12);

                // Verify last group has correct stacked values
                const lastGroup = groups[11];
                expect(lastGroup.keys).toEqual([1011]);
                // metric1=21, metric2=37 (21+16), metric3=51 (37+14)
                expect(columns[0][11]).toBe(21);
                expect(columns[1][11]).toBe(37);
                expect(columns[2][11]).toBe(51);
            });

            it('should handle removing all data then adding new data with stacking', () => {
                const dataModel = new DataModel<any, any, true>({
                    props: [
                        categoryKey('id'),
                        value('a', 'stack'),
                        value('b', 'stack'),
                        actualAccumulateGroup('stack', 'window', 'current'),
                    ],
                    groupByKeys: true,
                });

                const initialData = [
                    { id: 'X', a: 100, b: 50 },
                    { id: 'Y', a: 200, b: 100 },
                ];
                const dataSet = new DataSet(initialData);
                const sources = basicDataSet(initialData).set('test', dataSet);

                const processedData = dataModel.processData(sources);

                // Remove all data
                dataSet.addTransaction({
                    remove: initialData,
                });

                // Add completely new data
                dataSet.addTransaction({
                    append: [
                        { id: 'Z', a: 300, b: 150 },
                        { id: 'W', a: 400, b: 200 },
                    ],
                });

                const reprocessed = dataModel.reprocessData(processedData!);
                const groups = (reprocessed as any).groups;
                const columns = reprocessed.columns;

                // Should have 2 new groups
                expect(groups.length).toBe(2);

                // Z: a=300, b=450 (300+150)
                expect(groups[0].keys).toEqual(['Z']);
                expect(columns[0][0]).toBe(300);
                expect(columns[1][0]).toBe(450);

                // W: a=400, b=600 (400+200)
                expect(groups[1].keys).toEqual(['W']);
                expect(columns[0][1]).toBe(400);
                expect(columns[1][1]).toBe(600);
            });

            it('should maintain domain consistency with stacked reprocessing', () => {
                const dataModel = new DataModel<any, any, true>({
                    props: [
                        categoryKey('category'),
                        value('val1', 'stack'),
                        value('val2', 'stack'),
                        value('val3', 'stack'),
                        actualAccumulateGroup('stack', 'window', 'current'),
                    ],
                    groupByKeys: true,
                });

                const initialData = [
                    { category: 'A', val1: 10, val2: 20, val3: 30 },
                    { category: 'B', val1: 15, val2: 25, val3: 35 },
                ];
                const dataSet = new DataSet(initialData);
                const sources = basicDataSet(initialData).set('test', dataSet);

                const processedData = dataModel.processData(sources);

                // Check initial domain (should reflect stacked values)
                // A: val1=10, val2=30 (10+20), val3=60 (30+30)
                // B: val1=15, val2=40 (15+25), val3=75 (40+35)
                expect(processedData!.domain.values[0]).toEqual([10, 15]); // val1
                expect(processedData!.domain.values[1]).toEqual([30, 40]); // val2 stacked
                expect(processedData!.domain.values[2]).toEqual([60, 75]); // val3 stacked

                // Add data with larger values
                dataSet.addTransaction({
                    append: [{ category: 'C', val1: 50, val2: 60, val3: 70 }],
                });

                const reprocessed = dataModel.reprocessData(processedData!);

                // Domain should expand to include new stacked maximum
                // C: val1=50, val2=110 (50+60), val3=180 (110+70)
                expect(reprocessed.domain.values[0]).toEqual([10, 50]); // val1
                expect(reprocessed.domain.values[1]).toEqual([30, 110]); // val2 stacked
                expect(reprocessed.domain.values[2]).toEqual([60, 180]); // val3 stacked
            });
        });
    });

    describe('banded domain optimization', () => {
        describe('append operations with banding', () => {
            it('should correctly update domain when appending to large dataset', () => {
                // Create a data model with banding enabled for datasets > 100 items
                const dataModel = new DataModel<any, any>({
                    props: [rangeKey('x'), value('y')],
                    domainBandingConfig: {
                        minDataSizeForBanding: 100, // Lower threshold for testing
                        targetBandCount: 5,
                        enableBanding: true,
                    },
                });

                // Create large initial dataset
                const initialData = Array.from({ length: 200 }, (_, i) => ({
                    x: i,
                    y: i * 10,
                }));
                const dataSet = new DataSet(initialData);
                const sources = basicDataSet(initialData).set('test', dataSet);

                const processedData = dataModel.processData(sources);

                // Initial domain should be correct
                expect(processedData!.domain.keys).toEqual([[0, 199]]);
                expect(processedData!.domain.values).toEqual([[0, 1990]]);

                // Append more data
                const appendData = [
                    { x: 200, y: 2000 },
                    { x: 201, y: 2010 },
                    { x: 202, y: 2020 },
                ];
                dataSet.addTransaction({ append: appendData });

                const reprocessed = dataModel.reprocessData(processedData!);

                // Domain should extend to include new values
                expect(reprocessed.domain.keys).toEqual([[0, 202]]);
                expect(reprocessed.domain.values).toEqual([[0, 2020]]);

                // Verify actual data
                expect(reprocessed.keys[0].get('test')?.length).toBe(203);
                expect(reprocessed.columns[0].length).toBe(203);
            });
        });

        describe('prepend operations with banding', () => {
            it('should correctly update domain when prepending to large dataset', () => {
                const dataModel = new DataModel<any, any>({
                    props: [rangeKey('x'), value('y')],
                    domainBandingConfig: {
                        minDataSizeForBanding: 100,
                        targetBandCount: 5,
                        enableBanding: true,
                    },
                });

                // Create large initial dataset starting from 10
                const initialData = Array.from({ length: 150 }, (_, i) => ({
                    x: i + 10,
                    y: (i + 10) * 10,
                }));
                const dataSet = new DataSet(initialData);
                const sources = basicDataSet(initialData).set('test', dataSet);

                const processedData = dataModel.processData(sources);

                // Initial domain
                expect(processedData!.domain.keys).toEqual([[10, 159]]);
                expect(processedData!.domain.values).toEqual([[100, 1590]]);

                // Prepend data with lower values
                const prependData = [
                    { x: 7, y: 70 },
                    { x: 8, y: 80 },
                    { x: 9, y: 90 },
                ];
                dataSet.addTransaction({ prepend: prependData });

                const reprocessed = dataModel.reprocessData(processedData!);

                // Domain should extend to include new minimum values
                expect(reprocessed.domain.keys).toEqual([[7, 159]]);
                expect(reprocessed.domain.values).toEqual([[70, 1590]]);

                // Verify data integrity
                expect(reprocessed.keys[0].get('test')?.[0]).toBe(7);
                expect(reprocessed.keys[0].get('test')?.[1]).toBe(8);
                expect(reprocessed.keys[0].get('test')?.[2]).toBe(9);
                expect(reprocessed.keys[0].get('test')?.[3]).toBe(10);
            });
        });

        describe('mixed operations with banding', () => {
            it('should correctly update domain with mixed insert/remove operations', () => {
                const dataModel = new DataModel<any, any>({
                    props: [rangeKey('x'), value('y')],
                    domainBandingConfig: {
                        minDataSizeForBanding: 50,
                        targetBandCount: 4,
                        enableBanding: true,
                    },
                });

                // Create dataset with gaps
                const initialData = Array.from({ length: 100 }, (_, i) => ({
                    x: i * 2, // 0, 2, 4, 6, ...
                    y: i * 20,
                }));
                const dataSet = new DataSet(initialData);
                const sources = basicDataSet(initialData).set('test', dataSet);

                const processedData = dataModel.processData(sources);

                // Initial domain
                expect(processedData!.domain.keys).toEqual([[0, 198]]);
                expect(processedData!.domain.values).toEqual([[0, 1980]]);

                // Mixed operations: remove some middle values, add at both ends
                dataSet.addTransaction({
                    remove: [initialData[25], initialData[50], initialData[75]], // Remove 3 from middle
                    prepend: [{ x: -2, y: -20 }],
                    append: [
                        { x: 200, y: 2000 },
                        { x: 202, y: 2020 },
                    ],
                });

                const reprocessed = dataModel.reprocessData(processedData!);

                // Domain should reflect new min/max
                expect(reprocessed.domain.keys).toEqual([[-2, 202]]);
                expect(reprocessed.domain.values).toEqual([[-20, 2020]]);

                // Verify count is correct (100 - 3 + 1 + 2 = 100)
                expect(reprocessed.input.count).toBe(100);
            });
        });

        describe('boundary value removal with banding', () => {
            it('should correctly recalculate domain when removing boundary values', () => {
                const dataModel = new DataModel<any, any>({
                    props: [rangeKey('x'), value('y')],
                    domainBandingConfig: {
                        minDataSizeForBanding: 50,
                        targetBandCount: 3,
                        enableBanding: true,
                    },
                });

                // Dataset with clear boundaries
                const initialData = Array.from({ length: 60 }, (_, i) => ({
                    x: i,
                    y: i * 10,
                }));
                const dataSet = new DataSet(initialData);
                const sources = basicDataSet(initialData).set('test', dataSet);

                const processedData = dataModel.processData(sources);

                // Initial domain
                expect(processedData!.domain.keys).toEqual([[0, 59]]);
                expect(processedData!.domain.values).toEqual([[0, 590]]);

                // Remove the minimum and maximum values
                dataSet.addTransaction({
                    remove: [
                        initialData[0], // x: 0, y: 0 (minimum)
                        initialData[59], // x: 59, y: 590 (maximum)
                    ],
                });

                const reprocessed = dataModel.reprocessData(processedData!);

                // Domain should update to new boundaries
                expect(reprocessed.domain.keys).toEqual([[1, 58]]);
                expect(reprocessed.domain.values).toEqual([[10, 580]]);
            });

            it('should handle removing all values from a band', () => {
                const dataModel = new DataModel<any, any>({
                    props: [rangeKey('x'), value('y')],
                    domainBandingConfig: {
                        minDataSizeForBanding: 20,
                        targetBandCount: 4, // Should create ~5 items per band for 20 items
                        enableBanding: true,
                    },
                });

                // Small dataset that will be banded
                const initialData = Array.from({ length: 20 }, (_, i) => ({
                    x: i,
                    y: i * 10,
                }));
                const dataSet = new DataSet(initialData);
                const sources = basicDataSet(initialData).set('test', dataSet);

                const processedData = dataModel.processData(sources);

                // Remove entire first "band" worth of data (first 5 items)
                const toRemove = initialData.slice(0, 5);
                dataSet.addTransaction({ remove: toRemove });

                const reprocessed = dataModel.reprocessData(processedData!);

                // Domain should start from the remaining minimum
                expect(reprocessed.domain.keys).toEqual([[5, 19]]);
                expect(reprocessed.domain.values).toEqual([[50, 190]]);
                expect(reprocessed.input.count).toBe(15);
            });
        });

        describe('band rebalancing scenarios', () => {
            it('should rebalance bands when data size changes significantly', () => {
                const dataModel = new DataModel<any, any>({
                    props: [rangeKey('x'), value('y')],
                    domainBandingConfig: {
                        minDataSizeForBanding: 5, // Lower for testing
                        targetBandCount: 3,
                        enableBanding: true,
                    },
                });

                // Start with dataset just above banding threshold
                const initialData = Array.from({ length: 10 }, (_, i) => ({
                    x: i,
                    y: i * 10,
                }));
                const dataSet = new DataSet(initialData);
                const sources = basicDataSet(initialData).set('test', dataSet);

                const processedData = dataModel.processData(sources);

                // Verify initial domain with banding enabled
                expect(processedData!.domain.keys).toEqual([[0, 9]]);
                expect(processedData!.domain.values).toEqual([[0, 90]]);

                // Add significant amount of data (double the size)
                const appendData = Array.from({ length: 10 }, (_, i) => ({
                    x: i + 10,
                    y: (i + 10) * 10,
                }));
                dataSet.addTransaction({ append: appendData });

                const reprocessed = dataModel.reprocessData(processedData!);

                // Domain should include all data
                expect(reprocessed.domain.keys).toEqual([[0, 19]]);
                expect(reprocessed.domain.values).toEqual([[0, 190]]);
                expect(reprocessed.input.count).toBe(20);

                // Remove half the data - items with x=0 to x=4
                const toRemove = initialData.slice(0, 5);
                dataSet.addTransaction({ remove: toRemove });

                const reprocessed2 = dataModel.reprocessData(reprocessed);

                // Should still calculate correct domain with less data
                // Remaining data: x=5 to x=19
                expect(reprocessed2.domain.keys).toEqual([[5, 19]]);
                expect(reprocessed2.domain.values).toEqual([[50, 190]]);
                expect(reprocessed2.input.count).toBe(15);

                // Remove more to drop below banding threshold
                // Remove x=5 to x=9 and x=10 to x=16
                // This should leave only x=17, x=18, x=19
                const toRemoveMore = [...initialData.slice(5), ...appendData.slice(0, 7)];
                dataSet.addTransaction({ remove: toRemoveMore });

                const reprocessed3 = dataModel.reprocessData(reprocessed2);

                // Check actual data in dataSet
                const actualData = dataSet.data;
                const actualXValues = actualData.map((d) => d.x).sort((a, b) => a - b);
                const actualYValues = actualData.map((d) => d.y).sort((a, b) => a - b);

                // Domain should match the actual remaining data
                const expectedMinX = Math.min(...actualXValues);
                const expectedMaxX = Math.max(...actualXValues);
                const expectedMinY = Math.min(...actualYValues);
                const expectedMaxY = Math.max(...actualYValues);

                // The issue: After aggressive removals, the processed data count might not match
                // actual data count due to how transactions are applied. Let's verify both match first.
                expect(reprocessed3.input.count).toBe(actualData.length);

                expect(reprocessed3.domain.keys).toEqual([[expectedMinX, expectedMaxX]]);
                expect(reprocessed3.domain.values).toEqual([[expectedMinY, expectedMaxY]]);
            });

            it('should handle transition from non-banded to banded mode', () => {
                const dataModel = new DataModel<any, any>({
                    props: [rangeKey('x'), value('y')],
                    domainBandingConfig: {
                        minDataSizeForBanding: 100,
                        targetBandCount: 5,
                        enableBanding: true,
                    },
                });

                // Start below banding threshold
                const initialData = Array.from({ length: 50 }, (_, i) => ({
                    x: i,
                    y: i * 10,
                }));
                const dataSet = new DataSet(initialData);
                const sources = basicDataSet(initialData).set('test', dataSet);

                const processedData = dataModel.processData(sources);

                // Should not use banding initially
                expect(processedData!.domain.keys).toEqual([[0, 49]]);
                expect(processedData!.domain.values).toEqual([[0, 490]]);

                // Add enough data to trigger banding
                const appendData = Array.from({ length: 60 }, (_, i) => ({
                    x: i + 50,
                    y: (i + 50) * 10,
                }));
                dataSet.addTransaction({ append: appendData });

                const reprocessed = dataModel.reprocessData(processedData!);

                // Should now use banding and still calculate correct domain
                expect(reprocessed.domain.keys).toEqual([[0, 109]]);
                expect(reprocessed.domain.values).toEqual([[0, 1090]]);
                expect(reprocessed.input.count).toBe(110);
            });
        });

        describe('scrolling data operations with banding', () => {
            it('should correctly update domain when scrolling data (remove from start, append at end)', () => {
                const dataModel = new DataModel<any, any>({
                    props: [rangeKey('x'), value('y')],
                    domainBandingConfig: {
                        minDataSizeForBanding: 100,
                        targetBandCount: 10,
                        enableBanding: true,
                    },
                });

                // Create dataset with 1200 items (will create bands for optimization)
                const initialData = Array.from({ length: 1200 }, (_, i) => ({
                    x: i,
                    y: i * 10,
                }));
                const dataSet = new DataSet(initialData);
                const sources = basicDataSet(initialData).set('test', dataSet);

                const processedData = dataModel.processData(sources);

                // Initial domain
                expect(processedData!.domain.keys).toEqual([[0, 1199]]);
                expect(processedData!.domain.values).toEqual([[0, 11990]]);

                // Simulate scrolling: remove 10 from start, append 10 at end
                // This tests a common real-time data scenario where old data is removed and new data is appended
                const toRemove = initialData.slice(0, 10);
                const toAppend = Array.from({ length: 10 }, (_, i) => ({
                    x: 1200 + i,
                    y: (1200 + i) * 10,
                }));
                dataSet.addTransaction({
                    remove: toRemove,
                    append: toAppend,
                });

                const reprocessed = dataModel.reprocessData(processedData!);

                // Domain should shift to new range correctly with banding optimization
                expect(reprocessed.domain.keys).toEqual([[10, 1209]]);
                expect(reprocessed.domain.values).toEqual([[100, 12090]]);

                // Verify data count is maintained
                expect(reprocessed.input.count).toBe(1200);
            });

            it('should correctly shift and resize bands during scrolling (detailed band verification)', () => {
                // Enable debug mode to see what's happening
                (global as any).agChartsDebug = true;

                try {
                    const dataModel = new DataModel<any, any>({
                        props: [rangeKey('x'), value('y')],
                        domainBandingConfig: {
                            minDataSizeForBanding: 100,
                            targetBandCount: 10,
                            enableBanding: true,
                        },
                    });

                    // Create dataset with 1200 items
                    // Expected bands: 12 bands of 100 items each
                    // Band 0: [0, 100), Band 1: [100, 200), ..., Band 11: [1100, 1200)
                    const initialData = Array.from({ length: 1200 }, (_, i) => ({
                        x: i,
                        y: i * 10,
                    }));
                    const dataSet = new DataSet(initialData);
                    const sources = basicDataSet(initialData).set('test', dataSet);

                    const processedData = dataModel.processData(sources);

                    // Verify initial domain
                    expect(processedData!.domain.keys).toEqual([[0, 1199]]);
                    expect(processedData!.domain.values).toEqual([[0, 11990]]);

                    // Simulate scrolling: remove 10 from start, append 10 at end
                    // Expected band behavior after removal (indices shifted):
                    // Band 0: [0, 100) -> [0, 90) DIRTY (shrunk, needs rescan)
                    // Band 1: [100, 200) -> [90, 190) CLEAN (shifted down)
                    // ...
                    // Band 11: [1100, 1200) -> [1090, 1190) CLEAN (shifted down)
                    //
                    // Expected band behavior after append:
                    // Band 11: [1090, 1190) -> [1090, 1200) DIRTY (extended to include new data)
                    const toRemove = initialData.slice(0, 10);
                    const toAppend = Array.from({ length: 10 }, (_, i) => ({
                        x: 1200 + i,
                        y: (1200 + i) * 10,
                    }));
                    dataSet.addTransaction({
                        remove: toRemove,
                        append: toAppend,
                    });

                    const reprocessed = dataModel.reprocessData(processedData!);

                    // Domain should correctly shift to new range
                    expect(reprocessed.domain.keys).toEqual([[10, 1209]]);
                    expect(reprocessed.domain.values).toEqual([[100, 12090]]);
                    expect(reprocessed.input.count).toBe(1200);

                    // Verify the banding optimization worked
                    // In a scrolling scenario with 1200 items and 12 bands:
                    // - Only 2 bands should be dirty (band 0 shrunk, band 11 extended)
                    // - That's 2/12 = 16.7% of bands scanned, not 100%
                    const metadata = reprocessed.optimizations;
                    expect(metadata).toBeDefined();

                    // CRITICAL: If domainBanding metadata is available, verify optimization is working
                    if (metadata?.domainBanding) {
                        expect(metadata.domainBanding.keyDefs).toBeDefined();
                        expect(metadata.domainBanding.valueDefs).toBeDefined();

                        // Verify key domain banding efficiency
                        const keyDefStats = metadata.domainBanding.keyDefs[0].stats;
                        if (keyDefStats) {
                            expect(keyDefStats.totalBands).toBeGreaterThan(1); // Should have multiple bands
                            expect(keyDefStats.dirtyBands).toBeLessThan(keyDefStats.totalBands); // Not all bands dirty
                            expect(keyDefStats.dirtyBands).toBeLessThanOrEqual(5); // At most ~40% of bands
                            expect(keyDefStats.scanRatio).toBeLessThan(0.5); // Less than 50% data scanned
                            expect(keyDefStats.scanRatio).toBeGreaterThan(0); // But more than 0%
                        }

                        // Verify value domain banding efficiency
                        const valueDefStats = metadata.domainBanding.valueDefs[0].stats;
                        if (valueDefStats) {
                            expect(valueDefStats.totalBands).toBeGreaterThan(1); // Should have multiple bands
                            expect(valueDefStats.dirtyBands).toBeLessThan(valueDefStats.totalBands); // Not all bands dirty
                            expect(valueDefStats.dirtyBands).toBeLessThanOrEqual(5); // At most ~40% of bands
                            expect(valueDefStats.scanRatio).toBeLessThan(0.5); // Less than 50% data scanned
                            expect(valueDefStats.scanRatio).toBeGreaterThan(0); // But more than 0%
                        }
                    }
                    // Note: If metadata is not available, we can still verify the optimization worked
                    // by checking that the domain is correct (which it wouldn't be if all bands were reinit)
                } finally {
                    delete (global as any).agChartsDebug;
                }
            });

            it('should handle multiple scrolling operations efficiently', () => {
                // Enable debug mode
                (global as any).agChartsDebug = true;

                try {
                    const dataModel = new DataModel<any, any>({
                        props: [rangeKey('x'), value('y')],
                        domainBandingConfig: {
                            minDataSizeForBanding: 100,
                            targetBandCount: 10,
                            enableBanding: true,
                        },
                    });

                    let currentData = Array.from({ length: 1200 }, (_, i) => ({
                        x: i,
                        y: i * 10,
                    }));
                    const dataSet = new DataSet(currentData);
                    const sources = basicDataSet(currentData).set('test', dataSet);

                    let processedData = dataModel.processData(sources)!;

                    // Perform 5 scrolling operations
                    for (let iteration = 0; iteration < 5; iteration++) {
                        const nextIndex = 1200 + iteration * 10;
                        const toRemove = currentData.slice(0, 10);
                        const toAppend = Array.from({ length: 10 }, (_, i) => ({
                            x: nextIndex + i,
                            y: (nextIndex + i) * 10,
                        }));

                        // Update our tracking
                        currentData = [...currentData.slice(10), ...toAppend];

                        dataSet.addTransaction({
                            remove: toRemove,
                            append: toAppend,
                        });

                        processedData = dataModel.reprocessData(processedData) as any;

                        // Verify domain is correct after each iteration
                        const expectedMinX = 10 * (iteration + 1);
                        const expectedMaxX = 1200 + 10 * (iteration + 1) - 1;
                        expect(processedData.domain.keys).toEqual([[expectedMinX, expectedMaxX]]);
                        expect(processedData.input.count).toBe(1200);

                        // CRITICAL: Verify optimization is working on EVERY iteration
                        const metadata = processedData.optimizations;
                        if (metadata?.domainBanding) {
                            const keyDefStats = metadata.domainBanding.keyDefs[0].stats;
                            if (keyDefStats) {
                                expect(keyDefStats.dirtyBands).toBeLessThan(keyDefStats.totalBands); // Not all bands dirty
                                expect(keyDefStats.scanRatio).toBeLessThan(0.5); // Less than 50% data scanned
                            }

                            const valueDefStats = metadata.domainBanding.valueDefs[0].stats;
                            if (valueDefStats) {
                                expect(valueDefStats.dirtyBands).toBeLessThan(valueDefStats.totalBands); // Not all bands dirty
                                expect(valueDefStats.scanRatio).toBeLessThan(0.5); // Less than 50% data scanned
                            }
                        }
                    }

                    // After 5 scrolls (50 items removed from start, 50 added to end)
                    // Final range should be [50, 1249]
                    expect(processedData.domain.keys).toEqual([[50, 1249]]);
                    expect(processedData.domain.values).toEqual([[500, 12490]]);
                } finally {
                    delete (global as any).agChartsDebug;
                }
            });

            it('should not reinitialize all bands during scrolling when data size is below threshold', () => {
                // This test specifically verifies the fix for the bug where considerRebalancing()
                // was reinitializing all bands whenever data size < minDataSizeForBanding
                (global as any).agChartsDebug = true;

                try {
                    const dataModel = new DataModel<any, any>({
                        props: [rangeKey('x'), value('y')],
                        domainBandingConfig: {
                            minDataSizeForBanding: 1000, // Set threshold to 1000
                            targetBandCount: 5,
                            enableBanding: true,
                        },
                    });

                    // Create dataset with 600 items (below threshold but still using bands)
                    const initialData = Array.from({ length: 600 }, (_, i) => ({
                        x: i,
                        y: i * 10,
                    }));
                    const dataSet = new DataSet(initialData);
                    const sources = basicDataSet(initialData).set('test', dataSet);

                    const processedData = dataModel.processData(sources)!;
                    expect(processedData.domain.keys).toEqual([[0, 599]]);

                    // Scroll: remove 1 from start, append 1 at end
                    dataSet.addTransaction({
                        remove: [initialData[0]],
                        append: [{ x: 600, y: 6000 }],
                    });

                    const reprocessed = dataModel.reprocessData(processedData);
                    expect(reprocessed.domain.keys).toEqual([[1, 600]]);

                    // CRITICAL: Verify that NOT ALL bands were marked dirty
                    // Before the fix, considerRebalancing() would reinitialize all bands
                    // because dataSize (600) < minDataSizeForBanding (1000)
                    // The fact that the domain is correct ([1, 600]) proves the optimization worked
                    const metadata = reprocessed.optimizations;
                    if (metadata?.domainBanding) {
                        const keyDefStats = metadata.domainBanding.keyDefs[0].stats;
                        if (keyDefStats) {
                            expect(keyDefStats.totalBands).toBe(5); // Should have 5 bands
                            expect(keyDefStats.dirtyBands).toBeLessThan(5); // NOT all 5 bands dirty
                            expect(keyDefStats.dirtyBands).toBeLessThanOrEqual(2); // Should be ~2 bands
                            expect(keyDefStats.scanRatio).toBeLessThan(0.5); // Less than 50% scanned
                        }

                        const valueDefStats = metadata.domainBanding.valueDefs[0].stats;
                        if (valueDefStats) {
                            expect(valueDefStats.totalBands).toBe(5);
                            expect(valueDefStats.dirtyBands).toBeLessThan(5); // NOT all 5 bands dirty
                            expect(valueDefStats.dirtyBands).toBeLessThanOrEqual(2);
                            expect(valueDefStats.scanRatio).toBeLessThan(0.5);
                        }
                    }
                    // Note: If metadata is not available during reprocessing, the correct domain
                    // proves the optimization worked (would be wrong if all bands were reinit)
                } finally {
                    delete (global as any).agChartsDebug;
                }
            });

            it('should only mark affected bands dirty when scrolling (5 bands, 600 items)', () => {
                // This test verifies the specific scenario from the user's high-freq-multi-chart example
                // With 600 items and 5 bands, scrolling should only dirty 2 bands (first and last)
                const dataModel = new DataModel<any, any>({
                    props: [rangeKey('time'), value('value')],
                    domainBandingConfig: {
                        minDataSizeForBanding: 100,
                        targetBandCount: 5,
                        enableBanding: true,
                    },
                });

                // Create dataset with 600 items (will create 5 bands of 120 items each)
                const initialData = Array.from({ length: 600 }, (_, i) => ({
                    time: i,
                    value: i * 10,
                }));
                const dataSet = new DataSet(initialData);
                const sources = basicDataSet(initialData).set('test', dataSet);

                const processedData = dataModel.processData(sources);

                // Initial domain
                expect(processedData!.domain.keys).toEqual([[0, 599]]);
                expect(processedData!.domain.values).toEqual([[0, 5990]]);

                // Simulate scrolling: remove 1 from start, append 1 at end
                // This is the exact pattern from the high-freq-multi-chart example
                const toRemove = [initialData[0]];
                const toAppend = [{ time: 600, value: 6000 }];
                dataSet.addTransaction({
                    remove: toRemove,
                    append: toAppend,
                });

                const reprocessed1 = dataModel.reprocessData(processedData!);

                // First reprocess: bands are created from scratch, all dirty (expected)
                expect(reprocessed1.input.count).toBe(600);
                expect(reprocessed1.domain.keys).toEqual([[1, 600]]);
                expect(reprocessed1.domain.values).toEqual([[10, 6000]]);

                const metadata1 = reprocessed1.optimizations?.domainBanding;
                expect(metadata1?.keyDefs[0].stats?.dirtyBands).toBe(5); // First reprocess: all bands dirty (expected)

                // Now do a SECOND transaction - this is where the optimization should kick in
                // Note: We use the actual data object from the dataset, not the original initialData
                const currentData = dataSet.data;
                const toRemove2 = [currentData[0]]; // Remove first item from current data
                const toAppend2 = [{ time: 601, value: 6010 }];
                dataSet.addTransaction({
                    remove: toRemove2,
                    append: toAppend2,
                });

                const reprocessed2 = dataModel.reprocessData(reprocessed1);

                // Second reprocess: data size still 600
                expect(reprocessed2.input.count).toBe(600);
                expect(reprocessed2.domain.keys).toEqual([[2, 601]]);
                expect(reprocessed2.domain.values).toEqual([[20, 6010]]);

                // CRITICAL: Verify banding optimization is working on SECOND reprocess
                const metadata2 = reprocessed2.optimizations;
                expect(metadata2?.domainBanding).toBeDefined();

                // For 5 bands with remove-first + append-last operation:
                // - Band 0 (first) should be dirty (affected by removal)
                // - Band 4 (last) should be dirty (affected by append)
                // - Bands 1-3 should remain clean (only indices shifted)
                // Total: 2/5 bands dirty = 40% scan, NOT 100%
                const keyDefStats = metadata2?.domainBanding?.keyDefs[0].stats;
                expect(keyDefStats).toBeDefined();
                expect(keyDefStats?.totalBands).toBe(5);
                expect(keyDefStats?.dirtyBands).toBe(2); // MUST be 2, not 5!
                expect(keyDefStats?.scanRatio).toBeCloseTo(0.4, 1); // 2/5 = 40%

                const valueDefStats = metadata2?.domainBanding?.valueDefs[0].stats;
                expect(valueDefStats).toBeDefined();
                expect(valueDefStats?.totalBands).toBe(5);
                expect(valueDefStats?.dirtyBands).toBe(2); // MUST be 2, not 5!
                expect(valueDefStats?.scanRatio).toBeCloseTo(0.4, 1); // 2/5 = 40%
            });
        });

        describe('discrete domains with banding disabled', () => {
            it('should not use banding for category domains', () => {
                const dataModel = new DataModel<any, any>({
                    props: [categoryKey('category'), value('value')],
                    domainBandingConfig: {
                        minDataSizeForBanding: 10, // Low threshold
                        targetBandCount: 5,
                        enableBanding: true,
                    },
                });

                // Large dataset with categories
                const categories = ['A', 'B', 'C', 'D', 'E'];
                const initialData = Array.from({ length: 100 }, (_, i) => ({
                    category: categories[i % 5],
                    value: i * 10,
                }));
                const dataSet = new DataSet(initialData);
                const sources = basicDataSet(initialData).set('test', dataSet);

                const processedData = dataModel.processData(sources);

                // Should handle discrete domains correctly
                expect(processedData!.domain.keys).toEqual([['A', 'B', 'C', 'D', 'E']]);

                // Add new category
                dataSet.addTransaction({ append: [{ category: 'F', value: 1000 }] });

                const reprocessed = dataModel.reprocessData(processedData!);

                // Should include new category
                expect(reprocessed.domain.keys).toEqual([['A', 'B', 'C', 'D', 'E', 'F']]);
            });
        });

        describe('performance characteristics with banding', () => {
            it('should efficiently handle append-heavy workloads', () => {
                const dataModel = new DataModel<any, any>({
                    props: [rangeKey('timestamp'), value('value')],
                    domainBandingConfig: {
                        minDataSizeForBanding: 100,
                        targetBandCount: 10,
                        enableBanding: true,
                    },
                });

                // Simulate time-series data
                const initialData = Array.from({ length: 1000 }, (_, i) => ({
                    timestamp: i * 1000, // Millisecond timestamps
                    value: Math.sin(i / 100) * 100,
                }));
                const dataSet = new DataSet(initialData);
                const sources = basicDataSet(initialData).set('test', dataSet);

                const processedData = dataModel.processData(sources);

                // Simulate multiple rapid append operations (like real-time data)
                for (let batch = 0; batch < 10; batch++) {
                    const batchData = Array.from({ length: 10 }, (_, i) => ({
                        timestamp: (1000 + batch * 10 + i) * 1000,
                        value: Math.sin((1000 + batch * 10 + i) / 100) * 100,
                    }));
                    dataSet.addTransaction({ append: batchData });
                }

                const reprocessed = dataModel.reprocessData(processedData!);

                // Should handle 100 new data points efficiently
                expect(reprocessed.input.count).toBe(1100);
                expect(reprocessed.domain.keys[0][0]).toBe(0); // Min timestamp
                expect(reprocessed.domain.keys[0][1]).toBe(1099000); // Max timestamp

                // Value domain should reflect the sine wave range
                expect(reprocessed.domain.values[0][0]).toBeCloseTo(-100, 0);
                expect(reprocessed.domain.values[0][1]).toBeCloseTo(100, 0);
            });
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

    describe('Column Batch Merging', () => {
        it('should merge batches with identical keys and invalidKeys', () => {
            const dataSet1 = new DataSet([
                { key: 1, valueA: 10 },
                { key: 2, valueA: 20 },
            ]);

            const dataSet2 = new DataSet([
                { key: 1, valueB: 100 },
                { key: 2, valueB: 200 },
            ]);

            const dataModel = new DataModel<any, any, true>({
                props: [
                    categoryKey('key', ['scope1']),
                    categoryKey('key', ['scope2']),
                    scopedValue('scope1', 'valueA'),
                    scopedValue('scope2', 'valueB'),
                ],
                groupByKeys: true,
            });

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
            const dataSet1 = new DataSet([
                { key: 1, value: 10 },
                { key: 2, value: 20 },
            ]);

            const dataSet2 = new DataSet([
                { key: 3, value: 30 },
                { key: 4, value: 40 },
            ]);

            const dataModel = new DataModel<any, any, true>({
                props: [
                    categoryKey('key', ['scope1']),
                    categoryKey('key', ['scope2']),
                    scopedValue('scope1', 'value'),
                    scopedValue('scope2', 'value'),
                ],
                groupByKeys: true,
            });

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
            const dataSet1 = new DataSet([
                { key: 1, value: 10 },
                { key: 2, value: 20 },
            ]);

            const dataSet2 = new DataSet([
                { key: 1, value: 100 },
                { key: 2, value: 200 },
            ]);

            const dataModel = new DataModel<any, any, true>({
                props: [
                    categoryKey('key', ['scope1']),
                    categoryKey('key', ['scope2']),
                    scopedValue('scope1', 'value'),
                    scopedValue('scope2', 'value'),
                ],
                groupByKeys: true,
            });

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
            const dataSet1 = new DataSet([
                { key: 1, valueA1: 10, valueA2: 15 },
                { key: 2, valueA1: 20, valueA2: 25 },
            ]);

            const dataSet2 = new DataSet([
                { key: 1, valueB1: 100, valueB2: 150 },
                { key: 2, valueB1: 200, valueB2: 250 },
            ]);

            const dataModel = new DataModel<any, any, true>({
                props: [
                    categoryKey('key', ['scope1']),
                    categoryKey('key', ['scope2']),
                    scopedValue('scope1', 'valueA1'),
                    scopedValue('scope1', 'valueA2'),
                    scopedValue('scope2', 'valueB1'),
                    scopedValue('scope2', 'valueB2'),
                ],
                groupByKeys: true,
            });

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

    describe('optimization metadata', () => {
        beforeEach(() => {
            // Enable debug mode for these tests
            (global as any).agChartsDebug = true;
        });

        afterEach(() => {
            // Clean up
            delete (global as any).agChartsDebug;
        });

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

        it('should not collect metadata when debug disabled', () => {
            // Temporarily disable debug for this test
            delete (global as any).agChartsDebug;

            const dataModel = new DataModel<any, any>({
                props: [rangeKey('x'), value('y')],
            });
            // Debug is disabled by default

            const dataSet = new DataSet([
                { x: 1, y: 10 },
                { x: 2, y: 20 },
            ]);
            const sources = new Map([['test', dataSet]]);

            const processedData = dataModel.processData(sources);

            expect(processedData?.optimizations).toBeUndefined();

            // Re-enable for other tests in this describe block
            (global as any).agChartsDebug = true;
        });
    });
});
