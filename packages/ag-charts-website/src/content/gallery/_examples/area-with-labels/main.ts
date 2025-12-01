import {
    AgChartOptions,
    AgCharts,
    AreaSeriesModule,
    ContextMenuModule,
    ModuleRegistry,
    NumberAxisModule,
    UnitTimeAxisModule,
} from 'ag-charts-enterprise';

import { DataType, getData } from './data';

ModuleRegistry.registerModules([AreaSeriesModule, NumberAxisModule, UnitTimeAxisModule]);
const labelDates = [
    new Date(2008, 9, 11).valueOf(),
    new Date(2012, 9, 26).valueOf(),
    new Date(2017, 0, 8).valueOf(),
    new Date(2020, 10, 25).valueOf(),
    new Date(2023, 0, 1).valueOf(),
];

const options: AgChartOptions<DataType> = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Streaming Music Sales',
    },
    subtitle: {
        text: 'IN BILLIONS USD',
    },
    series: [
        {
            type: 'area',
            xKey: 'date',
            yKey: 'sales',
            yName: 'Sales',
            strokeWidth: 1,
            label: {
                enabled: true,
            },
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
    axes: {
        x: {
            type: 'unit-time',
            position: 'bottom',
            gridLine: {
                style: [{ strokeWidth: 1, lineDash: [2, 2] }, { strokeWidth: 0 }],
            },
        },
        y: {
            type: 'number',
            position: 'left',
            gridLine: {
                style: [{ strokeWidth: 1, lineDash: [2, 2] }, { strokeWidth: 0 }],
            },
        },
    },
    formatter: {
        y(params) {
            if (params.source === 'series-label' && !labelDates.includes(params.datum?.date.valueOf() ?? 0)) {
                return '';
            }
            return `$${Math.floor(params.value as number)}B`;
        },
    },
};

AgCharts.create(options);
