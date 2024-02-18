import { AgCartesianChartOptions, AgCharts } from 'ag-charts-enterprise';

import { currentData, historicalData } from './data';

const options: AgCartesianChartOptions = {
    sync: {
        axes: 'y',
        nodeInteraction: false,
    },
    title: {
        text: 'Renewable Fuel Sources',
    },
    axes: [
        {
            type: 'number',
            position: 'left',
            crosshair: { enabled: false },
        },
        {
            position: 'bottom',
            type: 'category',
            crosshair: { enabled: false },
            label: {
                autoRotate: false,
            },
        },
    ],
    series: [
        {
            type: 'bar',
            xKey: 'year',
            yKey: 'Offshore wind',
            yName: 'Offshore Wind',
        },
        {
            type: 'bar',
            xKey: 'year',
            yKey: 'Landfill gas',
            yName: 'Landfill Gas',
        },
        {
            type: 'bar',
            xKey: 'year',
            yKey: 'Plant biomass',
            yName: 'Plant Biomass',
        },
    ],
};

const chart1 = AgCharts.create({
    ...options,
    container: document.getElementById('myChart1'),
    subtitle: {
        text: 'Historical Data',
    },
    data: historicalData,
});

const chart2 = AgCharts.create({
    ...options,
    container: document.getElementById('myChart2'),
    subtitle: {
        text: 'Current Data',
    },
    data: currentData,
});
