import { afterEach, describe, expect, it } from 'vitest';

import type { AgChartInstance, AgChartOptions } from 'ag-charts-community';
import { _ModuleSupport } from 'ag-charts-community';
import {
    RENDER_OPTIONS,
    canvasImage,
    chartPixelAt,
    compareImageSnapshot,
    deproxy,
    differingBytes,
    expectSamePixels,
    getSeriesAt,
    hoverDatum,
    hoverNode,
    prepareProcessedOptions,
    setupMockCanvas,
    setupMockConsole,
    shapesOf,
    waitForChartStability,
} from 'ag-charts-community-test';
import { Transformable } from 'ag-charts-core';

import { setupEnterpriseModules } from '../setup';
import { nodeNamed } from '../test/glowSeriesCases';
import { HIERARCHY_SHADOW_DATA, OHLC_DATA, createEnterpriseChart, itemNodes } from '../test/utils';
import { ukData } from './map-test/ukData';
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

            expect(highlight.highlightedItem?.glow?.enabled === true, 'highlightedItem.glow').toBe(
                row.highlightedItemGlow === true
            );
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

    // The bar fill is opaque blue on white, so a selected bar reads pure blue only at opacity 1.
    it('draws a selected bar at full opacity and dims the unselected ones', async () => {
        await create({
            data: [
                { x: 'A', y: 5 },
                { x: 'B', y: 8 },
            ],
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
            ],
        });
        const { series } = deproxy(chart!);
        chart!.setSelection([{ seriesId: series[0].id, itemId: series[0].data!.getItemIdFromIndex(0) }]);
        await waitForChartStability(chart!);

        const [selected, unselected] = itemNodes(chart!).map((node) => {
            const { x, y, width, height } = node.getBBox();
            const { canvasX, canvasY } = Transformable.toCanvasPoint(node, x + width / 2, y + height / 2);
            return chartPixelAt(chart!, canvasX, canvasY);
        });
        expect(selected).toEqual([0, 0, 255, 255]);
        expect(unselected).not.toEqual([0, 0, 255, 255]);
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

        it('draws no outline on a hovered item', async () => {
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
    });
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
});
