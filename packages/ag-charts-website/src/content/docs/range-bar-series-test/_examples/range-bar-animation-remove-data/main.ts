import { AgChartOptions, AgEnterpriseCharts } from 'ag-charts-enterprise';

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

const chart = AgEnterpriseCharts.create(options);

function removeValue() {
    console.log('removing');
    const dataLength = data.length;
    const removeIndex = Math.floor(dataLength * Math.random());
    data.splice(removeIndex, 1);
    options.data = data;
    AgEnterpriseCharts.update(chart, options);
}
