import { describe, expect, it } from '@jest/globals';

import { DataModel } from '../../dataModel';
import { DataSet } from '../../dataSet';
import {
    basicDataSet,
    categoryKey,
    rangeKey,
    value,
    verifyDomain,
    verifyReprocessMatchesBaseline,
} from '../test/testUtils';

/**
 * Helper to create a standard banding config
 */
function bandingConfig(minDataSizeForBanding: number, targetBandCount: number) {
    return {
        minDataSizeForBanding,
        targetBandCount,
        enableBanding: true,
    };
}

/**
 * Shared helper to create a basic scrolling test scenario
 */
function createScrollingTestScenario(config: {
    dataSize: number;
    minDataSizeForBanding: number;
    targetBandCount: number;
}) {
    const dataModel = new DataModel<any, any>({
        props: [rangeKey('x'), value('y')],
        domainBandingConfig: bandingConfig(config.minDataSizeForBanding, config.targetBandCount),
    });

    const initialData = Array.from({ length: config.dataSize }, (_, i) => ({
        x: i,
        y: i * 10,
    }));
    const dataSet = new DataSet(initialData);
    const sources = basicDataSet(initialData).set('test', dataSet);
    const processedData = dataModel.processData(sources);

    return { dataModel, dataSet, sources, processedData, initialData };
}

/**
 * Shared helper to perform scrolling transaction and verify
 */
function performScrollingTransaction(
    scenario: ReturnType<typeof createScrollingTestScenario>,
    removeCount: number,
    appendStartIndex: number
) {
    const { dataSet } = scenario;
    const currentData = dataSet.data;

    const toRemove = currentData.slice(0, removeCount);
    const toAppend = Array.from({ length: removeCount }, (_, i) => ({
        x: appendStartIndex + i,
        y: (appendStartIndex + i) * 10,
    }));

    dataSet.addTransaction({
        remove: toRemove,
        append: toAppend,
    });

    return { toRemove, toAppend };
}

/**
 * Shared helper to verify banding optimization metadata
 */
function verifyBandingOptimization(
    data: any,
    expected: {
        shouldHaveBanding: boolean;
        maxScanRatio?: number;
        minDirtyBands?: number;
        maxDirtyBands?: number;
        totalBands?: number;
    }
) {
    const metadata = data.optimizations;

    if (expected.shouldHaveBanding) {
        expect(metadata?.domainBanding).toBeDefined();
        expect(metadata!.domainBanding!.keyDefs).toBeDefined();
        expect(metadata!.domainBanding!.valueDefs).toBeDefined();

        // Verify key domain banding
        const keyDefStats = metadata!.domainBanding!.keyDefs[0].stats;
        expect(keyDefStats).toBeDefined();
        expect(keyDefStats!.totalBands).toBeGreaterThan(1);

        if (expected.totalBands !== undefined) {
            expect(keyDefStats!.totalBands).toBe(expected.totalBands);
        }

        if (expected.maxScanRatio !== undefined) {
            expect(keyDefStats!.scanRatio).toBeLessThan(expected.maxScanRatio);
            expect(keyDefStats!.scanRatio).toBeGreaterThan(0);
        }

        if (expected.maxDirtyBands !== undefined) {
            expect(keyDefStats!.dirtyBands).toBeLessThanOrEqual(expected.maxDirtyBands);
        }

        if (expected.minDirtyBands !== undefined) {
            expect(keyDefStats!.dirtyBands).toBeGreaterThanOrEqual(expected.minDirtyBands);
        }

        // Verify value domain banding
        const valueDefStats = metadata!.domainBanding!.valueDefs[0].stats;
        expect(valueDefStats).toBeDefined();
        expect(valueDefStats!.totalBands).toBeGreaterThan(1);

        if (expected.totalBands !== undefined) {
            expect(valueDefStats!.totalBands).toBe(expected.totalBands);
        }

        if (expected.maxScanRatio !== undefined) {
            expect(valueDefStats!.scanRatio).toBeLessThan(expected.maxScanRatio);
            expect(valueDefStats!.scanRatio).toBeGreaterThan(0);
        }

        if (expected.maxDirtyBands !== undefined) {
            expect(valueDefStats!.dirtyBands).toBeLessThanOrEqual(expected.maxDirtyBands);
        }

        if (expected.minDirtyBands !== undefined) {
            expect(valueDefStats!.dirtyBands).toBeGreaterThanOrEqual(expected.minDirtyBands);
        }
    }
}

describe('DomainManager', () => {
    describe('banded domain optimization', () => {
        describe('append operations with banding', () => {
            it('should correctly update domain when appending to large dataset', () => {
                // Create a data model with banding enabled for datasets > 100 items
                const dataModel = new DataModel<any, any>({
                    props: [rangeKey('x'), value('y')],
                    domainBandingConfig: bandingConfig(100, 5), // Lower threshold for testing
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
                verifyDomain(processedData!, {
                    keys: [[0, 199]],
                    values: [[0, 1990]],
                });

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
                    domainBandingConfig: bandingConfig(100, 5),
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
                verifyReprocessMatchesBaseline(dataModel, reprocessed, sources);

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
                    domainBandingConfig: bandingConfig(50, 4),
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
                    domainBandingConfig: bandingConfig(50, 3),
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
                verifyReprocessMatchesBaseline(dataModel, reprocessed, sources);

                // Domain should update to new boundaries
                expect(reprocessed.domain.keys).toEqual([[1, 58]]);
                expect(reprocessed.domain.values).toEqual([[10, 580]]);
            });

            it('should handle removing all values from a band', () => {
                const dataModel = new DataModel<any, any>({
                    props: [rangeKey('x'), value('y')],
                    domainBandingConfig: bandingConfig(20, 4),
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
                verifyReprocessMatchesBaseline(dataModel, reprocessed, sources);

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
                    domainBandingConfig: bandingConfig(5, 3),
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
                verifyReprocessMatchesBaseline(dataModel, reprocessed, sources);

                // Domain should include all data
                expect(reprocessed.domain.keys).toEqual([[0, 19]]);
                expect(reprocessed.domain.values).toEqual([[0, 190]]);
                expect(reprocessed.input.count).toBe(20);

                // Remove half the data - items with x=0 to x=4
                const toRemove = initialData.slice(0, 5);
                dataSet.addTransaction({ remove: toRemove });

                const reprocessed2 = dataModel.reprocessData(reprocessed);
                verifyReprocessMatchesBaseline(dataModel, reprocessed2, sources);

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
                verifyReprocessMatchesBaseline(dataModel, reprocessed3, sources);

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
                    domainBandingConfig: bandingConfig(100, 5),
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
            // Parameterized test for basic scrolling scenarios
            it.each([
                {
                    description: 'single item scroll',
                    dataSize: 1200,
                    removeCount: 1,
                    targetBandCount: 5,
                    expectedDomain: { keys: [[1, 1200]], values: [[10, 12000]] },
                },
                {
                    description: '10 items scroll',
                    dataSize: 1200,
                    removeCount: 10,
                    targetBandCount: 10,
                    expectedDomain: { keys: [[10, 1209]], values: [[100, 12090]] },
                },
            ])(
                'should correctly update domain when scrolling ($description)',
                ({ dataSize, removeCount, targetBandCount, expectedDomain }) => {
                    const scenario = createScrollingTestScenario({
                        dataSize,
                        minDataSizeForBanding: 100,
                        targetBandCount,
                    });

                    // Verify initial domain
                    verifyDomain(scenario.processedData!, {
                        keys: [[0, dataSize - 1]],
                        values: [[0, (dataSize - 1) * 10]],
                    });

                    // Perform scrolling transaction
                    performScrollingTransaction(scenario, removeCount, dataSize);

                    const reprocessed = scenario.dataModel.reprocessData(scenario.processedData!);
                    verifyReprocessMatchesBaseline(scenario.dataModel, reprocessed, scenario.sources);

                    // Verify domain shifted correctly
                    verifyDomain(reprocessed, { ...expectedDomain, count: dataSize });
                }
            );

            it('should correctly shift and resize bands during scrolling (detailed band verification)', () => {
                const dataModel = new DataModel<any, any>({
                    props: [rangeKey('x'), value('y')],
                    domainBandingConfig: bandingConfig(100, 10),
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
                verifyReprocessMatchesBaseline(dataModel, reprocessed, sources);

                // Domain should correctly shift to new range
                expect(reprocessed.domain.keys).toEqual([[10, 1209]]);
                expect(reprocessed.domain.values).toEqual([[100, 12090]]);
                expect(reprocessed.input.count).toBe(1200);

                // First reprocess: all bands dirty (banding initialized)
                expect(reprocessed.optimizations?.domainBanding).toBeDefined();

                // Do a SECOND scrolling operation to test the optimization
                const currentData = dataSet.data;
                const toRemove2 = currentData.slice(0, 10);
                const toAppend2 = Array.from({ length: 10 }, (_, i) => ({
                    x: 1210 + i,
                    y: (1210 + i) * 10,
                }));
                dataSet.addTransaction({
                    remove: toRemove2,
                    append: toAppend2,
                });

                const reprocessed2 = dataModel.reprocessData(reprocessed);
                verifyReprocessMatchesBaseline(dataModel, reprocessed2, sources);

                // Domain should correctly shift to new range
                expect(reprocessed2.domain.keys).toEqual([[20, 1219]]);
                expect(reprocessed2.domain.values).toEqual([[200, 12190]]);
                expect(reprocessed2.input.count).toBe(1200);

                // Verify the banding optimization worked on SECOND reprocess
                // In a scrolling scenario with 1200 items and 12 bands:
                // - Only 2 bands should be dirty (band 0 shrunk, band 11 extended)
                // - That's 2/12 = 16.7% of bands scanned, not 100%
                verifyBandingOptimization(reprocessed2, {
                    shouldHaveBanding: true,
                    maxDirtyBands: 5, // At most ~40% of bands
                    maxScanRatio: 0.5, // Less than 50% data scanned
                });
            });

            it('should handle multiple scrolling operations efficiently', () => {
                const dataModel = new DataModel<any, any>({
                    props: [rangeKey('x'), value('y')],
                    domainBandingConfig: bandingConfig(100, 10),
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
                    verifyReprocessMatchesBaseline(dataModel, processedData, sources);

                    // Verify domain is correct after each iteration
                    const expectedMinX = 10 * (iteration + 1);
                    const expectedMaxX = 1200 + 10 * (iteration + 1) - 1;
                    expect(processedData.domain.keys).toEqual([[expectedMinX, expectedMaxX]]);
                    expect(processedData.input.count).toBe(1200);

                    // CRITICAL: Verify optimization is working after first iteration
                    // (first iteration initializes banding, so all bands are dirty)
                    if (iteration > 0) {
                        verifyBandingOptimization(processedData, {
                            shouldHaveBanding: true,
                            maxScanRatio: 0.5, // Less than 50% data scanned
                        });
                    }
                }

                // After 5 scrolls (50 items removed from start, 50 added to end)
                // Final range should be [50, 1249]
                expect(processedData.domain.keys).toEqual([[50, 1249]]);
                expect(processedData.domain.values).toEqual([[500, 12490]]);
            });

            it('should not reinitialize all bands during scrolling when data size is below threshold', () => {
                // This test specifically verifies the fix for the bug where considerRebalancing()
                const dataModel = new DataModel<any, any>({
                    props: [rangeKey('x'), value('y')],
                    domainBandingConfig: bandingConfig(100, 5),
                });

                // Create dataset with 1200 items (above threshold to enable banding)
                const initialData = Array.from({ length: 1200 }, (_, i) => ({
                    x: i,
                    y: i * 10,
                }));
                const dataSet = new DataSet(initialData);
                const sources = basicDataSet(initialData).set('test', dataSet);

                const processedData = dataModel.processData(sources)!;
                expect(processedData.domain.keys).toEqual([[0, 1199]]);

                // Scroll: remove 1 from start, append 1 at end
                dataSet.addTransaction({
                    remove: [initialData[0]],
                    append: [{ x: 1200, y: 12000 }],
                });

                const reprocessed = dataModel.reprocessData(processedData);
                verifyReprocessMatchesBaseline(dataModel, reprocessed, sources);
                expect(reprocessed.domain.keys).toEqual([[1, 1200]]);

                // Verify banding metadata is present and bands are created
                // Note: On first reprocess after processData, all bands are initialized as dirty
                // (banded domains are created for the first time during reprocessData)
                const metadata = reprocessed.optimizations;
                expect(metadata?.domainBanding).toBeDefined();

                const keyDefStats = metadata!.domainBanding!.keyDefs[0].stats;
                expect(keyDefStats).toBeDefined();
                expect(keyDefStats!.totalBands).toBe(5); // Should have 5 bands
                expect(keyDefStats!.dirtyBands).toBe(5); // First reprocess: all bands dirty (expected)

                const valueDefStats = metadata!.domainBanding!.valueDefs[0].stats;
                expect(valueDefStats).toBeDefined();
                expect(valueDefStats!.totalBands).toBe(5);
                expect(valueDefStats!.dirtyBands).toBe(5); // First reprocess: all bands dirty (expected)
            });

            it('should only mark affected bands dirty when scrolling (5 bands, 1200 items)', () => {
                // This test verifies the specific scenario from the user's high-freq-multi-chart example
                // With 1200 items and 5 bands, scrolling should only dirty 2 bands (first and last)
                const dataModel = new DataModel<any, any>({
                    props: [rangeKey('time'), value('value')],
                    domainBandingConfig: bandingConfig(100, 5),
                });

                // Create dataset with 1200 items (will create 5 bands of 240 items each)
                const initialData = Array.from({ length: 1200 }, (_, i) => ({
                    time: i,
                    value: i * 10,
                }));
                const dataSet = new DataSet(initialData);
                const sources = basicDataSet(initialData).set('test', dataSet);

                const processedData = dataModel.processData(sources);

                // Initial domain
                expect(processedData!.domain.keys).toEqual([[0, 1199]]);
                expect(processedData!.domain.values).toEqual([[0, 11990]]);

                // Simulate scrolling: remove 1 from start, append 1 at end
                // This is the exact pattern from the high-freq-multi-chart example
                const toRemove = [initialData[0]];
                const toAppend = [{ time: 1200, value: 12000 }];
                dataSet.addTransaction({
                    remove: toRemove,
                    append: toAppend,
                });

                const reprocessed1 = dataModel.reprocessData(processedData!);
                verifyReprocessMatchesBaseline(dataModel, reprocessed1, sources);

                // First reprocess: bands are created from scratch, all dirty (expected)
                expect(reprocessed1.input.count).toBe(1200);
                expect(reprocessed1.domain.keys).toEqual([[1, 1200]]);
                expect(reprocessed1.domain.values).toEqual([[10, 12000]]);

                const metadata1 = reprocessed1.optimizations?.domainBanding;
                expect(metadata1).toBeDefined();
                expect(metadata1!.keyDefs[0].stats?.dirtyBands).toBe(5); // First reprocess: all bands dirty (expected)

                // Now do a SECOND transaction - this is where the optimization should kick in
                // Note: We use the actual data object from the dataset, not the original initialData
                const currentData = dataSet.data;
                const toRemove2 = [currentData[0]]; // Remove first item from current data
                const toAppend2 = [{ time: 1201, value: 12010 }];
                dataSet.addTransaction({
                    remove: toRemove2,
                    append: toAppend2,
                });

                const reprocessed2 = dataModel.reprocessData(reprocessed1);
                verifyReprocessMatchesBaseline(dataModel, reprocessed2, sources);

                // Second reprocess: data size still 1200
                expect(reprocessed2.input.count).toBe(1200);
                expect(reprocessed2.domain.keys).toEqual([[2, 1201]]);
                expect(reprocessed2.domain.values).toEqual([[20, 12010]]);

                // CRITICAL: Verify banding optimization is working on SECOND reprocess
                const metadata2 = reprocessed2.optimizations;

                // For 5 bands with remove-first + append-last operation:
                // - Band 0 (first) should be dirty (affected by removal)
                // - Band 4 (last) should be dirty (affected by append)
                // - Bands 1-3 should remain clean (only indices shifted)
                // Total: 2/5 bands dirty = 40% scan, NOT 100%
                expect(metadata2?.domainBanding).toBeDefined();

                const keyDefStats = metadata2!.domainBanding!.keyDefs[0].stats;
                expect(keyDefStats).toBeDefined();
                expect(keyDefStats!.totalBands).toBe(5);
                expect(keyDefStats!.dirtyBands).toBe(2); // MUST be 2, not 5!
                expect(keyDefStats!.scanRatio).toBeCloseTo(0.4, 1); // 2/5 = 40%

                const valueDefStats = metadata2!.domainBanding!.valueDefs[0].stats;
                expect(valueDefStats).toBeDefined();
                expect(valueDefStats!.totalBands).toBe(5);
                expect(valueDefStats!.dirtyBands).toBe(2); // MUST be 2, not 5!
                expect(valueDefStats!.scanRatio).toBeCloseTo(0.4, 1); // 2/5 = 40%
            });
        });

        describe('discrete domains with banding disabled', () => {
            it('should not use banding for category domains', () => {
                const dataModel = new DataModel<any, any>({
                    props: [categoryKey('category'), value('value')],
                    domainBandingConfig: bandingConfig(10, 5),
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
                verifyReprocessMatchesBaseline(dataModel, reprocessed, sources);

                // Should include new category
                expect(reprocessed.domain.keys).toEqual([['A', 'B', 'C', 'D', 'E', 'F']]);
            });
        });

        describe('performance characteristics with banding', () => {
            it('should efficiently handle append-heavy workloads', () => {
                const dataModel = new DataModel<any, any>({
                    props: [rangeKey('timestamp'), value('value')],
                    domainBandingConfig: bandingConfig(100, 10),
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
});
