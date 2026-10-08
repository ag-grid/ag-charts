import { type Mock, afterEach, describe, expect, it } from 'vitest';

import type { AgChartOptions } from 'ag-charts-community';
import { AgCharts, _ModuleSupport } from 'ag-charts-community';
import { deproxy, setupMockCanvas, setupMockConsole, waitForChartStability } from 'ag-charts-community-test';
import { RadialColumnShape, Rect, Sector } from 'ag-charts-core';
import type { Shape } from 'ag-charts-core';

import {
    HIERARCHY_SHADOW_DATA,
    HIGHLIGHT_SHADOW,
    SHADOW,
    collectShapes,
    prepareEnterpriseTestOptions,
} from '../test/utils';
import { BoxPlotNode } from './box-plot/boxPlotNode';
import { CandlestickNode } from './candlestick/candlestickNode';
import { ChordLink } from './chord/chordLink';
import { FlowProportionDatumType } from './flow-proportion/flowDatumIndex';
import { FunnelConnector } from './funnel/funnelConnector';
import { ukData } from './map-test/ukData';
import ukTopology from './map-test/ukTopology.json';
import { GeoGeometry } from './map-util/geoGeometry';
import { OhlcNode } from './ohlc/ohlcNode';
import { SankeyLink } from './sankey/sankeyLink';

type Shadow = typeof SHADOW;

interface SeriesCase {
    name: string;
    /** The series options, with `shadow` placed where this series reads it from. */
    series: (shadow: Shadow | undefined, highlight: object) => object;
    data: object[];
    /** The exact shape class that casts the shadow, so labels, lines and subclasses like sankey links are left out. */
    kind: abstract new (...args: any[]) => Shape;
    chartOptions?: object;
    /** The in-place and highlight-layer shapes, for series that keep both copies of an item in one group. */
    layers?: (series: any) => { inPlace: Shape[]; highlighted: Shape[] };
    /** How many copies of the hovered item the highlight layer draws; range-area lights both its low and high marker. */
    hoveredCopies?: number;
    /** The datum to hover; defaults to the first of the series' node data. */
    hover?: (series: any) => unknown;
    /** A second datum of the same kind to move the hover to; defaults to the first node datum of another item. */
    hoverNext?: (series: any) => unknown;
}

const FLOW_DATA = [
    { from: 'A', to: 'C', size: 8 },
    { from: 'A', to: 'D', size: 4 },
    { from: 'B', to: 'C', size: 5 },
    { from: 'B', to: 'D', size: 7 },
];
const FIRST_LEAF = (series: any) => {
    let node = series.rootNode;
    while (node.children?.length) node = node.children[0];
    return node;
};
const SECOND_LEAF = (series: any) => {
    const leaves: any[] = [];
    for (const node of series.rootNode) if (node.children.length === 0) leaves.push(node);
    return leaves[1];
};
const FIRST_GROUP = (series: any) => series.rootNode.children[0];
const SECOND_GROUP = (series: any) => series.rootNode.children[0].children[0];
const SELECTION_LAYERS = (series: any) => ({
    inPlace: [...series.datumSelection.nodes()] as Shape[],
    highlighted: [...series.highlightSelection.nodes()] as Shape[],
});
// Only groups cast in the group case, so the leaf rects that share the selection are left out.
const GROUP_LAYERS = (series: any) => {
    const groups = (selection: any) => {
        const nodes: Shape[] = [];
        selection.each((node: Shape, datum: any) => {
            if (datum.children.length > 0) nodes.push(node);
        });
        return nodes;
    };
    return { inPlace: groups(series.datumSelection), highlighted: groups(series.highlightSelection) };
};
// A flow series redraws the hovered item's neighbours on a focus layer; the highlight layer holds the item itself,
// as a node or as a link.
const FLOW_LAYERS = (series: any) => ({
    inPlace: collectShapes(series.contentGroup),
    highlighted: [...collectShapes(series.highlightNodeGroup), ...collectShapes(series.highlightLinkGroup)],
});
const flowData = (type: FlowProportionDatumType) => (series: any) =>
    series.contextNodeData.nodeData.filter((datum: any) => datum.type === type);
const FLOW_NODE = (series: any) => flowData(FlowProportionDatumType.Node)(series)[0];
const SECOND_FLOW_NODE = (series: any) => flowData(FlowProportionDatumType.Node)(series)[1];
const FLOW_LINK = (series: any) => flowData(FlowProportionDatumType.Link)(series)[0];
const SECOND_FLOW_LINK = (series: any) => flowData(FlowProportionDatumType.Link)(series)[1];

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
    setupMockCanvas();

    let chart: any;

    afterEach(() => {
        chart?.destroy();
        chart = undefined;
    });

    const casts = (shape: Shape) => shape.fillShadow?.enabled === true;

    /** The visible in-place and highlight-layer shapes that cast (or would cast) the series' shadow. */
    const layersOf = (testCase: SeriesCase, series: any) => {
        const drawn = (shapes: Iterable<Shape>) =>
            [...shapes].filter((shape) => shape.constructor === testCase.kind && shape.visible);
        if (testCase.layers) {
            const { inPlace, highlighted } = testCase.layers(series);
            return { inPlace: drawn(inPlace), highlighted: drawn(highlighted) };
        }
        return {
            inPlace: drawn(collectShapes(series.contentGroup)),
            highlighted: drawn(collectShapes(series.highlightGroup)),
        };
    };

    /** The highlight the legend raises for the series' first legend item: per stage or sector, or the whole series. */
    const legendHighlight = (series: any) => {
        const [legendDatum] = series.getLegendData('category');
        // Series without legend items, like a treemap or a heatmap with a colour scale, have nothing to hover.
        if (legendDatum == null) return undefined;
        const { itemId, legendItemName } = legendDatum;
        return typeof itemId === 'number'
            ? { series, itemId: undefined, datum: undefined, datumIndex: itemId, legendItemName }
            : { series, itemId, datum: undefined, datumIndex: Number.NaN, legendItemName };
    };

    const hoverItem = async (
        testCase: SeriesCase,
        shadow: Shadow | undefined,
        highlight: object = {},
        drawingMode: 'cutout' | 'overlay' = 'cutout',
        via: 'item' | 'legend' = 'item'
    ) => {
        const options = {
            data: testCase.data,
            animation: { enabled: false },
            legend: { enabled: false },
            highlight: { drawingMode },
            ...testCase.chartOptions,
            series: [testCase.series(shadow, highlight)],
        } as AgChartOptions;
        prepareEnterpriseTestOptions(options);
        chart = deproxy(AgCharts.create(options));
        await waitForChartStability(chart);

        const [series] = chart.series;
        const { inPlace: inPlaceBefore } = layersOf(testCase, series);
        // The shapes are live, so count what they cast now, before the hover changes it.
        const castingBefore = inPlaceBefore.filter(casts).length;

        const datum =
            via === 'legend' ? legendHighlight(series) : (testCase.hover?.(series) ?? series.getNodeData()[0]);
        if (datum != null) chart.ctx.highlightManager.updateHighlight(chart.id, datum);
        await waitForChartStability(chart);

        const L = layersOf(testCase, series);
        return { series, inPlaceBefore, castingBefore, ...L };
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
            const { series, inPlace: hoveredFirst } = await hoverItem(testCase, SHADOW);
            expect(hoveredFirst.filter((shape) => !casts(shape)).length).toBe(testCase.hoveredCopies ?? 1);

            const [first] = [testCase.hover?.(series) ?? series.getNodeData()[0]];
            const next =
                testCase.hoverNext?.(series) ??
                series.getNodeData().find((d: any) => d.datumIndex !== first.datumIndex);
            chart.ctx.highlightManager.updateHighlight(chart.id, next);
            await waitForChartStability(chart);

            // The first item casts again, and only the second one's in-place copy is cut out.
            const { inPlace, highlighted } = layersOf(testCase, series);
            expect(inPlace.filter((shape) => !casts(shape)).length).toBe(testCase.hoveredCopies ?? 1);
            expect(highlighted.filter(casts).length).toBe(testCase.hoveredCopies ?? 1);
        });

        it('restores the in-place shadow when the hover ends', async () => {
            const { series, inPlaceBefore } = await hoverItem(testCase, SHADOW);

            chart.ctx.highlightManager.updateHighlight(chart.id);
            await waitForChartStability(chart);

            const { inPlace: shapes } = layersOf(testCase, series);
            expect(shapes.length).toBe(inPlaceBefore.length);
            for (const shape of shapes) expect(shape.fillShadow).toMatchObject(SHADOW);
        });

        it('has no highlight shadow unless configured', async () => {
            const { series, inPlaceBefore, inPlace, highlighted } = await hoverItem(testCase, undefined);

            expect(series.options.highlight?.highlightedItem?.shadow).toBeUndefined();
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
            const messages = (console.warn as any).mock.calls.map(([message]: [string]) => message);
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
            (console.warn as Mock).mockClear();
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

    describe.each(SERIES.filter(({ name }) => /^(sankey|chord) (nodes|links)$/.test(name)))(
        '$name focus layer',
        (testCase) => {
            // Every copy of the hovered item: in place, on the focus layer beside its neighbours, and highlighted.
            const copiesOf = (series: any, hovered: unknown) => {
                const copy = (names: string[]) => {
                    const shapes: Shape[] = [];
                    for (const name of names) {
                        series[name].each((shape: Shape, datum: unknown) => {
                            if (datum === hovered) shapes.push(shape);
                        });
                    }
                    return shapes;
                };
                return {
                    inPlace: copy(['nodeSelection', 'linkSelection']),
                    focus: copy(['focusNodeSelection', 'focusLinkSelection']),
                    highlighted: copy(['highlightNodeSelection', 'highlightLinkSelection']),
                };
            };

            it.each([
                ['cutout', {}, 'highlighted'],
                ['overlay', {}, 'inPlace'],
                ['overlay', { highlightedItem: { shadow: HIGHLIGHT_SHADOW } }, 'highlighted'],
            ] as const)('casts the hovered item once, in %s mode with %j', async (drawingMode, highlight, caster) => {
                const { series } = await hoverItem(testCase, SHADOW, highlight, drawingMode);
                const copies = copiesOf(series, testCase.hover?.(series));

                // The hovered item is drawn in each layer, and exactly one of its copies casts.
                expect(copies.inPlace.length).toBe(1);
                expect(copies.focus.length).toBe(1);
                expect(copies.highlighted.length).toBe(1);
                expect(copies.focus.filter(casts).length).toBe(0);
                expect([...copies.inPlace, ...copies.focus, ...copies.highlighted].filter(casts)).toEqual(
                    copies[caster]
                );
            });
        }
    );

    describe('items the series draws no highlight copy for', () => {
        it('keeps the shadow on a region of a series that shares the hovered series legend item name', async () => {
            const options = {
                data: ukData,
                topology: ukTopology,
                animation: { enabled: false },
                legend: { enabled: false },
                highlight: { drawingMode: 'cutout' },
                series: Array.from({ length: 2 }, () => ({
                    type: 'map-shape',
                    idKey: 'name',
                    legendItemName: 'Regions',
                    fill: 'steelblue',
                    shadow: SHADOW,
                })),
            } as AgChartOptions;
            prepareEnterpriseTestOptions(options);
            chart = deproxy(AgCharts.create(options));
            await waitForChartStability(chart);

            const [hoveredSeries, otherSeries] = chart.series;
            chart.ctx.highlightManager.updateHighlight(chart.id, hoveredSeries.getNodeData()[0]);
            await waitForChartStability(chart);

            const inPlace = (series: any) =>
                collectShapes(series.contentGroup).filter(
                    (shape) => shape.visible && (shape.constructor as unknown) === GeoGeometry
                );
            const highlighted = (series: any) =>
                collectShapes(series.highlightGroup).filter(
                    (shape) => shape.visible && (shape.constructor as unknown) === GeoGeometry
                );

            // The hovered series swaps its shadow onto its highlight copy, as in any other series.
            expect(highlighted(hoveredSeries).filter(casts).length).toBe(1);
            expect(inPlace(hoveredSeries).filter((shape) => !casts(shape)).length).toBe(1);

            // The other series draws no highlight copy, so every region keeps its own shadow.
            expect(highlighted(otherSeries).length).toBe(0);
            expect(inPlace(otherSeries).length).toBeGreaterThan(0);
            for (const shape of inPlace(otherSeries)) expect(shape.fillShadow).toMatchObject(SHADOW);
        });

        it('keeps the shadow on a hovered treemap group that is not interactive', async () => {
            const testCase: SeriesCase = {
                name: 'treemap groups',
                data: HIERARCHY_SHADOW_DATA,
                kind: Rect,
                hover: FIRST_GROUP,
                layers: GROUP_LAYERS,
                series: (shadow, highlight) => ({
                    type: 'treemap',
                    labelKey: 'name',
                    sizeKey: 'size',
                    group: { shadow, gap: 12, padding: 10, interactive: false, highlight },
                }),
            };
            const { inPlace, highlighted } = await hoverItem(testCase, SHADOW);

            expect(highlighted.length).toBe(0);
            expect(inPlace.length).toBeGreaterThan(0);
            for (const shape of inPlace) expect(shape.fillShadow).toMatchObject(SHADOW);
        });
    });
});
