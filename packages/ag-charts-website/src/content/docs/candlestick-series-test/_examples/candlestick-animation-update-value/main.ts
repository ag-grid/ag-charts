import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
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
    const newData = [...options.data!];
    const lastDatum = { ...newData.at(-1) };
    const shift = Math.random() * flag + 1;
    lastDatum.close = shift * lastDatum.close;
    lastDatum.high = shift * lastDatum.high;
    newData.splice(-1, 1, lastDatum);

    flag *= -1;
    options.data = newData;
    AgCharts.update(chart, options);
}
