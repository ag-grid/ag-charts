import { type ProvenanceCase, defineProvenanceSuite } from 'ag-charts-test';

import { prepareProcessedOptions } from '../chart/test/prepareOptions';

const DATA = [
    { category: 'A', value: 5, secondary: 3, size: 4, numeric: 1 },
    { category: 'B', value: 8, secondary: 6, size: 9, numeric: 2 },
    { category: 'C', value: 3, secondary: 9, size: 6, numeric: 3 },
];

/**
 * `coverage` pins what the harness reaches today. A new themeable option raises `checked`, which passes; an
 * option of a type the harness cannot supply a value for raises `skipped` or `rejected` and fails here on
 * purpose, so losing coverage is a decision rather than a silent drift. Each run logs the current counts.
 * The `maxIneffective` allowances cover `errorBar`, whose module is enterprise and so strips on both routes
 * here — nothing this suite can demonstrate.
 */
const CASES: Array<ProvenanceCase> = [
    {
        seriesType: 'bar',
        series: { xKey: 'category', yKey: 'value' },
        data: DATA,
        coverage: { minChecked: 127, maxSkipped: 9, maxRejected: 1, maxIneffective: 14, minContainers: 6 },
        asymmetries: ['direction'],
    },
    {
        seriesType: 'line',
        series: { xKey: 'category', yKey: 'value' },
        data: DATA,
        coverage: { minChecked: 118, maxSkipped: 10, maxRejected: 1, maxIneffective: 14, minContainers: 5 },
    },
    {
        seriesType: 'area',
        series: { xKey: 'category', yKey: 'value' },
        data: DATA,
        coverage: { minChecked: 127, maxSkipped: 10, maxRejected: 1, maxIneffective: 0, minContainers: 7 },
    },
    {
        seriesType: 'scatter',
        series: { xKey: 'numeric', yKey: 'value' },
        data: DATA,
        coverage: { minChecked: 116, maxSkipped: 10, maxRejected: 3, maxIneffective: 14, minContainers: 4 },
    },
    {
        seriesType: 'bubble',
        series: { xKey: 'numeric', yKey: 'value', sizeKey: 'size' },
        data: DATA,
        coverage: { minChecked: 117, maxSkipped: 11, maxRejected: 3, maxIneffective: 0, minContainers: 4 },
    },
    {
        seriesType: 'histogram',
        series: { xKey: 'numeric' },
        data: DATA,
        coverage: { minChecked: 96, maxSkipped: 9, maxRejected: 1, maxIneffective: 0, minContainers: 4 },
    },
    {
        seriesType: 'pie',
        series: { angleKey: 'value' },
        data: DATA,
        coverage: { minChecked: 126, maxSkipped: 10, maxRejected: 3, maxIneffective: 0, minContainers: 8 },
    },
    {
        seriesType: 'donut',
        series: { angleKey: 'value' },
        data: DATA,
        coverage: { minChecked: 130, maxSkipped: 10, maxRejected: 9, maxIneffective: 0, minContainers: 8 },
    },
];

defineProvenanceSuite(prepareProcessedOptions, CASES);
