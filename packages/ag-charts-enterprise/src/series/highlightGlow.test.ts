import { afterEach, describe, expect, it, vi } from 'vitest';

import type { AgCandlestickSeriesOptions, AgChartInstance, AgChartOptions, AgGlowOptions } from 'ag-charts-community';
import { _ModuleSupport } from 'ag-charts-community';
import {
    HIGHLIGHT_GLOW,
    deproxy,
    getSeriesAt,
    getSeriesNodeData,
    getSeriesOptions,
    getSeriesSelectionNodes,
    glowShadow,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from 'ag-charts-community-test';
import { Color, RadialColumnShape, Rect, Sector, Transformable } from 'ag-charts-core';
import type { Shape } from 'ag-charts-core';

import { getFlowLinkData, getFlowNodeData, getSeriesGroup } from '../test/enterpriseSeriesAccessors';
import { getHierarchyRootNode } from '../test/seriesAccessors';
import { HIERARCHY_SHADOW_DATA, SHADOW, collectShapes, createEnterpriseChart } from '../test/utils';
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

/** The `highlight` option of a series: the cases only ever set the glow of the highlight styles. */
interface HighlightOptions {
    highlightedItem?: { fill?: string; stroke?: string; glow?: AgGlowOptions };
    unhighlightedItem?: { fill?: string; stroke?: string; glow?: AgGlowOptions };
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

/** The glow theme defaults, which a glow takes the fields it leaves unset from. */
const LIGHT_GLOW = { enabled: false, fillOpacity: 0.4, blur: 2, spread: 4 };
const DARK_GLOW = LIGHT_GLOW;

/** The colour the items of a case are painted in, which no theme palette uses, so the glow can only have taken it from the case. */
const PAINT = '#336699';

/** Whether two CSS colours are the same colour, whichever way each is written. */
const sameColour = (actual: unknown, expected: string) =>
    typeof actual === 'string' && Color.fromString(actual).toHexString() === Color.fromString(expected).toHexString();

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

/** Where a series takes its `itemStyler`: sankey and chord per part, waterfall per item kind, marker series on the marker. */
function withItemStyler(series: AnySeriesOptions, itemStyler: (params: object) => object): AnySeriesOptions {
    const options = { ...series } as Record<string, any>;
    const addTo = (key: string) => (options[key] = { ...options[key], itemStyler });
    switch (options.type) {
        case 'sankey':
        case 'chord':
            for (const key of ['node', 'link']) if (key in options) addTo(key);
            break;
        case 'waterfall':
            for (const key of ['positive', 'negative', 'total']) {
                options.item[key] = { ...options.item[key], itemStyler };
            }
            break;
        case 'radar-line':
        case 'radar-area':
        case 'range-area':
            addTo('marker');
            break;
        default:
            options.itemStyler = itemStyler;
    }
    return options as AnySeriesOptions;
}

/**
 * Where a series takes the paint of its items, so a case can set one colour and expect it back from the glow: the
 * stroke alone for an OHLC item, the colour scale for a heatmap, and the fill everywhere else.
 */
function withPaint(series: AnySeriesOptions, paint: string): AnySeriesOptions {
    const options = { ...series } as Record<string, any>;
    const merge = (key: string, style: object) => (options[key] = { ...options[key], ...style });
    switch (options.type) {
        case 'sankey':
        case 'chord':
            for (const key of ['node', 'link']) if (key in options) merge(key, { fill: paint });
            break;
        case 'treemap':
            merge('tile' in options ? 'tile' : 'group', { fill: paint });
            break;
        case 'sunburst':
        case 'funnel':
        case 'pyramid':
            options.fills = [paint];
            break;
        case 'heatmap':
            options.colorScale = { fills: [{ color: paint }, { color: paint }] };
            break;
        case 'waterfall':
            for (const key of ['positive', 'negative', 'total']) {
                options.item = { ...options.item, [key]: { ...options.item[key], fill: paint } };
            }
            break;
        case 'radar-line':
        case 'radar-area':
        case 'range-area':
            merge('marker', { fill: paint });
            break;
        case 'candlestick':
            options.item = { up: { fill: paint }, down: { fill: paint } };
            break;
        case 'ohlc':
            options.item = { up: { stroke: paint }, down: { stroke: paint } };
            break;
        default:
            options.fill = paint;
    }
    return options as AnySeriesOptions;
}

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
        name: 'radial-bar',
        data: POLAR_DATA,
        kind: Sector,
        series: (shadow, highlight) => ({
            type: 'radial-bar',
            angleKey: 'value',
            radiusKey: 'quarter',
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

describe('highlight glow (enterprise series)', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: AgChartInstance;

    afterEach(() => {
        chart?.destroy();
    });

    const casts = (shape: Shape) => shape.fillShadow?.enabled === true;

    /** The visible in-place and highlight-layer shapes of the case's shape kind. */
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
    const raiseHighlight = (datum?: HighlightNodeDatum) => {
        const { ctx, id } = deproxy(chart);
        ctx.highlightManager.updateHighlight(id, datum);
    };

    const hoverItem = async (
        testCase: SeriesCase,
        shadow: Shadow | undefined,
        highlightOptions: HighlightOptions = {},
        drawingMode: 'cutout' | 'overlay' = 'cutout'
    ) => {
        // The series of a case belongs to one chart kind, which a union of every chart kind's options cannot say.
        chart = await createEnterpriseChart({
            data: testCase.data,
            animation: { enabled: false },
            legend: { enabled: false },
            highlight: { drawingMode },
            ...testCase.chartOptions,
            series: [testCase.series(shadow, highlightOptions)],
        } as AgChartOptions);

        const datum = testCase.hover?.(chart) ?? getSeriesNodeData<HighlightNodeDatum>(chart)[0];
        if (datum != null) raiseHighlight(datum);
        await waitForChartStability(chart);

        return layersOf(testCase);
    };

    describe('glow with no spread around a shape with extras', () => {
        const candlestick = SERIES.find((testCase) => testCase.name === 'candlestick')!;
        const WHITE = [255, 255, 255, 255];

        // The wick is stroked and the body is not, so the wick is all that the glow has to reach past the body.
        const wicked: SeriesCase = {
            ...candlestick,
            series: (shadow, highlight): AgCandlestickSeriesOptions => ({
                type: 'candlestick',
                xKey: 'x',
                openKey: 'open',
                highKey: 'high',
                lowKey: 'low',
                closeKey: 'close',
                shadow,
                highlight,
                item: {
                    up: { fill: 'blue', stroke: 'none', wick: { stroke: 'blue', strokeWidth: 2 } },
                    down: { fill: 'blue', stroke: 'none', wick: { stroke: 'blue', strokeWidth: 2 } },
                },
            }),
        };

        const pixelsBesideWick = async (glow: AgGlowOptions, drawingMode: 'cutout' | 'overlay') => {
            const { highlighted } = await hoverItem(wicked, undefined, { highlightedItem: { glow } }, drawingMode);
            const [node] = highlighted;
            const { x, y, width } = Transformable.toCanvas(node);
            const pixelAt = (px: number, py: number) => [
                ...deproxy(chart).ctx.scene.canvas.context.getImageData(Math.round(px), Math.round(py), 1, 1).data,
            ];
            // On the upper wick, level with the glow that is cast from it.
            const centre = x + width / 2;
            return { near: pixelAt(centre + 4, y + 4), far: pixelAt(centre + 60, y + 4) };
        };

        it.each([
            ['with a blur and no fill', { enabled: true, spread: 0, blur: 8, fillOpacity: 1 }],
            ['with a blur and a fill', { enabled: true, spread: 0, blur: 8, fillOpacity: 1, fill: '#00ff00' }],
        ] as const)('casts the glow of the wick, at a spread of 0, %s', async (_name, glow) => {
            const { near, far } = await pixelsBesideWick(glow, 'overlay');

            expect(near).not.toEqual(WHITE);
            expect(far).toEqual(WHITE);
        });
    });

    describe('glow fill from a colour scale', () => {
        const byName = (name: string) => SERIES.find((testCase) => testCase.name === name)!;

        // The scale runs from red at the smallest value to blue at the largest.
        const SCALE = { fills: [{ color: '#ff0000' }, { color: '#0000ff' }] };

        it('takes the colour that the scale gives each heatmap cell', async () => {
            const heatmap = byName('heatmap');
            const scaled: SeriesCase = {
                ...heatmap,
                series: (shadow, highlight) => ({
                    ...heatmap.series(shadow, highlight),
                    colorScale: SCALE,
                }),
            };
            // GRID_DATA values: the first cell holds the smallest (1), the fourth the largest (5).
            for (const [index, expected] of [
                [0, '#ff0000'],
                [3, '#0000ff'],
            ] as const) {
                const { highlighted } = await hoverItem(
                    { ...scaled, hover: (c) => getSeriesNodeData<HighlightNodeDatum>(c)[index] },
                    undefined,
                    { highlightedItem: { glow: { enabled: true } } }
                );
                expect(highlighted).toHaveLength(1);
                expect(sameColour(highlighted[0].getCastShadow()?.fill, expected)).toBe(true);
                chart.destroy();
            }
        });

        it.each(['treemap tiles', 'sunburst'])('takes the colour that the scale gives each %s item', async (name) => {
            const testCase = byName(name);
            const coloured: SeriesCase = {
                ...testCase,
                series: (shadow, highlight) => ({
                    ...testCase.series(shadow, highlight),
                    colorKey: 'size',
                    colorScale: SCALE,
                }),
            };
            // The leaves of HIERARCHY_SHADOW_DATA hold 10, 6, 8 and 4: the scale gives the largest blue and the smallest red.
            const bySize = (pick: 'smallest' | 'largest') => (instance: AgChartInstance) => {
                const leaves = [...hierarchyRoot(instance)].filter((node) => node.children.length === 0);
                leaves.sort((a, b) => a.sumSize - b.sumSize);
                return pick === 'smallest' ? leaves[0] : leaves.at(-1)!;
            };
            for (const [hover, expected] of [
                [bySize('smallest'), '#ff0000'],
                [bySize('largest'), '#0000ff'],
            ] as const) {
                const { highlighted } = await hoverItem({ ...coloured, hover }, undefined, {
                    highlightedItem: { glow: { enabled: true } },
                });
                expect(highlighted).toHaveLength(1);
                expect(sameColour(highlighted[0].getCastShadow()?.fill, expected)).toBe(true);
                chart.destroy();
            }
        });
    });

    describe('map-shape series sharing a legendItemName', () => {
        it('casts the glow from every item of the sibling series, including the one at the hovered index', async () => {
            const sibling = {
                type: 'map-shape',
                idKey: 'name',
                legendItemName: 'Shared',
                fill: 'red',
                stroke: 'red',
                shadow: SHADOW,
                highlight: { unhighlightedItem: { glow: HIGHLIGHT_GLOW } },
            };
            chart = await createEnterpriseChart({
                data: ukData,
                topology: ukTopology,
                animation: { enabled: false },
                legend: { enabled: false },
                series: [sibling, sibling],
            } as AgChartOptions);
            raiseHighlight(getSeriesNodeData<HighlightNodeDatum>(chart, 0)[0]);
            await waitForChartStability(chart);

            const drawn = (index: number) =>
                [...collectShapes(getSeriesAt(chart, index).contentGroup)].filter(
                    (shape) => shape instanceof GeoGeometry && shape.visible
                );
            const [hovered, ...others] = drawn(0);
            expect(hovered.fillShadow).toMatchObject(SHADOW);
            for (const shape of others) expect(shape.fillShadow).toMatchObject(glowShadow(HIGHLIGHT_GLOW));

            expect(drawn(1).length).toBeGreaterThan(0);
            for (const shape of drawn(1)) expect(shape.fillShadow).toMatchObject(glowShadow(HIGHLIGHT_GLOW));
        });
    });

    describe.each(SERIES)('$name', (testCase) => {
        const copies = testCase.hoveredCopies ?? 1;

        it.each(['cutout', 'overlay'] as const)(
            'casts only the highlightedItem glow from the hovered item in %s mode',
            async (drawingMode) => {
                const { highlighted } = await hoverItem(
                    testCase,
                    undefined,
                    { highlightedItem: { glow: HIGHLIGHT_GLOW } },
                    drawingMode
                );

                expect(highlighted.length).toBeGreaterThan(0);
                expect(highlighted.filter(casts)).toHaveLength(copies);
                expect(highlighted.find(casts)?.fillShadow).toMatchObject(glowShadow(HIGHLIGHT_GLOW));
            }
        );

        it('gives the itemStyler params no glow, in any highlight state', async () => {
            const params: object[] = [];
            const itemStyler = (itemParams: object) => {
                params.push(itemParams);
                return {};
            };
            const styled: SeriesCase = {
                ...testCase,
                series: (shadow, highlight) => withItemStyler(testCase.series(shadow, highlight), itemStyler),
            };
            await hoverItem(styled, undefined, {
                highlightedItem: { glow: HIGHLIGHT_GLOW },
                unhighlightedItem: { glow: HIGHLIGHT_GLOW },
            });

            expect(params.length).toBeGreaterThan(0);
            for (const itemParams of params) expect(itemParams).not.toHaveProperty('glow');
        });

        it('takes the fill of the item that it surrounds when it sets none, or its stroke where it has no fill', async () => {
            // An OHLC item is a stroke alone.
            const painted: SeriesCase = {
                ...testCase,
                series: (shadow, highlight) => withPaint(testCase.series(shadow, highlight), PAINT),
            };
            const { highlighted } = await hoverItem(painted, undefined, {
                highlightedItem: { glow: { enabled: true } },
            });

            const shapes = highlighted.filter((shape) => shape.getCastShadow() != null);
            expect(shapes.length).toBeGreaterThan(0);
            for (const shape of shapes) {
                expect(shape.getCastShadow()).toMatchObject({ enabled: true, fillOpacity: 0.4 });
                expect(sameColour(shape.getCastShadow()?.fill, PAINT)).toBe(true);
            }
        });

        it('takes the fill of the highlight style where the item is highlighted with another', async () => {
            const style = testCase.name === 'ohlc' ? { stroke: 'orange' } : { fill: 'orange' };
            const { highlighted } = await hoverItem(testCase, undefined, {
                highlightedItem: { ...style, glow: { enabled: true } },
            });

            const shapes = highlighted.filter((shape) => shape.getCastShadow() != null);
            expect(shapes.length).toBeGreaterThan(0);
            for (const shape of shapes) expect(sameColour(shape.getCastShadow()?.fill, 'orange')).toBe(true);
        });

        it('casts its own fill and fillOpacity, and not that of the item, when it sets them', async () => {
            const { highlighted } = await hoverItem(testCase, undefined, {
                highlightedItem: { glow: { enabled: true, fill: '#123456', fillOpacity: 0.7 } },
            });

            const shapes = highlighted.filter(casts);
            expect(shapes.length).toBeGreaterThan(0);
            for (const shape of shapes) {
                expect(shape.getCastShadow()).toMatchObject({ fill: '#123456', fillOpacity: 0.7 });
            }
        });

        it('rejects a glow colour, which a glow no longer has', async () => {
            const { highlighted } = await hoverItem(testCase, undefined, {
                highlightedItem: { glow: { enabled: true, color: '#ff00ff' } as AgGlowOptions },
            });

            const messages = vi
                .mocked(console.warn)
                .mock.calls.map(([message]) => String(message))
                .filter((message) => message.includes('glow.color'));
            expect(messages.length).toBeGreaterThan(0);
            for (const shape of highlighted.filter(casts)) {
                expect(shape.fillShadow).not.toHaveProperty('color');
                expect(shape.getCastShadow()?.fill).not.toBe('#ff00ff');
            }
            vi.mocked(console.warn).mockClear();
        });

        it('casts no glow unless it is enabled', async () => {
            const { highlighted } = await hoverItem(testCase, undefined);

            expect(highlighted.length).toBeGreaterThan(0);
            expect(highlighted.filter(casts)).toHaveLength(0);
        });

        it.each([
            ['ag-default', LIGHT_GLOW],
            ['ag-default-dark', LIGHT_GLOW],
        ])('casts the %s theme glow once only enabled is set', async (theme, defaults) => {
            const themed = { ...testCase, chartOptions: { ...testCase.chartOptions, theme } };
            const { highlighted } = await hoverItem(themed, undefined, {
                highlightedItem: { glow: { enabled: true } },
            });

            expect(highlighted.find(casts)?.fillShadow).toMatchObject({
                ...defaults,
                enabled: true,
                xOffset: 0,
                yOffset: 0,
            });
        });

        it('casts no glow when it is configured but disabled', async () => {
            const { highlighted } = await hoverItem(testCase, undefined, {
                highlightedItem: { glow: { ...HIGHLIGHT_GLOW, enabled: false } },
            });

            expect(highlighted.filter(casts)).toHaveLength(0);
        });

        it.each(['cutout', 'overlay'] as const)(
            'keeps the base shadow on every in-place item and off the highlight copy in %s mode',
            async (drawingMode) => {
                const { inPlace, highlighted } = await hoverItem(
                    testCase,
                    SHADOW,
                    { highlightedItem: { glow: HIGHLIGHT_GLOW } },
                    drawingMode
                );

                // Every in-place item, the hovered one included, casts the base shadow ...
                expect(inPlace.length).toBeGreaterThan(0);
                for (const shape of inPlace) expect(shape.fillShadow).toMatchObject(SHADOW);

                // ... and the highlight copy casts the glow alone, never merged with the base shadow.
                expect(highlighted.filter(casts)).toHaveLength(copies);
                for (const shape of highlighted.filter(casts)) {
                    expect(shape.fillShadow).toMatchObject(glowShadow(HIGHLIGHT_GLOW));
                    expect(shape.fillShadow?.fill).not.toBe(SHADOW.fill);
                }
            }
        );

        it.each(['cutout', 'overlay'] as const)(
            'does not cast the base shadow from the highlight copy when there is no glow in %s mode',
            async (drawingMode) => {
                const { inPlace, highlighted } = await hoverItem(testCase, SHADOW, {}, drawingMode);

                expect(highlighted.filter(casts)).toHaveLength(0);
                for (const shape of inPlace) expect(shape.fillShadow).toMatchObject(SHADOW);
            }
        );

        it('moves the glow from one hovered item to the next and ends it with the hover', async () => {
            await hoverItem(testCase, undefined, { highlightedItem: { glow: HIGHLIGHT_GLOW } });

            const nodeData = () => getSeriesNodeData<HighlightNodeDatum>(chart);
            const first = testCase.hover?.(chart) ?? nodeData()[0];
            const next = testCase.hoverNext?.(chart) ?? nodeData().find((d) => d.datumIndex !== first.datumIndex);
            raiseHighlight(next);
            await waitForChartStability(chart);

            const moved = layersOf(testCase);
            expect(moved.highlighted.filter(casts)).toHaveLength(copies);
            expect(moved.highlighted.find(casts)?.fillShadow).toMatchObject(glowShadow(HIGHLIGHT_GLOW));

            raiseHighlight();
            await waitForChartStability(chart);

            const { inPlace } = layersOf(testCase);
            expect(inPlace.filter(casts)).toHaveLength(0);
        });
    });

    describe.each(SERIES.filter(({ name }) => name === 'funnel' || name === 'pyramid'))(
        '$name legend highlight',
        (testCase) => {
            it('casts the unhighlightedItem glow from every stage, as no stage has a highlight copy', async () => {
                await hoverItem(testCase, SHADOW, { unhighlightedItem: { glow: HIGHLIGHT_GLOW } });

                // A legend item of a stage is a highlight with an index but no datum, and nothing to draw.
                const [stage] = getSeriesNodeData<HighlightNodeDatum>(chart);
                raiseHighlight();
                await waitForChartStability(chart);
                raiseHighlight({ ...stage, datum: undefined, itemId: undefined });
                await waitForChartStability(chart);

                const { inPlace, highlighted } = layersOf(testCase);
                expect(inPlace.length).toBeGreaterThan(1);
                expect(highlighted.filter(casts)).toHaveLength(0);
                for (const shape of inPlace) expect(shape.fillShadow).toMatchObject(glowShadow(HIGHLIGHT_GLOW));
            });
        }
    );

    describe('highlight shadow is rejected', () => {
        const warnings = () => vi.mocked(console.warn).mock.calls.map(([message]) => String(message));

        /** The series options with `style` as the highlighted item, wherever this series reads its highlight from. */
        const REJECTING: Array<{ name: string; testCase: SeriesCase; build: (style: object) => object }> = [
            {
                name: 'sunburst',
                testCase: SERIES.find(({ name }) => name === 'sunburst')!,
                build: (style) => ({
                    type: 'sunburst',
                    labelKey: 'name',
                    sizeKey: 'size',
                    highlight: { highlightedItem: style },
                }),
            },
            {
                name: 'treemap tile',
                testCase: SERIES.find(({ name }) => name === 'treemap tiles')!,
                build: (style) => ({
                    type: 'treemap',
                    labelKey: 'name',
                    sizeKey: 'size',
                    tile: { highlight: { highlightedItem: style } },
                }),
            },
            {
                name: 'treemap group',
                testCase: SERIES.find(({ name }) => name === 'treemap groups')!,
                build: (style) => ({
                    type: 'treemap',
                    labelKey: 'name',
                    sizeKey: 'size',
                    group: { highlight: { highlightedItem: style } },
                }),
            },
            ...SERIES.filter(({ name }) => !/^(sunburst|treemap)/.test(name)).map((testCase) => ({
                name: testCase.name,
                testCase,
                build: (style: object) => testCase.series(undefined, { highlightedItem: style }),
            })),
        ];

        it.each(REJECTING)('warns about and drops highlightedItem.shadow on $name', async ({ testCase, build }) => {
            chart = await createEnterpriseChart({
                data: testCase.data,
                animation: { enabled: false },
                legend: { enabled: false },
                ...testCase.chartOptions,
                series: [build({ shadow: SHADOW })],
            } as AgChartOptions);

            const messages = warnings().filter((message) => message.includes('highlightedItem.shadow'));
            expect(messages.length).toBeGreaterThan(0);
            vi.mocked(console.warn).mockClear();

            // Nothing is cast from the highlight copy for the rejected option.
            const datum = testCase.hover?.(chart) ?? getSeriesNodeData<HighlightNodeDatum>(chart)[0];
            raiseHighlight(datum);
            await waitForChartStability(chart);
            expect(layersOf(testCase).highlighted.filter(casts)).toHaveLength(0);
        });
    });

    describe('theme defaults', () => {
        const HIERARCHY = (series: object) => ({ labelKey: 'name', sizeKey: 'size', ...series });
        const BRANCH_BUCKETS = ['highlightedItem', 'unhighlightedItem', 'highlightedBranch', 'unhighlightedBranch'];
        const ITEM_BUCKETS = ['highlightedItem', 'unhighlightedItem'];
        const SERIES_BUCKETS = [...ITEM_BUCKETS, 'highlightedSeries', 'unhighlightedSeries'];

        const resolvedOptions = async (theme: string, series: object, data: object[] = HIERARCHY_SHADOW_DATA) => {
            chart = await createEnterpriseChart({
                theme,
                data,
                animation: { enabled: false },
                legend: { enabled: false },
                series: [series],
            } as AgChartOptions);
            return getSeriesOptions<any>(chart);
        };

        // `defaulted` are the buckets that carry the glow theme defaults, which the others fall back to.
        const CASES: Array<{
            name: string;
            series: object;
            data?: object[];
            buckets: string[];
            defaulted: string[];
            highlight: (options: any) => any;
        }> = [
            {
                name: 'treemap tile',
                series: HIERARCHY({ type: 'treemap' }),
                buckets: BRANCH_BUCKETS,
                defaulted: ['highlightedBranch', 'unhighlightedBranch'],
                highlight: (options) => options.tile.highlight,
            },
            {
                name: 'treemap group',
                series: HIERARCHY({ type: 'treemap' }),
                buckets: ITEM_BUCKETS,
                defaulted: ITEM_BUCKETS,
                highlight: (options) => options.group.highlight,
            },
            {
                name: 'sunburst',
                series: HIERARCHY({ type: 'sunburst' }),
                buckets: BRANCH_BUCKETS,
                defaulted: ['highlightedBranch', 'unhighlightedBranch'],
                highlight: (options) => options.highlight,
            },
            {
                name: 'radial-bar',
                data: POLAR_DATA,
                series: { type: 'radial-bar', angleKey: 'value', radiusKey: 'quarter' },
                buckets: SERIES_BUCKETS,
                defaulted: ['highlightedSeries', 'unhighlightedSeries'],
                highlight: (options) => options.highlight,
            },
            {
                name: 'heatmap',
                data: GRID_DATA,
                series: { type: 'heatmap', xKey: 'x', yKey: 'y', colorKey: 'value' },
                buckets: ITEM_BUCKETS,
                defaulted: ITEM_BUCKETS,
                highlight: (options) => options.highlight,
            },
            {
                name: 'candlestick',
                data: OHLC_DATA,
                series: {
                    type: 'candlestick',
                    xKey: 'x',
                    openKey: 'open',
                    highKey: 'high',
                    lowKey: 'low',
                    closeKey: 'close',
                },
                buckets: SERIES_BUCKETS,
                defaulted: ['highlightedSeries', 'unhighlightedSeries'],
                highlight: (options) => options.highlight,
            },
            {
                name: 'sankey',
                data: FLOW_DATA,
                series: { type: 'sankey', fromKey: 'from', toKey: 'to', sizeKey: 'size' },
                buckets: ITEM_BUCKETS,
                defaulted: ITEM_BUCKETS,
                highlight: (options) => options.highlight,
            },
        ];

        describe.each(CASES)('$name', ({ series, data, buckets, defaulted, highlight: highlightOf }) => {
            it.each([
                ['light', 'ag-default', LIGHT_GLOW],
                ['dark', 'ag-default-dark', DARK_GLOW],
            ])(
                'puts the %s glow theme defaults, with the glow off, on the buckets the others fall back to',
                async (_, theme, expected) => {
                    const styles = highlightOf(await resolvedOptions(theme, series, data));

                    for (const bucket of defaulted) expect(styles[bucket].glow).toEqual(expected);
                }
            );

            it('leaves the glow of the other buckets unset, so a glow on a broader bucket reaches them', async () => {
                const styles = highlightOf(await resolvedOptions('ag-default', series, data));

                for (const bucket of buckets.filter((name) => !defaulted.includes(name))) {
                    expect(styles[bucket]?.glow).toBeUndefined();
                }
            });
        });

        it('gives the series without a glow no glow theme defaults', async () => {
            const options = await resolvedOptions(
                'ag-default',
                { type: 'cone-funnel', stageKey: 'stage', valueKey: 'value' },
                [...STAGE_DATA]
            );
            for (const bucket of SERIES_BUCKETS) {
                expect(options.highlight?.[bucket]?.glow).toBeUndefined();
            }
            chart.destroy();
        });
    });
});
