import { AgCartesianChartOptions, AgCharts } from 'ag-charts-community';

import { getData } from './data';

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Olympic Medal Counts by Region, Country, and City',
    },
    data: getData(),
    axes: {
        x: {
            type: 'grouped-category',
            position: 'bottom',
            depthOptions: [{}, { label: { fontWeight: 'bold' } }, { label: { fontSize: 10 } }],
        },
        y: {
            type: 'number',
            position: 'left',
        },
    },
    series: [
        {
            type: 'bar',
            xKey: 'location',
            xName: 'Location',
            yKey: 'gold',
            yName: 'Gold',
        },
        {
            type: 'bar',
            xKey: 'location',
            xName: 'Location',
            yKey: 'silver',
            yName: 'Silver',
        },
        {
            type: 'bar',
            xKey: 'location',
            xName: 'Location',
            yKey: 'bronze',
            yName: 'Bronze',
        },
    ],
};

const chart = AgCharts.create(options);
