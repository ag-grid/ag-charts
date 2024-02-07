import { AgCartesianChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgCartesianChartOptions = {
    subtitle: {
        text: 'per person per week in Krakozhia',
    },
    axes: [
        {
            type: 'number',
            position: 'bottom',
        },
        {
            type: 'number',
            position: 'left',
            nice: false,
            label: {
                autoRotate: false,
            },
        },
    ],
    series: [
        {
            type: 'bar',
            xKey: 'year',
            yKey: 'spending',
            direction: 'horizontal',
        },
    ],
    tooltip: {
        enabled: false,
    },
    sync: {
        enabled: true,
        axes: 'y',
    },
    zoom: {
        enabled: true,
        enableSelecting: true,
        enableAxisDragging: false,
        anchorPointX: 'pointer',
        axes: 'x',
    },
};

const chart1 = AgCharts.create({
    ...options,
    data: getData(400),
    title: {
        text: 'Average expenditure on coffee',
    },
    container: document.getElementById('myChart1'),
});

const chart2 = AgCharts.create({
    ...options,
    data: getData(400, -150),
    title: {
        text: 'Average expenditure on tea',
    },
    container: document.getElementById('myChart2'),
});
