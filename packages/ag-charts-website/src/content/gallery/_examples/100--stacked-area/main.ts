import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const interpolation = { type: 'smooth' } as const;

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'UK Energy Sources',
        fontSize: 20,
    },
    footnote: {
        text: 'Source: Department for Business, Energy & Industrial Strategy',
        fontSize: 12,
        fontStyle: 'italic',
    },
    series: [
        {
            type: 'area',
            xKey: 'date',
            yKey: 'coal',
            yName: 'Coal',
            normalizedTo: 1,
            stacked: true,
            interpolation,
            fill: {
                type: 'pattern',
            },
        },
        {
            type: 'area',
            xKey: 'date',
            yKey: 'petroleum',
            yName: 'Petroleum',
            normalizedTo: 1,
            stacked: true,
            interpolation,
        },
        {
            type: 'area',
            xKey: 'date',
            yKey: 'naturalGas',
            yName: 'Natural gas',
            normalizedTo: 1,
            stacked: true,
            interpolation,
            fill: {
                type: 'pattern',
            },
        },
        {
            type: 'area',
            xKey: 'date',
            yKey: 'bioenergyWaste',
            yName: 'Bioenergy & waste',
            normalizedTo: 1,
            stacked: true,
            interpolation,
        },
        {
            type: 'area',
            xKey: 'date',
            yKey: 'nuclear',
            yName: 'Nuclear',
            normalizedTo: 1,
            stacked: true,
            interpolation,
            fill: {
                type: 'pattern',
            },
        },
        {
            type: 'area',
            xKey: 'date',
            yKey: 'windSolarHydro',
            yName: 'Wind, solar & hydro',
            normalizedTo: 1,
            stacked: true,
            interpolation,
        },
        {
            type: 'area',
            xKey: 'date',
            yKey: 'imported',
            yName: 'Imported',
            normalizedTo: 1,
            stacked: true,
            interpolation,
            fill: {
                type: 'pattern',
            },
        },
    ],
    axes: [
        {
            type: 'unit-time',
            position: 'bottom',
        },
        {
            type: 'number',
            position: 'left',
            gridLine: {
                enabled: false,
            },
            label: {
                format: '#{p}',
            },
            title: {
                text: 'Percentage of Total Energy',
                fontSize: 14,
            },
        },
    ],
    legend: {
        position: 'top',
    },
    formatter: (params) => {
        const { value, type } = params;

        if (type === 'number' && params.property === 'y') {
            return `${value.toFixed(1)} Mtoe`;
        }

        if (type === 'date') {
            const date = value as Date;
            return date.toLocaleDateString('en-US', {
                month: 'short',
                year: 'numeric',
            });
        }

        return String(value);
    },
};

AgCharts.create(options);
