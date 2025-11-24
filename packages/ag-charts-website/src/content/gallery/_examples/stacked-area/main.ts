import {
    AreaSeriesModule,
    LegendModule,
    ModuleRegistry,
    NumberAxisModule,
    UnitTimeAxisModule,
} from 'ag-charts-community';
import { AgCartesianChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([AreaSeriesModule, LegendModule, NumberAxisModule, UnitTimeAxisModule]);
const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    theme: {
        overrides: {
            area: {
                series: {
                    interpolation: { type: 'smooth' },
                    strokeWidth: 2,
                    fillOpacity: 0.7,
                },
            },
        },
    },
    data: getData(),
    title: {
        text: 'Science Museums Visitors',
    },
    footnote: {
        text: 'Source: Department for Digital, Culture, Media & Sport',
    },
    series: [
        {
            type: 'area',
            xKey: 'date',
            yKey: 'Science Museum',
            yName: 'Science Museum',
            stacked: true,
        },
        {
            type: 'area',
            xKey: 'date',
            yKey: 'National Media Museum',
            yName: 'National Media Museum',
            stacked: true,
        },
        {
            type: 'area',
            xKey: 'date',
            yKey: 'National Railway Museum',
            yName: 'National Railway Museum',
            stacked: true,
        },
        {
            type: 'area',
            xKey: 'date',
            yKey: 'Locomotion',
            yName: 'Locomotion',
            stacked: true,
        },
        {
            type: 'area',
            xKey: 'date',
            yKey: 'Museum of Science and Industry, Manchester',
            yName: 'Museum of Science and Industry, Manchester',
            stacked: true,
        },
        {
            type: 'area',
            xKey: 'date',
            yKey: 'National Coal Mining Museum for England',
            yName: 'National Coal Mining Museum for England',
            stacked: true,
        },
    ],
    axes: {
        x: {
            type: 'unit-time',
            position: 'bottom',
            label: {
                format: '%b',
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
            crossLines: [
                {
                    type: 'range',
                    range: [new Date(2019, 6, 1), new Date(2019, 6, 31)],
                    label: {
                        text: 'Peak Season\nJuly-August',
                        position: 'top',
                    },
                },
            ],
        },
        y: {
            type: 'number',
            position: 'left',
            label: {
                formatter: (params) => {
                    const value = params.value as number;
                    if (value >= 1000) {
                        return `${Math.round(value / 1000)}k`;
                    }
                    return String(value);
                },
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
        },
    },
    legend: {
        item: {
            showSeriesStroke: false,
        },
    },
    tooltip: {
        position: {
            placement: ['right', 'left', 'top', 'bottom'],
        },
    },
    formatter: {
        y: (params) => {
            if (params.source === 'tooltip') {
                return `${(Number(params.value) / 1000).toFixed(1)}k`;
            }
        },
    },
};

AgCharts.create(options);
