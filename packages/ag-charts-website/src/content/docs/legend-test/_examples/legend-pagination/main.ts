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
            gridLine: {
                style: [],
            },
            nice: false,
        },
        {
            position: 'right',
            type: 'number',
            title: {
                text: `kilotonnes of oil equivalent (ktoe)`,
            },
            label: {
                formatter: (params) => `${params.value / 1000}K`,
            },
            line: {
                enabled: false,
            },
        },
    ],
    legend: {
        maxHeight: 40,
        maxWidth: 800,
        pagination: {
            marker: {
                size: 10,
            },
            activeStyle: {
                fill: '#284E8F',
            },
            inactiveStyle: {
                fillOpacity: 0.5,
            },
            highlightStyle: {
                fill: '#7BAFDF',
            },
            label: {
                color: 'rgb(87, 87, 87)',
            },
        },
    },
};

const chart = AgCharts.create(options);

function updateLegendPosition(value: AgChartLegendPosition) {
    options.legend!.position = value;
    switch (value) {
        case 'top':
        case 'bottom':
            options.legend!.maxHeight = 40;
            options.legend!.maxWidth = 800;
            break;
        case 'right':
        case 'left':
            options.legend!.maxHeight = 200;
            options.legend!.maxWidth = 200;
            break;
    }

    chart.update(options);
}
