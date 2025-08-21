import { AgCartesianChartOptions, AgCharts } from 'ag-charts-enterprise';

import { EnergyData, getData } from './data';

const interpolation = { type: 'smooth' } as const;

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
                    highlight: {
                        highlightedItem: {
                            fillOpacity: 0.95,
                            strokeWidth: 2,
                        },
                    },
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
        },
    ],
    axes: [
        {
            type: 'unit-time',
            position: 'bottom',
            crosshair: {
                enabled: true,
                strokeWidth: 1,
                lineDash: [3, 3],
                label: {
                    enabled: true,
                },
            },
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
            },
        },
    ],
    legend: {
        position: 'bottom',
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
