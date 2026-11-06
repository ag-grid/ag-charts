import { afterEach, describe, expect, it } from 'vitest';

import type { AgChartInstance, AgChartOptions, _ModuleSupport } from 'ag-charts-community';
import {
    SERIES_GLOW,
    THEME_GLOW,
    deproxy,
    expectWarningsCalls,
    getSeriesAt,
    getSeriesHasChangesOnHighlight,
    getSeriesNodeData,
    glowShadow,
    setupMockCanvas,
    setupMockConsole,
    uncastGlows,
    waitForChartStability,
} from 'ag-charts-community-test';
import type { Shape } from 'ag-charts-core';

import { getFlowLinkData, getFlowNodeData } from '../test/enterpriseSeriesAccessors';
import { HIERARCHY_SHADOW_DATA, SHADOW, collectShapes, createEnterpriseChart } from '../test/utils';
import { FlowProportionDatumType } from './flow-proportion/flowDatumIndex';
import { ukData } from './map-test/ukData';
import ukTopology from './map-test/ukTopology.json';

type HighlightNodeDatum = _ModuleSupport.HighlightNodeDatum;
type AnySeriesOptions = NonNullable<AgChartOptions['series']>[number];

const FLOW = [
    { from: 'A', to: 'C', size: 8 },
    { from: 'A', to: 'D', size: 4 },
    { from: 'B', to: 'C', size: 5 },
];
const STAGES = [
    { stage: 'Visits', value: 100 },
    { stage: 'Sign-ups', value: 60 },
    { stage: 'Paid', value: 20 },
];
const GRID = [
    { x: 'a', y: 'p', value: 1 },
    { x: 'b', y: 'p', value: 3 },
    { x: 'a', y: 'q', value: 2 },
    { x: 'b', y: 'q', value: 5 },
];
const POLAR = [
    { quarter: 'Q1', value: 5, low: 2 },
    { quarter: 'Q2', value: 8, low: 3 },
    { quarter: 'Q3', value: 3, low: 1 },
];
const RANGE = [
    { x: 'Q1', low: 2, high: 5 },
    { x: 'Q2', low: 3, high: 8 },
    { x: 'Q3', low: 1, high: 3 },
];
const OHLC = [
    { x: 'Q1', open: 6, high: 7, low: 3, close: 4 },
    { x: 'Q2', open: 5, high: 7, low: 4, close: 6 },
    { x: 'Q3', open: 4, high: 5, low: 4, close: 4.5 },
];
const OHLC_KEYS = { xKey: 'x', openKey: 'open', highKey: 'high', lowKey: 'low', closeKey: 'close' };
const BOX_PLOT = [
    { x: 'Q1', min: 3, q1: 4, median: 5, q3: 6, max: 7 },
    { x: 'Q2', min: 4, q1: 5, median: 6, q3: 7, max: 8 },
];
const WATERFALL = [
    { x: 'Start', y: 10 },
    { x: 'Down', y: -4 },
    { x: 'Up', y: 6 },
];
const XY = [
    { x: 1, y: 5, size: 10 },
    { x: 2, y: 8, size: 20 },
    { x: 3, y: 3, size: 30 },
];
const SLICES = [
    { category: 'A', value: 5 },
    { category: 'B', value: 8 },
    { category: 'C', value: 3 },
];
const HISTOGRAM = [{ x: 1 }, { x: 2 }, { x: 2.5 }, { x: 4 }, { x: 5 }, { x: 5.5 }, { x: 7 }];

interface SeriesCase {
    name: string;
    /** The series options, with `glow` placed where this series reads it from, and a `shadow` beside it where it has one. */
    series: (glow: object | undefined, shadow?: object) => AnySeriesOptions;
    data: object[];
    /** How many shapes of the series cast the glow, where only some of its shapes do. */
    count?: number;
    chartOptions?: object;
    /** The shapes the series casts the glow from have no `shadow` option to cast beside it. */
    noShadow?: boolean;
    /** The series has a datum to hover, and options to set on a highlight state. */
    hoverable?: boolean;
    /** How many shapes the hover moves to the highlight layer: the three markers of an HLC item. */
    copies?: number;
}

const SERIES: SeriesCase[] = [
    {
        name: 'bubble',
        data: XY,
        hoverable: true,
        series: (glow, shadow) => ({ type: 'bubble', xKey: 'x', yKey: 'y', sizeKey: 'size', glow, shadow }),
    },
    {
        name: 'histogram',
        data: HISTOGRAM,
        series: (glow, shadow) => ({ type: 'histogram', xKey: 'x', glow, shadow }),
    },
    {
        name: 'range-bar',
        data: RANGE,
        hoverable: true,
        series: (glow, shadow) => ({
            type: 'range-bar',
            xKey: 'x',
            yLowKey: 'low',
            yHighKey: 'high',
            glow,
            shadow,
        }),
    },
    {
        name: 'box-plot',
        data: BOX_PLOT,
        hoverable: true,
        series: (glow, shadow) => ({
            type: 'box-plot',
            xKey: 'x',
            minKey: 'min',
            q1Key: 'q1',
            medianKey: 'median',
            q3Key: 'q3',
            maxKey: 'max',
            glow,
            shadow,
        }),
    },
    {
        name: 'candlestick',
        data: OHLC,
        hoverable: true,
        series: (glow, shadow) => ({ type: 'candlestick', ...OHLC_KEYS, glow, shadow }),
    },
    {
        name: 'ohlc',
        data: OHLC,
        hoverable: true,
        series: (glow, shadow) => ({ type: 'ohlc', ...OHLC_KEYS, glow, shadow }),
    },
    {
        name: 'hlc markers',
        data: OHLC,
        hoverable: true,
        copies: 3,
        series: (glow, shadow) => ({
            type: 'hlc',
            xKey: 'x',
            highKey: 'high',
            lowKey: 'low',
            closeKey: 'close',
            marker: { enabled: true, glow, shadow },
        }),
    },
    {
        name: 'funnel',
        hoverable: true,
        data: STAGES,
        series: (glow, shadow) => ({ type: 'funnel', stageKey: 'stage', valueKey: 'value', glow, shadow }),
    },
    {
        name: 'cone funnel connectors',
        data: STAGES,
        count: STAGES.length - 1,
        noShadow: true,
        series: (glow) => ({ type: 'cone-funnel', stageKey: 'stage', valueKey: 'value', glow }),
    },
    {
        name: 'heatmap',
        hoverable: true,
        data: GRID,
        series: (glow, shadow) => ({
            type: 'heatmap',
            xKey: 'x',
            yKey: 'y',
            colorKey: 'value',
            glow,
            shadow,
        }),
    },
    {
        name: 'pyramid',
        hoverable: true,
        data: STAGES,
        series: (glow, shadow) => ({ type: 'pyramid', stageKey: 'stage', valueKey: 'value', glow, shadow }),
    },
    {
        name: 'radial-column',
        hoverable: true,
        data: POLAR,
        series: (glow, shadow) => ({
            type: 'radial-column',
            angleKey: 'quarter',
            radiusKey: 'value',
            glow,
            shadow,
        }),
    },
    {
        name: 'radial-bar',
        hoverable: true,
        data: POLAR,
        series: (glow, shadow) => ({ type: 'radial-bar', angleKey: 'value', radiusKey: 'quarter', glow, shadow }),
    },
    {
        name: 'nightingale',
        hoverable: true,
        data: POLAR,
        series: (glow, shadow) => ({ type: 'nightingale', angleKey: 'quarter', radiusKey: 'value', glow, shadow }),
    },
    {
        name: 'radar-line markers',
        hoverable: true,
        data: POLAR,
        series: (glow, shadow) => ({
            type: 'radar-line',
            angleKey: 'quarter',
            radiusKey: 'value',
            marker: { enabled: true, glow, shadow },
        }),
    },
    {
        name: 'radar-area markers',
        hoverable: true,
        data: POLAR,
        series: (glow, shadow) => ({
            type: 'radar-area',
            angleKey: 'quarter',
            radiusKey: 'value',
            marker: { enabled: true, glow, shadow },
        }),
    },
    {
        // The area fill has no glow, so the markers are all that glow: one for each end of each range, and a hovered
        // range moves both of its markers to the highlight layer.
        name: 'range-area markers',
        hoverable: true,
        copies: 2,
        data: RANGE,
        count: RANGE.length * 2,
        series: (glow, shadow) => ({
            type: 'range-area',
            xKey: 'x',
            yLowKey: 'low',
            yHighKey: 'high',
            marker: { enabled: true, glow, shadow },
        }),
    },
    {
        name: 'area markers',
        hoverable: true,
        data: XY,
        count: XY.length,
        series: (glow, shadow) => ({
            type: 'area',
            xKey: 'x',
            yKey: 'y',
            marker: { enabled: true, glow, shadow },
        }),
    },
    {
        name: 'pie',
        hoverable: true,
        data: SLICES,
        series: (glow, shadow) => ({ type: 'pie', angleKey: 'value', glow, shadow }),
    },
    {
        name: 'donut',
        hoverable: true,
        data: SLICES,
        series: (glow, shadow) => ({ type: 'donut', angleKey: 'value', glow, shadow }),
    },
    {
        name: 'waterfall positive',
        data: WATERFALL,
        count: 2,
        series: (glow, shadow) => ({
            type: 'waterfall',
            xKey: 'x',
            yKey: 'y',
            item: { positive: { glow, shadow } },
        }),
    },
    {
        name: 'waterfall negative',
        data: WATERFALL,
        count: 1,
        series: (glow, shadow) => ({
            type: 'waterfall',
            xKey: 'x',
            yKey: 'y',
            item: { negative: { glow, shadow } },
        }),
    },
    {
        name: 'waterfall total',
        data: [...WATERFALL, { x: 'Total', y: 12 }],
        count: 1,
        series: (glow, shadow) => ({
            type: 'waterfall',
            xKey: 'x',
            yKey: 'y',
            item: { total: { glow, shadow } },
            totals: [{ totalType: 'subtotal', index: 3, axisLabel: 'Total' }],
        }),
    },
    {
        name: 'sankey nodes',
        data: FLOW,
        count: 4,
        series: (glow, shadow) => ({
            type: 'sankey',
            fromKey: 'from',
            toKey: 'to',
            sizeKey: 'size',
            node: { glow, shadow },
        }),
    },
    {
        name: 'sankey links',
        data: FLOW,
        count: FLOW.length,
        series: (glow, shadow) => ({
            type: 'sankey',
            fromKey: 'from',
            toKey: 'to',
            sizeKey: 'size',
            link: { glow, shadow },
        }),
    },
    {
        name: 'chord nodes',
        data: FLOW,
        count: 4,
        series: (glow, shadow) => ({
            type: 'chord',
            fromKey: 'from',
            toKey: 'to',
            sizeKey: 'size',
            node: { glow, shadow },
        }),
    },
    {
        name: 'chord links',
        data: FLOW,
        count: FLOW.length,
        series: (glow, shadow) => ({
            type: 'chord',
            fromKey: 'from',
            toKey: 'to',
            sizeKey: 'size',
            link: { glow, shadow },
        }),
    },
    {
        name: 'map-shape',
        hoverable: true,
        data: ukData,
        chartOptions: { topology: ukTopology },
        series: (glow, shadow) => ({ type: 'map-shape', idKey: 'name', glow, shadow }),
    },
    {
        name: 'map-marker',
        hoverable: true,
        data: ukData,
        chartOptions: { topology: ukTopology },
        series: (glow, shadow) => ({ type: 'map-marker', idKey: 'name', glow, shadow }),
    },
];

/** Series with no `highlightedSeries` or `unhighlightedSeries`. */
const NO_SERIES_STATES = new Set(['funnel', 'pyramid']);

describe('series-level glow (enterprise series)', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: AgChartInstance;

    afterEach(() => {
        chart?.destroy();
    });

    const create = async (testCase: SeriesCase, glow: object | undefined, shadow?: object, highlight?: object) => {
        const series = { ...testCase.series(glow, shadow), ...(highlight ? { highlight } : {}) };
        chart = await createEnterpriseChart({
            data: testCase.data,
            animation: { enabled: false },
            legend: { enabled: false },
            ...testCase.chartOptions,
            series: [series],
        } as AgChartOptions);
        await waitForChartStability(chart);
    };

    /** The shapes that cast in the glow slot, in the content and in the highlight layer. */
    const glowing = (group: 'contentGroup' | 'highlightGroup' = 'contentGroup') =>
        collectShapes(getSeriesAt(chart)[group]).filter((shape) => shape.visible && shape.fillGlow?.enabled === true);

    const canvasPixels = () => {
        const { scene } = deproxy(chart).ctx;
        return scene.canvas.context.getImageData(0, 0, scene.canvas.width, scene.canvas.height).data;
    };

    /** How many bytes of two renders differ. */
    const differing = (a: ArrayLike<number>, b: ArrayLike<number>) => {
        let count = 0;
        for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) count++;
        return count;
    };

    /** A highlight glow that shows against any series, drawn only where the hovered item's own copy casts it. */
    const HIGHLIGHT_GLOW = { fill: '#00cc00', fillOpacity: 1, blur: 2, spread: 8 };

    describe.each(SERIES)('$name', (testCase) => {
        it('casts the glow from its shapes, in the glow slot', async () => {
            await create(testCase, SERIES_GLOW);

            const shapes = glowing();
            expect(shapes.length).toBeGreaterThan(0);
            if (testCase.count != null) expect(shapes).toHaveLength(testCase.count);
            for (const shape of shapes) {
                expect(shape.fillGlow).toMatchObject(glowShadow(SERIES_GLOW));
                expect(shape.fillShadow?.enabled).not.toBe(true);
            }
        });

        it('puts every glowing shape in a group that casts it', async () => {
            await create(testCase, SERIES_GLOW);

            expect(uncastGlows(getSeriesAt(chart).contentGroup)).toEqual([]);
        });

        it('casts the theme glow for a glow with no fields', async () => {
            await create(testCase, {});

            const shapes = glowing();
            expect(shapes.length).toBeGreaterThan(0);
            for (const shape of shapes) expect(shape.fillGlow).toMatchObject(glowShadow(THEME_GLOW));
        });

        it.each([
            ['is disabled', { ...SERIES_GLOW, enabled: false }],
            ['is not set', undefined],
        ])('casts no glow where the glow %s', async (_name, glow) => {
            await create(testCase, glow);

            expect(glowing()).toHaveLength(0);
        });

        it.skipIf(testCase.noShadow)(
            'casts the shadow and the glow of a shape together, each in its own slot',
            async () => {
                await create(testCase, SERIES_GLOW, SHADOW);

                const shapes = glowing();
                expect(shapes.length).toBeGreaterThan(0);
                for (const shape of shapes) {
                    expect(shape.fillGlow).toMatchObject(glowShadow(SERIES_GLOW));
                    expect(shape.fillShadow).toMatchObject(SHADOW);
                }
            }
        );
    });

    describe.each(SERIES.filter((testCase) => testCase.hoverable))('$name, hovered', (testCase) => {
        const copies = testCase.copies ?? 1;
        const hover = async (glow: object | undefined, highlight: object) => {
            await create(testCase, glow, undefined, highlight);
            const { ctx, id } = deproxy(chart);
            ctx.highlightManager.updateHighlight(id, getSeriesNodeData<HighlightNodeDatum>(chart)[0]);
            await waitForChartStability(chart);
        };

        it('casts the highlight copy from highlightedItem over the series glow, field by field', async () => {
            await hover(SERIES_GLOW, { highlightedItem: { glow: { blur: 9 } } });

            const drawn = glowing('highlightGroup');
            expect(drawn).toHaveLength(copies);
            for (const copy of drawn) {
                expect(copy.fillGlow).toMatchObject(glowShadow({ ...SERIES_GLOW, blur: 9 }));
                expect(copy.fillShadow?.enabled).not.toBe(true);
            }
        });

        // What the highlight layer draws is not what is read from the scene: a copy in a group that casts no glow reads
        // as glowing and draws nothing.
        it('puts every glowing shape of both layers in a group that casts it', async () => {
            await hover(SERIES_GLOW, {
                highlightedItem: { glow: { blur: 9 } },
                unhighlightedItem: { glow: { blur: 6 } },
            });

            const { contentGroup, highlightGroup } = getSeriesAt(chart);
            expect(glowing('highlightGroup').length).toBeGreaterThan(0);
            expect(uncastGlows(contentGroup)).toEqual([]);
            expect(uncastGlows(highlightGroup)).toEqual([]);
        });

        it('draws the glow of the highlight copy', async () => {
            const render = async (enabled: boolean) => {
                await hover(undefined, { highlightedItem: { glow: { ...HIGHLIGHT_GLOW, enabled } } });
                const pixels = Array.from(canvasPixels());
                chart.destroy();
                return pixels;
            };

            expect(differing(await render(true), await render(false))).toBeGreaterThan(0);
        });

        it('keeps the series glow on the items that are not hovered, and takes it off the hovered one in place', async () => {
            await create(testCase, SERIES_GLOW);
            const before = glowing().length;
            expect(before).toBeGreaterThan(copies);

            const { ctx, id } = deproxy(chart);
            ctx.highlightManager.updateHighlight(id, getSeriesNodeData<HighlightNodeDatum>(chart)[0]);
            await waitForChartStability(chart);

            const inPlace = glowing();
            expect(inPlace).toHaveLength(before - copies);
            for (const shape of inPlace) expect(shape.fillGlow).toMatchObject(glowShadow(SERIES_GLOW));
            // The highlight copy casts the glow the hovered item gave up.
            expect(glowing('highlightGroup')).toHaveLength(copies);
        });
    });

    describe('hlc markers, hovered with a marker shadow', () => {
        const hlc = SERIES.find((testCase) => testCase.name === 'hlc markers')!;

        // Only the glow is cast by the highlight copy alone; the marker `shadow` is cast by it as before `glow`.
        it.each([
            ['no glow', undefined],
            ['a series glow', SERIES_GLOW],
        ])('casts the shadow from the highlight copy with %s', async (_name, glow) => {
            await create(hlc, glow, SHADOW);
            const { ctx, id } = deproxy(chart);
            ctx.highlightManager.updateHighlight(id, getSeriesNodeData<HighlightNodeDatum>(chart)[0]);
            await waitForChartStability(chart);

            const copies = collectShapes(getSeriesAt(chart).highlightGroup).filter((shape) => shape.visible);
            expect(copies).toHaveLength(hlc.copies!);
            for (const copy of copies) expect(copy.fillShadow).toMatchObject(SHADOW);
        });
    });

    /** A series whose `glow` is set on several parts that share one `highlight`, such as the nodes and links of a flow. */
    interface PartsCase {
        name: string;
        data: object[];
        parts: string[];
        /** The series options, with the `glow` of each part, and the one common to all parts where the series has one. */
        series: (glow: Record<string, object | undefined>, common?: object) => AnySeriesOptions;
        /** The part that a shape casts for. */
        partOf: (shape: Shape) => string | undefined;
        /** The datum to hover, where the series does not keep its node data in one list. */
        hovered?: (chart: AgChartInstance) => HighlightNodeDatum;
        common?: boolean;
    }

    const FLOW_PART = (shape: Shape) =>
        (shape.datum as { type?: FlowProportionDatumType } | undefined)?.type === FlowProportionDatumType.Link
            ? 'link'
            : 'node';
    const ITEM_PART = (shape: Shape) => (shape.datum as { itemType?: string } | undefined)?.itemType;

    const flow = (type: 'sankey' | 'chord') => (glow: Record<string, object | undefined>) =>
        ({
            type,
            fromKey: 'from',
            toKey: 'to',
            sizeKey: 'size',
            node: { glow: glow.node },
            link: { glow: glow.link },
        }) as AnySeriesOptions;

    const PARTS: PartsCase[] = [
        {
            name: 'sankey',
            data: FLOW,
            parts: ['node', 'link'],
            series: flow('sankey'),
            partOf: FLOW_PART,
            hovered: (c) => getFlowNodeData(c)[0] as HighlightNodeDatum,
        },
        {
            name: 'chord',
            data: FLOW,
            parts: ['node', 'link'],
            series: flow('chord'),
            partOf: FLOW_PART,
            hovered: (c) => getFlowNodeData(c)[0] as HighlightNodeDatum,
        },
        {
            name: 'waterfall',
            data: WATERFALL,
            parts: ['positive', 'negative'],
            partOf: ITEM_PART,
            series: (glow) => ({
                type: 'waterfall',
                xKey: 'x',
                yKey: 'y',
                item: { positive: { glow: glow.positive }, negative: { glow: glow.negative } },
            }),
        },
        {
            name: 'hlc',
            data: OHLC,
            parts: ['high', 'low', 'close'],
            partOf: ITEM_PART,
            common: true,
            series: (glow, common) => ({
                type: 'hlc',
                xKey: 'x',
                highKey: 'high',
                lowKey: 'low',
                closeKey: 'close',
                marker: { enabled: true, glow: common },
                item: {
                    high: { marker: { glow: glow.high } },
                    low: { marker: { glow: glow.low } },
                    close: { marker: { glow: glow.close } },
                },
            }),
        },
        {
            name: 'range-area',
            data: RANGE,
            parts: ['low', 'high'],
            partOf: ITEM_PART,
            common: true,
            series: (glow, common) => ({
                type: 'range-area',
                xKey: 'x',
                yLowKey: 'low',
                yHighKey: 'high',
                marker: { enabled: true, glow: common },
                item: { low: { marker: { glow: glow.low } }, high: { marker: { glow: glow.high } } },
            }),
        },
    ];

    describe.each(PARTS)('$name, a part with its own glow', (testCase) => {
        const [first, second] = testCase.parts;

        /** The parts that cast a glow at rest, then with the first datum hovered, in place or from the highlight layer. */
        const glowingParts = async (glow: Record<string, object | undefined>, common?: object) => {
            chart = await createEnterpriseChart({
                data: testCase.data,
                animation: { enabled: false },
                legend: { enabled: false },
                series: [testCase.series(glow, common)],
            } as AgChartOptions);
            await waitForChartStability(chart);
            const parts = () =>
                new Set(
                    (['contentGroup', 'highlightGroup'] as const).flatMap((group) =>
                        collectShapes(getSeriesAt(chart)[group])
                            .filter((shape) => shape.visible && shape.fillGlow?.enabled === true)
                            .map(testCase.partOf)
                    )
                );

            const atRest = parts();
            const { ctx, id } = deproxy(chart);
            ctx.highlightManager.updateHighlight(
                id,
                testCase.hovered?.(chart) ?? getSeriesNodeData<HighlightNodeDatum>(chart)[0]
            );
            await waitForChartStability(chart);
            return { atRest, hovered: parts() };
        };

        it('glows at rest and on hover for that part alone', async () => {
            const { atRest, hovered } = await glowingParts({ [first]: {} });

            expect(atRest).toEqual(new Set([first]));
            expect(hovered).toEqual(new Set([first]));
        });

        it('stays off where it is disabled while another part glows', async () => {
            const { atRest, hovered } = await glowingParts({ [first]: {}, [second]: { enabled: false } });

            expect(atRest).toEqual(new Set([first]));
            expect(hovered).toEqual(new Set([first]));
        });

        it.skipIf(!testCase.common)('follows the glow of a part over the glow common to all', async () => {
            const { atRest, hovered } = await glowingParts({ [second]: { enabled: false } }, {});

            const expected = new Set(testCase.parts.filter((part) => part !== second));
            expect(atRest).toEqual(expected);
            expect(hovered).toEqual(expected);
        });
    });
    /** A hovered item of a series that has parts, and what each part casts: the highlight copy and the items left. */
    interface HoverCase {
        name: string;
        data: object[];
        /** The series options, with `glow` on every part and the shared `highlight` buckets. */
        series: (glow: object, highlight: object) => AnySeriesOptions;
        /** The datum to hover. */
        hovered: (chart: AgChartInstance) => HighlightNodeDatum;
        /** The part that a shape casts for, and the one that the hovered datum belongs to. */
        partOf: (shape: Shape) => string | undefined;
        part: string;
    }

    const flowSeries = (type: 'sankey' | 'chord') => (glow: object, highlight: object) =>
        ({
            type,
            fromKey: 'from',
            toKey: 'to',
            sizeKey: 'size',
            node: { glow },
            link: { glow },
            highlight,
        }) as AnySeriesOptions;

    const waterfallSeries = (glow: object, highlight: object) =>
        ({
            type: 'waterfall',
            xKey: 'x',
            yKey: 'y',
            item: { positive: { glow }, negative: { glow }, total: { glow } },
            totals: [{ totalType: 'subtotal', index: 3, axisLabel: 'Total' }],
            highlight,
        }) as AnySeriesOptions;

    const waterfallDatum = (itemType: string) => (c: AgChartInstance) =>
        getSeriesNodeData<HighlightNodeDatum & { itemType: string }>(c).find(
            (datum) => datum.itemType === itemType
        ) as HighlightNodeDatum;

    const HOVERS: HoverCase[] = [
        ...(['sankey', 'chord'] as const).flatMap((type): HoverCase[] => [
            {
                name: `${type} node`,
                data: FLOW,
                series: flowSeries(type),
                hovered: (c) => getFlowNodeData(c)[0] as HighlightNodeDatum,
                partOf: FLOW_PART,
                part: 'node',
            },
            {
                name: `${type} link`,
                data: FLOW,
                series: flowSeries(type),
                hovered: (c) => getFlowLinkData(c)[0] as HighlightNodeDatum,
                partOf: FLOW_PART,
                part: 'link',
            },
        ]),
        // The `item.total` options style the subtotals as well as the totals.
        ...['positive', 'negative', 'subtotal'].map((itemType): HoverCase => ({
            name: `waterfall ${itemType}`,
            data: [...WATERFALL, { x: 'Total', y: 12 }],
            series: waterfallSeries,
            hovered: waterfallDatum(itemType),
            partOf: ITEM_PART,
            part: itemType,
        })),
    ];

    describe.each(HOVERS)('$name, hovered', (testCase) => {
        const glowShapes = (group: 'contentGroup' | 'highlightGroup') =>
            collectShapes(getSeriesAt(chart)[group]).filter(
                (shape) => shape.visible && shape.fillGlow?.enabled === true
            );

        it('puts every glowing shape of both layers in a group that casts it', async () => {
            chart = await createEnterpriseChart({
                data: testCase.data,
                animation: { enabled: false },
                legend: { enabled: false },
                series: [
                    testCase.series(SERIES_GLOW, {
                        highlightedItem: { glow: { blur: 9 } },
                        unhighlightedItem: { glow: { blur: 6 } },
                    }),
                ],
            } as AgChartOptions);
            await waitForChartStability(chart);
            const { ctx, id } = deproxy(chart);
            ctx.highlightManager.updateHighlight(id, testCase.hovered(chart));
            await waitForChartStability(chart);

            const { contentGroup, highlightGroup } = getSeriesAt(chart);
            expect(glowShapes('highlightGroup').length).toBeGreaterThan(0);
            expect(uncastGlows(contentGroup)).toEqual([]);
            expect(uncastGlows(highlightGroup)).toEqual([]);
        });

        it('draws the glow of the highlight copy', async () => {
            const render = async (enabled: boolean) => {
                chart = await createEnterpriseChart({
                    data: testCase.data,
                    animation: { enabled: false },
                    legend: { enabled: false },
                    series: [
                        testCase.series(
                            { enabled: false },
                            { highlightedItem: { glow: { ...HIGHLIGHT_GLOW, enabled } } }
                        ),
                    ],
                } as AgChartOptions);
                await waitForChartStability(chart);
                const { ctx, id } = deproxy(chart);
                ctx.highlightManager.updateHighlight(id, testCase.hovered(chart));
                await waitForChartStability(chart);
                const pixels = Array.from(canvasPixels());
                chart.destroy();
                return pixels;
            };

            expect(differing(await render(true), await render(false))).toBeGreaterThan(0);
        });

        it('casts the highlight copy from highlightedItem and the other items from unhighlightedItem, over the series glow', async () => {
            chart = await createEnterpriseChart({
                data: testCase.data,
                animation: { enabled: false },
                legend: { enabled: false },
                series: [
                    testCase.series(SERIES_GLOW, {
                        highlightedItem: { glow: { blur: 9 } },
                        unhighlightedItem: { glow: { blur: 6 } },
                    }),
                ],
            } as AgChartOptions);
            await waitForChartStability(chart);
            const before = glowShapes('contentGroup').length;
            expect(before).toBeGreaterThan(1);

            const { ctx, id } = deproxy(chart);
            ctx.highlightManager.updateHighlight(id, testCase.hovered(chart));
            await waitForChartStability(chart);

            // A flow also redraws the nodes and links that the hovered part connects to, but their in-place copies
            // cast their glow already, so the highlight layer holds the hovered copy alone.
            const drawn = glowShapes('highlightGroup');
            expect(drawn).toHaveLength(1);
            expect(testCase.partOf(drawn[0])).toBe(testCase.part);
            expect(drawn[0].fillGlow).toMatchObject(glowShadow({ ...SERIES_GLOW, blur: 9 }));

            // The hovered item gave its glow up to the copy, and every other item takes the unhighlighted one.
            const inPlace = glowShapes('contentGroup');
            expect(inPlace).toHaveLength(before - 1);
            for (const shape of inPlace) expect(shape.fillGlow).toMatchObject(glowShadow({ ...SERIES_GLOW, blur: 6 }));
        });
    });

    // A bucket glow that the user sets applies to every part, whether or not the part has a glow of its own; a bucket
    // with no glow leaves each part to its own (the theme leaves its `enabled` unset).
    interface BucketCase {
        name: string;
        data: object[];
        /** The series options, with a glow on the first part alone. */
        series: (highlight: object) => AnySeriesOptions;
        /** The datum of the part with no glow of its own. */
        hovered: (chart: AgChartInstance) => HighlightNodeDatum;
        partOf: (shape: Shape) => string | undefined;
        part: string;
    }

    const BUCKETS: BucketCase[] = [
        ...(['sankey', 'chord'] as const).map((type): BucketCase => ({
            name: type,
            data: FLOW,
            series: (highlight) =>
                ({
                    type,
                    fromKey: 'from',
                    toKey: 'to',
                    sizeKey: 'size',
                    node: { glow: {} },
                    highlight,
                }) as AnySeriesOptions,
            hovered: (c) => getFlowLinkData(c)[0] as HighlightNodeDatum,
            partOf: FLOW_PART,
            part: 'link',
        })),
        {
            name: 'waterfall',
            data: WATERFALL,
            series: (highlight) =>
                ({
                    type: 'waterfall',
                    xKey: 'x',
                    yKey: 'y',
                    item: { positive: { glow: {} } },
                    highlight,
                }) as AnySeriesOptions,
            hovered: waterfallDatum('negative'),
            partOf: ITEM_PART,
            part: 'negative',
        },
    ];

    describe.each(BUCKETS)('$name, a bucket glow on a part with no glow', (testCase) => {
        const hoveredGlows = async (highlight: object) => {
            chart = await createEnterpriseChart({
                data: testCase.data,
                animation: { enabled: false },
                legend: { enabled: false },
                series: [testCase.series(highlight)],
            } as AgChartOptions);
            await waitForChartStability(chart);
            const { ctx, id } = deproxy(chart);
            ctx.highlightManager.updateHighlight(id, testCase.hovered(chart));
            await waitForChartStability(chart);
            return collectShapes(getSeriesAt(chart).highlightGroup).filter(
                (shape) => shape.visible && shape.fillGlow?.enabled === true
            );
        };

        it('lights the hovered part', async () => {
            const drawn = await hoveredGlows({ highlightedItem: { glow: { fill: 'red' } } });

            expect(drawn).toHaveLength(1);
            expect(testCase.partOf(drawn[0])).toBe(testCase.part);
            expect(drawn[0].fillGlow).toMatchObject(glowShadow({ ...THEME_GLOW, fill: 'red' }));
        });

        it('lights the hovered part when it is enabled', async () => {
            const drawn = await hoveredGlows({ highlightedItem: { glow: { enabled: true } } });

            expect(drawn.map(testCase.partOf)).toEqual([testCase.part]);
        });

        it('leaves the part dark where the bucket has no glow, and where it is disabled', async () => {
            expect(await hoveredGlows({})).toHaveLength(0);
            expect(await hoveredGlows({ highlightedItem: { glow: { enabled: false, fill: 'red' } } })).toHaveLength(0);
        });
    });

    describe('redraw on hover', () => {
        // A cone funnel has no highlight options, so no state style makes it redraw. Highlighting the whole series, as
        // a legend item of the series does, redraws no one item, so the glow on its connectors is all that can.
        const highlightSeries = async (glow: object | undefined) => {
            chart = await createEnterpriseChart({
                data: STAGES,
                animation: { enabled: false },
                legend: { enabled: false },
                series: [{ type: 'cone-funnel', stageKey: 'stage', valueKey: 'value', glow }],
            } as AgChartOptions);
            await waitForChartStability(chart);
            const { ctx, id } = deproxy(chart);
            ctx.highlightManager.updateHighlight(id, {
                series: getSeriesAt(chart),
                itemId: 'series',
                datum: undefined,
                datumIndex: Number.NaN,
            });
            await waitForChartStability(chart);
        };

        it('redraws a series with a glow when it is highlighted', async () => {
            await highlightSeries({});

            expect(getSeriesHasChangesOnHighlight(chart)).toBe(true);
        });

        it.each([
            ['is disabled', { enabled: false }],
            ['is not set', undefined],
        ])('leaves a series with no state style cached where its glow %s', async (_name, glow) => {
            await highlightSeries(glow);

            expect(getSeriesHasChangesOnHighlight(chart)).toBe(false);
        });

        // Only the highlight layer's copy casts the hovered item's glow, so a move redraws no in-place node.
        // A heatmap is left out: its cells have selection styling, so it always redraws.
        describe.each(SERIES.filter((testCase) => testCase.hoverable && testCase.name !== 'heatmap'))(
            '$name, moving between items',
            (testCase) => {
                const moveHover = async (highlight: object) => {
                    await create(testCase, undefined, undefined, highlight);
                    const { ctx, id } = deproxy(chart);
                    const nodeData = getSeriesNodeData<HighlightNodeDatum>(chart);
                    // A series with several nodes to an item, such as an HLC item, has the next item's after its own.
                    const first = nodeData[0];
                    const second = nodeData.find((datum) => datum.datumIndex !== first.datumIndex)!;
                    ctx.highlightManager.updateHighlight(id, first);
                    await waitForChartStability(chart);
                    ctx.highlightManager.updateHighlight(id, second);
                    await waitForChartStability(chart);
                };

                it('stays cached where only the highlighted item glows', async () => {
                    await moveHover({ highlightedItem: { glow: {} } });

                    expect(getSeriesHasChangesOnHighlight(chart)).toBe(false);
                });

                // The state of the other series casts on no item of this one, so a move changes nothing it casts.
                it.skipIf(NO_SERIES_STATES.has(testCase.name))(
                    'stays cached where only the unhighlighted series glows',
                    async () => {
                        await moveHover({ unhighlightedSeries: { glow: {} } });

                        expect(getSeriesHasChangesOnHighlight(chart)).toBe(false);
                    }
                );

                it('redraws where the other items glow', async () => {
                    await moveHover({ unhighlightedItem: { glow: {} } });

                    expect(getSeriesHasChangesOnHighlight(chart)).toBe(true);
                });
            }
        );
    });

    // Treemap and sunburst take their glow from the highlight buckets alone, until they support a series-level one.
    describe.each([
        { name: 'treemap tile', series: { tile: { glow: {} } }, key: 'tile.glow' },
        { name: 'treemap group', series: { group: { glow: {} } }, key: 'group.glow' },
        { name: 'sunburst', series: { glow: {} }, key: 'glow' },
    ] as const)('$name', ({ name, series, key }) => {
        it('drops a series-level glow with a warning, and casts none', async () => {
            const type = name.split(' ')[0];
            chart = await createEnterpriseChart({
                data: HIERARCHY_SHADOW_DATA,
                animation: { enabled: false },
                legend: { enabled: false },
                series: [{ type, labelKey: 'name', sizeKey: 'size', ...series }],
            } as AgChartOptions);
            await waitForChartStability(chart);

            expectWarningsCalls().toEqual([[`AG Charts - Unknown option \`series[0].${key}\`, ignoring.`]]);
            expect(collectShapes(getSeriesAt(chart).contentGroup).filter((shape) => shape.fillGlow != null)).toEqual(
                []
            );
            expect(uncastGlows(getSeriesAt(chart).contentGroup)).toEqual([]);
        });
    });
});
