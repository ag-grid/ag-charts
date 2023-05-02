import { AgEnterpriseCharts } from 'ag-charts-enterprise';
import { getData } from './data';

const options = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'UK monthly mean temperature °C',
    },
    series: [
        {
            type: 'heatmap',

            xKey: 'month',
            xName: 'Month',

            yKey: 'year',
            yName: 'Year',

            colorKey: 'temperature',
            colorName: 'Temperature',
            colorRange: ['aliceblue', 'orange'],
        },
    ],
};

const chart = AgEnterpriseCharts.create(options);
