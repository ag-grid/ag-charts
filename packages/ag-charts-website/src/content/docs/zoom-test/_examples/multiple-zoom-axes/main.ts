import { AgCartesianChartOptions, AgCartesianSeriesTooltipRendererParams, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Fruit & Vegetable Consumption',
    },
    zoom: { enabled: true },
    series: [
        {
            type: 'bar',
            xKey: 'year',
            yKey: 'women',
            yName: 'Women',
            grouped: true,
            tooltip: { enabled: true },
        },
        {
            type: 'bar',
            xKey: 'year',
            yKey: 'men',
            yName: 'Men',
            grouped: true,
            tooltip: { enabled: true },
        },
        {
            type: 'line',
            xKey: 'year',
            yKey: 'portions',
            yName: 'Portions',
            tooltip: { enabled: true },
        },
    ],
    axes: [
        {
            type: 'category',
            position: 'bottom',
        },
        {
            // primary y axis
            type: 'number',
            position: 'left',
            keys: ['women', 'men', 'children', 'adults'],
            title: {
                text: 'Adults Who Eat 5 A Day (%)',
            },
        },
        {
            // secondary y axis
            type: 'number',
            position: 'right',
            keys: ['portions'],
            title: {
                text: 'Portions Consumed (Per Day)',
            },
        },
    ],
};

const chart = AgCharts.create(options);
