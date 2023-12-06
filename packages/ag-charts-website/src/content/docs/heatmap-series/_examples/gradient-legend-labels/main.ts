import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

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
        },
    ],
    gradientLegend: {
        scale: {
            label: {
                fontSize: 20,
                fontStyle: 'italic',
                fontWeight: 'bold',
                fontFamily: 'serif',
                color: 'red',
            },
            padding: 20,
        },
    },
};

const chart = AgCharts.create(options);
