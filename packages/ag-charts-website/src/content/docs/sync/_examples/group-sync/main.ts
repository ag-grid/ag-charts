import { AgCartesianChartOptions, AgCharts } from 'ag-charts-enterprise';

import { datasetA, datasetB, datasetC, datasetD } from './data';

const options: AgCartesianChartOptions = {
    // axes: [
    //     {
    //         type: 'number',
    //         position: 'left',
    //     },
    //     {
    //         type: 'number',
    //         position: 'bottom',
    //         nice: false,
    //         label: {
    //             autoRotate: false,
    //         },
    //     },
    // ],
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
    data: datasetA,
    title: { text: 'Historical Sales by Quarter' },
    subtitle: { text: 'Analysis of past quarter sales performance' },
    container: document.getElementById('myChart1'),
    series: [
        {
            type: 'line',
            xKey: 'quarter',
            yKey: 'sales',
        },
    ],
    sync: { groupId: 'altGroup' },
});

const chart2 = AgCharts.create({
    ...options,
    data: datasetB,
    title: { text: 'Operational Costs by Quarter' },
    subtitle: { text: 'Analysis of operational costs over past quarters' },
    container: document.getElementById('myChart2'),
    series: [
        {
            type: 'line',
            xKey: 'quarter',
            yKey: 'costs',
        },
    ],
});

const chart3 = AgCharts.create({
    ...options,
    data: datasetC,
    title: { text: 'Projected Sales by Quarter' },
    subtitle: { text: 'Forecasted sales for the upcoming quarters' },
    container: document.getElementById('myChart3'),
    sync: { groupId: 'altGroup' },
    series: [
        {
            type: 'line',
            xKey: 'quarter',
            yKey: 'sales',
        },
    ],
});

const chart4 = AgCharts.create({
    ...options,
    data: datasetD,
    title: { text: 'Operational Efficiency by Quarter' },
    subtitle: { text: 'Key efficiency metrics over past quarters' },
    container: document.getElementById('myChart4'),
    series: [
        {
            type: 'line',
            xKey: 'quarter',
            yKey: 'efficiency',
        },
    ],
});
