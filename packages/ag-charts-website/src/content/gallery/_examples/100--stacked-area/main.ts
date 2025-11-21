import { AgCartesianChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'UK Energy Sources',
    },
    footnote: {
        text: 'Source: Department for Business, Energy & Industrial Strategy',
        fontStyle: 'italic',
    },
    theme: {
        overrides: {
            area: {
                series: {
                    strokeWidth: 1.5,
                    fillOpacity: 0.88,
                    interpolation: { type: 'smooth' },
                },
            },
        },
    },
    series: [
        {
            type: 'area',
            xKey: 'date',
            yKey: 'coal',
            yName: 'Coal',
            normalizedTo: 1,
            stacked: true,
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
        },
        {
            type: 'area',
            xKey: 'date',
            yKey: 'naturalGas',
            yName: 'Natural gas',
            normalizedTo: 1,
            stacked: true,
        },
        {
            type: 'area',
            xKey: 'date',
            yKey: 'bioenergyWaste',
            yName: 'Bioenergy & waste',
            normalizedTo: 1,
            stacked: true,
        },
        {
            type: 'area',
            xKey: 'date',
            yKey: 'nuclear',
            yName: 'Nuclear',
            normalizedTo: 1,
            stacked: true,
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
        },
        {
            type: 'area',
            xKey: 'date',
            yKey: 'imported',
            yName: 'Imported',
            normalizedTo: 1,
            stacked: true,
        },
    ],
    axes: {
        x: {
            type: 'unit-time',
            position: 'bottom',
            crosshair: {
                enabled: true,
                lineDash: [3, 3],
            },
        },
        y: {
            type: 'number',
            position: 'left',
            gridLine: {
                enabled: false,
            },
            label: {
                format: '#{.2p}',
            },
            title: {
                text: 'Percentage of Total Energy',
            },
        },
    },
    legend: {
        item: {
            showSeriesStroke: false,
            paddingX: 10,
            paddingY: 8,
        },
    },
    tooltip: {
        position: {
            placement: ['right', 'left', 'top', 'bottom'],
        },
        range: 'nearest',
        showArrow: false,
    },
    animation: {
        enabled: true,
        duration: 800,
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
