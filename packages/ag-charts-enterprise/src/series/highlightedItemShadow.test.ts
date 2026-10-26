import { afterEach, describe, expect, it, vi } from 'vitest';

import type {
    AgChartInstance,
    AgChartOptions,
    AgDropShadowOptions,
    AgMapShapeSeriesOptions,
} from 'ag-charts-community';
import { _ModuleSupport } from 'ag-charts-community';
import {
    deproxy,
    getSeriesAt,
    getSeriesNodeData,
    getSeriesOptions,
    getSeriesSelectionNodes,
    legendHighlight,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from 'ag-charts-community-test';
import { RadialColumnShape, Rect, Sector } from 'ag-charts-core';
import type { Shape } from 'ag-charts-core';

import {
    type EnterpriseSelectionName,
    getEnterpriseSelectionNodes,
    getFlowLinkData,
    getFlowNodeData,
    getSeriesGroup,
} from '../test/enterpriseSeriesAccessors';
import { getHierarchyRootNode } from '../test/seriesAccessors';
import { HIERARCHY_SHADOW_DATA, HIGHLIGHT_SHADOW, SHADOW, collectShapes, createEnterpriseChart } from '../test/utils';
import { BoxPlotNode } from './box-plot/boxPlotNode';
import { CandlestickNode } from './candlestick/candlestickNode';
import { ChordLink } from './chord/chordLink';
import { FunnelConnector } from './funnel/funnelConnector';
import type { HierarchyNode } from './hierarchy/hierarchySeries';
import { ukData } from './map-test/ukData';
import ukTopology from './map-test/ukTopology.json';
import { GeoGeometry } from './map-util/geoGeometry';
import { OhlcNode } from './ohlc/ohlcNode';
import { SankeyLink } from './sankey/sankeyLink';

type HighlightNodeDatum = _ModuleSupport.HighlightNodeDatum;

type Shadow = typeof SHADOW;

/** The options of a series of any chart kind, which is what a case's `series` builds. */
type AnySeriesOptions = NonNullable<AgChartOptions['series']>[number];

/** The `highlight` option of a series: the cases only ever set the shadow of the highlighted item. */
interface HighlightOptions {
    highlightedItem?: { shadow?: AgDropShadowOptions };
}

interface SeriesCase {
    name: string;
    /** The series options, with `shadow` placed where this series reads it from. */
    series: (shadow: Shadow | undefined, highlight: HighlightOptions) => AnySeriesOptions;
    data: object[];
    /** The exact shape class that casts the shadow, so labels, lines and subclasses like sankey links are left out. */
    kind: abstract new (...args: never[]) => Shape;
    chartOptions?: object;
    /** The in-place and highlight-layer shapes, for series that keep both copies of an item in one group. */
    layers?: (chart: AgChartInstance) => { inPlace: Shape[]; highlighted: Shape[] };
    /** How many copies of the hovered item the highlight layer draws; range-area lights both its low and high marker. */
    hoveredCopies?: number;
    /** The datum to hover; defaults to the first of the series' node data. */
    hover?: (chart: AgChartInstance) => HighlightNodeDatum | undefined;
    /** A second datum of the same kind to move the hover to; defaults to the first node datum of another item. */
    hoverNext?: (chart: AgChartInstance) => HighlightNodeDatum | undefined;
}

const FLOW_DATA = [
    { from: 'A', to: 'C', size: 8 },
    { from: 'A', to: 'D', size: 4 },
    { from: 'B', to: 'C', size: 5 },
    { from: 'B', to: 'D', size: 7 },
];
// The root of the tree the hierarchy series laid out; a series that has not laid out fails here, not on a later read.
const hierarchyRoot = (chart: AgChartInstance): HierarchyNode => {
    const root = getHierarchyRootNode(chart);
    if (root == null) throw new Error('the hierarchy series has no root node');
    return root;
};
const FIRST_LEAF = (chart: AgChartInstance) => {
    let node = hierarchyRoot(chart);
    while (node.children.length > 0) node = node.children[0];
    return node;
};
const SECOND_LEAF = (chart: AgChartInstance) => {
    const leaves: HierarchyNode[] = [];
    for (const node of hierarchyRoot(chart)) if (node.children.length === 0) leaves.push(node);
    return leaves[1];
};
const FIRST_GROUP = (chart: AgChartInstance) => hierarchyRoot(chart).children[0];
const SECOND_GROUP = (chart: AgChartInstance) => hierarchyRoot(chart).children[0].children[0];
const SELECTION_LAYERS = (chart: AgChartInstance) => ({
    inPlace: getSeriesSelectionNodes<Shape>(chart, 'datumSelection'),
    highlighted: getSeriesSelectionNodes<Shape>(chart, 'highlightSelection'),
});
// Only groups cast in the group case, so the leaf rects that share the selection are left out.
const GROUP_LAYERS = (chart: AgChartInstance) => {
    const groups = (name: 'datumSelection' | 'highlightSelection') =>
        getSeriesSelectionNodes<Shape<HierarchyNode>>(chart, name).filter((node) => node.datum?.hasChildren);
    return { inPlace: groups('datumSelection'), highlighted: groups('highlightSelection') };
};
// A flow series redraws the hovered item's neighbours on a focus layer; the highlight layer holds the item itself,
// as a node or as a link.
const FLOW_LAYERS = (chart: AgChartInstance) => ({
    inPlace: collectShapes(getSeriesAt(chart).contentGroup),
    highlighted: [
        ...collectShapes(getSeriesGroup(chart, 'highlightNodeGroup')),
        ...collectShapes(getSeriesGroup(chart, 'highlightLinkGroup')),
    ],
});
const FLOW_NODE = (chart: AgChartInstance) => getFlowNodeData(chart)[0];
const SECOND_FLOW_NODE = (chart: AgChartInstance) => getFlowNodeData(chart)[1];
const FLOW_LINK = (chart: AgChartInstance) => getFlowLinkData(chart)[0];
const SECOND_FLOW_LINK = (chart: AgChartInstance) => getFlowLinkData(chart)[1];

const STAGE_DATA = [
    { stage: 'Visits', value: 100 },
    { stage: 'Sign-ups', value: 60 },
    { stage: 'Paid', value: 20 },
];
const GRID_DATA = [
    { x: 'a', y: 'p', value: 1 },
    { x: 'b', y: 'p', value: 3 },
    { x: 'a', y: 'q', value: 2 },
    { x: 'b', y: 'q', value: 5 },
];
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
const BOX_PLOT_DATA = [
    { x: 'Q1', min: 3, q1: 4, median: 5, q3: 6, max: 7 },
    { x: 'Q2', min: 4, q1: 5, median: 6, q3: 7, max: 8 },
    { x: 'Q3', min: 1, q1: 2, median: 3, q3: 4, max: 5 },
];
const WATERFALL_DATA = [
    { x: 'Start', y: 10 },
    { x: 'Up', y: 6 },
    { x: 'Up again', y: 4 },
];

const SERIES: SeriesCase[] = [
    {
        name: 'sankey nodes',
        data: FLOW_DATA,
        kind: Rect,
        hover: FLOW_NODE,
        hoverNext: SECOND_FLOW_NODE,
        layers: FLOW_LAYERS,
        series: (shadow, highlight) => ({
            type: 'sankey',
            fromKey: 'from',
            toKey: 'to',
            sizeKey: 'size',
            node: { shadow },
            highlight,
        }),
    },
    {
        name: 'chord nodes',
        data: FLOW_DATA,
        kind: Sector,
        hover: FLOW_NODE,
        hoverNext: SECOND_FLOW_NODE,
        layers: FLOW_LAYERS,
        series: (shadow, highlight) => ({
            type: 'chord',
            fromKey: 'from',
            toKey: 'to',
            sizeKey: 'size',
            node: { shadow },
            highlight,
        }),
    },
    {
        name: 'sankey links',
        data: FLOW_DATA,
        kind: SankeyLink,
        hover: FLOW_LINK,
        hoverNext: SECOND_FLOW_LINK,
        layers: FLOW_LAYERS,
        series: (shadow, highlight) => ({
            type: 'sankey',
            fromKey: 'from',
            toKey: 'to',
            sizeKey: 'size',
            link: { shadow },
            highlight,
        }),
    },
    {
        name: 'chord links',
        data: FLOW_DATA,
        kind: ChordLink,
        hover: FLOW_LINK,
        hoverNext: SECOND_FLOW_LINK,
        layers: FLOW_LAYERS,
        series: (shadow, highlight) => ({
            type: 'chord',
            fromKey: 'from',
            toKey: 'to',
            sizeKey: 'size',
            link: { shadow },
            highlight,
        }),
    },
    {
        // Tile and group highlights live under `tile.highlight` and `group.highlight`, not the series' `highlight`.
        name: 'treemap tiles',
        data: HIERARCHY_SHADOW_DATA,
        kind: Rect,
        hover: FIRST_LEAF,
        hoverNext: SECOND_LEAF,
        layers: SELECTION_LAYERS,
        series: (shadow, highlight) => ({
            type: 'treemap',
            labelKey: 'name',
            sizeKey: 'size',
            group: { shadow, gap: 12, padding: 10 },
            tile: { shadow, highlight },
        }),
    },
    {
        name: 'treemap groups',
        data: HIERARCHY_SHADOW_DATA,
        kind: Rect,
        hover: FIRST_GROUP,
        hoverNext: SECOND_GROUP,
        layers: GROUP_LAYERS,
        series: (shadow, highlight) => ({
            type: 'treemap',
            labelKey: 'name',
            sizeKey: 'size',
            group: { shadow, gap: 12, padding: 10, interactive: true, highlight },
        }),
    },
    {
        name: 'sunburst',
        data: HIERARCHY_SHADOW_DATA,
        kind: Sector,
        hover: FIRST_LEAF,
        hoverNext: SECOND_LEAF,
        layers: SELECTION_LAYERS,
        series: (shadow, highlight) => ({ type: 'sunburst', labelKey: 'name', sizeKey: 'size', shadow, highlight }),
    },
    {
        name: 'heatmap',
        data: GRID_DATA,
        kind: Rect,
        series: (shadow, highlight) => ({
            type: 'heatmap',
            xKey: 'x',
            yKey: 'y',
            colorKey: 'value',
            shadow,
            highlight,
        }),
    },
    {
        name: 'funnel',
        data: STAGE_DATA,
        kind: Rect,
        series: (shadow, highlight) => ({ type: 'funnel', stageKey: 'stage', valueKey: 'value', shadow, highlight }),
    },
    {
        name: 'pyramid',
        data: STAGE_DATA,
        kind: FunnelConnector,
        series: (shadow, highlight) => ({ type: 'pyramid', stageKey: 'stage', valueKey: 'value', shadow, highlight }),
    },
    {
        name: 'radial-column',
        data: POLAR_DATA,
        kind: RadialColumnShape,
        series: (shadow, highlight) => ({
            type: 'radial-column',
            angleKey: 'quarter',
            radiusKey: 'value',
            shadow,
            highlight,
        }),
    },
    {
        name: 'waterfall',
        data: WATERFALL_DATA,
        kind: Rect,
        series: (shadow, highlight) => ({
            type: 'waterfall',
            xKey: 'x',
            yKey: 'y',
            item: { positive: { shadow }, negative: { shadow }, total: { shadow } },
            highlight,
        }),
    },
    {
        name: 'radar markers',
        data: POLAR_DATA,
        kind: _ModuleSupport.Marker,
        series: (shadow, highlight) => ({
            type: 'radar-line',
            angleKey: 'quarter',
            radiusKey: 'value',
            marker: { enabled: true, shadow },
            highlight,
        }),
    },
    {
        name: 'radar-area markers',
        data: POLAR_DATA,
        kind: _ModuleSupport.Marker,
        series: (shadow, highlight) => ({
            type: 'radar-area',
            angleKey: 'quarter',
            radiusKey: 'value',
            marker: { enabled: true, shadow },
            highlight,
        }),
    },
    {
        name: 'range-area markers',
        data: RANGE_DATA,
        kind: _ModuleSupport.Marker,
        hoveredCopies: 2,
        series: (shadow, highlight) => ({
            type: 'range-area',
            xKey: 'x',
            yLowKey: 'low',
            yHighKey: 'high',
            marker: { enabled: true, shadow },
            highlight,
        }),
    },
    {
        name: 'candlestick',
        data: OHLC_DATA,
        kind: CandlestickNode,
        series: (shadow, highlight) => ({
            type: 'candlestick',
            xKey: 'x',
            openKey: 'open',
            highKey: 'high',
            lowKey: 'low',
            closeKey: 'close',
            shadow,
            highlight,
        }),
    },
    {
        name: 'ohlc',
        data: OHLC_DATA,
        kind: OhlcNode,
        series: (shadow, highlight) => ({
            type: 'ohlc',
            xKey: 'x',
            openKey: 'open',
            highKey: 'high',
            lowKey: 'low',
            closeKey: 'close',
            shadow,
            highlight,
        }),
    },
    {
        name: 'range-bar',
        data: RANGE_DATA,
        kind: Rect,
        series: (shadow, highlight) => ({
            type: 'range-bar',
            xKey: 'x',
            yLowKey: 'low',
            yHighKey: 'high',
            shadow,
            highlight,
        }),
    },
    {
        name: 'box-plot',
        data: BOX_PLOT_DATA,
        kind: BoxPlotNode,
        series: (shadow, highlight) => ({
            type: 'box-plot',
            xKey: 'x',
            minKey: 'min',
            q1Key: 'q1',
            medianKey: 'median',
            q3Key: 'q3',
            maxKey: 'max',
            shadow,
            highlight,
        }),
    },
    {
        name: 'map-shape',
        data: ukData,
        kind: GeoGeometry,
        chartOptions: { topology: ukTopology },
        series: (shadow, highlight) => ({ type: 'map-shape', idKey: 'name', shadow, highlight }),
    },
    {
        name: 'map-marker',
        data: ukData,
        kind: _ModuleSupport.Marker,
        chartOptions: { topology: ukTopology },
        series: (shadow, highlight) => ({ type: 'map-marker', idKey: 'name', shadow, highlight }),
    },
];

describe('highlightedItem.shadow (enterprise series)', () => {
    setupMockConsole();
    const canvasCtx = setupMockCanvas();

    let chart: AgChartInstance;

    afterEach(() => {
        chart?.destroy();
    });

    const casts = (shape: Shape) => shape.fillShadow?.enabled === true;

    /** The visible in-place and highlight-layer shapes that cast (or would cast) the series' shadow. */
    const layersOf = (testCase: SeriesCase) => {
        // A node's constructor is typed `Function`, which has no overlap with the class type of the case.
        const drawn = (shapes: Iterable<Shape>) =>
            [...shapes].filter((shape) => (shape.constructor as unknown) === testCase.kind && shape.visible);
        if (testCase.layers) {
            const { inPlace, highlighted } = testCase.layers(chart);
            return { inPlace: drawn(inPlace), highlighted: drawn(highlighted) };
        }
        const series = getSeriesAt(chart);
        return {
            inPlace: drawn(collectShapes(series.contentGroup)),
            highlighted: drawn(collectShapes(series.highlightGroup)),
        };
    };

    /** Raises the highlight on `datum` (or clears it) as the pointer would. */
    const highlight = (datum?: HighlightNodeDatum) => {
        const { ctx, id } = deproxy(chart);
        ctx.highlightManager.updateHighlight(id, datum);
    };

    /** The chart options of a case; the case's series is the only one the chart has. */
    const caseOptions = (
        testCase: SeriesCase,
        shadow: Shadow | undefined,
        highlightOptions: HighlightOptions,
        extra: object
    ) =>
        // The series of a case belongs to one chart kind, which a union of every chart kind's options cannot say.
        ({
            data: testCase.data,
            animation: { enabled: false },
            legend: { enabled: false },
            ...extra,
            ...testCase.chartOptions,
            series: [testCase.series(shadow, highlightOptions)],
        }) as AgChartOptions;

    const hoverItem = async (
        testCase: SeriesCase,
        shadow: Shadow | undefined,
        highlightOptions: HighlightOptions = {},
        drawingMode: 'cutout' | 'overlay' = 'cutout',
        via: 'item' | 'legend' = 'item'
    ) => {
        chart = await createEnterpriseChart(
            caseOptions(testCase, shadow, highlightOptions, { highlight: { drawingMode } })
        );

        const { inPlace: inPlaceBefore } = layersOf(testCase);
        // The shapes are live, so count what they cast now, before the hover changes it.
        const castingBefore = inPlaceBefore.filter(casts).length;

        const datum =
            via === 'legend'
                ? legendHighlight(getSeriesAt(chart))
                : (testCase.hover?.(chart) ?? getSeriesNodeData<HighlightNodeDatum>(chart)[0]);
        if (datum != null) highlight(datum);
        await waitForChartStability(chart);

        const L = layersOf(testCase);
        return { inPlaceBefore, castingBefore, ...L };
    };

    describe.each(SERIES)('$name', (testCase) => {
        it('casts one shadow per hover from the highlight layer when the highlight cuts out', async () => {
            const { inPlace, highlighted } = await hoverItem(testCase, SHADOW);

            expect(highlighted.length > 0).toBe(true);
            expect(highlighted.filter(casts).length).toBe(testCase.hoveredCopies ?? 1);
            expect(highlighted.find(casts)?.fillShadow).toMatchObject(SHADOW);

            // The in-place copy of the hovered item casts nothing, so it adds no second shadow.
            expect(inPlace.filter((shape) => !casts(shape)).length).toBe(testCase.hoveredCopies ?? 1);
        });

        it('casts one shadow per hover from the in-place item when the highlight overlays', async () => {
            const { inPlace, highlighted } = await hoverItem(testCase, SHADOW, {}, 'overlay');

            expect(highlighted.length > 0).toBe(true);
            expect(highlighted.filter(casts).length).toBe(0);
            for (const shape of inPlace) expect(shape.fillShadow).toMatchObject(SHADOW);
        });

        it('keeps every shadow when the item is hovered through the legend', async () => {
            const { castingBefore, inPlace, highlighted } = await hoverItem(testCase, SHADOW, {}, 'cutout', 'legend');

            // A legend highlight has no datum, so a series that draws no copy for it must keep the in-place shadow.
            expect([...inPlace, ...highlighted].filter(casts).length).toBeGreaterThanOrEqual(castingBefore);
        });

        it('moves the shadow from one hovered item to the next', async () => {
            const { inPlace: hoveredFirst } = await hoverItem(testCase, SHADOW);
            expect(hoveredFirst.filter((shape) => !casts(shape)).length).toBe(testCase.hoveredCopies ?? 1);

            const nodeData = () => getSeriesNodeData<HighlightNodeDatum>(chart);
            const first = testCase.hover?.(chart) ?? nodeData()[0];
            const next = testCase.hoverNext?.(chart) ?? nodeData().find((d) => d.datumIndex !== first.datumIndex);
            highlight(next);
            await waitForChartStability(chart);

            // The first item casts again, and only the second one's in-place copy is cut out.
            const { inPlace, highlighted } = layersOf(testCase);
            expect(inPlace.filter((shape) => !casts(shape)).length).toBe(testCase.hoveredCopies ?? 1);
            expect(highlighted.filter(casts).length).toBe(testCase.hoveredCopies ?? 1);
        });

        it('restores the in-place shadow when the hover ends', async () => {
            const { inPlaceBefore } = await hoverItem(testCase, SHADOW);

            highlight();
            await waitForChartStability(chart);

            const { inPlace: shapes } = layersOf(testCase);
            expect(shapes.length).toBe(inPlaceBefore.length);
            for (const shape of shapes) expect(shape.fillShadow).toMatchObject(SHADOW);
        });

        it('has no highlight shadow unless configured', async () => {
            const { inPlaceBefore, inPlace, highlighted } = await hoverItem(testCase, undefined);

            expect(
                getSeriesOptions<{ highlight?: HighlightOptions }>(chart).highlight?.highlightedItem?.shadow
            ).toBeUndefined();
            expect([...inPlaceBefore, ...inPlace, ...highlighted].filter(casts).length).toBe(0);
        });
    });

    describe.each(SERIES)('$name', (testCase) => {
        it('merges highlightedItem.shadow over the series shadow on the hovered item', async () => {
            const { inPlace, highlighted } = await hoverItem(testCase, SHADOW, {
                highlightedItem: { shadow: HIGHLIGHT_SHADOW },
            });

            expect(highlighted.filter(casts).length).toBe(testCase.hoveredCopies ?? 1);
            expect(highlighted.find(casts)?.fillShadow).toMatchObject(HIGHLIGHT_SHADOW);
            expect(inPlace.filter((shape) => !casts(shape)).length).toBe(testCase.hoveredCopies ?? 1);
            for (const shape of inPlace.filter(casts)) expect(shape.fillShadow).toMatchObject(SHADOW);
        });

        it('casts highlightedItem.shadow from the highlight layer in overlay mode too', async () => {
            const { inPlace, highlighted } = await hoverItem(
                testCase,
                SHADOW,
                { highlightedItem: { shadow: HIGHLIGHT_SHADOW } },
                'overlay'
            );

            expect(highlighted.find(casts)?.fillShadow).toMatchObject(HIGHLIGHT_SHADOW);
            expect(inPlace.filter((shape) => !casts(shape)).length).toBe(testCase.hoveredCopies ?? 1);
        });

        it('fills highlightedItem.shadow gaps from the series shadow', async () => {
            const { highlighted } = await hoverItem(testCase, SHADOW, {
                highlightedItem: { shadow: { blur: 20 } },
            });

            expect(highlighted.find(casts)?.fillShadow).toMatchObject({ ...SHADOW, blur: 20 });
        });

        it('keeps the highlight shadow off when neither it nor the series shadow is enabled', async () => {
            const { highlighted } = await hoverItem(testCase, undefined, {
                highlightedItem: { shadow: { color: HIGHLIGHT_SHADOW.color } },
            });

            expect(highlighted.filter(casts).length).toBe(0);
        });

        it('applies highlightedItem.shadow when the series has no shadow', async () => {
            const { inPlace, highlighted } = await hoverItem(testCase, undefined, {
                highlightedItem: { shadow: HIGHLIGHT_SHADOW },
            });

            expect(highlighted.find(casts)?.fillShadow).toMatchObject(HIGHLIGHT_SHADOW);
            expect(inPlace.filter(casts).length).toBe(0);
        });
    });

    describe.each(SERIES)('$name spread', (testCase) => {
        const SPREAD_SHADOW = { ...SHADOW, spread: 5 };
        const NEGATIVE_SHADOW = { ...SHADOW, spread: -4 };
        // Where the option sits in the path depends on the series: `shadow`, `node.shadow`, `tile.shadow` and so on,
        // and a series that has several shadows, like a waterfall's, warns once for each.
        const expectNegativeSpreadWarnings = (value: number) => {
            const messages = vi.mocked(console.warn).mock.calls.map(([message]) => String(message));
            expect(messages.length).toBeGreaterThan(0);
            for (const message of messages) {
                expect(message).toMatch(
                    new RegExp(
                        `^AG Charts - Option \`series\\[0\\]\\.[\\w.]*shadow\\.spread\` cannot be set to \`${value}\`; expecting a number greater than or equal to 0, ignoring\\.$`
                    )
                );
            }
            // One warning for each shadow, never repeated. Clear them so they are not reported as unexpected.
            expect(new Set(messages).size).toBe(messages.length);
            vi.mocked(console.warn).mockClear();
        };

        it('carries the series shadow spread to the items that cast', async () => {
            const { inPlace, highlighted } = await hoverItem(testCase, SPREAD_SHADOW, {}, 'overlay');

            expect(inPlace.filter(casts).length).toBeGreaterThan(0);
            for (const shape of inPlace.filter(casts)) expect(shape.fillShadow).toMatchObject(SPREAD_SHADOW);
            expect(highlighted.length).toBeGreaterThan(0);
        });

        it('carries the series shadow spread to the hovered item when the highlight cuts out', async () => {
            const { highlighted } = await hoverItem(testCase, SPREAD_SHADOW);

            expect(highlighted.find(casts)?.fillShadow).toMatchObject(SPREAD_SHADOW);
        });

        it('merges highlightedItem.shadow.spread over the series shadow spread on the hovered item', async () => {
            const { inPlace, highlighted } = await hoverItem(testCase, SPREAD_SHADOW, {
                highlightedItem: { shadow: { spread: 9 } },
            });

            expect(highlighted.find(casts)?.fillShadow).toMatchObject({ ...SPREAD_SHADOW, spread: 9 });
            for (const shape of inPlace.filter(casts)) expect(shape.fillShadow).toMatchObject(SPREAD_SHADOW);
        });

        it('fills a missing highlightedItem.shadow.spread from the series shadow', async () => {
            const { highlighted } = await hoverItem(testCase, SPREAD_SHADOW, {
                highlightedItem: { shadow: { blur: 20 } },
            });

            expect(highlighted.find(casts)?.fillShadow).toMatchObject({ ...SPREAD_SHADOW, blur: 20 });
        });

        it('applies highlightedItem.shadow.spread when the series shadow has none', async () => {
            const { highlighted } = await hoverItem(testCase, SHADOW, {
                highlightedItem: { shadow: { spread: 7 } },
            });

            expect(highlighted.find(casts)?.fillShadow).toMatchObject({ ...SHADOW, spread: 7 });
        });

        it('has no spread unless configured', async () => {
            const { inPlace } = await hoverItem(testCase, SHADOW, {}, 'overlay');

            for (const shape of inPlace.filter(casts)) expect(shape.fillShadow?.spread ?? 0).toBe(0);
        });

        it('warns about and ignores a negative series shadow spread', async () => {
            const { inPlace } = await hoverItem(testCase, NEGATIVE_SHADOW, {}, 'overlay');

            expectNegativeSpreadWarnings(-4);
            expect(inPlace.filter(casts).length).toBeGreaterThan(0);
            for (const shape of inPlace.filter(casts)) {
                expect(shape.fillShadow).toMatchObject(SHADOW);
                expect(shape.fillShadow?.spread ?? 0).toBe(0);
            }
        });

        it('warns about and ignores a negative highlightedItem.shadow.spread', async () => {
            const { highlighted } = await hoverItem(testCase, SPREAD_SHADOW, {
                highlightedItem: { shadow: { spread: -2 } },
            });

            expectNegativeSpreadWarnings(-2);
            // The negative value is dropped, so the series shadow's spread shows through.
            expect(highlighted.find(casts)?.fillShadow).toMatchObject(SPREAD_SHADOW);
        });
    });

    describe.each(SERIES)('$name layer shadow batching', (testCase) => {
        // A batch blurs its mask once, and the mask is a scratch canvas, so a series that batches draws one more canvas
        // than the same chart without a shadow. A hover is left out, because it cuts the other items out of their layer.
        const canvasesInUse = async (shadow: Shadow | undefined) => {
            const before = new Set(canvasCtx.getActiveOffscreenCanvasInstances());
            chart = await createEnterpriseChart(caseOptions(testCase, shadow, {}, {}));
            return canvasCtx
                .getActiveOffscreenCanvasInstances()
                .filter((canvas) => !before.has(canvas) && canvas.width > 0).length;
        };

        it('draws its shadows through a mask', async () => {
            const withoutShadow = await canvasesInUse(undefined);
            chart.destroy();

            expect(await canvasesInUse(SHADOW)).toBeGreaterThan(withoutShadow);
        });
    });

    describe.each(SERIES.filter(({ name }) => /^(sankey|chord) (nodes|links)$/.test(name)))(
        '$name focus layer',
        (testCase) => {
            // Every copy of the hovered item: in place, on the focus layer beside its neighbours, and highlighted.
            const copiesOf = (hovered: unknown) => {
                const copy = (...names: EnterpriseSelectionName[]) =>
                    names.flatMap((name) =>
                        getEnterpriseSelectionNodes<Shape>(chart, name).filter((shape) => shape.datum === hovered)
                    );
                return {
                    inPlace: copy('nodeSelection', 'linkSelection'),
                    focus: copy('focusNodeSelection', 'focusLinkSelection'),
                    highlighted: copy('highlightNodeSelection', 'highlightLinkSelection'),
                };
            };

            it.each([
                ['cutout', {}, 'highlighted'],
                ['overlay', {}, 'inPlace'],
                ['overlay', { highlightedItem: { shadow: HIGHLIGHT_SHADOW } }, 'highlighted'],
            ] as const)(
                'casts the hovered item once, in %s mode with %j',
                async (drawingMode, highlightOptions, caster) => {
                    await hoverItem(testCase, SHADOW, highlightOptions, drawingMode);
                    const copies = copiesOf(testCase.hover?.(chart));

                    // The hovered item is drawn in each layer, and exactly one of its copies casts.
                    expect(copies.inPlace.length).toBe(1);
                    expect(copies.focus.length).toBe(1);
                    expect(copies.highlighted.length).toBe(1);
                    expect(copies.focus.filter(casts).length).toBe(0);
                    expect([...copies.inPlace, ...copies.focus, ...copies.highlighted].filter(casts)).toEqual(
                        copies[caster]
                    );
                }
            );
        }
    );

    describe('items the series draws no highlight copy for', () => {
        it('keeps the shadow on a region of a series that shares the hovered series legend item name', async () => {
            chart = await createEnterpriseChart({
                data: ukData,
                topology: ukTopology,
                animation: { enabled: false },
                legend: { enabled: false },
                highlight: { drawingMode: 'cutout' },
                series: Array.from({ length: 2 }, (): AgMapShapeSeriesOptions => ({
                    type: 'map-shape',
                    idKey: 'name',
                    legendItemName: 'Regions',
                    fill: 'steelblue',
                    shadow: SHADOW,
                })),
            });

            highlight(getSeriesNodeData<HighlightNodeDatum>(chart, 0)[0]);
            await waitForChartStability(chart);

            const inPlace = (index: number) =>
                collectShapes(getSeriesAt(chart, index).contentGroup).filter(
                    (shape) => shape.visible && shape instanceof GeoGeometry
                );
            const highlighted = (index: number) =>
                collectShapes(getSeriesAt(chart, index).highlightGroup).filter(
                    (shape) => shape.visible && shape instanceof GeoGeometry
                );

            // The hovered series swaps its shadow onto its highlight copy, as in any other series.
            expect(highlighted(0).filter(casts).length).toBe(1);
            expect(inPlace(0).filter((shape) => !casts(shape)).length).toBe(1);

            // The other series draws no highlight copy, so every region keeps its own shadow.
            expect(highlighted(1).length).toBe(0);
            expect(inPlace(1).length).toBeGreaterThan(0);
            for (const shape of inPlace(1)) expect(shape.fillShadow).toMatchObject(SHADOW);
        });

        it('keeps the shadow on a hovered treemap group that is not interactive', async () => {
            const testCase: SeriesCase = {
                name: 'treemap groups',
                data: HIERARCHY_SHADOW_DATA,
                kind: Rect,
                hover: FIRST_GROUP,
                layers: GROUP_LAYERS,
                series: (shadow, groupHighlight) => ({
                    type: 'treemap',
                    labelKey: 'name',
                    sizeKey: 'size',
                    group: { shadow, gap: 12, padding: 10, interactive: false, highlight: groupHighlight },
                }),
            };
            const { inPlace, highlighted } = await hoverItem(testCase, SHADOW);

            expect(highlighted.length).toBe(0);
            expect(inPlace.length).toBeGreaterThan(0);
            for (const shape of inPlace) expect(shape.fillShadow).toMatchObject(SHADOW);
        });
    });
});
