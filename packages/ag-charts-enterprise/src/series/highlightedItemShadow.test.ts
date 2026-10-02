import { afterEach, describe, expect, it } from 'vitest';

import type { AgChartOptions } from 'ag-charts-community';
import { AgCharts, _Scene } from 'ag-charts-community';
import { deproxy, setupMockCanvas, setupMockConsole, waitForChartStability } from 'ag-charts-community-test';

import {
    HIERARCHY_SHADOW_DATA,
    HIGHLIGHT_SHADOW,
    SHADOW,
    collectShapes,
    prepareEnterpriseTestOptions,
} from '../test/utils';
import { FlowProportionDatumType } from './flow-proportion/flowDatumIndex';
import { FunnelConnector } from './funnel/funnelConnector';

type Shadow = typeof SHADOW;

interface SeriesCase {
    name: string;
    /** The series options, with `shadow` placed where this series reads it from. */
    series: (shadow: Shadow | undefined, highlight: object) => object;
    data: object[];
    /** The exact shape class that casts the shadow, so labels, lines and subclasses like sankey links are left out. */
    kind: abstract new (...args: any[]) => _Scene.Shape;
    chartOptions?: object;
    /** The in-place and highlight-layer shapes, for series that keep both copies of an item in one group. */
    layers?: (series: any) => { inPlace: _Scene.Shape[]; highlighted: _Scene.Shape[] };
    /** How many copies of the hovered item the highlight layer draws; range-area lights both its low and high marker. */
    hoveredCopies?: number;
    /** The datum to hover; defaults to the first of the series' node data. */
    hover?: (series: any) => unknown;
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
const FIRST_GROUP = (series: any) => series.rootNode.children[0];
const SELECTION_LAYERS = (series: any) => ({
    inPlace: [...series.datumSelection.nodes()] as _Scene.Shape[],
    highlighted: [...series.highlightSelection.nodes()] as _Scene.Shape[],
});
// Only groups cast in the group case, so the leaf rects that share the selection are left out.
const GROUP_LAYERS = (series: any) => {
    const groups = (selection: any) => {
        const nodes: _Scene.Shape[] = [];
        selection.each((node: _Scene.Shape, datum: any) => {
            if (datum.children.length > 0) nodes.push(node);
        });
        return nodes;
    };
    return { inPlace: groups(series.datumSelection), highlighted: groups(series.highlightSelection) };
};
// A flow series redraws the hovered node's neighbours on a focus layer; the highlight layer holds the node itself.
const FLOW_LAYERS = (series: any) => ({
    inPlace: collectShapes(series.contentGroup),
    highlighted: collectShapes(series.highlightNodeGroup),
});
const FLOW_NODE = (series: any) =>
    series.contextNodeData.nodeData.find((datum: any) => datum.type === FlowProportionDatumType.Node);

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
const WATERFALL_DATA = [
    { x: 'Start', y: 10 },
    { x: 'Up', y: 6 },
    { x: 'Up again', y: 4 },
];

const SERIES: SeriesCase[] = [
    {
        name: 'sankey nodes',
        data: FLOW_DATA,
        kind: _Scene.Rect,
        hover: FLOW_NODE,
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
        kind: _Scene.Sector,
        hover: FLOW_NODE,
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
        // Tile and group highlights live under `tile.highlight` and `group.highlight`, not the series' `highlight`.
        name: 'treemap tiles',
        data: HIERARCHY_SHADOW_DATA,
        kind: _Scene.Rect,
        hover: FIRST_LEAF,
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
        kind: _Scene.Rect,
        hover: FIRST_GROUP,
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
        kind: _Scene.Sector,
        hover: FIRST_LEAF,
        layers: SELECTION_LAYERS,
        series: (shadow, highlight) => ({ type: 'sunburst', labelKey: 'name', sizeKey: 'size', shadow, highlight }),
    },
    {
        name: 'heatmap',
        data: GRID_DATA,
        kind: _Scene.Rect,
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
        kind: _Scene.Rect,
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
        kind: _Scene.RadialColumnShape,
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
        kind: _Scene.Rect,
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
        kind: _Scene.Marker,
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
        kind: _Scene.Marker,
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
        kind: _Scene.Marker,
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
];

describe('highlightedItem.shadow (enterprise series)', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: any;

    afterEach(() => {
        chart?.destroy();
        chart = undefined;
    });

    const casts = (shape: _Scene.Shape) => shape.fillShadow?.enabled === true;

    /** The visible in-place and highlight-layer shapes that cast (or would cast) the series' shadow. */
    const layersOf = (testCase: SeriesCase, series: any) => {
        const drawn = (shapes: Iterable<_Scene.Shape>) =>
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

    const hoverItem = async (
        testCase: SeriesCase,
        shadow: Shadow | undefined,
        highlight: object = {},
        drawingMode: 'cutout' | 'overlay' = 'cutout'
    ) => {
        const options = {
            data: testCase.data,
            animation: { enabled: false },
            legend: { enabled: false },
            highlight: { drawingMode },
            series: [testCase.series(shadow, highlight)],
        } as AgChartOptions;
        prepareEnterpriseTestOptions(options);
        chart = deproxy(AgCharts.create(options));
        await waitForChartStability(chart);

        const [series] = chart.series;
        const { inPlace: inPlaceBefore } = layersOf(testCase, series);

        const datum = testCase.hover?.(series) ?? series.getNodeData()[0];
        chart.ctx.highlightManager.updateHighlight(chart.id, datum);
        await waitForChartStability(chart);

        const L = layersOf(testCase, series);
        return { series, inPlaceBefore, ...L };
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
        it('replaces the series shadow on the hovered item with highlightedItem.shadow', async () => {
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

        it('applies highlightedItem.shadow when the series has no shadow', async () => {
            const { inPlace, highlighted } = await hoverItem(testCase, undefined, {
                highlightedItem: { shadow: HIGHLIGHT_SHADOW },
            });

            expect(highlighted.find(casts)?.fillShadow).toMatchObject(HIGHLIGHT_SHADOW);
            expect(inPlace.filter(casts).length).toBe(0);
        });
    });
});
