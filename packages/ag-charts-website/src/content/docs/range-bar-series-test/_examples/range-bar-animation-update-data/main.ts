import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const data = getData();

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data,
    title: {
        text: 'Range Column',
    },
    series: [
        {
            type: 'range-bar',
            xKey: 'date',
            xName: 'Date',
            yLowKey: 'low',
            yHighKey: 'high',
        },
    ],
};

const chart = AgCharts.create(options);

function updateValues() {
    console.log('updating');
    const updatedData = data.map((d) => ({
        ...d,
        low: Math.random() * d.low,
        high: Math.random() * d.high,
    }));
    options.data = updatedData;
    AgCharts.update(chart, options);
}
