import { AgChartOptions, AgCharts } from 'ag-charts-community';

import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: `Renewable Fuel Sources`,
    },
    subtitle: {
        text: `Kilotonnes of Oil Equivalent`,
    },
    theme: {
        overrides: {
            common: {
                title: {
                    fontSize: 22,
                    color: '#444444',
                },
            },
            bar: {
                series: {
                    label: {
                        enabled: true,
                        fontSize: 14,
                        placement: 'outside-end',
                    },
                    strokeWidth: 1,
                },
            },
        },
    },
    data: getData(),
    series: [
        {
            type: 'bar',
            xKey: 'year',
            yKey: 'Onshore wind',
            yName: 'Onshore Wind',
            fill: { type: 'gradient' },
        },
        {
            type: 'bar',
            xKey: 'year',
            yKey: 'Offshore wind',
            yName: 'Offshore Wind',
            fill: { type: 'pattern' },
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
            yKey: 'Plant biomass',
            yName: 'Plant Biomass',
            fill: { type: 'gradient' },
        },
        {
            type: 'bar',
            xKey: 'year',
            yKey: 'Landfill gas',
            yName: 'Landfill Gas',
            fill: { type: 'pattern' },
        },
    ],
    axes: [
        { type: 'category', position: 'bottom', paddingOuter: 0 },
        { type: 'number', position: 'left' },
    ],
};

const chart = AgCharts.create(options);
