import { AgCharts, AgFinancialChartOptions } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgFinancialChartOptions = {
    preset: 'candlestick-volume',
    container: document.getElementById('myChart'),
    data: getData(),
    // annotations: {
    //     enabled: true,
    //     initial: [
    //         {
    //             type: 'parallel-channel',
    //             start: { x: new Date(1672756200000), y: 130.28 + 6 },
    //             end: { x: new Date(1689773400000), y: 195.1 + 6 },
    //             size: 12,
    //         },
    //         {
    //             type: 'line',
    //             start: { x: new Date(1701959400000), y: 193.63 },
    //             end: { x: new Date(1707489000000), y: 188.85 },
    //         },
    //         {
    //             type: 'line',
    //             start: { x: new Date(1691155800000), y: 185.52 },
    //             end: { x: new Date(1698413400000), y: 166.91 },
    //         },
    //     ],
    // },
};

const chart = AgCharts.createFinancialChart(options);
