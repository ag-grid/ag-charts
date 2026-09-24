import type { AgCartesianChartOptions, AgCrossLineListeners } from 'ag-charts-community';
import {
    AgCharts,
    AreaSeriesModule,
    CrossLinesModule,
    LegendModule,
    ModuleRegistry,
    NumberAxisModule,
    UnitTimeAxisModule,
} from 'ag-charts-community';

import { DataType, getData } from './data';

ModuleRegistry.registerModules([
    AreaSeriesModule,
    CrossLinesModule,
    LegendModule,
    NumberAxisModule,
    UnitTimeAxisModule,
]);

const lockdownLabelStyle = { fontStyle: 'italic', position: 'bottom' } as const;
const variantLineStyle = { strokeWidth: 2, lineDash: [6, 4] };
const variantLabelStyle = { position: 'top' } as const;

const lockdownListeners: AgCrossLineListeners = {
    click: (event) => console.log('[lockdown click]', event),
    doubleClick: (event) => console.log('[lockdown double click]', event),
};

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
                    id: 'first-lockdown',
                    type: 'range',
                    range: [new Date(2020, 2, 23), new Date(2020, 5, 1)],
                    label: {
                        text: 'First lockdown',
                        ...lockdownLabelStyle,
                    },
                    listeners: lockdownListeners,
                },
                {
                    id: 'winter-lockdown',
                    type: 'range',
                    range: [new Date(2020, 10, 5), new Date(2021, 1, 15)],
                    label: {
                        text: 'Winter lockdown',
                        ...lockdownLabelStyle,
                    },
                    listeners: lockdownListeners,
                },
                {
                    id: 'soft-lockdown',
                    type: 'range',
                    range: [new Date(2021, 11, 20), new Date(2022, 1, 15)],
                    label: {
                        text: 'Soft lockdown',
                        ...lockdownLabelStyle,
                    },
                    listeners: lockdownListeners,
                },
                {
                    id: 'alpha-variant',
                    type: 'line',
                    value: new Date(2020, 11, 1),
                    ...variantLineStyle,
                    label: {
                        text: 'Alpha',
                        ...variantLabelStyle,
                    },
                },
                {
                    id: 'delta-variant',
                    type: 'line',
                    value: new Date(2021, 6, 1),
                    ...variantLineStyle,
                    label: {
                        text: 'Delta',
                        ...variantLabelStyle,
                    },
                },
                {
                    id: 'omicron-variant',
                    type: 'line',
                    value: new Date(2021, 10, 1),
                    ...variantLineStyle,
                    label: {
                        text: 'Omicron',
                        ...variantLabelStyle,
                    },
                },
            ],
            listeners: {
                crossLineClick: (event) => console.log('[x axis cross line click]', event),
                crossLineDoubleClick: (event) => console.log('[x axis cross line double click]', event),
            },
        },
        y: {
            type: 'number',
            position: 'left',
            title: {
                text: 'ICU beds occupied',
            },
            crossLines: [
                {
                    id: 'icu-capacity',
                    type: 'line',
                    value: 700,
                    strokeWidth: 2,
                    lineDash: [8, 4],
                    label: {
                        text: 'ICU capacity (700 beds)',
                        position: 'top-right',
                    },
                    listeners: {
                        click: (event) => console.log('[capacity click]', event),
                        doubleClick: (event) => console.log('[capacity double click]', event),
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
        },
    ],
    listeners: {
        crossLineClick: (event) => console.log('[chart cross line click]', event),
        crossLineDoubleClick: (event) => console.log('[chart cross line double click]', event),
    },
};

AgCharts.create(options);
