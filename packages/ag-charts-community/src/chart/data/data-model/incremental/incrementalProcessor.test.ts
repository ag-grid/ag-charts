import { describe, expect, it } from '@jest/globals';

import type { GroupedData } from '../../dataModel';
import { DataModel } from '../../dataModel';
import { DataSet } from '../../dataSet';
import {
    basicDataSet,
    categoryKey,
    rangeKey,
    scopedValue,
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
                expect(reprocessed.groups.length).toBe(2);
                expect(reprocessed.groups[0].keys).toEqual(['A']);
                expect(reprocessed.groups[0].datumIndices).toEqual([[0, 1, 3]]); // Three items in group A
                expect(reprocessed.groups[1].keys).toEqual(['B']);
                expect(reprocessed.groups[1].datumIndices).toEqual([[2]]); // One item in group B

                // Verify columns
                expect(reprocessed.columns).toEqual([[10, 20, 30, 40]]);
            });
        });

        describe('banding with multiple scopes', () => {
            it('should handle banding when appending to large dataset (50+ items)', () => {
                const dataModel = new DataModel<any, any>({
                    props: [
                        rangeKey('x'),
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

                // Verify banding was applied
                expect(processedData?.optimizations?.domainBanding).toBeDefined();

                // Remove first item and append new item
                dataSet.addTransaction({
                    remove: [initialData[0]],
                    append: [{ x: 100, y1: 1000, y2: 500 }],
                });

                const reprocessed = dataModel.reprocessData(processedData!);
                verifyReprocessMatchesBaseline(dataModel, reprocessed, sources);

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
                        categoryKey('category'),
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
    });
});
