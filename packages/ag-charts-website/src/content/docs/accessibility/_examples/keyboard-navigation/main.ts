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
            type: 'line',
            xKey: 'year',
            yKey: 'Onshore wind',
            yName: 'Onshore Wind',
        },
        {
            type: 'line',
            xKey: 'year',
            yKey: 'Offshore wind',
            yName: 'Offshore Wind',
        },
        {
            type: 'line',
            xKey: 'year',
            yKey: 'Marine energy',
            yName: 'Marine Energy',
        },
        {
            type: 'line',
            xKey: 'year',
            yKey: 'Solar photovoltaics',
            yName: 'Solar Photovoltaics',
        },
        {
            type: 'line',
            xKey: 'year',
            yKey: 'Small scale Hydro',
            yName: 'Small Scale Hydro',
        },
        {
            type: 'line',
            xKey: 'year',
            yKey: 'Large scale Hydro',
            yName: 'Large Scale Hydro',
        },
        {
            type: 'line',
            xKey: 'year',
            yKey: 'Plant biomass',
            yName: 'Plant Biomass',
        },
        {
            type: 'line',
            xKey: 'year',
            yKey: 'Animal biomass',
            yName: 'Animal Biomass',
        },
        {
            type: 'line',
            xKey: 'year',
            yKey: 'Landfill gas',
            yName: 'Landfill Gas',
        },
        {
            type: 'line',
            xKey: 'year',
            yKey: 'Sewage gas',
            yName: 'Sewage Gas',
        },
    ],
    axes: [
        {
            position: 'bottom',
            type: 'time',
            nice: false,
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
