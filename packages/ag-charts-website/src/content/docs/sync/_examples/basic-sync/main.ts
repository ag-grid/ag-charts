import { AgCartesianChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgCartesianChartOptions = {
    subtitle: {
        text: 'per person per week in Krakozhia',
    },
    axes: [
        {
            type: 'number',
            position: 'left',
        },
        {
            type: 'number',
            position: 'bottom',
            nice: false,
            label: {
                autoRotate: false,
            },
        },
    ],
    series: [
        {
            type: 'line',
            xKey: 'year',
            yKey: 'spending',
        },
    ],
    tooltip: {
        enabled: false,
    },
    sync: {
        enabled: true,
    },
    zoom: {
        enabled: true,
        enableSelecting: true,
        enableAxisDragging: false,
        anchorPointX: 'pointer',
    },
};

const chart1 = AgCharts.create({
    ...options,
    data: getData(),
    title: {
        text: 'Average expenditure on coffee',
    },
    container: document.getElementById('myChart1'),
});

const chart2 = AgCharts.create({
    ...options,
    data: getData(),
    title: {
        text: 'Average expenditure on tea',
    },
    container: document.getElementById('myChart2'),
});

const chart3 = AgCharts.create({
    ...options,
    data: getData(),
    title: {
        text: 'Average expenditure on tobacco',
    },
    container: document.getElementById('myChart3'),
});
