import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: `Renewable Fuel Sources`,
    },
    subtitle: {
        text: `Kilotonnes of Oil Equivalent`,
    },
    data: getData(),
    theme: {
        overrides: {
            line: {
                series: {
                    lineDash: [12, 3],
                    interpolation: {
                        type: 'step',
                        position: 'middle',
                    },
                    marker: {
                        enabled: false,
                    },
                },
            },
        },
    },
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
            yKey: 'Solar photovoltaics',
            yName: 'Solar Photovoltaics',
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
            yKey: 'Landfill gas',
            yName: 'Landfill Gas',
        },
    ],
    axes: [
        {
            position: 'bottom',
            type: 'time',
            interval: {
                step: { unit: 'year', step: 5 },
            },
            crossLines: [
                {
                    type: 'line',
                    value: new Date(2020, 0, 1),
                    label: {
                        text: 'COVID-19 START',
                        padding: 10,
                    },
                },
            ],
        },
        {
            position: 'right',
            type: 'number',
            title: {
                text: `ktoe`,
            },
        },
    ],
    formatter: {
        y: (params) => `${(params.value as number) / 1000}K`,
    },
};

AgCharts.create(options);
