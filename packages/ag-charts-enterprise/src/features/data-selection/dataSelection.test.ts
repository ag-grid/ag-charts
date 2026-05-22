import { afterEach, describe, expect, it } from 'vitest';

import {
    AgBubbleSeriesOptions,
    type AgCartesianChartOptions,
    type AgChartInstance,
    type AgChartOptions,
    AgCharts,
    type AgErrorBarItemStylerParams,
    AgInitialStateZoomOptions,
    AgSelectionChangeEvent,
    AgSelectionItem,
} from 'ag-charts-community';
import {
    IMAGE_SNAPSHOT_DEFAULTS,
    MockSelectionChangeListener,
    clickAction,
    delay,
    deproxy,
    dragAction,
    extractImageData,
    getSeriesAggregationInternals,
    mouseDownAction,
    mouseMoveAction,
    mouseUpAction,
    newFreezableMockInferred,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
    withPreventDefault,
} from 'ag-charts-community-test';

import { prepareEnterpriseTestOptions } from '../../test/utils';

async function waitForUnhighlight() {
    // FIXME: SeriesAreaManager.handleHoverHighlight clears highlight with delay = true, but Chart.waitForUpdate
    // does not wait for this update.
    await delay(200);
}

function uiChangeEvent<D, C>(partial: { added: AgSelectionItem<D>[]; removed: AgSelectionItem<D>[] }) {
    const { added, removed } = partial;
    return withPreventDefault<AgSelectionChangeEvent<D, C>>({
        added,
        removed,
        source: 'user-interaction',
        type: 'selectionChange',
    });
}

type SelectionChangeRecorder<D, C> = {
    (ev: AgSelectionChangeEvent<D, C>): void;
    popEvents(): AgSelectionChangeEvent<D, C>[];
};

function createSelectionChangeRecorder<D, C>(): SelectionChangeRecorder<D, C> {
    let events: AgSelectionChangeEvent<D, C>[] = [];

    const freezeable = newFreezableMockInferred<MockSelectionChangeListener<D, C>>(
        (ev: AgSelectionChangeEvent<D, C>) => {
            events.push(ev);
        }
    );

    const recorder: SelectionChangeRecorder<D, C> = (ev) => freezeable.mock(ev);
    recorder.popEvents = () => {
        const result = events;
        events = [];
        return result;
    };

    return recorder;
}

type StackMixDatum =
    | { cat: 'A' | 'B' | 'C' | 'D' | 'E'; s1: number; s2: number; s3: number; s4?: never; s5?: never; s6: number }
    | { cat: 'A' | 'B' | 'C' | 'D' | 'E'; s1?: never; s2?: never; s3?: never; s4: number; s5?: never; s6?: never }
    | { cat: 'A' | 'B' | 'C' | 'D' | 'E'; s1?: never; s2?: never; s3?: never; s4?: never; s5: number; s6?: never };
function createBarStackMixOptions(): AgCartesianChartOptions<StackMixDatum, unknown> {
    return {
        data: [
            { cat: 'A', s1: 5, s2: 3, s3: 7, s6: 3 },
            { cat: 'B', s1: 6, s2: 4, s3: 2, s6: 4 },
            { cat: 'C', s1: 4, s2: 2, s3: 6, s6: 5 },
            { cat: 'D', s1: 7, s2: 5, s3: 3, s6: 3 },
            { cat: 'E', s1: 3, s2: 6, s3: 4, s6: 2 },
        ],
        series: [
            // First 2 series (stacked, using root data)
            {
                id: 's1id',
                type: 'bar',
                xKey: 'cat',
                yKey: 's1',
                stacked: true,
            },
            {
                id: 's2id',
                type: 'bar',
                xKey: 'cat',
                yKey: 's2',
                stacked: true,
            },
            // Third series (solo, using root data)
            {
                id: 's3id',
                type: 'bar',
                xKey: 'cat',
                yKey: 's3',
                stacked: false,
            },
            // Fourth & Fifth series (stacked together, own data)
            {
                id: 's4id',
                type: 'bar',
                xKey: 'cat',
                yKey: 's4',
                stacked: true,
                data: [
                    { cat: 'A', s4: 2 },
                    { cat: 'B', s4: 3 },
                    { cat: 'C', s4: 1 },
                    { cat: 'D', s4: 4 },
                    { cat: 'E', s4: 2 },
                ],
            },
            {
                id: 's5id',
                type: 'bar',
                xKey: 'cat',
                yKey: 's5',
                stacked: true,
                data: [
                    { cat: 'A', s5: 1 },
                    { cat: 'B', s5: 2 },
                    { cat: 'C', s5: 3 },
                    { cat: 'D', s5: 2 },
                    { cat: 'E', s5: 1 },
                ],
            },
            // Sixth series (non-selectable)
            {
                id: 's6id',
                type: 'bar',
                xKey: 'cat',
                yKey: 's6',
                stacked: true,
                selection: { enabled: false },
            },
        ],
        axes: {
            // Disable the axes features that we are not testing:
            x: {
                crosshair: { enabled: false },
                gridLine: { enabled: false },
                label: { enabled: false },
            },
            y: {
                crosshair: { enabled: false },
                gridLine: { enabled: false },
                label: { enabled: false },
            },
        },
        // Disable the legend (we're not testing that):
        legend: { enabled: false },
        theme: {
            overrides: {
                bar: {
                    series: {
                        label: {
                            enabled: true,
                            placement: 'inside-center',
                            formatter: (p) => {
                                return `${p.yKey}${p.datum.cat}`.toUpperCase();
                            },
                            itemStyler: () => {
                                return { color: 'black' };
                            },
                        },
                        selection: {
                            // Make selected items in the image snapshots more obvious by increasing strokeWidth
                            selectedItem: {
                                strokeWidth: 5,
                            },
                        },
                    },
                },
            },
        },
    };
}

type BioDatum = { height: number; weight: number; age: number };
function createBubbleBioStatOptions(): { data: BioDatum[]; series: [AgBubbleSeriesOptions<BioDatum>] } {
    return {
        data: [
            { height: 152, weight: 48, age: 22 },
            { height: 158, weight: 50, age: 19 },
            { height: 161, weight: 58, age: 42 },
            { height: 163, weight: 60, age: 31 },
            { height: 165, weight: 62, age: 48 },
            { height: 166, weight: 65, age: 55 },
            { height: 168, weight: 63, age: 39 },
            { height: 169, weight: 68, age: 45 },
            { height: 170, weight: 72, age: 52 },
            { height: 172, weight: 64, age: 30 },
            { height: 173, weight: 70, age: 41 },
            { height: 174, weight: 68, age: 34 },
            { height: 176, weight: 60, age: 21 },
            { height: 177, weight: 67, age: 28 },
            { height: 178, weight: 80, age: 53 },
            { height: 179, weight: 85, age: 59 },
            { height: 180, weight: 66, age: 22 },
            { height: 181, weight: 78, age: 46 },
            { height: 182, weight: 76, age: 38 },
            { height: 183, weight: 73, age: 27 },
            { height: 188, weight: 76, age: 26 },
            { height: 189, weight: 78, age: 33 },
            { height: 190, weight: 95, age: 65 },
            { height: 191, weight: 86, age: 47 },
            { height: 192, weight: 80, age: 31 },
            { height: 193, weight: 98, age: 64 },
            { height: 160, weight: 75, age: 58 },
            { height: 170, weight: 58, age: 19 },
            { height: 180, weight: 60, age: 18 },
            { height: 190, weight: 70, age: 21 },
        ],
        series: [
            {
                type: 'bubble',
                xKey: 'height',
                yKey: 'weight',
                sizeKey: 'age',
                highlight: { enabled: false },
            },
        ],
    };
}

describe('DataSelection', () => {
    setupMockConsole();

    const compare = async (defaults = IMAGE_SNAPSHOT_DEFAULTS) => {
        await waitForChartStability(chart);
        const imageData = extractImageData(ctx);
        expect(imageData).toMatchImageSnapshot(defaults);
    };

    const compareExact = async (name: string) => {
        await compare({
            ...IMAGE_SNAPSHOT_DEFAULTS,
            customSnapshotIdentifier: name,
            customDiffConfig: { threshold: 0 },
        });
    };

    type CanvasPoint = { readonly canvasX: number; readonly canvasY: number };
    type Modifiers = { altKey?: true; shiftKey?: true; ctrlKey?: true; metaKey?: true };
    const [altKey, shiftKey, ctrlKey, metaKey] = [true, true, true, true] as const;

    async function mouseClick(point: CanvasPoint, modifiers?: Modifiers) {
        await clickAction(point.canvasX, point.canvasY, modifiers)(chart);
        await waitForChartStability(chart);
    }
    async function mouseDown(point: CanvasPoint, modifiers?: Modifiers) {
        await mouseDownAction(point.canvasX, point.canvasY, modifiers)(chart);
        await waitForChartStability(chart);
    }
    async function mouseMove(point: CanvasPoint, modifiers?: Modifiers) {
        await mouseMoveAction(point.canvasX, point.canvasY, modifiers)(chart);
        await waitForChartStability(chart);
    }
    async function mouseUp(point: CanvasPoint, modifiers?: Modifiers) {
        await mouseUpAction(point.canvasX, point.canvasY, modifiers)(chart);
        await waitForChartStability(chart);
    }

    function getChartSelectionArray() {
        expect(chart).toBeDefined();
        return Array.from(chart.getSelection());
    }

    function getChartZoomState() {
        expect(chart).toBeDefined();
        const { zoom } = chart.getState();
        expect(zoom).toBeDefined();
        return zoom!;
    }

    async function createChartInstance<T extends AgChartOptions<any, any>>(opts: T) {
        opts = prepareEnterpriseTestOptions(opts);
        const result = AgCharts.create(opts);
        await waitForChartStability(result);
        return result;
    }

    let chart: AgChartInstance;
    const ctx = setupMockCanvas();

    afterEach(async () => {
        if (chart) {
            await waitForChartStability(chart);
            chart.destroy();
            (chart as unknown) = undefined;
        }
    });

    describe('bubble series — non-aggregated selection', () => {
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
                            selectedItem: { fill: '#ff0000', stroke: '#990000', strokeWidth: 4 },
                            unselectedItem: { fillOpacity: 0.08, strokeOpacity: 0.15 },
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

            const series = getSeriesAggregationInternals(chart);
            expect(series.dataAggregation).toBeDefined();

            const bucketLookup = series.ensureBucketLookupFeature();
            expect(bucketLookup).toBeDefined();

            const aggregateIndexSet = series.aggregateIndexSet;
            expect(aggregateIndexSet).toBeDefined();

            const seriesId = series.id;
            const dataSet = series.data!;

            const multiBucketPrimaries = [...aggregateIndexSet!.entries()].filter(([, indices]) => indices.length > 1);
            expect(multiBucketPrimaries.length).toBeGreaterThan(0);

            const [primaryDatumIndex, expectedIndices] = multiBucketPrimaries[0];

            const expandedIndices = bucketLookup!.getIndexSet(primaryDatumIndex);
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
                            selectedItem: { fill: '#0066ff', stroke: '#003399', strokeWidth: 4 },
                            unselectedItem: { fillOpacity: 0.08, strokeOpacity: 0.15 },
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

            const series = getSeriesAggregationInternals(chart);
            expect(series.dataAggregation).toBeDefined();

            const aggregateIndexSet = series.aggregateIndexSet;
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

        it('should return an undefined index set on scatter when no aggregation is active', async () => {
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

            const series = getSeriesAggregationInternals(chart);
            expect(series.dataAggregation).toBeUndefined();
            expect(series.ensureBucketLookupFeature()?.getIndexSet(0)).toBeUndefined();
        });
    });

    describe('error-bar selection styling', () => {
        const monthsData = [
            { month: 'Jan', t: 12.5, lo: 10, hi: 15 },
            { month: 'Feb', t: 13, lo: 11.5, hi: 15.5 },
            { month: 'Mar', t: 15.5, lo: 13, hi: 18 },
            { month: 'Apr', t: 18, lo: 16.5, hi: 19.5 },
            { month: 'May', t: 21.5, lo: 19, hi: 24 },
            { month: 'Jun', t: 24, lo: 22.5, hi: 26 },
        ];
        const colderData = monthsData.map((d) => ({ ...d, t: d.t - 5, lo: d.lo - 5, hi: d.hi - 5 }));

        const errorBarStyler = (param: AgErrorBarItemStylerParams<unknown>) => {
            return param.selectionState === 'selected-item'
                ? { stroke: 'steelblue', strokeWidth: 4, lineDash: [2, 1] }
                : {};
        };

        const buildOptions = (
            series: NonNullable<AgCartesianChartOptions['series']>,
            listeners?: AgCartesianChartOptions['listeners']
        ): AgCartesianChartOptions => {
            const options: AgCartesianChartOptions = {
                series,
                selection: { enabled: true },
                listeners,
                axes: {
                    x: { type: 'category', position: 'bottom' },
                    y: { type: 'number', position: 'left' },
                },
            };
            prepareEnterpriseTestOptions(options);
            return options;
        };

        const lineSeries = (
            data: any[],
            yName: string,
            selectionStyle: any
        ): NonNullable<AgCartesianChartOptions['series']>[number] => ({
            type: 'line',
            data,
            xKey: 'month',
            yKey: 't',
            yName,
            errorBar: { yLowerKey: 'lo', yUpperKey: 'hi', itemStyler: errorBarStyler },
            selection: { enabled: true, selectedItem: selectionStyle },
        });

        it('renders error-bar selection styling on the selected datum', async () => {
            chart = AgCharts.create(
                buildOptions([lineSeries(monthsData, 'A', { stroke: 'steelblue', strokeWidth: 3 })])
            );
            await waitForChartStability(chart);

            const seriesId = deproxy(chart).series[0].id;
            const itemId = deproxy(chart).series[0].data!.getItemIdFromIndex(2);
            chart.setSelection([{ seriesId, itemId }]);
            await compare();
        });

        it('rolls back error-bar selection styling when selectionChange listener calls preventDefault', async () => {
            chart = AgCharts.create(
                buildOptions([lineSeries(monthsData, 'A', { stroke: 'steelblue', strokeWidth: 3 })], {
                    selectionChange: (event) => event.preventDefault(),
                })
            );
            await waitForChartStability(chart);

            const seriesId = deproxy(chart).series[0].id;
            const itemId = deproxy(chart).series[0].data!.getItemIdFromIndex(2);
            chart.setSelection([{ seriesId, itemId }]);
            await waitForChartStability(chart);

            // No items selected — preventDefault rolled back the change.
            expect([...chart.getSelection()]).toHaveLength(0);
            await compare();
        });

        it('clears error-bar styling on series A when single-selecting on series B', async () => {
            chart = AgCharts.create(
                buildOptions([
                    lineSeries(monthsData, 'A', { stroke: 'steelblue', strokeWidth: 4 }),
                    lineSeries(colderData, 'B', { stroke: 'crimson', strokeWidth: 4 }),
                ])
            );
            await waitForChartStability(chart);

            const seriesA = deproxy(chart).series[0];
            const seriesB = deproxy(chart).series[1];

            chart.setSelection([{ seriesId: seriesA.id, itemId: seriesA.data!.getItemIdFromIndex(2) }]);
            await waitForChartStability(chart);

            // Series B's selection replaces series A's — A's error-bar styling
            // must clear, B's must apply.
            chart.setSelection([{ seriesId: seriesB.id, itemId: seriesB.data!.getItemIdFromIndex(4) }]);
            await waitForChartStability(chart);

            const selected = [...chart.getSelection()];
            expect(selected).toHaveLength(1);
            expect(selected[0].seriesId).toBe(seriesB.id);
            await compare();
        });
    });

    describe('click', () => {
        describe('bar', () => {
            type D = StackMixDatum;
            type C = unknown;
            let selectionChange: SelectionChangeRecorder<D, C>;

            const POINT_MISS1: CanvasPoint = { canvasX: 141, canvasY: 120 }; // inside series-area
            const POINT_MISS2: CanvasPoint = { canvasX: 681, canvasY: 594 }; // outside series-area
            const POINT_S1D: CanvasPoint = { canvasX: 521, canvasY: 497 };
            const POINT_S2A: CanvasPoint = { canvasX: 74, canvasY: 430 };
            const POINT_S3C: CanvasPoint = { canvasX: 433, canvasY: 520 };
            const POINT_S4E: CanvasPoint = { canvasX: 680, canvasY: 355 };
            const POINT_S5D: CanvasPoint = { canvasX: 531, canvasY: 196 };
            const POINT_S6B: CanvasPoint = { canvasX: 219, canvasY: 203 };
            const POINT_S6C: CanvasPoint = { canvasX: 371, canvasY: 299 };

            const DATUM_S1D: D = { cat: 'D', s1: 7, s2: 5, s3: 3, s6: 3 };
            const DATUM_S2A: D = { cat: 'A', s1: 5, s2: 3, s3: 7, s6: 3 };
            const DATUM_S3C: D = { cat: 'C', s1: 4, s2: 2, s3: 6, s6: 5 };
            const DATUM_S4E: D = { cat: 'E', s4: 2 };
            const DATUM_S5D: D = { cat: 'D', s5: 2 };
            const SELECTION_S1D: [AgSelectionItem<D>] = [{ itemId: 3, seriesId: 's1id', datum: DATUM_S1D }];
            const SELECTION_S2A: [AgSelectionItem<D>] = [{ itemId: 0, seriesId: 's2id', datum: DATUM_S2A }];
            const SELECTION_S3C: [AgSelectionItem<D>] = [{ itemId: 2, seriesId: 's3id', datum: DATUM_S3C }];
            const SELECTION_S4E: [AgSelectionItem<D>] = [{ itemId: 4, seriesId: 's4id', datum: DATUM_S4E }];
            const SELECTION_S5D: [AgSelectionItem<D>] = [{ itemId: 3, seriesId: 's5id', datum: DATUM_S5D }];
            const SELECTION_S3C_S4E = [SELECTION_S3C[0], SELECTION_S4E[0]];
            const SELECTION_S2A_S3C_S4E = [SELECTION_S2A[0], SELECTION_S3C[0], SELECTION_S4E[0]];
            const SELECTION_S2A_S3C_S1D_S4E = [SELECTION_S2A[0], SELECTION_S3C[0], SELECTION_S1D[0], SELECTION_S4E[0]];
            const SELECTION_S2A_S3C_S4E_S5D = [SELECTION_S2A[0], SELECTION_S3C[0], SELECTION_S4E[0], SELECTION_S5D[0]];

            const ADDED_S1D = uiChangeEvent<D, C>({ added: SELECTION_S1D, removed: [] });
            const ADDED_S2A = uiChangeEvent<D, C>({ added: SELECTION_S2A, removed: [] });
            const ADDED_S3C = uiChangeEvent<D, C>({ added: SELECTION_S3C, removed: [] });
            const ADDED_S4E = uiChangeEvent<D, C>({ added: SELECTION_S4E, removed: [] });
            const ADDED_S5D = uiChangeEvent<D, C>({ added: SELECTION_S5D, removed: [] });
            const REMOVED_S2A = uiChangeEvent<D, C>({ added: [], removed: SELECTION_S2A });
            const REMOVED_S3C_S4E = uiChangeEvent<D, C>({ added: [], removed: SELECTION_S3C_S4E });
            const REMOVED_S2A_S3C_S4E = uiChangeEvent<D, C>({ added: [], removed: SELECTION_S2A_S3C_S4E });
            const ADDED_S1D_REMOVED_S2A_S3C_S4E = uiChangeEvent<D, C>({
                added: SELECTION_S1D,
                removed: SELECTION_S2A_S3C_S4E,
            });

            describe('single', () => {
                beforeEach(async () => {
                    const { data, series, axes, theme, legend } = createBarStackMixOptions();
                    selectionChange = createSelectionChangeRecorder();
                    chart = await createChartInstance({
                        data,
                        series,
                        axes,
                        theme,
                        legend,
                        selection: {
                            enabled: true,
                            clickMode: 'single',
                        },
                        listeners: { selectionChange },
                    });
                });

                describe('select 3 points', () => {
                    beforeEach(async () => {
                        await mouseClick(POINT_S2A);
                        await mouseClick(POINT_S3C, { ctrlKey });
                        await mouseClick(POINT_S4E, { ctrlKey });
                    });
                    describe('initial', () => {
                        test('screenshot', async () => {
                            await compareExact('stack-mix-highlighted-s4e-selected-s2a-s3c-s4e');
                        });
                        test('getSelection', () => {
                            expect(getChartSelectionArray()).toEqual(SELECTION_S2A_S3C_S4E);
                        });
                        test('selectionChange', () => {
                            expect(selectionChange.popEvents()).toEqual([ADDED_S2A, ADDED_S3C, ADDED_S4E]);
                        });
                    });
                    describe('follow-up', () => {
                        beforeEach(() => {
                            selectionChange.popEvents(); // pop event of initial selection.
                        });
                        describe('miss1', () => {
                            test('screenshot', async () => {
                                await mouseClick(POINT_MISS1);
                                await compareExact('stack-mix-highlighted-none-selected-none');
                            });
                            test('getSelection', async () => {
                                await mouseClick(POINT_MISS1);
                                expect(getChartSelectionArray()).toEqual([]);
                            });
                            test('selectionChange', async () => {
                                await mouseClick(POINT_MISS1);
                                expect(selectionChange.popEvents()).toEqual([REMOVED_S2A_S3C_S4E]);
                            });
                        });
                        describe.skip('miss2', () => {
                            // Skipped: it's unclear what the required are when clicking outside series-area
                            test('screenshot', async () => {
                                await mouseClick(POINT_MISS2);
                                await compareExact('stack-mix-highlighted-none-selected-none');
                            });
                            test('getSelection', async () => {
                                await mouseClick(POINT_MISS2);
                                expect(getChartSelectionArray()).toEqual([]);
                            });
                            test('selectionChange', async () => {
                                await mouseClick(POINT_MISS2);
                                expect(selectionChange.popEvents()).toEqual([REMOVED_S2A_S3C_S4E]);
                            });
                        });
                        describe('ctrl-miss1', () => {
                            test('screenshot', async () => {
                                await mouseClick(POINT_MISS1, { ctrlKey });
                                await waitForUnhighlight();
                                await compareExact('stack-mix-highlighted-none-selected-s2a-s3c-s4e');
                            });
                            test('getSelection', async () => {
                                await mouseClick(POINT_MISS1, { ctrlKey });
                                expect(getChartSelectionArray()).toEqual(SELECTION_S2A_S3C_S4E);
                            });
                            test('selectionChange', async () => {
                                await mouseClick(POINT_MISS1, { ctrlKey });
                                expect(selectionChange.popEvents()).toEqual([]);
                            });
                        });
                        describe('meta-miss1', () => {
                            test('screenshot', async () => {
                                await mouseClick(POINT_MISS1, { metaKey });
                                await waitForUnhighlight();
                                await compareExact('stack-mix-highlighted-none-selected-s2a-s3c-s4e');
                            });
                            test('getSelection', async () => {
                                await mouseClick(POINT_MISS1, { metaKey });
                                expect(getChartSelectionArray()).toEqual(SELECTION_S2A_S3C_S4E);
                            });
                            test('selectionChange', async () => {
                                await mouseClick(POINT_MISS1, { metaKey });
                                expect(selectionChange.popEvents()).toEqual([]);
                            });
                        });
                        describe('click selection-disabled series', () => {
                            test('screenshot', async () => {
                                await mouseClick(POINT_S6B);
                                await compareExact('stack-mix-highlighted-s6b-selected-none');
                            });
                            test('getSelection', async () => {
                                await mouseClick(POINT_S6B);
                                expect(getChartSelectionArray()).toEqual([]);
                            });
                            test('selectionChange', async () => {
                                await mouseClick(POINT_S6B);
                                expect(selectionChange.popEvents()).toEqual([REMOVED_S2A_S3C_S4E]);
                            });
                        });
                        describe('ctrl-click selection-disabled series', () => {
                            test('screenshot', async () => {
                                await mouseMove(POINT_S6C);
                                await mouseClick(POINT_S6C, { ctrlKey });
                                await compareExact('stack-mix-highlighted-s6c-selected-s2a-s3c-s4e');
                            });
                            test('getSelection', async () => {
                                await mouseClick(POINT_S6C, { ctrlKey });
                                expect(getChartSelectionArray()).toEqual(SELECTION_S2A_S3C_S4E);
                            });
                            test('selectionChange', async () => {
                                await mouseClick(POINT_S6C, { ctrlKey });
                                expect(selectionChange.popEvents()).toEqual([]);
                            });
                        });
                        describe('meta-click selection-disabled series', () => {
                            test('screenshot', async () => {
                                await mouseMove(POINT_S6B);
                                await mouseClick(POINT_S6B, { metaKey });
                                await compareExact('stack-mix-highlighted-s6b-selected-s2a-s3c-s4e');
                            });
                            test('getSelection', async () => {
                                await mouseClick(POINT_S6B, { metaKey });
                                expect(getChartSelectionArray()).toEqual(SELECTION_S2A_S3C_S4E);
                            });
                            test('selectionChange', async () => {
                                await mouseClick(POINT_S6B, { metaKey });
                                expect(selectionChange.popEvents()).toEqual([]);
                            });
                        });
                        describe('click selection-enabled series', () => {
                            test('screenshot', async () => {
                                await mouseClick(POINT_S1D);
                                await compareExact('stack-mix-highlighted-s1d-selected-s1d');
                            });
                            test('getSelection', async () => {
                                await mouseClick(POINT_S1D);
                                expect(getChartSelectionArray()).toEqual(SELECTION_S1D);
                            });
                            test('selectionChange', async () => {
                                await mouseClick(POINT_S1D);
                                expect(selectionChange.popEvents()).toEqual([ADDED_S1D_REMOVED_S2A_S3C_S4E]);
                            });
                        });
                        describe('ctrl-click selection-enabled series', () => {
                            test('screenshot', async () => {
                                await mouseClick(POINT_S1D, { ctrlKey });
                                await compareExact('stack-mix-highlighted-s1d-selected-s2a-s3c-s1d-s4e');
                            });
                            test('getSelection', async () => {
                                await mouseClick(POINT_S1D, { ctrlKey });
                                expect(getChartSelectionArray()).toEqual(SELECTION_S2A_S3C_S1D_S4E);
                            });
                            test('selectionChange', async () => {
                                await mouseClick(POINT_S1D, { ctrlKey });
                                expect(selectionChange.popEvents()).toEqual([ADDED_S1D]);
                            });
                        });
                        describe('meta-click selection-enabled series', () => {
                            test('screenshot', async () => {
                                await mouseClick(POINT_S5D, { metaKey });
                                await compareExact('stack-mix-highlighted-s5d-selected-s2a-s3c-s4e-s5d');
                            });
                            test('getSelection', async () => {
                                await mouseClick(POINT_S5D, { metaKey });
                                expect(getChartSelectionArray()).toEqual(SELECTION_S2A_S3C_S4E_S5D);
                            });
                            test('selectionChange', async () => {
                                await mouseClick(POINT_S5D, { metaKey });
                                expect(selectionChange.popEvents()).toEqual([ADDED_S5D]);
                            });
                        });
                        describe('click selected', () => {
                            test('screenshot', async () => {
                                await mouseClick(POINT_S2A);
                                await compareExact('stack-mix-highlighted-s2a-selected-s2a');
                            });
                            test('getSelection', async () => {
                                await mouseClick(POINT_S2A);
                                expect(getChartSelectionArray()).toEqual(SELECTION_S2A);
                            });
                            test('selectionChange', async () => {
                                await mouseClick(POINT_S2A);
                                expect(selectionChange.popEvents()).toEqual([REMOVED_S3C_S4E]);
                            });
                        });
                        describe('ctrl-click selected', () => {
                            test('screenshot', async () => {
                                await mouseClick(POINT_S2A, { ctrlKey });
                                await compareExact('stack-mix-highlighted-s2a-selected-s3c-s4e');
                            });
                            test('getSelection', async () => {
                                await mouseClick(POINT_S2A, { ctrlKey });
                                expect(getChartSelectionArray()).toEqual(SELECTION_S3C_S4E);
                            });
                            test('selectionChange', async () => {
                                await mouseClick(POINT_S2A, { ctrlKey });
                                expect(selectionChange.popEvents()).toEqual([REMOVED_S2A]);
                            });
                        });
                        describe('meta-click selected', () => {
                            test('screenshot', async () => {
                                await mouseClick(POINT_S2A, { metaKey });
                                await compareExact('stack-mix-highlighted-s2a-selected-s3c-s4e');
                            });
                            test('getSelection', async () => {
                                await mouseClick(POINT_S2A, { metaKey });
                                expect(getChartSelectionArray()).toEqual(SELECTION_S3C_S4E);
                            });
                            test('selectionChange', async () => {
                                await mouseClick(POINT_S2A, { metaKey });
                                expect(selectionChange.popEvents()).toEqual([REMOVED_S2A]);
                            });
                        });
                    });
                });
            });

            describe('multiple', () => {
                beforeEach(async () => {
                    const { data, series, axes, theme, legend } = createBarStackMixOptions();
                    selectionChange = createSelectionChangeRecorder();
                    chart = await createChartInstance({
                        data,
                        series,
                        axes,
                        theme,
                        legend,
                        selection: {
                            enabled: true,
                            clickMode: 'multiple',
                        },
                        listeners: { selectionChange },
                    });
                });

                describe('select 3 points', () => {
                    beforeEach(async () => {
                        await mouseClick(POINT_S2A);
                        await mouseClick(POINT_S3C);
                        await mouseClick(POINT_S4E);
                    });
                    describe('initial', () => {
                        test('screenshot', async () => {
                            await compareExact('stack-mix-highlighted-s4e-selected-s2a-s3c-s4e');
                        });
                        test('getSelection', () => {
                            expect(getChartSelectionArray()).toEqual(SELECTION_S2A_S3C_S4E);
                        });
                        test('selectionChange', () => {
                            expect(selectionChange.popEvents()).toEqual([ADDED_S2A, ADDED_S3C, ADDED_S4E]);
                        });
                    });
                    describe('follow-up', () => {
                        beforeEach(() => {
                            selectionChange.popEvents(); // pop event of initial selection.
                        });
                        describe('miss1', () => {
                            test('screenshot', async () => {
                                await mouseClick(POINT_MISS1);
                                await compareExact('stack-mix-highlighted-none-selected-none');
                            });
                            test('getSelection', async () => {
                                await mouseClick(POINT_MISS1);
                                expect(getChartSelectionArray()).toEqual([]);
                            });
                            test('selectionChange', async () => {
                                await mouseClick(POINT_MISS1);
                                expect(selectionChange.popEvents()).toEqual([REMOVED_S2A_S3C_S4E]);
                            });
                        });
                        describe('ctrl-miss1', () => {
                            test('screenshot', async () => {
                                await mouseClick(POINT_MISS1, { ctrlKey });
                                await waitForUnhighlight();
                                await compareExact('stack-mix-highlighted-none-selected-s2a-s3c-s4e');
                            });
                            test('getSelection', async () => {
                                await mouseClick(POINT_MISS1, { ctrlKey });
                                expect(getChartSelectionArray()).toEqual(SELECTION_S2A_S3C_S4E);
                            });
                            test('selectionChange', async () => {
                                await mouseClick(POINT_MISS1, { ctrlKey });
                                expect(selectionChange.popEvents()).toEqual([]);
                            });
                        });
                        describe('meta-miss1', () => {
                            test('screenshot', async () => {
                                await mouseClick(POINT_MISS1, { metaKey });
                                await waitForUnhighlight();
                                await compareExact('stack-mix-highlighted-none-selected-s2a-s3c-s4e');
                            });
                            test('getSelection', async () => {
                                await mouseClick(POINT_MISS1, { metaKey });
                                expect(getChartSelectionArray()).toEqual(SELECTION_S2A_S3C_S4E);
                            });
                            test('selectionChange', async () => {
                                await mouseClick(POINT_MISS1, { metaKey });
                                expect(selectionChange.popEvents()).toEqual([]);
                            });
                        });
                        describe('click selection-disabled series', () => {
                            test('screenshot', async () => {
                                await mouseClick(POINT_S6B);
                                await compareExact('stack-mix-highlighted-s6b-selected-none');
                            });
                            test('getSelection', async () => {
                                await mouseClick(POINT_S6B);
                                expect(getChartSelectionArray()).toEqual([]);
                            });
                            test('selectionChange', async () => {
                                await mouseClick(POINT_S6B);
                                expect(selectionChange.popEvents()).toEqual([REMOVED_S2A_S3C_S4E]);
                            });
                        });
                        describe('ctrl-click selection-disabled series', () => {
                            test('screenshot', async () => {
                                await mouseMove(POINT_S6C);
                                await mouseClick(POINT_S6C, { ctrlKey });
                                await compareExact('stack-mix-highlighted-s6c-selected-s2a-s3c-s4e');
                            });
                            test('getSelection', async () => {
                                await mouseClick(POINT_S6C, { ctrlKey });
                                expect(getChartSelectionArray()).toEqual(SELECTION_S2A_S3C_S4E);
                            });
                            test('selectionChange', async () => {
                                await mouseClick(POINT_S6C, { ctrlKey });
                                expect(selectionChange.popEvents()).toEqual([]);
                            });
                        });
                        describe('click selection-enabled series', () => {
                            test('screenshot', async () => {
                                await mouseClick(POINT_S1D, { ctrlKey });
                                await compareExact('stack-mix-highlighted-s1d-selected-s2a-s3c-s1d-s4e');
                            });
                            test('getSelection', async () => {
                                await mouseClick(POINT_S1D, { ctrlKey });
                                expect(getChartSelectionArray()).toEqual(SELECTION_S2A_S3C_S1D_S4E);
                            });
                            test('selectionChange', async () => {
                                await mouseClick(POINT_S1D, { ctrlKey });
                                expect(selectionChange.popEvents()).toEqual([ADDED_S1D]);
                            });
                        });
                        describe('ctrl-click selection-enabled series', () => {
                            test('screenshot', async () => {
                                await mouseClick(POINT_S1D, { ctrlKey });
                                await compareExact('stack-mix-highlighted-s1d-selected-s2a-s3c-s1d-s4e');
                            });
                            test('getSelection', async () => {
                                await mouseClick(POINT_S1D, { ctrlKey });
                                expect(getChartSelectionArray()).toEqual(SELECTION_S2A_S3C_S1D_S4E);
                            });
                            test('selectionChange', async () => {
                                await mouseClick(POINT_S1D, { ctrlKey });
                                expect(selectionChange.popEvents()).toEqual([ADDED_S1D]);
                            });
                        });
                        describe('meta-click selection-enabled series', () => {
                            test('screenshot', async () => {
                                await mouseClick(POINT_S5D, { metaKey });
                                await compareExact('stack-mix-highlighted-s5d-selected-s2a-s3c-s4e-s5d');
                            });
                            test('getSelection', async () => {
                                await mouseClick(POINT_S5D, { metaKey });
                                expect(getChartSelectionArray()).toEqual(SELECTION_S2A_S3C_S4E_S5D);
                            });
                            test('selectionChange', async () => {
                                await mouseClick(POINT_S5D, { metaKey });
                                expect(selectionChange.popEvents()).toEqual([ADDED_S5D]);
                            });
                        });
                        describe('click selected', () => {
                            test('screenshot', async () => {
                                await mouseClick(POINT_S2A, { ctrlKey });
                                await compareExact('stack-mix-highlighted-s2a-selected-s3c-s4e');
                            });
                            test('getSelection', async () => {
                                await mouseClick(POINT_S2A, { ctrlKey });
                                expect(getChartSelectionArray()).toEqual(SELECTION_S3C_S4E);
                            });
                            test('selectionChange', async () => {
                                await mouseClick(POINT_S2A, { ctrlKey });
                                expect(selectionChange.popEvents()).toEqual([REMOVED_S2A]);
                            });
                        });
                        describe('ctrl-click selected', () => {
                            test('screenshot', async () => {
                                await mouseClick(POINT_S2A, { ctrlKey });
                                await compareExact('stack-mix-highlighted-s2a-selected-s3c-s4e');
                            });
                            test('getSelection', async () => {
                                await mouseClick(POINT_S2A, { ctrlKey });
                                expect(getChartSelectionArray()).toEqual(SELECTION_S3C_S4E);
                            });
                            test('selectionChange', async () => {
                                await mouseClick(POINT_S2A, { ctrlKey });
                                expect(selectionChange.popEvents()).toEqual([REMOVED_S2A]);
                            });
                        });
                        describe('meta-click selected', () => {
                            test('screenshot', async () => {
                                await mouseClick(POINT_S2A, { metaKey });
                                await compareExact('stack-mix-highlighted-s2a-selected-s3c-s4e');
                            });
                            test('getSelection', async () => {
                                await mouseClick(POINT_S2A, { metaKey });
                                expect(getChartSelectionArray()).toEqual(SELECTION_S3C_S4E);
                            });
                            test('selectionChange', async () => {
                                await mouseClick(POINT_S2A, { metaKey });
                                expect(selectionChange.popEvents()).toEqual([REMOVED_S2A]);
                            });
                        });
                    });
                });
            });
        });
    });

    describe('drag modifiers', () => {
        describe('bubble', () => {
            type D = BioDatum;
            type C = unknown;
            let selectionChange: SelectionChangeRecorder<D, C>;

            describe('without module clash', () => {
                const POINT_A = { canvasX: 196, canvasY: 428 } as const;
                const POINT_B = { canvasX: 341, canvasY: 244 } as const;
                const POINT_C = { canvasX: 678, canvasY: 74 } as const;
                const POINT_D = { canvasX: 520, canvasY: 241 } as const;

                const SELECTION_AB: AgSelectionItem<D>[] = [
                    { datum: { age: 42, height: 161, weight: 58 }, itemId: 2, seriesId: 'BubbleSeries-1' },
                    { datum: { age: 31, height: 163, weight: 60 }, itemId: 3, seriesId: 'BubbleSeries-1' },
                    { datum: { age: 48, height: 165, weight: 62 }, itemId: 4, seriesId: 'BubbleSeries-1' },
                    { datum: { age: 55, height: 166, weight: 65 }, itemId: 5, seriesId: 'BubbleSeries-1' },
                    { datum: { age: 39, height: 168, weight: 63 }, itemId: 6, seriesId: 'BubbleSeries-1' },
                    { datum: { age: 45, height: 169, weight: 68 }, itemId: 7, seriesId: 'BubbleSeries-1' },
                    { datum: { age: 52, height: 170, weight: 72 }, itemId: 8, seriesId: 'BubbleSeries-1' },
                    { datum: { age: 58, height: 160, weight: 75 }, itemId: 26, seriesId: 'BubbleSeries-1' },
                    { datum: { age: 19, height: 170, weight: 58 }, itemId: 27, seriesId: 'BubbleSeries-1' },
                ];
                const SELECTION_CD: AgSelectionItem<D>[] = [
                    { datum: { age: 38, height: 182, weight: 76 }, itemId: 18, seriesId: 'BubbleSeries-1' },
                    { datum: { age: 26, height: 188, weight: 76 }, itemId: 20, seriesId: 'BubbleSeries-1' },
                    { datum: { age: 33, height: 189, weight: 78 }, itemId: 21, seriesId: 'BubbleSeries-1' },
                    { datum: { age: 65, height: 190, weight: 95 }, itemId: 22, seriesId: 'BubbleSeries-1' },
                    { datum: { age: 47, height: 191, weight: 86 }, itemId: 23, seriesId: 'BubbleSeries-1' },
                    { datum: { age: 31, height: 192, weight: 80 }, itemId: 24, seriesId: 'BubbleSeries-1' },
                ];
                const SELECTION_ABCD: AgSelectionItem<D>[] = [...SELECTION_AB, ...SELECTION_CD].sort(
                    (a, b) => (a.itemId as number) - (b.itemId as number)
                );

                const AB_ADDED = uiChangeEvent<D, C>({ removed: [], added: SELECTION_AB });
                const CD_ADDED = uiChangeEvent<D, C>({ removed: [], added: SELECTION_CD });
                const AB_REMOVED_CD_ADDED = uiChangeEvent<D, C>({ removed: SELECTION_AB, added: SELECTION_CD });

                beforeEach(async () => {
                    const { data, series } = createBubbleBioStatOptions();
                    selectionChange = createSelectionChangeRecorder();

                    chart = await createChartInstance({
                        data,
                        series,
                        selection: {
                            containment: 'any',
                            enabled: true,
                            enableDrag: true,
                            enableClick: false,
                        },
                        axes: {
                            x: { crosshair: { enabled: false }, gridLine: { enabled: false } },
                            y: { crosshair: { enabled: false }, gridLine: { enabled: false } },
                        },
                        navigator: { enabled: false },
                        scrollbar: { enabled: false },
                        zoom: { enabled: false },
                        listeners: { selectionChange },
                    });
                });

                describe('no-modifier clears and selects', () => {
                    test('screenshot', async () => {
                        await mouseDown(POINT_A);
                        await mouseMove(POINT_B);
                        await compareExact('drag-modifiers-bubble-region-AB-selection-in-progress');

                        await mouseUp(POINT_B);
                        await compareExact('drag-modifiers-bubble-region-AB-selected-only');

                        await mouseDown(POINT_C);
                        await mouseMove(POINT_D);
                        await compareExact('drag-modifiers-bubble-region-CD-selection-in-progress');

                        await mouseUp(POINT_D);
                        await compareExact('drag-modifiers-bubble-region-CD-selected-only');
                    });
                    test('getSelection', async () => {
                        await mouseDown(POINT_A);
                        await mouseMove(POINT_B);
                        expect(getChartSelectionArray()).toEqual([]);

                        await mouseUp(POINT_B);
                        expect(getChartSelectionArray()).toEqual(SELECTION_AB);

                        await mouseDown(POINT_C);
                        await mouseMove(POINT_D);
                        expect(getChartSelectionArray()).toEqual(SELECTION_AB);

                        await mouseUp(POINT_D);
                        expect(getChartSelectionArray()).toEqual(SELECTION_CD);
                    });
                    test('selectionChange', async () => {
                        await mouseDown(POINT_A);
                        await mouseMove(POINT_B);
                        expect(selectionChange.popEvents()).toEqual([]);

                        await mouseUp(POINT_B);
                        expect(selectionChange.popEvents()).toEqual([AB_ADDED]);

                        await mouseDown(POINT_C);
                        await mouseMove(POINT_D);
                        expect(selectionChange.popEvents()).toEqual([]);

                        await mouseUp(POINT_D);
                        expect(selectionChange.popEvents()).toEqual([AB_REMOVED_CD_ADDED]);
                    });
                });

                describe('ctrl-modifier adds to selection', () => {
                    test('screenshot', async () => {
                        await mouseDown(POINT_A, { ctrlKey });
                        await mouseMove(POINT_B, { ctrlKey });
                        await compareExact('drag-modifiers-bubble-region-AB-selection-in-progress');

                        await mouseUp(POINT_B, { ctrlKey });
                        await compareExact('drag-modifiers-bubble-region-AB-selected-only');

                        await mouseDown(POINT_C, { ctrlKey });
                        await mouseMove(POINT_D, { ctrlKey });
                        await compareExact('drag-modifiers-bubble-region-CD-selection-in-progress');

                        await mouseUp(POINT_D, { ctrlKey });
                        await compareExact('drag-modifiers-bubble-regions-ABCD-selected');
                    });
                    test('getSelection', async () => {
                        await mouseDown(POINT_A, { ctrlKey });
                        await mouseMove(POINT_B, { ctrlKey });
                        expect(getChartSelectionArray()).toEqual([]);

                        await mouseUp(POINT_B, { ctrlKey });
                        expect(getChartSelectionArray()).toEqual(SELECTION_AB);

                        await mouseDown(POINT_C, { ctrlKey });
                        await mouseMove(POINT_D, { ctrlKey });
                        expect(getChartSelectionArray()).toEqual(SELECTION_AB);

                        await mouseUp(POINT_D, { ctrlKey });
                        expect(getChartSelectionArray()).toEqual(SELECTION_ABCD);
                    });
                    test('selectionChange', async () => {
                        await mouseDown(POINT_A, { ctrlKey });
                        await mouseMove(POINT_B, { ctrlKey });
                        expect(selectionChange.popEvents()).toEqual([]);

                        await mouseUp(POINT_B, { ctrlKey });
                        expect(selectionChange.popEvents()).toEqual([AB_ADDED]);

                        await mouseDown(POINT_C, { ctrlKey });
                        await mouseMove(POINT_D, { ctrlKey });
                        expect(selectionChange.popEvents()).toEqual([]);

                        await mouseUp(POINT_D, { ctrlKey });
                        expect(selectionChange.popEvents()).toEqual([CD_ADDED]);
                    });
                });

                describe('meta-modifier adds to selection', () => {
                    test('screenshot', async () => {
                        await mouseDown(POINT_A, { metaKey });
                        await mouseMove(POINT_B, { metaKey });
                        await compareExact('drag-modifiers-bubble-region-AB-selection-in-progress');

                        await mouseUp(POINT_B, { metaKey });
                        await compareExact('drag-modifiers-bubble-region-AB-selected-only');

                        await mouseDown(POINT_C, { metaKey });
                        await mouseMove(POINT_D, { metaKey });
                        await compareExact('drag-modifiers-bubble-region-CD-selection-in-progress');

                        await mouseUp(POINT_D, { metaKey });
                        await compareExact('drag-modifiers-bubble-regions-ABCD-selected');
                    });
                    test('getSelection', async () => {
                        await mouseDown(POINT_A, { metaKey });
                        await mouseMove(POINT_B, { metaKey });
                        expect(getChartSelectionArray()).toEqual([]);

                        await mouseUp(POINT_B, { metaKey });
                        expect(getChartSelectionArray()).toEqual(SELECTION_AB);

                        await mouseDown(POINT_C, { metaKey });
                        await mouseMove(POINT_D, { metaKey });
                        expect(getChartSelectionArray()).toEqual(SELECTION_AB);

                        await mouseUp(POINT_D, { metaKey });
                        expect(getChartSelectionArray()).toEqual(SELECTION_ABCD);
                    });
                    test('selectionChange', async () => {
                        await mouseDown(POINT_A, { metaKey });
                        await mouseMove(POINT_B, { metaKey });
                        expect(selectionChange.popEvents()).toEqual([]);

                        await mouseUp(POINT_B, { metaKey });
                        expect(selectionChange.popEvents()).toEqual([AB_ADDED]);

                        await mouseDown(POINT_C, { metaKey });
                        await mouseMove(POINT_D, { metaKey });
                        expect(selectionChange.popEvents()).toEqual([]);

                        await mouseUp(POINT_D, { metaKey });
                        expect(selectionChange.popEvents()).toEqual([CD_ADDED]);
                    });
                });

                describe('alt-modifier ignored', () => {
                    test('screenshot', async () => {
                        await mouseDown(POINT_A, { altKey });
                        await mouseMove(POINT_B, { altKey });
                        await compareExact('drag-modifiers-bubble-no-selection');

                        await mouseUp(POINT_B, { altKey });
                        await compareExact('drag-modifiers-bubble-no-selection');

                        await mouseDown(POINT_C, { altKey });
                        await mouseMove(POINT_D, { altKey });
                        await compareExact('drag-modifiers-bubble-no-selection');

                        await mouseUp(POINT_D, { altKey });
                        await compareExact('drag-modifiers-bubble-no-selection');
                    });
                    test('getSelection', async () => {
                        await mouseDown(POINT_A, { altKey });
                        await mouseMove(POINT_B, { altKey });
                        expect(getChartSelectionArray()).toEqual([]);

                        await mouseUp(POINT_B, { altKey });
                        expect(getChartSelectionArray()).toEqual([]);

                        await mouseDown(POINT_C, { altKey });
                        await mouseMove(POINT_D, { altKey });
                        expect(getChartSelectionArray()).toEqual([]);

                        await mouseUp(POINT_D, { altKey });
                        expect(getChartSelectionArray()).toEqual([]);
                    });
                    test('selectionChange', async () => {
                        await mouseDown(POINT_A, { altKey });
                        await mouseMove(POINT_B, { altKey });
                        expect(selectionChange.popEvents()).toEqual([]);

                        await mouseUp(POINT_B, { altKey });
                        expect(selectionChange.popEvents()).toEqual([]);

                        await mouseDown(POINT_C, { altKey });
                        await mouseMove(POINT_D, { altKey });
                        expect(selectionChange.popEvents()).toEqual([]);

                        await mouseUp(POINT_D, { altKey });
                        expect(selectionChange.popEvents()).toEqual([]);
                    });
                });

                describe('shift-modifier ignored', () => {
                    test('screenshot', async () => {
                        await mouseDown(POINT_A, { shiftKey });
                        await mouseMove(POINT_B, { shiftKey });
                        await compareExact('drag-modifiers-bubble-no-selection');

                        await mouseUp(POINT_B, { shiftKey });
                        await compareExact('drag-modifiers-bubble-no-selection');

                        await mouseDown(POINT_C, { shiftKey });
                        await mouseMove(POINT_D, { shiftKey });
                        await compareExact('drag-modifiers-bubble-no-selection');

                        await mouseUp(POINT_D, { shiftKey });
                        await compareExact('drag-modifiers-bubble-no-selection');
                    });
                    test('getSelection', async () => {
                        await mouseDown(POINT_A, { shiftKey });
                        await mouseMove(POINT_B, { shiftKey });
                        expect(getChartSelectionArray()).toEqual([]);

                        await mouseUp(POINT_B, { shiftKey });
                        expect(getChartSelectionArray()).toEqual([]);

                        await mouseDown(POINT_C, { shiftKey });
                        await mouseMove(POINT_D, { shiftKey });
                        expect(getChartSelectionArray()).toEqual([]);

                        await mouseUp(POINT_D, { shiftKey });
                        expect(getChartSelectionArray()).toEqual([]);
                    });
                    test('selectionChange', async () => {
                        await mouseDown(POINT_A, { shiftKey });
                        await mouseMove(POINT_B, { shiftKey });
                        expect(selectionChange.popEvents()).toEqual([]);

                        await mouseUp(POINT_B, { shiftKey });
                        expect(selectionChange.popEvents()).toEqual([]);

                        await mouseDown(POINT_C, { shiftKey });
                        await mouseMove(POINT_D, { shiftKey });
                        expect(selectionChange.popEvents()).toEqual([]);

                        await mouseUp(POINT_D, { shiftKey });
                        expect(selectionChange.popEvents()).toEqual([]);
                    });
                });
            });
            describe('with zoom panning clash', () => {
                const POINT_A = { canvasX: 169, canvasY: 473 } as const;
                const POINT_B = { canvasX: 375, canvasY: 237 } as const;
                const POINT_C = { canvasX: 667, canvasY: 42 } as const;
                const POINT_D = { canvasX: 492, canvasY: 244 } as const;

                const SELECTION_AB: AgSelectionItem<D>[] = [
                    { datum: { age: 48, height: 165, weight: 62 }, itemId: 4, seriesId: 'BubbleSeries-1' },
                    { datum: { age: 55, height: 166, weight: 65 }, itemId: 5, seriesId: 'BubbleSeries-1' },
                    { datum: { age: 39, height: 168, weight: 63 }, itemId: 6, seriesId: 'BubbleSeries-1' },
                    { datum: { age: 45, height: 169, weight: 68 }, itemId: 7, seriesId: 'BubbleSeries-1' },
                    { datum: { age: 52, height: 170, weight: 72 }, itemId: 8, seriesId: 'BubbleSeries-1' },
                    { datum: { age: 30, height: 172, weight: 64 }, itemId: 9, seriesId: 'BubbleSeries-1' },
                    { datum: { age: 41, height: 173, weight: 70 }, itemId: 10, seriesId: 'BubbleSeries-1' },
                    { datum: { age: 19, height: 170, weight: 58 }, itemId: 27, seriesId: 'BubbleSeries-1' },
                ];
                const SELECTION_CD: AgSelectionItem<D>[] = [
                    { datum: { age: 53, height: 178, weight: 80 }, itemId: 14, seriesId: 'BubbleSeries-1' },
                    { datum: { age: 59, height: 179, weight: 85 }, itemId: 15, seriesId: 'BubbleSeries-1' },
                    { datum: { age: 46, height: 181, weight: 78 }, itemId: 17, seriesId: 'BubbleSeries-1' },
                    { datum: { age: 38, height: 182, weight: 76 }, itemId: 18, seriesId: 'BubbleSeries-1' },
                    { datum: { age: 27, height: 183, weight: 73 }, itemId: 19, seriesId: 'BubbleSeries-1' },
                ];
                const SELECTION_ABCD: AgSelectionItem<D>[] = [...SELECTION_AB, ...SELECTION_CD].sort(
                    (a, b) => (a.itemId as number) - (b.itemId as number)
                );

                const AB_ADDED = withPreventDefault<AgSelectionChangeEvent<D, C>>({
                    type: 'selectionChange',
                    source: 'user-interaction',
                    removed: [],
                    added: SELECTION_AB,
                });
                const CD_ADDED = withPreventDefault<AgSelectionChangeEvent<D, C>>({
                    type: 'selectionChange',
                    source: 'user-interaction',
                    removed: [],
                    added: SELECTION_CD,
                });
                const AB_REMOVED_CD_ADDED = withPreventDefault<AgSelectionChangeEvent<D, C>>({
                    type: 'selectionChange',
                    source: 'user-interaction',
                    removed: SELECTION_AB,
                    added: SELECTION_CD,
                });
                const INITIAL_ZOOM: AgInitialStateZoomOptions = {
                    rangeX: { end: 190, start: 160 },
                    rangeY: { end: 88, start: 52 },
                    ratioX: { end: 0.8, start: 0.2 },
                    ratioY: { end: 0.8, start: 0.2 },
                };
                const AB_ZOOM: AgInitialStateZoomOptions = {
                    rangeX: { end: 181.59183673469389, start: 151.59183673469389 },
                    rangeY: { end: 76, start: 40 },
                    ratioX: { end: 0.6318367346938776, start: 0.03183673469387757 },
                    ratioY: { end: 0.6, start: 0 },
                };
                const CD_ZOOM: AgInitialStateZoomOptions = {
                    rangeX: { end: 188.73469387755102, start: 158.73469387755102 },
                    rangeY: { end: 89.59252336448597, start: 53.59252336448598 },
                    ratioX: { end: 0.7746938775510204, start: 0.17469387755102042 },
                    ratioY: { end: 0.8265420560747663, start: 0.22654205607476632 },
                };

                beforeEach(async () => {
                    const { data, series } = createBubbleBioStatOptions();
                    selectionChange = createSelectionChangeRecorder();

                    chart = await createChartInstance({
                        data,
                        series,
                        selection: {
                            containment: 'any',
                            enabled: true,
                            enableDrag: true,
                            enableClick: false,
                        },
                        axes: {
                            x: { crosshair: { enabled: false }, gridLine: { enabled: false } },
                            y: { crosshair: { enabled: false }, gridLine: { enabled: false } },
                        },
                        navigator: { enabled: false },
                        scrollbar: { enabled: false },
                        zoom: {
                            enabled: true,
                            autoScaling: { enabled: false },
                            enablePanning: true,
                            enableScrolling: true,
                            enableSelecting: true,
                        },
                        initialState: {
                            zoom: {
                                ratioX: { start: 0.2, end: 0.8 },
                                ratioY: { start: 0.2, end: 0.8 },
                            },
                        },
                        listeners: { selectionChange },
                    });
                });

                describe('no-modifier clears and selects', () => {
                    test('screenshot', async () => {
                        await mouseDown(POINT_A);
                        await mouseMove(POINT_B);
                        await compareExact('drag-modifiers-bubble-with-zoom-panning-region-AB-selection-in-progress');

                        await mouseUp(POINT_B);
                        await compareExact('drag-modifiers-bubble-with-zoom-panning-region-AB-selected-only');

                        await mouseDown(POINT_C);
                        await mouseMove(POINT_D);
                        await compareExact('drag-modifiers-bubble-with-zoom-panning-region-CD-selection-in-progress');

                        await mouseUp(POINT_D);
                        await compareExact('drag-modifiers-bubble-with-zoom-panning-region-CD-selected-only');
                    });
                    test('getSelection', async () => {
                        await mouseDown(POINT_A);
                        await mouseMove(POINT_B);
                        expect(getChartSelectionArray()).toEqual([]);

                        await mouseUp(POINT_B);
                        expect(getChartSelectionArray()).toEqual(SELECTION_AB);

                        await mouseDown(POINT_C);
                        await mouseMove(POINT_D);
                        expect(getChartSelectionArray()).toEqual(SELECTION_AB);

                        await mouseUp(POINT_D);
                        expect(getChartSelectionArray()).toEqual(SELECTION_CD);
                    });
                    test('selectionChange', async () => {
                        await mouseDown(POINT_A);
                        await mouseMove(POINT_B);
                        expect(selectionChange.popEvents()).toEqual([]);

                        await mouseUp(POINT_B);
                        expect(selectionChange.popEvents()).toEqual([AB_ADDED]);

                        await mouseDown(POINT_C);
                        await mouseMove(POINT_D);
                        expect(selectionChange.popEvents()).toEqual([]);

                        await mouseUp(POINT_D);
                        expect(selectionChange.popEvents()).toEqual([AB_REMOVED_CD_ADDED]);
                    });
                    test('zoomState', async () => {
                        await mouseDown(POINT_A);
                        await mouseMove(POINT_B);
                        expect(getChartZoomState()).toEqual(INITIAL_ZOOM);

                        await mouseUp(POINT_B);
                        expect(getChartZoomState()).toEqual(INITIAL_ZOOM);

                        await mouseDown(POINT_C);
                        await mouseMove(POINT_D);
                        expect(getChartZoomState()).toEqual(INITIAL_ZOOM);

                        await mouseUp(POINT_D);
                        expect(getChartZoomState()).toEqual(INITIAL_ZOOM);
                    });
                });

                describe('ctrl-modifier adds to selection', () => {
                    test('screenshot', async () => {
                        await mouseDown(POINT_A, { ctrlKey });
                        await mouseMove(POINT_B, { ctrlKey });
                        await compareExact('drag-modifiers-bubble-with-zoom-panning-region-AB-selection-in-progress');

                        await mouseUp(POINT_B, { ctrlKey });
                        await compareExact('drag-modifiers-bubble-with-zoom-panning-region-AB-selected-only');

                        await mouseDown(POINT_C, { ctrlKey });
                        await mouseMove(POINT_D, { ctrlKey });
                        await compareExact('drag-modifiers-bubble-with-zoom-panning-region-CD-selection-in-progress');

                        await mouseUp(POINT_D, { ctrlKey });
                        await compareExact('drag-modifiers-bubble-with-zoom-panning-regions-ABCD-selected');
                    });
                    test('getSelection', async () => {
                        await mouseDown(POINT_A, { ctrlKey });
                        await mouseMove(POINT_B, { ctrlKey });
                        expect(getChartSelectionArray()).toEqual([]);

                        await mouseUp(POINT_B, { ctrlKey });
                        expect(getChartSelectionArray()).toEqual(SELECTION_AB);

                        await mouseDown(POINT_C, { ctrlKey });
                        await mouseMove(POINT_D, { ctrlKey });
                        expect(getChartSelectionArray()).toEqual(SELECTION_AB);

                        await mouseUp(POINT_D, { ctrlKey });
                        expect(getChartSelectionArray()).toEqual(SELECTION_ABCD);
                    });
                    test('selectionChange', async () => {
                        await mouseDown(POINT_A, { ctrlKey });
                        await mouseMove(POINT_B, { ctrlKey });
                        expect(selectionChange.popEvents()).toEqual([]);

                        await mouseUp(POINT_B, { ctrlKey });
                        expect(selectionChange.popEvents()).toEqual([AB_ADDED]);

                        await mouseDown(POINT_C, { ctrlKey });
                        await mouseMove(POINT_D, { ctrlKey });
                        expect(selectionChange.popEvents()).toEqual([]);

                        await mouseUp(POINT_D, { ctrlKey });
                        expect(selectionChange.popEvents()).toEqual([CD_ADDED]);
                    });
                    test('zoomState', async () => {
                        await mouseDown(POINT_A, { ctrlKey });
                        await mouseMove(POINT_B, { ctrlKey });
                        expect(getChartZoomState()).toEqual(INITIAL_ZOOM);

                        await mouseUp(POINT_B, { ctrlKey });
                        expect(getChartZoomState()).toEqual(INITIAL_ZOOM);

                        await mouseDown(POINT_C, { ctrlKey });
                        await mouseMove(POINT_D, { ctrlKey });
                        expect(getChartZoomState()).toEqual(INITIAL_ZOOM);

                        await mouseUp(POINT_D, { ctrlKey });
                        expect(getChartZoomState()).toEqual(INITIAL_ZOOM);
                    });
                });

                describe('meta-modifier adds to selection', () => {
                    test('screenshot', async () => {
                        await mouseDown(POINT_A, { metaKey });
                        await mouseMove(POINT_B, { metaKey });
                        await compareExact('drag-modifiers-bubble-with-zoom-panning-region-AB-selection-in-progress');

                        await mouseUp(POINT_B, { metaKey });
                        await compareExact('drag-modifiers-bubble-with-zoom-panning-region-AB-selected-only');

                        await mouseDown(POINT_C, { metaKey });
                        await mouseMove(POINT_D, { metaKey });
                        await compareExact('drag-modifiers-bubble-with-zoom-panning-region-CD-selection-in-progress');

                        await mouseUp(POINT_D, { metaKey });
                        await compareExact('drag-modifiers-bubble-with-zoom-panning-regions-ABCD-selected');
                    });
                    test('getSelection', async () => {
                        await mouseDown(POINT_A, { metaKey });
                        await mouseMove(POINT_B, { metaKey });
                        expect(getChartSelectionArray()).toEqual([]);

                        await mouseUp(POINT_B, { metaKey });
                        expect(getChartSelectionArray()).toEqual(SELECTION_AB);

                        await mouseDown(POINT_C, { metaKey });
                        await mouseMove(POINT_D, { metaKey });
                        expect(getChartSelectionArray()).toEqual(SELECTION_AB);

                        await mouseUp(POINT_D, { metaKey });
                        expect(getChartSelectionArray()).toEqual(SELECTION_ABCD);
                    });
                    test('selectionChange', async () => {
                        await mouseDown(POINT_A, { metaKey });
                        await mouseMove(POINT_B, { metaKey });
                        expect(selectionChange.popEvents()).toEqual([]);

                        await mouseUp(POINT_B, { metaKey });
                        expect(selectionChange.popEvents()).toEqual([AB_ADDED]);

                        await mouseDown(POINT_C, { metaKey });
                        await mouseMove(POINT_D, { metaKey });
                        expect(selectionChange.popEvents()).toEqual([]);

                        await mouseUp(POINT_D, { metaKey });
                        expect(selectionChange.popEvents()).toEqual([CD_ADDED]);
                    });
                    test('zoomState', async () => {
                        await mouseDown(POINT_A, { metaKey });
                        await mouseMove(POINT_B, { metaKey });
                        expect(getChartZoomState()).toEqual(INITIAL_ZOOM);

                        await mouseUp(POINT_B, { metaKey });
                        expect(getChartZoomState()).toEqual(INITIAL_ZOOM);

                        await mouseDown(POINT_C, { metaKey });
                        await mouseMove(POINT_D, { metaKey });
                        expect(getChartZoomState()).toEqual(INITIAL_ZOOM);

                        await mouseUp(POINT_D, { metaKey });
                        expect(getChartZoomState()).toEqual(INITIAL_ZOOM);
                    });
                });

                describe('alt-modifier pans viewport', () => {
                    test('screenshot', async () => {
                        await mouseDown(POINT_A, { altKey });
                        await mouseMove(POINT_B, { altKey });
                        await compareExact('drag-modifiers-bubble-with-zoom-panning-pan-AB');

                        await mouseUp(POINT_B, { altKey });
                        await compareExact('drag-modifiers-bubble-with-zoom-panning-pan-AB');

                        await mouseDown(POINT_C, { altKey });
                        await mouseMove(POINT_D, { altKey });
                        await compareExact('drag-modifiers-bubble-with-zoom-panning-pan-CD');

                        await mouseUp(POINT_D, { altKey });
                        await compareExact('drag-modifiers-bubble-with-zoom-panning-pan-CD');
                    });
                    test('getSelection', async () => {
                        await mouseDown(POINT_A, { altKey });
                        await mouseMove(POINT_B, { altKey });
                        expect(getChartSelectionArray()).toEqual([]);

                        await mouseUp(POINT_B, { altKey });
                        expect(getChartSelectionArray()).toEqual([]);

                        await mouseDown(POINT_C, { altKey });
                        await mouseMove(POINT_D, { altKey });
                        expect(getChartSelectionArray()).toEqual([]);

                        await mouseUp(POINT_D, { altKey });
                        expect(getChartSelectionArray()).toEqual([]);
                    });
                    test('selectionChange', async () => {
                        await mouseDown(POINT_A, { altKey });
                        await mouseMove(POINT_B, { altKey });
                        expect(selectionChange.popEvents()).toEqual([]);

                        await mouseUp(POINT_B, { altKey });
                        expect(selectionChange.popEvents()).toEqual([]);

                        await mouseDown(POINT_C, { altKey });
                        await mouseMove(POINT_D, { altKey });
                        expect(selectionChange.popEvents()).toEqual([]);

                        await mouseUp(POINT_D, { altKey });
                        expect(selectionChange.popEvents()).toEqual([]);
                    });
                    test('zoomState', async () => {
                        await mouseDown(POINT_A, { altKey });
                        await mouseMove(POINT_B, { altKey });
                        expect(getChartZoomState()).toEqual(AB_ZOOM);

                        await mouseUp(POINT_B, { altKey });
                        expect(getChartZoomState()).toEqual(AB_ZOOM);

                        await mouseDown(POINT_C, { altKey });
                        await mouseMove(POINT_D, { altKey });
                        expect(getChartZoomState()).toEqual(CD_ZOOM);

                        await mouseUp(POINT_D, { altKey });
                        expect(getChartZoomState()).toEqual(CD_ZOOM);
                    });
                });

                describe('shift-modifier ignored', () => {
                    test('screenshot', async () => {
                        await mouseDown(POINT_A, { shiftKey });
                        await mouseMove(POINT_B, { shiftKey });
                        await compareExact('drag-modifiers-bubble-with-zoom-panning-no-selection');

                        await mouseUp(POINT_B, { shiftKey });
                        await compareExact('drag-modifiers-bubble-with-zoom-panning-no-selection');

                        await mouseDown(POINT_C, { shiftKey });
                        await mouseMove(POINT_D, { shiftKey });
                        await compareExact('drag-modifiers-bubble-with-zoom-panning-no-selection');

                        await mouseUp(POINT_D, { shiftKey });
                        await compareExact('drag-modifiers-bubble-with-zoom-panning-no-selection');
                    });
                    test('getSelection', async () => {
                        await mouseDown(POINT_A, { shiftKey });
                        await mouseMove(POINT_B, { shiftKey });
                        expect(getChartSelectionArray()).toEqual([]);

                        await mouseUp(POINT_B, { shiftKey });
                        expect(getChartSelectionArray()).toEqual([]);

                        await mouseDown(POINT_C, { shiftKey });
                        await mouseMove(POINT_D, { shiftKey });
                        expect(getChartSelectionArray()).toEqual([]);

                        await mouseUp(POINT_D, { shiftKey });
                        expect(getChartSelectionArray()).toEqual([]);
                    });
                    test('selectionChange', async () => {
                        await mouseDown(POINT_A, { shiftKey });
                        await mouseMove(POINT_B, { shiftKey });
                        expect(selectionChange.popEvents()).toEqual([]);

                        await mouseUp(POINT_B, { shiftKey });
                        expect(selectionChange.popEvents()).toEqual([]);

                        await mouseDown(POINT_C, { shiftKey });
                        await mouseMove(POINT_D, { shiftKey });
                        expect(selectionChange.popEvents()).toEqual([]);

                        await mouseUp(POINT_D, { shiftKey });
                        expect(selectionChange.popEvents()).toEqual([]);
                    });
                    test('zoomState', async () => {
                        await mouseDown(POINT_A, { shiftKey });
                        await mouseMove(POINT_B, { shiftKey });
                        expect(getChartZoomState()).toEqual(INITIAL_ZOOM);

                        await mouseUp(POINT_B, { shiftKey });
                        expect(getChartZoomState()).toEqual(INITIAL_ZOOM);

                        await mouseDown(POINT_C, { shiftKey });
                        await mouseMove(POINT_D, { shiftKey });
                        expect(getChartZoomState()).toEqual(INITIAL_ZOOM);

                        await mouseUp(POINT_D, { shiftKey });
                        expect(getChartZoomState()).toEqual(INITIAL_ZOOM);
                    });
                });
            });
        });
    });
});
