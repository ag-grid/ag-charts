import { AgCartesianSeriesTooltipRendererParams, AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

function renderer({ datum, yKey, title }: AgCartesianSeriesTooltipRendererParams) {
    return {
        data: [
            {
                label: title!,
                value: datum[yKey].toFixed(1),
            },
        ],
    };
}

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
            xKey: 'date',
            yKey: 'coal',
            yName: 'Coal',
            normalizedTo: 100,
            stacked: true,
            interpolation,
            tooltip: { renderer: renderer },
            fill: {
                type: 'pattern',
            },
        },
        {
            type: 'area',
            xKey: 'date',
            yKey: 'petroleum',
            yName: 'Petroleum',
            normalizedTo: 100,
            stacked: true,
            interpolation,
            tooltip: { renderer: renderer },
        },
        {
            type: 'area',
            xKey: 'date',
            yKey: 'naturalGas',
            yName: 'Natural gas',
            normalizedTo: 100,
            stacked: true,
            interpolation,
            tooltip: { renderer: renderer },
            fill: {
                type: 'pattern',
            },
        },
        {
            type: 'area',
            xKey: 'date',
            yKey: 'bioenergyWaste',
            yName: 'Bioenergy & waste',
            normalizedTo: 100,
            stacked: true,
            interpolation,
            tooltip: { renderer: renderer },
        },
        {
            type: 'area',
            xKey: 'date',
            yKey: 'nuclear',
            yName: 'Nuclear',
            normalizedTo: 100,
            stacked: true,
            interpolation,
            tooltip: { renderer: renderer },
            fill: {
                type: 'pattern',
            },
        },
        {
            type: 'area',
            xKey: 'date',
            yKey: 'windSolarHydro',
            yName: 'Wind, solar & hydro',
            normalizedTo: 100,
            stacked: true,
            interpolation,
            tooltip: { renderer: renderer },
        },
        {
            type: 'area',
            xKey: 'date',
            yKey: 'imported',
            yName: 'Imported',
            normalizedTo: 100,
            stacked: true,
            interpolation,
            tooltip: { renderer: renderer },
            fill: {
                type: 'pattern',
            },
        },
    ],
    axes: [
        {
            type: 'time',
            position: 'bottom',
            unit: 'month',
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
