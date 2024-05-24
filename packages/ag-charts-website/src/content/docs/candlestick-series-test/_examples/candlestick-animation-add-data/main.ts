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
function updateData() {
    // Update
    console.log('updating');
    const newData = [...options.data!];
    const datum = flag < 1 ? newData.at(-2) : newData.at(-1);
    const date = new Date(newData.at(-1).date);
    date.setDate(date.getDate() + 1);
    const shift = Math.random() * flag + 1;
    newData.push({
        ...datum,
        date,
        close: shift * datum.close,
        high: shift * datum.high,
        open: shift * datum.open,
        low: shift * datum.low,
    });
    flag *= -1;
    options.data = newData;
    chart.update(options);
}
