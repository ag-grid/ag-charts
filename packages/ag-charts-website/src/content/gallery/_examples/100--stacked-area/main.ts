import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const interpolation = { type: 'smooth' } as const;

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'UK Energy Sources',
    },
    footnote: {
        text: 'Source: Department for Business, Energy & Industrial Strategy',
    },
    series: [
        {
            type: 'area',
            xKey: 'month',
            yKey: 'coal',
            yName: 'Coal',
            normalizedTo: 100,
            stacked: true,
            interpolation,
        },
        {
            type: 'area',
            xKey: 'month',
            yKey: 'petroleum',
            yName: 'Petroleum',
            normalizedTo: 100,
            stacked: true,
            interpolation,
        },
        {
            type: 'area',
            xKey: 'month',
            yKey: 'naturalGas',
            yName: 'Natural gas',
            normalizedTo: 100,
            stacked: true,
            interpolation,
        },
        {
            type: 'area',
            xKey: 'month',
            yKey: 'bioenergyWaste',
            yName: 'Bioenergy & waste',
            normalizedTo: 100,
            stacked: true,
            interpolation,
        },
        {
            type: 'area',
            xKey: 'month',
            yKey: 'nuclear',
            yName: 'Nuclear',
            normalizedTo: 100,
            stacked: true,
            interpolation,
        },
        {
            type: 'area',
            xKey: 'month',
            yKey: 'windSolarHydro',
            yName: 'Wind, solar & hydro',
            normalizedTo: 100,
            stacked: true,
            interpolation,
        },
        {
            type: 'area',
            xKey: 'month',
            yKey: 'imported',
            yName: 'Imported',
            normalizedTo: 100,
            stacked: true,
            interpolation,
        },
    ],
    axes: [
        {
            type: 'category',
            position: 'bottom',
        },
        {
            type: 'number',
            position: 'left',
            gridLine: {
                enabled: false,
            },
            label: {
                format: '#{.0f}%',
            },
            title: {
                text: 'Normalized Percentage Energy',
            },
        },
    ],
    legend: {
        position: 'top',
    },
};

AgCharts.create(options);
