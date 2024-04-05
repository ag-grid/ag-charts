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
function updateData() {
    // Update
    console.log('updating');
    const { data = [] } = options;
    const datum = flag < 1 ? data.at(-2) : data.at(-1);
    const lastDatum = data.at(-1);
    const lastDate = lastDatum.date;
    const date = new Date(lastDate);
    date.setDate(lastDate.getDate() + 1);
    const shift = Math.random() * flag + 1;
    data.push({
        ...datum,
        date,
        close: shift * datum.close,
        high: shift * datum.high,
        open: shift * datum.open,
        low: shift * datum.low,
    });
    flag *= -1;
    options.data = data;
    AgCharts.update(chart, options);
}
