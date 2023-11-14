import { AgChartOptions, AgEnterpriseCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const data = getData();

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: data.slice(0, 1),
    title: {
        text: 'Range Column',
    },
    series: [
        {
            type: 'range-bar',
            direction: 'horizontal',
            xKey: 'date',
            xName: 'Date',
            yLowKey: 'low',
            yHighKey: 'high',
        },
    ],
};

const chart = AgEnterpriseCharts.create(options);

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
    AgEnterpriseCharts.update(chart, options);
}
