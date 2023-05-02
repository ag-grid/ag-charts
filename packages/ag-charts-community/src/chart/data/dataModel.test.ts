import { expect, it, describe } from '@jest/globals';
import { isNumber } from '../../util/value';
import { DATA_BROWSER_MARKET_SHARE } from '../test/data';

import * as examples from '../test/examples';

import { AGG_VALUES_EXTENT, DataModel, SMALLEST_KEY_INTERVAL, SORT_DOMAIN_GROUPS } from './dataModel';
import { groupCount, sum } from './aggregateFunctions';

describe('DataModel', () => {
    describe('ungrouped processing', () => {
        it('should generated the expected results', () => {
            const data = examples.SIMPLE_LINE_CHART_EXAMPLE.data!;
            const dataModel = new DataModel<any, any>({
                props: [
                    { property: 'date', type: 'key', valueType: 'range' },
                    { property: 'petrol', type: 'value', valueType: 'range' },
                    { property: 'diesel', type: 'value', valueType: 'range' },
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
                        { property: 'kp', type: 'key', valueType: 'range' },
                        { property: 'vp1', type: 'value', valueType: 'range' },
                        { property: 'vp2', type: 'value', valueType: 'range' },
                        SMALLEST_KEY_INTERVAL,
                    ],
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

                    expect(result?.reduced?.[SMALLEST_KEY_INTERVAL.property]).toEqual(1);
                });
            });

            describe('category data', () => {
                const dataModel = new DataModel<any, any, false>({
                    props: [
                        { property: 'kp', type: 'key', valueType: 'category' },
                        { property: 'vp1', type: 'value', valueType: 'range' },
                        { property: 'vp2', type: 'value', valueType: 'range' },
                    ],
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
            const data = examples.GROUPED_BAR_CHART_EXAMPLE.data!;
            const dataModel = new DataModel<any, any, true>({
                props: [
                    { property: 'type', type: 'key', valueType: 'category' },
                    { property: 'total', type: 'value', valueType: 'range' },
                    { property: 'regular', type: 'value', valueType: 'range' },
                    sum(['total', 'regular']),
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
                    { property: 'kp', type: 'key', valueType: 'category' },
                    { property: 'vp1', type: 'value', valueType: 'range' },
                    { property: 'vp2', type: 'value', valueType: 'range' },
                ],
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
                const dataModel = new DataModel<any, any, true>({
                    props: [
                        { property: 'kp', type: 'key', valueType: 'category' },
                        { property: 'vp1', type: 'value', valueType: 'range' },
                        { property: 'vp2', type: 'value', valueType: 'range' },
                        sum(['vp1', 'vp2']),
                    ],
                    groupByKeys: true,
                });
                const data = [
                    { kp: 'Q1', vp1: 5, vp2: 7 },
                    { kp: 'Q1', vp1: 1, vp2: 2 },
                    { kp: 'Q2', vp1: 6, vp2: 9 },
                    { kp: 'Q2', vp1: 6, vp2: 9 },
                ];

                const result = dataModel.processData(data);

                expect(result?.domain.aggValues).toEqual([[0, 15]]);
                expect(result?.data[0].aggValues).toEqual([[0, 12]]);
                expect(result?.data[1].aggValues).toEqual([[0, 15]]);
            });
        });
    });

    describe('grouped processing - category objects', () => {
        describe('property tests', () => {
            const dataModel = new DataModel<any, any, true>({
                props: [
                    { property: 'kp', type: 'key', valueType: 'category' },
                    { property: 'vp1', type: 'value', valueType: 'range' },
                    { property: 'vp2', type: 'value', valueType: 'range' },
                ],
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
                props: [
                    { property: 'kp', type: 'key', valueType: 'range', validation: (v) => v instanceof Date },
                    { property: 'vp1', type: 'value', valueType: 'range' },
                    { property: 'vp2', type: 'value', valueType: 'range' },
                ],
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
            });

            it('should extract the configured values', () => {
                const result = dataModel.processData(data);

                expect(result?.type).toEqual('grouped');
                expect(result?.data.length).toEqual(4);
                expect(result?.data[0].values).toEqual([[5, 7]]);
                expect(result?.data[1].values).toEqual([[1, 2]]);
                expect(result?.data[2].values).toEqual([[6, 9]]);
                expect(result?.data[3].values).toEqual([[6, 9]]);
            });

            it('should calculate the domains', () => {
                const result = dataModel.processData(data);

                expect(result?.type).toEqual('grouped');
                expect(result?.domain.keys).toEqual([[data[0].kp, data[3].kp]]);
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
                const dataModel = new DataModel<any, any, true>({
                    props: [
                        { property: 'kp', type: 'key', valueType: 'category' },
                        { property: 'vp1', type: 'value', valueType: 'range' },
                        { property: 'vp2', type: 'value', valueType: 'range' },
                        sum(['vp1', 'vp2']),
                    ],
                    groupByKeys: true,
                });
                const data = [
                    { kp: 'Q1', vp1: 5, vp2: 7 },
                    { kp: 'Q1', vp1: 1, vp2: 2 },
                    { kp: 'Q2', vp1: 6, vp2: 9 },
                    { kp: 'Q2', vp1: 6, vp2: 9 },
                ];

                const result = dataModel.processData(data);

                expect(result?.domain.aggValues).toEqual([[0, 15]]);
                expect(result?.data[0].aggValues).toEqual([[0, 12]]);
                expect(result?.data[1].aggValues).toEqual([[0, 15]]);
            });
        });
    });

    describe('grouped processing - stacked example', () => {
        it('should generated the expected results', () => {
            const data = examples.STACKED_BAR_CHART_EXAMPLE.data!;
            const dataModel = new DataModel<any, any, true>({
                props: [
                    { property: 'type', type: 'key', valueType: 'category' },
                    { property: 'ownerOccupied', type: 'value', valueType: 'range' },
                    { property: 'privateRented', type: 'value', valueType: 'range' },
                    { property: 'localAuthority', type: 'value', valueType: 'range' },
                    { property: 'housingAssociation', type: 'value', valueType: 'range' },
                    sum(['ownerOccupied', 'privateRented', 'localAuthority', 'housingAssociation']),
                    AGG_VALUES_EXTENT,
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
                    { property: 'kp', type: 'key', valueType: 'category' },
                    { property: 'vp1', type: 'value', valueType: 'range' },
                    { property: 'vp2', type: 'value', valueType: 'range' },
                    { property: 'vp3', type: 'value', valueType: 'range' },
                    { property: 'vp4', type: 'value', valueType: 'range' },
                    sum(['vp1', 'vp2']),
                    sum(['vp3', 'vp4']),
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

    describe('grouped processing - stacked and normalised example', () => {
        it('should generated the expected results for 100% stacked columns example', () => {
            const data = examples.ONE_HUNDRED_PERCENT_STACKED_COLUMNS_EXAMPLE.data!;
            const dataModel = new DataModel<any, any, true>({
                props: [
                    { property: 'type', type: 'key', valueType: 'category' },
                    { property: 'white', type: 'value', valueType: 'range' },
                    { property: 'mixed', type: 'value', valueType: 'range' },
                    { property: 'asian', type: 'value', valueType: 'range' },
                    { property: 'black', type: 'value', valueType: 'range' },
                    { property: 'chinese', type: 'value', valueType: 'range' },
                    { property: 'other', type: 'value', valueType: 'range' },
                    sum(['white', 'mixed', 'asian', 'black', 'chinese', 'other']),
                    AGG_VALUES_EXTENT,
                ],
                groupByKeys: true,
                normaliseTo: 100,
            });

            expect(dataModel.processData(data)).toMatchSnapshot({
                time: expect.any(Number),
            });
        });

        it('should generated the expected results for 100% stacked area example', () => {
            const data = examples.ONE_HUNDRED_PERCENT_STACKED_AREA_GRAPH_EXAMPLE.data!;
            const dataModel = new DataModel<any, any, true>({
                props: [
                    { property: 'month', type: 'key', valueType: 'category' },
                    { property: 'petroleum', type: 'value', valueType: 'range' },
                    { property: 'naturalGas', type: 'value', valueType: 'range' },
                    { property: 'bioenergyWaste', type: 'value', valueType: 'range' },
                    { property: 'nuclear', type: 'value', valueType: 'range' },
                    { property: 'windSolarHydro', type: 'value', valueType: 'range' },
                    { property: 'imported', type: 'value', valueType: 'range' },
                    sum(['petroleum', 'naturalGas', 'bioenergyWaste', 'nuclear', 'windSolarHydro', 'imported']),
                    AGG_VALUES_EXTENT,
                ],
                groupByKeys: true,
                normaliseTo: 100,
            });

            const result = dataModel.processData(data);
            expect(result).toMatchSnapshot({
                time: expect.any(Number),
            });
            expect(result?.domain.aggValues).toEqual([[0, 100]]);
            expect(result?.reduced?.[AGG_VALUES_EXTENT.property]).toEqual([0, 100]);
        });

        describe('property tests', () => {
            const dataModel = new DataModel<any, any, true>({
                props: [
                    { property: 'kp', type: 'key', valueType: 'category' },
                    { property: 'vp1', type: 'value', valueType: 'range' },
                    { property: 'vp2', type: 'value', valueType: 'range' },
                    { property: 'vp3', type: 'value', valueType: 'range' },
                    { property: 'vp4', type: 'value', valueType: 'range' },
                    sum(['vp1', 'vp2']),
                    sum(['vp3', 'vp4']),
                ],
                groupByKeys: true,
                normaliseTo: 100,
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
                        [8.333333333333334, 16.666666666666668, 33.333333333333336, 66.66666666666667],
                    ],
                    [
                        [40, 60, 50, 50],
                        [40, 60, 66.66666666666667, 33.333333333333336],
                    ],
                ]);
            });
        });
    });

    describe('grouped processing - calculated grouping', () => {
        it('should generated the expected results for simple histogram example with hard-coded buckets', () => {
            const data = examples.SIMPLE_HISTOGRAM_CHART_EXAMPLE.data!;
            const dataModel = new DataModel<any, any, true>({
                props: [
                    { property: 'engine-size', type: 'key', valueType: 'category' },
                    groupCount(),
                    SORT_DOMAIN_GROUPS,
                ],
                groupByFn: () => {
                    return (item) => {
                        if (item.keys[0] < 100) {
                            return ['<100'];
                        } else if (item.keys[0] <= 150) {
                            return ['100 - 150'];
                        }
                        return ['>150'];
                    };
                },
                normaliseTo: 100,
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
                validation: isNumber,
            };
            const dataModel = new DataModel<any, any>({
                props: [
                    { property: 'year', type: 'key', valueType: 'category' },
                    { ...DEFAULTS, property: 'ie', type: 'value', valueType: 'range' },
                    { ...DEFAULTS, property: 'chrome', type: 'value', valueType: 'range' },
                    { ...DEFAULTS, property: 'firefox', type: 'value', valueType: 'range' },
                    { ...DEFAULTS, property: 'safari', type: 'value', valueType: 'range' },
                ],
            });
            data.forEach((datum, idx) => {
                delete datum[['ie', 'chrome', 'firefox', 'safari'][idx % 4]];
                if (idx % 3 === 0) {
                    datum[['ie', 'chrome', 'firefox', 'safari'][(idx + 1) % 4]] = 'illegal value';
                }
            });

            expect(dataModel.processData(data)).toMatchSnapshot({
                time: expect.any(Number),
            });
        });

        describe('property tests', () => {
            const defaults = { missingValue: null, invalidValue: NaN };
            const validated = { ...defaults, validation: (v) => typeof v === 'number' };
            const dataModel = new DataModel<any, any, true>({
                props: [
                    { property: 'kp', type: 'key', valueType: 'category' },
                    { property: 'vp1', type: 'value', valueType: 'range', ...validated },
                    { property: 'vp2', type: 'value', valueType: 'range', ...validated },
                    { property: 'vp3', type: 'value', valueType: 'range', ...defaults },
                    sum(['vp1', 'vp2']),
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

    describe('empty data set processing', () => {
        it('should generated the expected results', () => {
            const dataModel = new DataModel<any, any>({
                props: [
                    { property: 'year', type: 'key', valueType: 'category' },
                    { property: 'ie', type: 'value', valueType: 'range' },
                    { property: 'chrome', type: 'value', valueType: 'range' },
                    { property: 'firefox', type: 'value', valueType: 'range' },
                    { property: 'safari', type: 'value', valueType: 'range' },
                ],
            });

            expect(dataModel.processData([])).toMatchSnapshot({
                time: expect.any(Number),
            });
        });

        describe('property tests', () => {
            const dataModel = new DataModel<any, any>({
                props: [
                    { property: 'year', type: 'key', valueType: 'category' },
                    { property: 'ie', type: 'value', valueType: 'range' },
                    { property: 'chrome', type: 'value', valueType: 'range' },
                    { property: 'firefox', type: 'value', valueType: 'range' },
                    { property: 'safari', type: 'value', valueType: 'range' },
                ],
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
});
