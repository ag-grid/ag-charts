import { AgChartOptions, AgCharts, LegendModule } from 'ag-charts-community';
import { ModuleRegistry, PieSeriesModule } from 'ag-charts-community';

import { getData } from './data';

ModuleRegistry.registerModules([LegendModule, PieSeriesModule]);

window.agChartsDebug = 'options-graph';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),

    data: getData(),
    title: {
        text: 'Portfolio Composition',
    },
    series: [
        {
            type: 'pie',
            angleKey: 'amount',
            legendItemKey: 'asset',
            calloutLabelKey: 'asset',
            // fills: ['red'],
            fills: [{ type: 'gradient', colorStops: [{ color: 'pink' }, { color: 'orange' }] }, 'red'],
            // fills: [{ type: 'gradient' }, 'red'],
            itemStyler: (params) => {
                // if (params.datum.asset === 'Cash')
                // return { fill: { type: 'gradient', colorStops: [{ color: 'pink' }, { color: 'orange' }] } };
                // if (params.datum.asset === 'Stocks') return { fill: { type: 'gradient' } };
                return { fill: { type: 'gradient' } };
            },
        },
    ],

    // theme: {
    //     overrides: {
    //         pie: {
    //             series: {
    //                 strokeWidth: 8,
    //                 fills: {
    //                     $if: [
    //                         { $eq: [{ $value: '$index' }, 0] },
    //                         {
    //                             $map: [
    //                                 { $mix: [{ $value: '$1' }, { $ref: 'backgroundColor' }, 0.7] },
    //                                 { $palette: 'fills' },
    //                             ],
    //                         },
    //                         { $palette: 'fills' },
    //                     ],
    //                 },
    //                 strokes: {
    //                     $if: [
    //                         { $eq: [{ $value: '$index' }, 0] },
    //                         {
    //                             $map: [
    //                                 { $mix: [{ $value: '$1' }, { $ref: 'backgroundColor' }, 0.7] },
    //                                 { $palette: 'strokes' },
    //                             ],
    //                         },
    //                         { $palette: 'strokes' },
    //                     ],
    //                 },
    //             },
    //         },
    //     },
    // },
    // data: [
    //     { asset: 'Stocks', amount: 30000, 'amount-filtered-out': 30000 },
    //     { asset: 'Bonds', amount: 25000, 'amount-filtered-out': 15000 },
    //     { asset: 'Cash', amount: 6000, 'amount-filtered-out': 1000 },
    //     { asset: 'Real Estate', amount: 1000, 'amount-filtered-out': 4000 },
    //     { asset: 'Commodities', amount: 2500, 'amount-filtered-out': 500 },
    // ].map((d: any) => {
    //     const colId = 'amount';
    //     const filteredOutColId = `${colId}-filtered-out`;
    //     const total = d[colId] + d[filteredOutColId];
    //     d[`${colId}-total`] = total;
    //     d[filteredOutColId] = 1; // normalise to 1
    //     d[colId] = d[colId] / total; // fraction of 1
    //     return d;
    // }),
    // series: [
    //     {
    //         type: 'pie',
    //         angleKey: 'amount-total',
    //         legendItemKey: 'asset',
    //         radiusKey: 'amount-filtered-out',
    //         radiusMin: 0,
    //         radiusMax: 1,
    //         showInLegend: false,
    //     },
    //     {
    //         type: 'pie',
    //         angleKey: 'amount-total',
    //         legendItemKey: 'asset',
    //         radiusKey: 'amount',
    //         radiusMin: 0,
    //         radiusMax: 1,
    //     },
    // ],
};

AgCharts.create(options);
