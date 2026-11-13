import {
    type GlowPlacement,
    type GlowSeriesCase,
    HIGHLIGHT_GLOW,
    type HighlightStep,
    onMarker,
    onSeries,
} from 'ag-charts-community-test';

import { ukData } from '../series/map-test/ukData';
import ukTopology from '../series/map-test/ukTopology.json';
import { getFlowLinkData, getFlowNodeData } from './enterpriseSeriesAccessors';
import { getHierarchyRootNode } from './seriesAccessors';
import { FLOW_DATA, HIERARCHY_SHADOW_DATA, OHLC_DATA, WATERFALL_DATA } from './utils';

export const STAGES = [
    { stage: 'Visits', value: 100 },
    { stage: 'Sign-ups', value: 60 },
    { stage: 'Paid', value: 20 },
];
export const GRID = [
    { x: 'a', y: 'p', value: 1 },
    { x: 'b', y: 'p', value: 3 },
    { x: 'a', y: 'q', value: 2 },
    { x: 'b', y: 'q', value: 5 },
];
export const POLAR = [
    { quarter: 'Q1', value: 5, low: 2 },
    { quarter: 'Q2', value: 8, low: 3 },
    { quarter: 'Q3', value: 3, low: 1 },
];
export const RANGE = [
    { x: 'Q1', low: 2, high: 5 },
    { x: 'Q2', low: 3, high: 8 },
    { x: 'Q3', low: 1, high: 3 },
];
export const OHLC_KEYS = { xKey: 'x', openKey: 'open', highKey: 'high', lowKey: 'low', closeKey: 'close' };
export const BOX_PLOT = [
    { x: 'Q1', min: 3, q1: 4, median: 5, q3: 6, max: 7 },
    { x: 'Q2', min: 4, q1: 5, median: 6, q3: 7, max: 8 },
];

const onPart =
    (part: 'node' | 'link') =>
    ({ shadow, glow, itemStyler }: GlowPlacement) => ({ [part]: { shadow, glow, itemStyler } });

const FLOW = { fromKey: 'from', toKey: 'to', sizeKey: 'size' };
const RANGE_KEYS = { xKey: 'x', yLowKey: 'low', yHighKey: 'high' };
const WATERFALL_ITEMS = ({ shadow, glow, itemStyler }: GlowPlacement) => ({
    item: {
        positive: { shadow, glow, itemStyler },
        negative: { shadow, glow, itemStyler },
        total: { shadow, glow, itemStyler },
    },
});

export const ENTERPRISE_GLOW_SERIES: GlowSeriesCase[] = [
    {
        name: 'range-bar',
        shadowSnapshot: 'series/range-bar/rangeBar.test.ts',
        type: 'range-bar',
        data: RANGE,
        hoverable: true,
        base: { type: 'range-bar', ...RANGE_KEYS },
        place: onSeries,
    },
    {
        name: 'box-plot',
        shadowSnapshot: 'series/box-plot/boxPlotSeries.test.ts',
        type: 'box-plot',
        data: BOX_PLOT,
        hoverable: true,
        base: {
            type: 'box-plot',
            xKey: 'x',
            minKey: 'min',
            q1Key: 'q1',
            medianKey: 'median',
            q3Key: 'q3',
            maxKey: 'max',
        },
        place: onSeries,
    },
    {
        name: 'candlestick',
        shadowSnapshot: 'series/candlestick/candlestickSeries.test.ts',
        type: 'candlestick',
        data: OHLC_DATA,
        hoverable: true,
        base: { type: 'candlestick', ...OHLC_KEYS },
        place: onSeries,
    },
    {
        name: 'ohlc',
        shadowSnapshot: 'series/ohlc/ohlcSeries.test.ts',
        type: 'ohlc',
        data: OHLC_DATA,
        hoverable: true,
        base: { type: 'ohlc', ...OHLC_KEYS },
        place: onSeries,
    },
    {
        name: 'hlc markers',
        shadowSnapshot: 'series/hlc/hlcSeries.test.ts',
        type: 'hlc',
        data: OHLC_DATA,
        hoverable: true,
        base: { type: 'hlc', xKey: 'x', highKey: 'high', lowKey: 'low', closeKey: 'close' },
        place: onMarker,
    },
    {
        name: 'funnel',
        itemHighlightOnly: true,
        singleSeries: true,
        type: 'funnel',
        data: STAGES,
        hoverable: true,
        base: { type: 'funnel', stageKey: 'stage', valueKey: 'value' },
        place: onSeries,
    },
    {
        name: 'cone funnel',
        shadowSnapshot: 'series/cone-funnel/coneFunnel.test.ts',
        type: 'cone-funnel',
        data: STAGES,
        noItemStyler: true,
        base: { type: 'cone-funnel', stageKey: 'stage', valueKey: 'value' },
        place: ({ shadow, glow }) => ({ shadow, glow }),
    },
    {
        name: 'pyramid',
        itemHighlightOnly: true,
        singleSeries: true,
        type: 'pyramid',
        data: STAGES,
        hoverable: true,
        base: { type: 'pyramid', stageKey: 'stage', valueKey: 'value' },
        place: onSeries,
    },
    {
        name: 'heatmap',
        shadowSnapshot: 'series/heatmap/heatmap.test.ts',
        itemHighlightOnly: true,
        type: 'heatmap',
        data: GRID,
        hoverable: true,
        base: { type: 'heatmap', xKey: 'x', yKey: 'y', colorKey: 'value' },
        place: onSeries,
    },
    {
        name: 'radial-column',
        shadowSnapshot: 'series/radial-column/radialColumn.test.ts',
        type: 'radial-column',
        data: POLAR,
        hoverable: true,
        base: { type: 'radial-column', angleKey: 'quarter', radiusKey: 'value' },
        place: onSeries,
    },
    {
        name: 'radial-bar',
        shadowSnapshot: 'series/radial-bar/radialBar.test.ts',
        type: 'radial-bar',
        data: POLAR,
        hoverable: true,
        base: { type: 'radial-bar', angleKey: 'value', radiusKey: 'quarter' },
        place: onSeries,
    },
    {
        name: 'nightingale',
        shadowSnapshot: 'series/radial-column/radialColumn.test.ts',
        type: 'nightingale',
        data: POLAR,
        hoverable: true,
        base: { type: 'nightingale', angleKey: 'quarter', radiusKey: 'value' },
        place: onSeries,
    },
    {
        name: 'radar-line markers',
        type: 'radar-line',
        data: POLAR,
        hoverable: true,
        base: { type: 'radar-line', angleKey: 'quarter', radiusKey: 'value' },
        place: onMarker,
    },
    {
        name: 'radar-area markers',
        type: 'radar-area',
        data: POLAR,
        hoverable: true,
        base: { type: 'radar-area', angleKey: 'quarter', radiusKey: 'value' },
        place: onMarker,
    },
    {
        name: 'radar-area fill',
        shadowSnapshot: 'series/radar-area/radarArea.test.ts',
        type: 'radar-area',
        data: POLAR,
        seriesShadowOnly: true,
        noItemStyler: true,
        base: { type: 'radar-area', angleKey: 'quarter', radiusKey: 'value' },
        place: ({ shadow }) => ({ shadow }),
    },
    {
        name: 'range-area markers',
        type: 'range-area',
        data: RANGE,
        hoverable: true,
        base: { type: 'range-area', ...RANGE_KEYS },
        place: onMarker,
    },
    {
        name: 'range-area fill',
        type: 'range-area',
        data: RANGE,
        seriesShadowOnly: true,
        noItemStyler: true,
        base: { type: 'range-area', ...RANGE_KEYS },
        place: ({ shadow }) => ({ shadow }),
    },
    {
        name: 'waterfall',
        shadowSnapshot: 'series/waterfall/waterfall.test.ts',
        itemHighlightOnly: true,
        singleSeries: true,
        type: 'waterfall',
        data: [...WATERFALL_DATA, { x: 'Total', y: 12 }],
        hoverable: true,
        base: {
            type: 'waterfall',
            xKey: 'x',
            yKey: 'y',
            totals: [{ totalType: 'subtotal', index: 3, axisLabel: 'Total' }],
        },
        place: WATERFALL_ITEMS,
    },
    {
        name: 'sankey nodes',
        shadowSnapshot: 'series/sankey/sankeySeries.test.ts',
        itemHighlightOnly: true,
        singleSeries: true,
        reachesOtherParts: true,
        type: 'sankey',
        data: FLOW_DATA,
        hoverable: true,
        hoverDatum: (chart) => getFlowNodeData(chart)[0],
        base: { type: 'sankey', ...FLOW },
        place: onPart('node'),
    },
    {
        name: 'sankey links',
        shadowSnapshot: 'series/sankey/sankeySeries.test.ts',
        itemHighlightOnly: true,
        singleSeries: true,
        reachesOtherParts: true,
        type: 'sankey',
        data: FLOW_DATA,
        hoverable: true,
        hoverDatum: (chart) => getFlowLinkData(chart)[0],
        base: { type: 'sankey', ...FLOW },
        place: onPart('link'),
    },
    {
        name: 'chord nodes',
        shadowSnapshot: 'series/chord/chordSeries.test.ts',
        itemHighlightOnly: true,
        singleSeries: true,
        reachesOtherParts: true,
        type: 'chord',
        data: FLOW_DATA,
        hoverable: true,
        hoverDatum: (chart) => getFlowNodeData(chart)[0],
        base: { type: 'chord', ...FLOW },
        place: onPart('node'),
    },
    {
        name: 'chord links',
        shadowSnapshot: 'series/chord/chordSeries.test.ts',
        itemHighlightOnly: true,
        singleSeries: true,
        reachesOtherParts: true,
        type: 'chord',
        data: FLOW_DATA,
        hoverable: true,
        hoverDatum: (chart) => getFlowLinkData(chart)[0],
        base: { type: 'chord', ...FLOW },
        place: onPart('link'),
    },
    {
        name: 'map-shape',
        shadowSnapshot: 'series/map-shape/mapShapeSeries.test.ts',
        type: 'map-shape',
        data: ukData,
        hoverable: true,
        chartOptions: { topology: ukTopology },
        base: { type: 'map-shape', idKey: 'name' },
        place: onSeries,
    },
    {
        name: 'map-marker',
        type: 'map-marker',
        data: ukData,
        hoverable: true,
        chartOptions: { topology: ukTopology },
        base: { type: 'map-marker', idKey: 'name' },
        place: onSeries,
    },
];

/** The node of a hierarchy series that the pointer is on: a leaf, or a group of the treemap. */
export const nodeNamed = (name: string) => (chart: Parameters<NonNullable<GlowSeriesCase['hoverDatum']>>[0]) => {
    for (const node of getHierarchyRootNode(chart)!) if (node.datum?.name === name) return node;
    throw new Error(`No node named ${name}`);
};

/**
 * Hovering a leaf gives the nodes of its branch `highlighted-branch` and those of the other branch `unhighlighted-branch`,
 * and never `unhighlighted-item`: the `unhighlightedItem` glow is cast on the nodes that are given `highlighted-branch`.
 */
const HIERARCHY_STEPS: HighlightStep[] = [
    { state: 'highlighted-item', bucket: 'highlightedItem', hover: true },
    { bucket: 'unhighlightedItem', hover: true },
    // The `highlightedBranch` glow is cast on the hovered item too, which an itemStyler is given `highlighted-item` for.
    { state: 'highlighted-branch', bucket: 'highlightedBranch', hover: true, bucketReachesOtherStates: true },
    { state: 'unhighlighted-branch', bucket: 'unhighlightedBranch', hover: true },
];

/** Hovering a group of the treemap gives the other group `unhighlighted-item`. */
const GROUP_STEPS: HighlightStep[] = [
    { state: 'highlighted-item', bucket: 'highlightedItem', hover: true },
    { state: 'unhighlighted-item', bucket: 'unhighlightedItem', hover: true },
];

const HIERARCHY = {
    // Two top-level branches, so that hovering a leaf of A leaves B as the other branch.
    data: HIERARCHY_SHADOW_DATA[0].children,
    hoverable: true,
    // A hierarchy takes a series shadow, and a glow in its highlight states only.
    seriesShadowOnly: true,
    hoveredItem: { glow: HIGHLIGHT_GLOW },
};
const HIERARCHY_KEYS = { labelKey: 'name', sizeKey: 'size' };
const withHighlight = (part?: 'tile' | 'group') => (placed: any, highlight: object) =>
    part === undefined ? { ...placed, highlight } : { ...placed, [part]: { ...placed[part], highlight } };

export const HIERARCHY_GLOW_SERIES: GlowSeriesCase[] = [
    {
        ...HIERARCHY,
        name: 'sunburst',
        type: 'sunburst',
        shadowSnapshot: 'series/sunburst/sunburstSeries.test.ts',
        highlightSteps: HIERARCHY_STEPS,
        hoverDatum: nodeNamed('A1'),
        base: { type: 'sunburst', ...HIERARCHY_KEYS },
        place: ({ shadow, itemStyler }) => ({ shadow, itemStyler }),
        placeHighlight: withHighlight(),
    },
    {
        ...HIERARCHY,
        name: 'treemap tile',
        stylerCastsOtherParts: true,
        type: 'treemap',
        shadowSnapshot: 'series/treemap/treemapSeries.test.ts',
        highlightSteps: HIERARCHY_STEPS,
        hoverDatum: nodeNamed('A1'),
        base: { type: 'treemap', ...HIERARCHY_KEYS },
        place: ({ shadow, itemStyler }) => ({ tile: { shadow }, itemStyler }),
        placeHighlight: withHighlight('tile'),
    },
    {
        ...HIERARCHY,
        name: 'treemap group',
        type: 'treemap',
        shadowSnapshot: 'series/treemap/treemapSeries.test.ts',
        highlightSteps: GROUP_STEPS,
        stylerCastsOtherParts: true,
        hoverDatum: nodeNamed('A'),
        base: { type: 'treemap', ...HIERARCHY_KEYS },
        place: ({ shadow, itemStyler }) => ({ group: { shadow }, itemStyler }),
        placeHighlight: withHighlight('group'),
    },
];
