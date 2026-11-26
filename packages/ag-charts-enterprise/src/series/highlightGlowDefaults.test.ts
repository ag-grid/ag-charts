import { afterEach, describe, expect, it } from 'vitest';

import type { AgChartInstance, AgChartOptions } from 'ag-charts-community';
import { _ModuleSupport } from 'ag-charts-community';
import {
    RENDER_OPTIONS,
    canvasImage,
    chartPixelAt,
    compareImageSnapshot,
    countChartPixels,
    deproxy,
    differingBytes,
    expectSamePixels,
    expectWarningMessages,
    getSeriesAt,
    getSeriesNodeData,
    hoverAction,
    hoverDatum,
    hoverNode,
    prepareProcessedOptions,
    pressKey,
    setupMockCanvas,
    setupMockConsole,
    shapesOf,
    tabIntoChart,
    waitForChartStability,
} from 'ag-charts-community-test';
import { HOVER_GLOW_PART_DEFAULTS, Transformable } from 'ag-charts-core';

import { setupEnterpriseModules } from '../setup';
import { getFlowLinkData, getFlowNodeData, getOrganizationCards } from '../test/enterpriseSeriesAccessors';
import { RANGE, nodeNamed } from '../test/glowSeriesCases';
import {
    FLOW_DATA,
    HIERARCHY_SHADOW_DATA,
    OHLC_DATA,
    WATERFALL_DATA,
    collectShapes,
    createEnterpriseChart,
    itemNodes,
    prepareEnterpriseTestOptions,
} from '../test/utils';
import { ukData } from './map-test/ukData';
import { ukRoadData } from './map-test/ukRoadData';
import ukRoadTopology from './map-test/ukRoadTopology.json';
import ukTopology from './map-test/ukTopology.json';

setupEnterpriseModules();

/**
 * The Defaults sheet of the Series Highlight and Glow Defaults workbook, one row per sheet row. A key that is left out
 * is a blank cell: nothing sets it. Opacities are `unhighlightedItem` (`item`), `unhighlightedSeries` (`series`, the
 * `unhighlightedBranch` on the hierarchy tiles), `selectedItem`, `unselectedItem` and `unselectedSeries`.
 */
interface SheetRow {
    series: string;
    options: object;
    /** Where the highlight options live; the treemap keeps them on its groups and tiles. */
    highlight?: string;
    /** Every path the sheet's glow numbers apply to. */
    glow?: string[];
    highlightedItemGlow?: true;
    highlightedItemStroke?: { stroke: string; strokeWidth: number };
    dimItem?: number;
    dimSeries?: number;
    bringToFront?: boolean;
    neutral?: true;
    glowNumbers?: { fillOpacity: number; blur: number; spread: number; gap: number };
    /** Where the selection options live, or `false` where the sheet leaves them to the series' undocumented theme. */
    selection?: string | false;
    selected?: { strokeWidth: number; opacity: number };
    unselectedItem?: number;
    unselectedSeries?: number;
}

const COMMON = { fillOpacity: 0.6, blur: 1, spread: 2, gap: 1 };
const FINANCIAL = { fillOpacity: 0.5, blur: 1, spread: 2, gap: 0 };
const NEUTRAL = { fillOpacity: 1, blur: 0, spread: 1, gap: 0 };
const SELECTED = { strokeWidth: 2, opacity: 1 };

const MARKER_GLOW = ['marker.glow'];
const hlcGlow = (parts: string[]) => [...MARKER_GLOW, ...parts.map((part) => `item.${part}.marker.glow`)];
const SHEET_TREEMAP = { labelKey: 'category', sizeKey: 'size' };

const SHEET: SheetRow[] = [
    {
        series: 'bar',
        options: { xKey: 'category', yKey: 'value' },
        highlightedItemGlow: true,
        dimItem: 1,
        dimSeries: 0.5,
        bringToFront: true,
        glow: ['glow'],
        glowNumbers: COMMON,
        selected: SELECTED,
        unselectedItem: 0.5,
        unselectedSeries: 0.5,
    },
    {
        series: 'histogram',
        options: { xKey: 'value' },
        highlightedItemGlow: true,
        dimItem: 1,
        dimSeries: 0.5,
        bringToFront: true,
        glow: ['glow'],
        glowNumbers: COMMON,
    },
    {
        series: 'range-bar',
        options: { xKey: 'category', yLowKey: 'low', yHighKey: 'high' },
        highlightedItemGlow: true,
        dimItem: 1,
        dimSeries: 0.5,
        bringToFront: true,
        glow: ['glow'],
        glowNumbers: COMMON,
        selected: SELECTED,
        unselectedItem: 0.5,
        unselectedSeries: 0.5,
    },
    {
        series: 'waterfall',
        options: { xKey: 'category', yKey: 'value' },
        highlightedItemGlow: true,
        dimItem: 1,
        glow: ['positive', 'negative', 'total'].map((part) => `item.${part}.glow`),
        glowNumbers: COMMON,
    },
    {
        series: 'box-plot',
        options: {
            xKey: 'category',
            minKey: 'low',
            q1Key: 'open',
            medianKey: 'value',
            q3Key: 'close',
            maxKey: 'high',
        },
        highlightedItemGlow: true,
        dimItem: 1,
        dimSeries: 0.5,
        bringToFront: true,
        glow: ['glow'],
        glowNumbers: { ...COMMON, fillOpacity: 1 },
        selected: SELECTED,
        unselectedItem: 0.5,
        unselectedSeries: 0.5,
    },
    ...['candlestick', 'ohlc'].map((series): SheetRow => ({
        series,
        options: { xKey: 'category', openKey: 'open', highKey: 'high', lowKey: 'low', closeKey: 'close' },
        highlightedItemGlow: true,
        dimItem: 1,
        dimSeries: 0.3,
        bringToFront: true,
        glow: ['glow'],
        glowNumbers: FINANCIAL,
        selected: SELECTED,
        unselectedItem: 0.3,
        unselectedSeries: 0.3,
    })),
    {
        series: 'hlc',
        options: { xKey: 'category', highKey: 'high', lowKey: 'low', closeKey: 'close' },
        highlightedItemGlow: true,
        dimItem: 1,
        dimSeries: 0.3,
        bringToFront: true,
        glow: hlcGlow(['high', 'low', 'close']),
        glowNumbers: COMMON,
        selected: SELECTED,
        unselectedItem: 0.3,
        unselectedSeries: 0.3,
    },
    ...['line', 'area'].map((series): SheetRow => ({
        series,
        options: { xKey: 'category', yKey: 'value' },
        highlightedItemGlow: true,
        dimItem: 1,
        dimSeries: 0.3,
        bringToFront: true,
        glow: MARKER_GLOW,
        glowNumbers: COMMON,
        selected: SELECTED,
        unselectedItem: 0.3,
        unselectedSeries: 0.3,
    })),
    ...['scatter', 'bubble'].map((series): SheetRow => ({
        series,
        options: { xKey: 'size', yKey: 'value', ...(series === 'bubble' ? { sizeKey: 'low' } : {}) },
        highlightedItemGlow: true,
        dimItem: 1,
        dimSeries: 0.3,
        bringToFront: true,
        glow: ['glow'],
        glowNumbers: COMMON,
        selected: SELECTED,
        unselectedItem: 0.3,
        unselectedSeries: 0.3,
    })),
    {
        series: 'range-area',
        options: { xKey: 'category', yLowKey: 'low', yHighKey: 'high' },
        highlightedItemGlow: true,
        dimItem: 1,
        dimSeries: 0.3,
        bringToFront: true,
        glow: hlcGlow(['low', 'high']),
        glowNumbers: COMMON,
        selected: SELECTED,
        unselectedItem: 0.3,
        unselectedSeries: 0.3,
    },
    {
        series: 'heatmap',
        options: { xKey: 'category', yKey: 'value', colorKey: 'numeric' },
        highlightedItemGlow: true,
        dimItem: 1,
        glow: ['glow'],
        neutral: true,
        glowNumbers: NEUTRAL,
        selected: SELECTED,
        unselectedItem: 0.5,
        unselectedSeries: 0.5,
    },
    ...['funnel', 'pyramid'].map((series): SheetRow => ({
        series,
        options: { stageKey: 'category', valueKey: 'value' },
        highlightedItemGlow: true,
        dimItem: 1,
        glow: ['glow'],
        glowNumbers: COMMON,
    })),
    { series: 'cone-funnel', options: { stageKey: 'category', valueKey: 'value' }, dimItem: 1 },
    ...['pie', 'donut'].map((series): SheetRow => ({
        series,
        options: { angleKey: 'value' },
        highlightedItemGlow: true,
        dimItem: 0.5,
        dimSeries: 0.5,
        bringToFront: true,
        glow: ['glow'],
        glowNumbers: COMMON,
        selected: SELECTED,
        unselectedItem: 0.5,
        unselectedSeries: 0.5,
    })),
    {
        series: 'nightingale',
        options: { angleKey: 'category', radiusKey: 'value' },
        highlightedItemGlow: true,
        dimItem: 1,
        dimSeries: 0.5,
        bringToFront: false,
        glow: ['glow'],
        neutral: true,
        glowNumbers: NEUTRAL,
        selected: SELECTED,
        unselectedItem: 0.5,
        unselectedSeries: 0.5,
    },
    {
        series: 'radial-bar',
        options: { angleKey: 'value', radiusKey: 'category' },
        highlightedItemGlow: true,
        dimItem: 1,
        dimSeries: 0.5,
        bringToFront: true,
        glow: ['glow'],
        glowNumbers: COMMON,
        selected: SELECTED,
        unselectedItem: 0.5,
        unselectedSeries: 0.5,
    },
    {
        series: 'radial-column',
        options: { angleKey: 'category', radiusKey: 'value' },
        highlightedItemGlow: true,
        dimItem: 1,
        dimSeries: 0.5,
        bringToFront: true,
        glow: ['glow'],
        glowNumbers: COMMON,
        selected: SELECTED,
        unselectedItem: 0.5,
        unselectedSeries: 0.5,
    },
    ...['radar-line', 'radar-area'].map((series): SheetRow => ({
        series,
        options: { angleKey: 'category', radiusKey: 'value' },
        highlightedItemGlow: true,
        dimItem: 1,
        dimSeries: 0.3,
        bringToFront: true,
        glow: MARKER_GLOW,
        glowNumbers: COMMON,
        selected: SELECTED,
        unselectedItem: 0.3,
        unselectedSeries: 0.3,
    })),
    {
        series: 'sunburst',
        options: SHEET_TREEMAP,
        highlightedItemGlow: true,
        dimSeries: 0.5,
        glow: ['glow'],
        neutral: true,
        glowNumbers: NEUTRAL,
        selected: SELECTED,
        unselectedItem: 0.5,
        unselectedSeries: 0.5,
    },
    {
        series: 'treemap group',
        options: SHEET_TREEMAP,
        highlight: 'group.highlight',
        highlightedItemGlow: true,
        glow: ['group.glow'],
        neutral: true,
        glowNumbers: COMMON,
        selection: false,
    },
    {
        series: 'treemap tile',
        options: SHEET_TREEMAP,
        highlight: 'tile.highlight',
        highlightedItemGlow: true,
        dimSeries: 0.5,
        glow: ['tile.glow'],
        neutral: true,
        glowNumbers: NEUTRAL,
        selection: 'tile.selection',
        selected: SELECTED,
        unselectedItem: 0.5,
        unselectedSeries: 0.5,
    },
    ...['sankey', 'chord'].map((series): SheetRow => ({
        series,
        options: { fromKey: 'from', toKey: 'to', sizeKey: 'size' },
        dimItem: 0.3,
        glow: ['node.glow', 'link.glow'],
        glowNumbers: COMMON,
        selection: false,
    })),
    {
        series: 'organization',
        options: { idKey: 'category', parentIdKey: 'low' },
        highlightedItemStroke: { stroke: '#2196f3', strokeWidth: 2 },
        selection: false,
    },
    {
        series: 'map-shape',
        options: { idKey: 'category' },
        highlightedItemGlow: true,
        dimSeries: 0.5,
        bringToFront: false,
        glow: ['glow'],
        neutral: true,
        glowNumbers: NEUTRAL,
        selected: SELECTED,
        unselectedItem: 0.5,
        unselectedSeries: 0.5,
    },
    {
        series: 'map-line',
        options: { idKey: 'category' },
        dimItem: 0.6,
        dimSeries: 0.2,
        selected: SELECTED,
        unselectedItem: 0.6,
        unselectedSeries: 0.2,
    },
    {
        series: 'map-marker',
        options: { idKey: 'category' },
        highlightedItemGlow: true,
        dimItem: 1,
        dimSeries: 0.3,
        bringToFront: true,
        glow: ['glow'],
        glowNumbers: COMMON,
        selected: SELECTED,
        unselectedItem: 0.3,
        unselectedSeries: 0.3,
    },
];

// `foregroundColor` mixed 60% onto `backgroundColor` of each theme: `#181d1f` on `#fff`, and `#fff` on `#192232`.
const NEUTRAL_FILL = { 'ag-default': '#747779', 'ag-default-dark': '#a3a7ad' };

const DATA = [{ category: 'A', value: 5, low: 2, high: 9, open: 3, close: 7, numeric: 1, size: 4 }];
const MAP_SERIES = new Set(['map-shape', 'map-line', 'map-marker']);

const valueAt = (root: unknown, path: string): any =>
    path === '' ? root : path.split('.').reduce<any>((value, key) => value?.[key], root);

const resolve = (theme: string, row: SheetRow) => {
    const type = row.series.split(' ')[0];
    const { processedOptions } = prepareProcessedOptions({
        theme,
        data: DATA,
        ...(MAP_SERIES.has(type) ? { topology: ukTopology } : {}),
        series: [{ type, ...row.options }],
    });
    return (processedOptions as any).series[0];
};

describe('highlight and glow defaults (Defaults sheet)', () => {
    describe.each(['ag-default', 'ag-default-dark'] as const)('%s theme', (theme) => {
        it.each(SHEET)('$series resolves to its sheet row', (row) => {
            const series = resolve(theme, row);
            const highlight = valueAt(series, row.highlight ?? 'highlight');
            const seriesBucket =
                row.series === 'sunburst' || row.series.startsWith('treemap')
                    ? 'unhighlightedBranch'
                    : 'unhighlightedSeries';

            // A series with a glow on several parts lists whether each part glows on hover, in place of one value.
            const partDefaults: Record<string, boolean> | undefined = highlight[HOVER_GLOW_PART_DEFAULTS];
            const hoverGlow =
                partDefaults == null
                    ? highlight.highlightedItem?.glow?.enabled === true
                    : Object.values(partDefaults).every(Boolean);
            expect(hoverGlow, 'highlightedItem.glow').toBe(row.highlightedItemGlow === true);
            expect(highlight.highlightedItem?.stroke, 'highlightedItem.stroke').toBe(row.highlightedItemStroke?.stroke);
            expect(highlight.highlightedItem?.strokeWidth, 'highlightedItem.strokeWidth').toBe(
                row.highlightedItemStroke?.strokeWidth
            );
            expect(highlight.unhighlightedItem?.opacity, 'unhighlightedItem.opacity').toBe(row.dimItem);
            expect(highlight[seriesBucket]?.opacity, `${seriesBucket}.opacity`).toBe(row.dimSeries);
            expect(highlight.bringToFront, 'bringToFront').toBe(row.bringToFront);
            // A blank glow cell draws nothing: the buckets other than the hovered item never turn a glow on.
            for (const bucket of ['unhighlightedItem', 'highlightedSeries', seriesBucket]) {
                expect(highlight[bucket]?.glow?.enabled ?? false, `${bucket}.glow`).toBe(false);
            }

            for (const path of row.glow ?? []) {
                const glow = valueAt(series, path);
                expect(glow, path).toMatchObject(row.glowNumbers!);
                expect(glow.fill, `${path}.fill`).toBe(row.neutral ? NEUTRAL_FILL[theme] : undefined);
            }

            if (row.selection !== false) {
                const selection = valueAt(series, row.selection ?? 'selection');
                expect(selection?.selectedItem?.strokeWidth, 'selectedItem.strokeWidth').toBe(
                    row.selected?.strokeWidth
                );
                expect(selection?.selectedItem?.opacity, 'selectedItem.opacity').toBe(row.selected?.opacity);
                expect(selection?.unselectedItem?.opacity, 'unselectedItem.opacity').toBe(row.unselectedItem);
                expect(selection?.unselectedSeries?.opacity, 'unselectedSeries.opacity').toBe(row.unselectedSeries);
            }
        });
    });
});

describe('series that are not on the Defaults sheet', () => {
    // What each of these resolves to for `highlight`, `selection`, `glow` and `bringToFront`, as it did before the defaults changed.
    const SELECTION = {
        enabled: false,
        containment: 'any',
        selectedItem: { strokeWidth: 2 },
        unselectedItem: { opacity: 0.6 },
        unselectedSeries: { opacity: 0.2 },
    };
    const GAUGE = { highlight: { enabled: true, highlightedItem: {}, unhighlightedItem: {} }, selection: SELECTION };
    const OFF_SHEET = [
        { type: 'linear-gauge', options: { value: 5 }, expected: GAUGE },
        { type: 'radial-gauge', options: { value: 5 }, expected: GAUGE },
        { type: 'map-shape-background', options: {}, expected: { selection: SELECTION }, over: 'map-shape' },
        { type: 'map-line-background', options: {}, expected: {}, over: 'map-line' },
    ];

    describe.each(['ag-default', 'ag-default-dark'] as const)('%s theme', (theme) => {
        it.each(OFF_SHEET)('$type resolves as it did', ({ type, options, expected, over }) => {
            const resolved = (series: object[]) => {
                const { processedOptions } = prepareProcessedOptions({
                    theme,
                    data: DATA,
                    ...(type.startsWith('map') ? { topology: ukTopology } : {}),
                    series,
                });
                const [first] = (processedOptions as any).series;
                return Object.fromEntries(
                    ['highlight', 'selection', 'glow', 'bringToFront']
                        .filter((key) => key in first)
                        .map((key) => [key, first[key]])
                );
            };

            expect(resolved([{ type, ...options }])).toEqual(expected);
            if (over != null) {
                const foreground = { type: over, data: ukData, idKey: 'name' };
                expect(resolved([{ type, ...options }, foreground])).toEqual(expected);
            }
        });
    });
});

// The test theme's `foregroundColor` `#464646` mixed 60% onto its white `backgroundColor`.
const TEST_THEME_NEUTRAL = '#909090';

let chart: AgChartInstance | undefined;

/** The chart of the test that is running, drawn over {@link RENDER_OPTIONS} unless `base` says otherwise, and destroyed after it. */
const create = async (options: object, base: object = RENDER_OPTIONS) => {
    chart?.destroy();
    chart = await createEnterpriseChart({ ...base, ...options } as AgChartOptions);
    return chart;
};

/** Sets up the mock canvas and console of a suite that draws charts with {@link create}. */
function useChart() {
    setupMockConsole();
    const ctx = setupMockCanvas();
    afterEach(() => {
        chart?.destroy();
        chart = undefined;
    });
    return ctx;
}

describe('hovered item glow (defaults)', () => {
    useChart();

    /** What the chart draws with the item at `datumIndex` hovered. */
    const hovered = async (options: object, datumIndex: number) => {
        await create(options);
        await hoverDatum(chart!, 0, datumIndex);
        return canvasImage(chart!);
    };

    const BAR = { type: 'bar', xKey: 'x', yKey: 'y' };
    const BARS = [
        { x: 'A', y: 5 },
        { x: 'B', y: 8 },
        { x: 'C', y: 3 },
    ];
    const GRID = ['p', 'q', 'r'].flatMap((y, row) => ['a', 'b', 'c'].map((x, col) => ({ x, y, value: row * 3 + col })));

    /** The highlight a glow of `numbers` on the hovered item is, with the other items left at the sheet's full opacity. */
    const glowOf = (numbers: object) => ({
        highlight: { highlightedItem: { glow: { enabled: true, ...numbers } }, unhighlightedItem: { opacity: 1 } },
    });

    // Each row hovers one item with nothing set, and expects the render of the glow the Defaults sheet gives it, set as options.
    const CASES = [
        {
            name: 'bar: the fill at 0.6, blur 1, spread 2, gap 1',
            series: BAR,
            data: BARS,
            glow: { fillOpacity: 0.6, blur: 1, spread: 2, gap: 1 },
            wrong: { fillOpacity: 0.4 },
        },
        {
            name: 'candlestick: the fill at 0.5, gap 0',
            series: {
                type: 'candlestick',
                xKey: 'x',
                openKey: 'open',
                highKey: 'high',
                lowKey: 'low',
                closeKey: 'close',
            },
            data: OHLC_DATA,
            glow: { fillOpacity: 0.5, blur: 1, spread: 2, gap: 0 },
            wrong: { gap: 1 },
        },
        {
            name: 'heatmap: the neutral fill at 1, blur 0, spread 1, gap 0',
            series: { type: 'heatmap', xKey: 'x', yKey: 'y', colorKey: 'value' },
            data: GRID,
            glow: { fill: TEST_THEME_NEUTRAL, fillOpacity: 1, blur: 0, spread: 1, gap: 0 },
            wrong: { fill: '#000000' },
            datumIndex: 4,
        },
    ];

    it.each(CASES)('$name', async ({ series, data, glow, wrong, datumIndex = 1 }) => {
        const options = { data, series: [series] };
        const withGlow = (numbers: object) => ({ ...options, series: [{ ...series, ...glowOf(numbers) }] });

        const unhovered = (await create(options), canvasImage(chart!));
        const byDefault = await hovered(options, datumIndex);
        const bySheet = await hovered(withGlow(glow), datumIndex);
        const byWrong = await hovered(withGlow({ ...glow, ...wrong }), datumIndex);

        expect(differingBytes(byDefault, unhovered), 'the hover draws a glow').toBeGreaterThan(0);
        expectSamePixels(byDefault, bySheet);
        expect(differingBytes(byDefault, byWrong), 'the sheet value is the one drawn').toBeGreaterThan(0);
    });

    it('treemap group: the neutral fill at 0.6, blur 1, spread 2, gap 1', async () => {
        const series = { type: 'treemap', labelKey: 'name', sizeKey: 'size' };
        const options = { data: HIERARCHY_SHADOW_DATA, series: [series] };
        const withGlow = (numbers: object) => ({
            ...options,
            series: [{ ...series, group: { highlight: { highlightedItem: { glow: { enabled: true, ...numbers } } } } }],
        });
        const hoverGroup = async (opts: object) => {
            await create(opts);
            await hoverNode(chart!, nodeNamed('A')(chart!));
            return canvasImage(chart!);
        };
        const sheet = { fill: TEST_THEME_NEUTRAL, fillOpacity: 0.6, blur: 1, spread: 2, gap: 1 };

        const byDefault = await hoverGroup(options);
        expectSamePixels(byDefault, await hoverGroup(withGlow(sheet)));
        expect(differingBytes(byDefault, await hoverGroup(withGlow({ ...sheet, fillOpacity: 1 })))).toBeGreaterThan(0);
    });

    it('treemap group: a keyboard-focused group glows as a hovered one does', async () => {
        const options = {
            data: [
                { name: 'Americas', children: ['US', 'Brazil'].map((name, size) => ({ name, size: 9 - size * 5 })) },
                { name: 'Asia', children: ['China', 'Japan'].map((name, size) => ({ name, size: 8 - size * 4 })) },
            ],
            series: [{ type: 'treemap', labelKey: 'name', sizeKey: 'size' }],
        };
        await create(options);
        const unfocused = canvasImage(chart!);
        await hoverNode(chart!, nodeNamed('Americas')(chart!));
        const onHover = canvasImage(chart!);

        await create(options);
        await tabIntoChart(chart!);
        await pressKey(chart!, 'ArrowRight');
        await pressKey(chart!, 'ArrowLeft');

        const darkened = onHover.data.filter((v, i) => i % 4 === 0 && v < 200 && unfocused.data[i] === 255);
        expect(darkened.length, 'the hovered group casts a glow onto the white background').toBeGreaterThan(0);
        expectSamePixels(canvasImage(chart!), onHover);
    });
});

describe('hovered item glow that the user turns off', () => {
    useChart();

    const BAR = { type: 'bar', xKey: 'x', yKey: 'y' };
    const HIERARCHY = { labelKey: 'name', sizeKey: 'size' };
    const OFF = { enabled: false };
    const hoveredItemGlowOff = { highlightedItem: { glow: OFF } };

    /** What the chart draws with the item at `datumIndex` hovered, or with the node of that name when `node` is. */
    const hovered = async (options: object, target: { datumIndex: number } | { node: string }) => {
        await create(options);
        if ('node' in target) await hoverNode(chart!, nodeNamed(target.node)(chart!));
        else await hoverDatum(chart!, 0, target.datumIndex);
        return canvasImage(chart!);
    };

    // The hovered item falls back to the series glow the user sets, and glows only if that glow is enabled.
    it.each([
        {
            name: 'bar',
            series: BAR,
            data: [
                { x: 'A', y: 5 },
                { x: 'B', y: 8 },
                { x: 'C', y: 3 },
            ],
            glow: { glow: OFF },
            itemOff: { highlight: hoveredItemGlowOff },
            target: { datumIndex: 1 },
        },
        {
            name: 'sunburst',
            series: { type: 'sunburst', ...HIERARCHY },
            data: HIERARCHY_SHADOW_DATA,
            glow: { glow: OFF },
            itemOff: { highlight: hoveredItemGlowOff },
            target: { node: 'A1' },
        },
        {
            name: 'treemap tile',
            series: { type: 'treemap', ...HIERARCHY },
            data: HIERARCHY_SHADOW_DATA,
            glow: { tile: { glow: OFF } },
            itemOff: { tile: { highlight: hoveredItemGlowOff } },
            target: { node: 'A1' },
        },
        {
            name: 'treemap group',
            series: { type: 'treemap', ...HIERARCHY },
            data: HIERARCHY_SHADOW_DATA,
            glow: { group: { glow: OFF } },
            itemOff: { group: { highlight: hoveredItemGlowOff } },
            target: { node: 'A' },
        },
    ])(
        '$name: a series glow.enabled of false leaves the hovered item without a glow',
        async ({ series, data, glow, itemOff, target }) => {
            const options = (extra: object) => ({ data, series: [{ ...series, ...extra }] });

            const byDefault = await hovered(options({}), target);
            const bySeriesGlow = await hovered(options(glow), target);
            const byItemGlow = await hovered(options(itemOff), target);

            expect(differingBytes(byDefault, bySeriesGlow), 'the default hover glows').toBeGreaterThan(0);
            expectSamePixels(bySeriesGlow, byItemGlow);
        }
    );
});

describe('hovered item glow of a series that glows on several parts', () => {
    useChart();

    const ON = { enabled: true };
    const OFF = { enabled: false };
    const MARKERS = { enabled: true, size: 12 };

    const SERIES = [
        {
            name: 'hlc',
            data: OHLC_DATA,
            series: { type: 'hlc', xKey: 'x', highKey: 'high', lowKey: 'low', closeKey: 'close' },
            parts: ['high', 'low', 'close'],
            options: (item: object, marker?: object) => ({ marker: { ...MARKERS, ...marker }, item }),
        },
        {
            name: 'range-area',
            data: RANGE,
            series: { type: 'range-area', xKey: 'x', yLowKey: 'low', yHighKey: 'high' },
            parts: ['low', 'high'],
            options: (item: object, marker?: object) => ({ marker: { ...MARKERS, ...marker }, item }),
        },
    ];

    // The hovered item of each part glows by default, unless the part's own `enabled`, or the marker's it inherits, is set.
    it.each(SERIES.map((series) => [series.name, series] as const))(
        '%s: an explicit glow.enabled wins for its own part and the default stays on the others',
        async (_name, { data, series, parts, options }) => {
            const [first] = parts;
            const hoveredGlows = async (item: object, marker?: object, highlight?: object) => {
                await create({ data, series: [{ ...series, ...options(item, marker), highlight }] });
                await hoverDatum(chart!);
                return new Set(
                    collectShapes(getSeriesAt(chart!).highlightGroup)
                        .filter((shape) => shape.visible && shape.getCastShadow('glow') != null)
                        .map((shape) => (shape.datum as { itemType: string }).itemType)
                );
            };
            const all = new Set(parts);

            expect(await hoveredGlows({}), 'defaults: every part glows').toEqual(all);
            expect(await hoveredGlows({}, { glow: OFF }), 'marker.glow off: none').toEqual(new Set());
            expect(
                await hoveredGlows({ [first]: { marker: { glow: ON } } }, { glow: OFF }),
                'one part on, marker.glow off: that part'
            ).toEqual(new Set([first]));
            expect(await hoveredGlows({ [first]: { marker: { glow: ON } } }), 'one part on: every part glows').toEqual(
                all
            );
            for (const part of parts) {
                expect(
                    await hoveredGlows({ [part]: { marker: { glow: OFF } } }),
                    `${part} off: the others glow`
                ).toEqual(new Set(parts.filter((other) => other !== part)));
            }
            expect(
                await hoveredGlows({}, undefined, { highlightedItem: { glow: OFF } }),
                'highlightedItem off'
            ).toEqual(new Set());
            expect(
                await hoveredGlows({}, undefined, { highlightedSeries: { glow: OFF } }),
                'highlightedSeries off'
            ).toEqual(new Set());
            expect(
                await hoveredGlows({}, { glow: OFF }, { highlightedItem: { glow: ON } }),
                'highlightedItem on'
            ).toEqual(all);
        }
    );

    // Each part's default is picked by its position among the series' parts, which the theme's order of parts must match.
    it.each(['positive', 'negative', 'total'])(
        'waterfall: a hovered %s bar loses the default glow alone when its own glow is disabled',
        async (disabled) => {
            await create({
                data: [...WATERFALL_DATA, { x: 'Total', y: 12 }],
                series: [
                    {
                        type: 'waterfall',
                        xKey: 'x',
                        yKey: 'y',
                        item: { [disabled]: { glow: OFF } },
                        totals: [{ totalType: 'subtotal', index: 3, axisLabel: 'Total' }],
                    },
                ],
            });

            const hoveredGlows = async (itemType: string) => {
                const datum = getSeriesNodeData<_ModuleSupport.HighlightNodeDatum & { itemType: string }>(chart!).find(
                    (node) => node.itemType === itemType
                )!;
                await hoverNode(chart!, datum);
                return collectShapes(getSeriesAt(chart!).highlightGroup).filter(
                    (shape) => shape.visible && shape.getCastShadow('glow') != null
                ).length;
            };

            // The `total` options style the subtotal bar.
            for (const [itemType, part] of [
                ['positive', 'positive'],
                ['negative', 'negative'],
                ['subtotal', 'total'],
            ]) {
                const glows = await hoveredGlows(itemType);
                expect(glows > 0, `${itemType} bar glows`).toBe(part !== disabled);
            }
        }
    );
});

describe('hovered item glow of a series whose marker inherits marker.glow', () => {
    const hoverGlowEnabled = (marker?: object) =>
        (
            prepareProcessedOptions({
                data: DATA,
                series: [{ type: 'line', xKey: 'category', yKey: 'value', marker }],
            }).processedOptions as any
        ).series[0].highlight.highlightedItem.glow.enabled;

    it('line: glows on hover unless marker.glow.enabled is set false', () => {
        expect(hoverGlowEnabled()).toBe(true);
        expect(hoverGlowEnabled({ glow: { enabled: false } })).toBe(false);
        expect(hoverGlowEnabled({ glow: { enabled: true } })).toBe(true);
    });
});

describe('hovered item glow of a hierarchy series with a branch glow', () => {
    const OFF = { enabled: false };
    const ON = { enabled: true };

    type Settings = { glow?: object; highlight?: object };
    const SERIES = [
        {
            name: 'sunburst',
            build: ({ glow, highlight }: Settings) => ({
                type: 'sunburst',
                labelKey: 'category',
                sizeKey: 'size',
                glow,
                highlight,
            }),
            highlightOf: (series: any) => series.highlight,
        },
        {
            name: 'treemap tile',
            build: ({ glow, highlight }: Settings) => ({
                type: 'treemap',
                labelKey: 'category',
                sizeKey: 'size',
                tile: { glow, highlight },
            }),
            highlightOf: (series: any) => series.tile.highlight,
        },
    ];

    // The hovered node falls back to its branch before the series, so the nearest glow the user sets decides.
    it.each(SERIES)(
        '$name: the highlighted branch glow beats the series glow and the default',
        ({ build, highlightOf }) => {
            const hoverGlowEnabled = (settings: Settings) => {
                const { processedOptions } = prepareProcessedOptions({ data: DATA, series: [build(settings)] });
                return highlightOf((processedOptions as any).series[0]).highlightedItem.glow.enabled;
            };
            const branch = (glow: object) => ({ highlightedBranch: { glow } });

            expect(hoverGlowEnabled({})).toBe(true);
            expect(hoverGlowEnabled({ glow: OFF })).toBe(false);
            expect(hoverGlowEnabled({ highlight: branch(OFF) })).toBe(false);
            expect(hoverGlowEnabled({ glow: OFF, highlight: branch(ON) })).toBe(true);
        }
    );
});

describe('unhighlightedItem opacity by highlight mode', () => {
    const BARS = [
        { type: 'bar', xKey: 'category', yKey: 'value' },
        { type: 'bar', xKey: 'category', yKey: 'low' },
    ];
    const PIE = [{ type: 'pie', angleKey: 'value' }];

    const itemOpacity = (series: object[], mode: 'shared' | 'single', extra: object = {}) => {
        const { processedOptions } = prepareProcessedOptions({
            data: DATA,
            highlight: { mode },
            series,
            ...extra,
        });
        return (processedOptions as any).series.map((s: any) => s.highlight.unhighlightedItem.opacity);
    };

    const withSeriesOpacity = (series: object[], highlight: object) => series.map((s) => ({ ...s, highlight }));

    // In `shared` mode the other items of the hovered series dim with the other series, and in `single` mode keep their own default.
    it.each([
        ['bar', BARS, { shared: [0.5, 0.5], single: [1, 1] }],
        ['pie', PIE, { shared: [0.5], single: [0.5] }],
    ])('%s follows unhighlightedSeries in shared mode only', (_name, series, expected) => {
        expect(itemOpacity(series, 'shared')).toEqual(expected.shared);
        expect(itemOpacity(series, 'single')).toEqual(expected.single);
    });

    it.each([
        ['bar', BARS, { shared: [0.2, 0.2], single: [1, 1] }],
        ['pie', PIE, { shared: [0.2], single: [0.5] }],
    ])('%s takes the unhighlightedSeries opacity that is set in shared mode', (_name, series, expected) => {
        const set = withSeriesOpacity(series, { unhighlightedSeries: { opacity: 0.2 } });
        expect(itemOpacity(set, 'shared')).toEqual(expected.shared);
        expect(itemOpacity(set, 'single')).toEqual(expected.single);
    });

    describe.each(['shared', 'single'] as const)('in %s mode', (mode) => {
        it.each([
            ['bar', BARS],
            ['pie', PIE],
        ])('an unhighlightedItem opacity set in %s options wins', (_name, series) => {
            const set = withSeriesOpacity(series, { unhighlightedItem: { opacity: 0.7 } });
            expect(itemOpacity(set, mode)).toEqual(series.map(() => 0.7));
        });

        it.each([
            ['bar', BARS, 'bar'],
            ['pie', PIE, 'pie'],
        ])('an unhighlightedItem opacity set in a %s theme wins', (_name, series, type) => {
            const theme = { overrides: { [type]: { series: { highlight: { unhighlightedItem: { opacity: 0.8 } } } } } };
            expect(itemOpacity(series, mode, { theme })).toEqual(series.map(() => 0.8));
        });
    });
});

describe('selected item opacity', () => {
    useChart();

    const BLUE = [0, 0, 255, 255];

    const selectFirstBar = async (highlightMode: 'shared' | 'single') => {
        await create({
            data: [
                { x: 'A', y: 5, z: 4 },
                { x: 'B', y: 8, z: 6 },
            ],
            highlight: { mode: highlightMode },
            selection: { enabled: true },
            series: [
                {
                    type: 'bar',
                    xKey: 'x',
                    yKey: 'y',
                    fill: '#0000ff',
                    fillOpacity: 1,
                    selection: { enabled: true, selectedItem: { strokeWidth: 0 } },
                },
                { type: 'bar', xKey: 'x', yKey: 'z', fill: '#ff0000', fillOpacity: 1 },
            ],
        });
        const { series } = deproxy(chart!);
        chart!.setSelection([{ seriesId: series[0].id, itemId: series[0].data!.getItemIdFromIndex(0) }]);
        await waitForChartStability(chart!);
    };

    const barPixels = () =>
        itemNodes(chart!).map((node) => {
            const { x, y, width, height } = node.getBBox();
            const { canvasX, canvasY } = Transformable.toCanvasPoint(node, x + width / 2, y + height / 2);
            return chartPixelAt(chart!, canvasX, canvasY);
        });

    // The bar fill is opaque blue on white, so a bar reads pure blue only at opacity 1.
    it('draws a selected bar at full opacity and dims the unselected ones', async () => {
        await selectFirstBar('single');

        const [selected, unselected] = barPixels();
        expect(selected).toEqual(BLUE);
        expect(unselected).not.toEqual(BLUE);
    });

    // The selected bar is in the hovered series, or in another series that the hover dims.
    it.each([
        ['an item of another series', 'single', 1, 0],
        ['another item of the same series, when highlight is shared', 'shared', 0, 1],
    ] as const)(
        'keeps a selected bar at full opacity when %s is hovered',
        async (_name, mode, seriesIndex, datumIndex) => {
            await selectFirstBar(mode);
            await hoverDatum(chart!, seriesIndex, datumIndex);

            expect(barPixels()[0]).toEqual(BLUE);
        }
    );
});

describe('selected item opacity under hover', () => {
    useChart();

    const PIE_DATA = [
        { x: 'A', y: 5 },
        { x: 'B', y: 4 },
        { x: 'C', y: 3 },
    ];

    // Each slice fills with a colour that reads pure only at opacity 1, over the white chart.
    const PIE = {
        type: 'pie',
        angleKey: 'y',
        legendItemKey: 'x',
        fills: ['#0000ff', '#ff0000', '#00ff00'],
        strokeWidth: 0,
    };
    const BLUE = [0, 0, 255, 255];
    const GREEN = [0, 255, 0, 255];

    it('keeps a selected slice at full opacity while another slice is hovered', async () => {
        await create({
            data: PIE_DATA,
            selection: { enabled: true },
            series: [
                { ...PIE, highlight: { highlightedItem: { glow: { enabled: false } } }, selection: { enabled: true } },
            ],
        });
        const { series } = deproxy(chart!);
        chart!.setSelection([{ seriesId: series[0].id, itemId: series[0].data!.getItemIdFromIndex(0) }]);
        await waitForChartStability(chart!);
        const selectedAtRest = countChartPixels(chart!, BLUE);
        expect(selectedAtRest, 'the selected slice is drawn').toBeGreaterThan(0);

        await hoverDatum(chart!, 0, 1);

        expect(countChartPixels(chart!, BLUE), 'the selected slice').toBe(selectedAtRest);
        expect(countChartPixels(chart!, GREEN), 'the other unselected slice dims').toBe(0);
    });
});

describe('hover breaking changes', () => {
    useChart();

    describe('cone-funnel', () => {
        const options = (highlight?: object) => ({
            data: [
                { stage: 'Visits', value: 100 },
                { stage: 'Sign-ups', value: 60 },
                { stage: 'Paid', value: 20 },
            ],
            series: [
                { type: 'cone-funnel', stageKey: 'stage', valueKey: 'value', label: { enabled: false }, highlight },
            ],
        });

        it('draws no outline or glow on a hovered item', async () => {
            await create(options());
            const unhovered = canvasImage(chart!);
            await hoverDatum(chart!, 0, 1);

            expectSamePixels(canvasImage(chart!), unhovered);
        });

        it('still draws a hover style that is set', async () => {
            await create(options({ highlightedItem: { stroke: '#000000', strokeWidth: 4 } }));
            const unhovered = canvasImage(chart!);
            await hoverDatum(chart!, 0, 1);

            expect(differingBytes(canvasImage(chart!), unhovered)).toBeGreaterThan(0);
        });
    });

    describe('map-shape', () => {
        const options = (highlight?: object) => ({
            topology: ukTopology,
            legend: { enabled: false },
            series: [
                { type: 'map-shape', data: ukData, idKey: 'name', fill: '#00aa00', highlight },
                {
                    type: 'map-marker',
                    data: ukData,
                    idKey: 'name',
                    sizeKey: 'population',
                    shape: 'square',
                    size: 20,
                    maxSize: 20,
                    fill: '#ff0000',
                    fillOpacity: 1,
                    stroke: '#ff0000',
                    highlight: { enabled: false },
                },
            ],
        });

        /** The pixel at the middle of the first marker, which sits at the centre of the hovered shape. */
        const markerPixel = () => {
            const [marker] = shapesOf(getSeriesAt(chart!, 1).contentGroup, _ModuleSupport.Marker);
            const { canvasX, canvasY } = Transformable.toCanvasPoint(marker, marker.x, marker.y);
            return chartPixelAt(chart!, canvasX, canvasY);
        };

        const hoveredMarkerPixel = async (highlight?: object) => {
            await create(options(highlight));
            await hoverDatum(chart!, 0, 0);
            return markerPixel();
        };

        it('leaves the hovered shape under the marker above it', async () => {
            await create(options());
            const atRest = markerPixel();

            expect(atRest).toEqual([255, 0, 0, 255]);
            expect(await hoveredMarkerPixel()).toEqual(atRest);
        });

        it('brings the hovered shape over the marker with bringToFront', async () => {
            expect(await hoveredMarkerPixel({ bringToFront: true })).not.toEqual([255, 0, 0, 255]);
        });

        it.each([
            { from: true, to: false, overMarker: false },
            { from: false, to: true, overMarker: true },
        ])('follows an update of bringToFront from $from to $to', async ({ from, to, overMarker }) => {
            await create(options({ bringToFront: from }));
            const next = { ...RENDER_OPTIONS, ...options({ bringToFront: to }) } as AgChartOptions;
            await chart!.update(prepareEnterpriseTestOptions(next));
            await waitForChartStability(chart!);
            await hoverDatum(chart!, 0, 0);

            expect(markerPixel()[0] === 255 && markerPixel()[1] === 0).toBe(!overMarker);
        });
    });
});

/** The box of the pixels that differ from the first (background) pixel of the canvas `image`, which is `width` pixels wide. */
function inkBox({ data }: { data: Uint8ClampedArray }, width: number) {
    const box = { left: Infinity, top: Infinity, right: -Infinity, bottom: -Infinity };
    for (let i = 0; i < data.length; i += 4) {
        if ([1, 2, 3].every((c) => data[i + c] === data[c]) && data[i] === data[0]) continue;
        const x = (i / 4) % width;
        const y = Math.floor(i / 4 / width);
        box.left = Math.min(box.left, x);
        box.top = Math.min(box.top, y);
        box.right = Math.max(box.right, x);
        box.bottom = Math.max(box.bottom, y);
    }
    return box;
}

/** How many pixels of `after` differ from `before` inside and outside of `box`. */
function changedPixels(
    after: { data: Uint8ClampedArray },
    before: { data: Uint8ClampedArray },
    width: number,
    box: ReturnType<typeof inkBox>
) {
    let inside = 0;
    let outside = 0;
    for (let i = 0; i < after.data.length; i += 4) {
        if ([0, 1, 2, 3].every((c) => after.data[i + c] === before.data[i + c])) continue;
        const x = (i / 4) % width;
        const y = Math.floor(i / 4 / width);
        const within = x >= box.left && x <= box.right && y >= box.top && y <= box.bottom;
        if (within) inside++;
        else outside++;
    }
    return { inside, outside };
}

describe('series with no hover glow', () => {
    useChart();

    const FLOW = { fromKey: 'from', toKey: 'to', sizeKey: 'size' };
    const NO_GLOW = { highlightedItem: { glow: { enabled: false } } };
    const GLOW = { highlightedItem: { glow: { enabled: true } } };

    // A series that glows on hover draws the same with its glow turned off, and differently with it turned on.
    describe.each([
        ['sankey nodes', 'sankey', getFlowNodeData],
        ['sankey links', 'sankey', getFlowLinkData],
        ['chord nodes', 'chord', getFlowNodeData],
        ['chord links', 'chord', getFlowLinkData],
    ] as const)('%s', (_name, type, datumOf) => {
        it('draws no glow on a hovered item', async () => {
            const hovered = async (highlight?: object) => {
                await create({ data: FLOW_DATA, series: [{ type, ...FLOW, highlight }] });
                await hoverNode(chart!, datumOf(chart!)[0]);
                return canvasImage(chart!);
            };

            const byDefault = await hovered();
            expectSamePixels(byDefault, await hovered(NO_GLOW));
            expect(differingBytes(byDefault, await hovered(GLOW)), 'a glow that is set draws').toBeGreaterThan(0);
        });
    });

    // The hover redraws the line over itself, so it may change the line's own pixels, but a glow would reach past them.
    it('map-line: draws nothing around a hovered line', async () => {
        await create({
            topology: ukRoadTopology,
            data: ukRoadData.slice(0, 1),
            series: [{ type: 'map-line', idKey: 'name' }],
        });
        const unhovered = canvasImage(chart!);
        const { width } = deproxy(chart!).ctx.scene.canvas;
        const ink = inkBox(unhovered, width);

        await hoverDatum(chart!, 0, 0);

        const { inside, outside } = changedPixels(canvasImage(chart!), unhovered, width, ink);
        expect(inside + outside, 'the hover changes the chart').toBeGreaterThan(0);
        expect(outside, 'nothing is drawn around the line').toBe(0);
    });

    // The hover outlines the card, and a glow would reach past the outline.
    it('organization: draws nothing on a hovered card beyond its outline', async () => {
        await create({
            data: [{ id: 'ceo', name: 'Alice Chen', job: 'Chief Executive Officer', parentId: null }],
            series: [
                {
                    type: 'organization',
                    idKey: 'id',
                    parentIdKey: 'parentId',
                    node: { title: { key: 'name' }, subtitle: { key: 'job' } },
                },
            ],
        });
        const unhovered = canvasImage(chart!);
        const [{ node }] = getOrganizationCards(chart!);
        const card = Transformable.toCanvas(node);
        const { x, y } = card.computeCenter();

        await hoverAction(x, y)(chart!);
        await waitForChartStability(chart!);

        const { width } = deproxy(chart!).ctx.scene.canvas;
        const OUTLINE = 4;
        const { inside, outside } = changedPixels(canvasImage(chart!), unhovered, width, {
            left: card.x - OUTLINE,
            top: card.y - OUTLINE,
            right: card.x + card.width + OUTLINE,
            bottom: card.y + card.height + OUTLINE,
        });

        expect(inside, 'the hover outlines the card').toBeGreaterThan(0);
        expect(outside, 'nothing is drawn around the card').toBe(0);
    });
});

describe('a user-set hover glow default', () => {
    useChart();

    const FLOW = { fromKey: 'from', toKey: 'to', sizeKey: 'size' };
    const DEFAULTS = { part0: true, part1: true };

    const hovered = async (options: object = {}) => {
        await create({ data: FLOW_DATA, series: [{ type: 'sankey', ...FLOW, ...options }] });
        await hoverNode(chart!, getFlowNodeData(chart!)[0]);
        return canvasImage(chart!);
    };

    it.each(['_hoverGlowDefaults', 'hoverGlowDefaults'])(
        '%s in series options warns and has no effect',
        async (key) => {
            const byDefault = await hovered();

            expectSamePixels(await hovered({ highlight: { [key]: DEFAULTS } }), byDefault);
            expectWarningMessages([`AG Charts - Unknown option \`series[0].highlight.${key}\`, ignoring.`]);
        }
    );

    it.each(['_hoverGlowDefaults', 'hoverGlowDefaults'])(
        '%s in a theme override warns and has no effect',
        async (key) => {
            const byDefault = await hovered();
            const theme = { overrides: { sankey: { series: { highlight: { [key]: DEFAULTS } } } } };

            await create({ theme, data: FLOW_DATA, series: [{ type: 'sankey', ...FLOW }] });
            await hoverNode(chart!, getFlowNodeData(chart!)[0]);

            expectSamePixels(canvasImage(chart!), byDefault);
            expectWarningMessages([
                `AG Charts - Unknown option \`theme.overrides.sankey.series.highlight.${key}\`, ignoring.`,
            ]);
        }
    );
});

// The look of 14.3.0, set as options. The baselines of these tests are drawn by the base, so a head that draws them
// differently has changed what the opt-out restores.
describe('opting out of the defaults', () => {
    const ctx = useChart();

    const OPT_OUT_HIGHLIGHT = {
        highlightedItem: { glow: { enabled: false } },
        unhighlightedItem: { opacity: 0.6 },
        unhighlightedSeries: { opacity: 0.2 },
    };
    const OPT_OUT_SELECTION = { unselectedItem: { opacity: 0.6 }, unselectedSeries: { opacity: 0.2 } };

    const createBars = (series: object[]) =>
        create(
            {
                data: [
                    { x: 'A', a: 5, b: 4 },
                    { x: 'B', a: 8, b: 6 },
                    { x: 'C', a: 3, b: 7 },
                ],
                selection: { enabled: true },
                series: ['a', 'b'].map((yKey, index) => ({ type: 'bar', xKey: 'x', yKey, ...series[index] })),
            },
            {}
        );

    it('renders a hovered bar as it did', async () => {
        await createBars([{ highlight: OPT_OUT_HIGHLIGHT }, { highlight: OPT_OUT_HIGHLIGHT }]);
        await hoverDatum(chart!, 0, 1);
        await compareImageSnapshot(chart!, ctx);
    });

    it('renders a selected bar as it did', async () => {
        await createBars([
            { selection: { enabled: true, ...OPT_OUT_SELECTION } },
            { selection: { enabled: true, ...OPT_OUT_SELECTION } },
        ]);
        const [first] = deproxy(chart!).series;
        chart!.setSelection([{ seriesId: first.id, itemId: first.data!.getItemIdFromIndex(1) }]);
        await waitForChartStability(chart!);
        await compareImageSnapshot(chart!, ctx);
    });

    it('renders a hovered cone-funnel stage with its outline', async () => {
        await create(
            {
                data: [
                    { stage: 'Visits', value: 100 },
                    { stage: 'Sign-ups', value: 60 },
                    { stage: 'Paid', value: 20 },
                ],
                series: [
                    {
                        type: 'cone-funnel',
                        stageKey: 'stage',
                        valueKey: 'value',
                        highlight: { highlightedItem: { stroke: 'rgba(0, 0, 0, 0.4)', strokeWidth: 2 } },
                    },
                ],
            },
            {}
        );
        await hoverDatum(chart!, 0, 1);
        await compareImageSnapshot(chart!, ctx);
    });

    // The dim of the tiles and branches that hovering a leaf leaves, in the options of 14.3.0.
    const HIERARCHY_OPT_OUT = {
        highlightedItem: { glow: { enabled: false } },
        unhighlightedItem: { fillOpacity: 0.6, strokeOpacity: 0.6 },
        unhighlightedBranch: { opacity: 1, fillOpacity: 0.2, strokeOpacity: 0.2 },
    };

    it.each([
        ['sunburst', { highlight: HIERARCHY_OPT_OUT }],
        [
            'treemap',
            {
                tile: { highlight: HIERARCHY_OPT_OUT },
                group: {
                    highlight: {
                        highlightedItem: { glow: { enabled: false } },
                        unhighlightedItem: { opacity: 0.2, fillOpacity: 0.2, strokeOpacity: 0.2 },
                    },
                },
            },
        ],
    ])('renders a hovered %s leaf with the dim it had', async (type, options) => {
        await create(
            { data: HIERARCHY_SHADOW_DATA, series: [{ type, labelKey: 'name', sizeKey: 'size', ...options }] },
            {}
        );
        await hoverNode(chart!, nodeNamed('A1')(chart!));
        await compareImageSnapshot(chart!, ctx);
    });
});
