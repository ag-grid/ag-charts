import { type ProvenanceCase, defineProvenanceSuite } from '_ag-charts-test';

import { prepareProcessedOptions } from 'ag-charts-community-test';

import { setupEnterpriseModules } from './setup';

setupEnterpriseModules();

const DATA = [
    { category: 'A', value: 5, low: 2, high: 9, open: 3, close: 7, numeric: 1, size: 4 },
    { category: 'B', value: 8, low: 4, high: 12, open: 6, close: 4, numeric: 2, size: 9 },
    { category: 'C', value: 3, low: 1, high: 7, open: 2, close: 5, numeric: 3, size: 6 },
];

/** See the community suite for what `coverage` pins and how to update it. */
const CASES: Array<ProvenanceCase> = [
    {
        seriesType: 'range-bar',
        series: { xKey: 'category', yLowKey: 'low', yHighKey: 'high' },
        data: DATA,
        coverage: { minChecked: 127, maxSkipped: 9, maxRejected: 1, maxIneffective: 0, minContainers: 5 },
        asymmetries: ['direction', 'grouped'],
    },
    {
        seriesType: 'range-area',
        series: { xKey: 'category', yLowKey: 'low', yHighKey: 'high' },
        data: DATA,
        coverage: { minChecked: 157, maxSkipped: 10, maxRejected: 1, maxIneffective: 0, minContainers: 9 },
    },
    {
        seriesType: 'waterfall',
        series: { xKey: 'category', yKey: 'value' },
        data: DATA,
        coverage: { minChecked: 185, maxSkipped: 16, maxRejected: 3, maxIneffective: 0, minContainers: 7 },
        asymmetries: ['direction'],
    },
    {
        seriesType: 'box-plot',
        series: { xKey: 'category', minKey: 'low', q1Key: 'open', medianKey: 'value', q3Key: 'close', maxKey: 'high' },
        data: DATA,
        coverage: { minChecked: 111, maxSkipped: 7, maxRejected: 4, maxIneffective: 0, minContainers: 3 },
        asymmetries: ['direction'],
    },
    {
        seriesType: 'heatmap',
        series: { xKey: 'category', yKey: 'value', colorKey: 'numeric' },
        data: DATA,
        coverage: { minChecked: 75, maxSkipped: 9, maxRejected: 2, maxIneffective: 0, minContainers: 4 },
    },
    {
        seriesType: 'radial-bar',
        series: { angleKey: 'value', radiusKey: 'category' },
        data: DATA,
        coverage: { minChecked: 92, maxSkipped: 8, maxRejected: 1, maxIneffective: 0, minContainers: 4 },
    },
    {
        seriesType: 'radial-column',
        series: { angleKey: 'category', radiusKey: 'value' },
        data: DATA,
        coverage: { minChecked: 94, maxSkipped: 8, maxRejected: 1, maxIneffective: 0, minContainers: 4 },
    },
    {
        seriesType: 'nightingale',
        series: { angleKey: 'category', radiusKey: 'value' },
        data: DATA,
        coverage: { minChecked: 92, maxSkipped: 8, maxRejected: 1, maxIneffective: 0, minContainers: 4 },
    },
    {
        seriesType: 'radar-line',
        series: { angleKey: 'category', radiusKey: 'value' },
        data: DATA,
        coverage: { minChecked: 79, maxSkipped: 10, maxRejected: 1, maxIneffective: 0, minContainers: 5 },
        unresolved: ['AgRadarHighlightStyleOptions'],
    },
    {
        seriesType: 'radar-area',
        series: { angleKey: 'category', radiusKey: 'value' },
        data: DATA,
        coverage: { minChecked: 97, maxSkipped: 10, maxRejected: 1, maxIneffective: 0, minContainers: 5 },
        unresolved: ['AgRadarHighlightStyleOptions'],
    },
    {
        seriesType: 'funnel',
        series: { stageKey: 'category', valueKey: 'value' },
        data: DATA,
        coverage: { minChecked: 73, maxSkipped: 9, maxRejected: 4, maxIneffective: 0, minContainers: 5 },
    },
    {
        seriesType: 'cone-funnel',
        series: { stageKey: 'category', valueKey: 'value' },
        data: DATA,
        coverage: { minChecked: 58, maxSkipped: 8, maxRejected: 8, maxIneffective: 0, minContainers: 3 },
    },
    {
        seriesType: 'pyramid',
        series: { stageKey: 'category', valueKey: 'value' },
        data: DATA,
        coverage: { minChecked: 65, maxSkipped: 9, maxRejected: 4, maxIneffective: 0, minContainers: 6 },
    },
    {
        seriesType: 'candlestick',
        series: { xKey: 'category', openKey: 'open', highKey: 'high', lowKey: 'low', closeKey: 'close' },
        data: DATA,
        coverage: { minChecked: 114, maxSkipped: 5, maxRejected: 4, maxIneffective: 0, minContainers: 2 },
    },
    {
        seriesType: 'ohlc',
        series: { xKey: 'category', openKey: 'open', highKey: 'high', lowKey: 'low', closeKey: 'close' },
        data: DATA,
        coverage: { minChecked: 66, maxSkipped: 5, maxRejected: 8, maxIneffective: 0, minContainers: 2 },
    },
];

defineProvenanceSuite(prepareProcessedOptions, CASES);
