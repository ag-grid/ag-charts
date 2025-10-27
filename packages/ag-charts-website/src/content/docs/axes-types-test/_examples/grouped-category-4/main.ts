import { AgCartesianChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Effects of Drought and Control Conditions on Biodiversity Metrics Over Time',
    },
    subtitle: {
        text: '(2015–2018)',
    },
    series: [
        {
            type: 'bar',
            xKey: 'category',
            yKey: 'drought',
            yName: 'Drought',
            errorBar: {
                yLowerKey: 'drought_low',
                yUpperKey: 'drought_high',
            },
        },
        {
            type: 'bar',
            xKey: 'category',
            yKey: 'control',
            yName: 'Control',
            errorBar: {
                yLowerKey: 'control_low',
                yUpperKey: 'control_high',
            },
        },
    ],
    axes: {
        x: {
            type: 'grouped-category',
            position: 'bottom',
        },
        y: {
            type: 'number',
            position: 'left',
        },
    },
};

const chart = AgCharts.create(options);
