import { afterEach, describe, expect, it, vi } from 'vitest';

import type { AgChartInstance, AgChartOptions, _ModuleSupport } from 'ag-charts-community';
import {
    COMMUNITY_GLOW_SERIES,
    type GlowSeriesCase,
    SERIES_GLOW,
    THEME_GLOW,
    XY_DATA,
    canvasImage,
    deproxy,
    differingBytes,
    getSeriesAt,
    getSeriesHasChangesOnHighlight,
    getSeriesNodeData,
    glowSeries,
    glowShadow,
    hoverDatum,
    hoverNode,
    setupMockCanvas,
    setupMockConsole,
    uncastGlows,
    waitForChartStability,
} from 'ag-charts-community-test';
import type { Shape } from 'ag-charts-core';

import { getFlowLinkData, getFlowNodeData } from '../test/enterpriseSeriesAccessors';
import { ENTERPRISE_GLOW_SERIES, HIERARCHY_GLOW_SERIES, RANGE, STAGES } from '../test/glowSeriesCases';
import { FLOW_DATA, OHLC_DATA, SHADOW, WATERFALL_DATA, collectShapes, createEnterpriseChart } from '../test/utils';
import { FlowProportionDatumType } from './flow-proportion/flowDatumIndex';

type HighlightNodeDatum = _ModuleSupport.HighlightNodeDatum;
type AnySeriesOptions = NonNullable<AgChartOptions['series']>[number];

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

/** What a series is counted by, beyond the options and data it shares with the render suite. */
const COUNTED: Record<string, Partial<SeriesCase>> = {
    'cone funnel': { count: STAGES.length - 1, noShadow: true },
    'hlc markers': { copies: 3 },
    // The area fill has no glow, so the markers are all that glow: one for each end of each range, and a hovered range
    // moves both of its markers to the highlight layer.
    'range-area markers': { copies: 2, count: RANGE.length * 2 },
    'area markers': { count: XY_DATA.length },
    // The nodes and links of a flow series are hovered through the parts below.
    'sankey nodes': { count: 4, hoverable: false },
    'sankey links': { count: FLOW_DATA.length, hoverable: false },
    'chord nodes': { count: 4, hoverable: false },
    'chord links': { count: FLOW_DATA.length, hoverable: false },
    // A hierarchy is hovered by node, not datum: hierarchyShadowGlowRender.test.ts covers its highlight copy and the cascade of the glow into its buckets.
    'treemap tile': { hoverable: false },
    'treemap group': { hoverable: false },
    sunburst: { hoverable: false },
};

/** The community series that are also run through an enterprise chart. */
const COMMUNITY_SERIES = new Set(['bubble', 'histogram', 'area markers', 'pie', 'donut']);

const fromCase = (testCase: GlowSeriesCase, extra: Partial<SeriesCase> = {}): SeriesCase => ({
    name: testCase.name,
    data: testCase.data,
    chartOptions: testCase.chartOptions,
    hoverable: testCase.hoverable,
    series: (glow, shadow) => glowSeries(testCase, { glow, shadow }),
    ...extra,
});

const WATERFALL = ENTERPRISE_GLOW_SERIES.find(({ name }) => name === 'waterfall')!;

const SERIES: SeriesCase[] = [
    ...COMMUNITY_GLOW_SERIES.filter(({ name }) => COMMUNITY_SERIES.has(name)),
    ...ENTERPRISE_GLOW_SERIES.filter((testCase) => testCase !== WATERFALL && !testCase.seriesShadowOnly),
    ...HIERARCHY_GLOW_SERIES,
]
    .map((testCase) => fromCase(testCase, COUNTED[testCase.name]))
    .concat(
        Object.entries({ positive: 3, negative: 1, total: 1 }).map(([kind, count]) =>
            fromCase(
                { ...WATERFALL, place: ({ glow, shadow }) => ({ item: { [kind]: { glow, shadow } } }) },
                { name: `waterfall ${kind}`, count, hoverable: false }
            )
        )
    );

/** Series that are not cartesian, so redraw every item when the hover moves where the other items glow. */
const REDRAWS_ALL_ITEMS = new Set([
    'pie',
    'donut',
    'pyramid',
    'radial-column',
    'radial-bar',
    'nightingale',
    'radar-line markers',
    'radar-area markers',
    'map-shape',
    'map-marker',
]);

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
        collectShapes(getSeriesAt(chart)[group]).filter(
            (shape) => shape.visible && shape.getCastShadow('glow') != null
        );

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

        // The markers of HLC and range area read the glow through a theme path for each of its options, `gap` among them.
        it.each([undefined, 0, 4])('casts a gap of %s from every shape that glows', async (gap) => {
            await create(testCase, { ...SERIES_GLOW, gap });

            const shapes = glowing();
            expect(shapes.length).toBeGreaterThan(0);
            for (const shape of shapes) expect(shape.fillGlow?.gap).toBe(gap);
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
            await hoverDatum(chart);
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
                const pixels = canvasImage(chart);
                chart.destroy();
                return pixels;
            };

            expect(differingBytes(await render(true), await render(false))).toBeGreaterThan(0);
        });

        it('keeps the series glow on the items that are not hovered, and takes it off the hovered one in place', async () => {
            await create(testCase, SERIES_GLOW);
            const before = glowing().length;
            expect(before).toBeGreaterThan(copies);

            await hoverDatum(chart);

            const inPlace = glowing();
            expect(inPlace).toHaveLength(before - copies);
            for (const shape of inPlace) expect(shape.fillGlow).toMatchObject(glowShadow(SERIES_GLOW));
            // The highlight copy casts the glow the hovered item gave up.
            expect(glowing('highlightGroup')).toHaveLength(copies);
        });
    });

    describe('hlc markers, hovered with a marker shadow', () => {
        const hlc = SERIES.find((testCase) => testCase.name === 'hlc markers')!;

        // The highlight copy casts only the glow; the marker `shadow` is cast in place, behind every series.
        it.each([
            ['no glow', undefined],
            ['a series glow', SERIES_GLOW],
        ])('casts the shadow in place and none from the highlight copy with %s', async (_name, glow) => {
            await create(hlc, glow, SHADOW);
            await hoverDatum(chart);

            const series = getSeriesAt(chart);
            const copies = collectShapes(series.highlightGroup).filter((shape) => shape.visible);
            expect(copies).toHaveLength(hlc.copies!);
            for (const copy of copies) expect(copy.fillShadow?.enabled).not.toBe(true);

            const inPlace = collectShapes(series.contentGroup).filter(
                (shape) => shape.visible && shape.fillShadow != null
            );
            expect(inPlace.length).toBeGreaterThanOrEqual(hlc.copies!);
            for (const shape of inPlace) expect(shape.fillShadow).toMatchObject(SHADOW);
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
            data: FLOW_DATA,
            parts: ['node', 'link'],
            series: flow('sankey'),
            partOf: FLOW_PART,
            hovered: (c) => getFlowNodeData(c)[0] as HighlightNodeDatum,
        },
        {
            name: 'chord',
            data: FLOW_DATA,
            parts: ['node', 'link'],
            series: flow('chord'),
            partOf: FLOW_PART,
            hovered: (c) => getFlowNodeData(c)[0] as HighlightNodeDatum,
        },
        {
            name: 'waterfall',
            data: WATERFALL_DATA,
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
            data: OHLC_DATA,
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
            await hoverNode(chart, testCase.hovered?.(chart) ?? getSeriesNodeData<HighlightNodeDatum>(chart)[0]);
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
                data: FLOW_DATA,
                series: flowSeries(type),
                hovered: (c) => getFlowNodeData(c)[0] as HighlightNodeDatum,
                partOf: FLOW_PART,
                part: 'node',
            },
            {
                name: `${type} link`,
                data: FLOW_DATA,
                series: flowSeries(type),
                hovered: (c) => getFlowLinkData(c)[0] as HighlightNodeDatum,
                partOf: FLOW_PART,
                part: 'link',
            },
        ]),
        // The `item.total` options style the subtotals as well as the totals.
        ...['positive', 'negative', 'subtotal'].map((itemType): HoverCase => ({
            name: `waterfall ${itemType}`,
            data: [...WATERFALL_DATA, { x: 'Total', y: 12 }],
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
            await hoverNode(chart, testCase.hovered(chart));

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
                await hoverNode(chart, testCase.hovered(chart));
                const pixels = canvasImage(chart);
                chart.destroy();
                return pixels;
            };

            expect(differingBytes(await render(true), await render(false))).toBeGreaterThan(0);
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

            await hoverNode(chart, testCase.hovered(chart));

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
            data: FLOW_DATA,
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
            data: WATERFALL_DATA,
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
            await hoverNode(chart, testCase.hovered(chart));
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
        const createFunnel = async (glow: object | undefined) => {
            chart = await createEnterpriseChart({
                data: STAGES,
                animation: { enabled: false },
                legend: { enabled: false },
                series: [{ type: 'cone-funnel', stageKey: 'stage', valueKey: 'value', glow }],
            } as AgChartOptions);
            await waitForChartStability(chart);
        };

        const raiseSeriesHighlight = async () => {
            const { ctx, id } = deproxy(chart);
            ctx.highlightManager.updateHighlight(id, {
                series: getSeriesAt(chart),
                itemId: 'series',
                datum: undefined,
                datumIndex: Number.NaN,
            });
            await waitForChartStability(chart);
        };

        const highlightSeries = async (glow: object | undefined) => {
            await createFunnel(glow);
            await raiseSeriesHighlight();
        };

        it('leaves the connectors of a series with a glow cached when it is highlighted', async () => {
            await highlightSeries({});

            expect(getSeriesHasChangesOnHighlight(chart)).toBe(false);
        });

        it.each([
            ['is disabled', { enabled: false }],
            ['is not set', undefined],
        ])('leaves a series with no state style cached where its glow %s', async (_name, glow) => {
            await highlightSeries(glow);

            expect(getSeriesHasChangesOnHighlight(chart)).toBe(false);
        });

        it('casts the connector glow from one object across updates, and from another when the glow option changes', async () => {
            const glowOf = () =>
                collectShapes(getSeriesAt(chart).contentGroup).find((shape) => shape.fillGlow?.enabled)?.fillGlow;
            await highlightSeries(SERIES_GLOW);
            const before = glowOf();
            expect(before).toBeDefined();

            const { ctx, id } = deproxy(chart);
            ctx.highlightManager.updateHighlight(id);
            await waitForChartStability(chart);
            expect(glowOf()).toBe(before);

            await chart.update({
                data: STAGES,
                animation: { enabled: false },
                legend: { enabled: false },
                series: [
                    { type: 'cone-funnel', stageKey: 'stage', valueKey: 'value', glow: { ...SERIES_GLOW, blur: 11 } },
                ],
            } as AgChartOptions);
            await waitForChartStability(chart);
            expect(glowOf()).not.toBe(before);
            expect(glowOf()).toMatchObject({ blur: 11 });
        });

        it('keeps the glow object of the connectors of a series with a glow, and does not make them dirty, when it is highlighted', async () => {
            await createFunnel(SERIES_GLOW);
            const connectors = collectShapes(getSeriesAt(chart).contentGroup).filter(
                (shape) => shape.fillGlow?.enabled
            );
            expect(connectors).toHaveLength(STAGES.length - 1);
            const before = connectors.map((shape) => shape.fillGlow);
            const spies = connectors.map((shape) => vi.spyOn(shape, 'markDirty'));

            await raiseSeriesHighlight();
            const { ctx, id } = deproxy(chart);
            ctx.highlightManager.updateHighlight(id);
            await waitForChartStability(chart);

            for (const [i, shape] of connectors.entries()) expect(shape.fillGlow).toBe(before[i]);
            expect(spies.map((spy) => spy.mock.calls.length)).toEqual(connectors.map(() => 0));
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

                // A series that redraws only the items a move changes leaves the rest cached; the others redraw all.
                it('redraws all items, or only the moved ones, where the other items glow', async () => {
                    await moveHover({ unhighlightedItem: { glow: {} } });

                    expect(getSeriesHasChangesOnHighlight(chart)).toBe(REDRAWS_ALL_ITEMS.has(testCase.name));
                });
            }
        );
    });
});
