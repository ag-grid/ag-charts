import { AgCartesianChartOptions, AgChartLegendPosition, AgCharts } from 'ag-charts-community';

import { getData } from './data';

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: `Renewable sources used to generate electricity for transport fuels`,
    },
    data: getData(),
    series: [
        {
            type: 'bar',
            xKey: 'year',
            yKey: 'Onshore wind',
            yName: 'Onshore Wind',
        },
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
            yKey: 'Solar photovoltaics',
            yName: 'Solar Photovoltaics',
        },
        {
            type: 'bar',
            xKey: 'year',
            yKey: 'Small scale Hydro',
            yName: 'Small Scale Hydro',
        },
        {
            type: 'bar',
            xKey: 'year',
            yKey: 'Large scale Hydro',
            yName: 'Large Scale Hydro',
        },
    ],
    axes: [
        {
            position: 'bottom',
            type: 'category',
        },
        {
            position: 'left',
            type: 'number',
            title: {
                text: `kilotonnes of oil equivalent (ktoe)`,
            },
            label: {
                formatter: (params) => `${params.value / 1000}K`,
            },
        },
    ],
    legend: {
        maxHeight: 40,
        maxWidth: 800,
    },
};

const chart = AgCharts.create(options);
