import { describe, expect, it } from '@jest/globals';

import { expectWarningsCalls, setupMockConsole } from '../../../test/utils';
import type { GroupedData } from '../../dataModel';
import { DataModel } from '../../dataModel';
import { DataSet } from '../../dataSet';
import { accumulateGroup as actualAccumulateGroup } from '../../processors';
import {
    basicDataSet,
    categoryKey,
    rangeKey,
    scopedValue,
    sum,
    value,
    verifyReprocessMatchesBaseline,
} from '../test/testUtils';

// Component-specific helper for banding configuration
function bandingConfig(minDataSizeForBanding: number, targetBandCount: number) {
    return {
        minDataSizeForBanding,
        targetBandCount,
        enableBanding: true,
    };
}

describe('DataModel', () => {
    setupMockConsole();

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
                verifyReprocessMatchesBaseline(dataModel, reprocessed, sources);

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
                verifyReprocessMatchesBaseline(dataModel, reprocessed, sources);

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
                verifyReprocessMatchesBaseline(dataModel, reprocessed, sources);

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
                verifyReprocessMatchesBaseline(dataModel, reprocessed, sources);

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
                verifyReprocessMatchesBaseline(dataModel, reprocessed, sources);

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
                verifyReprocessMatchesBaseline(dataModel, reprocessed, sources);

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
                verifyReprocessMatchesBaseline(dataModel, reprocessed, sources);

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
                verifyReprocessMatchesBaseline(dataModel, reprocessed, sources);

                // Should return same reference (no changes)
                expect(reprocessed).toBe(processedData);

                // Diff structure exists but is empty (no scopes changed)
                expect(reprocessed.reduced?.diff).toBeDefined();
                expect(Object.keys(reprocessed.reduced!.diff!)).toEqual([]);
            });

            it('should capture removed keys when rows are deleted', () => {
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

                // Opt-in to diff tracking
                processedData!.reduced = { diff: {} };

                // Remove first row
                dataSet.addTransaction({ remove: [initialData[0]] });

                const reprocessed = dataModel.reprocessData(processedData!);
                verifyReprocessMatchesBaseline(dataModel, reprocessed, sources);

                // Data adjusted
                expect(reprocessed.keys[0].get('test')).toEqual([2, 3]);
                expect(reprocessed.columns).toEqual([[20, 30]]);

                // Removed keys captured
                expect(reprocessed.reduced?.diff?.test.removed.size).toBe(1);
                expect(reprocessed.reduced?.diff?.test.removed.has('1')).toBe(true);
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
                verifyReprocessMatchesBaseline(dataModel, reprocessed, sources);

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
                verifyReprocessMatchesBaseline(dataModel, reprocessed, sources);

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
                verifyReprocessMatchesBaseline(dataModel, reprocessed, sources);

                // The new invalid value should be tracked
                const invalidDataArray = reprocessed.invalidData?.get('test');
                expect(invalidDataArray).toBeDefined();
                expect(invalidDataArray![1]).toBe(true); // Second item (from initial)
                expect(invalidDataArray![2]).toBe(true); // Third item (appended)
                expect(reprocessed.partialValidDataCount).toBeGreaterThan(0);

                // Verify domains
                // Key domain includes all valid keys (1, 2, 3), even though items with keys 2 and 3 have invalid y values
                // This matches processData() behavior where each property domain is independent
                expect(reprocessed.domain.keys).toEqual([[1, 3]]);
                // Value domain only includes valid values (only item 0 with y=10 is fully valid)
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
                verifyReprocessMatchesBaseline(dataModel, reprocessed, sources);

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
                verifyReprocessMatchesBaseline(dataModel, reprocessed, sources);

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

                // Remove middle item
                dataSet.addTransaction({ remove: [initialData[1]] });

                const reprocessed = dataModel.reprocessData(processedData!) as GroupedData<any>;
                verifyReprocessMatchesBaseline(dataModel, reprocessed, sources);

                // Verify groups updated
                expect(reprocessed.groups.length).toBe(2);
                expect(reprocessed.groups[0].keys).toEqual([1]);
                expect(reprocessed.groups[1].keys).toEqual([3]);

                // Verify domain.groups
                expect(reprocessed.domain.groups).toEqual([[1], [3]]);

                // Verify columns
                expect(reprocessed.columns).toEqual([[10, 30]]);
            });

            it('should handle multiple items per group', () => {
                const dataModel = new DataModel<any, any, true>({
                    props: [categoryKey('category'), value('value')],
                    groupByKeys: true,
                });

                const initialData = [
                    { category: 'A', value: 10 },
                    { category: 'A', value: 20 },
                    { category: 'B', value: 30 },
                ];
                const dataSet = new DataSet(initialData);
                const sources = basicDataSet(initialData).set('test', dataSet);

                const processedData = dataModel.processData(sources);

                // Append to existing group A
                dataSet.addTransaction({ append: [{ category: 'A', value: 40 }] });

                const reprocessed = dataModel.reprocessData(processedData!) as GroupedData<any>;
                verifyReprocessMatchesBaseline(dataModel, reprocessed, sources);

                // Verify groups structure
                // When groupByKeys=true with single scope, each datum gets its own group
                expect(reprocessed.groups.length).toBe(4);
                expect(reprocessed.groups[0].keys).toEqual(['A']);
                expect(reprocessed.groups[0].datumIndices).toEqual([[0]]); // First item, one value column
                expect(reprocessed.groups[1].keys).toEqual(['A']);
                expect(reprocessed.groups[1].datumIndices).toEqual([[0]]); // Second item
                expect(reprocessed.groups[2].keys).toEqual(['B']);
                expect(reprocessed.groups[2].datumIndices).toEqual([[0]]); // Third item
                expect(reprocessed.groups[3].keys).toEqual(['A']);
                expect(reprocessed.groups[3].datumIndices).toEqual([[0]]); // Fourth item (appended)

                // Verify columns
                expect(reprocessed.columns).toEqual([[10, 20, 30, 40]]);
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
        });

        describe('banding with multiple scopes', () => {
            it('should handle banding when appending to large dataset (50+ items)', () => {
                const dataModel = new DataModel<any, any>({
                    props: [
                        { ...rangeKey('x'), scopes: ['seriesA', 'seriesB'] },
                        scopedValue(['seriesA', 'seriesB'], 'y1', 'seriesA', 'value'),
                        scopedValue(['seriesB'], 'y2', 'seriesB', 'value'),
                    ],
                    domainBandingConfig: bandingConfig(50, 5),
                });

                // Create large initial dataset (50+ items to trigger banding)
                const initialData = Array.from({ length: 100 }, (_, i) => ({
                    x: i,
                    y1: i * 10,
                    y2: i * 5,
                }));
                const dataSet = new DataSet(initialData);
                const sources = new Map([
                    ['seriesA', dataSet],
                    ['seriesB', dataSet],
                ]);

                const processedData = dataModel.processData(sources);

                // Remove first item and append new item
                dataSet.addTransaction({
                    remove: [initialData[0]],
                    append: [{ x: 100, y1: 1000, y2: 500 }],
                });

                const reprocessed = dataModel.reprocessData(processedData!);
                verifyReprocessMatchesBaseline(dataModel, reprocessed, sources);

                // Verify banding metadata is present after reprocessing
                expect(reprocessed.optimizations?.domainBanding).toBeDefined();

                // Verify data ranges
                expect(reprocessed.keys[0].get('seriesA')).toContain(1);
                expect(reprocessed.keys[0].get('seriesA')).toContain(100);
                expect(reprocessed.keys[0].get('seriesB')).toContain(1);
                expect(reprocessed.keys[0].get('seriesB')).toContain(100);

                // Verify domains were updated correctly
                expect(reprocessed.domain.keys).toEqual([[1, 100]]);

                // seriesA has values from y1 (10 to 1000)
                // seriesB has values from both y1 and y2 (but y2 only in seriesB scope)
                expect(reprocessed.domain.values[0]).toEqual([10, 1000]); // seriesA value range
                expect(reprocessed.domain.values[1]).toEqual([5, 500]); // seriesB value range

                // Verify data count
                expect(reprocessed.input.count).toBe(100);
            });

            it('should handle stacking on grouped data when scrolling through large dataset', () => {
                const dataModel = new DataModel<any, any, true>({
                    props: [
                        categoryKey('category', ['seriesA', 'seriesB']),
                        scopedValue(['seriesA', 'seriesB'], 'valueA', 'seriesA', 'value'),
                        scopedValue(['seriesB'], 'valueB', 'seriesB', 'value'),
                    ],
                    groupByKeys: true,
                    domainBandingConfig: bandingConfig(50, 5),
                });

                // Create large initial dataset with categories Cat0...Cat99
                const initialData = Array.from({ length: 100 }, (_, i) => ({
                    category: `Cat${i}`,
                    valueA: i * 10,
                    valueB: i * 5,
                }));
                const dataSet = new DataSet(initialData);
                const sources = new Map([
                    ['seriesA', dataSet],
                    ['seriesB', dataSet],
                ]);

                const processedData = dataModel.processData(sources);

                // Verify initial state
                expect(processedData?.groups?.length).toBe(100);

                // Remove first item, append new one (simulate scrolling)
                dataSet.addTransaction({
                    remove: [initialData[0]],
                    append: [{ category: 'Cat100', valueA: 1000, valueB: 500 }],
                });

                const reprocessed = dataModel.reprocessData(processedData!) as GroupedData<any>;
                verifyReprocessMatchesBaseline(dataModel, reprocessed, sources);

                // Verify groups count is still 100 (removed one, added one)
                expect(reprocessed.groups.length).toBe(100);

                // Verify columns
                const columns = reprocessed.columns;
                expect(columns.length).toBe(2);
                expect(columns[0].length).toBe(100);
                expect(columns[1].length).toBe(100);

                // Verify first item is now Cat1 (Cat0 was removed)
                expect(reprocessed.domain.groups![0]).toEqual(['Cat1']);

                // Verify last item is Cat100 (newly appended)
                expect(reprocessed.domain.groups![99]).toEqual(['Cat100']);

                // Verify values on the last item
                // Without explicit stacking processor, values are not stacked
                expect(columns[0][99]).toBe(1000); // seriesA: valueA
                expect(columns[1][99]).toBe(500); // seriesB: valueB (not stacked)

                // Verify domain reflects correct range
                expect(reprocessed.domain.values[0]).toEqual([10, 1000]); // seriesA range (valueA)
                expect(reprocessed.domain.values[1]).toEqual([5, 500]); // seriesB range (valueB)
            });
        });
    });

    describe('multiple scopes sharing same DataSet', () => {
        it('should not over-apply band updates when multiple scopes share same DataSet', () => {
            // This test verifies that updateBandsForChanges() deduplicates change descriptions
            // to avoid applying band insertions/removals multiple times
            const dataModel = new DataModel<any, any, true>({
                props: [
                    categoryKey('category', ['scope1', 'scope2']),
                    scopedValue('scope1', 'value1'),
                    scopedValue('scope2', 'value2'),
                ],
                groupByKeys: true,
                domainBandingConfig: bandingConfig(50, 5),
            });

            // Create initial data with 100 items (above threshold to enable banding)
            const initialData = Array.from({ length: 100 }, (_, i) => ({
                category: `Cat${i}`,
                value1: i * 10,
                value2: i * 100,
            }));
            const dataSet = new DataSet(initialData);

            // Multiple scopes, same DataSet
            const sources = new Map([
                ['scope1', dataSet],
                ['scope2', dataSet],
            ]);

            const processedData = dataModel.processData(sources);
            expect(dataModel.isReprocessingSupported(processedData!)).toBe(true);

            // Append new data
            dataSet.addTransaction({
                append: [{ category: 'Cat100', value1: 1000, value2: 10000 }],
            });

            const reprocessed1 = dataModel.reprocessData(processedData!);
            verifyReprocessMatchesBaseline(dataModel, reprocessed1, sources);

            // Verify the domain is correct (would be wrong if bands were updated twice)
            expect(reprocessed1.domain.values[0]).toEqual([0, 1000]);
            expect(reprocessed1.domain.values[1]).toEqual([0, 10000]);
            expect(reprocessed1.columns[0][100]).toBe(1000);
            expect(reprocessed1.columns[1][100]).toBe(10000);

            // First reprocess: all bands dirty (banding initialized)
            expect(reprocessed1.optimizations?.domainBanding).toBeDefined();

            // Do a SECOND append to test the optimization
            dataSet.addTransaction({
                append: [{ category: 'Cat101', value1: 1010, value2: 10100 }],
            });

            const reprocessed2 = dataModel.reprocessData(reprocessed1);
            verifyReprocessMatchesBaseline(dataModel, reprocessed2, sources);

            // Verify the domain is correct
            expect(reprocessed2.domain.values[0]).toEqual([0, 1010]);
            expect(reprocessed2.domain.values[1]).toEqual([0, 10100]);
            expect(reprocessed2.columns[0][101]).toBe(1010);
            expect(reprocessed2.columns[1][101]).toBe(10100);

            // Verify optimization metadata shows banding was used efficiently on SECOND reprocess
            const metadata = reprocessed2.optimizations;
            expect(metadata?.domainBanding).toBeDefined();

            const valueDefStats0 = metadata!.domainBanding!.valueDefs[0]?.stats;
            const valueDefStats1 = metadata!.domainBanding!.valueDefs[1]?.stats;

            expect(valueDefStats0).toBeDefined();
            expect(valueDefStats1).toBeDefined();

            // Both value defs should have band stats
            expect(valueDefStats0!.totalBands).toBeGreaterThan(0);
            expect(valueDefStats1!.totalBands).toBeGreaterThan(0);

            // Not all bands should be dirty (only affected ones)
            expect(valueDefStats0!.dirtyBands).toBeLessThan(valueDefStats0!.totalBands);
            expect(valueDefStats1!.dirtyBands).toBeLessThan(valueDefStats1!.totalBands);
        });

        it('should not double-apply group processors when multiple scopes share same DataSet', () => {
            // This test verifies that reprocessGroupProcessors() deduplicates change descriptions
            // to avoid applying group processor adjustments multiple times (which would double stacking values)
            const dataModel = new DataModel<any, any, true>({
                props: [
                    categoryKey('category', ['scope1', 'scope2']),
                    scopedValue('scope1', 'seriesA', 'stack'),
                    scopedValue('scope2', 'seriesB', 'stack'),
                    actualAccumulateGroup('stack', 'normal'),
                ],
                groupByKeys: true,
            });

            const initialData = [
                { category: 'A', seriesA: 100, seriesB: 50 },
                { category: 'B', seriesA: 150, seriesB: 75 },
            ];
            const dataSet = new DataSet(initialData);

            // Multiple scopes, same DataSet
            const sources = new Map([
                ['scope1', dataSet],
                ['scope2', dataSet],
            ]);

            const processedData = dataModel.processData(sources);
            expect(dataModel.isReprocessingSupported(processedData!)).toBe(true);

            // Append new data
            dataSet.addTransaction({
                append: [{ category: 'C', seriesA: 200, seriesB: 100 }],
            });

            const reprocessed = dataModel.reprocessData(processedData!);
            verifyReprocessMatchesBaseline(dataModel, reprocessed, sources);
            const columns = reprocessed.columns;

            // Verify stacking was applied ONCE (not doubled)
            // Category A: seriesA=100, seriesB=150 (100+50 stacked)
            expect(columns[0][0]).toBe(100);
            expect(columns[1][0]).toBe(150); // Should be 150, not 200 (would be doubled if bug)

            // Category B: seriesA=150, seriesB=225 (150+75 stacked)
            expect(columns[0][1]).toBe(150);
            expect(columns[1][1]).toBe(225); // Should be 225, not 300 (would be doubled if bug)

            // Category C (new): seriesA=200, seriesB=300 (200+100 stacked)
            expect(columns[0][2]).toBe(200);
            expect(columns[1][2]).toBe(300); // Should be 300, not 400 (would be doubled if bug)
        });

        it('should not commit transactions multiple times when multiple scopes share same DataSet', () => {
            // This test verifies that commitPendingTransactions() deduplicates DataSets
            // to avoid committing the same transaction multiple times
            const dataModel = new DataModel<any, any, true>({
                props: [
                    categoryKey('category', ['scope1', 'scope2']),
                    scopedValue('scope1', 'value1'),
                    scopedValue('scope2', 'value2'),
                ],
                groupByKeys: true,
            });

            const initialData = [
                { category: 'A', value1: 10, value2: 100 },
                { category: 'B', value1: 20, value2: 200 },
            ];
            const dataSet = new DataSet(initialData);

            // Multiple scopes, same DataSet
            const sources = new Map([
                ['scope1', dataSet],
                ['scope2', dataSet],
            ]);

            const processedData = dataModel.processData(sources);
            expect(dataModel.isReprocessingSupported(processedData!)).toBe(true);

            // Add multiple transactions
            dataSet.addTransaction({ append: [{ category: 'C', value1: 30, value2: 300 }] });
            dataSet.addTransaction({ append: [{ category: 'D', value1: 40, value2: 400 }] });

            // Before reprocessing, the DataSet should have pending transactions
            expect(dataSet.getChangeDescription()).toBeTruthy();

            const reprocessed = dataModel.reprocessData(processedData!);
            verifyReprocessMatchesBaseline(dataModel, reprocessed, sources);

            // After reprocessing, transactions should be committed exactly once
            expect(dataSet.getChangeDescription()).toBeUndefined();

            // Verify data is correct
            expect(reprocessed.columns[0]).toEqual([10, 20, 30, 40]);
            expect(reprocessed.columns[1]).toEqual([100, 200, 300, 400]);

            // Verify domain is correct
            expect(reprocessed.domain.values[0]).toEqual([10, 40]);
            expect(reprocessed.domain.values[1]).toEqual([100, 400]);
        });

        it('should handle mixed operations with multiple scopes sharing same DataSet', () => {
            // This test verifies all deduplication logic works together with complex operations
            const dataModel = new DataModel<any, any, true>({
                props: [
                    categoryKey('category', ['scope1', 'scope2']),
                    scopedValue('scope1', 'seriesA', 'stack'),
                    scopedValue('scope2', 'seriesB', 'stack'),
                    actualAccumulateGroup('stack', 'normal'),
                ],
                groupByKeys: true,
                domainBandingConfig: bandingConfig(50, 5),
            });

            // Create larger dataset to enable banding
            const initialData = Array.from({ length: 100 }, (_, i) => ({
                category: `Cat${i}`,
                seriesA: i * 10,
                seriesB: i * 5,
            }));
            const dataSet = new DataSet(initialData);

            // Multiple scopes, same DataSet
            const sources = new Map([
                ['scope1', dataSet],
                ['scope2', dataSet],
            ]);

            const processedData = dataModel.processData(sources);
            expect(dataModel.isReprocessingSupported(processedData!)).toBe(true);

            // Perform mixed operations: remove from start, append at end
            dataSet.addTransaction({
                remove: [initialData[0]],
                append: [{ category: 'Cat100', seriesA: 1000, seriesB: 500 }],
            });

            const reprocessed = dataModel.reprocessData(processedData!);
            verifyReprocessMatchesBaseline(dataModel, reprocessed, sources);
            const columns = reprocessed.columns;

            // Verify data length is correct (100 items still)
            expect(columns[0].length).toBe(100);
            expect(columns[1].length).toBe(100);

            // Verify first item is now Cat1 (Cat0 was removed)
            expect(reprocessed.domain.groups![0]).toEqual(['Cat1']);

            // Verify last item is Cat100 (newly appended)
            expect(reprocessed.domain.groups![99]).toEqual(['Cat100']);

            // Verify stacking on the last item (should be applied once, not doubled)
            expect(columns[0][99]).toBe(1000); // seriesA
            expect(columns[1][99]).toBe(1500); // seriesB stacked: 1000 + 500 = 1500

            // Verify domain reflects correct range
            // domain.values[0] is seriesA range (not stacked)
            // domain.values[1] is seriesB range (after stacking)
            expect(reprocessed.domain.values[0]).toEqual([10, 1000]); // seriesA range
            expect(reprocessed.domain.values[1]).toEqual([15, 1500]); // seriesB stacked range (10+5 to 1000+500)
        });
    });

    describe('reprocessing with stacked area charts', () => {
        it('should fallback to full reprocessing for normal accumulation mode', () => {
            // Normal accumulation mode (not window) should not support reprocessing
            const dataModel = new DataModel<any, any, true>({
                props: [
                    categoryKey('category'),
                    value('seriesA', 'stack'),
                    value('seriesB', 'stack'),
                    actualAccumulateGroup('stack', 'normal'),
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

            // Should support reprocessing with normal accumulation
            expect(dataModel.isReprocessingSupported(processedData!)).toBe(true);

            // Add data
            dataSet.addTransaction({
                append: [{ category: 'C', seriesA: 200, seriesB: 100 }],
            });

            // This should trigger a full reprocess, not incremental
            const reprocessed = dataModel.reprocessData(processedData!);
            verifyReprocessMatchesBaseline(dataModel, reprocessed, sources);

            // Data should still be correct even with full reprocessing
            const groups = (reprocessed as any).groups;
            const columns = reprocessed.columns;

            expect(groups.length).toBe(3);

            // With normal accumulation, values stack within groups (no accumulation across groups)
            // A: seriesA=100, seriesB=150 (100+50 stacked)
            // B: seriesA=150, seriesB=225 (150+75 stacked)
            // C: seriesA=200, seriesB=300 (200+100 stacked)
            expect(columns[0][0]).toBe(100); // A seriesA
            expect(columns[1][0]).toBe(150); // A seriesB (100+50 stacked)
            expect(columns[0][1]).toBe(150); // B seriesA
            expect(columns[1][1]).toBe(225); // B seriesB (150+75 stacked)
            expect(columns[0][2]).toBe(200); // C seriesA
            expect(columns[1][2]).toBe(300); // C seriesB (200+100 stacked)
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
            // Create a scenario where groupsUnique=false by using multiple scopes
            // that share group keys (this prevents the batch merging optimization)
            const dataModel = new DataModel<any, any, true>({
                props: [
                    categoryKey('category', ['scope1', 'scope2']),
                    scopedValue('scope1', 'value1'),
                    scopedValue('scope2', 'value2'),
                ],
                groupByKeys: true,
                groupByFn: () => () => ['shared-group'], // Force all data into one group
            });

            const dataSet1 = new DataSet([{ category: 'A', value1: 10 }]);
            const dataSet2 = new DataSet([{ category: 'A', value2: 20 }]);
            const sources = new Map<string, DataSet<any>>([
                ['scope1', dataSet1],
                ['scope2', dataSet2],
            ]);
            const processedData = dataModel.processData(sources);

            // Multiple scopes prevent batch merging, so groupsUnique=false
            expect(processedData!.type).toBe('grouped');
            expect(processedData!.groupsUnique).toBe(false);
            expect(dataModel.isReprocessingSupported(processedData!)).toBe(false);
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
    });

    describe('null/empty datapoint handling', () => {
        setupMockConsole();

        describe('entirely null datums', () => {
            it('should handle appending null datum', () => {
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

                // Append null datum
                dataSet.addTransaction({ append: [null as any] });

                const reprocessed = dataModel.reprocessData(processedData!);
                verifyReprocessMatchesBaseline(dataModel, reprocessed, sources);

                // Verify invalidData tracking
                expect(reprocessed.invalidData?.get('test')?.[2]).toBe(true);
                expect(reprocessed.invalidKeys?.get('test')?.[2]).toBe(true);
                expect(reprocessed.input.count).toBe(3);
            });

            it('should handle appending undefined datum', () => {
                const dataModel = new DataModel<any, any>({
                    props: [rangeKey('x'), value('y')],
                });

                const initialData = [{ x: 1, y: 10 }];
                const dataSet = new DataSet(initialData);
                const sources = basicDataSet(initialData).set('test', dataSet);

                const processedData = dataModel.processData(sources);

                // Append undefined datum
                dataSet.addTransaction({ append: [undefined as any] });

                const reprocessed = dataModel.reprocessData(processedData!);
                verifyReprocessMatchesBaseline(dataModel, reprocessed, sources);

                // Verify invalidData tracking
                expect(reprocessed.invalidData?.get('test')?.[1]).toBe(true);
                expect(reprocessed.invalidKeys?.get('test')?.[1]).toBe(true);
            });

            it('should handle prepending null datum', () => {
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

                // Prepend null datum
                dataSet.addTransaction({ prepend: [null as any] });

                const reprocessed = dataModel.reprocessData(processedData!);
                verifyReprocessMatchesBaseline(dataModel, reprocessed, sources);

                // Verify index 0 is now invalid, valid data shifted
                expect(reprocessed.invalidData?.get('test')?.[0]).toBe(true);
                expect(reprocessed.invalidKeys?.get('test')?.[0]).toBe(true);
                // Valid keys shifted to positions 1 and 2
                expect(reprocessed.keys[0].get('test')?.[1]).toBe(2);
                expect(reprocessed.keys[0].get('test')?.[2]).toBe(3);
            });

            it('should handle appending multiple null datums in single transaction', () => {
                const dataModel = new DataModel<any, any>({
                    props: [rangeKey('x'), value('y')],
                });

                const initialData = [{ x: 1, y: 10 }];
                const dataSet = new DataSet(initialData);
                const sources = basicDataSet(initialData).set('test', dataSet);

                const processedData = dataModel.processData(sources);

                // Append mix of null and valid
                dataSet.addTransaction({
                    append: [null as any, { x: 2, y: 20 }, null as any],
                });

                const reprocessed = dataModel.reprocessData(processedData!);
                verifyReprocessMatchesBaseline(dataModel, reprocessed, sources);

                // Index 0: valid, Index 1: null, Index 2: valid, Index 3: null
                expect(reprocessed.invalidData?.get('test')?.[0]).toBeFalsy();
                expect(reprocessed.invalidData?.get('test')?.[1]).toBe(true);
                expect(reprocessed.invalidData?.get('test')?.[2]).toBeFalsy();
                expect(reprocessed.invalidData?.get('test')?.[3]).toBe(true);
                expect(reprocessed.input.count).toBe(4);
            });

            it('should handle replacing valid datum with null via remove+append', () => {
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

                // Remove middle item, append null
                dataSet.addTransaction({
                    remove: [initialData[1]],
                    append: [null as any],
                });

                const reprocessed = dataModel.reprocessData(processedData!);
                verifyReprocessMatchesBaseline(dataModel, reprocessed, sources);

                // Domain should contract (only includes 1 and 3, not the null)
                expect(reprocessed.domain.keys).toEqual([[1, 3]]);
                expect(reprocessed.domain.values).toEqual([[10, 30]]);
            });
        });

        describe('datums with null key fields', () => {
            it('should handle appending datum with null key field', () => {
                const dataModel = new DataModel<any, any>({
                    props: [rangeKey('x'), value('y')],
                });

                const initialData = [{ x: 1, y: 10 }];
                const dataSet = new DataSet(initialData);
                const sources = basicDataSet(initialData).set('test', dataSet);

                const processedData = dataModel.processData(sources);

                // Append datum with null key
                dataSet.addTransaction({ append: [{ x: null as any, y: 20 }] });

                const reprocessed = dataModel.reprocessData(processedData!);

                // Clear warnings before baseline comparison
                expectWarningsCalls();

                verifyReprocessMatchesBaseline(dataModel, reprocessed, sources);

                // Key should use invalidValue, marked as invalid
                expect(reprocessed.invalidKeys?.get('test')?.[1]).toBe(true);
                expect(reprocessed.invalidData?.get('test')?.[1]).toBe(true);
                // Key domain should NOT include null key
                expect(reprocessed.domain.keys).toEqual([[1, 1]]);
            });

            it('should handle appending datum with missing key field', () => {
                const dataModel = new DataModel<any, any>({
                    props: [rangeKey('x'), value('y')],
                });

                const initialData = [{ x: 1, y: 10 }];
                const dataSet = new DataSet(initialData);
                const sources = basicDataSet(initialData).set('test', dataSet);

                const processedData = dataModel.processData(sources);

                // Append datum with missing x key
                dataSet.addTransaction({ append: [{ y: 20 } as any] });

                const reprocessed = dataModel.reprocessData(processedData!);

                // Clear warnings before baseline comparison
                expectWarningsCalls();

                verifyReprocessMatchesBaseline(dataModel, reprocessed, sources);

                // Key should be marked as invalid
                expect(reprocessed.invalidKeys?.get('test')?.[1]).toBe(true);
                // Key domain unchanged
                expect(reprocessed.domain.keys).toEqual([[1, 1]]);
            });

            it('should handle category key with null value', () => {
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

                // Append datum with null category key
                dataSet.addTransaction({ append: [{ category: null as any, value: 30 }] });

                const reprocessed = dataModel.reprocessData(processedData!);

                // Clear warnings before baseline comparison
                expectWarningsCalls();

                verifyReprocessMatchesBaseline(dataModel, reprocessed, sources);

                // Invalid key should be tracked
                expect(reprocessed.invalidKeys?.get('test')?.[2]).toBe(true);
                // Category domain should NOT include null
                expect(reprocessed.domain.keys).toEqual([['A', 'B']]);
            });
        });

        describe('datums with null value fields (valid key)', () => {
            it('should handle appending datum with null value but valid key', () => {
                const dataModel = new DataModel<any, any>({
                    props: [
                        rangeKey('x'),
                        { ...value('y'), validation: (v: any) => typeof v === 'number', invalidValue: undefined },
                    ],
                });

                const initialData = [{ x: 1, y: 10 }];
                const dataSet = new DataSet(initialData);
                const sources = basicDataSet(initialData).set('test', dataSet);

                const processedData = dataModel.processData(sources);

                // Append datum with valid key but null value
                dataSet.addTransaction({ append: [{ x: 2, y: null as any }] });

                const reprocessed = dataModel.reprocessData(processedData!);

                // Clear warnings before baseline comparison
                expectWarningsCalls();

                verifyReprocessMatchesBaseline(dataModel, reprocessed, sources);

                // Key domain should include new key
                expect(reprocessed.domain.keys).toEqual([[1, 2]]);
                // Value domain should NOT include null
                expect(reprocessed.domain.values).toEqual([[10, 10]]);
                // Key should be valid, but data marked as partially invalid
                expect(reprocessed.invalidKeys?.get('test')?.[1]).toBeFalsy();
                expect(reprocessed.invalidData?.get('test')?.[1]).toBe(true);
                expect(reprocessed.partialValidDataCount).toBeGreaterThan(0);
            });

            it('should handle multiple value columns with selective nulls', () => {
                const dataModel = new DataModel<any, any>({
                    props: [
                        rangeKey('x'),
                        { ...value('y1'), validation: (v: any) => typeof v === 'number', invalidValue: undefined },
                        { ...value('y2'), validation: (v: any) => typeof v === 'number', invalidValue: undefined },
                    ],
                });

                const initialData = [{ x: 1, y1: 10, y2: 100 }];
                const dataSet = new DataSet(initialData);
                const sources = basicDataSet(initialData).set('test', dataSet);

                const processedData = dataModel.processData(sources);

                // Append datum with y1 valid but y2 null
                dataSet.addTransaction({ append: [{ x: 2, y1: 20, y2: null as any }] });

                const reprocessed = dataModel.reprocessData(processedData!);

                // Clear warnings before baseline comparison
                expectWarningsCalls();

                verifyReprocessMatchesBaseline(dataModel, reprocessed, sources);

                // y1 domain should update
                expect(reprocessed.domain.values[0]).toEqual([10, 20]);
                // y2 domain should NOT include null
                expect(reprocessed.domain.values[1]).toEqual([100, 100]);
            });

            it('should handle appending datum with undefined value field', () => {
                const dataModel = new DataModel<any, any>({
                    props: [
                        rangeKey('x'),
                        { ...value('y'), validation: (v: any) => typeof v === 'number', invalidValue: undefined },
                    ],
                });

                const initialData = [{ x: 1, y: 10 }];
                const dataSet = new DataSet(initialData);
                const sources = basicDataSet(initialData).set('test', dataSet);

                const processedData = dataModel.processData(sources);

                // Append datum with missing y value
                dataSet.addTransaction({ append: [{ x: 2 } as any] });

                const reprocessed = dataModel.reprocessData(processedData!);

                // Clear warnings before baseline comparison
                expectWarningsCalls();

                verifyReprocessMatchesBaseline(dataModel, reprocessed, sources);

                // Key domain should include new key
                expect(reprocessed.domain.keys).toEqual([[1, 2]]);
                // Value domain should NOT change
                expect(reprocessed.domain.values).toEqual([[10, 10]]);
            });
        });

        describe('update operations with nulls', () => {
            it('should handle updating datum to have null key', () => {
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

                // Mutate the datum and add update transaction
                initialData[1].x = null as any;
                dataSet.addTransaction({ update: [initialData[1]] });

                const reprocessed = dataModel.reprocessData(processedData!);
                verifyReprocessMatchesBaseline(dataModel, reprocessed, sources);

                // Updated key should now be invalid
                expect(reprocessed.invalidKeys?.get('test')?.[1]).toBe(true);
            });

            it('should handle updating datum to have null value', () => {
                const dataModel = new DataModel<any, any>({
                    props: [
                        rangeKey('x'),
                        { ...value('y'), validation: (v: any) => typeof v === 'number', invalidValue: undefined },
                    ],
                });

                const initialData = [
                    { x: 1, y: 10 },
                    { x: 2, y: 20 },
                ];
                const dataSet = new DataSet(initialData);
                const sources = basicDataSet(initialData).set('test', dataSet);

                const processedData = dataModel.processData(sources);

                // Mutate the value to null
                initialData[1].y = null as any;
                dataSet.addTransaction({ update: [initialData[1]] });

                const reprocessed = dataModel.reprocessData(processedData!);
                verifyReprocessMatchesBaseline(dataModel, reprocessed, sources);

                // Key should still be valid
                expect(reprocessed.invalidKeys?.get('test')?.[1]).toBeFalsy();
                // But data should be marked as invalid
                expect(reprocessed.invalidData?.get('test')?.[1]).toBe(true);
            });
        });

        describe('remove operations with nulls', () => {
            it('should handle removing null datum', () => {
                const dataModel = new DataModel<any, any>({
                    props: [rangeKey('x'), value('y')],
                });

                // Start with data that includes null
                const nullDatum = null as any;
                const initialData = [{ x: 1, y: 10 }, nullDatum, { x: 3, y: 30 }];
                const dataSet = new DataSet(initialData);
                const sources = basicDataSet(initialData).set('test', dataSet);

                const processedData = dataModel.processData(sources);

                // Verify initial state has invalid data
                expect(processedData!.invalidData?.get('test')?.[1]).toBe(true);

                // Remove the null datum
                dataSet.addTransaction({ remove: [nullDatum] });

                const reprocessed = dataModel.reprocessData(processedData!);
                verifyReprocessMatchesBaseline(dataModel, reprocessed, sources);

                // Should now have only 2 items
                expect(reprocessed.input.count).toBe(2);
                expect(reprocessed.keys[0].get('test')).toEqual([1, 3]);
            });

            it('should handle removing all valid datums leaving only nulls', () => {
                const dataModel = new DataModel<any, any>({
                    props: [rangeKey('x'), value('y')],
                });

                const nullDatum = null as any;
                const validDatum = { x: 1, y: 10 };
                const initialData = [validDatum, nullDatum];
                const dataSet = new DataSet(initialData);
                const sources = basicDataSet(initialData).set('test', dataSet);

                const processedData = dataModel.processData(sources);

                // Remove the only valid datum
                dataSet.addTransaction({ remove: [validDatum] });

                const reprocessed = dataModel.reprocessData(processedData!);
                verifyReprocessMatchesBaseline(dataModel, reprocessed, sources);

                // Should have 1 item (the null)
                expect(reprocessed.input.count).toBe(1);
                expect(reprocessed.invalidData?.get('test')?.[0]).toBe(true);
            });
        });

        describe('mixed transactions with nulls', () => {
            it('should handle prepend null and append valid', () => {
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

                // Prepend null, append valid
                dataSet.addTransaction({
                    prepend: [null as any],
                    append: [{ x: 4, y: 40 }],
                });

                const reprocessed = dataModel.reprocessData(processedData!);
                verifyReprocessMatchesBaseline(dataModel, reprocessed, sources);

                // First position invalid, last position valid
                expect(reprocessed.invalidData?.get('test')?.[0]).toBe(true);
                expect(reprocessed.invalidData?.get('test')?.[3]).toBeFalsy();
                expect(reprocessed.domain.keys).toEqual([[2, 4]]);
            });

            it('should handle remove valid and append null', () => {
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

                // Remove first valid, append null
                dataSet.addTransaction({
                    remove: [initialData[0]],
                    append: [null as any],
                });

                const reprocessed = dataModel.reprocessData(processedData!);
                verifyReprocessMatchesBaseline(dataModel, reprocessed, sources);

                // Domain should exclude removed value and null
                expect(reprocessed.domain.keys).toEqual([[2, 3]]);
                expect(reprocessed.domain.values).toEqual([[20, 30]]);
                // Last item is null
                expect(reprocessed.invalidData?.get('test')?.[2]).toBe(true);
            });

            it('should handle rolling window with null datums', () => {
                const dataModel = new DataModel<any, any>({
                    props: [rangeKey('x'), value('y')],
                    domainBandingConfig: bandingConfig(50, 5),
                });

                // Large dataset to trigger banding
                const initialData = Array.from({ length: 100 }, (_, i) => ({
                    x: i,
                    y: i * 10,
                }));
                const dataSet = new DataSet(initialData);
                const sources = basicDataSet(initialData).set('test', dataSet);

                const processedData = dataModel.processData(sources);

                // Rolling window: remove from start, append nulls at end
                dataSet.addTransaction({
                    remove: [initialData[0], initialData[1]],
                    append: [null as any, { x: 100, y: 1000 }],
                });

                const reprocessed = dataModel.reprocessData(processedData!);
                verifyReprocessMatchesBaseline(dataModel, reprocessed, sources);

                // Still 100 items
                expect(reprocessed.input.count).toBe(100);
                // Second to last is null
                expect(reprocessed.invalidData?.get('test')?.[98]).toBe(true);
                // Domain excludes null
                expect(reprocessed.domain.keys).toEqual([[2, 100]]);
            });
        });

        describe('domain correctness with nulls', () => {
            it('should compute correct key domain excluding null keys', () => {
                const dataModel = new DataModel<any, any>({
                    props: [rangeKey('x'), value('y')],
                });

                const initialData = [{ x: 1, y: 10 }];
                const dataSet = new DataSet(initialData);
                const sources = basicDataSet(initialData).set('test', dataSet);

                const processedData = dataModel.processData(sources);

                // Append mix of valid and null keys
                dataSet.addTransaction({
                    append: [
                        { x: null as any, y: 20 },
                        { x: 3, y: 30 },
                        { x: null as any, y: 40 },
                        { x: 5, y: 50 },
                    ],
                });

                const reprocessed = dataModel.reprocessData(processedData!);

                // Clear warnings before baseline comparison
                expectWarningsCalls();

                verifyReprocessMatchesBaseline(dataModel, reprocessed, sources);

                // Domain only includes valid keys (1, 3, 5)
                expect(reprocessed.domain.keys).toEqual([[1, 5]]);
            });

            it('should compute correct value domain excluding null values', () => {
                const dataModel = new DataModel<any, any>({
                    props: [
                        rangeKey('x'),
                        { ...value('y'), validation: (v: any) => typeof v === 'number', invalidValue: undefined },
                    ],
                });

                const initialData = [{ x: 1, y: 10 }];
                const dataSet = new DataSet(initialData);
                const sources = basicDataSet(initialData).set('test', dataSet);

                const processedData = dataModel.processData(sources);

                // Append mix of valid and null values
                dataSet.addTransaction({
                    append: [
                        { x: 2, y: null as any },
                        { x: 3, y: 30 },
                        { x: 4, y: null as any },
                        { x: 5, y: 50 },
                    ],
                });

                const reprocessed = dataModel.reprocessData(processedData!);

                // Clear warnings before baseline comparison
                expectWarningsCalls();

                verifyReprocessMatchesBaseline(dataModel, reprocessed, sources);

                // Key domain includes all valid keys
                expect(reprocessed.domain.keys).toEqual([[1, 5]]);
                // Value domain only includes valid values (10, 30, 50)
                expect(reprocessed.domain.values).toEqual([[10, 50]]);
            });
        });

        describe('grouped data with nulls', () => {
            it('should handle grouped data with null value but valid key', () => {
                const dataModel = new DataModel<any, any, true>({
                    props: [
                        rangeKey('x'),
                        { ...value('y'), validation: (v: any) => typeof v === 'number', invalidValue: undefined },
                    ],
                    groupByKeys: true,
                });

                const initialData = [
                    { x: 1, y: 10 },
                    { x: 2, y: 20 },
                ];
                const dataSet = new DataSet(initialData);
                const sources = basicDataSet(initialData).set('test', dataSet);

                const processedData = dataModel.processData(sources);

                // Append datum with valid key but null value
                dataSet.addTransaction({ append: [{ x: 3, y: null as any }] });

                const reprocessed = dataModel.reprocessData(processedData!) as GroupedData<any>;

                // Clear warnings before baseline comparison
                expectWarningsCalls();

                verifyReprocessMatchesBaseline(dataModel, reprocessed, sources);

                // Groups should include the new item
                expect(reprocessed.groups.length).toBe(3);
                expect(reprocessed.groups[2].keys).toEqual([3]);
                // The group's validScopes should indicate invalid value
                // Check that column contains the invalidValue
                expect(reprocessed.columns[0][2]).toBeUndefined();
            });

            it('should not support reprocessing when invalid keys exist in initial data', () => {
                const dataModel = new DataModel<any, any, true>({
                    props: [rangeKey('x'), value('y')],
                    groupByKeys: true,
                });

                // Initial data with null key
                const initialData = [
                    { x: 1, y: 10 },
                    { x: null as any, y: 20 },
                ];
                const dataSet = new DataSet(initialData);
                const sources = basicDataSet(initialData).set('test', dataSet);

                const processedData = dataModel.processData(sources);

                // Clear warnings before assertion
                expectWarningsCalls();

                // Should not support reprocessing due to existing invalid keys
                expect(dataModel.isReprocessingSupported(processedData!)).toBe(false);
            });
        });

        describe('banding with nulls', () => {
            it('should handle banded domain with null datum insertions', () => {
                const dataModel = new DataModel<any, any>({
                    props: [rangeKey('x'), value('y')],
                    domainBandingConfig: bandingConfig(50, 5),
                });

                // Large dataset to trigger banding
                const initialData = Array.from({ length: 100 }, (_, i) => ({
                    x: i,
                    y: i * 10,
                }));
                const dataSet = new DataSet(initialData);
                const sources = basicDataSet(initialData).set('test', dataSet);

                const processedData = dataModel.processData(sources);

                // Append null datums
                dataSet.addTransaction({
                    append: [null as any, { x: 100, y: 1000 }, null as any],
                });

                const reprocessed = dataModel.reprocessData(processedData!);
                verifyReprocessMatchesBaseline(dataModel, reprocessed, sources);

                // Verify banding metadata is present
                expect(reprocessed.optimizations?.domainBanding).toBeDefined();

                // Domain should exclude nulls
                expect(reprocessed.domain.keys).toEqual([[0, 100]]);
                expect(reprocessed.domain.values).toEqual([[0, 1000]]);

                // Invalid data tracked
                expect(reprocessed.invalidData?.get('test')?.[100]).toBe(true);
                expect(reprocessed.invalidData?.get('test')?.[102]).toBe(true);
            });
        });
    });
});
