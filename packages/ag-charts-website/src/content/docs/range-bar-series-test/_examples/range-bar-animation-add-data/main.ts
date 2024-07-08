import { AgCartesianChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const data = getData();

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: data.slice(0, 1),
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

function addValue() {
    console.log('adding');
    const optionsData = options.data ?? [];
    const datum = data[optionsData.length % data.length];
    const newDatum = {
        ...datum,
        date: `Nov ${optionsData.length + 1}`,
    };
    const randomIndex = Math.floor(Math.random() * optionsData.length);
    optionsData.splice(randomIndex, 0, newDatum);
    options.data = optionsData;
    chart.update(options);
}
