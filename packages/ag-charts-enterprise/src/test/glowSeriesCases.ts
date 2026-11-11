import type { GlowPlacement, GlowSeriesCase } from 'ag-charts-community-test';

import { ukData } from '../series/map-test/ukData';
import ukTopology from '../series/map-test/ukTopology.json';
import { getFlowLinkData, getFlowNodeData } from './enterpriseSeriesAccessors';
import { FLOW_DATA, OHLC_DATA, WATERFALL_DATA } from './utils';

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

const onSeries = ({ shadow, glow, itemStyler }: GlowPlacement) => ({ shadow, glow, itemStyler });
const onMarker = ({ shadow, glow, itemStyler }: GlowPlacement) => ({
    marker: { enabled: true, shadow, glow, itemStyler },
});
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
        type: 'range-bar',
        data: RANGE,
        hoverable: true,
        base: { type: 'range-bar', ...RANGE_KEYS },
        place: onSeries,
    },
    {
        name: 'box-plot',
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
        type: 'candlestick',
        data: OHLC_DATA,
        hoverable: true,
        base: { type: 'candlestick', ...OHLC_KEYS },
        place: onSeries,
    },
    {
        name: 'ohlc',
        type: 'ohlc',
        data: OHLC_DATA,
        hoverable: true,
        base: { type: 'ohlc', ...OHLC_KEYS },
        place: onSeries,
    },
    {
        name: 'hlc markers',
        type: 'hlc',
        data: OHLC_DATA,
        hoverable: true,
        base: { type: 'hlc', xKey: 'x', highKey: 'high', lowKey: 'low', closeKey: 'close' },
        place: onMarker,
    },
    {
        name: 'funnel',
        type: 'funnel',
        data: STAGES,
        hoverable: true,
        base: { type: 'funnel', stageKey: 'stage', valueKey: 'value' },
        place: onSeries,
    },
    {
        name: 'cone funnel',
        type: 'cone-funnel',
        data: STAGES,
        noItemStyler: true,
        base: { type: 'cone-funnel', stageKey: 'stage', valueKey: 'value' },
        place: ({ shadow, glow }) => ({ shadow, glow }),
    },
    {
        name: 'pyramid',
        type: 'pyramid',
        data: STAGES,
        hoverable: true,
        base: { type: 'pyramid', stageKey: 'stage', valueKey: 'value' },
        place: onSeries,
    },
    {
        name: 'heatmap',
        type: 'heatmap',
        data: GRID,
        hoverable: true,
        base: { type: 'heatmap', xKey: 'x', yKey: 'y', colorKey: 'value' },
        place: onSeries,
    },
    {
        name: 'radial-column',
        type: 'radial-column',
        data: POLAR,
        hoverable: true,
        base: { type: 'radial-column', angleKey: 'quarter', radiusKey: 'value' },
        place: onSeries,
    },
    {
        name: 'radial-bar',
        type: 'radial-bar',
        data: POLAR,
        hoverable: true,
        base: { type: 'radial-bar', angleKey: 'value', radiusKey: 'quarter' },
        place: onSeries,
    },
    {
        name: 'nightingale',
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
        type: 'waterfall',
        data: [...WATERFALL_DATA, { x: 'Total', y: 12 }],
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
        type: 'sankey',
        data: FLOW_DATA,
        hoverable: true,
        hoverDatum: (chart) => getFlowNodeData(chart)[0],
        base: { type: 'sankey', ...FLOW },
        place: onPart('node'),
    },
    {
        name: 'sankey links',
        type: 'sankey',
        data: FLOW_DATA,
        hoverable: true,
        hoverDatum: (chart) => getFlowLinkData(chart)[0],
        base: { type: 'sankey', ...FLOW },
        place: onPart('link'),
    },
    {
        name: 'chord nodes',
        type: 'chord',
        data: FLOW_DATA,
        hoverable: true,
        hoverDatum: (chart) => getFlowNodeData(chart)[0],
        base: { type: 'chord', ...FLOW },
        place: onPart('node'),
    },
    {
        name: 'chord links',
        type: 'chord',
        data: FLOW_DATA,
        hoverable: true,
        hoverDatum: (chart) => getFlowLinkData(chart)[0],
        base: { type: 'chord', ...FLOW },
        place: onPart('link'),
    },
    {
        name: 'map-shape',
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
