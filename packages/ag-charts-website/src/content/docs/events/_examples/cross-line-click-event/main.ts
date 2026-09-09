import type { AgCartesianChartOptions } from 'ag-charts-community';
import { AgCharts, AllCommunityModule, ModuleRegistry } from 'ag-charts-community';

import { DataType, getData } from './data';

// TODO: change this to a selective list of all required modules.
ModuleRegistry.registerModules([AllCommunityModule]);

const lockdownLabelStyle = { fontStyle: 'italic', position: 'bottom' } as const;
const variantLineStyle = { stroke: '#F59E0B', strokeWidth: 2, lineDash: [6, 4] };
const variantLabelStyle = { color: '#F59E0B', position: 'top' } as const;

const options: AgCartesianChartOptions<DataType> = {
    container: document.getElementById('myChart'),
    title: {
        text: 'COVID-19 ICU Bed Usage',
    },
    subtitle: {
        text: 'Monthly peak ICU occupancy',
    },
    data: getData(),
    axes: {
        x: {
            type: 'unit-time',
            position: 'bottom',
            label: {
                spacing: 25,
            },
            crossLines: [
                {
                    type: 'range',
                    range: [new Date(2020, 2, 23), new Date(2020, 5, 1)],
                    label: {
                        text: 'First lockdown',
                        ...lockdownLabelStyle,
                    },
                },
                {
                    type: 'range',
                    range: [new Date(2020, 10, 5), new Date(2021, 1, 15)],
                    label: {
                        text: 'Winter lockdown',
                        ...lockdownLabelStyle,
                    },
                },
                {
                    type: 'range',
                    range: [new Date(2021, 11, 20), new Date(2022, 1, 15)],
                    label: {
                        text: 'Soft lockdown',
                        ...lockdownLabelStyle,
                    },
                },
                {
                    type: 'line',
                    value: new Date(2020, 11, 1),
                    ...variantLineStyle,
                    label: {
                        text: 'Alpha',
                        ...variantLabelStyle,
                    },
                },
                {
                    type: 'line',
                    value: new Date(2021, 6, 1),
                    ...variantLineStyle,
                    label: {
                        text: 'Delta',
                        ...variantLabelStyle,
                    },
                },
                {
                    type: 'line',
                    value: new Date(2021, 10, 1),
                    ...variantLineStyle,
                    label: {
                        text: 'Omicron',
                        ...variantLabelStyle,
                    },
                },
            ],
        },
        y: {
            type: 'number',
            position: 'left',
            title: {
                text: 'ICU beds occupied',
            },
            crossLines: [
                {
                    type: 'line',
                    value: 700,
                    stroke: '#EF4444',
                    strokeWidth: 2,
                    lineDash: [8, 4],
                    label: {
                        text: 'ICU capacity (700 beds)',
                        position: 'top-right',
                    },
                },
            ],
        },
    },
    series: [
        {
            type: 'area',
            xKey: 'month',
            yKey: 'maxICU',
            yName: 'ICU beds occupied',
            strokeWidth: 1,
            fillOpacity: 0.5,
            fill: {
                type: 'gradient',
                colorStops: [
                    { color: '#ffffff', stop: 0 },
                    { color: '#7da9e8', stop: 0.75 },
                    { color: '#2c6ed5', stop: 1 },
                ],
            },
        },
    ],
};

AgCharts.create(options);
