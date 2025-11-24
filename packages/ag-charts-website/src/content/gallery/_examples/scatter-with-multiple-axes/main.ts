import { ModuleRegistry, NumberAxisModule, ScatterSeriesModule } from 'ag-charts-community';
import { AgCartesianChartOptions, AgCharts } from 'ag-charts-enterprise';
import { CrosshairModule } from 'ag-charts-enterprise';

import { DataType, getData } from './data';

ModuleRegistry.registerModules([CrosshairModule, NumberAxisModule, ScatterSeriesModule]);
const options: AgCartesianChartOptions<DataType> = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Life Expectancy In the UK',
    },
    subtitle: {
        text: 'Life expectancy from birth (1765 to 2023) &\nNumber of deaths registered in England and Wales (1838 to 2021)',
    },
    footnote: {
        text: 'Source: Office for National Statistics',
    },
    // Shared tooltips for better data comparison
    tooltip: {
        enabled: true,
        position: {
            placement: ['right', 'left', 'top', 'bottom'],
        },
    },
    series: [
        {
            type: 'scatter',
            xKey: 'year',
            xName: 'Year',
            yKey: 'lifeExpectancy',
            yName: 'Age',
            yKeyAxis: 'ySecondary',
            title: 'Life Expectancy',
            size: 5,
        },
        {
            type: 'scatter',
            xKey: 'year',
            xName: 'Year',
            yKey: 'numberOfDeaths',
            yName: 'Count',
            title: 'Number of Deaths',
            size: 5,
            strokeWidth: 1.5,
        },
    ],
    axes: {
        x: {
            position: 'bottom',
            type: 'number',
            title: {
                text: 'Year',
            },
            gridLine: {
                style: [
                    {
                        strokeWidth: 1,
                        lineDash: [2, 2],
                    },
                    {
                        strokeWidth: 0,
                    },
                ],
            },
            crosshair: {
                enabled: true,
                label: {
                    format: 'd',
                },
            },
            nice: false,
            min: 1762,
            max: 2030,
            label: { format: 'd' },
        },
        y: {
            type: 'number',
            position: 'right',
            title: {
                text: 'Number of Deaths',
            },
            gridLine: {
                enabled: false,
            },
            crosshair: {
                enabled: true,
                label: {
                    formatter: ({ value }) => `${Math.round(value).toLocaleString('en-GB')}`,
                },
            },
            label: {
                formatter: ({ value }) => `${Math.round(value).toLocaleString('en-GB')}`,
            },
            line: {
                enabled: true,
            },
        },
        ySecondary: {
            type: 'number',
            position: 'left',
            title: {
                text: 'Life Expectancy (Years)',
            },
            nice: false,
            min: 25,
            max: 85,
            crosshair: {
                enabled: true,
                label: {
                    formatter: ({ value }) => `${Math.round(value)} Years`,
                },
            },
            line: {
                enabled: true,
            },
            label: {
                formatter: ({ value }) => `${Math.round(value)} Years`,
            },
        },
    },
};

AgCharts.create(options);
