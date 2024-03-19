import { describe, expect, it } from '@jest/globals';

import { isFiniteNumber } from '../../util/type-guards';
import { rangedValueProperty } from '../series/series';
import { DATA_BROWSER_MARKET_SHARE } from '../test/data';
import * as examples from '../test/examples';
import { expectWarning, expectWarnings, setupMockConsole } from '../test/utils';
import {
    accumulatedValue,
    area as actualArea,
    groupAverage as actualGroupAverage,
    groupCount as actualGroupCount,
    range as actualRange,
    sum as actualSum,
} from './aggregateFunctions';
import type { AggregatePropertyDefinition, GroupByFn, PropertyId } from './dataModel';
import { DataModel } from './dataModel';
import {
    SMALLEST_KEY_INTERVAL,
    SORT_DOMAIN_GROUPS,
    normaliseGroupTo as actualNormaliseGroupTo,
    normalisePropertyTo as actualNormalisePropertyTo,
} from './processors';

const rangeKey = (property: string) => ({ scope: 'test', property, type: 'key' as const, valueType: 'range' as const });
const categoryKey = (property: string) => ({
    scopes: ['test'],
    property,
    type: 'key' as const,
    valueType: 'category' as const,
});
const scopedValue = (scope: string[] | string | undefined, property: string, groupId?: string, id?: string) => {
    let scopes: string[] | undefined = undefined;
    if (Array.isArray(scope)) {
        scopes = scope;
    } else if (scope) {
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
const accumulatedGroupValue = (property: string, groupId: string = property, id?: string) => ({
    ...value(property, groupId, id),
    processor: () => (next: number, total?: number) => next + (total ?? 0),
});
const accumulatedPropertyValue = (property: string, groupId: string = property, id?: string) => ({
    ...value(property, groupId, id),
    processor: accumulatedValue(true),
});
const sum = (groupId: string) => actualSum({ id: 'test' }, `sum-${groupId}`, groupId);
const scopedSum = (scopes: string[] | undefined, groupId: string) => ({
    ...actualSum({ id: 'test' }, `sum-${groupId}`, groupId),
    scopes,
});
const range = (groupId: string) => actualRange({ id: 'test' }, `range-${groupId}`, groupId);
const groupAverage = (groupId: string) => actualGroupAverage({ id: 'test' }, `groupAverage-${groupId}`, groupId);
const groupCount = () => actualGroupCount({ id: 'test' }, `groupCount`);
const area = (groupId: string, aggFn: AggregatePropertyDefinition<any, any>) =>
    actualArea({ id: 'test' }, `area-${groupId}`, aggFn);
const normaliseGroupTo = (groupId: string, normaliseTo: number, mode?: 'sum' | 'range') =>
    actualNormaliseGroupTo({ id: 'test' }, [groupId], normaliseTo, mode);
const normalisePropertyTo = (prop: PropertyId<any>, normaliseTo: [number, number]) =>
    actualNormalisePropertyTo({ id: 'test' }, prop, normaliseTo, 0);

describe('DataModel', () => {
    setupMockConsole();

    describe('ungrouped processing', () => {
        it('should generated the expected results', () => {
            const data = examples.SIMPLE_LINE_CHART_EXAMPLE.data ?? [];
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
                const data = [
                    { kp: 2, vp1: 5, vp2: 7 },
                    { kp: 3, vp1: 1, vp2: 2 },
                    { kp: 4, vp1: 6, vp2: 9 },
                ];

                it('should extract the configured keys', () => {
                    const result = dataModel.processData(data);

                    expect(result?.type).toEqual('ungrouped');
                    expect(result?.data.length).toEqual(3);
                    expect(result?.data[0].keys).toEqual([2]);
                    expect(result?.data[1].keys).toEqual([3]);
                    expect(result?.data[2].keys).toEqual([4]);
                });

                it('should extract the configured values', () => {
                    const result = dataModel.processData(data);

                    expect(result?.type).toEqual('ungrouped');
                    expect(result?.data.length).toEqual(3);
                    expect(result?.data[0].values).toEqual([5, 7]);
                    expect(result?.data[1].values).toEqual([1, 2]);
                    expect(result?.data[2].values).toEqual([6, 9]);
                });

                it('should calculate the domains', () => {
                    const result = dataModel.processData(data);

                    expect(result?.type).toEqual('ungrouped');
                    expect(result?.domain.keys).toEqual([[2, 4]]);
                    expect(result?.domain.values).toEqual([
                        [1, 6],
                        [2, 9],
                    ]);
                });

                it('should calculate smallest X interval', () => {
                    const result = dataModel.processData(data);

                    expect(result?.reduced?.smallestKeyInterval).toEqual(1);
                });
            });

            describe('category data', () => {
                const dataModel = new DataModel<any, any, false>({
                    props: [categoryKey('kp'), value('vp1'), value('vp2')],
                    groupByKeys: false,
                });
                const data = [
                    { kp: 'Q1', vp1: 5, vp2: 7 },
                    { kp: 'Q1', vp1: 1, vp2: 2 },
                    { kp: 'Q2', vp1: 6, vp2: 9 },
                    { kp: 'Q2', vp1: 6, vp2: 9 },
                ];

                it('should extract the configured keys', () => {
                    const result = dataModel.processData(data);

                    expect(result?.type).toEqual('ungrouped');
                    expect(result?.data.length).toEqual(4);
                    expect(result?.data[0].keys).toEqual(['Q1']);
                    expect(result?.data[1].keys).toEqual(['Q1']);
                    expect(result?.data[2].keys).toEqual(['Q2']);
                    expect(result?.data[3].keys).toEqual(['Q2']);
                });

                it('should extract the configured values', () => {
                    const result = dataModel.processData(data);

                    expect(result?.type).toEqual('ungrouped');
                    expect(result?.data.length).toEqual(4);
                    expect(result?.data[0].values).toEqual([5, 7]);
                    expect(result?.data[1].values).toEqual([1, 2]);
                    expect(result?.data[2].values).toEqual([6, 9]);
                    expect(result?.data[3].values).toEqual([6, 9]);
                });
            });

            describe('category data with toString()', () => {
                const dataModel = new DataModel<any, any, false>({
                    props: [categoryKey('kp'), value('vp1'), value('vp2')],
                    groupByKeys: false,
                });
                const data = [
                    { kp: { toString: () => 'Q1' }, vp1: 5, vp2: 7 },
                    { kp: { toString: () => 'Q1' }, vp1: 1, vp2: 2 },
                    { kp: { toString: () => 'Q2' }, vp1: 6, vp2: 9 },
                    { kp: { toString: () => 'Q2' }, vp1: 6, vp2: 9 },
                ];

                it('should extract the configured keys', () => {
                    const result = dataModel.processData(data);

                    expect(result?.type).toEqual('ungrouped');
                    expect(result?.data.length).toEqual(4);
                    expect(result?.data[0].keys).toEqual([data[0].kp]);
                    expect(result?.data[1].keys).toEqual([data[1].kp]);
                    expect(result?.data[2].keys).toEqual([data[2].kp]);
                    expect(result?.data[3].keys).toEqual([data[3].kp]);
                });

                it('should extract the configured values', () => {
                    const result = dataModel.processData(data);

                    expect(result?.type).toEqual('ungrouped');
                    expect(result?.data.length).toEqual(4);
                    expect(result?.data[0].values).toEqual([5, 7]);
                    expect(result?.data[1].values).toEqual([1, 2]);
                    expect(result?.data[2].values).toEqual([6, 9]);
                    expect(result?.data[3].values).toEqual([6, 9]);
                });
            });
        });
    });

    describe('ungrouped processing - accumulated and normalised properties', () => {
        it('should generated the expected results', () => {
            const data = examples.SIMPLE_PIE_CHART_EXAMPLE.series?.[0].data ?? [];
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
                const data = [
                    { kp: 2, vp1: 5, vp2: 7, vp3: 1 },
                    { kp: 3, vp1: 1, vp2: -5, vp3: 2 },
                    { kp: 4, vp1: 6, vp2: 9, vp3: 3 },
                ];

                it('should extract the configured keys', () => {
                    const result = dataModel.processData(data);

                    expect(result?.type).toEqual('ungrouped');
                    expect(result?.data.length).toEqual(3);
                    expect(result?.data[0].keys).toEqual([2]);
                    expect(result?.data[1].keys).toEqual([3]);
                    expect(result?.data[2].keys).toEqual([4]);
                });

                it('should extract the configured values', () => {
                    const result = dataModel.processData(data);

                    expect(result?.type).toEqual('ungrouped');
                    expect(result?.data.length).toEqual(3);
                    expect(result?.data[0].values).toEqual([0, 7, 1]);
                    expect(result?.data[1].values).toEqual([14.285714285714285, 7, 2]);
                    expect(result?.data[2].values).toEqual([100, 16, 3]);
                });

                it('should calculate the domains', () => {
                    const result = dataModel.processData(data);

                    expect(result?.type).toEqual('ungrouped');
                    expect(result?.domain.keys).toEqual([[2, 4]]);
                    expect(result?.domain.values).toEqual([
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
                const data = [
                    { kp: 'Q1', vp1: 5, vp2: 7 },
                    { kp: 'Q1', vp1: 1, vp2: 2 },
                    { kp: 'Q2', vp1: 6, vp2: 9 },
                    { kp: 'Q2', vp1: 6, vp2: 9 },
                ];

                it('should extract the configured keys', () => {
                    const result = dataModel.processData(data);

                    expect(result?.type).toEqual('ungrouped');
                    expect(result?.data.length).toEqual(4);
                    expect(result?.data[0].keys).toEqual(['Q1']);
                    expect(result?.data[1].keys).toEqual(['Q1']);
                    expect(result?.data[2].keys).toEqual(['Q2']);
                    expect(result?.data[3].keys).toEqual(['Q2']);
                });

                it('should extract the configured values', () => {
                    const result = dataModel.processData(data);

                    expect(result?.type).toEqual('ungrouped');
                    expect(result?.data.length).toEqual(4);
                    expect(result?.data[0].values).toEqual([5, 7]);
                    expect(result?.data[1].values).toEqual([1, 2]);
                    expect(result?.data[2].values).toEqual([6, 9]);
                    expect(result?.data[3].values).toEqual([6, 9]);
                });
            });
        });
    });

    describe('grouped processing - grouped example', () => {
        it('should generated the expected results', () => {
            const data = examples.GROUPED_BAR_CHART_EXAMPLE.data ?? [];
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
            const data = [
                { kp: 'Q1', vp1: 5, vp2: 7 },
                { kp: 'Q1', vp1: 1, vp2: 2 },
                { kp: 'Q2', vp1: 6, vp2: 9 },
                { kp: 'Q2', vp1: 6, vp2: 9 },
            ];

            it('should extract the configured keys', () => {
                const result = dataModel.processData(data);

                expect(result?.type).toEqual('grouped');
                expect(result?.data.length).toEqual(2);
                expect(result?.data[0].keys).toEqual(['Q1']);
                expect(result?.data[1].keys).toEqual(['Q2']);
            });

            it('should extract the configured values', () => {
                const result = dataModel.processData(data);

                expect(result?.type).toEqual('grouped');
                expect(result?.data.length).toEqual(2);
                expect(result?.data[0].values).toEqual([
                    [5, 7],
                    [1, 2],
                ]);
                expect(result?.data[1].values).toEqual([
                    [6, 9],
                    [6, 9],
                ]);
            });

            it('should calculate the domains', () => {
                const result = dataModel.processData(data);

                expect(result?.type).toEqual('grouped');
                expect(result?.domain.keys).toEqual([['Q1', 'Q2']]);
                expect(result?.domain.values).toEqual([
                    [1, 6],
                    [2, 9],
                ]);
            });

            it('should not include sums', () => {
                const result = dataModel.processData(data);

                expect(result?.data.filter((g) => g.aggValues != null)).toEqual([]);
                expect(result?.domain.aggValues).toBeUndefined();
            });

            it('should only sum per data-item', () => {
                const dataModel2 = new DataModel<any, any, true>({
                    props: [categoryKey('kp'), value('vp1', 'all'), value('vp2', 'all'), sum('all')],
                    groupByKeys: true,
                });
                const data2 = [
                    { kp: 'Q1', vp1: 5, vp2: 7 },
                    { kp: 'Q1', vp1: 1, vp2: 2 },
                    { kp: 'Q2', vp1: 6, vp2: 9 },
                    { kp: 'Q2', vp1: 6, vp2: 9 },
                ];

                const result = dataModel2.processData(data2);

                expect(result?.domain.aggValues).toEqual([[0, 15]]);
                expect(result?.data[0].aggValues).toEqual([[0, 12]]);
                expect(result?.data[1].aggValues).toEqual([[0, 15]]);
            });
        });
    });

    describe('grouped processing - category objects', () => {
        describe('property tests', () => {
            const dataModel = new DataModel<any, any, true>({
                props: [categoryKey('kp'), value('vp1'), value('vp2')],
                groupByKeys: true,
            });
            const data = [
                { kp: { id: 1, q: 'Q1' }, vp1: 5, vp2: 7 },
                { kp: { id: 2, q: 'Q1' }, vp1: 1, vp2: 2 },
                { kp: { id: 3, q: 'Q2' }, vp1: 6, vp2: 9 },
                { kp: { id: 4, q: 'Q2' }, vp1: 6, vp2: 9 },
            ];

            it('should extract the configured keys', () => {
                const result = dataModel.processData(data);

                expect(result?.type).toEqual('grouped');
                expect(result?.data.length).toEqual(4);
                expect(result?.data.map((d) => d.keys[0])).toEqual(data.map((d) => d.kp));
            });

            it('should extract the configured values', () => {
                const result = dataModel.processData(data);

                expect(result?.type).toEqual('grouped');
                expect(result?.data.length).toEqual(4);
                expect(result?.data.map((d) => d.values)).toEqual(data.map((d) => [[d.vp1, d.vp2]]));
            });

            it('should calculate the domains', () => {
                const result = dataModel.processData(data);

                expect(result?.type).toEqual('grouped');
                expect(result?.domain.keys[0]).toEqual(data.map((d) => d.kp));
                expect(result?.domain.values).toEqual([
                    [1, 6],
                    [2, 9],
                ]);
            });

            it('should not include sums', () => {
                const result = dataModel.processData(data);

                expect(result?.data.filter((g) => g.aggValues != null)).toEqual([]);
                expect(result?.domain.aggValues).toBeUndefined();
            });
        });
    });

    describe('grouped processing - time-series example', () => {
        describe('property tests', () => {
            const dataModel = new DataModel<any, any, true>({
                props: [{ ...rangeKey('kp'), validation: (v) => v instanceof Date }, value('vp1'), value('vp2')],
                groupByKeys: true,
            });
            const data = [
                { kp: new Date('2023-01-01T00:00:00.000Z'), vp1: 5, vp2: 7 },
                { kp: new Date('2023-01-02T00:00:00.000Z'), vp1: 1, vp2: 2 },
                { kp: new Date('2023-01-03T00:00:00.000Z'), vp1: 6, vp2: 9 },
                { kp: new Date('2023-01-04T00:00:00.000Z'), vp1: 6, vp2: 9 },
                { kp: null, vp1: 6, vp2: 9 },
            ];

            it('should extract the configured keys', () => {
                const result = dataModel.processData(data);

                expect(result?.type).toEqual('grouped');
                expect(result?.data.length).toEqual(4);
                expect(result?.data[0].keys).toEqual([new Date('2023-01-01T00:00:00.000Z')]);
                expect(result?.data[1].keys).toEqual([new Date('2023-01-02T00:00:00.000Z')]);
                expect(result?.data[2].keys).toEqual([new Date('2023-01-03T00:00:00.000Z')]);
                expect(result?.data[3].keys).toEqual([new Date('2023-01-04T00:00:00.000Z')]);
                expectWarning('AG Charts - invalid value of type [object] ignored:', '[null]');
            });

            it('should extract the configured values', () => {
                const result = dataModel.processData(data);

                expect(result?.type).toEqual('grouped');
                expect(result?.data.length).toEqual(4);
                expect(result?.data[0].values).toEqual([[5, 7]]);
                expect(result?.data[1].values).toEqual([[1, 2]]);
                expect(result?.data[2].values).toEqual([[6, 9]]);
                expect(result?.data[3].values).toEqual([[6, 9]]);
                expectWarning('AG Charts - invalid value of type [object] ignored:', '[null]');
            });

            it('should calculate the domains', () => {
                const result = dataModel.processData(data);

                expect(result?.type).toEqual('grouped');
                expect(result?.domain.keys).toEqual([[data[0].kp, data[3].kp]]);
                expect(result?.domain.values).toEqual([
                    [1, 6],
                    [2, 9],
                ]);
                expectWarning('AG Charts - invalid value of type [object] ignored:', '[null]');
            });

            it('should not include sums', () => {
                const result = dataModel.processData(data);

                expect(result?.data.filter((g) => g.aggValues != null)).toEqual([]);
                expect(result?.domain.aggValues).toBeUndefined();
                expectWarning('AG Charts - invalid value of type [object] ignored:', '[null]');
            });

            it('should only sum per data-item', () => {
                const dataModel2 = new DataModel<any, any, true>({
                    props: [categoryKey('kp'), value('vp1', 'all'), value('vp2', 'all'), sum('all')],
                    groupByKeys: true,
                });
                const data2 = [
                    { kp: 'Q1', vp1: 5, vp2: 7 },
                    { kp: 'Q1', vp1: 1, vp2: 2 },
                    { kp: 'Q2', vp1: 6, vp2: 9 },
                    { kp: 'Q2', vp1: 6, vp2: 9 },
                ];

                const result = dataModel2.processData(data2);

                expect(result?.domain.aggValues).toEqual([[0, 15]]);
                expect(result?.data[0].aggValues).toEqual([[0, 12]]);
                expect(result?.data[1].aggValues).toEqual([[0, 15]]);
            });
        });
    });

    describe('grouped processing - stacked example', () => {
        it('should generated the expected results', () => {
            const data = examples.STACKED_BAR_CHART_EXAMPLE.data ?? [];
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
            const data = [
                { kp: 'Q1', vp1: 5, vp2: 7, vp3: 1, vp4: 5 },
                { kp: 'Q1', vp1: 1, vp2: 2, vp3: 2, vp4: 4 },
                { kp: 'Q2', vp1: 6, vp2: 9, vp3: 3, vp4: 3 },
                { kp: 'Q2', vp1: 6, vp2: 9, vp3: 4, vp4: 2 },
            ];

            it('should extract the configured keys', () => {
                const result = dataModel.processData(data);

                expect(result?.type).toEqual('grouped');
                expect(result?.data.length).toEqual(2);
                expect(result?.data[0].keys).toEqual(['Q1']);
                expect(result?.data[1].keys).toEqual(['Q2']);
            });

            it('should extract the configured values', () => {
                const result = dataModel.processData(data);

                expect(result?.type).toEqual('grouped');
                expect(result?.data.length).toEqual(2);
                expect(result?.data[0].values).toEqual([
                    [5, 7, 1, 5],
                    [1, 2, 2, 4],
                ]);
                expect(result?.data[1].values).toEqual([
                    [6, 9, 3, 3],
                    [6, 9, 4, 2],
                ]);
            });

            it('should calculate the domains', () => {
                const result = dataModel.processData(data);

                expect(result?.type).toEqual('grouped');
                expect(result?.domain.keys).toEqual([['Q1', 'Q2']]);
                expect(result?.domain.values).toEqual([
                    [1, 6],
                    [2, 9],
                    [1, 4],
                    [2, 5],
                ]);
            });

            it('should calculate the sums', () => {
                const result = dataModel.processData(data);

                expect(result?.data.map((g) => g.aggValues)).toEqual([
                    [
                        [0, 12],
                        [0, 6],
                    ],
                    [
                        [0, 15],
                        [0, 6],
                    ],
                ]);
                expect(result?.domain.aggValues).toEqual([
                    [0, 15],
                    [0, 6],
                ]);
            });
        });
    });

    describe('grouped processing - stacked with accumulation example', () => {
        it('should generated the expected results', () => {
            const data = examples.STACKED_BAR_CHART_EXAMPLE.data ?? [];
            const dataModel = new DataModel<any, any, true>({
                props: [
                    categoryKey('type'),
                    accumulatedGroupValue('ownerOccupied'),
                    accumulatedGroupValue('privateRented'),
                    accumulatedGroupValue('localAuthority'),
                    accumulatedGroupValue('housingAssociation'),
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
                    accumulatedGroupValue('vp1'),
                    accumulatedGroupValue('vp2'),
                    accumulatedGroupValue('vp3'),
                    accumulatedGroupValue('vp4'),
                ],
                groupByKeys: true,
            });
            const data = [
                { kp: 'Q1', vp1: 5, vp2: 7, vp3: 1, vp4: 5 },
                { kp: 'Q1', vp1: 1, vp2: 2, vp3: 2, vp4: 4 },
                { kp: 'Q2', vp1: 6, vp2: 9, vp3: 3, vp4: 3 },
                { kp: 'Q2', vp1: 6, vp2: 9, vp3: 4, vp4: 2 },
            ];

            it('should extract the configured keys', () => {
                const result = dataModel.processData(data);

                expect(result?.type).toEqual('grouped');
                expect(result?.data.length).toEqual(2);
                expect(result?.data[0].keys).toEqual(['Q1']);
                expect(result?.data[1].keys).toEqual(['Q2']);
            });

            it('should extract the configured accumulated values', () => {
                const result = dataModel.processData(data);

                expect(result?.type).toEqual('grouped');
                expect(result?.data.length).toEqual(2);
                expect(result?.data[0].values).toEqual([
                    [5, 12, 13, 18],
                    [1, 3, 5, 9],
                ]);
                expect(result?.data[1].values).toEqual([
                    [6, 15, 18, 21],
                    [6, 15, 19, 21],
                ]);
            });

            it('should calculate the domains', () => {
                const result = dataModel.processData(data);

                expect(result?.type).toEqual('grouped');
                expect(result?.domain.keys).toEqual([['Q1', 'Q2']]);
                expect(result?.domain.values).toEqual([
                    [1, 6],
                    [3, 15],
                    [5, 19],
                    [9, 21],
                ]);
            });
        });
    });

    describe('grouped processing - stacked and normalised example', () => {
        it('should generated the expected results for 100% stacked columns example', () => {
            const data = examples.ONE_HUNDRED_PERCENT_STACKED_COLUMNS_EXAMPLE.data ?? [];
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
            const data = examples.ONE_HUNDRED_PERCENT_STACKED_AREA_GRAPH_EXAMPLE.data ?? [];
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

            const result = dataModel.processData(data);
            expect(result).toMatchSnapshot({
                time: expect.any(Number),
            });
            expect(result?.domain.aggValues).toEqual([[0, 100]]);
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
            const data = [
                { kp: 'Q1', vp1: 5, vp2: 7, vp3: 1, vp4: 5 },
                { kp: 'Q1', vp1: 1, vp2: 2, vp3: 2, vp4: 4 },
                { kp: 'Q2', vp1: 6, vp2: 9, vp3: 3, vp4: 3 },
                { kp: 'Q2', vp1: 6, vp2: 9, vp3: 4, vp4: 2 },
            ];

            it('should allow normalisation of values', () => {
                const result = dataModel.processData(data);

                expect(result?.data.map((g) => g.aggValues)).toEqual([
                    [
                        [0, 100],
                        [0, 100],
                    ],
                    [
                        [0, 100],
                        [0, 100],
                    ],
                ]);
                expect(result?.domain.aggValues).toEqual([
                    [0, 100],
                    [0, 100],
                ]);

                expect(result?.data.map((g) => g.values)).toEqual([
                    [
                        [41.666666666666664, 58.333333333333336, 16.666666666666668, 83.33333333333333],
                        [33.333333333333336, 66.66666666666667, 33.333333333333336, 66.66666666666667],
                    ],
                    [
                        [40, 60, 50, 50],
                        [40, 60, 66.66666666666667, 33.333333333333336],
                    ],
                ]);
            });
        });
    });

    describe('grouped processing - stacked with accumulation and normalised example', () => {
        it('should generated the expected results', () => {
            const data = examples.STACKED_BAR_CHART_EXAMPLE.data ?? [];
            const dataModel = new DataModel<any, any, true>({
                props: [
                    categoryKey('type'),
                    accumulatedGroupValue('ownerOccupied', 'all'),
                    accumulatedGroupValue('privateRented', 'all'),
                    accumulatedGroupValue('localAuthority', 'all'),
                    accumulatedGroupValue('housingAssociation', 'all'),
                    range('all'),
                    normaliseGroupTo('all', 100, 'range'),
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
                    accumulatedGroupValue('vp1', 'all'),
                    accumulatedGroupValue('vp2', 'all'),
                    accumulatedGroupValue('vp3', 'all'),
                    accumulatedGroupValue('vp4', 'all'),
                    range('all'),
                    normaliseGroupTo('all', 100, 'range'),
                ],
                groupByKeys: true,
            });
            const data = [
                { kp: 'Q1', vp1: 5, vp2: 7, vp3: 1, vp4: 5 },
                { kp: 'Q1', vp1: 1, vp2: 2, vp3: 2, vp4: 4 },
                { kp: 'Q2', vp1: 6, vp2: 9, vp3: 3, vp4: 3 },
                { kp: 'Q2', vp1: 6, vp2: 9, vp3: 4, vp4: 2 },
            ];

            it('should extract the configured keys', () => {
                const result = dataModel.processData(data);

                expect(result?.type).toEqual('grouped');
                expect(result?.data.length).toEqual(2);
                expect(result?.data[0].keys).toEqual(['Q1']);
                expect(result?.data[1].keys).toEqual(['Q2']);
            });

            it('should extract the configured accumulated values', () => {
                const result = dataModel.processData(data);

                expect(result?.type).toEqual('grouped');
                expect(result?.data.length).toEqual(2);
                expect(result?.data[0].values).toEqual([
                    [27.77777777777778, 66.66666666666667, 72.22222222222223, 100],
                    [11.11111111111111, 33.333333333333336, 55.55555555555556, 100],
                ]);
                expect(result?.data[1].values).toEqual([
                    [28.571428571428573, 71.42857142857143, 85.71428571428571, 100],
                    [28.571428571428573, 71.42857142857143, 90.47619047619048, 100],
                ]);
            });

            it('should calculate the domains', () => {
                const result = dataModel.processData(data);

                expect(result?.type).toEqual('grouped');
                expect(result?.domain.keys).toEqual([['Q1', 'Q2']]);
                expect(result?.domain.values).toEqual([
                    [11.11111111111111, 28.571428571428573],
                    [33.333333333333336, 71.42857142857143],
                    [55.55555555555556, 90.47619047619048],
                    [100, 100],
                ]);
            });
        });
    });

    describe('grouped processing - calculated grouping', () => {
        const groupByFn: GroupByFn = () => {
            return (item) => {
                if (item.keys[0] < 100) {
                    return ['<100'];
                } else if (item.keys[0] <= 150) {
                    return ['100 - 150'];
                }
                return ['>150'];
            };
        };

        it('should generated the expected results for simple histogram example with hard-coded buckets', () => {
            const data = examples.SIMPLE_HISTOGRAM_CHART_EXAMPLE.data?.slice(0, 20) ?? [];
            const dataModel = new DataModel<any, any, true>({
                props: [categoryKey('engine-size'), groupCount(), SORT_DOMAIN_GROUPS],
                groupByFn,
            });

            expect(dataModel.processData(data)).toMatchSnapshot({
                time: expect.any(Number),
            });
        });

        it('should generated the expected results for simple histogram example with average bucket calculation', () => {
            const data = examples.XY_HISTOGRAM_WITH_MEAN_EXAMPLE.data?.slice(0, 20) ?? [];
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
            const data = examples.HISTOGRAM_WITH_SPECIFIED_BINS_EXAMPLE.data?.slice(0, 20) ?? [];
            const dataModel = new DataModel<any, any, true>({
                props: [
                    rangeKey('curb-weight'),
                    value('curb-weight', 'weight'),
                    area('weight', groupCount()),
                    SORT_DOMAIN_GROUPS,
                ],
                groupByFn: () => {
                    return (item) => {
                        if (item.keys[0] < 2000) {
                            return [0, 2000];
                        } else if (item.keys[0] <= 3000) {
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
            const data = [...DATA_BROWSER_MARKET_SHARE.map((v) => ({ ...v }))];
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
            data.forEach((datum, idx) => {
                delete (datum as any)[['ie', 'chrome', 'firefox', 'safari'][idx % 4]];
                if (idx % 3 === 0) {
                    (datum as any)[['ie', 'chrome', 'firefox', 'safari'][(idx + 1) % 4]] = 'illegal value';
                }
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
            const data = [
                { kp: 'Q1', /* vp1: 5,*/ vp2: 7, vp3: 1 },
                { kp: 'Q1', vp1: 1, vp2: 'illegal value', vp3: 2 },
                { kp: 'Q2', vp1: 6, vp2: 9 /* vp3: 3 */ },
                { kp: 'Q2', vp1: 6, vp2: 9, vp3: 4 },
            ];

            it('should substitute missing value when configured', () => {
                const result = dataModel.processData(data);

                expect(result?.data[0].values).toEqual([
                    [null, 7, 1],
                    [1, NaN, 2],
                ]);
                expect(result?.data[1].values).toEqual([
                    [6, 9, null],
                    [6, 9, 4],
                ]);
            });
        });
    });

    describe('missing and invalid data processing - multiple scopes', () => {
        it('should generated the expected results', () => {
            const data = [...DATA_BROWSER_MARKET_SHARE.map((v) => ({ ...v }))];
            const DEFAULTS = {
                missingValue: null,
                validation: isFiniteNumber,
            };
            const dataModel = new DataModel<any, any>({
                props: [
                    categoryKey('year'),
                    { ...DEFAULTS, ...scopedValue(undefined, 'ie') },
                    { ...DEFAULTS, ...scopedValue('series-a', 'chrome') },
                    { ...DEFAULTS, ...scopedValue('series-b', 'firefox') },
                    { ...DEFAULTS, ...scopedValue('series-c', 'safari') },
                ],
            });
            data.forEach((datum, idx) => {
                delete (datum as any)[['ie', 'chrome', 'firefox', 'safari'][idx % 4]];
                if (idx % 3 === 0) {
                    (datum as any)[['ie', 'chrome', 'firefox', 'safari'][(idx + 1) % 4]] = 'illegal value';
                }
            });

            expect(dataModel.processData(data)).toMatchSnapshot({
                time: expect.any(Number),
            });
            expectWarnings([
                ['AG Charts - invalid value of type [string] ignored:', '[illegal value]'],
                ['AG Charts - invalid value of type [undefined] ignored:', '[undefined]'],
            ]);
        });

        describe('property tests', () => {
            const validated = { validation: (v: unknown) => typeof v === 'number' };
            const dataModel = new DataModel<any, any, true>({
                props: [
                    categoryKey('kp'),
                    { ...scopedValue(undefined, 'vp1', 'group1'), ...validated },
                    { ...scopedValue('scope-1', 'vp2', 'group1'), ...validated },
                    { ...scopedValue('scope-2', 'vp3', 'group2') },
                    scopedSum(['scope-1'], 'group1'),
                ],
                groupByKeys: true,
            });
            const data = [
                { kp: 'Q1', vp1: 'illegal value', vp2: 7, vp3: 1 },
                { kp: 'Q2', vp1: 1, vp2: 'illegal value', vp3: 2 },
                { kp: 'Q3', vp1: 6, vp2: 9, vp3: 'illegal value' },
                { kp: 'Q4', vp1: 6, vp2: 9, vp3: 4 },
            ];

            it('should record per result data validation status per scope', () => {
                const result = dataModel.processData(data);

                expect(result?.data.length).toEqual(3);
                expect(result?.data[0].validScopes).toEqual(new Set(['scope-2']));
                expect(result?.data[1].validScopes).toBeUndefined();
                expect(result?.data[2].validScopes).toBeUndefined();
                expectWarning('AG Charts - invalid value of type [string] ignored:', '[illegal value]');
            });

            it('should handle scope validations distinctly for values', () => {
                const result = dataModel.processData(data);

                expect(result?.data.length).toEqual(3);
                expect(result?.data[0].values).toEqual([[1, undefined, 2]]);
                expect(result?.data[1].values).toEqual([[6, 9, 'illegal value']]);
                expect(result?.data[2].values).toEqual([[6, 9, 4]]);
                expectWarning('AG Charts - invalid value of type [string] ignored:', '[illegal value]');
            });
        });
    });

    describe('empty data set processing', () => {
        it('should generated the expected results', () => {
            const dataModel = new DataModel<any, any>({
                props: [categoryKey('year'), value('ie'), value('chrome'), value('firefox'), value('safari')],
            });

            expect(dataModel.processData([])).toMatchSnapshot({
                time: expect.any(Number),
            });
        });

        describe('property tests', () => {
            const dataModel = new DataModel<any, any>({
                props: [categoryKey('year'), value('ie'), value('chrome'), value('firefox'), value('safari')],
            });

            it('should not generate data extracts', () => {
                const result = dataModel.processData([]);

                expect(result?.data).toEqual([]);
            });

            it('should not generate values for domains', () => {
                const result = dataModel.processData([]);

                expect(result?.domain.keys).toEqual([[]]);
                expect(result?.domain.values).toEqual([[], [], [], []]);
            });
        });
    });

    describe('repeated property processing', () => {
        it('should generated the expected results', () => {
            const data = [...(examples.PIE_IN_A_DONUT.series?.[0]?.data?.map((v) => ({ ...v })) ?? [])];
            const dataModel = new DataModel<any, any>({
                props: [
                    accumulatedPropertyValue('share', 'angleGroup', 'angle'),
                    rangedValueProperty({ id: 'test' }, 'share', {
                        id: 'radius',
                        min: 0.05,
                        max: 0.7,
                    }),
                    normalisePropertyTo({ id: 'angle' }, [0, 1]),
                ],
            });

            expect(dataModel.processData(data)).toMatchSnapshot({
                time: expect.any(Number),
            });
        });
    });

    describe('multiple data sources', () => {
        it('should generate the expected results', () => {
            const dataModel = new DataModel<any, any>({
                props: [
                    {
                        scopes: ['test1', 'test2'],
                        property: 'year',
                        type: 'key' as const,
                        valueType: 'category' as const,
                        useScopedValues: true,
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

            const processedData = dataModel.processData(data2, [
                { id: 'test1', data: data1 },
                { id: 'test2', data: data2 },
            ]);

            expect(processedData!.data[0].datum.firefox).toEqual(data2[0].firefox);
            expect(processedData).toMatchSnapshot({
                time: expect.any(Number),
            });
        });
    });
});
