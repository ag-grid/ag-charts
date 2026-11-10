import { afterEach, describe, expect, it } from 'vitest';

import type { AgChartInstance, AgChartOptions } from 'ag-charts-community';
import { _ModuleSupport } from 'ag-charts-community';
import {
    MIN_UNHIGHLIGHT_DELAY,
    SINGLE_HIGHLIGHT_SHARED_TOOLTIP,
    deproxy,
    focusIndicatorContainsCanvasPoint,
    getSeriesAt,
    getSeriesNodeData,
    hoverAction,
    pressKey,
    setupMockCanvas,
    setupMockConsole,
    tabIntoChart,
    waitForChartStability,
} from 'ag-charts-community-test';
import { type Group, Transformable } from 'ag-charts-core';

import { collectShapes, createEnterpriseChart } from '../test/utils';
import type { MapMarkerNodeDatum } from './map-marker/mapMarkerSeries';
import { ukData } from './map-test/ukData';
import ukTopology from './map-test/ukTopology.json';

type HighlightNodeDatum = _ModuleSupport.HighlightNodeDatum;
type Marker = _ModuleSupport.Marker;
type AnySeriesOptions = NonNullable<AgChartOptions['series']>[number];

type Bucket = 'highlightedItem' | 'unhighlightedItem' | 'highlightedSeries' | 'unhighlightedSeries';

const CONFIGURED = 10;
const SIZES: Record<Bucket, number> = {
    highlightedItem: 21,
    unhighlightedItem: 13,
    highlightedSeries: 17,
    unhighlightedSeries: 7,
};
const BUCKETS = Object.keys(SIZES) as Bucket[];

const POLAR_DATA = [
    { quarter: 'Q1', value: 5, low: 2 },
    { quarter: 'Q2', value: 8, low: 3 },
    { quarter: 'Q3', value: 3, low: 1 },
    { quarter: 'Q4', value: 6, low: 2 },
];
const RANGE_DATA = [
    { x: 'Q1', low: 2, high: 5 },
    { x: 'Q2', low: 3, high: 8 },
    { x: 'Q3', low: 1, high: 3 },
];
const OHLC_DATA = [
    { x: 'Q1', open: 6, high: 7, low: 3, close: 4 },
    { x: 'Q2', open: 5, high: 7, low: 4, close: 6 },
    { x: 'Q3', open: 4, high: 5, low: 4, close: 4.5 },
];

interface SeriesCase {
    name: string;
    data: object[];
    series: object;
    // Two series that share a legend item warn, even with the legend disabled.
    second: object;
    markerUnderSeries: boolean;
    copies: number;
    chartOptions?: object;
}

interface BuildOptions {
    highlight?: Partial<Record<Bucket, { size: number }>>;
    enabled?: boolean;
    itemStyler?: () => object;
}

const SERIES: SeriesCase[] = [
    {
        name: 'radar-line',
        data: POLAR_DATA,
        markerUnderSeries: true,
        copies: 1,
        series: { type: 'radar-line', angleKey: 'quarter', radiusKey: 'value' },
        second: { radiusKey: 'low' },
    },
    {
        name: 'radar-area',
        data: POLAR_DATA,
        markerUnderSeries: true,
        copies: 1,
        series: { type: 'radar-area', angleKey: 'quarter', radiusKey: 'value' },
        second: { radiusKey: 'low' },
    },
    {
        name: 'range-area',
        data: RANGE_DATA,
        markerUnderSeries: true,
        copies: 2,
        series: { type: 'range-area', xKey: 'x', yLowKey: 'low', yHighKey: 'high' },
        second: { legendItemName: 'Other' },
    },
    {
        name: 'hlc',
        data: OHLC_DATA,
        markerUnderSeries: true,
        copies: 3,
        series: { type: 'hlc', xKey: 'x', highKey: 'high', lowKey: 'low', closeKey: 'close' },
        second: { legendItemName: 'Other' },
    },
    {
        name: 'map-marker',
        data: ukData,
        markerUnderSeries: false,
        copies: 1,
        chartOptions: { topology: ukTopology },
        series: { type: 'map-marker', idKey: 'name' },
        second: { legendItemName: 'Other' },
    },
    {
        name: 'map-marker with sizeKey',
        data: ukData,
        markerUnderSeries: false,
        copies: 1,
        chartOptions: { topology: ukTopology },
        series: { type: 'map-marker', idKey: 'name', sizeKey: 'population', minSize: 4, maxSize: 40 },
        second: { legendItemName: 'Other' },
    },
];

const hasMarkerToggle = (testCase: SeriesCase) => testCase.markerUnderSeries;

const buildSeries = (testCase: SeriesCase, { highlight, enabled = true, itemStyler }: BuildOptions, extra: object) =>
    ({
        ...testCase.series,
        ...extra,
        ...(testCase.markerUnderSeries
            ? { marker: { enabled, size: CONFIGURED, ...(itemStyler && { itemStyler }) } }
            : { size: CONFIGURED, ...(itemStyler && { itemStyler }) }),
        ...(highlight && { highlight }),
    }) as AnySeriesOptions;

const highlightOf = (sizes: Bucket[]): BuildOptions['highlight'] =>
    Object.fromEntries(sizes.map((bucket) => [bucket, { size: SIZES[bucket] }]));

describe('highlight marker size (enterprise series)', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: AgChartInstance;

    afterEach(() => {
        chart?.destroy();
    });

    const markersOf = (group: Group): Marker[] =>
        group.visible
            ? collectShapes(group).filter(
                  (shape): shape is Marker => shape instanceof _ModuleSupport.Marker && shape.visible
              )
            : [];

    const layers = () => {
        const hoveredIndex = getSeriesNodeData<HighlightNodeDatum>(chart)[0].datumIndex;
        const own = markersOf(getSeriesAt(chart, 0).contentGroup);
        return {
            highlighted: markersOf(getSeriesAt(chart, 0).highlightGroup),
            others: own.filter((marker) => marker.datum?.datumIndex !== hoveredIndex),
            own,
            otherSeries: markersOf(getSeriesAt(chart, 1).contentGroup),
        };
    };

    const raiseHighlight = async (datum?: HighlightNodeDatum) => {
        const { ctx, id } = deproxy(chart);
        ctx.highlightManager.updateHighlight(id, datum);
        await waitForChartStability(chart);
    };

    const create = async (testCase: SeriesCase, options: BuildOptions = {}, chartOptions: object = {}) => {
        chart = await createEnterpriseChart({
            data: testCase.data,
            animation: { enabled: false },
            legend: { enabled: false },
            ...SINGLE_HIGHLIGHT_SHARED_TOOLTIP,
            ...testCase.chartOptions,
            ...chartOptions,
            series: [buildSeries(testCase, options, {}), buildSeries(testCase, options, testCase.second)],
        } as AgChartOptions);
    };

    const hover = async (testCase: SeriesCase, options: BuildOptions = {}, chartOptions: object = {}) => {
        await create(testCase, options, chartOptions);
        await raiseHighlight(getSeriesNodeData<HighlightNodeDatum>(chart)[0]);
        return layers();
    };

    const sizes = (markers: Marker[]) => markers.map((marker) => marker.size).sort((a, b) => a - b);
    const allAt = (markers: Marker[], size: number) => {
        expect(markers.length).toBeGreaterThan(0);
        expect(sizes(markers)).toEqual(markers.map(() => size));
    };

    describe.each(SERIES)('$name', (testCase) => {
        it.each([
            ['highlightedItem', 'highlighted'],
            ['unhighlightedItem', 'others'],
            ['unhighlightedSeries', 'otherSeries'],
        ] as const)('draws the %s size on its markers', async (bucket, layer) => {
            const drawn = await hover(testCase, { highlight: highlightOf([bucket]) });

            allAt(drawn[layer], SIZES[bucket]);
            expect(drawn.highlighted).toHaveLength(testCase.copies);
        });

        it('draws the highlightedSeries size on the hovered item and the other items of the series', async () => {
            const drawn = await hover(testCase, { highlight: highlightOf(['highlightedSeries']) });

            allAt(drawn.highlighted, SIZES.highlightedSeries);
            allAt(drawn.others, SIZES.highlightedSeries);
        });

        it('lets the item-level sizes win over highlightedSeries', async () => {
            const drawn = await hover(testCase, {
                highlight: highlightOf(['highlightedSeries', 'highlightedItem', 'unhighlightedItem']),
            });

            allAt(drawn.highlighted, SIZES.highlightedItem);
            allAt(drawn.others, SIZES.unhighlightedItem);
        });

        it('restores the sizes of the markers when the highlight ends', async () => {
            await create(testCase, { highlight: highlightOf(BUCKETS) });
            const before = layers();
            const baseline = { own: sizes(before.own), otherSeries: sizes(before.otherSeries) };
            await raiseHighlight(getSeriesNodeData<HighlightNodeDatum>(chart)[0]);
            expect(sizes(layers().own)).not.toEqual(baseline.own);

            await raiseHighlight();

            const ended = layers();
            expect(ended.highlighted).toHaveLength(0);
            expect(sizes(ended.own)).toEqual(baseline.own);
            expect(sizes(ended.otherSeries)).toEqual(baseline.otherSeries);
        });

        it('keeps the sizes of today while no highlight size is set', async () => {
            await create(testCase);
            const before = layers();
            const baseline = { own: sizes(before.own), otherSeries: sizes(before.otherSeries) };
            await raiseHighlight(getSeriesNodeData<HighlightNodeDatum>(chart)[0]);

            const during = layers();
            expect(sizes(during.own)).toEqual(baseline.own);
            expect(sizes(during.otherSeries)).toEqual(baseline.otherSeries);
            expect(during.highlighted).toHaveLength(testCase.copies);
            for (const size of sizes(during.highlighted)) expect(baseline.own).toContain(size);
        });

        it('lets the itemStyler size win over the highlight sizes', async () => {
            const drawn = await hover(testCase, {
                highlight: highlightOf(BUCKETS),
                itemStyler: () => ({ size: 5 }),
            });

            allAt(drawn.highlighted, 5);
            allAt(drawn.others, 5);
            allAt(drawn.otherSeries, 5);
        });
    });

    describe.each(SERIES.filter(hasMarkerToggle))('$name with markers disabled', (testCase) => {
        it('draws no markers in any highlight state', async () => {
            await create(testCase, { enabled: false, highlight: highlightOf(BUCKETS) });
            const none = () => {
                const drawn = layers();
                return [drawn.own, drawn.highlighted, drawn.otherSeries].map((markers) => markers.length);
            };
            expect(none()).toEqual([0, 0, 0]);

            await raiseHighlight(getSeriesNodeData<HighlightNodeDatum>(chart)[0]);
            expect(none()).toEqual([0, 0, 0]);

            await raiseHighlight();
            expect(none()).toEqual([0, 0, 0]);
        });
    });

    // range-area and hlc pick by axis only, and a data-driven size can cover the offset point in place.
    const EXACT_PICKED = ['radar-line', 'radar-area', 'map-marker'];

    describe.each(SERIES.filter(({ name }) => EXACT_PICKED.includes(name)))('$name exact hit testing', (testCase) => {
        const ENLARGED = 40;
        // Diagonal, so the point is inside the enlarged marker but outside its in-place copy of CONFIGURED size.
        const OFFSET = 10;
        const activeDatumIndex = () => deproxy(chart).ctx.highlightManager.getActiveHighlight()?.datumIndex;

        it.each([
            ['keeps the item highlighted inside its enlarged marker', { highlightedItem: { size: ENLARGED } }, true],
            ['drops the highlight at that point without a highlight size', undefined, false],
        ])('%s', async (_name, highlight, kept) => {
            await create(testCase, { highlight }, { tooltip: { range: 'exact' } });
            const [marker] = markersOf(getSeriesAt(chart, 0).contentGroup);
            const { x, y } = Transformable.toCanvas(marker).computeCenter();
            await hoverAction(x, y)(chart);
            await waitForChartStability(chart);
            const hoveredIndex = activeDatumIndex();
            expect(hoveredIndex).toBeDefined();

            await hoverAction(x + OFFSET, y - OFFSET)(chart);
            await waitForChartStability(chart, MIN_UNHIGHLIGHT_DELAY);

            expect(activeDatumIndex()).toBe(kept ? hoveredIndex : undefined);
        });
    });

    describe('keyboard focus on map-marker', () => {
        const testCase = SERIES.find(({ name }) => name === 'map-marker')!;
        const RING_PADDING = 4;

        it('sizes the focus indicator by highlightedItem.size', async () => {
            await create(testCase, { highlight: highlightOf(['highlightedItem', 'unhighlightedItem']) });
            await tabIntoChart(chart);
            await pressKey(chart, 'ArrowRight');

            const series = getSeriesAt(chart, 0);
            const focused = deproxy(chart).ctx.highlightManager.getActiveHighlight();
            expect(focused?.series).toBe(series);
            const datum = getSeriesNodeData<MapMarkerNodeDatum>(chart, 0).find(
                ({ datumIndex }) => datumIndex === focused?.datumIndex
            );
            expect(datum).toBeDefined();
            const { x, y } = datum!.point;
            const radius = (SIZES.highlightedItem + RING_PADDING) / 2;
            const at = (offset: number) => {
                const { canvasX, canvasY } = Transformable.toCanvasPoint(series.contentGroup, x + offset, y);
                return { canvasX, canvasY };
            };

            expect(focusIndicatorContainsCanvasPoint(chart, at(radius - 1))).toBe(true);
            expect(focusIndicatorContainsCanvasPoint(chart, at(radius + 2))).toBe(false);
        });
    });

    describe('theme overrides', () => {
        const testCase = SERIES.find(({ name }) => name === 'range-area')!;

        it('applies a highlight size set through the series theme overrides', async () => {
            const theme = {
                overrides: {
                    'range-area': { series: { highlight: { highlightedItem: { size: SIZES.highlightedItem } } } },
                },
            };
            const drawn = await hover(testCase, {}, { theme });

            allAt(drawn.highlighted, SIZES.highlightedItem);
            allAt(drawn.others, CONFIGURED);
        });
    });
});
