import { type ProvenanceCase, defineProvenanceSuite } from '_ag-charts-test';

import { prepareProcessedOptions } from '../chart/test/prepareOptions';

const DATA = [
    { category: 'A', value: 5, secondary: 3, size: 4, numeric: 1 },
    { category: 'B', value: 8, secondary: 6, size: 9, numeric: 2 },
    { category: 'C', value: 3, secondary: 9, size: 6, numeric: 3 },
];

const CASES: Array<ProvenanceCase> = [
    { seriesType: 'bar', series: { xKey: 'category', yKey: 'value' }, data: DATA },
    { seriesType: 'line', series: { xKey: 'category', yKey: 'value' }, data: DATA },
    { seriesType: 'area', series: { xKey: 'category', yKey: 'value' }, data: DATA },
    { seriesType: 'scatter', series: { xKey: 'numeric', yKey: 'value' }, data: DATA },
    { seriesType: 'bubble', series: { xKey: 'numeric', yKey: 'value', sizeKey: 'size' }, data: DATA },
    { seriesType: 'histogram', series: { xKey: 'numeric' }, data: DATA },
    { seriesType: 'pie', series: { angleKey: 'value' }, data: DATA },
    { seriesType: 'donut', series: { angleKey: 'value' }, data: DATA },
];

defineProvenanceSuite(prepareProcessedOptions, CASES, ['direction']);
