import { afterEach, describe, expect, it } from 'vitest';

import {
    AgBubbleSeriesOptions,
    type AgCartesianChartOptions,
    type AgChartInstance,
    type AgChartOptions,
    AgCharts,
    type AgErrorBarItemStylerParams,
    AgHierarchyChartOptions,
    AgInitialStateZoomOptions,
    type AgPolarChartOptions,
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
    keyDownAction,
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

type AccountingYear = '2020' | '2021' | '2022' | '2023';
type AccountingDatum =
    | { year: AccountingYear; assets: number; liabilities: number; cash: number; networth?: never }
    | { year: AccountingYear; assets?: never; liabilities?: never; cash?: never; networth: number };
function createLineAccountingOptions(): AgCartesianChartOptions<AccountingDatum, unknown> {
    const data: { year: AccountingYear; assets: number; liabilities: number; cash: number }[] = [
        { year: '2020', assets: 120, liabilities: -80, cash: 40 },
        { year: '2021', assets: 150, liabilities: -90, cash: 60 },
        { year: '2022', assets: 170, liabilities: -110, cash: 30 },
        { year: '2023', assets: 200, liabilities: -130, cash: 90 },
    ];
    return {
        data,
        series: [
            // Three line series (shared data)
            {
                id: 's1id',
                type: 'line',
                xKey: 'year',
                yKey: 'assets',
            },
            {
                id: 's2id',
                type: 'line',
                xKey: 'year',
                yKey: 'liabilities',
            },
            {
                id: 's3id',
                type: 'line',
                xKey: 'year',
                yKey: 'cash',
                selection: { enabled: false },
            },
            // Fourth (own data)
            {
                id: 's4id',
                type: 'line',
                xKey: 'year',
                yKey: 'networth',
                data: data.map(({ year, assets, liabilities, cash }) => {
                    return { year, networth: assets + liabilities + cash };
                }),
            },
        ],
        theme: {
            overrides: {
                line: {
                    series: {
                        label: {
                            enabled: true,
                            formatter: (params) => {
                                return `${params.yKey.at(0)}${params.datum.year.at(3)}`;
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

// A dense dataset (>1000 points) where the marker spacing falls below 1px, so
// `markerEnabled()` is false and — with `selection.enabled` — `hideWithSize0`
// becomes true: the line/area path is drawn but every unselected marker is sized 0.
const SINE_WAVE_POINT_COUNT = 1200;

type SineWaveDatum = { x: number; y: number };
function createLineSineWaveOptions(): AgCartesianChartOptions<SineWaveDatum, unknown> {
    const data: SineWaveDatum[] = Array.from({ length: SINE_WAVE_POINT_COUNT }, (_, i) => ({
        x: i,
        y: Math.sin((i / SINE_WAVE_POINT_COUNT) * Math.PI * 8),
    }));
    return {
        data,
        series: [{ id: 'lineid', type: 'line', xKey: 'x', yKey: 'y' }],
        axes: {
            x: { type: 'number', position: 'bottom', crosshair: { enabled: false }, gridLine: { enabled: false } },
            y: { type: 'number', position: 'left', crosshair: { enabled: false }, gridLine: { enabled: false } },
        },
        legend: { enabled: false },
    };
}

function createAreaSineWaveOptions(): AgCartesianChartOptions<SineWaveDatum, unknown> {
    const data: SineWaveDatum[] = Array.from({ length: SINE_WAVE_POINT_COUNT }, (_, i) => ({
        x: i,
        y: Math.sin((i / SINE_WAVE_POINT_COUNT) * Math.PI * 8),
    }));
    return {
        data,
        series: [{ id: 'areaid', type: 'area', xKey: 'x', yKey: 'y' }],
        axes: {
            x: { type: 'number', position: 'bottom', crosshair: { enabled: false }, gridLine: { enabled: false } },
            y: { type: 'number', position: 'left', crosshair: { enabled: false }, gridLine: { enabled: false } },
        },
        legend: { enabled: false },
    };
}

type SineWaveRangeDatum = { x: number; low: number; high: number };
function createRangeAreaSineWaveOptions(): AgCartesianChartOptions<SineWaveRangeDatum, unknown> {
    const data: SineWaveRangeDatum[] = Array.from({ length: SINE_WAVE_POINT_COUNT }, (_, i) => {
        const mid = Math.sin((i / SINE_WAVE_POINT_COUNT) * Math.PI * 8);
        return { x: i, low: mid - 0.25, high: mid + 0.25 };
    });
    return {
        data,
        series: [{ id: 'rangeareaid', type: 'range-area', xKey: 'x', yLowKey: 'low', yHighKey: 'high' }],
        axes: {
            x: { type: 'number', position: 'bottom', crosshair: { enabled: false }, gridLine: { enabled: false } },
            y: { type: 'number', position: 'left', crosshair: { enabled: false }, gridLine: { enabled: false } },
        },
        legend: { enabled: false },
    };
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

type RingDatum = { sector: string; value: number };
function createPieDonutOptions(): AgPolarChartOptions<RingDatum, unknown> {
    // Three concentric rings — a pie in the centre encircled by two donuts. Every
    // ring is split into the same four equal-angle quadrants (each value: 1 → 90°),
    // so a drag-box over a compass quadrant maps to obvious sectors when debugging.
    // With the default rotation, sectors run clockwise from 12 o'clock: NE, SE, SW, NW.
    const center: RingDatum[] = [
        { sector: 'C-NE', value: 1 },
        { sector: 'C-SE', value: 1 },
        { sector: 'C-SW', value: 1 },
        { sector: 'C-NW', value: 1 },
    ];
    const inner: RingDatum[] = [
        { sector: 'I-NE', value: 1 },
        { sector: 'I-SE', value: 1 },
        { sector: 'I-SW', value: 1 },
        { sector: 'I-NW', value: 1 },
    ];
    const outer: RingDatum[] = [
        { sector: 'O-NE', value: 1 },
        { sector: 'O-SE', value: 1 },
        { sector: 'O-SW', value: 1 },
        { sector: 'O-NW', value: 1 },
    ];
    return {
        data: center,
        series: [
            // Centre pie (uses root data)
            {
                id: 'pieid',
                type: 'pie',
                angleKey: 'value',
                sectorLabelKey: 'sector',
                outerRadiusRatio: 0.33,
            },
            // Inner donut encircling the pie (own data)
            {
                id: 'donut1id',
                type: 'donut',
                data: inner,
                angleKey: 'value',
                sectorLabelKey: 'sector',
                innerRadiusRatio: 0.33,
                outerRadiusRatio: 0.66,
            },
            // Outer donut encircling the inner donut (own data)
            {
                id: 'donut2id',
                type: 'donut',
                data: outer,
                angleKey: 'value',
                sectorLabelKey: 'sector',
                innerRadiusRatio: 0.66,
                outerRadiusRatio: 1,
            },
        ],
        // Disable the legend (we're not testing that):
        legend: { enabled: false },
        theme: {
            overrides: {
                pie: {
                    series: {
                        // Show sector labels so selected sectors are obvious in image snapshots:
                        sectorLabel: { enabled: true },
                        selection: {
                            // Make selected items in the image snapshots more obvious by increasing strokeWidth
                            selectedItem: { strokeWidth: 5 },
                        },
                    },
                },
                donut: {
                    series: {
                        sectorLabel: { enabled: true },
                        selection: {
                            selectedItem: { strokeWidth: 5 },
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

type DiskDatum = {
    name: string;
    inode: number;
    size?: number;
    children?: DiskDatum[];
};

function createDiskUsageOptions(
    type: 'treemap' | 'sunburst',
    dataIdKey?: string
): AgHierarchyChartOptions<DiskDatum, unknown> {
    const data: DiskDatum[] = [
        {
            name: '/',
            inode: 100000,
            children: [
                {
                    name: 'usr/',
                    inode: 100034,
                    children: [
                        {
                            name: 'bin/',
                            inode: 100101,
                            children: [
                                { name: 'bash', inode: 200001, size: 12 },
                                { name: 'ls', inode: 200002, size: 8 },
                            ],
                        },
                        {
                            name: 'lib/',
                            inode: 100102,
                            children: [
                                { name: 'libc.so', inode: 200003, size: 20 },
                                { name: 'libm.so', inode: 200004, size: 14 },
                            ],
                        },
                    ],
                },
                {
                    name: 'home/',
                    inode: 100035,
                    children: [
                        {
                            name: 'Pictures/',
                            inode: 100201,
                            children: [
                                { name: 'img1.jpg', inode: 200005, size: 30 },
                                { name: 'img2.png', inode: 200006, size: 25 },
                            ],
                        },
                        {
                            name: 'Movies/',
                            inode: 100202,
                            children: [
                                { name: 'movie.mp4', inode: 200007, size: 120 },
                                { name: 'clip.mov', inode: 200008, size: 60 },
                            ],
                        },
                    ],
                },
                {
                    name: 'mnt/',
                    inode: 100036,
                    children: [
                        {
                            name: 'SD/',
                            inode: 100301,
                            children: [
                                { name: 'file1.dat', inode: 200009, size: 10 },
                                { name: 'file2.dat', inode: 200010, size: 15 },
                            ],
                        },
                        {
                            name: 'miniSD/',
                            inode: 100302,
                            children: [
                                {
                                    name: 'videos/',
                                    inode: 100401,
                                    children: [
                                        { name: 'vid1.mp4', inode: 200011, size: 50 },
                                        { name: 'vid2.mp4', inode: 200012, size: 70 },
                                    ],
                                },
                                {
                                    name: 'photos/',
                                    inode: 100402,
                                    children: [
                                        { name: 'photo1.jpg', inode: 200013, size: 18 },
                                        { name: 'photo2.jpg', inode: 200014, size: 22 },
                                    ],
                                },
                            ],
                        },
                    ],
                },
            ],
        },
    ];

    const formatter = (p: { datum: { name: string } }) => p.datum.name;
    const strokeWidth = 6;

    return {
        data,
        series: [
            {
                type,
                labelKey: 'name',
                sizeKey: 'size',
                ...(dataIdKey ? { dataIdKey } : {}),
            },
        ],
        title: {
            text: 'Disk Usage',
        },
        theme: {
            overrides: {
                treemap: {
                    series: {
                        group: {
                            label: { formatter },
                            selection: { selectedItem: { strokeWidth } },
                        },
                        tile: {
                            label: { formatter },
                            selection: { selectedItem: { strokeWidth } },
                        },
                    },
                },
                sunburst: {
                    series: {
                        label: { formatter },
                        selection: { selectedItem: { strokeWidth } },
                    },
                },
            },
        },
    };
}

function findName<D extends { name?: string; children?: D[] }>(data: D[] | undefined, name: string): D {
    expect(data).toBeDefined();
    let result: D | undefined;
    const stack: D[] = [...data!];
    while (result === undefined && stack.length > 0) {
        const node = stack.pop()!;
        if (node.name === name) {
            result = node;
        } else if (node.children) {
            stack.push(...node.children);
        }
    }
    if (!result) {
        console.error(`Cannot find ${JSON.stringify(name)}`);
    }
    expect(result).toBeDefined();
    return result!;
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
    async function pressEscape(point: CanvasPoint) {
        await keyDownAction(point.canvasX, point.canvasY, { key: 'Escape', code: 'Escape' })(chart);
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
                        minSize: 6,
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
                        minSize: 6,
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
                        minSize: 6,
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
                        minSize: 5,
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
                        minSize: 5,
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
                        minSize: 5,
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
            const SELECTION_S4E_S3C = [SELECTION_S4E[0], SELECTION_S3C[0]];
            const SELECTION_S2A_S4E_S3C = [SELECTION_S2A[0], SELECTION_S4E[0], SELECTION_S3C[0]];
            const SELECTION_S1D_S2A_S4E_S3C = [SELECTION_S1D[0], SELECTION_S2A[0], SELECTION_S4E[0], SELECTION_S3C[0]];
            const SELECTION_S2A_S4E_S5D_S3C = [SELECTION_S2A[0], SELECTION_S4E[0], SELECTION_S5D[0], SELECTION_S3C[0]];

            const ADDED_S1D = uiChangeEvent<D, C>({ added: SELECTION_S1D, removed: [] });
            const ADDED_S2A = uiChangeEvent<D, C>({ added: SELECTION_S2A, removed: [] });
            const ADDED_S3C = uiChangeEvent<D, C>({ added: SELECTION_S3C, removed: [] });
            const ADDED_S4E = uiChangeEvent<D, C>({ added: SELECTION_S4E, removed: [] });
            const ADDED_S5D = uiChangeEvent<D, C>({ added: SELECTION_S5D, removed: [] });
            const REMOVED_S2A = uiChangeEvent<D, C>({ added: [], removed: SELECTION_S2A });
            const REMOVED_S4E_S3C = uiChangeEvent<D, C>({ added: [], removed: SELECTION_S4E_S3C });
            const REMOVED_S2A_S4E_S3C = uiChangeEvent<D, C>({ added: [], removed: SELECTION_S2A_S4E_S3C });
            const ADDED_S1D_REMOVED_S2A_S4E_S3C = uiChangeEvent<D, C>({
                added: SELECTION_S1D,
                removed: SELECTION_S2A_S4E_S3C,
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
                            expect(getChartSelectionArray()).toEqual(SELECTION_S2A_S4E_S3C);
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
                                expect(selectionChange.popEvents()).toEqual([REMOVED_S2A_S4E_S3C]);
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
                                expect(selectionChange.popEvents()).toEqual([REMOVED_S2A_S4E_S3C]);
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
                                expect(getChartSelectionArray()).toEqual(SELECTION_S2A_S4E_S3C);
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
                                expect(getChartSelectionArray()).toEqual(SELECTION_S2A_S4E_S3C);
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
                                expect(selectionChange.popEvents()).toEqual([REMOVED_S2A_S4E_S3C]);
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
                                expect(getChartSelectionArray()).toEqual(SELECTION_S2A_S4E_S3C);
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
                                expect(getChartSelectionArray()).toEqual(SELECTION_S2A_S4E_S3C);
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
                                expect(selectionChange.popEvents()).toEqual([ADDED_S1D_REMOVED_S2A_S4E_S3C]);
                            });
                        });
                        describe('ctrl-click selection-enabled series', () => {
                            test('screenshot', async () => {
                                await mouseClick(POINT_S1D, { ctrlKey });
                                await compareExact('stack-mix-highlighted-s1d-selected-s2a-s3c-s1d-s4e');
                            });
                            test('getSelection', async () => {
                                await mouseClick(POINT_S1D, { ctrlKey });
                                expect(getChartSelectionArray()).toEqual(SELECTION_S1D_S2A_S4E_S3C);
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
                                expect(getChartSelectionArray()).toEqual(SELECTION_S2A_S4E_S5D_S3C);
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
                                expect(selectionChange.popEvents()).toEqual([REMOVED_S4E_S3C]);
                            });
                        });
                        describe('ctrl-click selected', () => {
                            test('screenshot', async () => {
                                await mouseClick(POINT_S2A, { ctrlKey });
                                await compareExact('stack-mix-highlighted-s2a-selected-s3c-s4e');
                            });
                            test('getSelection', async () => {
                                await mouseClick(POINT_S2A, { ctrlKey });
                                expect(getChartSelectionArray()).toEqual(SELECTION_S4E_S3C);
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
                                expect(getChartSelectionArray()).toEqual(SELECTION_S4E_S3C);
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
                            expect(getChartSelectionArray()).toEqual(SELECTION_S2A_S4E_S3C);
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
                                expect(selectionChange.popEvents()).toEqual([REMOVED_S2A_S4E_S3C]);
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
                                expect(getChartSelectionArray()).toEqual(SELECTION_S2A_S4E_S3C);
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
                                expect(getChartSelectionArray()).toEqual(SELECTION_S2A_S4E_S3C);
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
                                expect(selectionChange.popEvents()).toEqual([REMOVED_S2A_S4E_S3C]);
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
                                expect(getChartSelectionArray()).toEqual(SELECTION_S2A_S4E_S3C);
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
                                expect(getChartSelectionArray()).toEqual(SELECTION_S1D_S2A_S4E_S3C);
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
                                expect(getChartSelectionArray()).toEqual(SELECTION_S1D_S2A_S4E_S3C);
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
                                expect(getChartSelectionArray()).toEqual(SELECTION_S2A_S4E_S5D_S3C);
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
                                expect(getChartSelectionArray()).toEqual(SELECTION_S4E_S3C);
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
                                expect(getChartSelectionArray()).toEqual(SELECTION_S4E_S3C);
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
                                expect(getChartSelectionArray()).toEqual(SELECTION_S4E_S3C);
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

        describe('treemap', () => {
            type D = DiskDatum;
            type C = unknown;
            let selectionChange: SelectionChangeRecorder<D, C>;

            const { data, series, theme, legend, title } = createDiskUsageOptions('treemap');

            const seriesId = 'TreemapSeries-1' as const;
            const POINT_MOVIE: CanvasPoint = { canvasX: 160, canvasY: 258 };
            const POINT_VID2: CanvasPoint = { canvasX: 496, canvasY: 223 };
            const POINT_MNT: CanvasPoint = { canvasX: 605, canvasY: 96 };
            const POINT_IMG1: CanvasPoint = { canvasX: 84, canvasY: 522 };
            const POINT_MISS: CanvasPoint = { canvasX: 20, canvasY: 20 };
            const DATUM_MOVIE: D = findName(data, 'movie.mp4');
            const DATUM_VID2: D = findName(data, 'vid2.mp4');
            const DATUM_MNT: D = findName(data, 'mnt/');
            const DATUM_IMG1: D = findName(data, 'img1.jpg');
            const ITEM_MOVIE: AgSelectionItem<D> = { datum: DATUM_MOVIE, seriesId, itemId: 13 };
            const ITEM_VID2: AgSelectionItem<D> = { datum: DATUM_VID2, seriesId, itemId: 22 };
            const ITEM_MNT: AgSelectionItem<D> = { datum: DATUM_MNT, seriesId, itemId: 15 };
            const ITEM_IMG1: AgSelectionItem<D> = { datum: DATUM_IMG1, seriesId, itemId: 10 };
            const ADDED_MOVIE = uiChangeEvent<D, C>({ added: [ITEM_MOVIE], removed: [] });
            const ADDED_VID2 = uiChangeEvent<D, C>({ added: [ITEM_VID2], removed: [] });
            const ADDED_MNT = uiChangeEvent<D, C>({ added: [ITEM_MNT], removed: [] });
            const ADDED_IMG1 = uiChangeEvent<D, C>({ added: [ITEM_IMG1], removed: [] });
            const REMOVED_MOVIE = uiChangeEvent<D, C>({ added: [], removed: [ITEM_MOVIE] });
            const REMOVED_MNT_VID2 = uiChangeEvent<D, C>({ added: [], removed: [ITEM_MNT, ITEM_VID2] });
            const ADDED_IMG1_REMOVED_MOVIE_MNT_VID2 = uiChangeEvent<D, C>({
                added: [ITEM_IMG1],
                removed: [ITEM_MOVIE, ITEM_MNT, ITEM_VID2],
            });
            describe('single', () => {
                beforeEach(async () => {
                    selectionChange = createSelectionChangeRecorder();
                    chart = await createChartInstance({
                        data,
                        series,
                        theme,
                        legend,
                        title,
                        selection: {
                            enabled: true,
                            clickMode: 'single',
                        },
                        listeners: { selectionChange },
                    });
                });

                describe('select 3 points', () => {
                    beforeEach(async () => {
                        await mouseClick(POINT_MOVIE);
                        await mouseClick(POINT_VID2, { ctrlKey });
                        await mouseClick(POINT_MNT, { ctrlKey });
                        await mouseMove(POINT_MISS);
                    });
                    describe('initial', () => {
                        test('screenshot', async () => {
                            await compareExact('diskusage-treemap-highlighted-none-selected-movie-mnt-vid2');
                        });
                        test('getSelection', () => {
                            expect(getChartSelectionArray()).toEqual([ITEM_MOVIE, ITEM_MNT, ITEM_VID2]);
                        });
                        test('selectionChange', () => {
                            expect(selectionChange.popEvents()).toEqual([ADDED_MOVIE, ADDED_VID2, ADDED_MNT]);
                        });
                    });
                    describe('follow-up', () => {
                        beforeEach(() => {
                            selectionChange.popEvents(); // pop event of initial selection.
                        });
                        describe('click on selected node sets that node to the sole selection', () => {
                            test('screenshot', async () => {
                                await mouseClick(POINT_MOVIE);
                                await mouseMove(POINT_MISS);
                                await compareExact('diskusage-treemap-highlighted-none-selected-movie');
                            });
                            test('getSelection', async () => {
                                await mouseClick(POINT_MOVIE);
                                await mouseMove(POINT_MISS);
                                expect(getChartSelectionArray()).toEqual([ITEM_MOVIE]);
                            });
                            test('selectionChange', async () => {
                                await mouseClick(POINT_MOVIE);
                                await mouseMove(POINT_MISS);
                                expect(selectionChange.popEvents()).toEqual([REMOVED_MNT_VID2]);
                            });
                        });
                        describe('ctrl-click on selected node removes that node only', () => {
                            test('screenshot', async () => {
                                await mouseClick(POINT_MOVIE, { ctrlKey });
                                await mouseMove(POINT_MISS);
                                await compareExact('diskusage-treemap-highlighted-none-selected-vid2-mnt');
                            });
                            test('getSelection', async () => {
                                await mouseClick(POINT_MOVIE, { ctrlKey });
                                await mouseMove(POINT_MISS);
                                expect(getChartSelectionArray()).toEqual([ITEM_MNT, ITEM_VID2]);
                            });
                            test('selectionChange', async () => {
                                await mouseClick(POINT_MOVIE, { ctrlKey });
                                await mouseMove(POINT_MISS);
                                expect(selectionChange.popEvents()).toEqual([REMOVED_MOVIE]);
                            });
                        });
                        describe('click on unselected node sets that node to the sole selection', () => {
                            test('screenshot', async () => {
                                await mouseClick(POINT_IMG1);
                                await mouseMove(POINT_MISS);
                                await compareExact('diskusage-treemap-highlighted-none-selected-img1');
                            });
                            test('getSelection', async () => {
                                await mouseClick(POINT_IMG1);
                                await mouseMove(POINT_MISS);
                                expect(getChartSelectionArray()).toEqual([ITEM_IMG1]);
                            });
                            test('selectionChange', async () => {
                                await mouseClick(POINT_IMG1);
                                await mouseMove(POINT_MISS);
                                expect(selectionChange.popEvents()).toEqual([ADDED_IMG1_REMOVED_MOVIE_MNT_VID2]);
                            });
                        });
                        describe('ctrl-click on unselected node adds that node only', () => {
                            test('screenshot', async () => {
                                await mouseClick(POINT_IMG1, { ctrlKey });
                                await mouseMove(POINT_MISS);
                                await compareExact('diskusage-treemap-highlighted-none-selected-img1-movie-mnt-vid2');
                            });
                            test('getSelection', async () => {
                                await mouseClick(POINT_IMG1, { ctrlKey });
                                await mouseMove(POINT_MISS);
                                expect(getChartSelectionArray()).toEqual([ITEM_IMG1, ITEM_MOVIE, ITEM_MNT, ITEM_VID2]);
                            });
                            test('selectionChange', async () => {
                                await mouseClick(POINT_IMG1, { ctrlKey });
                                await mouseMove(POINT_MISS);
                                expect(selectionChange.popEvents()).toEqual([ADDED_IMG1]);
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

                describe('pressing Escape aborts selection', () => {
                    test('screenshot', async () => {
                        await mouseDown(POINT_A);
                        await mouseMove(POINT_B);
                        await compareExact('drag-modifiers-bubble-region-AB-selection-in-progress');

                        await pressEscape(POINT_B);
                        await compareExact('drag-modifiers-bubble-no-selection');

                        await mouseUp(POINT_B);
                        await compareExact('drag-modifiers-bubble-no-selection');
                    });
                    test('getSelection', async () => {
                        await mouseDown(POINT_A, { shiftKey });
                        await mouseMove(POINT_B, { shiftKey });
                        expect(getChartSelectionArray()).toEqual([]);

                        await pressEscape(POINT_B);
                        expect(getChartSelectionArray()).toEqual([]);

                        await mouseUp(POINT_B);
                        expect(getChartSelectionArray()).toEqual([]);
                    });
                    test('selectionChange', async () => {
                        await mouseDown(POINT_A, { shiftKey });
                        await mouseMove(POINT_B, { shiftKey });
                        expect(selectionChange.popEvents()).toEqual([]);

                        await pressEscape(POINT_B);
                        expect(selectionChange.popEvents()).toEqual([]);

                        await mouseUp(POINT_B);
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

        describe('line', () => {
            describe('without module clash', () => {
                type D = AccountingDatum;
                type C = unknown;
                type I = AgSelectionItem<D>;
                let selectionChange: SelectionChangeRecorder<D, C>;

                const { data = [], series = [], theme = {} } = createLineAccountingOptions();

                const POINT_A = { canvasX: 262.5, canvasY: 440 };
                const POINT_B = { canvasX: 582.5, canvasY: 21 };
                const POINT_C = { canvasX: 41.5, canvasY: 142 };

                const a0: I = { datum: data[0], itemId: 0, seriesId: 's1id' };
                const a1: I = { datum: data[1], itemId: 1, seriesId: 's1id' };
                const a2: I = { datum: data[2], itemId: 2, seriesId: 's1id' };
                const l1: I = { datum: data[1], itemId: 1, seriesId: 's2id' };
                const l2: I = { datum: data[2], itemId: 2, seriesId: 's2id' };
                const n1: I = { datum: series[3].data![1], itemId: 1, seriesId: 's4id' };
                const n2: I = { datum: series[3].data![2], itemId: 2, seriesId: 's4id' };
                const SELECTION_a0a1a2l1l2n1n2: I[] = [a0, a1, a2, l1, l2, n1, n2];
                const SELECTION_a1a2l1l2n1n2: I[] = [a1, a2, l1, l2, n1, n2];
                const SELECTION_a0a1a2n1: I[] = [a0, a1, a2, n1];
                const ADDED_a0 = uiChangeEvent<D, C>({ added: [a0], removed: [] });
                const ADDED_a1a2l1l2n1n2 = uiChangeEvent<D, C>({ added: [a1, a2, l1, l2, n1, n2], removed: [] });
                const ADDED_a0_REMOVED_l1l2n2 = uiChangeEvent<D, C>({ added: [a0], removed: [l1, l2, n2] });

                beforeEach(async () => {
                    selectionChange = createSelectionChangeRecorder();

                    chart = await createChartInstance({
                        data,
                        series,
                        theme,
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
                describe('no-modifier two drags', () => {
                    test('screenshot', async () => {
                        await mouseDown(POINT_A);
                        await mouseMove(POINT_B);
                        await mouseUp(POINT_B);
                        await compareExact('drag-modifiers-line-highlighted-a2-selected-a1a2l1l2n1n2');

                        await mouseDown(POINT_B);
                        await mouseMove(POINT_C);
                        await mouseUp(POINT_C);
                        await compareExact('drag-modifiers-line-highlighted-none-selected-a0a1a2n1');
                    });
                    test('getSelection', async () => {
                        await mouseDown(POINT_A);
                        await mouseMove(POINT_B);
                        await mouseUp(POINT_B);
                        expect(getChartSelectionArray()).toEqual(SELECTION_a1a2l1l2n1n2);

                        await mouseDown(POINT_B);
                        await mouseMove(POINT_C);
                        await mouseUp(POINT_C);
                        expect(getChartSelectionArray()).toEqual(SELECTION_a0a1a2n1);
                    });
                    test('selectionChange', async () => {
                        await mouseDown(POINT_A);
                        await mouseMove(POINT_B);
                        await mouseUp(POINT_B);
                        expect(selectionChange.popEvents()).toEqual([ADDED_a1a2l1l2n1n2]);

                        await mouseDown(POINT_B);
                        await mouseMove(POINT_C);
                        await mouseUp(POINT_C);
                        expect(selectionChange.popEvents()).toEqual([ADDED_a0_REMOVED_l1l2n2]);
                    });
                });
                describe('alt-modifier two drags', () => {
                    test('screenshot', async () => {
                        await mouseDown(POINT_A, { altKey });
                        await mouseMove(POINT_B, { altKey });
                        await mouseUp(POINT_B, { altKey });
                        await compareExact('drag-modifiers-line-highlighted-a2-selected-none');

                        await mouseDown(POINT_B, { altKey });
                        await mouseMove(POINT_C, { altKey });
                        await mouseUp(POINT_C, { altKey });
                        await compareExact('drag-modifiers-line-highlighted-none-selected-none');
                    });
                    test('getSelection', async () => {
                        await mouseDown(POINT_A, { altKey });
                        await mouseMove(POINT_B, { altKey });
                        await mouseUp(POINT_B, { altKey });
                        expect(getChartSelectionArray()).toEqual([]);

                        await mouseDown(POINT_B, { altKey });
                        await mouseMove(POINT_C, { altKey });
                        await mouseUp(POINT_C, { altKey });
                        expect(getChartSelectionArray()).toEqual([]);
                    });
                    test('selectionChange', async () => {
                        await mouseDown(POINT_A, { altKey });
                        await mouseMove(POINT_B, { altKey });
                        await mouseUp(POINT_B, { altKey });
                        expect(selectionChange.popEvents()).toEqual([]);

                        await mouseDown(POINT_B, { altKey });
                        await mouseMove(POINT_C, { altKey });
                        await mouseUp(POINT_C, { altKey });
                        expect(selectionChange.popEvents()).toEqual([]);
                    });
                });
                describe('ctrl-modifier two drags', () => {
                    test('screenshot', async () => {
                        await mouseDown(POINT_A, { ctrlKey });
                        await mouseMove(POINT_B, { ctrlKey });
                        await mouseUp(POINT_B, { ctrlKey });
                        await compareExact('drag-modifiers-line-highlighted-a2-selected-a1a2l1l2n1n2');

                        await mouseDown(POINT_B, { ctrlKey });
                        await mouseMove(POINT_C, { ctrlKey });
                        await mouseUp(POINT_C, { ctrlKey });
                        await compareExact('drag-modifiers-line-highlighted-none-selected-a0a1a2l1l2n1n2');
                    });
                    test('getSelection', async () => {
                        await mouseDown(POINT_A, { ctrlKey });
                        await mouseMove(POINT_B, { ctrlKey });
                        await mouseUp(POINT_B, { ctrlKey });
                        expect(getChartSelectionArray()).toEqual(SELECTION_a1a2l1l2n1n2);

                        await mouseDown(POINT_B, { ctrlKey });
                        await mouseMove(POINT_C, { ctrlKey });
                        await mouseUp(POINT_C, { ctrlKey });
                        expect(getChartSelectionArray()).toEqual(SELECTION_a0a1a2l1l2n1n2);
                    });
                    test('selectionChange', async () => {
                        await mouseDown(POINT_A, { ctrlKey });
                        await mouseMove(POINT_B, { ctrlKey });
                        await mouseUp(POINT_B, { ctrlKey });
                        expect(selectionChange.popEvents()).toEqual([ADDED_a1a2l1l2n1n2]);

                        await mouseDown(POINT_B, { ctrlKey });
                        await mouseMove(POINT_C, { ctrlKey });
                        await mouseUp(POINT_C, { ctrlKey });
                        expect(selectionChange.popEvents()).toEqual([ADDED_a0]);
                    });
                });
                describe('meta-modifier two drags', () => {
                    test('screenshot', async () => {
                        await mouseDown(POINT_A, { metaKey });
                        await mouseMove(POINT_B, { metaKey });
                        await mouseUp(POINT_B, { metaKey });
                        await compareExact('drag-modifiers-line-highlighted-a2-selected-a1a2l1l2n1n2');

                        await mouseDown(POINT_B, { metaKey });
                        await mouseMove(POINT_C, { metaKey });
                        await mouseUp(POINT_C, { metaKey });
                        await compareExact('drag-modifiers-line-highlighted-none-selected-a0a1a2l1l2n1n2');
                    });
                    test('getSelection', async () => {
                        await mouseDown(POINT_A, { metaKey });
                        await mouseMove(POINT_B, { metaKey });
                        await mouseUp(POINT_B, { metaKey });
                        expect(getChartSelectionArray()).toEqual(SELECTION_a1a2l1l2n1n2);

                        await mouseDown(POINT_B, { metaKey });
                        await mouseMove(POINT_C, { metaKey });
                        await mouseUp(POINT_C, { metaKey });
                        expect(getChartSelectionArray()).toEqual(SELECTION_a0a1a2l1l2n1n2);
                    });
                    test('selectionChange', async () => {
                        await mouseDown(POINT_A, { metaKey });
                        await mouseMove(POINT_B, { metaKey });
                        await mouseUp(POINT_B, { metaKey });
                        expect(selectionChange.popEvents()).toEqual([ADDED_a1a2l1l2n1n2]);

                        await mouseDown(POINT_B, { metaKey });
                        await mouseMove(POINT_C, { metaKey });
                        await mouseUp(POINT_C, { metaKey });
                        expect(selectionChange.popEvents()).toEqual([ADDED_a0]);
                    });
                });
            });

            describe('hideWithSize0 large dataset', () => {
                type D = SineWaveDatum;
                type C = unknown;
                type I = AgSelectionItem<D>;
                let selectionChange: SelectionChangeRecorder<D, C>;

                const DRAG_FROM: CanvasPoint = { canvasX: 200, canvasY: 100 };
                const DRAG_TO: CanvasPoint = { canvasX: 500, canvasY: 500 };

                const lineDatum = (x: number, y: number): I => {
                    return { datum: { x, y }, itemId: x, seriesId: 'lineid' };
                };
                const SELECTION: I[] = [
                    lineDatum(257, -0.7836934573258398),
                    lineDatum(258, -0.7705132427757896),
                    lineDatum(259, -0.7569950556517565),
                    lineDatum(260, -0.743144825477394),
                    lineDatum(261, -0.7289686274214116),
                    lineDatum(262, -0.7144726796328037),
                    lineDatum(263, -0.6996633405133654),
                    lineDatum(264, -0.684547105928689),
                    lineDatum(265, -0.6691306063588588),
                    lineDatum(266, -0.6534206039901057),
                    lineDatum(267, -0.6374239897486896),
                    lineDatum(268, -0.6211477802783106),
                    lineDatum(269, -0.6045991148623754),
                    lineDatum(270, -0.5877852522924734),
                    lineDatum(271, -0.5707135676844322),
                    lineDatum(272, -0.5533915492433442),
                    lineDatum(273, -0.5358267949789963),
                    lineDatum(274, -0.5180270093731303),
                    lineDatum(275, -0.5000000000000004),
                    lineDatum(276, -0.4817536741017153),
                    lineDatum(277, -0.46329603511986217),
                    lineDatum(278, -0.44463517918492745),
                    lineDatum(279, -0.4257792915650722),
                    lineDatum(280, -0.40673664307580015),
                    lineDatum(281, -0.38751558645210327),
                    lineDatum(282, -0.3681245526846787),
                    lineDatum(283, -0.3485720473218155),
                    lineDatum(284, -0.3288666467385839),
                    lineDatum(285, -0.3090169943749476),
                    lineDatum(286, -0.28903179694447134),
                    lineDatum(287, -0.26891982061526587),
                    lineDatum(288, -0.24868988716485535),
                    lineDatum(289, -0.22835087011065586),
                    lineDatum(290, -0.20791169081775987),
                    lineDatum(291, -0.18738131458572468),
                    lineDatum(292, -0.16676874671610187),
                    lineDatum(293, -0.14608302856241162),
                    lineDatum(294, -0.12533323356430465),
                    lineDatum(295, -0.1045284632676543),
                    lineDatum(296, -0.08367784333231584),
                    lineDatum(297, -0.06279051952931326),
                    lineDatum(298, -0.04187565372919993),
                    lineDatum(299, -0.02094241988335679),
                    lineDatum(300, -2.4492935982947064e-16),
                    lineDatum(301, 0.020942419883357186),
                    lineDatum(302, 0.041875653729198554),
                    lineDatum(303, 0.06279051952931278),
                    lineDatum(304, 0.08367784333231536),
                    lineDatum(305, 0.10452846326765293),
                    lineDatum(306, 0.12533323356430418),
                    lineDatum(307, 0.146083028562412),
                    lineDatum(308, 0.16676874671610137),
                    lineDatum(309, 0.1873813145857242),
                    lineDatum(310, 0.20791169081775937),
                    lineDatum(311, 0.22835087011065539),
                    lineDatum(312, 0.24868988716485488),
                    lineDatum(313, 0.26891982061526454),
                    lineDatum(314, 0.2890317969444709),
                    lineDatum(315, 0.3090169943749472),
                    lineDatum(316, 0.3288666467385826),
                    lineDatum(317, 0.348572047321815),
                    lineDatum(318, 0.3681245526846782),
                    lineDatum(319, 0.38751558645210205),
                    lineDatum(320, 0.4067366430757997),
                    lineDatum(321, 0.42577929156507255),
                    lineDatum(322, 0.444635179184927),
                    lineDatum(323, 0.4632960351198617),
                    lineDatum(324, 0.48175367410171566),
                    lineDatum(325, 0.4999999999999993),
                    lineDatum(326, 0.5180270093731298),
                    lineDatum(327, 0.5358267949789967),
                    lineDatum(328, 0.5533915492433438),
                    lineDatum(329, 0.5707135676844318),
                    lineDatum(330, 0.5877852522924736),
                    lineDatum(331, 0.6045991148623743),
                    lineDatum(332, 0.6211477802783102),
                    lineDatum(333, 0.63742398974869),
                    lineDatum(334, 0.6534206039901054),
                    lineDatum(335, 0.6691306063588585),
                    lineDatum(336, 0.6845471059286893),
                    lineDatum(337, 0.699663340513365),
                    lineDatum(413, 0.6996633405133654),
                    lineDatum(414, 0.6845471059286897),
                    lineDatum(415, 0.6691306063588589),
                    lineDatum(416, 0.6534206039901058),
                    lineDatum(417, 0.6374239897486911),
                    lineDatum(418, 0.6211477802783114),
                    lineDatum(419, 0.6045991148623755),
                    lineDatum(420, 0.5877852522924734),
                    lineDatum(421, 0.5707135676844316),
                    lineDatum(422, 0.5533915492433436),
                    lineDatum(423, 0.5358267949789972),
                    lineDatum(424, 0.5180270093731304),
                    lineDatum(425, 0.4999999999999998),
                    lineDatum(426, 0.4817536741017162),
                    lineDatum(427, 0.4632960351198622),
                    lineDatum(428, 0.44463517918492756),
                    lineDatum(429, 0.42577929156507394),
                    lineDatum(430, 0.40673664307580104),
                    lineDatum(431, 0.3875155864521034),
                    lineDatum(432, 0.368124552684678),
                    lineDatum(433, 0.3485720473218148),
                    lineDatum(434, 0.32886664673858235),
                    lineDatum(435, 0.3090169943749478),
                    lineDatum(436, 0.28903179694447145),
                    lineDatum(437, 0.26891982061526515),
                    lineDatum(438, 0.2486898871648555),
                    lineDatum(439, 0.22835087011065597),
                    lineDatum(440, 0.20791169081776084),
                    lineDatum(441, 0.18738131458572568),
                    lineDatum(442, 0.16676874671610287),
                    lineDatum(443, 0.14608302856241173),
                    lineDatum(444, 0.1253332335643039),
                    lineDatum(445, 0.10452846326765265),
                    lineDatum(446, 0.08367784333231597),
                    lineDatum(447, 0.06279051952931339),
                    lineDatum(448, 0.041875653729199165),
                    lineDatum(449, 0.0209424198833578),
                    lineDatum(450, 3.6739403974420594e-16),
                    lineDatum(451, -0.020942419883357065),
                    lineDatum(452, -0.04187565372919843),
                    lineDatum(453, -0.06279051952931265),
                    lineDatum(454, -0.08367784333231525),
                    lineDatum(455, -0.10452846326765193),
                    lineDatum(456, -0.12533323356430318),
                    lineDatum(457, -0.146083028562411),
                    lineDatum(458, -0.16676874671610215),
                    lineDatum(459, -0.18738131458572496),
                    lineDatum(460, -0.20791169081776012),
                    lineDatum(461, -0.22835087011065525),
                    lineDatum(462, -0.24868988716485477),
                    lineDatum(463, -0.2689198206152644),
                    lineDatum(464, -0.2890317969444708),
                    lineDatum(465, -0.30901699437494706),
                    lineDatum(466, -0.3288666467385817),
                    lineDatum(467, -0.34857204732181407),
                    lineDatum(468, -0.36812455268467725),
                    lineDatum(469, -0.3875155864521027),
                    lineDatum(470, -0.4067366430758004),
                    lineDatum(471, -0.42577929156507327),
                    lineDatum(472, -0.4446351791849269),
                    lineDatum(473, -0.4632960351198616),
                    lineDatum(474, -0.48175367410171555),
                    lineDatum(475, -0.49999999999999917),
                    lineDatum(476, -0.5180270093731297),
                    lineDatum(477, -0.5358267949789965),
                    lineDatum(478, -0.553391549243343),
                    lineDatum(479, -0.5707135676844309),
                    lineDatum(480, -0.5877852522924728),
                    lineDatum(481, -0.6045991148623749),
                    lineDatum(482, -0.6211477802783107),
                    lineDatum(483, -0.6374239897486905),
                    lineDatum(484, -0.6534206039901053),
                    lineDatum(485, -0.6691306063588583),
                    lineDatum(486, -0.6845471059286892),
                    lineDatum(487, -0.699663340513365),
                    lineDatum(488, -0.7144726796328033),
                    lineDatum(489, -0.7289686274214106),
                    lineDatum(490, -0.7431448254773936),
                    lineDatum(491, -0.7569950556517561),
                    lineDatum(492, -0.770513242775788),
                    lineDatum(493, -0.783693457325839),
                    lineDatum(557, -0.7836934573258395),
                    lineDatum(558, -0.7705132427757886),
                    lineDatum(559, -0.7569950556517566),
                    lineDatum(560, -0.7431448254773941),
                    lineDatum(561, -0.7289686274214111),
                    lineDatum(562, -0.7144726796328038),
                    lineDatum(563, -0.6996633405133655),
                    lineDatum(564, -0.6845471059286898),
                    lineDatum(565, -0.669130606358859),
                    lineDatum(566, -0.6534206039901059),
                    lineDatum(567, -0.6374239897486912),
                    lineDatum(568, -0.6211477802783115),
                    lineDatum(569, -0.6045991148623756),
                    lineDatum(570, -0.5877852522924735),
                    lineDatum(571, -0.5707135676844317),
                    lineDatum(572, -0.5533915492433437),
                    lineDatum(573, -0.5358267949789973),
                    lineDatum(574, -0.5180270093731305),
                    lineDatum(575, -0.4999999999999999),
                    lineDatum(576, -0.4817536741017163),
                    lineDatum(577, -0.46329603511986234),
                    lineDatum(578, -0.4446351791849277),
                    lineDatum(579, -0.42577929156507405),
                    lineDatum(580, -0.4067366430758012),
                    lineDatum(581, -0.38751558645210354),
                    lineDatum(582, -0.3681245526846781),
                    lineDatum(583, -0.3485720473218149),
                    lineDatum(584, -0.32886664673858246),
                    lineDatum(585, -0.3090169943749479),
                    lineDatum(586, -0.2890317969444716),
                    lineDatum(587, -0.26891982061526526),
                    lineDatum(588, -0.2486898871648556),
                    lineDatum(589, -0.2283508701106561),
                    lineDatum(590, -0.20791169081776098),
                    lineDatum(591, -0.1873813145857258),
                    lineDatum(592, -0.16676874671610298),
                    lineDatum(593, -0.14608302856241187),
                    lineDatum(594, -0.125333233564304),
                    lineDatum(595, -0.10452846326765278),
                    lineDatum(596, -0.0836778433323161),
                    lineDatum(597, -0.06279051952931351),
                    lineDatum(598, -0.04187565372919929),
                    lineDatum(599, -0.020942419883357922),
                    lineDatum(600, -4.898587196589413e-16),
                    lineDatum(601, 0.020942419883356943),
                    lineDatum(602, 0.04187565372920009),
                    lineDatum(603, 0.06279051952931075),
                    lineDatum(604, 0.08367784333231335),
                    lineDatum(605, 0.1045284632676518),
                    lineDatum(606, 0.12533323356430304),
                    lineDatum(607, 0.1460830285624109),
                    lineDatum(608, 0.166768746716102),
                    lineDatum(609, 0.1873813145857231),
                    lineDatum(610, 0.20791169081775826),
                    lineDatum(611, 0.22835087011065514),
                    lineDatum(612, 0.24868988716485466),
                    lineDatum(613, 0.26891982061526604),
                    lineDatum(614, 0.28903179694447234),
                    lineDatum(615, 0.30901699437494523),
                    lineDatum(616, 0.3288666467385815),
                    lineDatum(617, 0.34857204732181396),
                    lineDatum(618, 0.36812455268467714),
                    lineDatum(619, 0.3875155864521026),
                    lineDatum(620, 0.40673664307580026),
                    lineDatum(621, 0.42577929156507155),
                    lineDatum(622, 0.44463517918492684),
                    lineDatum(623, 0.4632960351198615),
                    lineDatum(624, 0.48175367410171543),
                    lineDatum(625, 0.5000000000000006),
                    lineDatum(626, 0.5180270093731282),
                    lineDatum(627, 0.535826794978995),
                    lineDatum(628, 0.5533915492433429),
                    lineDatum(629, 0.5707135676844308),
                    lineDatum(630, 0.5877852522924727),
                    lineDatum(631, 0.6045991148623748),
                    lineDatum(632, 0.6211477802783093),
                    lineDatum(633, 0.6374239897486891),
                    lineDatum(634, 0.6534206039901052),
                    lineDatum(635, 0.6691306063588582),
                    lineDatum(636, 0.6845471059286891),
                    lineDatum(637, 0.6996633405133661),
                    lineDatum(713, 0.699663340513367),
                    lineDatum(714, 0.6845471059286898),
                    lineDatum(715, 0.6691306063588591),
                    lineDatum(716, 0.6534206039901059),
                    lineDatum(717, 0.6374239897486899),
                    lineDatum(718, 0.6211477802783102),
                    lineDatum(719, 0.6045991148623757),
                    lineDatum(720, 0.5877852522924736),
                    lineDatum(721, 0.5707135676844318),
                    lineDatum(722, 0.5533915492433438),
                    lineDatum(723, 0.5358267949789959),
                    lineDatum(724, 0.5180270093731291),
                    lineDatum(725, 0.5000000000000016),
                    lineDatum(726, 0.48175367410171643),
                    lineDatum(727, 0.46329603511986245),
                    lineDatum(728, 0.4446351791849278),
                    lineDatum(729, 0.42577929156507255),
                    lineDatum(730, 0.4067366430758013),
                    lineDatum(731, 0.38751558645210366),
                    lineDatum(732, 0.3681245526846782),
                    lineDatum(733, 0.348572047321815),
                    lineDatum(734, 0.32886664673858257),
                    lineDatum(735, 0.3090169943749463),
                    lineDatum(736, 0.2890317969444734),
                    lineDatum(737, 0.2689198206152671),
                    lineDatum(738, 0.2486898871648557),
                ];

                const SELECTIONCHANGE: AgSelectionChangeEvent<D, C>[] = [
                    uiChangeEvent<D, C>({ added: SELECTION, removed: [] }),
                ];

                beforeEach(async () => {
                    const { data, series, axes, legend } = createLineSineWaveOptions();
                    selectionChange = createSelectionChangeRecorder();
                    chart = await createChartInstance({
                        data,
                        series,
                        axes,
                        legend,
                        selection: {
                            containment: 'any',
                            enabled: true,
                            enableDrag: true,
                            enableClick: false,
                        },
                        navigator: { enabled: false },
                        scrollbar: { enabled: false },
                        zoom: { enabled: false },
                        listeners: { selectionChange },
                    });
                });
                describe('initial', () => {
                    // The dense line is drawn, but every marker is hidden (size 0): hideWithSize0
                    // is active and no datum is selected yet.
                    test('screenshot', async () => {
                        await compareExact('drag-modifiers-line-hidewithsize0-initial');
                    });
                    test('getSelection', () => {
                        expect(getChartSelectionArray()).toEqual([]);
                    });
                    test('selectionChange', () => {
                        expect(selectionChange.popEvents()).toEqual([]);
                    });
                });
                describe('mousedown and mousemove', () => {
                    beforeEach(async () => {
                        await mouseDown(DRAG_FROM);
                        await mouseMove(DRAG_TO);
                    });
                    // Markers under the drag box render as selection candidates even though
                    // hideWithSize0 hides every other marker. Nothing is committed yet.
                    test('screenshot', async () => {
                        await compareExact('drag-modifiers-line-hidewithsize0-candidacy');
                    });
                    test('getSelection', () => {
                        expect(getChartSelectionArray()).toEqual([]);
                    });
                    test('selectionChange', () => {
                        expect(selectionChange.popEvents()).toEqual([]);
                    });

                    describe('mouseup', () => {
                        beforeEach(async () => {
                            await mouseUp(DRAG_TO);
                        });
                        // The candidate markers commit to the selection on mouseup.
                        test('screenshot', async () => {
                            await compareExact('drag-modifiers-line-hidewithsize0-selected');
                        });
                        test('getSelection', () => {
                            expect(getChartSelectionArray()).toEqual(SELECTION);
                        });
                        test('selectionChange', () => {
                            expect(selectionChange.popEvents()).toEqual(SELECTIONCHANGE);
                        });
                    });
                });
            });
        });

        describe('area', () => {
            describe('hideWithSize0 large dataset', () => {
                type D = SineWaveDatum;
                type C = unknown;
                type I = AgSelectionItem<D>;
                let selectionChange: SelectionChangeRecorder<D, C>;

                const DRAG_FROM: CanvasPoint = { canvasX: 200, canvasY: 100 };
                const DRAG_TO: CanvasPoint = { canvasX: 500, canvasY: 500 };

                const areaDatum = (x: number, y: number): I => {
                    return { datum: { x, y }, itemId: x, seriesId: 'areaid' };
                };
                const SELECTION: I[] = [
                    areaDatum(257, -0.7836934573258398),
                    areaDatum(258, -0.7705132427757896),
                    areaDatum(259, -0.7569950556517565),
                    areaDatum(260, -0.743144825477394),
                    areaDatum(261, -0.7289686274214116),
                    areaDatum(262, -0.7144726796328037),
                    areaDatum(263, -0.6996633405133654),
                    areaDatum(264, -0.684547105928689),
                    areaDatum(265, -0.6691306063588588),
                    areaDatum(266, -0.6534206039901057),
                    areaDatum(267, -0.6374239897486896),
                    areaDatum(268, -0.6211477802783106),
                    areaDatum(269, -0.6045991148623754),
                    areaDatum(270, -0.5877852522924734),
                    areaDatum(271, -0.5707135676844322),
                    areaDatum(272, -0.5533915492433442),
                    areaDatum(273, -0.5358267949789963),
                    areaDatum(274, -0.5180270093731303),
                    areaDatum(275, -0.5000000000000004),
                    areaDatum(276, -0.4817536741017153),
                    areaDatum(277, -0.46329603511986217),
                    areaDatum(278, -0.44463517918492745),
                    areaDatum(279, -0.4257792915650722),
                    areaDatum(280, -0.40673664307580015),
                    areaDatum(281, -0.38751558645210327),
                    areaDatum(282, -0.3681245526846787),
                    areaDatum(283, -0.3485720473218155),
                    areaDatum(284, -0.3288666467385839),
                    areaDatum(285, -0.3090169943749476),
                    areaDatum(286, -0.28903179694447134),
                    areaDatum(287, -0.26891982061526587),
                    areaDatum(288, -0.24868988716485535),
                    areaDatum(289, -0.22835087011065586),
                    areaDatum(290, -0.20791169081775987),
                    areaDatum(291, -0.18738131458572468),
                    areaDatum(292, -0.16676874671610187),
                    areaDatum(293, -0.14608302856241162),
                    areaDatum(294, -0.12533323356430465),
                    areaDatum(295, -0.1045284632676543),
                    areaDatum(296, -0.08367784333231584),
                    areaDatum(297, -0.06279051952931326),
                    areaDatum(298, -0.04187565372919993),
                    areaDatum(299, -0.02094241988335679),
                    areaDatum(300, -2.4492935982947064e-16),
                    areaDatum(301, 0.020942419883357186),
                    areaDatum(302, 0.041875653729198554),
                    areaDatum(303, 0.06279051952931278),
                    areaDatum(304, 0.08367784333231536),
                    areaDatum(305, 0.10452846326765293),
                    areaDatum(306, 0.12533323356430418),
                    areaDatum(307, 0.146083028562412),
                    areaDatum(308, 0.16676874671610137),
                    areaDatum(309, 0.1873813145857242),
                    areaDatum(310, 0.20791169081775937),
                    areaDatum(311, 0.22835087011065539),
                    areaDatum(312, 0.24868988716485488),
                    areaDatum(313, 0.26891982061526454),
                    areaDatum(314, 0.2890317969444709),
                    areaDatum(315, 0.3090169943749472),
                    areaDatum(316, 0.3288666467385826),
                    areaDatum(317, 0.348572047321815),
                    areaDatum(318, 0.3681245526846782),
                    areaDatum(319, 0.38751558645210205),
                    areaDatum(320, 0.4067366430757997),
                    areaDatum(321, 0.42577929156507255),
                    areaDatum(322, 0.444635179184927),
                    areaDatum(323, 0.4632960351198617),
                    areaDatum(324, 0.48175367410171566),
                    areaDatum(325, 0.4999999999999993),
                    areaDatum(326, 0.5180270093731298),
                    areaDatum(327, 0.5358267949789967),
                    areaDatum(328, 0.5533915492433438),
                    areaDatum(329, 0.5707135676844318),
                    areaDatum(330, 0.5877852522924736),
                    areaDatum(331, 0.6045991148623743),
                    areaDatum(332, 0.6211477802783102),
                    areaDatum(333, 0.63742398974869),
                    areaDatum(334, 0.6534206039901054),
                    areaDatum(335, 0.6691306063588585),
                    areaDatum(336, 0.6845471059286893),
                    areaDatum(337, 0.699663340513365),
                    areaDatum(413, 0.6996633405133654),
                    areaDatum(414, 0.6845471059286897),
                    areaDatum(415, 0.6691306063588589),
                    areaDatum(416, 0.6534206039901058),
                    areaDatum(417, 0.6374239897486911),
                    areaDatum(418, 0.6211477802783114),
                    areaDatum(419, 0.6045991148623755),
                    areaDatum(420, 0.5877852522924734),
                    areaDatum(421, 0.5707135676844316),
                    areaDatum(422, 0.5533915492433436),
                    areaDatum(423, 0.5358267949789972),
                    areaDatum(424, 0.5180270093731304),
                    areaDatum(425, 0.4999999999999998),
                    areaDatum(426, 0.4817536741017162),
                    areaDatum(427, 0.4632960351198622),
                    areaDatum(428, 0.44463517918492756),
                    areaDatum(429, 0.42577929156507394),
                    areaDatum(430, 0.40673664307580104),
                    areaDatum(431, 0.3875155864521034),
                    areaDatum(432, 0.368124552684678),
                    areaDatum(433, 0.3485720473218148),
                    areaDatum(434, 0.32886664673858235),
                    areaDatum(435, 0.3090169943749478),
                    areaDatum(436, 0.28903179694447145),
                    areaDatum(437, 0.26891982061526515),
                    areaDatum(438, 0.2486898871648555),
                    areaDatum(439, 0.22835087011065597),
                    areaDatum(440, 0.20791169081776084),
                    areaDatum(441, 0.18738131458572568),
                    areaDatum(442, 0.16676874671610287),
                    areaDatum(443, 0.14608302856241173),
                    areaDatum(444, 0.1253332335643039),
                    areaDatum(445, 0.10452846326765265),
                    areaDatum(446, 0.08367784333231597),
                    areaDatum(447, 0.06279051952931339),
                    areaDatum(448, 0.041875653729199165),
                    areaDatum(449, 0.0209424198833578),
                    areaDatum(450, 3.6739403974420594e-16),
                    areaDatum(451, -0.020942419883357065),
                    areaDatum(452, -0.04187565372919843),
                    areaDatum(453, -0.06279051952931265),
                    areaDatum(454, -0.08367784333231525),
                    areaDatum(455, -0.10452846326765193),
                    areaDatum(456, -0.12533323356430318),
                    areaDatum(457, -0.146083028562411),
                    areaDatum(458, -0.16676874671610215),
                    areaDatum(459, -0.18738131458572496),
                    areaDatum(460, -0.20791169081776012),
                    areaDatum(461, -0.22835087011065525),
                    areaDatum(462, -0.24868988716485477),
                    areaDatum(463, -0.2689198206152644),
                    areaDatum(464, -0.2890317969444708),
                    areaDatum(465, -0.30901699437494706),
                    areaDatum(466, -0.3288666467385817),
                    areaDatum(467, -0.34857204732181407),
                    areaDatum(468, -0.36812455268467725),
                    areaDatum(469, -0.3875155864521027),
                    areaDatum(470, -0.4067366430758004),
                    areaDatum(471, -0.42577929156507327),
                    areaDatum(472, -0.4446351791849269),
                    areaDatum(473, -0.4632960351198616),
                    areaDatum(474, -0.48175367410171555),
                    areaDatum(475, -0.49999999999999917),
                    areaDatum(476, -0.5180270093731297),
                    areaDatum(477, -0.5358267949789965),
                    areaDatum(478, -0.553391549243343),
                    areaDatum(479, -0.5707135676844309),
                    areaDatum(480, -0.5877852522924728),
                    areaDatum(481, -0.6045991148623749),
                    areaDatum(482, -0.6211477802783107),
                    areaDatum(483, -0.6374239897486905),
                    areaDatum(484, -0.6534206039901053),
                    areaDatum(485, -0.6691306063588583),
                    areaDatum(486, -0.6845471059286892),
                    areaDatum(487, -0.699663340513365),
                    areaDatum(488, -0.7144726796328033),
                    areaDatum(489, -0.7289686274214106),
                    areaDatum(490, -0.7431448254773936),
                    areaDatum(491, -0.7569950556517561),
                    areaDatum(492, -0.770513242775788),
                    areaDatum(493, -0.783693457325839),
                    areaDatum(557, -0.7836934573258395),
                    areaDatum(558, -0.7705132427757886),
                    areaDatum(559, -0.7569950556517566),
                    areaDatum(560, -0.7431448254773941),
                    areaDatum(561, -0.7289686274214111),
                    areaDatum(562, -0.7144726796328038),
                    areaDatum(563, -0.6996633405133655),
                    areaDatum(564, -0.6845471059286898),
                    areaDatum(565, -0.669130606358859),
                    areaDatum(566, -0.6534206039901059),
                    areaDatum(567, -0.6374239897486912),
                    areaDatum(568, -0.6211477802783115),
                    areaDatum(569, -0.6045991148623756),
                    areaDatum(570, -0.5877852522924735),
                    areaDatum(571, -0.5707135676844317),
                    areaDatum(572, -0.5533915492433437),
                    areaDatum(573, -0.5358267949789973),
                    areaDatum(574, -0.5180270093731305),
                    areaDatum(575, -0.4999999999999999),
                    areaDatum(576, -0.4817536741017163),
                    areaDatum(577, -0.46329603511986234),
                    areaDatum(578, -0.4446351791849277),
                    areaDatum(579, -0.42577929156507405),
                    areaDatum(580, -0.4067366430758012),
                    areaDatum(581, -0.38751558645210354),
                    areaDatum(582, -0.3681245526846781),
                    areaDatum(583, -0.3485720473218149),
                    areaDatum(584, -0.32886664673858246),
                    areaDatum(585, -0.3090169943749479),
                    areaDatum(586, -0.2890317969444716),
                    areaDatum(587, -0.26891982061526526),
                    areaDatum(588, -0.2486898871648556),
                    areaDatum(589, -0.2283508701106561),
                    areaDatum(590, -0.20791169081776098),
                    areaDatum(591, -0.1873813145857258),
                    areaDatum(592, -0.16676874671610298),
                    areaDatum(593, -0.14608302856241187),
                    areaDatum(594, -0.125333233564304),
                    areaDatum(595, -0.10452846326765278),
                    areaDatum(596, -0.0836778433323161),
                    areaDatum(597, -0.06279051952931351),
                    areaDatum(598, -0.04187565372919929),
                    areaDatum(599, -0.020942419883357922),
                    areaDatum(600, -4.898587196589413e-16),
                    areaDatum(601, 0.020942419883356943),
                    areaDatum(602, 0.04187565372920009),
                    areaDatum(603, 0.06279051952931075),
                    areaDatum(604, 0.08367784333231335),
                    areaDatum(605, 0.1045284632676518),
                    areaDatum(606, 0.12533323356430304),
                    areaDatum(607, 0.1460830285624109),
                    areaDatum(608, 0.166768746716102),
                    areaDatum(609, 0.1873813145857231),
                    areaDatum(610, 0.20791169081775826),
                    areaDatum(611, 0.22835087011065514),
                    areaDatum(612, 0.24868988716485466),
                    areaDatum(613, 0.26891982061526604),
                    areaDatum(614, 0.28903179694447234),
                    areaDatum(615, 0.30901699437494523),
                    areaDatum(616, 0.3288666467385815),
                    areaDatum(617, 0.34857204732181396),
                    areaDatum(618, 0.36812455268467714),
                    areaDatum(619, 0.3875155864521026),
                    areaDatum(620, 0.40673664307580026),
                    areaDatum(621, 0.42577929156507155),
                    areaDatum(622, 0.44463517918492684),
                    areaDatum(623, 0.4632960351198615),
                    areaDatum(624, 0.48175367410171543),
                    areaDatum(625, 0.5000000000000006),
                    areaDatum(626, 0.5180270093731282),
                    areaDatum(627, 0.535826794978995),
                    areaDatum(628, 0.5533915492433429),
                    areaDatum(629, 0.5707135676844308),
                    areaDatum(630, 0.5877852522924727),
                    areaDatum(631, 0.6045991148623748),
                    areaDatum(632, 0.6211477802783093),
                    areaDatum(633, 0.6374239897486891),
                    areaDatum(634, 0.6534206039901052),
                    areaDatum(635, 0.6691306063588582),
                    areaDatum(636, 0.6845471059286891),
                    areaDatum(637, 0.6996633405133661),
                    areaDatum(713, 0.699663340513367),
                    areaDatum(714, 0.6845471059286898),
                    areaDatum(715, 0.6691306063588591),
                    areaDatum(716, 0.6534206039901059),
                    areaDatum(717, 0.6374239897486899),
                    areaDatum(718, 0.6211477802783102),
                    areaDatum(719, 0.6045991148623757),
                    areaDatum(720, 0.5877852522924736),
                    areaDatum(721, 0.5707135676844318),
                    areaDatum(722, 0.5533915492433438),
                    areaDatum(723, 0.5358267949789959),
                    areaDatum(724, 0.5180270093731291),
                    areaDatum(725, 0.5000000000000016),
                    areaDatum(726, 0.48175367410171643),
                    areaDatum(727, 0.46329603511986245),
                    areaDatum(728, 0.4446351791849278),
                    areaDatum(729, 0.42577929156507255),
                    areaDatum(730, 0.4067366430758013),
                    areaDatum(731, 0.38751558645210366),
                    areaDatum(732, 0.3681245526846782),
                    areaDatum(733, 0.348572047321815),
                    areaDatum(734, 0.32886664673858257),
                    areaDatum(735, 0.3090169943749463),
                    areaDatum(736, 0.2890317969444734),
                    areaDatum(737, 0.2689198206152671),
                    areaDatum(738, 0.2486898871648557),
                ];

                const SELECTIONCHANGE: AgSelectionChangeEvent<D, C>[] = [
                    uiChangeEvent<D, C>({ added: SELECTION, removed: [] }),
                ];

                beforeEach(async () => {
                    const { data, series, axes, legend } = createAreaSineWaveOptions();
                    selectionChange = createSelectionChangeRecorder();
                    chart = await createChartInstance({
                        data,
                        series,
                        axes,
                        legend,
                        selection: {
                            containment: 'any',
                            enabled: true,
                            enableDrag: true,
                            enableClick: false,
                        },
                        navigator: { enabled: false },
                        scrollbar: { enabled: false },
                        zoom: { enabled: false },
                        listeners: { selectionChange },
                    });
                });
                describe('initial', () => {
                    // The dense area is drawn, but every marker is hidden (size 0): hideWithSize0
                    // is active and no datum is selected yet.
                    test('screenshot', async () => {
                        await compareExact('drag-modifiers-area-hidewithsize0-initial');
                    });
                    test('getSelection', () => {
                        expect(getChartSelectionArray()).toEqual([]);
                    });
                    test('selectionChange', () => {
                        expect(selectionChange.popEvents()).toEqual([]);
                    });
                });
                describe('mousedown and mousemove', () => {
                    beforeEach(async () => {
                        await mouseDown(DRAG_FROM);
                        await mouseMove(DRAG_TO);
                    });
                    // Markers under the drag box render as selection candidates even though
                    // hideWithSize0 hides every other marker. Nothing is committed yet.
                    test('screenshot', async () => {
                        await compareExact('drag-modifiers-area-hidewithsize0-candidacy');
                    });
                    test('getSelection', () => {
                        expect(getChartSelectionArray()).toEqual([]);
                    });
                    test('selectionChange', () => {
                        expect(selectionChange.popEvents()).toEqual([]);
                    });

                    describe('mouseup', () => {
                        beforeEach(async () => {
                            await mouseUp(DRAG_TO);
                        });
                        // The candidate markers commit to the selection on mouseup.
                        test('screenshot', async () => {
                            await compareExact('drag-modifiers-area-hidewithsize0-selected');
                        });
                        test('getSelection', () => {
                            expect(getChartSelectionArray()).toEqual(SELECTION);
                        });
                        test('selectionChange', () => {
                            expect(selectionChange.popEvents()).toEqual(SELECTIONCHANGE);
                        });
                    });
                });
            });
        });

        describe('range-area', () => {
            describe('hideWithSize0 large dataset', () => {
                type D = SineWaveRangeDatum;
                type C = unknown;
                type I = AgSelectionItem<D>;
                let selectionChange: SelectionChangeRecorder<D, C>;

                const DRAG_FROM: CanvasPoint = { canvasX: 200, canvasY: 100 };
                const DRAG_TO: CanvasPoint = { canvasX: 500, canvasY: 500 };

                const rangeAreaDatum = (x: number, high: number, low: number): I => {
                    return { datum: { x, high, low }, itemId: x, seriesId: 'rangeareaid' };
                };

                const SELECTION: I[] = [
                    rangeAreaDatum(244, -0.6718631515885005, -1.1718631515885005),
                    rangeAreaDatum(245, -0.6635454576426011, -1.1635454576426012),
                    rangeAreaDatum(246, -0.6548270524660199, -1.15482705246602),
                    rangeAreaDatum(247, -0.645711760239413, -1.1457117602394131),
                    rangeAreaDatum(248, -0.6362035792312147, -1.1362035792312146),
                    rangeAreaDatum(249, -0.6263066800438638, -1.126306680043864),
                    rangeAreaDatum(250, -0.6160254037844386, -1.1160254037844386),
                    rangeAreaDatum(251, -0.6053642601605068, -1.1053642601605067),
                    rangeAreaDatum(252, -0.5943279255020155, -1.0943279255020155),
                    rangeAreaDatum(253, -0.5829212407100997, -1.0829212407100997),
                    rangeAreaDatum(254, -0.5711492091337039, -1.0711492091337038),
                    rangeAreaDatum(255, -0.5590169943749476, -1.0590169943749475),
                    rangeAreaDatum(256, -0.5465299180241961, -1.0465299180241963),
                    rangeAreaDatum(257, -0.5336934573258398, -1.0336934573258398),
                    rangeAreaDatum(258, -0.5205132427757896, -1.0205132427757895),
                    rangeAreaDatum(259, -0.5069950556517565, -1.0069950556517564),
                    rangeAreaDatum(260, -0.493144825477394, -0.993144825477394),
                    rangeAreaDatum(261, -0.47896862742141155, -0.9789686274214116),
                    rangeAreaDatum(262, -0.4644726796328037, -0.9644726796328037),
                    rangeAreaDatum(263, -0.44966334051336543, -0.9496633405133654),
                    rangeAreaDatum(264, -0.43454710592868895, -0.934547105928689),
                    rangeAreaDatum(265, -0.4191306063588588, -0.9191306063588588),
                    rangeAreaDatum(266, -0.4034206039901057, -0.9034206039901057),
                    rangeAreaDatum(267, -0.38742398974868963, -0.8874239897486896),
                    rangeAreaDatum(268, -0.37114778027831064, -0.8711477802783106),
                    rangeAreaDatum(269, -0.3545991148623754, -0.8545991148623754),
                    rangeAreaDatum(270, -0.33778525229247336, -0.8377852522924734),
                    rangeAreaDatum(271, -0.32071356768443215, -0.8207135676844322),
                    rangeAreaDatum(272, -0.3033915492433442, -0.8033915492433442),
                    rangeAreaDatum(273, -0.2858267949789963, -0.7858267949789963),
                    rangeAreaDatum(274, -0.2680270093731303, -0.7680270093731303),
                    rangeAreaDatum(275, -0.25000000000000044, -0.7500000000000004),
                    rangeAreaDatum(276, -0.23175367410171532, -0.7317536741017153),
                    rangeAreaDatum(277, -0.21329603511986217, -0.7132960351198622),
                    rangeAreaDatum(278, -0.19463517918492745, -0.6946351791849275),
                    rangeAreaDatum(279, -0.17577929156507222, -0.6757792915650722),
                    rangeAreaDatum(280, -0.15673664307580015, -0.6567366430758002),
                    rangeAreaDatum(281, -0.13751558645210327, -0.6375155864521033),
                    rangeAreaDatum(282, -0.1181245526846787, -0.6181245526846787),
                    rangeAreaDatum(283, -0.09857204732181551, -0.5985720473218155),
                    rangeAreaDatum(284, -0.0788666467385839, -0.5788666467385839),
                    rangeAreaDatum(285, -0.05901699437494762, -0.5590169943749477),
                    rangeAreaDatum(286, -0.03903179694447134, -0.5390317969444713),
                    rangeAreaDatum(287, -0.01891982061526587, -0.5189198206152659),
                    rangeAreaDatum(288, 0.00131011283514465, -0.49868988716485535),
                    rangeAreaDatum(289, 0.021649129889344143, -0.47835087011065586),
                    rangeAreaDatum(290, 0.04208830918224013, -0.45791169081775984),
                    rangeAreaDatum(291, 0.06261868541427532, -0.4373813145857247),
                    rangeAreaDatum(292, 0.08323125328389813, -0.41676874671610187),
                    rangeAreaDatum(293, 0.10391697143758838, -0.3960830285624116),
                    rangeAreaDatum(294, 0.12466676643569535, -0.37533323356430465),
                    rangeAreaDatum(295, 0.1454715367323457, -0.3545284632676543),
                    rangeAreaDatum(296, 0.16632215666768416, -0.33367784333231587),
                    rangeAreaDatum(297, 0.18720948047068675, -0.31279051952931325),
                    rangeAreaDatum(298, 0.20812434627080006, -0.29187565372919994),
                    rangeAreaDatum(299, 0.2290575801166432, -0.27094241988335677),
                    rangeAreaDatum(300, 0.24999999999999975, -0.2500000000000002),
                    rangeAreaDatum(301, 0.2709424198833572, -0.22905758011664282),
                    rangeAreaDatum(302, 0.29187565372919855, -0.20812434627080145),
                    rangeAreaDatum(303, 0.3127905195293128, -0.18720948047068722),
                    rangeAreaDatum(304, 0.33367784333231537, -0.16632215666768463),
                    rangeAreaDatum(305, 0.3545284632676529, -0.14547153673234708),
                    rangeAreaDatum(306, 0.37533323356430415, -0.12466676643569582),
                    rangeAreaDatum(307, 0.396083028562412, -0.10391697143758799),
                    rangeAreaDatum(308, 0.41676874671610137, -0.08323125328389863),
                    rangeAreaDatum(309, 0.4373813145857242, -0.06261868541427579),
                    rangeAreaDatum(310, 0.4579116908177594, -0.04208830918224063),
                    rangeAreaDatum(311, 0.47835087011065536, -0.021649129889344615),
                    rangeAreaDatum(312, 0.49868988716485485, -0.0013101128351451219),
                    rangeAreaDatum(313, 0.5189198206152645, 0.018919820615264538),
                    rangeAreaDatum(314, 0.5390317969444709, 0.0390317969444709),
                    rangeAreaDatum(315, 0.5590169943749472, 0.059016994374947174),
                    rangeAreaDatum(316, 0.5788666467385826, 0.07886664673858262),
                    rangeAreaDatum(317, 0.598572047321815, 0.09857204732181502),
                    rangeAreaDatum(318, 0.6181245526846781, 0.1181245526846782),
                    rangeAreaDatum(319, 0.637515586452102, 0.13751558645210205),
                    rangeAreaDatum(320, 0.6567366430757997, 0.1567366430757997),
                    rangeAreaDatum(321, 0.6757792915650725, 0.17577929156507255),
                    rangeAreaDatum(322, 0.694635179184927, 0.194635179184927),
                    rangeAreaDatum(323, 0.7132960351198617, 0.21329603511986173),
                    rangeAreaDatum(324, 0.7317536741017157, 0.23175367410171566),
                    rangeAreaDatum(325, 0.7499999999999993, 0.24999999999999928),
                    rangeAreaDatum(326, 0.7680270093731298, 0.26802700937312984),
                    rangeAreaDatum(327, 0.7858267949789967, 0.28582679497899666),
                    rangeAreaDatum(328, 0.8033915492433438, 0.30339154924334377),
                    rangeAreaDatum(329, 0.8207135676844318, 0.3207135676844318),
                    rangeAreaDatum(330, 0.8377852522924736, 0.3377852522924736),
                    rangeAreaDatum(331, 0.8545991148623743, 0.3545991148623743),
                    rangeAreaDatum(332, 0.8711477802783102, 0.3711477802783102),
                    rangeAreaDatum(333, 0.88742398974869, 0.38742398974868997),
                    rangeAreaDatum(334, 0.9034206039901054, 0.4034206039901054),
                    rangeAreaDatum(335, 0.9191306063588585, 0.41913060635885846),
                    rangeAreaDatum(336, 0.9345471059286893, 0.4345471059286893),
                    rangeAreaDatum(337, 0.949663340513365, 0.449663340513365),
                    rangeAreaDatum(338, 0.9644726796328034, 0.46447267963280336),
                    rangeAreaDatum(339, 0.9789686274214106, 0.47896862742141055),
                    rangeAreaDatum(340, 0.9931448254773937, 0.4931448254773937),
                    rangeAreaDatum(341, 1.0069950556517562, 0.5069950556517562),
                    rangeAreaDatum(342, 1.0205132427757886, 0.5205132427757887),
                    rangeAreaDatum(343, 1.0336934573258396, 0.5336934573258396),
                    rangeAreaDatum(344, 1.0465299180241963, 0.5465299180241964),
                    rangeAreaDatum(345, 1.0590169943749468, 0.5590169943749468),
                    rangeAreaDatum(346, 1.0711492091337036, 0.5711492091337036),
                    rangeAreaDatum(347, 1.0829212407100992, 0.5829212407100993),
                    rangeAreaDatum(348, 1.0943279255020149, 0.5943279255020147),
                    rangeAreaDatum(349, 1.1053642601605065, 0.6053642601605065),
                    rangeAreaDatum(350, 1.1160254037844388, 0.6160254037844388),
                    rangeAreaDatum(351, 1.126306680043863, 0.6263066800438631),
                    rangeAreaDatum(352, 1.1362035792312146, 0.6362035792312145),
                    rangeAreaDatum(353, 1.1457117602394127, 0.6457117602394128),
                    rangeAreaDatum(354, 1.1548270524660194, 0.6548270524660194),
                    rangeAreaDatum(355, 1.1635454576426008, 0.6635454576426009),
                    rangeAreaDatum(356, 1.1718631515885007, 0.6718631515885007),
                    rangeAreaDatum(357, 1.1797764858882511, 0.6797764858882511),
                    rangeAreaDatum(358, 1.1872819894918913, 0.6872819894918913),
                    rangeAreaDatum(359, 1.1943763702374812, 0.6943763702374811),
                    rangeAreaDatum(360, 1.2010565162951536, 0.7010565162951535),
                    rangeAreaDatum(361, 1.2073194975320674, 0.7073194975320674),
                    rangeAreaDatum(362, 1.2131625667976582, 0.7131625667976583),
                    rangeAreaDatum(363, 1.218583161128631, 0.718583161128631),
                    rangeAreaDatum(364, 1.22357890287316, 0.7235789028731602),
                    rangeAreaDatum(365, 1.2281476007338055, 0.7281476007338055),
                    rangeAreaDatum(366, 1.2322872507286886, 0.7322872507286886),
                    rangeAreaDatum(367, 1.235996037070505, 0.735996037070505),
                    rangeAreaDatum(368, 1.2392723329629882, 0.7392723329629882),
                    rangeAreaDatum(369, 1.2421147013144778, 0.7421147013144778),
                    rangeAreaDatum(370, 1.2445218953682733, 0.7445218953682733),
                    rangeAreaDatum(371, 1.2464928592495044, 0.7464928592495043),
                    rangeAreaDatum(372, 1.2480267284282716, 0.7480267284282716),
                    rangeAreaDatum(373, 1.2491228300988584, 0.7491228300988584),
                    rangeAreaDatum(374, 1.2497806834748455, 0.7497806834748455),
                    rangeAreaDatum(375, 1.25, 0.75),
                    rangeAreaDatum(376, 1.2497806834748455, 0.7497806834748455),
                    rangeAreaDatum(377, 1.2491228300988584, 0.7491228300988584),
                    rangeAreaDatum(378, 1.2480267284282716, 0.7480267284282716),
                    rangeAreaDatum(379, 1.2464928592495044, 0.7464928592495044),
                    rangeAreaDatum(380, 1.2445218953682735, 0.7445218953682734),
                    rangeAreaDatum(381, 1.242114701314478, 0.7421147013144779),
                    rangeAreaDatum(382, 1.2392723329629884, 0.7392723329629884),
                    rangeAreaDatum(383, 1.235996037070505, 0.735996037070505),
                    rangeAreaDatum(384, 1.2322872507286886, 0.7322872507286886),
                    rangeAreaDatum(385, 1.2281476007338055, 0.7281476007338055),
                    rangeAreaDatum(386, 1.2235789028731605, 0.7235789028731604),
                    rangeAreaDatum(387, 1.218583161128631, 0.7185831611286311),
                    rangeAreaDatum(388, 1.2131625667976587, 0.7131625667976585),
                    rangeAreaDatum(389, 1.2073194975320676, 0.7073194975320675),
                    rangeAreaDatum(390, 1.2010565162951536, 0.7010565162951536),
                    rangeAreaDatum(391, 1.1943763702374817, 0.6943763702374816),
                    rangeAreaDatum(392, 1.187281989491892, 0.6872819894918919),
                    rangeAreaDatum(393, 1.1797764858882518, 0.6797764858882517),
                    rangeAreaDatum(394, 1.1718631515885005, 0.6718631515885006),
                    rangeAreaDatum(395, 1.1635454576426008, 0.6635454576426008),
                    rangeAreaDatum(396, 1.1548270524660191, 0.6548270524660192),
                    rangeAreaDatum(397, 1.1457117602394131, 0.6457117602394131),
                    rangeAreaDatum(398, 1.1362035792312146, 0.6362035792312147),
                    rangeAreaDatum(399, 1.1263066800438635, 0.6263066800438634),
                    rangeAreaDatum(400, 1.1160254037844393, 0.6160254037844392),
                    rangeAreaDatum(401, 1.1053642601605067, 0.6053642601605068),
                    rangeAreaDatum(402, 1.094327925502015, 0.5943279255020151),
                    rangeAreaDatum(403, 1.0829212407101, 0.5829212407101002),
                    rangeAreaDatum(404, 1.0711492091337045, 0.5711492091337045),
                    rangeAreaDatum(405, 1.0590169943749475, 0.5590169943749476),
                    rangeAreaDatum(406, 1.0465299180241963, 0.5465299180241961),
                    rangeAreaDatum(407, 1.0336934573258394, 0.5336934573258394),
                    rangeAreaDatum(408, 1.0205132427757886, 0.5205132427757886),
                    rangeAreaDatum(409, 1.0069950556517566, 0.5069950556517566),
                    rangeAreaDatum(410, 0.993144825477394, 0.493144825477394),
                    rangeAreaDatum(411, 0.978968627421411, 0.478968627421411),
                    rangeAreaDatum(412, 0.9644726796328038, 0.4644726796328038),
                    rangeAreaDatum(413, 0.9496633405133654, 0.44966334051336543),
                    rangeAreaDatum(414, 0.9345471059286897, 0.4345471059286897),
                    rangeAreaDatum(415, 0.9191306063588589, 0.4191306063588589),
                    rangeAreaDatum(416, 0.9034206039901058, 0.4034206039901058),
                    rangeAreaDatum(417, 0.8874239897486911, 0.3874239897486911),
                    rangeAreaDatum(418, 0.8711477802783114, 0.3711477802783114),
                    rangeAreaDatum(419, 0.8545991148623755, 0.3545991148623755),
                    rangeAreaDatum(420, 0.8377852522924734, 0.33778525229247336),
                    rangeAreaDatum(421, 0.8207135676844316, 0.3207135676844316),
                    rangeAreaDatum(422, 0.8033915492433436, 0.30339154924334355),
                    rangeAreaDatum(423, 0.7858267949789972, 0.2858267949789972),
                    rangeAreaDatum(424, 0.7680270093731304, 0.2680270093731304),
                    rangeAreaDatum(425, 0.7499999999999998, 0.24999999999999978),
                    rangeAreaDatum(426, 0.7317536741017162, 0.2317536741017162),
                    rangeAreaDatum(427, 0.7132960351198623, 0.21329603511986223),
                    rangeAreaDatum(428, 0.6946351791849276, 0.19463517918492756),
                    rangeAreaDatum(429, 0.675779291565074, 0.17577929156507394),
                    rangeAreaDatum(430, 0.656736643075801, 0.15673664307580104),
                    rangeAreaDatum(431, 0.6375155864521034, 0.13751558645210338),
                    rangeAreaDatum(432, 0.6181245526846779, 0.11812455268467797),
                    rangeAreaDatum(433, 0.5985720473218148, 0.09857204732181479),
                    rangeAreaDatum(434, 0.5788666467385823, 0.07886664673858235),
                    rangeAreaDatum(435, 0.5590169943749478, 0.059016994374947784),
                    rangeAreaDatum(436, 0.5390317969444715, 0.03903179694447145),
                    rangeAreaDatum(437, 0.5189198206152652, 0.018919820615265148),
                    rangeAreaDatum(438, 0.4986898871648555, -0.0013101128351445113),
                    rangeAreaDatum(439, 0.47835087011065597, -0.021649129889344032),
                    rangeAreaDatum(440, 0.45791169081776084, -0.04208830918223916),
                    rangeAreaDatum(441, 0.4373813145857257, -0.06261868541427432),
                    rangeAreaDatum(442, 0.41676874671610287, -0.08323125328389713),
                    rangeAreaDatum(443, 0.39608302856241173, -0.10391697143758827),
                    rangeAreaDatum(444, 0.3753332335643039, -0.1246667664356961),
                    rangeAreaDatum(445, 0.35452846326765264, -0.14547153673234736),
                    rangeAreaDatum(446, 0.333677843332316, -0.16632215666768402),
                    rangeAreaDatum(447, 0.31279051952931336, -0.1872094804706866),
                    rangeAreaDatum(448, 0.29187565372919916, -0.20812434627080084),
                    rangeAreaDatum(449, 0.2709424198833578, -0.2290575801166422),
                    rangeAreaDatum(450, 0.2500000000000004, -0.24999999999999964),
                    rangeAreaDatum(451, 0.22905758011664293, -0.27094241988335704),
                    rangeAreaDatum(452, 0.20812434627080156, -0.29187565372919844),
                    rangeAreaDatum(453, 0.18720948047068736, -0.31279051952931264),
                    rangeAreaDatum(454, 0.16632215666768474, -0.33367784333231526),
                    rangeAreaDatum(455, 0.14547153673234808, -0.3545284632676519),
                    rangeAreaDatum(456, 0.12466676643569682, -0.37533323356430315),
                    rangeAreaDatum(457, 0.10391697143758899, -0.396083028562411),
                    rangeAreaDatum(458, 0.08323125328389785, -0.41676874671610215),
                    rangeAreaDatum(459, 0.06261868541427504, -0.43738131458572493),
                    rangeAreaDatum(460, 0.04208830918223988, -0.4579116908177601),
                    rangeAreaDatum(461, 0.021649129889344754, -0.47835087011065525),
                    rangeAreaDatum(462, 0.001310112835145233, -0.49868988716485474),
                    rangeAreaDatum(463, -0.018919820615264427, -0.5189198206152644),
                    rangeAreaDatum(464, -0.03903179694447079, -0.5390317969444708),
                    rangeAreaDatum(465, -0.05901699437494706, -0.559016994374947),
                    rangeAreaDatum(466, -0.07886664673858168, -0.5788666467385817),
                    rangeAreaDatum(467, -0.09857204732181407, -0.5985720473218141),
                    rangeAreaDatum(468, -0.11812455268467725, -0.6181245526846773),
                    rangeAreaDatum(469, -0.1375155864521027, -0.6375155864521027),
                    rangeAreaDatum(470, -0.15673664307580037, -0.6567366430758004),
                    rangeAreaDatum(471, -0.17577929156507327, -0.6757792915650733),
                    rangeAreaDatum(472, -0.1946351791849269, -0.6946351791849269),
                    rangeAreaDatum(473, -0.21329603511986162, -0.7132960351198616),
                    rangeAreaDatum(474, -0.23175367410171555, -0.7317536741017155),
                    rangeAreaDatum(475, -0.24999999999999917, -0.7499999999999991),
                    rangeAreaDatum(476, -0.26802700937312973, -0.7680270093731297),
                    rangeAreaDatum(477, -0.28582679497899655, -0.7858267949789965),
                    rangeAreaDatum(478, -0.303391549243343, -0.803391549243343),
                    rangeAreaDatum(479, -0.32071356768443093, -0.8207135676844309),
                    rangeAreaDatum(480, -0.3377852522924728, -0.8377852522924728),
                    rangeAreaDatum(481, -0.35459911486237494, -0.8545991148623749),
                    rangeAreaDatum(482, -0.37114778027831075, -0.8711477802783107),
                    rangeAreaDatum(483, -0.3874239897486905, -0.8874239897486905),
                    rangeAreaDatum(484, -0.40342060399010526, -0.9034206039901053),
                    rangeAreaDatum(485, -0.41913060635885835, -0.9191306063588583),
                    rangeAreaDatum(486, -0.43454710592868917, -0.9345471059286892),
                    rangeAreaDatum(487, -0.449663340513365, -0.949663340513365),
                    rangeAreaDatum(488, -0.46447267963280325, -0.9644726796328033),
                    rangeAreaDatum(489, -0.47896862742141055, -0.9789686274214106),
                    rangeAreaDatum(490, -0.4931448254773936, -0.9931448254773936),
                    rangeAreaDatum(491, -0.5069950556517561, -1.006995055651756),
                    rangeAreaDatum(492, -0.520513242775788, -1.0205132427757881),
                    rangeAreaDatum(493, -0.533693457325839, -1.033693457325839),
                    rangeAreaDatum(494, -0.5465299180241957, -1.0465299180241958),
                    rangeAreaDatum(495, -0.5590169943749472, -1.0590169943749472),
                    rangeAreaDatum(496, -0.571149209133704, -1.071149209133704),
                    rangeAreaDatum(497, -0.5829212407100998, -1.0829212407100997),
                    rangeAreaDatum(498, -0.5943279255020146, -1.0943279255020146),
                    rangeAreaDatum(499, -0.6053642601605065, -1.1053642601605065),
                    rangeAreaDatum(500, -0.6160254037844387, -1.1160254037844388),
                    rangeAreaDatum(501, -0.626306680043863, -1.126306680043863),
                    rangeAreaDatum(502, -0.6362035792312144, -1.1362035792312144),
                    rangeAreaDatum(503, -0.6457117602394128, -1.1457117602394127),
                    rangeAreaDatum(504, -0.6548270524660189, -1.154827052466019),
                    rangeAreaDatum(505, -0.6635454576426005, -1.1635454576426005),
                    rangeAreaDatum(506, -0.6718631515885003, -1.1718631515885003),
                    rangeAreaDatum(507, -0.6797764858882513, -1.1797764858882513),
                    rangeAreaDatum(508, -0.6872819894918917, -1.1872819894918916),
                    rangeAreaDatum(509, -0.6943763702374813, -1.1943763702374812),
                    rangeAreaDatum(510, -0.7010565162951534, -1.2010565162951534),
                    rangeAreaDatum(511, -0.7073194975320672, -1.2073194975320671),
                    rangeAreaDatum(512, -0.7131625667976583, -1.2131625667976582),
                    rangeAreaDatum(513, -0.718583161128631, -1.218583161128631),
                    rangeAreaDatum(514, -0.7235789028731602, -1.22357890287316),
                    rangeAreaDatum(515, -0.7281476007338054, -1.2281476007338052),
                    rangeAreaDatum(516, -0.7322872507286885, -1.2322872507286884),
                    rangeAreaDatum(517, -0.7359960370705049, -1.235996037070505),
                    rangeAreaDatum(518, -0.7392723329629883, -1.2392723329629884),
                    rangeAreaDatum(519, -0.7421147013144779, -1.242114701314478),
                    rangeAreaDatum(520, -0.7445218953682734, -1.2445218953682735),
                    rangeAreaDatum(521, -0.7464928592495043, -1.2464928592495044),
                    rangeAreaDatum(522, -0.7480267284282716, -1.2480267284282716),
                    rangeAreaDatum(523, -0.7491228300988584, -1.2491228300988584),
                    rangeAreaDatum(524, -0.7497806834748455, -1.2497806834748455),
                    rangeAreaDatum(525, -0.75, -1.25),
                    rangeAreaDatum(526, -0.7497806834748455, -1.2497806834748455),
                    rangeAreaDatum(527, -0.7491228300988584, -1.2491228300988584),
                    rangeAreaDatum(528, -0.7480267284282716, -1.2480267284282716),
                    rangeAreaDatum(529, -0.7464928592495044, -1.2464928592495044),
                    rangeAreaDatum(530, -0.7445218953682735, -1.2445218953682735),
                    rangeAreaDatum(531, -0.742114701314478, -1.242114701314478),
                    rangeAreaDatum(532, -0.7392723329629884, -1.2392723329629884),
                    rangeAreaDatum(533, -0.735996037070505, -1.235996037070505),
                    rangeAreaDatum(534, -0.7322872507286886, -1.2322872507286886),
                    rangeAreaDatum(535, -0.7281476007338055, -1.2281476007338055),
                    rangeAreaDatum(536, -0.7235789028731604, -1.2235789028731605),
                    rangeAreaDatum(537, -0.7185831611286312, -1.218583161128631),
                    rangeAreaDatum(538, -0.7131625667976585, -1.2131625667976587),
                    rangeAreaDatum(539, -0.7073194975320676, -1.2073194975320676),
                    rangeAreaDatum(540, -0.7010565162951538, -1.2010565162951536),
                    rangeAreaDatum(541, -0.6943763702374817, -1.1943763702374817),
                    rangeAreaDatum(542, -0.687281989491892, -1.187281989491892),
                    rangeAreaDatum(543, -0.6797764858882517, -1.1797764858882518),
                    rangeAreaDatum(544, -0.6718631515885006, -1.1718631515885005),
                    rangeAreaDatum(545, -0.6635454576426009, -1.1635454576426008),
                    rangeAreaDatum(546, -0.6548270524660192, -1.1548270524660191),
                    rangeAreaDatum(547, -0.6457117602394131, -1.1457117602394131),
                    rangeAreaDatum(548, -0.6362035792312148, -1.1362035792312148),
                    rangeAreaDatum(549, -0.6263066800438635, -1.1263066800438635),
                    rangeAreaDatum(550, -0.6160254037844392, -1.1160254037844393),
                    rangeAreaDatum(551, -0.6053642601605069, -1.105364260160507),
                    rangeAreaDatum(552, -0.5943279255020152, -1.0943279255020153),
                    rangeAreaDatum(553, -0.5829212407101002, -1.0829212407101),
                    rangeAreaDatum(554, -0.5711492091337046, -1.0711492091337047),
                    rangeAreaDatum(555, -0.5590169943749477, -1.0590169943749477),
                    rangeAreaDatum(556, -0.5465299180241963, -1.0465299180241963),
                    rangeAreaDatum(557, -0.5336934573258395, -1.0336934573258394),
                    rangeAreaDatum(558, -0.5205132427757886, -1.0205132427757886),
                    rangeAreaDatum(559, -0.5069950556517566, -1.0069950556517566),
                    rangeAreaDatum(560, -0.49314482547739413, -0.9931448254773941),
                    rangeAreaDatum(561, -0.4789686274214111, -0.9789686274214111),
                    rangeAreaDatum(562, -0.4644726796328038, -0.9644726796328038),
                    rangeAreaDatum(563, -0.44966334051336554, -0.9496633405133655),
                    rangeAreaDatum(564, -0.43454710592868984, -0.9345471059286898),
                    rangeAreaDatum(565, -0.419130606358859, -0.919130606358859),
                    rangeAreaDatum(566, -0.40342060399010593, -0.9034206039901059),
                    rangeAreaDatum(567, -0.3874239897486912, -0.8874239897486912),
                    rangeAreaDatum(568, -0.3711477802783115, -0.8711477802783115),
                    rangeAreaDatum(569, -0.3545991148623756, -0.8545991148623756),
                    rangeAreaDatum(570, -0.33778525229247347, -0.8377852522924735),
                    rangeAreaDatum(571, -0.3207135676844317, -0.8207135676844317),
                    rangeAreaDatum(572, -0.30339154924334366, -0.8033915492433437),
                    rangeAreaDatum(573, -0.2858267949789973, -0.7858267949789973),
                    rangeAreaDatum(574, -0.2680270093731305, -0.7680270093731305),
                    rangeAreaDatum(575, -0.2499999999999999, -0.7499999999999999),
                    rangeAreaDatum(576, -0.23175367410171632, -0.7317536741017163),
                    rangeAreaDatum(577, -0.21329603511986234, -0.7132960351198623),
                    rangeAreaDatum(578, -0.19463517918492768, -0.6946351791849277),
                    rangeAreaDatum(579, -0.17577929156507405, -0.675779291565074),
                    rangeAreaDatum(580, -0.1567366430758012, -0.6567366430758013),
                    rangeAreaDatum(581, -0.13751558645210354, -0.6375155864521036),
                    rangeAreaDatum(582, -0.11812455268467809, -0.6181245526846781),
                    rangeAreaDatum(583, -0.0985720473218149, -0.5985720473218149),
                    rangeAreaDatum(584, -0.07886664673858246, -0.5788666467385825),
                    rangeAreaDatum(585, -0.059016994374947895, -0.5590169943749479),
                    rangeAreaDatum(586, -0.03903179694447162, -0.5390317969444716),
                    rangeAreaDatum(587, -0.01891982061526526, -0.5189198206152652),
                    rangeAreaDatum(588, 0.0013101128351444002, -0.4986898871648556),
                    rangeAreaDatum(589, 0.021649129889343893, -0.47835087011065613),
                    rangeAreaDatum(590, 0.04208830918223902, -0.45791169081776095),
                    rangeAreaDatum(591, 0.0626186854142742, -0.4373813145857258),
                    rangeAreaDatum(592, 0.08323125328389702, -0.416768746716103),
                    rangeAreaDatum(593, 0.10391697143758813, -0.39608302856241184),
                    rangeAreaDatum(594, 0.12466676643569599, -0.37533323356430404),
                    rangeAreaDatum(595, 0.14547153673234722, -0.35452846326765275),
                    rangeAreaDatum(596, 0.1663221566676839, -0.3336778433323161),
                    rangeAreaDatum(597, 0.18720948047068647, -0.3127905195293135),
                    rangeAreaDatum(598, 0.2081243462708007, -0.29187565372919927),
                    rangeAreaDatum(599, 0.22905758011664207, -0.27094241988335793),
                    rangeAreaDatum(600, 0.2499999999999995, -0.2500000000000005),
                    rangeAreaDatum(601, 0.27094241988335693, -0.22905758011664307),
                    rangeAreaDatum(602, 0.2918756537292001, -0.2081243462707999),
                    rangeAreaDatum(603, 0.31279051952931075, -0.18720948047068925),
                    rangeAreaDatum(604, 0.3336778433323133, -0.16632215666768665),
                    rangeAreaDatum(605, 0.3545284632676518, -0.1454715367323482),
                    rangeAreaDatum(606, 0.37533323356430304, -0.12466676643569696),
                    rangeAreaDatum(607, 0.3960830285624109, -0.1039169714375891),
                    rangeAreaDatum(608, 0.416768746716102, -0.083231253283898),
                    rangeAreaDatum(609, 0.4373813145857231, -0.0626186854142769),
                    rangeAreaDatum(610, 0.4579116908177583, -0.04208830918224174),
                    rangeAreaDatum(611, 0.47835087011065514, -0.021649129889344865),
                    rangeAreaDatum(612, 0.49868988716485463, -0.001310112835145344),
                    rangeAreaDatum(613, 0.5189198206152661, 0.018919820615266036),
                    rangeAreaDatum(614, 0.5390317969444723, 0.03903179694447234),
                    rangeAreaDatum(615, 0.5590169943749452, 0.05901699437494523),
                    rangeAreaDatum(616, 0.5788666467385815, 0.07886664673858151),
                    rangeAreaDatum(617, 0.5985720473218139, 0.09857204732181396),
                    rangeAreaDatum(618, 0.6181245526846771, 0.11812455268467714),
                    rangeAreaDatum(619, 0.6375155864521026, 0.1375155864521026),
                    rangeAreaDatum(620, 0.6567366430758003, 0.15673664307580026),
                    rangeAreaDatum(621, 0.6757792915650715, 0.17577929156507155),
                    rangeAreaDatum(622, 0.6946351791849268, 0.19463517918492684),
                    rangeAreaDatum(623, 0.7132960351198615, 0.2132960351198615),
                    rangeAreaDatum(624, 0.7317536741017154, 0.23175367410171543),
                    rangeAreaDatum(625, 0.7500000000000006, 0.25000000000000056),
                    rangeAreaDatum(626, 0.7680270093731282, 0.2680270093731282),
                    rangeAreaDatum(627, 0.785826794978995, 0.285826794978995),
                    rangeAreaDatum(628, 0.8033915492433429, 0.3033915492433429),
                    rangeAreaDatum(629, 0.8207135676844308, 0.3207135676844308),
                    rangeAreaDatum(630, 0.8377852522924727, 0.3377852522924727),
                    rangeAreaDatum(631, 0.8545991148623748, 0.35459911486237483),
                    rangeAreaDatum(632, 0.8711477802783093, 0.3711477802783093),
                    rangeAreaDatum(633, 0.8874239897486891, 0.3874239897486891),
                    rangeAreaDatum(634, 0.9034206039901052, 0.40342060399010515),
                    rangeAreaDatum(635, 0.9191306063588582, 0.41913060635885824),
                    rangeAreaDatum(636, 0.9345471059286891, 0.43454710592868906),
                    rangeAreaDatum(637, 0.9496633405133661, 0.4496633405133661),
                    rangeAreaDatum(638, 0.9644726796328019, 0.4644726796328019),
                    rangeAreaDatum(639, 0.9789686274214104, 0.47896862742141044),
                    rangeAreaDatum(640, 0.9931448254773935, 0.49314482547739347),
                    rangeAreaDatum(641, 1.006995055651756, 0.506995055651756),
                    rangeAreaDatum(642, 1.020513242775789, 0.5205132427757891),
                    rangeAreaDatum(643, 1.0336934573258398, 0.53369345732584),
                    rangeAreaDatum(644, 1.0465299180241958, 0.5465299180241957),
                    rangeAreaDatum(645, 1.059016994374947, 0.5590169943749471),
                    rangeAreaDatum(646, 1.071149209133704, 0.571149209133704),
                    rangeAreaDatum(647, 1.0829212407100997, 0.5829212407100998),
                    rangeAreaDatum(648, 1.0943279255020155, 0.5943279255020155),
                    rangeAreaDatum(649, 1.1053642601605074, 0.6053642601605074),
                    rangeAreaDatum(650, 1.116025403784438, 0.6160254037844378),
                    rangeAreaDatum(651, 1.126306680043863, 0.626306680043863),
                    rangeAreaDatum(652, 1.1362035792312144, 0.6362035792312144),
                    rangeAreaDatum(653, 1.1457117602394127, 0.6457117602394127),
                    rangeAreaDatum(654, 1.1548270524660196, 0.6548270524660196),
                    rangeAreaDatum(655, 1.1635454576426003, 0.6635454576426004),
                    rangeAreaDatum(656, 1.1718631515885003, 0.6718631515885003),
                    rangeAreaDatum(657, 1.1797764858882513, 0.6797764858882513),
                    rangeAreaDatum(658, 1.1872819894918916, 0.6872819894918916),
                    rangeAreaDatum(659, 1.1943763702374812, 0.6943763702374813),
                    rangeAreaDatum(660, 1.201056516295154, 0.701056516295154),
                    rangeAreaDatum(661, 1.2073194975320667, 0.7073194975320667),
                    rangeAreaDatum(662, 1.2131625667976578, 0.7131625667976578),
                    rangeAreaDatum(663, 1.2185831611286309, 0.7185831611286309),
                    rangeAreaDatum(664, 1.22357890287316, 0.7235789028731602),
                    rangeAreaDatum(665, 1.2281476007338057, 0.7281476007338057),
                    rangeAreaDatum(666, 1.2322872507286888, 0.7322872507286888),
                    rangeAreaDatum(667, 1.2359960370705048, 0.7359960370705048),
                    rangeAreaDatum(668, 1.2392723329629884, 0.7392723329629883),
                    rangeAreaDatum(669, 1.242114701314478, 0.7421147013144779),
                    rangeAreaDatum(670, 1.2445218953682735, 0.7445218953682734),
                    rangeAreaDatum(671, 1.2464928592495044, 0.7464928592495045),
                    rangeAreaDatum(672, 1.2480267284282718, 0.7480267284282717),
                    rangeAreaDatum(673, 1.2491228300988584, 0.7491228300988583),
                    rangeAreaDatum(674, 1.2497806834748455, 0.7497806834748455),
                    rangeAreaDatum(675, 1.25, 0.75),
                    rangeAreaDatum(676, 1.2497806834748455, 0.7497806834748455),
                    rangeAreaDatum(677, 1.2491228300988584, 0.7491228300988584),
                    rangeAreaDatum(678, 1.2480267284282718, 0.7480267284282718),
                    rangeAreaDatum(679, 1.2464928592495044, 0.7464928592495045),
                    rangeAreaDatum(680, 1.2445218953682735, 0.7445218953682735),
                    rangeAreaDatum(681, 1.242114701314478, 0.742114701314478),
                    rangeAreaDatum(682, 1.2392723329629884, 0.7392723329629884),
                    rangeAreaDatum(683, 1.235996037070505, 0.735996037070505),
                    rangeAreaDatum(684, 1.2322872507286888, 0.7322872507286889),
                    rangeAreaDatum(685, 1.228147600733806, 0.7281476007338059),
                    rangeAreaDatum(686, 1.2235789028731605, 0.7235789028731604),
                    rangeAreaDatum(687, 1.218583161128631, 0.7185831611286312),
                    rangeAreaDatum(688, 1.2131625667976582, 0.7131625667976581),
                    rangeAreaDatum(689, 1.2073194975320671, 0.707319497532067),
                    rangeAreaDatum(690, 1.2010565162951543, 0.7010565162951543),
                    rangeAreaDatum(691, 1.1943763702374817, 0.6943763702374817),
                    rangeAreaDatum(692, 1.187281989491892, 0.687281989491892),
                    rangeAreaDatum(693, 1.1797764858882518, 0.6797764858882518),
                    rangeAreaDatum(694, 1.1718631515885007, 0.6718631515885007),
                    rangeAreaDatum(695, 1.1635454576426008, 0.6635454576426009),
                    rangeAreaDatum(696, 1.15482705246602, 0.6548270524660201),
                    rangeAreaDatum(697, 1.1457117602394131, 0.6457117602394132),
                    rangeAreaDatum(698, 1.1362035792312148, 0.6362035792312148),
                    rangeAreaDatum(699, 1.1263066800438635, 0.6263066800438636),
                    rangeAreaDatum(700, 1.1160254037844384, 0.6160254037844384),
                    rangeAreaDatum(701, 1.105364260160508, 0.6053642601605079),
                    rangeAreaDatum(702, 1.0943279255020162, 0.5943279255020162),
                    rangeAreaDatum(703, 1.0829212407101003, 0.5829212407101003),
                    rangeAreaDatum(704, 1.0711492091337047, 0.5711492091337046),
                    rangeAreaDatum(705, 1.059016994374948, 0.5590169943749478),
                    rangeAreaDatum(706, 1.0465299180241963, 0.5465299180241964),
                    rangeAreaDatum(707, 1.0336934573258407, 0.5336934573258406),
                    rangeAreaDatum(708, 1.02051324277579, 0.5205132427757898),
                    rangeAreaDatum(709, 1.0069950556517568, 0.5069950556517567),
                    rangeAreaDatum(710, 0.9931448254773942, 0.49314482547739424),
                    rangeAreaDatum(711, 0.9789686274214111, 0.4789686274214111),
                    rangeAreaDatum(712, 0.9644726796328027, 0.4644726796328027),
                    rangeAreaDatum(713, 0.949663340513367, 0.449663340513367),
                    rangeAreaDatum(714, 0.9345471059286898, 0.43454710592868984),
                    rangeAreaDatum(715, 0.9191306063588591, 0.4191306063588591),
                    rangeAreaDatum(716, 0.9034206039901059, 0.40342060399010593),
                    rangeAreaDatum(717, 0.8874239897486899, 0.38742398974868986),
                    rangeAreaDatum(718, 0.8711477802783102, 0.3711477802783102),
                    rangeAreaDatum(719, 0.8545991148623757, 0.3545991148623757),
                    rangeAreaDatum(720, 0.8377852522924736, 0.3377852522924736),
                    rangeAreaDatum(721, 0.8207135676844318, 0.3207135676844318),
                    rangeAreaDatum(722, 0.8033915492433438, 0.30339154924334377),
                    rangeAreaDatum(723, 0.7858267949789959, 0.2858267949789959),
                    rangeAreaDatum(724, 0.7680270093731291, 0.26802700937312907),
                    rangeAreaDatum(725, 0.7500000000000016, 0.25000000000000155),
                    rangeAreaDatum(726, 0.7317536741017164, 0.23175367410171643),
                    rangeAreaDatum(727, 0.7132960351198625, 0.21329603511986245),
                    rangeAreaDatum(728, 0.6946351791849278, 0.1946351791849278),
                    rangeAreaDatum(729, 0.6757792915650725, 0.17577929156507255),
                    rangeAreaDatum(730, 0.6567366430758013, 0.15673664307580132),
                    rangeAreaDatum(731, 0.6375155864521036, 0.13751558645210366),
                    rangeAreaDatum(732, 0.6181245526846781, 0.1181245526846782),
                    rangeAreaDatum(733, 0.598572047321815, 0.09857204732181502),
                    rangeAreaDatum(734, 0.5788666467385826, 0.07886664673858257),
                    rangeAreaDatum(735, 0.5590169943749463, 0.059016994374946286),
                    rangeAreaDatum(736, 0.5390317969444733, 0.039031796944473396),
                    rangeAreaDatum(737, 0.5189198206152671, 0.01891982061526709),
                    rangeAreaDatum(738, 0.49868988716485574, -0.0013101128351442892),
                ];

                const SELECTIONCHANGE: AgSelectionChangeEvent<D, C>[] = [
                    uiChangeEvent<D, C>({ added: SELECTION, removed: [] }),
                ];

                beforeEach(async () => {
                    const { data, series, axes, legend } = createRangeAreaSineWaveOptions();
                    selectionChange = createSelectionChangeRecorder();
                    chart = await createChartInstance({
                        data,
                        series,
                        axes,
                        legend,
                        selection: {
                            containment: 'any',
                            enabled: true,
                            enableDrag: true,
                            enableClick: false,
                        },
                        navigator: { enabled: false },
                        scrollbar: { enabled: false },
                        zoom: { enabled: false },
                        listeners: { selectionChange },
                    });
                });
                describe('initial', () => {
                    // The dense range-area is drawn, but every marker is hidden (size 0): hideWithSize0
                    // is active and no datum is selected yet.
                    test('screenshot', async () => {
                        await compareExact('drag-modifiers-range-area-hidewithsize0-initial');
                    });
                    test('getSelection', () => {
                        expect(getChartSelectionArray()).toEqual([]);
                    });
                    test('selectionChange', () => {
                        expect(selectionChange.popEvents()).toEqual([]);
                    });
                });
                describe('mousedown and mousemove', () => {
                    beforeEach(async () => {
                        await mouseDown(DRAG_FROM);
                        await mouseMove(DRAG_TO);
                    });
                    // Markers under the drag box render as selection candidates even though
                    // hideWithSize0 hides every other marker. Nothing is committed yet.
                    test('screenshot', async () => {
                        await compareExact('drag-modifiers-range-area-hidewithsize0-candidacy');
                    });
                    test('getSelection', () => {
                        expect(getChartSelectionArray()).toEqual([]);
                    });
                    test('selectionChange', () => {
                        expect(selectionChange.popEvents()).toEqual([]);
                    });

                    describe('mouseup', () => {
                        beforeEach(async () => {
                            await mouseUp(DRAG_TO);
                        });
                        // The candidate markers commit to the selection on mouseup.
                        test('screenshot', async () => {
                            await compareExact('drag-modifiers-range-area-hidewithsize0-selected');
                        });
                        test('getSelection', () => {
                            expect(getChartSelectionArray()).toEqual(SELECTION);
                        });
                        test('selectionChange', () => {
                            expect(selectionChange.popEvents()).toEqual(SELECTIONCHANGE);
                        });
                    });
                });
            });
        });

        describe('sunburst', () => {
            type D = DiskDatum;
            type C = unknown;
            type I = AgSelectionItem<D>;
            let selectionChange: SelectionChangeRecorder<D, C>;
            const { data, series, theme, legend, title } = createDiskUsageOptions('sunburst');

            const POINT_MISS: CanvasPoint = { canvasX: 20, canvasY: 20 };
            const seriesId = 'SunburstSeries-1';

            describe('containment any', () => {
                beforeEach(async () => {
                    selectionChange = createSelectionChangeRecorder();
                    chart = await createChartInstance({
                        data,
                        series,
                        theme,
                        legend,
                        title,
                        selection: {
                            enabled: true,
                            enableClick: false,
                            enableDrag: true,
                            containment: 'any',
                        },
                        listeners: { selectionChange },
                    });
                });
                describe('initial', () => {
                    test('screenshot', async () => {
                        await compareExact('diskusage-sunburst-highlighted-none-selected-none');
                    });
                    test('getSelection', () => {
                        expect(getChartSelectionArray()).toEqual([]);
                    });
                    test('selectionChange', () => {
                        expect(selectionChange.popEvents()).toEqual([]);
                    });
                });
                describe('box in sector selects that one sector', () => {
                    const start: CanvasPoint = { canvasX: 210.5, canvasY: 318 };
                    const end: CanvasPoint = { canvasX: 231.5, canvasY: 275 };
                    const added: I[] = [{ itemId: 20, seriesId, datum: findName(data, 'videos/') }];

                    test('screenshot', async () => {
                        await mouseDown(start);
                        await mouseMove(end);
                        await compareExact('diskusage-sunburst-any-box-in-sector-candidacy');

                        await mouseUp(end);
                        await mouseMove(POINT_MISS);
                        await compareExact('diskusage-sunburst-any-box-in-sector-selection');
                    });
                    test('getSelection', async () => {
                        await mouseDown(start);
                        await mouseMove(end);
                        expect(getChartSelectionArray()).toEqual([]);

                        await mouseUp(end);
                        await mouseMove(POINT_MISS);
                        expect(getChartSelectionArray()).toEqual(added);
                    });
                    test('selectionChange', async () => {
                        await mouseDown(start);
                        await mouseMove(end);
                        expect(selectionChange.popEvents()).toEqual([]);

                        await mouseUp(end);
                        await mouseMove(POINT_MISS);
                        expect(selectionChange.popEvents()).toEqual([uiChangeEvent<D, C>({ added, removed: [] })]);
                    });
                });
                describe('squarish box selects multiple sectors', () => {
                    const start: CanvasPoint = { canvasX: 374.5, canvasY: 324 };
                    const end: CanvasPoint = { canvasX: 595.5, canvasY: 79 };
                    const added: I[] = [
                        { seriesId, itemId: 0, datum: findName(data, '/') },
                        { seriesId, itemId: 1, datum: findName(data, 'usr/') },
                        { seriesId, itemId: 2, datum: findName(data, 'bin/') },
                        { seriesId, itemId: 3, datum: findName(data, 'bash') },
                        { seriesId, itemId: 4, datum: findName(data, 'ls') },
                        { seriesId, itemId: 5, datum: findName(data, 'lib/') },
                        { seriesId, itemId: 6, datum: findName(data, 'libc.so') },
                        { seriesId, itemId: 7, datum: findName(data, 'libm.so') },
                        { seriesId, itemId: 8, datum: findName(data, 'home/') },
                        { seriesId, itemId: 9, datum: findName(data, 'Pictures/') },
                        { seriesId, itemId: 10, datum: findName(data, 'img1.jpg') },
                        { seriesId, itemId: 11, datum: findName(data, 'img2.png') },
                        { seriesId, itemId: 12, datum: findName(data, 'Movies/') },
                        { seriesId, itemId: 13, datum: findName(data, 'movie.mp4') },
                        { seriesId, itemId: 15, datum: findName(data, 'mnt/') },
                        { seriesId, itemId: 19, datum: findName(data, 'miniSD/') },
                        { seriesId, itemId: 23, datum: findName(data, 'photos/') },
                        { seriesId, itemId: 25, datum: findName(data, 'photo2.jpg') },
                    ];

                    test('screenshot', async () => {
                        await mouseDown(start);
                        await mouseMove(end);
                        await compareExact('diskusage-sunburst-any-squarish-box-candidacy');

                        await mouseUp(end);
                        await mouseMove(POINT_MISS);
                        await compareExact('diskusage-sunburst-any-squarish-box-sector-selection');
                    });
                    test('getSelection', async () => {
                        await mouseDown(start);
                        await mouseMove(end);
                        expect(getChartSelectionArray()).toEqual([]);

                        await mouseUp(end);
                        await mouseMove(POINT_MISS);
                        expect(getChartSelectionArray()).toEqual(added);
                    });
                    test('selectionChange', async () => {
                        await mouseDown(start);
                        await mouseMove(end);
                        expect(selectionChange.popEvents()).toEqual([]);

                        await mouseUp(end);
                        await mouseMove(POINT_MISS);
                        expect(selectionChange.popEvents()).toEqual([uiChangeEvent<D, C>({ added, removed: [] })]);
                    });
                });
                describe('tall box selects multiple sectors', () => {
                    const start: CanvasPoint = { canvasX: 411.5, canvasY: 532 };
                    const end: CanvasPoint = { canvasX: 417.5, canvasY: 62 };
                    const added: I[] = [
                        { seriesId, itemId: 0, datum: findName(data, '/') },
                        { seriesId, itemId: 1, datum: findName(data, 'usr/') },
                        { seriesId, itemId: 2, datum: findName(data, 'bin/') },
                        { seriesId, itemId: 3, datum: findName(data, 'bash') },
                        { seriesId, itemId: 8, datum: findName(data, 'home/') },
                        { seriesId, itemId: 12, datum: findName(data, 'Movies/') },
                        { seriesId, itemId: 13, datum: findName(data, 'movie.mp4') },
                        { seriesId, itemId: 14, datum: findName(data, 'clip.mov') },
                    ];

                    test('screenshot', async () => {
                        await mouseDown(start);
                        await mouseMove(end);
                        await compareExact('diskusage-sunburst-any-tall-box-candidacy');

                        await mouseUp(end);
                        await mouseMove(POINT_MISS);
                        await compareExact('diskusage-sunburst-any-tall-box-sector-selection');
                    });
                    test('getSelection', async () => {
                        await mouseDown(start);
                        await mouseMove(end);
                        expect(getChartSelectionArray()).toEqual([]);

                        await mouseUp(end);
                        await mouseMove(POINT_MISS);
                        expect(getChartSelectionArray()).toEqual(added);
                    });
                    test('selectionChange', async () => {
                        await mouseDown(start);
                        await mouseMove(end);
                        expect(selectionChange.popEvents()).toEqual([]);

                        await mouseUp(end);
                        await mouseMove(POINT_MISS);
                        expect(selectionChange.popEvents()).toEqual([uiChangeEvent<D, C>({ added, removed: [] })]);
                    });
                });
                describe('wide box selects multiple sectors', () => {
                    const start: CanvasPoint = { canvasX: 125.5, canvasY: 316 };
                    const end: CanvasPoint = { canvasX: 651.5, canvasY: 324 };
                    const added: I[] = [
                        { seriesId, itemId: 0, datum: findName(data, '/') },
                        { seriesId, itemId: 8, datum: findName(data, 'home/') },
                        { seriesId, itemId: 12, datum: findName(data, 'Movies/') },
                        { seriesId, itemId: 13, datum: findName(data, 'movie.mp4') },
                        { seriesId, itemId: 15, datum: findName(data, 'mnt/') },
                        { seriesId, itemId: 19, datum: findName(data, 'miniSD/') },
                        { seriesId, itemId: 20, datum: findName(data, 'videos/') },
                        { seriesId, itemId: 21, datum: findName(data, 'vid1.mp4') },
                    ];

                    test('screenshot', async () => {
                        await mouseDown(start);
                        await mouseMove(end);
                        await compareExact('diskusage-sunburst-any-wide-box-candidacy');

                        await mouseUp(end);
                        await mouseMove(POINT_MISS);
                        await compareExact('diskusage-sunburst-any-wide-box-sector-selection');
                    });
                    test('getSelection', async () => {
                        await mouseDown(start);
                        await mouseMove(end);
                        expect(getChartSelectionArray()).toEqual([]);

                        await mouseUp(end);
                        await mouseMove(POINT_MISS);
                        expect(getChartSelectionArray()).toEqual(added);
                    });
                    test('selectionChange', async () => {
                        await mouseDown(start);
                        await mouseMove(end);
                        expect(selectionChange.popEvents()).toEqual([]);

                        await mouseUp(end);
                        await mouseMove(POINT_MISS);
                        expect(selectionChange.popEvents()).toEqual([uiChangeEvent<D, C>({ added, removed: [] })]);
                    });
                });
            });
            describe('containment all', () => {
                beforeEach(async () => {
                    selectionChange = createSelectionChangeRecorder();
                    chart = await createChartInstance({
                        data,
                        series,
                        theme,
                        legend,
                        title,
                        selection: {
                            enabled: true,
                            enableClick: false,
                            enableDrag: true,
                            containment: 'all',
                        },
                        listeners: { selectionChange },
                    });
                });
                describe('initial', () => {
                    test('screenshot', async () => {
                        await compareExact('diskusage-sunburst-highlighted-none-selected-none');
                    });
                    test('getSelection', () => {
                        expect(getChartSelectionArray()).toEqual([]);
                    });
                    test('selectionChange', () => {
                        expect(selectionChange.popEvents()).toEqual([]);
                    });
                });
                describe('northeast box', () => {
                    const start: CanvasPoint = { canvasX: 334, canvasY: 388 };
                    const end: CanvasPoint = { canvasX: 592, canvasY: 71 };
                    const added: I[] = [
                        { seriesId, itemId: 0, datum: findName(data, '/') },
                        { seriesId, itemId: 1, datum: findName(data, 'usr/') },
                        { seriesId, itemId: 2, datum: findName(data, 'bin/') },
                        { seriesId, itemId: 3, datum: findName(data, 'bash') },
                        { seriesId, itemId: 4, datum: findName(data, 'ls') },
                        { seriesId, itemId: 5, datum: findName(data, 'lib/') },
                        { seriesId, itemId: 6, datum: findName(data, 'libc.so') },
                        { seriesId, itemId: 7, datum: findName(data, 'libm.so') },
                        { seriesId, itemId: 9, datum: findName(data, 'Pictures/') },
                        { seriesId, itemId: 10, datum: findName(data, 'img1.jpg') },
                    ];

                    test('screenshot', async () => {
                        await mouseDown(start);
                        await mouseMove(end);
                        await compareExact('diskusage-sunburst-all-northeast-box-candidacy');

                        await mouseUp(end);
                        await mouseMove(POINT_MISS);
                        await compareExact('diskusage-sunburst-all-northeast-box-selection');
                    });
                    test('getSelection', async () => {
                        await mouseDown(start);
                        await mouseMove(end);
                        expect(getChartSelectionArray()).toEqual([]);

                        await mouseUp(end);
                        await mouseMove(POINT_MISS);
                        expect(getChartSelectionArray()).toEqual(added);
                    });
                    test('selectionChange', async () => {
                        await mouseDown(start);
                        await mouseMove(end);
                        expect(selectionChange.popEvents()).toEqual([]);

                        await mouseUp(end);
                        await mouseMove(POINT_MISS);
                        expect(selectionChange.popEvents()).toEqual([uiChangeEvent<D, C>({ added, removed: [] })]);
                    });
                });
            });
        });

        describe('pie/donut', () => {
            type D = RingDatum;
            type C = unknown;
            type I = AgSelectionItem<D>;
            let selectionChange: SelectionChangeRecorder<D, C>;
            const { data, series, theme, legend } = createPieDonutOptions();

            const POINT_MISS: CanvasPoint = { canvasX: 20, canvasY: 20 };

            describe('containment any', () => {
                beforeEach(async () => {
                    selectionChange = createSelectionChangeRecorder();
                    chart = await createChartInstance({
                        data,
                        series,
                        theme,
                        legend,
                        selection: {
                            enabled: true,
                            enableClick: false,
                            enableDrag: true,
                            containment: 'any',
                        },
                        listeners: { selectionChange },
                    });
                });
                describe('initial', () => {
                    test('screenshot', async () => {
                        await compareExact('piedonut-highlighted-none-selected-none');
                    });
                    test('getSelection', () => {
                        expect(getChartSelectionArray()).toEqual([]);
                    });
                    test('selectionChange', () => {
                        expect(selectionChange.popEvents()).toEqual([]);
                    });
                });
                describe('northeast box', () => {
                    const start: CanvasPoint = { canvasX: 375, canvasY: 324 };
                    const end: CanvasPoint = { canvasX: 727, canvasY: 5 };
                    const added: I[] = [
                        { datum: { sector: 'C-NE', value: 1 }, itemId: 0, seriesId: 'pieid' },
                        { datum: { sector: 'C-SE', value: 1 }, itemId: 1, seriesId: 'pieid' },
                        { datum: { sector: 'C-SW', value: 1 }, itemId: 2, seriesId: 'pieid' },
                        { datum: { sector: 'C-NW', value: 1 }, itemId: 3, seriesId: 'pieid' },
                        { datum: { sector: 'I-NE', value: 1 }, itemId: 0, seriesId: 'donut1id' },
                        { datum: { sector: 'I-SE', value: 1 }, itemId: 1, seriesId: 'donut1id' },
                        { datum: { sector: 'I-NW', value: 1 }, itemId: 3, seriesId: 'donut1id' },
                        { datum: { sector: 'O-NE', value: 1 }, itemId: 0, seriesId: 'donut2id' },
                        { datum: { sector: 'O-SE', value: 1 }, itemId: 1, seriesId: 'donut2id' },
                        { datum: { sector: 'O-NW', value: 1 }, itemId: 3, seriesId: 'donut2id' },
                    ];

                    test('screenshot', async () => {
                        await mouseDown(start);
                        await mouseMove(end);
                        await compareExact('piedonut-any-northeast-box-candidacy');

                        await mouseUp(end);
                        await mouseMove(POINT_MISS);
                        await compareExact('piedonut-any-northeast-box-selection');
                    });
                    test('getSelection', async () => {
                        await mouseDown(start);
                        await mouseMove(end);
                        expect(getChartSelectionArray()).toEqual([]);

                        await mouseUp(end);
                        await mouseMove(POINT_MISS);
                        expect(getChartSelectionArray()).toEqual(added);
                    });
                    test('selectionChange', async () => {
                        await mouseDown(start);
                        await mouseMove(end);
                        expect(selectionChange.popEvents()).toEqual([]);

                        await mouseUp(end);
                        await mouseMove(POINT_MISS);
                        expect(selectionChange.popEvents()).toEqual([uiChangeEvent<D, C>({ added, removed: [] })]);
                    });
                });
            });
            describe('containment all', () => {
                beforeEach(async () => {
                    selectionChange = createSelectionChangeRecorder();
                    chart = await createChartInstance({
                        data,
                        series,
                        theme,
                        legend,
                        selection: {
                            enabled: true,
                            enableClick: false,
                            enableDrag: true,
                            containment: 'all',
                        },
                        listeners: { selectionChange },
                    });
                });
                describe('initial', () => {
                    test('screenshot', async () => {
                        await compareExact('piedonut-highlighted-none-selected-none');
                    });
                    test('getSelection', () => {
                        expect(getChartSelectionArray()).toEqual([]);
                    });
                    test('selectionChange', () => {
                        expect(selectionChange.popEvents()).toEqual([]);
                    });
                });
                describe('northeast box', () => {
                    const start: CanvasPoint = { canvasX: 375, canvasY: 324 };
                    const end: CanvasPoint = { canvasX: 727, canvasY: 5 };
                    const added: I[] = [
                        { datum: { sector: 'C-NE', value: 1 }, itemId: 0, seriesId: 'pieid' },
                        { datum: { sector: 'I-NE', value: 1 }, itemId: 0, seriesId: 'donut1id' },
                        { datum: { sector: 'O-NE', value: 1 }, itemId: 0, seriesId: 'donut2id' },
                    ];

                    test('screenshot', async () => {
                        await mouseDown(start);
                        await mouseMove(end);
                        await compareExact('piedonut-all-northeast-box-candidacy');

                        await mouseUp(end);
                        await mouseMove(POINT_MISS);
                        await compareExact('piedonut-all-northeast-box-selection');
                    });
                    test('getSelection', async () => {
                        await mouseDown(start);
                        await mouseMove(end);
                        expect(getChartSelectionArray()).toEqual([]);

                        await mouseUp(end);
                        await mouseMove(POINT_MISS);
                        expect(getChartSelectionArray()).toEqual(added);
                    });
                    test('selectionChange', async () => {
                        await mouseDown(start);
                        await mouseMove(end);
                        expect(selectionChange.popEvents()).toEqual([]);

                        await mouseUp(end);
                        await mouseMove(POINT_MISS);
                        expect(selectionChange.popEvents()).toEqual([uiChangeEvent<D, C>({ added, removed: [] })]);
                    });
                });
            });
        });
    });
});
