import { type ProvenanceCase, defineProvenanceSuite } from '_ag-charts-test';

import { prepareProcessedOptions } from 'ag-charts-community-test';

import { setupEnterpriseModules } from './setup';

setupEnterpriseModules();

const DATA = [
    { category: 'A', value: 5, low: 2, high: 9, open: 3, close: 7, numeric: 1, size: 4 },
    { category: 'B', value: 8, low: 4, high: 12, open: 6, close: 4, numeric: 2, size: 9 },
    { category: 'C', value: 3, low: 1, high: 7, open: 2, close: 5, numeric: 3, size: 6 },
];

const CASES: Array<ProvenanceCase> = [
    { seriesType: 'range-bar', series: { xKey: 'category', yLowKey: 'low', yHighKey: 'high' }, data: DATA },
    { seriesType: 'range-area', series: { xKey: 'category', yLowKey: 'low', yHighKey: 'high' }, data: DATA },
    { seriesType: 'waterfall', series: { xKey: 'category', yKey: 'value' }, data: DATA },
    {
        seriesType: 'box-plot',
        series: { xKey: 'category', minKey: 'low', q1Key: 'open', medianKey: 'value', q3Key: 'close', maxKey: 'high' },
        data: DATA,
    },
    { seriesType: 'heatmap', series: { xKey: 'category', yKey: 'value', colorKey: 'numeric' }, data: DATA },
    { seriesType: 'radial-bar', series: { angleKey: 'value', radiusKey: 'category' }, data: DATA },
    { seriesType: 'radial-column', series: { angleKey: 'category', radiusKey: 'value' }, data: DATA },
    { seriesType: 'nightingale', series: { angleKey: 'category', radiusKey: 'value' }, data: DATA },
    { seriesType: 'radar-line', series: { angleKey: 'category', radiusKey: 'value' }, data: DATA },
    { seriesType: 'radar-area', series: { angleKey: 'category', radiusKey: 'value' }, data: DATA },
    { seriesType: 'funnel', series: { stageKey: 'category', valueKey: 'value' }, data: DATA },
    { seriesType: 'cone-funnel', series: { stageKey: 'category', valueKey: 'value' }, data: DATA },
    { seriesType: 'pyramid', series: { stageKey: 'category', valueKey: 'value' }, data: DATA },
    {
        seriesType: 'candlestick',
        series: { xKey: 'category', openKey: 'open', highKey: 'high', lowKey: 'low', closeKey: 'close' },
        data: DATA,
    },
    {
        seriesType: 'ohlc',
        series: { xKey: 'category', openKey: 'open', highKey: 'high', lowKey: 'low', closeKey: 'close' },
        data: DATA,
    },
];

defineProvenanceSuite(prepareProcessedOptions, CASES, ['direction', 'grouped']);
