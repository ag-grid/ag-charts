import { afterEach, describe, expect, it } from 'vitest';

import type { AgChartInstance, AgChartOptions, AgGlowOptions, _ModuleSupport } from 'ag-charts-community';
import {
    deproxy,
    getSeriesAt,
    getSeriesHasChangesOnHighlight,
    getSeriesNodeData,
    getSeriesSelectionNodes,
    glowShadow,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from 'ag-charts-community-test';
import type { Shape } from 'ag-charts-core';

import { getFlowLinkData, getFlowNodeData } from '../test/enterpriseSeriesAccessors';
import { getHierarchyRootNode } from '../test/seriesAccessors';
import { HIERARCHY_SHADOW_DATA, SHADOW, collectShapes, createEnterpriseChart } from '../test/utils';
import { FlowProportionDatumType } from './flow-proportion/flowDatumIndex';
import { ukData } from './map-test/ukData';
import ukTopology from './map-test/ukTopology.json';

type HighlightNodeDatum = _ModuleSupport.HighlightNodeDatum;
type AnySeriesOptions = NonNullable<AgChartOptions['series']>[number];

/** The series-level glow, with every field set, so that a bucket's field shows through only where it overrides. */
const GLOW: AgGlowOptions = { enabled: true, fill: '#aa0000', fillOpacity: 0.5, blur: 5, spread: 3 };
/** What a glow with no fields of its own casts, from the glow theme defaults. */
const THEME_GLOW = { enabled: true, fillOpacity: 0.4, blur: 2, spread: 4 };

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
    /** Which shapes the series casts the glow from, where they share the group with shapes that do not. */
    only?: (shape: Shape) => boolean;
    chartOptions?: object;
    /** The shapes the series casts the glow from have no `shadow` option to cast beside it. */
    noShadow?: boolean;
    /** The series has a datum to hover, and options to set on a highlight state. */
    hoverable?: boolean;
    /** How many shapes the hover moves to the highlight layer: the three markers of an HLC item. */
    copies?: number;
}

const isGroup = (shape: Shape) => (shape as Shape<{ hasChildren?: boolean }>).datum?.hasChildren === true;
const isTile = (shape: Shape) => !isGroup(shape);

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
        name: 'treemap tiles',
        data: HIERARCHY_SHADOW_DATA,
        only: isTile,
        series: (glow, shadow) => ({
            type: 'treemap',
            labelKey: 'name',
            sizeKey: 'size',
            group: { gap: 12, padding: 10 },
            tile: { glow, shadow },
        }),
    },
    {
        name: 'treemap groups',
        data: HIERARCHY_SHADOW_DATA,
        only: isGroup,
        series: (glow, shadow) => ({
            type: 'treemap',
            labelKey: 'name',
            sizeKey: 'size',
            group: { gap: 12, padding: 10, glow, shadow },
        }),
    },
    {
        name: 'sunburst',
        data: HIERARCHY_SHADOW_DATA,
        series: (glow, shadow) => ({ type: 'sunburst', labelKey: 'name', sizeKey: 'size', glow, shadow }),
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

    /** The shapes of the case that cast in the glow slot, in the content and in the highlight layer. */
    const glowing = (testCase: SeriesCase, group: 'contentGroup' | 'highlightGroup' = 'contentGroup') =>
        collectShapes(getSeriesAt(chart)[group]).filter(
            (shape) => shape.visible && shape.fillGlow?.enabled === true && (testCase.only?.(shape) ?? true)
        );

    describe.each(SERIES)('$name', (testCase) => {
        it('casts the glow from its shapes, in the glow slot', async () => {
            await create(testCase, GLOW);

            const shapes = glowing(testCase);
            expect(shapes.length).toBeGreaterThan(0);
            if (testCase.count != null) expect(shapes).toHaveLength(testCase.count);
            for (const shape of shapes) {
                expect(shape.fillGlow).toMatchObject(glowShadow(GLOW));
                expect(shape.fillShadow?.enabled).not.toBe(true);
            }
        });

        it('casts the theme glow for a glow with no fields', async () => {
            await create(testCase, {});

            const shapes = glowing(testCase);
            expect(shapes.length).toBeGreaterThan(0);
            for (const shape of shapes) expect(shape.fillGlow).toMatchObject(glowShadow(THEME_GLOW));
        });

        it.each([
            ['is disabled', { ...GLOW, enabled: false }],
            ['is not set', undefined],
        ])('casts no glow where the glow %s', async (_name, glow) => {
            await create(testCase, glow);

            expect(glowing(testCase)).toHaveLength(0);
        });

        it.skipIf(testCase.noShadow)(
            'casts the shadow and the glow of a shape together, each in its own slot',
            async () => {
                await create(testCase, GLOW, SHADOW);

                const shapes = glowing(testCase);
                expect(shapes.length).toBeGreaterThan(0);
                for (const shape of shapes) {
                    expect(shape.fillGlow).toMatchObject(glowShadow(GLOW));
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
            await hover(GLOW, { highlightedItem: { glow: { blur: 9 } } });

            const drawn = glowing(testCase, 'highlightGroup');
            expect(drawn).toHaveLength(copies);
            for (const copy of drawn) {
                expect(copy.fillGlow).toMatchObject(glowShadow({ ...GLOW, blur: 9 }));
                expect(copy.fillShadow?.enabled).not.toBe(true);
            }
        });

        it('keeps the series glow on the items that are not hovered, and takes it off the hovered one in place', async () => {
            await create(testCase, GLOW);
            const before = glowing(testCase).length;
            expect(before).toBeGreaterThan(copies);

            const { ctx, id } = deproxy(chart);
            ctx.highlightManager.updateHighlight(id, getSeriesNodeData<HighlightNodeDatum>(chart)[0]);
            await waitForChartStability(chart);

            const inPlace = glowing(testCase);
            expect(inPlace).toHaveLength(before - copies);
            for (const shape of inPlace) expect(shape.fillGlow).toMatchObject(glowShadow(GLOW));
            // The highlight copy casts the glow the hovered item gave up.
            expect(glowing(testCase, 'highlightGroup')).toHaveLength(copies);
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

        it('casts the highlight copy from highlightedItem and the other items from unhighlightedItem, over the series glow', async () => {
            chart = await createEnterpriseChart({
                data: testCase.data,
                animation: { enabled: false },
                legend: { enabled: false },
                series: [
                    testCase.series(GLOW, {
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

            // A flow also redraws the nodes and links that the hovered part connects to, as unhighlighted items.
            const drawn = glowShapes('highlightGroup');
            const copies = drawn.filter((shape) => shape.fillGlow?.blur === 9);
            expect(copies).toHaveLength(1);
            expect(testCase.partOf(copies[0])).toBe(testCase.part);
            expect(copies[0].fillGlow).toMatchObject(glowShadow({ ...GLOW, blur: 9 }));
            for (const shape of drawn.filter((candidate) => candidate !== copies[0])) {
                expect(shape.fillGlow).toMatchObject(glowShadow({ ...GLOW, blur: 6 }));
            }

            // The hovered item gave its glow up to the copy, and every other item takes the unhighlighted one.
            const inPlace = glowShapes('contentGroup');
            expect(inPlace).toHaveLength(before - 1);
            for (const shape of inPlace) expect(shape.fillGlow).toMatchObject(glowShadow({ ...GLOW, blur: 6 }));
        });
    });

    describe('hierarchy series, hovered', () => {
        const TREE = [
            {
                name: 'A',
                children: [
                    { name: 'A1', size: 10 },
                    { name: 'A2', size: 6 },
                ],
            },
            {
                name: 'B',
                children: [
                    { name: 'B1', size: 8 },
                    { name: 'B2', size: 4 },
                ],
            },
        ];
        /** Each bucket sets a field of its own, so that the field by field merge shows through. */
        const BUCKETS = {
            highlightedItem: { glow: { blur: 9 } },
            highlightedBranch: { glow: { spread: 7 } },
            unhighlightedItem: { glow: { blur: 6 } },
            unhighlightedBranch: { glow: { blur: 4 } },
        };

        const nameOf = (shape: Shape) => (shape.datum as { datum?: { name?: string } } | undefined)?.datum?.name;

        const findNode = (name: string): HighlightNodeDatum => {
            const visit = (node: any): any =>
                node.datum?.name === name ? node : node.children.map(visit).find((found: unknown) => found != null);
            return visit(getHierarchyRootNode(chart)) as HighlightNodeDatum;
        };

        /** What the nodes of the selection cast in the glow slot, by node name; nodes that cast none are left out. */
        const glowByName = (selection: 'datumSelection' | 'highlightSelection', keep: (shape: Shape) => boolean) => {
            const byName = new Map<string, unknown>();
            for (const shape of getSeriesSelectionNodes<Shape>(chart, selection)) {
                if (shape.visible && shape.fillGlow?.enabled === true && keep(shape)) {
                    byName.set(nameOf(shape)!, shape.fillGlow);
                }
            }
            return byName;
        };

        const hoverNode = async (series: AnySeriesOptions, name: string) => {
            chart = await createEnterpriseChart({
                data: TREE,
                animation: { enabled: false },
                legend: { enabled: false },
                series: [series],
            } as AgChartOptions);
            await waitForChartStability(chart);
            const { ctx, id } = deproxy(chart);
            ctx.highlightManager.updateHighlight(id, findNode(name));
            await waitForChartStability(chart);
        };

        /**
         * The hovered node casts highlightedItem over highlightedBranch from the highlight layer, and gives up its glow
         * in place. Its branch takes unhighlightedItem over highlightedBranch, and the other branch unhighlightedBranch.
         */
        const expectBranchCascade = (
            keep: (shape: Shape) => boolean,
            hovered: string,
            branch: string[],
            otherBranch: string[]
        ) => {
            expect(glowByName('highlightSelection', keep)).toEqual(
                new Map([[hovered, expect.objectContaining(glowShadow({ ...GLOW, blur: 9, spread: 7 }))]])
            );
            const inPlace = glowByName('datumSelection', keep);
            expect([...inPlace.keys()].sort((a, b) => a.localeCompare(b))).toEqual(
                [...branch, ...otherBranch].sort((a, b) => a.localeCompare(b))
            );
            for (const name of branch)
                expect(inPlace.get(name)).toMatchObject(glowShadow({ ...GLOW, blur: 6, spread: 7 }));
            for (const name of otherBranch) expect(inPlace.get(name)).toMatchObject(glowShadow({ ...GLOW, blur: 4 }));
        };

        it('treemap tiles read the branch buckets', async () => {
            await hoverNode(
                {
                    type: 'treemap',
                    labelKey: 'name',
                    sizeKey: 'size',
                    tile: { glow: GLOW, highlight: BUCKETS },
                } as AnySeriesOptions,
                'A1'
            );

            expectBranchCascade(isTile, 'A1', ['A2'], ['B1', 'B2']);
        });

        it('treemap groups cast the hovered group from highlightedItem and the others from unhighlightedItem', async () => {
            await hoverNode(
                {
                    type: 'treemap',
                    labelKey: 'name',
                    sizeKey: 'size',
                    group: {
                        glow: GLOW,
                        highlight: { highlightedItem: { glow: { blur: 9 } }, unhighlightedItem: { glow: { blur: 6 } } },
                    },
                } as AnySeriesOptions,
                'A'
            );

            expect(glowByName('highlightSelection', isGroup)).toEqual(
                new Map([['A', expect.objectContaining(glowShadow({ ...GLOW, blur: 9 }))]])
            );
            const inPlace = glowByName('datumSelection', isGroup);
            expect([...inPlace.keys()]).toEqual(['B']);
            expect(inPlace.get('B')).toMatchObject(glowShadow({ ...GLOW, blur: 6 }));
        });

        it('sunburst sectors read the branch buckets', async () => {
            await hoverNode(
                {
                    type: 'sunburst',
                    labelKey: 'name',
                    sizeKey: 'size',
                    glow: GLOW,
                    highlight: BUCKETS,
                } as AnySeriesOptions,
                'A1'
            );

            expectBranchCascade(() => true, 'A1', ['A', 'A2'], ['B', 'B1', 'B2']);
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
    });
});
