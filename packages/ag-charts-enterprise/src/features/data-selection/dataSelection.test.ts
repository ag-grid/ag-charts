import { afterEach, describe, expect, it } from 'vitest';

import {
    AgBubbleSeriesOptions,
    type AgCartesianChartOptions,
    type AgChartInstance,
    type AgChartLabelStylerParams,
    type AgChartOptions,
    AgCharts,
    type AgErrorBarItemStylerParams,
    AgHierarchyChartOptions,
    AgInitialStateZoomOptions,
    type AgPolarChartOptions,
    AgSelectionChangeEvent,
    AgSelectionItem,
    AgSelectionItemIds,
} from 'ag-charts-community';
import {
    IMAGE_SNAPSHOT_DEFAULTS,
    MockSelectionChangeListener,
    clickAction,
    compareImageSnapshot,
    delay,
    deproxy,
    dragAction,
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
import type { CanvasPoint } from 'ag-charts-core';

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

function apiChangeEvent<D, C>(partial: { added: AgSelectionItem<D>[]; removed: AgSelectionItem<D>[] }) {
    const { added, removed } = partial;
    return withPreventDefault<AgSelectionChangeEvent<D, C>>({
        added,
        removed,
        source: 'api-call',
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

// A copy of createLineAccountingOptions adapted for data-transaction tests: a
// chart-level `dataIdKey` with stable string ids on each datum, shared data only
// (per-series `data` is incompatible with transactions), and one non-selectable
// series (s3id) alongside two selectable ones. String ids are deliberate — a
// numeric `itemId` is interpreted as an array index by DataSet.getIndexFromItemId,
// bypassing the dataIdKey lookup this fixture exists to exercise.
type AccountingDatumWithId = {
    id: string;
    year: string;
    assets: number;
    liabilities: number;
    cash: number;
};
function createLineAccountingOptionsWithIds(): AgCartesianChartOptions<AccountingDatumWithId, unknown> {
    const data: AccountingDatumWithId[] = [
        { id: 'r2018', year: '2018', assets: 100, liabilities: -70, cash: 30 },
        { id: 'r2019', year: '2019', assets: 120, liabilities: -80, cash: 40 },
        { id: 'r2020', year: '2020', assets: 150, liabilities: -90, cash: 60 },
        { id: 'r2021', year: '2021', assets: 170, liabilities: -110, cash: 30 },
        { id: 'r2022', year: '2022', assets: 190, liabilities: -120, cash: 50 },
        { id: 'r2023', year: '2023', assets: 200, liabilities: -130, cash: 90 },
    ];
    return {
        dataIdKey: 'id',
        data,
        series: [
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
        ],
        axes: {
            // Disable the axes features that we are not testing:
            x: {
                crosshair: { enabled: false },
                gridLine: { enabled: false },
            },
            y: {
                crosshair: { enabled: false },
                gridLine: { enabled: false },
            },
        },
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

// Integer y-values (sine scaled by 1000 and rounded) avoid floating-point
// rounding drift between platforms, which otherwise breaks the exact-match
// SELECTION assertions on CI.
const sineWaveY = (x: number) => {
    const y = Math.round(Math.sin((x / SINE_WAVE_POINT_COUNT) * Math.PI * 8) * 1000);
    // add 0 to normalise `-0` to `0`:
    return y + 0;
};

type SineWaveDatum = { x: number; y: number };
function createLineSineWaveOptions(): AgCartesianChartOptions<SineWaveDatum, unknown> {
    const data: SineWaveDatum[] = Array.from({ length: SINE_WAVE_POINT_COUNT }, (_, i) => ({
        x: i,
        y: sineWaveY(i),
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
        y: sineWaveY(i),
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
        const mid = sineWaveY(i);
        return { x: i, low: mid - 250, high: mid + 250 };
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

// Radar-line and radar-area share a base class and the same hideWithSize0
// mechanism. Unlike the cartesian cases, radar markers are hidden by
// `marker.enabled` rather than point density, so a handful of points suffices.
type RadarDatum = { axis: string; lineValue: number; areaValue: number };
function createRadarOptions(): AgPolarChartOptions<RadarDatum, unknown> {
    return {
        data: [
            { axis: 'A', lineValue: 5, areaValue: 3 },
            { axis: 'B', lineValue: 7, areaValue: 6 },
            { axis: 'C', lineValue: 4, areaValue: 8 },
            { axis: 'D', lineValue: 8, areaValue: 5 },
            { axis: 'E', lineValue: 6, areaValue: 4 },
            { axis: 'F', lineValue: 3, areaValue: 7 },
            { axis: 'G', lineValue: 9, areaValue: 2 },
        ],
        series: [
            {
                id: 'radarlineid',
                type: 'radar-line',
                angleKey: 'axis',
                radiusKey: 'lineValue',
                // Default radar-line marker.enabled is true — disable it explicitly so
                // hideWithSize0 applies.
                marker: { enabled: false },
            },
            {
                id: 'radarareaid',
                type: 'radar-area',
                angleKey: 'axis',
                radiusKey: 'areaValue',
                // Default radar-area marker.enabled is false — hideWithSize0 applies
                // without setting marker.enabled.
            },
        ],
        legend: { enabled: true },
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

type AirGasesDatum = { gas: string; percent: number };
function createAirGasesOptions(): AgPolarChartOptions<AirGasesDatum, unknown> {
    return {
        data: [
            { gas: 'nitrogen', percent: 78 },
            { gas: 'oxygen', percent: 21 },
            { gas: 'other', percent: 1 },
        ],
        series: [
            {
                type: 'pie',
                angleKey: 'percent',
                sectorLabelKey: 'gas',
            },
        ],
        theme: {
            overrides: {
                pie: {
                    series: {
                        sectorLabel: { enabled: true },
                        selection: {
                            selectedItem: { fill: 'skyblue', stroke: 'black' },
                            unselectedItem: {
                                fill: 'grey',
                                fillOpacity: 0.2,
                                stroke: 'green',
                                strokeWidth: 3,
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
                            // FIXME: group selection is descoped and unsupported
                            // selection: { selectedItem: { strokeWidth } },
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
        await compareImageSnapshot(chart, ctx, defaults);
    };

    const compareExact = async (name: string) => {
        await compare({
            ...IMAGE_SNAPSHOT_DEFAULTS,
            customSnapshotIdentifier: name,
            customDiffConfig: { threshold: 0 },
        });
    };

    const compareLenient = async (name: string, threshold: number) => {
        await compare({
            ...IMAGE_SNAPSHOT_DEFAULTS,
            customSnapshotIdentifier: name,
            customDiffConfig: { threshold },
        });
    };

    type Modifiers = { altKey?: true; shiftKey?: true; ctrlKey?: true; metaKey?: true };
    const [altKey, shiftKey, ctrlKey, metaKey] = [true, true, true, true] as const;

    async function mouseClick(point: Readonly<CanvasPoint>, modifiers?: Modifiers) {
        await clickAction(point.canvasX, point.canvasY, modifiers)(chart);
        await waitForChartStability(chart);
    }
    async function mouseDown(point: Readonly<CanvasPoint>, modifiers?: Modifiers) {
        await mouseDownAction(point.canvasX, point.canvasY, modifiers)(chart);
        await waitForChartStability(chart);
    }
    async function mouseMove(point: Readonly<CanvasPoint>, modifiers?: Modifiers) {
        await mouseMoveAction(point.canvasX, point.canvasY, modifiers)(chart);
        await waitForChartStability(chart);
    }
    async function mouseUp(point: Readonly<CanvasPoint>, modifiers?: Modifiers) {
        await mouseUpAction(point.canvasX, point.canvasY, modifiers)(chart);
        await waitForChartStability(chart);
    }
    async function pressEscape(point: Readonly<CanvasPoint>) {
        await keyDownAction(point.canvasX, point.canvasY, { key: 'Escape', code: 'Escape' })(chart);
        await waitForChartStability(chart);
    }

    function getChartSelectionArray() {
        expect(chart).toBeDefined();
        return Array.from(chart.getSelection());
    }

    async function setChartSelectionArray(items: Iterable<AgSelectionItemIds>) {
        expect(chart).toBeDefined();
        chart.setSelection(items);
        await waitForChartStability(chart);
    }

    async function clearChartSelection() {
        expect(chart).toBeDefined();
        chart.clearSelection();
        await waitForChartStability(chart);
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

    describe('AG-17577 pie series selection are not shown in legend', () => {
        type D = AirGasesDatum;
        type C = unknown;
        let selectionChange: SelectionChangeRecorder<D, C>;
        const NITROGEN_ITEM = { datum: { gas: 'nitrogen', percent: 78 }, itemId: 0, seriesId: 'PieSeries-1' };
        const NITROGEN_EVENT = uiChangeEvent<D, C>({ added: [NITROGEN_ITEM], removed: [] });

        beforeEach(async () => {
            selectionChange = createSelectionChangeRecorder();
            chart = await createChartInstance({
                ...createAirGasesOptions(),
                selection: {
                    enabled: true,
                    enableClick: true,
                    enableClickAwayToClear: true,
                    enableDrag: false,
                    clickMode: 'single',
                },
                listeners: { selectionChange },
                highlight: { enabled: false },
            });
        });
        describe('initial', () => {
            test('screenshot', async () => {
                await compareExact('ag-17577-pie-series-selection-are-not-shown-in-legend-initial');
            });
            test('getSelection', () => {
                expect(getChartSelectionArray()).toEqual([]);
            });
            test('selectionChange', () => {
                expect(selectionChange.popEvents()).toEqual([]);
            });
        });
        describe('click nitrogen', () => {
            beforeEach(async () => {
                await mouseClick({ canvasX: 477, canvasY: 380 });
            });
            test('screenshot', async () => {
                await compareExact('ag-17577-pie-series-selection-are-not-shown-in-legend-clicked-nitrogen');
            });
            test('getSelection', () => {
                expect(getChartSelectionArray()).toEqual([NITROGEN_ITEM]);
            });
            test('selectionChange', () => {
                expect(selectionChange.popEvents()).toEqual([NITROGEN_EVENT]);
            });
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

        // Error bars express series-level dimming as group opacity, which a selection change must
        // maintain on its own rather than relying on the highlight-change handler.
        describe('CRT-1186 group opacity follows selection state', () => {
            // The default theme sets selection.unselectedSeries.opacity = 0.2.
            const DIMMED_OPACITY = 0.2;

            const barSeries = (data: any[], yName: string): NonNullable<AgCartesianChartOptions['series']>[number] => ({
                type: 'bar',
                data,
                xKey: 'month',
                yKey: 't',
                yName,
                errorBar: { yLowerKey: 'lo', yUpperKey: 'hi', itemStyler: errorBarStyler },
                selection: { enabled: true, selectedItem: { stroke: 'steelblue', strokeWidth: 3 } },
            });

            function getErrorBarGroupOpacity(seriesIndex = 0) {
                const series = deproxy(chart).series[seriesIndex] as any;
                const errorBars = series.moduleMap.getModule('errorBar');
                expect(errorBars).toBeDefined();
                return errorBars.groupNode.opacity;
            }

            async function setHighlight(datumIndex: number | undefined) {
                const chartInstance = deproxy(chart) as any;
                const series = chartInstance.series[0];
                const nodeData = series.contextNodeData?.nodeData;
                expect(nodeData?.length).toBeGreaterThan(0);
                chartInstance.ctx.highlightManager.updateHighlight(
                    chartInstance.id,
                    datumIndex === undefined ? undefined : nodeData[datumIndex]
                );
                await waitForChartStability(chart);
            }

            for (const [seriesType, seriesFactory] of [
                ['bar', (data: any[]) => barSeries(data, 'A')],
                ['line', (data: any[]) => lineSeries(data, 'A', { stroke: 'steelblue', strokeWidth: 3 })],
            ] as const) {
                it(`dims and restores error bars on a ${seriesType} series without an intervening highlight`, async () => {
                    chart = AgCharts.create(buildOptions([seriesFactory(monthsData)]));
                    await waitForChartStability(chart);
                    expect(getErrorBarGroupOpacity()).toBe(1);

                    const series = deproxy(chart).series[0];
                    chart.setSelection([{ seriesId: series.id, itemId: series.data!.getItemIdFromIndex(2) }]);
                    await waitForChartStability(chart);

                    // Selecting must dim on its own — no hover required.
                    expect(getErrorBarGroupOpacity()).toBe(DIMMED_OPACITY);

                    chart.clearSelection();
                    await waitForChartStability(chart);

                    expect(getErrorBarGroupOpacity()).toBe(1);
                });

                it(`restores error bars on a ${seriesType} series when deselecting after the highlight has cleared`, async () => {
                    chart = AgCharts.create(buildOptions([seriesFactory(monthsData)]));
                    await waitForChartStability(chart);

                    const series = deproxy(chart).series[0];
                    chart.setSelection([{ seriesId: series.id, itemId: series.data!.getItemIdFromIndex(2) }]);
                    await waitForChartStability(chart);

                    // Mirrors the reported interaction: the pointer moves onto a datum and then off it
                    // again while the selection is still active, so the last highlight change wrote the
                    // dimmed opacity. Deselecting must then restore it with no further pointer input.
                    await setHighlight(2);
                    await setHighlight(undefined);
                    expect(getErrorBarGroupOpacity()).toBe(DIMMED_OPACITY);

                    chart.clearSelection();
                    await waitForChartStability(chart);

                    expect(getErrorBarGroupOpacity()).toBe(1);
                });
            }
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

        // Group selection is currently unsupported; revisit this test once we start implementing it.
        describe.skip('treemap - group selection enabled', () => {
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

        describe('treemap - group selection disabled, highlight disabled', () => {
            type D = DiskDatum;
            type C = unknown;
            let selectionChange: SelectionChangeRecorder<D, C>;

            const { data, series, theme, legend, title } = createDiskUsageOptions('treemap');

            const seriesId = 'TreemapSeries-1' as const;
            const POINT_MOVIE: CanvasPoint = { canvasX: 160, canvasY: 258 };
            const POINT_VID2: CanvasPoint = { canvasX: 496, canvasY: 223 };
            const POINT_MNT: CanvasPoint = { canvasX: 605, canvasY: 96 };
            const POINT_IMG1: CanvasPoint = { canvasX: 84, canvasY: 522 };
            const DATUM_MOVIE: D = findName(data, 'movie.mp4');
            const DATUM_VID2: D = findName(data, 'vid2.mp4');
            const DATUM_IMG1: D = findName(data, 'img1.jpg');
            const ITEM_MOVIE: AgSelectionItem<D> = { datum: DATUM_MOVIE, seriesId, itemId: 13 };
            const ITEM_VID2: AgSelectionItem<D> = { datum: DATUM_VID2, seriesId, itemId: 22 };
            const ITEM_IMG1: AgSelectionItem<D> = { datum: DATUM_IMG1, seriesId, itemId: 10 };
            const ADDED_MOVIE = uiChangeEvent<D, C>({ added: [ITEM_MOVIE], removed: [] });
            const ADDED_VID2 = uiChangeEvent<D, C>({ added: [ITEM_VID2], removed: [] });
            const ADDED_IMG1 = uiChangeEvent<D, C>({ added: [ITEM_IMG1], removed: [] });
            const REMOVED_MOVIE = uiChangeEvent<D, C>({ added: [], removed: [ITEM_MOVIE] });
            const REMOVED_MNT_VID2 = uiChangeEvent<D, C>({ added: [], removed: [ITEM_VID2] });
            const ADDED_IMG1_REMOVED_MOVIE_MNT_VID2 = uiChangeEvent<D, C>({
                added: [ITEM_IMG1],
                removed: [ITEM_MOVIE, ITEM_VID2],
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
                        highlight: {
                            enabled: false,
                        },
                        listeners: { selectionChange },
                    });
                });

                describe('select 3 points', () => {
                    beforeEach(async () => {
                        await mouseClick(POINT_MOVIE);
                        await mouseClick(POINT_VID2, { ctrlKey });
                        await mouseClick(POINT_MNT, { ctrlKey });
                    });
                    describe('initial', () => {
                        test('screenshot', async () => {
                            await compareExact('diskusage-treemap-highlighted-none-selected-movie-mnt-vid2');
                        });
                        test('getSelection', () => {
                            expect(getChartSelectionArray()).toEqual([ITEM_MOVIE, ITEM_VID2]);
                        });
                        test('selectionChange', () => {
                            expect(selectionChange.popEvents()).toEqual([ADDED_MOVIE, ADDED_VID2]);
                        });
                    });
                    describe('follow-up', () => {
                        beforeEach(() => {
                            selectionChange.popEvents(); // pop event of initial selection.
                        });
                        describe('click on selected node sets that node to the sole selection', () => {
                            test('screenshot', async () => {
                                await mouseClick(POINT_MOVIE);
                                await compareExact('diskusage-treemap-highlighted-none-selected-movie');
                            });
                            test('getSelection', async () => {
                                await mouseClick(POINT_MOVIE);
                                expect(getChartSelectionArray()).toEqual([ITEM_MOVIE]);
                            });
                            test('selectionChange', async () => {
                                await mouseClick(POINT_MOVIE);
                                expect(selectionChange.popEvents()).toEqual([REMOVED_MNT_VID2]);
                            });
                        });
                        describe('ctrl-click on selected node removes that node only', () => {
                            test('screenshot', async () => {
                                await mouseClick(POINT_MOVIE, { ctrlKey });
                                await compareExact('diskusage-treemap-highlighted-none-selected-vid2');
                            });
                            test('getSelection', async () => {
                                await mouseClick(POINT_MOVIE, { ctrlKey });
                                expect(getChartSelectionArray()).toEqual([ITEM_VID2]);
                            });
                            test('selectionChange', async () => {
                                await mouseClick(POINT_MOVIE, { ctrlKey });
                                expect(selectionChange.popEvents()).toEqual([REMOVED_MOVIE]);
                            });
                        });
                        describe('click on unselected node sets that node to the sole selection', () => {
                            test('screenshot', async () => {
                                await mouseClick(POINT_IMG1);
                                await compareExact('diskusage-treemap-highlighted-none-selected-img1');
                            });
                            test('getSelection', async () => {
                                await mouseClick(POINT_IMG1);
                                expect(getChartSelectionArray()).toEqual([ITEM_IMG1]);
                            });
                            test('selectionChange', async () => {
                                await mouseClick(POINT_IMG1);
                                expect(selectionChange.popEvents()).toEqual([ADDED_IMG1_REMOVED_MOVIE_MNT_VID2]);
                            });
                        });
                        describe('ctrl-click on unselected node adds that node only', () => {
                            test('screenshot', async () => {
                                await mouseClick(POINT_IMG1, { ctrlKey });
                                await compareExact('diskusage-treemap-highlighted-none-selected-img1-movie-vid2');
                            });
                            test('getSelection', async () => {
                                await mouseClick(POINT_IMG1, { ctrlKey });
                                expect(getChartSelectionArray()).toEqual([ITEM_IMG1, ITEM_MOVIE, ITEM_VID2]);
                            });
                            test('selectionChange', async () => {
                                await mouseClick(POINT_IMG1, { ctrlKey });
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

            describe('with label.itemStyler (highlight disabled)', () => {
                // Reuses the 'without module clash' multi-series line setup (data + series),
                // but every line series carries a label.itemStyler and highlight is disabled
                // (highlight is flaky in tests and not what we're exercising). The styler maps
                // the two states to independent, simultaneously-visible label properties so a
                // single snapshot encodes both: candidateState -> box background fill,
                // selectionState -> text colour/weight. Reddish hues are avoided because red
                // marks pixel diffs on snapshot failure. s3id (selection disabled) gets both
                // states undefined and so renders with default label styling.
                const POINT_A = { canvasX: 262.5, canvasY: 440 };
                const POINT_B = { canvasX: 582.5, canvasY: 21 };
                const POINT_C = { canvasX: 41.5, canvasY: 142 };

                const candidacyFill = {
                    'selected-item': 'lightgreen',
                    'unselected-item': 'khaki',
                    'unselected-series': 'lightblue',
                    none: undefined,
                } as const;
                const selectionText = {
                    'selected-item': { color: 'darkgreen', fontWeight: 'bold', fontSize: 15 },
                    'unselected-item': { color: 'dimgray' },
                    'unselected-series': { color: 'navy' },
                    none: {},
                } as const;
                const labelItemStyler = (params: AgChartLabelStylerParams<AccountingDatum, unknown>) => {
                    return {
                        fill: params.candidateState ? candidacyFill[params.candidateState] : undefined,
                        ...(params.selectionState ? selectionText[params.selectionState] : {}),
                    };
                };

                beforeEach(async () => {
                    const { data = [], series = [] } = createLineAccountingOptions();
                    chart = await createChartInstance({
                        data,
                        series,
                        theme: {
                            overrides: {
                                line: {
                                    series: {
                                        label: {
                                            enabled: true,
                                            formatter: (params) => `${params.yKey.at(0)}${params.datum.year.at(3)}`,
                                            itemStyler: labelItemStyler,
                                        },
                                        selection: {
                                            selectedItem: { strokeWidth: 5 },
                                        },
                                    },
                                },
                            },
                        },
                        highlight: { enabled: false },
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
                    });
                });

                // Drag candidacy is computed identically regardless of modifier (the modifier
                // only changes what is committed on mouse-up), so the in-progress and first-
                // commit snapshots are shared across no-/ctrl-/meta-modifier; only the second
                // commit differs (replace vs add). ctrl and meta are fully identical.
                describe('no-modifier two drags', () => {
                    test('screenshot', async () => {
                        await mouseDown(POINT_A);
                        await mouseMove(POINT_B);
                        await compareExact('drag-modifiers-line-labelstyler-candidacy-a1a2l1l2n1n2');
                        await mouseUp(POINT_B);
                        await compareExact('drag-modifiers-line-labelstyler-selected-a1a2l1l2n1n2');

                        await mouseDown(POINT_B);
                        await mouseMove(POINT_C);
                        await compareExact('drag-modifiers-line-labelstyler-selected-a1a2l1l2n1n2-candidacy-a0a1a2n1');
                        await mouseUp(POINT_C);
                        await compareExact('drag-modifiers-line-labelstyler-selected-a0a1a2n1');
                    });
                });
                describe('alt-modifier two drags', () => {
                    test('screenshot', async () => {
                        // alt is an "unknown" modifier: the selection drag is skipped entirely
                        // (no candidacy, no rect, no commit), so every phase renders the base
                        // chart with default labels.
                        await mouseDown(POINT_A, { altKey });
                        await mouseMove(POINT_B, { altKey });
                        await compareExact('drag-modifiers-line-labelstyler-none');
                        await mouseUp(POINT_B, { altKey });
                        await compareExact('drag-modifiers-line-labelstyler-none');

                        await mouseDown(POINT_B, { altKey });
                        await mouseMove(POINT_C, { altKey });
                        await compareExact('drag-modifiers-line-labelstyler-none');
                        await mouseUp(POINT_C, { altKey });
                        await compareExact('drag-modifiers-line-labelstyler-none');
                    });
                });
                describe('ctrl-modifier two drags', () => {
                    test('screenshot', async () => {
                        await mouseDown(POINT_A, { ctrlKey });
                        await mouseMove(POINT_B, { ctrlKey });
                        await compareExact('drag-modifiers-line-labelstyler-candidacy-a1a2l1l2n1n2');
                        await mouseUp(POINT_B, { ctrlKey });
                        await compareExact('drag-modifiers-line-labelstyler-selected-a1a2l1l2n1n2');

                        await mouseDown(POINT_B, { ctrlKey });
                        await mouseMove(POINT_C, { ctrlKey });
                        await compareExact(
                            'drag-modifiers-line-labelstyler-selected-a1a2l1l2n1n2-candidacy-union-a0a1a2n1'
                        );
                        await mouseUp(POINT_C, { ctrlKey });
                        await compareExact('drag-modifiers-line-labelstyler-selected-a0a1a2l1l2n1n2');
                    });
                });
                describe('meta-modifier two drags', () => {
                    test('screenshot', async () => {
                        await mouseDown(POINT_A, { metaKey });
                        await mouseMove(POINT_B, { metaKey });
                        await compareExact('drag-modifiers-line-labelstyler-candidacy-a1a2l1l2n1n2');
                        await mouseUp(POINT_B, { metaKey });
                        await compareExact('drag-modifiers-line-labelstyler-selected-a1a2l1l2n1n2');

                        await mouseDown(POINT_B, { metaKey });
                        await mouseMove(POINT_C, { metaKey });
                        await compareExact(
                            'drag-modifiers-line-labelstyler-selected-a1a2l1l2n1n2-candidacy-union-a0a1a2n1'
                        );
                        await mouseUp(POINT_C, { metaKey });
                        await compareExact('drag-modifiers-line-labelstyler-selected-a0a1a2l1l2n1n2');
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
                    lineDatum(257, -784),
                    lineDatum(258, -771),
                    lineDatum(259, -757),
                    lineDatum(260, -743),
                    lineDatum(261, -729),
                    lineDatum(262, -714),
                    lineDatum(263, -700),
                    lineDatum(264, -685),
                    lineDatum(265, -669),
                    lineDatum(266, -653),
                    lineDatum(267, -637),
                    lineDatum(268, -621),
                    lineDatum(269, -605),
                    lineDatum(270, -588),
                    lineDatum(271, -571),
                    lineDatum(272, -553),
                    lineDatum(273, -536),
                    lineDatum(274, -518),
                    lineDatum(275, -500),
                    lineDatum(276, -482),
                    lineDatum(277, -463),
                    lineDatum(278, -445),
                    lineDatum(279, -426),
                    lineDatum(280, -407),
                    lineDatum(281, -388),
                    lineDatum(282, -368),
                    lineDatum(283, -349),
                    lineDatum(284, -329),
                    lineDatum(285, -309),
                    lineDatum(286, -289),
                    lineDatum(287, -269),
                    lineDatum(288, -249),
                    lineDatum(289, -228),
                    lineDatum(290, -208),
                    lineDatum(291, -187),
                    lineDatum(292, -167),
                    lineDatum(293, -146),
                    lineDatum(294, -125),
                    lineDatum(295, -105),
                    lineDatum(296, -84),
                    lineDatum(297, -63),
                    lineDatum(298, -42),
                    lineDatum(299, -21),
                    lineDatum(300, 0),
                    lineDatum(301, 21),
                    lineDatum(302, 42),
                    lineDatum(303, 63),
                    lineDatum(304, 84),
                    lineDatum(305, 105),
                    lineDatum(306, 125),
                    lineDatum(307, 146),
                    lineDatum(308, 167),
                    lineDatum(309, 187),
                    lineDatum(310, 208),
                    lineDatum(311, 228),
                    lineDatum(312, 249),
                    lineDatum(313, 269),
                    lineDatum(314, 289),
                    lineDatum(315, 309),
                    lineDatum(316, 329),
                    lineDatum(317, 349),
                    lineDatum(318, 368),
                    lineDatum(319, 388),
                    lineDatum(320, 407),
                    lineDatum(321, 426),
                    lineDatum(322, 445),
                    lineDatum(323, 463),
                    lineDatum(324, 482),
                    lineDatum(325, 500),
                    lineDatum(326, 518),
                    lineDatum(327, 536),
                    lineDatum(328, 553),
                    lineDatum(329, 571),
                    lineDatum(330, 588),
                    lineDatum(331, 605),
                    lineDatum(332, 621),
                    lineDatum(333, 637),
                    lineDatum(334, 653),
                    lineDatum(335, 669),
                    lineDatum(336, 685),
                    lineDatum(337, 700),
                    lineDatum(413, 700),
                    lineDatum(414, 685),
                    lineDatum(415, 669),
                    lineDatum(416, 653),
                    lineDatum(417, 637),
                    lineDatum(418, 621),
                    lineDatum(419, 605),
                    lineDatum(420, 588),
                    lineDatum(421, 571),
                    lineDatum(422, 553),
                    lineDatum(423, 536),
                    lineDatum(424, 518),
                    lineDatum(425, 500),
                    lineDatum(426, 482),
                    lineDatum(427, 463),
                    lineDatum(428, 445),
                    lineDatum(429, 426),
                    lineDatum(430, 407),
                    lineDatum(431, 388),
                    lineDatum(432, 368),
                    lineDatum(433, 349),
                    lineDatum(434, 329),
                    lineDatum(435, 309),
                    lineDatum(436, 289),
                    lineDatum(437, 269),
                    lineDatum(438, 249),
                    lineDatum(439, 228),
                    lineDatum(440, 208),
                    lineDatum(441, 187),
                    lineDatum(442, 167),
                    lineDatum(443, 146),
                    lineDatum(444, 125),
                    lineDatum(445, 105),
                    lineDatum(446, 84),
                    lineDatum(447, 63),
                    lineDatum(448, 42),
                    lineDatum(449, 21),
                    lineDatum(450, 0),
                    lineDatum(451, -21),
                    lineDatum(452, -42),
                    lineDatum(453, -63),
                    lineDatum(454, -84),
                    lineDatum(455, -105),
                    lineDatum(456, -125),
                    lineDatum(457, -146),
                    lineDatum(458, -167),
                    lineDatum(459, -187),
                    lineDatum(460, -208),
                    lineDatum(461, -228),
                    lineDatum(462, -249),
                    lineDatum(463, -269),
                    lineDatum(464, -289),
                    lineDatum(465, -309),
                    lineDatum(466, -329),
                    lineDatum(467, -349),
                    lineDatum(468, -368),
                    lineDatum(469, -388),
                    lineDatum(470, -407),
                    lineDatum(471, -426),
                    lineDatum(472, -445),
                    lineDatum(473, -463),
                    lineDatum(474, -482),
                    lineDatum(475, -500),
                    lineDatum(476, -518),
                    lineDatum(477, -536),
                    lineDatum(478, -553),
                    lineDatum(479, -571),
                    lineDatum(480, -588),
                    lineDatum(481, -605),
                    lineDatum(482, -621),
                    lineDatum(483, -637),
                    lineDatum(484, -653),
                    lineDatum(485, -669),
                    lineDatum(486, -685),
                    lineDatum(487, -700),
                    lineDatum(488, -714),
                    lineDatum(489, -729),
                    lineDatum(490, -743),
                    lineDatum(491, -757),
                    lineDatum(492, -771),
                    lineDatum(493, -784),
                    lineDatum(557, -784),
                    lineDatum(558, -771),
                    lineDatum(559, -757),
                    lineDatum(560, -743),
                    lineDatum(561, -729),
                    lineDatum(562, -714),
                    lineDatum(563, -700),
                    lineDatum(564, -685),
                    lineDatum(565, -669),
                    lineDatum(566, -653),
                    lineDatum(567, -637),
                    lineDatum(568, -621),
                    lineDatum(569, -605),
                    lineDatum(570, -588),
                    lineDatum(571, -571),
                    lineDatum(572, -553),
                    lineDatum(573, -536),
                    lineDatum(574, -518),
                    lineDatum(575, -500),
                    lineDatum(576, -482),
                    lineDatum(577, -463),
                    lineDatum(578, -445),
                    lineDatum(579, -426),
                    lineDatum(580, -407),
                    lineDatum(581, -388),
                    lineDatum(582, -368),
                    lineDatum(583, -349),
                    lineDatum(584, -329),
                    lineDatum(585, -309),
                    lineDatum(586, -289),
                    lineDatum(587, -269),
                    lineDatum(588, -249),
                    lineDatum(589, -228),
                    lineDatum(590, -208),
                    lineDatum(591, -187),
                    lineDatum(592, -167),
                    lineDatum(593, -146),
                    lineDatum(594, -125),
                    lineDatum(595, -105),
                    lineDatum(596, -84),
                    lineDatum(597, -63),
                    lineDatum(598, -42),
                    lineDatum(599, -21),
                    lineDatum(600, 0),
                    lineDatum(601, 21),
                    lineDatum(602, 42),
                    lineDatum(603, 63),
                    lineDatum(604, 84),
                    lineDatum(605, 105),
                    lineDatum(606, 125),
                    lineDatum(607, 146),
                    lineDatum(608, 167),
                    lineDatum(609, 187),
                    lineDatum(610, 208),
                    lineDatum(611, 228),
                    lineDatum(612, 249),
                    lineDatum(613, 269),
                    lineDatum(614, 289),
                    lineDatum(615, 309),
                    lineDatum(616, 329),
                    lineDatum(617, 349),
                    lineDatum(618, 368),
                    lineDatum(619, 388),
                    lineDatum(620, 407),
                    lineDatum(621, 426),
                    lineDatum(622, 445),
                    lineDatum(623, 463),
                    lineDatum(624, 482),
                    lineDatum(625, 500),
                    lineDatum(626, 518),
                    lineDatum(627, 536),
                    lineDatum(628, 553),
                    lineDatum(629, 571),
                    lineDatum(630, 588),
                    lineDatum(631, 605),
                    lineDatum(632, 621),
                    lineDatum(633, 637),
                    lineDatum(634, 653),
                    lineDatum(635, 669),
                    lineDatum(636, 685),
                    lineDatum(637, 700),
                    lineDatum(713, 700),
                    lineDatum(714, 685),
                    lineDatum(715, 669),
                    lineDatum(716, 653),
                    lineDatum(717, 637),
                    lineDatum(718, 621),
                    lineDatum(719, 605),
                    lineDatum(720, 588),
                    lineDatum(721, 571),
                    lineDatum(722, 553),
                    lineDatum(723, 536),
                    lineDatum(724, 518),
                    lineDatum(725, 500),
                    lineDatum(726, 482),
                    lineDatum(727, 463),
                    lineDatum(728, 445),
                    lineDatum(729, 426),
                    lineDatum(730, 407),
                    lineDatum(731, 388),
                    lineDatum(732, 368),
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
                    areaDatum(257, -784),
                    areaDatum(258, -771),
                    areaDatum(259, -757),
                    areaDatum(260, -743),
                    areaDatum(261, -729),
                    areaDatum(262, -714),
                    areaDatum(263, -700),
                    areaDatum(264, -685),
                    areaDatum(265, -669),
                    areaDatum(266, -653),
                    areaDatum(267, -637),
                    areaDatum(268, -621),
                    areaDatum(269, -605),
                    areaDatum(270, -588),
                    areaDatum(271, -571),
                    areaDatum(272, -553),
                    areaDatum(273, -536),
                    areaDatum(274, -518),
                    areaDatum(275, -500),
                    areaDatum(276, -482),
                    areaDatum(277, -463),
                    areaDatum(278, -445),
                    areaDatum(279, -426),
                    areaDatum(280, -407),
                    areaDatum(281, -388),
                    areaDatum(282, -368),
                    areaDatum(283, -349),
                    areaDatum(284, -329),
                    areaDatum(285, -309),
                    areaDatum(286, -289),
                    areaDatum(287, -269),
                    areaDatum(288, -249),
                    areaDatum(289, -228),
                    areaDatum(290, -208),
                    areaDatum(291, -187),
                    areaDatum(292, -167),
                    areaDatum(293, -146),
                    areaDatum(294, -125),
                    areaDatum(295, -105),
                    areaDatum(296, -84),
                    areaDatum(297, -63),
                    areaDatum(298, -42),
                    areaDatum(299, -21),
                    areaDatum(300, 0),
                    areaDatum(301, 21),
                    areaDatum(302, 42),
                    areaDatum(303, 63),
                    areaDatum(304, 84),
                    areaDatum(305, 105),
                    areaDatum(306, 125),
                    areaDatum(307, 146),
                    areaDatum(308, 167),
                    areaDatum(309, 187),
                    areaDatum(310, 208),
                    areaDatum(311, 228),
                    areaDatum(312, 249),
                    areaDatum(313, 269),
                    areaDatum(314, 289),
                    areaDatum(315, 309),
                    areaDatum(316, 329),
                    areaDatum(317, 349),
                    areaDatum(318, 368),
                    areaDatum(319, 388),
                    areaDatum(320, 407),
                    areaDatum(321, 426),
                    areaDatum(322, 445),
                    areaDatum(323, 463),
                    areaDatum(324, 482),
                    areaDatum(325, 500),
                    areaDatum(326, 518),
                    areaDatum(327, 536),
                    areaDatum(328, 553),
                    areaDatum(329, 571),
                    areaDatum(330, 588),
                    areaDatum(331, 605),
                    areaDatum(332, 621),
                    areaDatum(333, 637),
                    areaDatum(334, 653),
                    areaDatum(335, 669),
                    areaDatum(336, 685),
                    areaDatum(337, 700),
                    areaDatum(413, 700),
                    areaDatum(414, 685),
                    areaDatum(415, 669),
                    areaDatum(416, 653),
                    areaDatum(417, 637),
                    areaDatum(418, 621),
                    areaDatum(419, 605),
                    areaDatum(420, 588),
                    areaDatum(421, 571),
                    areaDatum(422, 553),
                    areaDatum(423, 536),
                    areaDatum(424, 518),
                    areaDatum(425, 500),
                    areaDatum(426, 482),
                    areaDatum(427, 463),
                    areaDatum(428, 445),
                    areaDatum(429, 426),
                    areaDatum(430, 407),
                    areaDatum(431, 388),
                    areaDatum(432, 368),
                    areaDatum(433, 349),
                    areaDatum(434, 329),
                    areaDatum(435, 309),
                    areaDatum(436, 289),
                    areaDatum(437, 269),
                    areaDatum(438, 249),
                    areaDatum(439, 228),
                    areaDatum(440, 208),
                    areaDatum(441, 187),
                    areaDatum(442, 167),
                    areaDatum(443, 146),
                    areaDatum(444, 125),
                    areaDatum(445, 105),
                    areaDatum(446, 84),
                    areaDatum(447, 63),
                    areaDatum(448, 42),
                    areaDatum(449, 21),
                    areaDatum(450, 0),
                    areaDatum(451, -21),
                    areaDatum(452, -42),
                    areaDatum(453, -63),
                    areaDatum(454, -84),
                    areaDatum(455, -105),
                    areaDatum(456, -125),
                    areaDatum(457, -146),
                    areaDatum(458, -167),
                    areaDatum(459, -187),
                    areaDatum(460, -208),
                    areaDatum(461, -228),
                    areaDatum(462, -249),
                    areaDatum(463, -269),
                    areaDatum(464, -289),
                    areaDatum(465, -309),
                    areaDatum(466, -329),
                    areaDatum(467, -349),
                    areaDatum(468, -368),
                    areaDatum(469, -388),
                    areaDatum(470, -407),
                    areaDatum(471, -426),
                    areaDatum(472, -445),
                    areaDatum(473, -463),
                    areaDatum(474, -482),
                    areaDatum(475, -500),
                    areaDatum(476, -518),
                    areaDatum(477, -536),
                    areaDatum(478, -553),
                    areaDatum(479, -571),
                    areaDatum(480, -588),
                    areaDatum(481, -605),
                    areaDatum(482, -621),
                    areaDatum(483, -637),
                    areaDatum(484, -653),
                    areaDatum(485, -669),
                    areaDatum(486, -685),
                    areaDatum(487, -700),
                    areaDatum(488, -714),
                    areaDatum(489, -729),
                    areaDatum(490, -743),
                    areaDatum(491, -757),
                    areaDatum(492, -771),
                    areaDatum(493, -784),
                    areaDatum(557, -784),
                    areaDatum(558, -771),
                    areaDatum(559, -757),
                    areaDatum(560, -743),
                    areaDatum(561, -729),
                    areaDatum(562, -714),
                    areaDatum(563, -700),
                    areaDatum(564, -685),
                    areaDatum(565, -669),
                    areaDatum(566, -653),
                    areaDatum(567, -637),
                    areaDatum(568, -621),
                    areaDatum(569, -605),
                    areaDatum(570, -588),
                    areaDatum(571, -571),
                    areaDatum(572, -553),
                    areaDatum(573, -536),
                    areaDatum(574, -518),
                    areaDatum(575, -500),
                    areaDatum(576, -482),
                    areaDatum(577, -463),
                    areaDatum(578, -445),
                    areaDatum(579, -426),
                    areaDatum(580, -407),
                    areaDatum(581, -388),
                    areaDatum(582, -368),
                    areaDatum(583, -349),
                    areaDatum(584, -329),
                    areaDatum(585, -309),
                    areaDatum(586, -289),
                    areaDatum(587, -269),
                    areaDatum(588, -249),
                    areaDatum(589, -228),
                    areaDatum(590, -208),
                    areaDatum(591, -187),
                    areaDatum(592, -167),
                    areaDatum(593, -146),
                    areaDatum(594, -125),
                    areaDatum(595, -105),
                    areaDatum(596, -84),
                    areaDatum(597, -63),
                    areaDatum(598, -42),
                    areaDatum(599, -21),
                    areaDatum(600, 0),
                    areaDatum(601, 21),
                    areaDatum(602, 42),
                    areaDatum(603, 63),
                    areaDatum(604, 84),
                    areaDatum(605, 105),
                    areaDatum(606, 125),
                    areaDatum(607, 146),
                    areaDatum(608, 167),
                    areaDatum(609, 187),
                    areaDatum(610, 208),
                    areaDatum(611, 228),
                    areaDatum(612, 249),
                    areaDatum(613, 269),
                    areaDatum(614, 289),
                    areaDatum(615, 309),
                    areaDatum(616, 329),
                    areaDatum(617, 349),
                    areaDatum(618, 368),
                    areaDatum(619, 388),
                    areaDatum(620, 407),
                    areaDatum(621, 426),
                    areaDatum(622, 445),
                    areaDatum(623, 463),
                    areaDatum(624, 482),
                    areaDatum(625, 500),
                    areaDatum(626, 518),
                    areaDatum(627, 536),
                    areaDatum(628, 553),
                    areaDatum(629, 571),
                    areaDatum(630, 588),
                    areaDatum(631, 605),
                    areaDatum(632, 621),
                    areaDatum(633, 637),
                    areaDatum(634, 653),
                    areaDatum(635, 669),
                    areaDatum(636, 685),
                    areaDatum(637, 700),
                    areaDatum(713, 700),
                    areaDatum(714, 685),
                    areaDatum(715, 669),
                    areaDatum(716, 653),
                    areaDatum(717, 637),
                    areaDatum(718, 621),
                    areaDatum(719, 605),
                    areaDatum(720, 588),
                    areaDatum(721, 571),
                    areaDatum(722, 553),
                    areaDatum(723, 536),
                    areaDatum(724, 518),
                    areaDatum(725, 500),
                    areaDatum(726, 482),
                    areaDatum(727, 463),
                    areaDatum(728, 445),
                    areaDatum(729, 426),
                    areaDatum(730, 407),
                    areaDatum(731, 388),
                    areaDatum(732, 368),
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
                    rangeAreaDatum(231, -742, -1242),
                    rangeAreaDatum(232, -739, -1239),
                    rangeAreaDatum(233, -736, -1236),
                    rangeAreaDatum(234, -732, -1232),
                    rangeAreaDatum(235, -728, -1228),
                    rangeAreaDatum(236, -724, -1224),
                    rangeAreaDatum(237, -719, -1219),
                    rangeAreaDatum(238, -713, -1213),
                    rangeAreaDatum(239, -707, -1207),
                    rangeAreaDatum(240, -701, -1201),
                    rangeAreaDatum(241, -694, -1194),
                    rangeAreaDatum(242, -687, -1187),
                    rangeAreaDatum(243, -680, -1180),
                    rangeAreaDatum(244, -672, -1172),
                    rangeAreaDatum(245, -664, -1164),
                    rangeAreaDatum(246, -655, -1155),
                    rangeAreaDatum(247, -646, -1146),
                    rangeAreaDatum(248, -636, -1136),
                    rangeAreaDatum(249, -626, -1126),
                    rangeAreaDatum(250, -616, -1116),
                    rangeAreaDatum(251, -605, -1105),
                    rangeAreaDatum(252, -594, -1094),
                    rangeAreaDatum(253, -583, -1083),
                    rangeAreaDatum(254, -571, -1071),
                    rangeAreaDatum(255, -559, -1059),
                    rangeAreaDatum(256, -547, -1047),
                    rangeAreaDatum(257, -534, -1034),
                    rangeAreaDatum(258, -521, -1021),
                    rangeAreaDatum(259, -507, -1007),
                    rangeAreaDatum(260, -493, -993),
                    rangeAreaDatum(261, -479, -979),
                    rangeAreaDatum(262, -464, -964),
                    rangeAreaDatum(263, -450, -950),
                    rangeAreaDatum(264, -435, -935),
                    rangeAreaDatum(265, -419, -919),
                    rangeAreaDatum(266, -403, -903),
                    rangeAreaDatum(267, -387, -887),
                    rangeAreaDatum(268, -371, -871),
                    rangeAreaDatum(269, -355, -855),
                    rangeAreaDatum(270, -338, -838),
                    rangeAreaDatum(271, -321, -821),
                    rangeAreaDatum(272, -303, -803),
                    rangeAreaDatum(273, -286, -786),
                    rangeAreaDatum(274, -268, -768),
                    rangeAreaDatum(275, -250, -750),
                    rangeAreaDatum(276, -232, -732),
                    rangeAreaDatum(277, -213, -713),
                    rangeAreaDatum(278, -195, -695),
                    rangeAreaDatum(279, -176, -676),
                    rangeAreaDatum(280, -157, -657),
                    rangeAreaDatum(281, -138, -638),
                    rangeAreaDatum(282, -118, -618),
                    rangeAreaDatum(283, -99, -599),
                    rangeAreaDatum(284, -79, -579),
                    rangeAreaDatum(285, -59, -559),
                    rangeAreaDatum(286, -39, -539),
                    rangeAreaDatum(287, -19, -519),
                    rangeAreaDatum(288, 1, -499),
                    rangeAreaDatum(289, 22, -478),
                    rangeAreaDatum(290, 42, -458),
                    rangeAreaDatum(291, 63, -437),
                    rangeAreaDatum(292, 83, -417),
                    rangeAreaDatum(293, 104, -396),
                    rangeAreaDatum(294, 125, -375),
                    rangeAreaDatum(295, 145, -355),
                    rangeAreaDatum(296, 166, -334),
                    rangeAreaDatum(297, 187, -313),
                    rangeAreaDatum(298, 208, -292),
                    rangeAreaDatum(299, 229, -271),
                    rangeAreaDatum(300, 250, -250),
                    rangeAreaDatum(301, 271, -229),
                    rangeAreaDatum(302, 292, -208),
                    rangeAreaDatum(303, 313, -187),
                    rangeAreaDatum(304, 334, -166),
                    rangeAreaDatum(305, 355, -145),
                    rangeAreaDatum(306, 375, -125),
                    rangeAreaDatum(307, 396, -104),
                    rangeAreaDatum(308, 417, -83),
                    rangeAreaDatum(309, 437, -63),
                    rangeAreaDatum(310, 458, -42),
                    rangeAreaDatum(311, 478, -22),
                    rangeAreaDatum(312, 499, -1),
                    rangeAreaDatum(313, 519, 19),
                    rangeAreaDatum(314, 539, 39),
                    rangeAreaDatum(315, 559, 59),
                    rangeAreaDatum(316, 579, 79),
                    rangeAreaDatum(317, 599, 99),
                    rangeAreaDatum(318, 618, 118),
                    rangeAreaDatum(319, 638, 138),
                    rangeAreaDatum(320, 657, 157),
                    rangeAreaDatum(321, 676, 176),
                    rangeAreaDatum(322, 695, 195),
                    rangeAreaDatum(323, 713, 213),
                    rangeAreaDatum(324, 732, 232),
                    rangeAreaDatum(325, 750, 250),
                    rangeAreaDatum(326, 768, 268),
                    rangeAreaDatum(327, 786, 286),
                    rangeAreaDatum(328, 803, 303),
                    rangeAreaDatum(329, 821, 321),
                    rangeAreaDatum(330, 838, 338),
                    rangeAreaDatum(331, 855, 355),
                    rangeAreaDatum(332, 871, 371),
                    rangeAreaDatum(333, 887, 387),
                    rangeAreaDatum(334, 903, 403),
                    rangeAreaDatum(335, 919, 419),
                    rangeAreaDatum(336, 935, 435),
                    rangeAreaDatum(337, 950, 450),
                    rangeAreaDatum(338, 964, 464),
                    rangeAreaDatum(339, 979, 479),
                    rangeAreaDatum(340, 993, 493),
                    rangeAreaDatum(341, 1007, 507),
                    rangeAreaDatum(342, 1021, 521),
                    rangeAreaDatum(343, 1034, 534),
                    rangeAreaDatum(344, 1047, 547),
                    rangeAreaDatum(345, 1059, 559),
                    rangeAreaDatum(346, 1071, 571),
                    rangeAreaDatum(347, 1083, 583),
                    rangeAreaDatum(348, 1094, 594),
                    rangeAreaDatum(349, 1105, 605),
                    rangeAreaDatum(350, 1116, 616),
                    rangeAreaDatum(351, 1126, 626),
                    rangeAreaDatum(352, 1136, 636),
                    rangeAreaDatum(353, 1146, 646),
                    rangeAreaDatum(354, 1155, 655),
                    rangeAreaDatum(355, 1164, 664),
                    rangeAreaDatum(356, 1172, 672),
                    rangeAreaDatum(357, 1180, 680),
                    rangeAreaDatum(358, 1187, 687),
                    rangeAreaDatum(359, 1194, 694),
                    rangeAreaDatum(360, 1201, 701),
                    rangeAreaDatum(361, 1207, 707),
                    rangeAreaDatum(362, 1213, 713),
                    rangeAreaDatum(363, 1219, 719),
                    rangeAreaDatum(364, 1224, 724),
                    rangeAreaDatum(365, 1228, 728),
                    rangeAreaDatum(366, 1232, 732),
                    rangeAreaDatum(367, 1236, 736),
                    rangeAreaDatum(368, 1239, 739),
                    rangeAreaDatum(369, 1242, 742),
                    rangeAreaDatum(370, 1245, 745),
                    rangeAreaDatum(371, 1246, 746),
                    rangeAreaDatum(372, 1248, 748),
                    rangeAreaDatum(373, 1249, 749),
                    rangeAreaDatum(374, 1250, 750),
                    rangeAreaDatum(375, 1250, 750),
                    rangeAreaDatum(376, 1250, 750),
                    rangeAreaDatum(377, 1249, 749),
                    rangeAreaDatum(378, 1248, 748),
                    rangeAreaDatum(379, 1246, 746),
                    rangeAreaDatum(380, 1245, 745),
                    rangeAreaDatum(381, 1242, 742),
                    rangeAreaDatum(382, 1239, 739),
                    rangeAreaDatum(383, 1236, 736),
                    rangeAreaDatum(384, 1232, 732),
                    rangeAreaDatum(385, 1228, 728),
                    rangeAreaDatum(386, 1224, 724),
                    rangeAreaDatum(387, 1219, 719),
                    rangeAreaDatum(388, 1213, 713),
                    rangeAreaDatum(389, 1207, 707),
                    rangeAreaDatum(390, 1201, 701),
                    rangeAreaDatum(391, 1194, 694),
                    rangeAreaDatum(392, 1187, 687),
                    rangeAreaDatum(393, 1180, 680),
                    rangeAreaDatum(394, 1172, 672),
                    rangeAreaDatum(395, 1164, 664),
                    rangeAreaDatum(396, 1155, 655),
                    rangeAreaDatum(397, 1146, 646),
                    rangeAreaDatum(398, 1136, 636),
                    rangeAreaDatum(399, 1126, 626),
                    rangeAreaDatum(400, 1116, 616),
                    rangeAreaDatum(401, 1105, 605),
                    rangeAreaDatum(402, 1094, 594),
                    rangeAreaDatum(403, 1083, 583),
                    rangeAreaDatum(404, 1071, 571),
                    rangeAreaDatum(405, 1059, 559),
                    rangeAreaDatum(406, 1047, 547),
                    rangeAreaDatum(407, 1034, 534),
                    rangeAreaDatum(408, 1021, 521),
                    rangeAreaDatum(409, 1007, 507),
                    rangeAreaDatum(410, 993, 493),
                    rangeAreaDatum(411, 979, 479),
                    rangeAreaDatum(412, 964, 464),
                    rangeAreaDatum(413, 950, 450),
                    rangeAreaDatum(414, 935, 435),
                    rangeAreaDatum(415, 919, 419),
                    rangeAreaDatum(416, 903, 403),
                    rangeAreaDatum(417, 887, 387),
                    rangeAreaDatum(418, 871, 371),
                    rangeAreaDatum(419, 855, 355),
                    rangeAreaDatum(420, 838, 338),
                    rangeAreaDatum(421, 821, 321),
                    rangeAreaDatum(422, 803, 303),
                    rangeAreaDatum(423, 786, 286),
                    rangeAreaDatum(424, 768, 268),
                    rangeAreaDatum(425, 750, 250),
                    rangeAreaDatum(426, 732, 232),
                    rangeAreaDatum(427, 713, 213),
                    rangeAreaDatum(428, 695, 195),
                    rangeAreaDatum(429, 676, 176),
                    rangeAreaDatum(430, 657, 157),
                    rangeAreaDatum(431, 638, 138),
                    rangeAreaDatum(432, 618, 118),
                    rangeAreaDatum(433, 599, 99),
                    rangeAreaDatum(434, 579, 79),
                    rangeAreaDatum(435, 559, 59),
                    rangeAreaDatum(436, 539, 39),
                    rangeAreaDatum(437, 519, 19),
                    rangeAreaDatum(438, 499, -1),
                    rangeAreaDatum(439, 478, -22),
                    rangeAreaDatum(440, 458, -42),
                    rangeAreaDatum(441, 437, -63),
                    rangeAreaDatum(442, 417, -83),
                    rangeAreaDatum(443, 396, -104),
                    rangeAreaDatum(444, 375, -125),
                    rangeAreaDatum(445, 355, -145),
                    rangeAreaDatum(446, 334, -166),
                    rangeAreaDatum(447, 313, -187),
                    rangeAreaDatum(448, 292, -208),
                    rangeAreaDatum(449, 271, -229),
                    rangeAreaDatum(450, 250, -250),
                    rangeAreaDatum(451, 229, -271),
                    rangeAreaDatum(452, 208, -292),
                    rangeAreaDatum(453, 187, -313),
                    rangeAreaDatum(454, 166, -334),
                    rangeAreaDatum(455, 145, -355),
                    rangeAreaDatum(456, 125, -375),
                    rangeAreaDatum(457, 104, -396),
                    rangeAreaDatum(458, 83, -417),
                    rangeAreaDatum(459, 63, -437),
                    rangeAreaDatum(460, 42, -458),
                    rangeAreaDatum(461, 22, -478),
                    rangeAreaDatum(462, 1, -499),
                    rangeAreaDatum(463, -19, -519),
                    rangeAreaDatum(464, -39, -539),
                    rangeAreaDatum(465, -59, -559),
                    rangeAreaDatum(466, -79, -579),
                    rangeAreaDatum(467, -99, -599),
                    rangeAreaDatum(468, -118, -618),
                    rangeAreaDatum(469, -138, -638),
                    rangeAreaDatum(470, -157, -657),
                    rangeAreaDatum(471, -176, -676),
                    rangeAreaDatum(472, -195, -695),
                    rangeAreaDatum(473, -213, -713),
                    rangeAreaDatum(474, -232, -732),
                    rangeAreaDatum(475, -250, -750),
                    rangeAreaDatum(476, -268, -768),
                    rangeAreaDatum(477, -286, -786),
                    rangeAreaDatum(478, -303, -803),
                    rangeAreaDatum(479, -321, -821),
                    rangeAreaDatum(480, -338, -838),
                    rangeAreaDatum(481, -355, -855),
                    rangeAreaDatum(482, -371, -871),
                    rangeAreaDatum(483, -387, -887),
                    rangeAreaDatum(484, -403, -903),
                    rangeAreaDatum(485, -419, -919),
                    rangeAreaDatum(486, -435, -935),
                    rangeAreaDatum(487, -450, -950),
                    rangeAreaDatum(488, -464, -964),
                    rangeAreaDatum(489, -479, -979),
                    rangeAreaDatum(490, -493, -993),
                    rangeAreaDatum(491, -507, -1007),
                    rangeAreaDatum(492, -521, -1021),
                    rangeAreaDatum(493, -534, -1034),
                    rangeAreaDatum(494, -547, -1047),
                    rangeAreaDatum(495, -559, -1059),
                    rangeAreaDatum(496, -571, -1071),
                    rangeAreaDatum(497, -583, -1083),
                    rangeAreaDatum(498, -594, -1094),
                    rangeAreaDatum(499, -605, -1105),
                    rangeAreaDatum(500, -616, -1116),
                    rangeAreaDatum(501, -626, -1126),
                    rangeAreaDatum(502, -636, -1136),
                    rangeAreaDatum(503, -646, -1146),
                    rangeAreaDatum(504, -655, -1155),
                    rangeAreaDatum(505, -664, -1164),
                    rangeAreaDatum(506, -672, -1172),
                    rangeAreaDatum(507, -680, -1180),
                    rangeAreaDatum(508, -687, -1187),
                    rangeAreaDatum(509, -694, -1194),
                    rangeAreaDatum(510, -701, -1201),
                    rangeAreaDatum(511, -707, -1207),
                    rangeAreaDatum(512, -713, -1213),
                    rangeAreaDatum(513, -719, -1219),
                    rangeAreaDatum(514, -724, -1224),
                    rangeAreaDatum(515, -728, -1228),
                    rangeAreaDatum(516, -732, -1232),
                    rangeAreaDatum(517, -736, -1236),
                    rangeAreaDatum(518, -739, -1239),
                    rangeAreaDatum(519, -742, -1242),
                    rangeAreaDatum(520, -745, -1245),
                    rangeAreaDatum(521, -746, -1246),
                    rangeAreaDatum(522, -748, -1248),
                    rangeAreaDatum(523, -749, -1249),
                    rangeAreaDatum(524, -750, -1250),
                    rangeAreaDatum(525, -750, -1250),
                    rangeAreaDatum(526, -750, -1250),
                    rangeAreaDatum(527, -749, -1249),
                    rangeAreaDatum(528, -748, -1248),
                    rangeAreaDatum(529, -746, -1246),
                    rangeAreaDatum(530, -745, -1245),
                    rangeAreaDatum(531, -742, -1242),
                    rangeAreaDatum(532, -739, -1239),
                    rangeAreaDatum(533, -736, -1236),
                    rangeAreaDatum(534, -732, -1232),
                    rangeAreaDatum(535, -728, -1228),
                    rangeAreaDatum(536, -724, -1224),
                    rangeAreaDatum(537, -719, -1219),
                    rangeAreaDatum(538, -713, -1213),
                    rangeAreaDatum(539, -707, -1207),
                    rangeAreaDatum(540, -701, -1201),
                    rangeAreaDatum(541, -694, -1194),
                    rangeAreaDatum(542, -687, -1187),
                    rangeAreaDatum(543, -680, -1180),
                    rangeAreaDatum(544, -672, -1172),
                    rangeAreaDatum(545, -664, -1164),
                    rangeAreaDatum(546, -655, -1155),
                    rangeAreaDatum(547, -646, -1146),
                    rangeAreaDatum(548, -636, -1136),
                    rangeAreaDatum(549, -626, -1126),
                    rangeAreaDatum(550, -616, -1116),
                    rangeAreaDatum(551, -605, -1105),
                    rangeAreaDatum(552, -594, -1094),
                    rangeAreaDatum(553, -583, -1083),
                    rangeAreaDatum(554, -571, -1071),
                    rangeAreaDatum(555, -559, -1059),
                    rangeAreaDatum(556, -547, -1047),
                    rangeAreaDatum(557, -534, -1034),
                    rangeAreaDatum(558, -521, -1021),
                    rangeAreaDatum(559, -507, -1007),
                    rangeAreaDatum(560, -493, -993),
                    rangeAreaDatum(561, -479, -979),
                    rangeAreaDatum(562, -464, -964),
                    rangeAreaDatum(563, -450, -950),
                    rangeAreaDatum(564, -435, -935),
                    rangeAreaDatum(565, -419, -919),
                    rangeAreaDatum(566, -403, -903),
                    rangeAreaDatum(567, -387, -887),
                    rangeAreaDatum(568, -371, -871),
                    rangeAreaDatum(569, -355, -855),
                    rangeAreaDatum(570, -338, -838),
                    rangeAreaDatum(571, -321, -821),
                    rangeAreaDatum(572, -303, -803),
                    rangeAreaDatum(573, -286, -786),
                    rangeAreaDatum(574, -268, -768),
                    rangeAreaDatum(575, -250, -750),
                    rangeAreaDatum(576, -232, -732),
                    rangeAreaDatum(577, -213, -713),
                    rangeAreaDatum(578, -195, -695),
                    rangeAreaDatum(579, -176, -676),
                    rangeAreaDatum(580, -157, -657),
                    rangeAreaDatum(581, -138, -638),
                    rangeAreaDatum(582, -118, -618),
                    rangeAreaDatum(583, -99, -599),
                    rangeAreaDatum(584, -79, -579),
                    rangeAreaDatum(585, -59, -559),
                    rangeAreaDatum(586, -39, -539),
                    rangeAreaDatum(587, -19, -519),
                    rangeAreaDatum(588, 1, -499),
                    rangeAreaDatum(589, 22, -478),
                    rangeAreaDatum(590, 42, -458),
                    rangeAreaDatum(591, 63, -437),
                    rangeAreaDatum(592, 83, -417),
                    rangeAreaDatum(593, 104, -396),
                    rangeAreaDatum(594, 125, -375),
                    rangeAreaDatum(595, 145, -355),
                    rangeAreaDatum(596, 166, -334),
                    rangeAreaDatum(597, 187, -313),
                    rangeAreaDatum(598, 208, -292),
                    rangeAreaDatum(599, 229, -271),
                    rangeAreaDatum(600, 250, -250),
                    rangeAreaDatum(601, 271, -229),
                    rangeAreaDatum(602, 292, -208),
                    rangeAreaDatum(603, 313, -187),
                    rangeAreaDatum(604, 334, -166),
                    rangeAreaDatum(605, 355, -145),
                    rangeAreaDatum(606, 375, -125),
                    rangeAreaDatum(607, 396, -104),
                    rangeAreaDatum(608, 417, -83),
                    rangeAreaDatum(609, 437, -63),
                    rangeAreaDatum(610, 458, -42),
                    rangeAreaDatum(611, 478, -22),
                    rangeAreaDatum(612, 499, -1),
                    rangeAreaDatum(613, 519, 19),
                    rangeAreaDatum(614, 539, 39),
                    rangeAreaDatum(615, 559, 59),
                    rangeAreaDatum(616, 579, 79),
                    rangeAreaDatum(617, 599, 99),
                    rangeAreaDatum(618, 618, 118),
                    rangeAreaDatum(619, 638, 138),
                    rangeAreaDatum(620, 657, 157),
                    rangeAreaDatum(621, 676, 176),
                    rangeAreaDatum(622, 695, 195),
                    rangeAreaDatum(623, 713, 213),
                    rangeAreaDatum(624, 732, 232),
                    rangeAreaDatum(625, 750, 250),
                    rangeAreaDatum(626, 768, 268),
                    rangeAreaDatum(627, 786, 286),
                    rangeAreaDatum(628, 803, 303),
                    rangeAreaDatum(629, 821, 321),
                    rangeAreaDatum(630, 838, 338),
                    rangeAreaDatum(631, 855, 355),
                    rangeAreaDatum(632, 871, 371),
                    rangeAreaDatum(633, 887, 387),
                    rangeAreaDatum(634, 903, 403),
                    rangeAreaDatum(635, 919, 419),
                    rangeAreaDatum(636, 935, 435),
                    rangeAreaDatum(637, 950, 450),
                    rangeAreaDatum(638, 964, 464),
                    rangeAreaDatum(639, 979, 479),
                    rangeAreaDatum(640, 993, 493),
                    rangeAreaDatum(641, 1007, 507),
                    rangeAreaDatum(642, 1021, 521),
                    rangeAreaDatum(643, 1034, 534),
                    rangeAreaDatum(644, 1047, 547),
                    rangeAreaDatum(645, 1059, 559),
                    rangeAreaDatum(646, 1071, 571),
                    rangeAreaDatum(647, 1083, 583),
                    rangeAreaDatum(648, 1094, 594),
                    rangeAreaDatum(649, 1105, 605),
                    rangeAreaDatum(650, 1116, 616),
                    rangeAreaDatum(651, 1126, 626),
                    rangeAreaDatum(652, 1136, 636),
                    rangeAreaDatum(653, 1146, 646),
                    rangeAreaDatum(654, 1155, 655),
                    rangeAreaDatum(655, 1164, 664),
                    rangeAreaDatum(656, 1172, 672),
                    rangeAreaDatum(657, 1180, 680),
                    rangeAreaDatum(658, 1187, 687),
                    rangeAreaDatum(659, 1194, 694),
                    rangeAreaDatum(660, 1201, 701),
                    rangeAreaDatum(661, 1207, 707),
                    rangeAreaDatum(662, 1213, 713),
                    rangeAreaDatum(663, 1219, 719),
                    rangeAreaDatum(664, 1224, 724),
                    rangeAreaDatum(665, 1228, 728),
                    rangeAreaDatum(666, 1232, 732),
                    rangeAreaDatum(667, 1236, 736),
                    rangeAreaDatum(668, 1239, 739),
                    rangeAreaDatum(669, 1242, 742),
                    rangeAreaDatum(670, 1245, 745),
                    rangeAreaDatum(671, 1246, 746),
                    rangeAreaDatum(672, 1248, 748),
                    rangeAreaDatum(673, 1249, 749),
                    rangeAreaDatum(674, 1250, 750),
                    rangeAreaDatum(675, 1250, 750),
                    rangeAreaDatum(676, 1250, 750),
                    rangeAreaDatum(677, 1249, 749),
                    rangeAreaDatum(678, 1248, 748),
                    rangeAreaDatum(679, 1246, 746),
                    rangeAreaDatum(680, 1245, 745),
                    rangeAreaDatum(681, 1242, 742),
                    rangeAreaDatum(682, 1239, 739),
                    rangeAreaDatum(683, 1236, 736),
                    rangeAreaDatum(684, 1232, 732),
                    rangeAreaDatum(685, 1228, 728),
                    rangeAreaDatum(686, 1224, 724),
                    rangeAreaDatum(687, 1219, 719),
                    rangeAreaDatum(688, 1213, 713),
                    rangeAreaDatum(689, 1207, 707),
                    rangeAreaDatum(690, 1201, 701),
                    rangeAreaDatum(691, 1194, 694),
                    rangeAreaDatum(692, 1187, 687),
                    rangeAreaDatum(693, 1180, 680),
                    rangeAreaDatum(694, 1172, 672),
                    rangeAreaDatum(695, 1164, 664),
                    rangeAreaDatum(696, 1155, 655),
                    rangeAreaDatum(697, 1146, 646),
                    rangeAreaDatum(698, 1136, 636),
                    rangeAreaDatum(699, 1126, 626),
                    rangeAreaDatum(700, 1116, 616),
                    rangeAreaDatum(701, 1105, 605),
                    rangeAreaDatum(702, 1094, 594),
                    rangeAreaDatum(703, 1083, 583),
                    rangeAreaDatum(704, 1071, 571),
                    rangeAreaDatum(705, 1059, 559),
                    rangeAreaDatum(706, 1047, 547),
                    rangeAreaDatum(707, 1034, 534),
                    rangeAreaDatum(708, 1021, 521),
                    rangeAreaDatum(709, 1007, 507),
                    rangeAreaDatum(710, 993, 493),
                    rangeAreaDatum(711, 979, 479),
                    rangeAreaDatum(712, 964, 464),
                    rangeAreaDatum(713, 950, 450),
                    rangeAreaDatum(714, 935, 435),
                    rangeAreaDatum(715, 919, 419),
                    rangeAreaDatum(716, 903, 403),
                    rangeAreaDatum(717, 887, 387),
                    rangeAreaDatum(718, 871, 371),
                    rangeAreaDatum(719, 855, 355),
                    rangeAreaDatum(720, 838, 338),
                    rangeAreaDatum(721, 821, 321),
                    rangeAreaDatum(722, 803, 303),
                    rangeAreaDatum(723, 786, 286),
                    rangeAreaDatum(724, 768, 268),
                    rangeAreaDatum(725, 750, 250),
                    rangeAreaDatum(726, 732, 232),
                    rangeAreaDatum(727, 713, 213),
                    rangeAreaDatum(728, 695, 195),
                    rangeAreaDatum(729, 676, 176),
                    rangeAreaDatum(730, 657, 157),
                    rangeAreaDatum(731, 638, 138),
                    rangeAreaDatum(732, 618, 118),
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

        // radar-line and radar-area share a base class and the hideWithSize0 mechanism,
        // so a single chart with one of each covers both.
        describe('radars', () => {
            describe('hideWithSize0', () => {
                type D = RadarDatum;
                type C = unknown;
                type I = AgSelectionItem<D>;
                let selectionChange: SelectionChangeRecorder<D, C>;

                const DRAG_FROM: CanvasPoint = { canvasX: 300, canvasY: 200 };
                const DRAG_TO: CanvasPoint = { canvasX: 500, canvasY: 400 };

                const radarLineDatum = (itemId: number, datum: D): I => {
                    return { datum, itemId, seriesId: 'radarlineid' };
                };
                const radarAreaDatum = (itemId: number, datum: D): I => {
                    return { datum, itemId, seriesId: 'radarareaid' };
                };

                const SELECTION: I[] = [
                    radarLineDatum(2, { areaValue: 8, axis: 'C', lineValue: 4 }),
                    radarLineDatum(5, { areaValue: 7, axis: 'F', lineValue: 3 }),
                    radarAreaDatum(0, { areaValue: 3, axis: 'A', lineValue: 5 }),
                    radarAreaDatum(3, { areaValue: 5, axis: 'D', lineValue: 8 }),
                    radarAreaDatum(4, { areaValue: 4, axis: 'E', lineValue: 6 }),
                    radarAreaDatum(6, { areaValue: 2, axis: 'G', lineValue: 9 }),
                ];

                const SELECTIONCHANGE: AgSelectionChangeEvent<D, C>[] = [
                    uiChangeEvent<D, C>({ added: SELECTION, removed: [] }),
                ];

                beforeEach(async () => {
                    const { data, series, legend } = createRadarOptions();
                    selectionChange = createSelectionChangeRecorder();
                    chart = await createChartInstance({
                        data,
                        series,
                        legend,
                        selection: {
                            containment: 'any',
                            enabled: true,
                            enableDrag: true,
                            enableClick: false,
                        },
                        axes: { radius: { gridLine: { enabled: false } } },
                        navigator: { enabled: false },
                        scrollbar: { enabled: false },
                        zoom: { enabled: false },
                        listeners: { selectionChange },
                    });
                });
                describe('initial', () => {
                    // Both radar paths are drawn, but every marker is hidden (size 0):
                    // hideWithSize0 is active and no datum is selected yet.
                    test('screenshot', async () => {
                        await compareExact('drag-modifiers-radars-hidewithsize0-initial');
                    });
                    test('getSelection', () => {
                        expect(getChartSelectionArray()).toEqual([]);
                    });
                    test('selectionChange', () => {
                        expect(selectionChange.popEvents()).toEqual([]);
                    });
                });
                // Selection dragging on radars is disabled for this release:
                describe.skip('mousedown and mousemove', () => {
                    beforeEach(async () => {
                        await mouseDown(DRAG_FROM);
                        await mouseMove(DRAG_TO);
                    });
                    // Markers under the drag box render as selection candidates even though
                    // hideWithSize0 hides every other marker. Nothing is committed yet.
                    test('screenshot', async () => {
                        // Add some leniency, the radar-line stroke opacity blending renders slightly different colours
                        // locally and on CI.
                        await compareLenient('drag-modifiers-radars-hidewithsize0-candidacy', 0.0038);
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
                            // Add some leniency, the radar-line stroke opacity blending renders slightly different
                            // colours locally and on CI.
                            await compareLenient('drag-modifiers-radars-hidewithsize0-selected', 0.0495);
                        });
                        test('getSelection', () => {
                            expect(getChartSelectionArray()).toEqual(SELECTION);
                        });
                        test('selectionChange', () => {
                            expect(selectionChange.popEvents()).toEqual(SELECTIONCHANGE);
                        });

                        describe('hide radar area', () => {
                            beforeEach(async () => {
                                // Pop and ignore events from mouseup
                                selectionChange.popEvents();

                                const { version } = chart.getState();
                                await chart.setState({
                                    version,
                                    legend: [
                                        { seriesId: 'radarlineid', itemId: 'lineValue', visible: true },
                                        { seriesId: 'radarareaid', itemId: 'areaValue', visible: false },
                                    ],
                                });
                                await waitForChartStability(chart);
                            });
                            test('screenshot', async () => {
                                await compareExact('drag-modifiers-radars-hidewithsize0-area-hidden');
                            });
                            test('getSelection', () => {
                                expect(getChartSelectionArray()).toEqual(SELECTION);
                            });
                            test('selectionChange', () => {
                                expect(selectionChange.popEvents()).toEqual([]);
                            });
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

    describe('setState', () => {
        // Group selection is currently unsupported; revisit this test once we start implementing it.
        describe.skip('treemap - group selection enabled', () => {
            type D = DiskDatum;
            type C = unknown;
            let selectionChange: SelectionChangeRecorder<D, C>;
            let state: AgSelectionItemIds[] | undefined = undefined;

            const { data, series, theme, legend, title } = createDiskUsageOptions('treemap');

            const ITEMS: AgSelectionItem<D>[] = [
                { seriesId: 'TreemapSeries-1', itemId: 13, datum: findName(data, 'movie.mp4') },
                { seriesId: 'TreemapSeries-1', itemId: 15, datum: findName(data, 'mnt/') },
                { seriesId: 'TreemapSeries-1', itemId: 22, datum: findName(data, 'vid2.mp4') },
            ];
            const UI_ADDED_EVENTS = [
                uiChangeEvent<D, C>({ added: [ITEMS[0]], removed: [] }),
                uiChangeEvent<D, C>({ added: [ITEMS[2]], removed: [] }),
                uiChangeEvent<D, C>({ added: [ITEMS[1]], removed: [] }),
            ];
            const API_ADDED = apiChangeEvent<D, C>({ added: ITEMS, removed: [] });
            const API_REMOVED = apiChangeEvent<D, C>({ added: [], removed: ITEMS });

            describe('save/restore 3 points', () => {
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

                    await mouseClick({ canvasX: 160, canvasY: 258 }); // "movie.mp4"
                    await mouseClick({ canvasX: 496, canvasY: 223 }, { ctrlKey }); // "vid2.mp4"
                    await mouseClick({ canvasX: 605, canvasY: 96 }, { ctrlKey }); // "mnt/"
                    await mouseMove({ canvasX: 20, canvasY: 20 }); // miss
                });
                test('screenshot', async () => {
                    await compareExact('diskusage-treemap-highlighted-none-selected-movie-mnt-vid2');
                });
                test('getSelection', () => {
                    expect(getChartSelectionArray()).toEqual(ITEMS);
                });
                test('selectionChange', () => {
                    expect(selectionChange.popEvents()).toEqual(UI_ADDED_EVENTS);
                });
                describe('save and clear', () => {
                    beforeEach(async () => {
                        selectionChange.popEvents(); // pop event of initial selection.
                        state = getChartSelectionArray();
                        await clearChartSelection();
                    });
                    afterEach(() => {
                        state = undefined;
                    });
                    // FIXME: mouseMove(20,20) ("miss") does not correctly unhighlight the chart. This only
                    // happens in node.js, browser-base implementation render the unhighlighted chart correctly.
                    test.skip('screenshot', async () => {
                        await compareExact('diskusage-treemap-highlighted-none-selected-none');
                    });
                    test('getSelection', () => {
                        expect(getChartSelectionArray()).toEqual([]);
                    });
                    test('selectionChange', () => {
                        expect(selectionChange.popEvents()).toEqual([API_REMOVED]);
                    });
                    describe('restore', () => {
                        beforeEach(async () => {
                            selectionChange.popEvents(); // pop event of clearSelection.
                            expect(state).toBeDefined();
                            await setChartSelectionArray(state!);
                        });
                        test('screenshot', async () => {
                            await compareExact('diskusage-treemap-highlighted-none-selected-movie-mnt-vid2');
                        });
                        test('getSelection', () => {
                            expect(getChartSelectionArray()).toEqual(ITEMS);
                        });
                        test('selectionChange', () => {
                            expect(selectionChange.popEvents()).toEqual([API_ADDED]);
                        });
                    });
                });
            });
        });

        describe('treemap - group selection disabled, highlight disabled', () => {
            type D = DiskDatum;
            type C = unknown;
            let selectionChange: SelectionChangeRecorder<D, C>;
            let state: AgSelectionItemIds[] | undefined = undefined;

            const { data, series, theme, legend, title } = createDiskUsageOptions('treemap');

            const ITEMS: AgSelectionItem<D>[] = [
                { seriesId: 'TreemapSeries-1', itemId: 13, datum: findName(data, 'movie.mp4') },
                { seriesId: 'TreemapSeries-1', itemId: 22, datum: findName(data, 'vid2.mp4') },
            ];
            const UI_ADDED_EVENTS = [
                uiChangeEvent<D, C>({ added: [ITEMS[0]], removed: [] }),
                uiChangeEvent<D, C>({ added: [ITEMS[1]], removed: [] }),
            ];
            const API_ADDED = apiChangeEvent<D, C>({ added: ITEMS, removed: [] });
            const API_REMOVED = apiChangeEvent<D, C>({ added: [], removed: ITEMS });

            describe('save/restore 3 points', () => {
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
                        highlight: {
                            enabled: false,
                        },
                        listeners: { selectionChange },
                    });

                    await mouseClick({ canvasX: 160, canvasY: 258 }); // "movie.mp4"
                    await mouseClick({ canvasX: 496, canvasY: 223 }, { ctrlKey }); // "vid2.mp4"
                    await mouseClick({ canvasX: 605, canvasY: 96 }, { ctrlKey }); // "mnt/"
                });
                test('screenshot', async () => {
                    await compareExact('diskusage-treemap-highlighted-none-selected-movie-vid2');
                });
                test('getSelection', () => {
                    expect(getChartSelectionArray()).toEqual(ITEMS);
                });
                test('selectionChange', () => {
                    expect(selectionChange.popEvents()).toEqual(UI_ADDED_EVENTS);
                });
                describe('save and clear', () => {
                    beforeEach(async () => {
                        selectionChange.popEvents(); // pop event of initial selection.
                        state = getChartSelectionArray();
                        await clearChartSelection();
                    });
                    afterEach(() => {
                        state = undefined;
                    });
                    test('screenshot', async () => {
                        await compareExact('diskusage-treemap-highlighted-none-selected-none');
                    });
                    test('getSelection', () => {
                        expect(getChartSelectionArray()).toEqual([]);
                    });
                    test('selectionChange', () => {
                        expect(selectionChange.popEvents()).toEqual([API_REMOVED]);
                    });
                    describe('restore', () => {
                        beforeEach(async () => {
                            selectionChange.popEvents(); // pop event of clearSelection.
                            expect(state).toBeDefined();
                            await setChartSelectionArray(state!);
                        });
                        test('screenshot', async () => {
                            await compareExact('diskusage-treemap-highlighted-none-selected-movie-vid2');
                        });
                        test('getSelection', () => {
                            expect(getChartSelectionArray()).toEqual(ITEMS);
                        });
                        test('selectionChange', () => {
                            expect(selectionChange.popEvents()).toEqual([API_ADDED]);
                        });
                    });
                });
            });
        });
    });

    describe('datum removal', () => {
        // Removing every selected datum must reset the selection count to 0. If it
        // stays stale (the bug), unselected datums keep rendering with the dimmed
        // "other item" styling instead of returning to normal — caught by the
        // "removal all" screenshots below, which would otherwise be identical.
        describe('line', () => {
            type D = AccountingDatumWithId;
            type C = unknown;
            let selectionChange: SelectionChangeRecorder<D, C>;

            const baseOptions = createLineAccountingOptionsWithIds();
            const allData = baseOptions.data!;

            // dataIdKey is 'id', so each `itemId` is the datum's string id.
            // s1id (assets) selects r2022 & r2023; s2id (liabilities) selects r2021 & r2023.
            // r2023 is selected by both series, r2022 by s1id only, r2021 by s2id only.
            const SELECTION: AgSelectionItem<D>[] = [
                { seriesId: 's1id', itemId: 'r2022', datum: allData[4] },
                { seriesId: 's1id', itemId: 'r2023', datum: allData[5] },
                { seriesId: 's2id', itemId: 'r2021', datum: allData[3] },
                { seriesId: 's2id', itemId: 'r2023', datum: allData[5] },
            ];
            const SELECTION_IDS: AgSelectionItemIds[] = SELECTION.map(({ seriesId, itemId }) => ({ seriesId, itemId }));
            const API_ADDED = apiChangeEvent<D, C>({ added: SELECTION, removed: [] });

            // Remove every selected year. The remaining years (r2018, r2019, r2020)
            // are unselected, so the selection becomes empty.
            const REMOVED_IDS = ['r2021', 'r2022', 'r2023'];
            const remainingData = allData.filter((d) => !REMOVED_IDS.includes(d.id));

            beforeEach(async () => {
                selectionChange = createSelectionChangeRecorder<D, C>();
                chart = await createChartInstance({
                    ...baseOptions,
                    selection: { enabled: true },
                    listeners: { selectionChange },
                });
                await setChartSelectionArray(SELECTION_IDS);
            });

            describe('initial', () => {
                test('screenshot', async () => {
                    await compareExact('line-datum-removal-initial');
                });
                test('getSelection', () => {
                    expect(getChartSelectionArray()).toEqual(SELECTION);
                });
                test('selectionChange', () => {
                    expect(selectionChange.popEvents()).toEqual([API_ADDED]);
                });
            });

            describe('removal all - update', () => {
                beforeEach(async () => {
                    selectionChange.popEvents(); // discard the initial setSelection event
                    await chart.update(
                        prepareEnterpriseTestOptions({
                            ...baseOptions,
                            data: remainingData,
                            selection: { enabled: true },
                            listeners: { selectionChange },
                        })
                    );
                    await waitForChartStability(chart);
                });
                test('screenshot', async () => {
                    await compareExact('line-datum-removal-empty');
                });
                test('getSelection', () => {
                    expect(getChartSelectionArray()).toEqual([]);
                });
                test('selectionChange', () => {
                    expect(selectionChange.popEvents()).toEqual([]);
                });
            });

            describe('removal all - applyTransaction', () => {
                beforeEach(async () => {
                    selectionChange.popEvents(); // discard the initial setSelection event
                    await chart.applyTransaction({ remove: REMOVED_IDS.map((id) => ({ id })) });
                    await waitForChartStability(chart);
                });
                test('screenshot', async () => {
                    await compareExact('line-datum-removal-empty');
                });
                test('getSelection', () => {
                    expect(getChartSelectionArray()).toEqual([]);
                });
                test('selectionChange', () => {
                    expect(selectionChange.popEvents()).toEqual([]);
                });
            });
        });
    });

    describe('series styling', () => {
        test('treemap tiles', async () => {
            const { data, series, theme, legend, title } = createDiskUsageOptions('treemap');
            chart = await createChartInstance({
                data,
                series: [
                    {
                        ...(series as any[])[0],
                        type: 'treemap',
                        tile: {
                            selection: {
                                selectedItem: {
                                    stroke: 'black',
                                    strokeWidth: 5,
                                    opacity: 1,
                                    fill: 'cyan',
                                },
                                unselectedItem: {
                                    opacity: 0.3,
                                    stroke: 'grey',
                                    strokeWidth: 1,
                                    fill: 'teal',
                                },
                            },
                        },
                    },
                ],
                theme,
                legend,
                title,
                selection: {
                    enabled: true,
                    clickMode: 'single',
                },
            });
            await mouseClick({ canvasX: 160, canvasY: 258 }); // "movie.mp4"
            await mouseClick({ canvasX: 496, canvasY: 223 }, { ctrlKey }); // "vid2.mp4"
            await compareExact('diskusage-treemap-styling');
        });
    });

    describe('AG-17570 series-level selection.enabled option overrides chart-level selection.enabled option', () => {
        describe('bar', () => {
            type D = AccountingDatumWithId;
            type C = unknown;
            let selectionChange: SelectionChangeRecorder<D, C>;
            let opts: AgChartOptions<D, C>;
            const data: D[] = [
                { id: 'r2018', year: '2018', assets: 100, liabilities: -70, cash: 30 },
                { id: 'r2019', year: '2019', assets: 120, liabilities: -80, cash: 40 },
                { id: 'r2020', year: '2020', assets: 150, liabilities: -90, cash: 60 },
            ];

            const SELECTION: AgSelectionItem<D> = { datum: data[1], seriesId: 's2id', itemId: 'r2019' };
            const ADDED_EVENT = apiChangeEvent<D, C>({ added: [SELECTION], removed: [] });

            beforeEach(async () => {
                selectionChange = createSelectionChangeRecorder<D, C>();
                opts = prepareEnterpriseTestOptions({
                    data,
                    dataIdKey: 'id',
                    selection: {
                        enabled: false,
                    },
                    series: [
                        {
                            id: 's1id',
                            type: 'line',
                            xKey: 'year',
                            yKey: 'assets',
                            selection: { enabled: false },
                        },
                        {
                            id: 's2id',
                            type: 'line',
                            xKey: 'year',
                            yKey: 'liabilities',
                            selection: { enabled: true },
                        },
                        {
                            id: 's3id',
                            type: 'line',
                            xKey: 'year',
                            yKey: 'cash',
                            selection: { enabled: false },
                        },
                    ],
                    listeners: { selectionChange },
                });
                chart = await createChartInstance(opts);
                await setChartSelectionArray([SELECTION]);
            });
            describe('initial', () => {
                test('getSelection', () => {
                    expect(getChartSelectionArray()).toEqual([SELECTION]);
                });
                test('selectionChange', () => {
                    expect(selectionChange.popEvents()).toEqual([ADDED_EVENT]);
                });
            });
            describe('update - disable', () => {
                beforeEach(async () => {
                    selectionChange.popEvents(); // pop & ignore initial event.
                    (opts.series![1] as any).selection.enabled = false;
                    await chart.update(opts);
                    await waitForChartStability(chart);
                });
                test('getSelection', () => {
                    expect(getChartSelectionArray()).toEqual([]);
                });
                test('selectionChange', () => {
                    expect(selectionChange.popEvents()).toEqual([]);
                });
                describe('update - enable', () => {
                    beforeEach(async () => {
                        (opts.series![1] as any).selection.enabled = true;
                        await chart.update(opts);
                        await waitForChartStability(chart);
                    });
                    test('getSelection', () => {
                        expect(getChartSelectionArray()).toEqual([SELECTION]);
                    });
                    test('selectionChange', () => {
                        expect(selectionChange.popEvents()).toEqual([]);
                    });
                });
            });
            describe('updateDelta - disable', () => {
                function deltaOptionsWith(s2opts: { selection: { enabled: boolean } }): AgCartesianChartOptions<D, C> {
                    return {
                        series: [
                            { id: 's1id', type: 'line' as const, xKey: 'year', yKey: 'assets' },
                            { id: 's2id', type: 'line' as const, xKey: 'year', yKey: 'liabilities', ...s2opts },
                            { id: 's3id', type: 'line' as const, xKey: 'year', yKey: 'cash' },
                        ],
                    };
                }
                beforeEach(async () => {
                    selectionChange.popEvents(); // pop & ignore initial event.
                    await chart.updateDelta(deltaOptionsWith({ selection: { enabled: false } }));
                    await waitForChartStability(chart);
                });
                test('getSelection', () => {
                    expect(getChartSelectionArray()).toEqual([]);
                });
                test('selectionChange', () => {
                    expect(selectionChange.popEvents()).toEqual([]);
                });
                describe('updateDelta - enable', () => {
                    beforeEach(async () => {
                        await chart.updateDelta(deltaOptionsWith({ selection: { enabled: true } }));
                        await waitForChartStability(chart);
                    });
                    test('getSelection', () => {
                        expect(getChartSelectionArray()).toEqual([SELECTION]);
                    });
                    test('selectionChange', () => {
                        expect(selectionChange.popEvents()).toEqual([]);
                    });
                });
            });
        });
    });

    describe('drag rect clamping', () => {
        it('should clamp the in-progress drag rect to the series area', async () => {
            const { data, series } = createBubbleBioStatOptions();
            chart = await createChartInstance({
                data,
                series,
                selection: { containment: 'any', enabled: true, enableDrag: true, enableClick: false },
                axes: {
                    x: { crosshair: { enabled: false }, gridLine: { enabled: false } },
                    y: { crosshair: { enabled: false }, gridLine: { enabled: false } },
                },
                navigator: { enabled: false },
                scrollbar: { enabled: false },
                zoom: { enabled: false },
            });

            const chartInternals = deproxy(chart) as any;
            const seriesRect = chartInternals.seriesAreaManager?.seriesRect;
            expect(seriesRect).toBeDefined();
            const selectionModule = chartInternals.modulesManager.getModule('selection');
            expect(selectionModule).toBeDefined();

            // The move target must stay within the canvas for the event to reach the chart, so drag
            // into the axis/padding band beyond the series area rather than off-canvas.
            const start = { canvasX: Math.ceil(seriesRect.x) + 5, canvasY: Math.ceil(seriesRect.y) + 5 };
            const beyond = {
                canvasX: Math.floor(seriesRect.x + seriesRect.width) + 20,
                canvasY: Math.floor(seriesRect.y + seriesRect.height) + 20,
            };

            await mouseDown(start);
            await mouseMove(beyond);

            // Read mid-drag: only drag-move clips to the series area, so an assertion made after
            // drag-end would hold whether or not the clamp is applied.
            const { dragRect } = selectionModule;
            expect(dragRect.x).toBe(start.canvasX);
            expect(dragRect.y).toBe(start.canvasY);
            expect(dragRect.x + dragRect.width).toBeCloseTo(seriesRect.x + seriesRect.width, 6);
            expect(dragRect.y + dragRect.height).toBeCloseTo(seriesRect.y + seriesRect.height, 6);

            await mouseUp(beyond);
        });
    });
});
