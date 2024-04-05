import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const data = getData();

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data,
    title: {
        text: 'Candlestick update last value',
    },
    series: [
        {
            type: 'candlestick',
            xKey: 'date',
            xName: 'Date',
            lowKey: 'low',
            highKey: 'high',
            openKey: 'open',
            closeKey: 'close',
        },
    ],
};

const chart = AgCharts.create(options);

let flag = 0.001;
function updateValue() {
    // Update
    console.log('updating');
    const { data = [] } = options;
    const n = data.length;
    const lastDatum = data.at(-1);
    const shift = Math.random() * flag + 1;
    data[n - 1] = {
        ...lastDatum,
        close: shift * lastDatum.close,
        high: shift * lastDatum.high,
    };
    flag *= -1;
    options.data = data;
    AgCharts.update(chart, options);
}
