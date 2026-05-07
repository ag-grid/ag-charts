import { afterEach, describe, expect, it } from '@jest/globals';

import { type AgCartesianChartOptions, type AgChartInstance, type AgChartOptions, AgCharts } from 'ag-charts-community';
import {
    IMAGE_SNAPSHOT_DEFAULTS,
    deproxy,
    dragAction,
    extractImageData,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from 'ag-charts-community-test';

import { prepareEnterpriseTestOptions } from '../../test/utils';

describe('DataSelection', () => {
    setupMockConsole();

    const compare = async (defaults = IMAGE_SNAPSHOT_DEFAULTS) => {
        await waitForChartStability(chart);
        const imageData = extractImageData(ctx);
        expect(imageData).toMatchImageSnapshot(defaults);
    };

    let chart: AgChartInstance;
    const ctx = setupMockCanvas();

    afterEach(() => {
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
    });

    const bubbleData = [
        { x: 10, y: 20, size: 5 },
        { x: 20, y: 10, size: 8 },
        { x: 30, y: 40, size: 3 },
        { x: 40, y: 30, size: 6 },
        { x: 50, y: 50, size: 10 },
        { x: 60, y: 15, size: 4 },
        { x: 70, y: 35, size: 7 },
        { x: 80, y: 25, size: 9 },
        { x: 90, y: 45, size: 2 },
        { x: 15, y: 55, size: 11 },
    ];

    describe('bubble series — non-aggregated selection', () => {
        it('should render selected markers with distinct styling after setSelection', async () => {
            const options: AgChartOptions = {
                data: bubbleData,
                series: [
                    {
                        type: 'bubble',
                        xKey: 'x',
                        yKey: 'y',
                        sizeKey: 'size',
                        size: 6,
                        maxSize: 30,
                        selection: {
                            enabled: true,
                            selectedItem: { fill: 'lime', stroke: 'darkgreen', strokeWidth: 3 },
                            unselectedItem: { fillOpacity: 0.15 },
                        },
                    },
                ],
                selection: { enabled: true },
                axes: {
                    x: { type: 'number', position: 'bottom' },
                    y: { type: 'number', position: 'left' },
                },
            };

            prepareEnterpriseTestOptions(options);
            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            const seriesId = deproxy(chart).series[0].id;
            const dataSet = deproxy(chart).series[0].data!;

            chart.setSelection([
                { seriesId, itemId: dataSet.getItemIdFromIndex(0) },
                { seriesId, itemId: dataSet.getItemIdFromIndex(2) },
            ]);

            await compare();
        });

        it('should reflect selection count via getSelection after setSelection', async () => {
            const options: AgCartesianChartOptions = {
                data: bubbleData,
                series: [
                    {
                        type: 'bubble',
                        xKey: 'x',
                        yKey: 'y',
                        sizeKey: 'size',
                        size: 6,
                        maxSize: 30,
                        selection: { enabled: true },
                    },
                ],
                selection: { enabled: true },
                axes: {
                    x: { type: 'number', position: 'bottom' },
                    y: { type: 'number', position: 'left' },
                },
            };

            prepareEnterpriseTestOptions(options);
            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            const seriesId = deproxy(chart).series[0].id;
            const dataSet = deproxy(chart).series[0].data!;

            const itemIds = [0, 1, 2].map((i) => dataSet.getItemIdFromIndex(i));
            chart.setSelection(itemIds.map((itemId) => ({ seriesId, itemId })));

            const selectedItems = [...chart.getSelection()];
            expect(selectedItems).toHaveLength(3);
            expect(selectedItems.every((item) => item.seriesId === seriesId)).toBe(true);
        });

        it('should clear selection via clearSelection', async () => {
            const options: AgCartesianChartOptions = {
                data: bubbleData,
                series: [
                    {
                        type: 'bubble',
                        xKey: 'x',
                        yKey: 'y',
                        sizeKey: 'size',
                        size: 6,
                        maxSize: 30,
                        selection: { enabled: true },
                    },
                ],
                selection: { enabled: true },
                axes: {
                    x: { type: 'number', position: 'bottom' },
                    y: { type: 'number', position: 'left' },
                },
            };

            prepareEnterpriseTestOptions(options);
            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            const seriesId = deproxy(chart).series[0].id;
            const dataSet = deproxy(chart).series[0].data!;

            chart.setSelection([{ seriesId, itemId: dataSet.getItemIdFromIndex(0) }]);
            expect([...chart.getSelection()]).toHaveLength(1);

            chart.clearSelection();
            expect([...chart.getSelection()]).toHaveLength(0);
        });
    });

    describe('bubble series — aggregated selection', () => {
        // Use a small maxRenderedItems to force aggregation with a manageable dataset
        const aggregatedData = Array.from({ length: 20 }, (_, i) => ({
            x: i % 5,
            y: Math.floor(i / 5),
            size: 1 + (i % 4),
        }));

        it('should expand aggregated bucket indices when selecting an aggregated marker', async () => {
            const options: AgCartesianChartOptions = {
                data: aggregatedData,
                series: [
                    {
                        type: 'bubble',
                        xKey: 'x',
                        yKey: 'y',
                        sizeKey: 'size',
                        size: 5,
                        maxSize: 20,
                        maxRenderedItems: 8,
                        selection: { enabled: true },
                    },
                ],
                selection: { enabled: true },
                axes: {
                    x: { type: 'number', position: 'bottom' },
                    y: { type: 'number', position: 'left' },
                },
            };

            prepareEnterpriseTestOptions(options);
            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            const series = deproxy(chart).series[0] as any;
            expect(series.dataAggregation).toBeDefined();

            const reader = series.getAggregateIndexSetReader();
            expect(reader).toBeDefined();

            const aggregateIndexSet: Map<number, number[]> = series.aggregateIndexSet;
            expect(aggregateIndexSet).toBeDefined();

            const seriesId = series.id;
            const dataSet = series.data!;

            const multiBucketPrimaries = [...aggregateIndexSet.entries()].filter(([, indices]) => indices.length > 1);
            expect(multiBucketPrimaries.length).toBeGreaterThan(0);

            const [primaryDatumIndex, expectedIndices] = multiBucketPrimaries[0];

            const expandedIndices = reader!(primaryDatumIndex);
            expect(expandedIndices).toBeDefined();
            expect([...expandedIndices!]).toEqual(expect.arrayContaining(expectedIndices));
            expect([...expandedIndices!]).toHaveLength(expectedIndices.length);

            const itemsToSelect = expectedIndices.map((idx) => ({
                seriesId,
                itemId: dataSet.getItemIdFromIndex(idx),
            }));
            expect(itemsToSelect.length).toBeGreaterThan(0);

            chart.setSelection(itemsToSelect);
            const selected = [...chart.getSelection()];
            expect(selected).toHaveLength(itemsToSelect.length);
        });

        it('should render aggregated bubble chart with selection styling after selecting multiple items', async () => {
            const options: AgCartesianChartOptions = {
                data: aggregatedData,
                series: [
                    {
                        type: 'bubble',
                        xKey: 'x',
                        yKey: 'y',
                        sizeKey: 'size',
                        size: 5,
                        maxSize: 20,
                        maxRenderedItems: 8,
                        selection: {
                            enabled: true,
                            selectedItem: { fill: 'deepskyblue', strokeWidth: 3 },
                            unselectedItem: { fillOpacity: 0.2 },
                        },
                    },
                ],
                selection: { enabled: true },
                axes: {
                    x: { type: 'number', position: 'bottom' },
                    y: { type: 'number', position: 'left' },
                },
            };

            prepareEnterpriseTestOptions(options);
            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            const seriesId = deproxy(chart).series[0].id;
            const dataSet = deproxy(chart).series[0].data!;

            const itemsToSelect = Array.from({ length: 5 }, (_, i) => ({
                seriesId,
                itemId: dataSet.getItemIdFromIndex(i),
            }));

            chart.setSelection(itemsToSelect);
            await compare();
        });

        it('drag-select over all markers fans out to underlying bucket indices via onSeriesAreaDragEnd', async () => {
            // A full-area drag must select more items than rendered markers, proving fan-out.
            const options: AgCartesianChartOptions = {
                data: aggregatedData,
                series: [
                    {
                        type: 'bubble',
                        xKey: 'x',
                        yKey: 'y',
                        sizeKey: 'size',
                        size: 5,
                        maxSize: 20,
                        maxRenderedItems: 8,
                        selection: { enabled: true },
                    },
                ],
                selection: { enabled: true, enableDrag: true },
                axes: {
                    x: { type: 'number', position: 'bottom' },
                    y: { type: 'number', position: 'left' },
                },
            };

            prepareEnterpriseTestOptions(options);
            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            const series = deproxy(chart).series[0] as any;
            expect(series.dataAggregation).toBeDefined();

            const aggregateIndexSet: Map<number, number[]> = series.aggregateIndexSet;
            expect(aggregateIndexSet).toBeDefined();
            const renderedMarkerCount = series.contextNodeData?.nodeData?.length ?? 0;
            expect(renderedMarkerCount).toBeGreaterThan(0);
            expect(renderedMarkerCount).toBeLessThan(aggregatedData.length);

            // Inset the drag within the series area so it doesn't clip axes.
            const seriesRect = (deproxy(chart) as any).seriesAreaManager?.seriesRect;
            expect(seriesRect).toBeDefined();
            const x0 = Math.ceil(seriesRect.x) + 2;
            const y0 = Math.ceil(seriesRect.y) + 2;
            const x1 = Math.floor(seriesRect.x + seriesRect.width) - 2;
            const y1 = Math.floor(seriesRect.y + seriesRect.height) - 2;

            await dragAction({ x: x0, y: y0 }, { x: x1, y: y1 })(chart);
            await waitForChartStability(chart);

            expect([...chart.getSelection()].length).toBeGreaterThan(renderedMarkerCount);
        });
    });

    describe('scatter series — selection (inherits from BubbleSeries)', () => {
        it('should support getSelection/setSelection on scatter series', async () => {
            const scatterData = [
                { x: 10, y: 20 },
                { x: 20, y: 10 },
                { x: 30, y: 40 },
                { x: 40, y: 30 },
                { x: 50, y: 50 },
            ];

            const options: AgCartesianChartOptions = {
                data: scatterData,
                series: [
                    {
                        type: 'scatter',
                        xKey: 'x',
                        yKey: 'y',
                        size: 15,
                        selection: { enabled: true },
                    },
                ],
                selection: { enabled: true },
                axes: {
                    x: { type: 'number', position: 'bottom' },
                    y: { type: 'number', position: 'left' },
                },
            };

            prepareEnterpriseTestOptions(options);
            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            const seriesId = deproxy(chart).series[0].id;
            const dataSet = deproxy(chart).series[0].data!;

            chart.setSelection([
                { seriesId, itemId: dataSet.getItemIdFromIndex(0) },
                { seriesId, itemId: dataSet.getItemIdFromIndex(1) },
            ]);

            const selected = [...chart.getSelection()];
            expect(selected).toHaveLength(2);
        });

        it('should return undefined from getAggregateIndexSetReader on scatter when no aggregation is active', async () => {
            const options: AgCartesianChartOptions = {
                data: [
                    { x: 1, y: 1 },
                    { x: 2, y: 2 },
                    { x: 3, y: 3 },
                ],
                series: [{ type: 'scatter', xKey: 'x', yKey: 'y', size: 10 }],
                axes: {
                    x: { type: 'number', position: 'bottom' },
                    y: { type: 'number', position: 'left' },
                },
            };

            prepareEnterpriseTestOptions(options);
            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            const series = deproxy(chart).series[0] as any;
            expect(series.dataAggregation).toBeUndefined();
            expect(series.getAggregateIndexSetReader()).toBeUndefined();
        });
    });
});
