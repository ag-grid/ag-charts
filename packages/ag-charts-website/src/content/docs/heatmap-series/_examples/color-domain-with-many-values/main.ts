import { AgEnterpriseCharts, AgChartOptions } from 'ag-charts-enterprise';
import { getData } from './data';

const options: AgChartOptions = {
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
            colorRange: [
                '#4A90E2',
                '#888888',
                '#FF6B6B',
            ],
            colorDomain: [
                0,
                5,
                20,
            ],
        },
    ],
};

const chart = AgEnterpriseCharts.create(options);
