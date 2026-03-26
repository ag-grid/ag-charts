import { describe, expect, it } from '@jest/globals';

import { isFiniteNumber } from 'ag-charts-core';

import { DATA_BROWSER_MARKET_SHARE } from '../../../test/data';
import { expectWarningsCalls, setupMockConsole } from '../../../test/utils';
import type { DataModelOptions } from '../../dataModel';
import { DataModel } from '../../dataModel';
import { DataSet } from '../../dataSet';
import { basicDataSet, categoryKey, extractGroupValues, scopedSum, scopedValue, sum, value } from '../test/testUtils';

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

describe('DataExtractor', () => {
    setupMockConsole();

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
                version: expect.any(Number),
                optimizations: expect.any(Object),
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
                version: expect.any(Number),
                optimizations: expect.any(Object),
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
                version: expect.any(Number),
                optimizations: expect.any(Object),
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
});
